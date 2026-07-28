const { ethers, upgrades, network } = require("hardhat");

const BASE_MAINNET_CHAIN_ID = 8453n;
const MALKUTA_NFT = "0x3c626ff68e9a69526117b22d288ab71bda2b377a";
const KING_JOSHI = "0x8A668278adb0638Df48411dc9971e1ad29516483";
const OWNER = "0x69Bf308E5e30158072Cf9d2c6DE7b86F5Ae2f9B4";
const BASE_REWARD_TOKENS_PER_DAY = "240"; // 10 KINGJOSHI/hour.

async function main() {
  const { chainId } = await ethers.provider.getNetwork();
  if (chainId !== BASE_MAINNET_CHAIN_ID) {
    throw new Error(`Wrong network: expected Base mainnet (8453), received ${chainId}`);
  }

  const signer = await ethers.provider.getSigner();
  const signerAddress = await signer.getAddress();
  if (signerAddress.toLowerCase() !== OWNER.toLowerCase()) {
    throw new Error(`Wrong deployer: expected ${OWNER}, received ${signerAddress}`);
  }

  const rewardToken = await ethers.getContractAt(
    ["function decimals() external view returns (uint8)"],
    KING_JOSHI,
  );
  const rewardDecimals = await rewardToken.decimals();
  const rewardRatePerDay = ethers.parseUnits(BASE_REWARD_TOKENS_PER_DAY, rewardDecimals);

  const MalkutaStaking = await ethers.getContractFactory("MalkutaStakingUpgradeable");
  console.log("Deploying Malkuta Staking UUPS proxy on Base mainnet...");

  const staking = await upgrades.deployProxy(
    MalkutaStaking,
    [OWNER, KING_JOSHI, rewardRatePerDay],
    { initializer: "initialize", kind: "uups" },
  );
  await staking.waitForDeployment();

  const proxyAddress = await staking.getAddress();
  console.log("MalkutaStaking proxy:", proxyAddress);
  console.log("Owner:", OWNER);
  console.log("Reward token:", KING_JOSHI);
  console.log("Base reward/day:", BASE_REWARD_TOKENS_PER_DAY);

  const allowTransaction = await staking.setCollectionAllowed(MALKUTA_NFT, true);
  await allowTransaction.wait();
  console.log("Malkuta NFT collection enabled:", MALKUTA_NFT);

  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log("Implementation:", implementationAddress);
  console.log(`Network confirmed: ${network.name} (${chainId})`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
