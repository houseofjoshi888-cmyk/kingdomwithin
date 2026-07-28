// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from
    "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/// @title Malkuta NFT Staking
/// @notice Custodial NFT staking with duration-based reward tiers.
/// @dev Designed for OpenZeppelin Contracts 5.x and a UUPS proxy.
contract MalkutaStakingUpgradeable is
    Initializable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable,
    IERC721Receiver
{
    using SafeERC20 for IERC20;

    uint256 public constant BASE_MULTIPLIER = 100;
    uint256 public constant THIRTY_DAY_MULTIPLIER = 200;
    uint256 public constant NINETY_DAY_MULTIPLIER = 250;
    uint256 public constant MAX_MULTIPLIER = 300;
    uint256 public constant THIRTY_DAYS = 30 days;
    uint256 public constant NINETY_DAYS = 90 days;
    uint256 public constant ONE_HUNDRED_EIGHTY_DAYS = 180 days;

    struct Stake {
        address owner;
        uint64 stakedAt;
        uint64 lastClaimAt;
        // A rate snapshot prevents later admin changes from applying retroactively.
        uint256 rewardRatePerDay;
        // Cumulative accounting prevents rounding losses from depending on claim frequency.
        uint256 rewardsClaimed;
    }

    // NFT collection => token ID => stake information.
    mapping(address => mapping(uint256 => Stake)) public vault;
    mapping(address => bool) public allowedCollections;
    mapping(address => uint256) public collectionStakeCount;

    // Rewards preserved when an NFT is unstaked before the reward pool is funded.
    mapping(address => uint256) public unpaidRewards;

    IERC20 public rewardToken;
    uint256 public rewardRatePerDay;
    uint256 public totalStaked;
    uint256 public totalUnpaidRewards;

    event CollectionAllowed(address indexed collection, bool allowed);
    event RewardRateUpdated(uint256 oldRatePerDay, uint256 newRatePerDay);
    event Staked(
        address indexed user,
        address indexed nftContract,
        uint256 indexed tokenId,
        uint256 timestamp,
        uint256 rewardRatePerDay
    );
    event Unstaked(
        address indexed user,
        address indexed nftContract,
        uint256 indexed tokenId,
        uint256 timestamp,
        uint256 rewardMovedToUnpaid
    );
    event RewardClaimed(
        address indexed user,
        address indexed nftContract,
        uint256 indexed tokenId,
        uint256 rewardAmount
    );
    event UnpaidRewardClaimed(address indexed user, uint256 rewardAmount);
    event ForeignERC20Recovered(address indexed token, address indexed recipient, uint256 amount);
    event UntrackedNFTRecovered(address indexed collection, address indexed recipient, uint256 indexed tokenId);
    event ETHRecovered(address indexed recipient, uint256 amount);
    event RewardSurplusWithdrawn(address indexed recipient, uint256 amount);

    error AddressZero();
    error NotAContract(address account);
    error CollectionNotAllowed(address collection);
    error AlreadyStaked(address collection, uint256 tokenId);
    error NotTokenOwner();
    error NotStaker();
    error NoRewards();
    error InsufficientRewardPool(uint256 available, uint256 required);
    error ActiveStake(address collection, uint256 tokenId);
    error RewardTokenRecoveryForbidden();
    error UnexpectedNFTTransfer();
    error StakesStillActive(uint256 activeStakes);
    error ReservedRewards(uint256 remainingBalance, uint256 reservedBalance);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner, address rewardToken_, uint256 initialRewardRatePerDay)
        external
        initializer
    {
        if (initialOwner == address(0) || rewardToken_ == address(0)) revert AddressZero();
        if (rewardToken_.code.length == 0) revert NotAContract(rewardToken_);

        __Ownable_init(initialOwner);
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        rewardToken = IERC20(rewardToken_);
        rewardRatePerDay = initialRewardRatePerDay;
    }

    function stake(address nftContract, uint256 tokenId) external nonReentrant whenNotPaused {
        if (!allowedCollections[nftContract]) revert CollectionNotAllowed(nftContract);
        if (vault[nftContract][tokenId].owner != address(0)) {
            revert AlreadyStaked(nftContract, tokenId);
        }

        IERC721 nft = IERC721(nftContract);
        if (nft.ownerOf(tokenId) != msg.sender) revert NotTokenOwner();

        uint64 timestamp = uint64(block.timestamp);
        vault[nftContract][tokenId] = Stake({
            owner: msg.sender,
            stakedAt: timestamp,
            lastClaimAt: timestamp,
            rewardRatePerDay: rewardRatePerDay,
            rewardsClaimed: 0
        });
        totalStaked += 1;
        collectionStakeCount[nftContract] += 1;

        // State is recorded first so onERC721Received can reject unsolicited NFTs.
        nft.safeTransferFrom(msg.sender, address(this), tokenId);

        emit Staked(msg.sender, nftContract, tokenId, block.timestamp, rewardRatePerDay);
    }

    /// @notice Returns rewards accrued since the most recent successful claim.
    function calculateRewards(address nftContract, uint256 tokenId) public view returns (uint256) {
        Stake memory userStake = vault[nftContract][tokenId];
        if (userStake.owner == address(0)) return 0;

        uint256 totalDuration = block.timestamp - uint256(userStake.stakedAt);
        uint256 cumulativeReward = Math.mulDiv(
            userStake.rewardRatePerDay,
            _weightedDuration(totalDuration),
            BASE_MULTIPLIER * 1 days
        );
        return cumulativeReward - userStake.rewardsClaimed;
    }

    function claimRewards(address nftContract, uint256 tokenId) external nonReentrant {
        Stake storage userStake = vault[nftContract][tokenId];
        if (userStake.owner != msg.sender) revert NotStaker();

        uint256 reward = calculateRewards(nftContract, tokenId);
        if (reward == 0) revert NoRewards();

        uint256 available = rewardToken.balanceOf(address(this));
        if (available < reward) revert InsufficientRewardPool(available, reward);

        // Effects before interaction; SafeERC20 reverts the entire update on failure.
        userStake.lastClaimAt = uint64(block.timestamp);
        userStake.rewardsClaimed += reward;
        rewardToken.safeTransfer(msg.sender, reward);

        emit RewardClaimed(msg.sender, nftContract, tokenId, reward);
    }

    /// @notice Releases an NFT even when the reward pool is temporarily underfunded.
    /// @dev Final rewards become user debt and can be collected with claimUnpaidRewards.
    function unstake(address nftContract, uint256 tokenId) external nonReentrant {
        Stake memory userStake = vault[nftContract][tokenId];
        if (userStake.owner != msg.sender) revert NotStaker();

        uint256 reward = calculateRewards(nftContract, tokenId);
        if (reward != 0) {
            unpaidRewards[msg.sender] += reward;
            totalUnpaidRewards += reward;
        }

        delete vault[nftContract][tokenId];
        totalStaked -= 1;
        collectionStakeCount[nftContract] -= 1;

        IERC721(nftContract).safeTransferFrom(address(this), msg.sender, tokenId);

        emit Unstaked(msg.sender, nftContract, tokenId, block.timestamp, reward);
    }

    function claimUnpaidRewards() external nonReentrant {
        uint256 reward = unpaidRewards[msg.sender];
        if (reward == 0) revert NoRewards();

        uint256 available = rewardToken.balanceOf(address(this));
        if (available < reward) revert InsufficientRewardPool(available, reward);

        unpaidRewards[msg.sender] = 0;
        totalUnpaidRewards -= reward;
        rewardToken.safeTransfer(msg.sender, reward);

        emit UnpaidRewardClaimed(msg.sender, reward);
    }

    /// @notice Current tier only; reward calculations integrate every tier separately.
    function getMultiplier(address nftContract, uint256 tokenId) external view returns (uint256) {
        Stake memory userStake = vault[nftContract][tokenId];
        if (userStake.owner == address(0)) return 0;

        uint256 duration = block.timestamp - uint256(userStake.stakedAt);
        if (duration >= ONE_HUNDRED_EIGHTY_DAYS) return MAX_MULTIPLIER;
        if (duration >= NINETY_DAYS) return NINETY_DAY_MULTIPLIER;
        if (duration >= THIRTY_DAYS) return THIRTY_DAY_MULTIPLIER;
        return BASE_MULTIPLIER;
    }

    /// @dev Integrates 1x for days 0-30, 2x for 30-90, 2.5x for 90-180, then 3x.
    function _weightedDuration(uint256 duration) internal pure returns (uint256 weightedSeconds) {
        uint256 segment = Math.min(duration, THIRTY_DAYS);
        weightedSeconds = segment * 100;

        if (duration > THIRTY_DAYS) {
            segment = Math.min(duration, NINETY_DAYS) - THIRTY_DAYS;
            weightedSeconds += segment * THIRTY_DAY_MULTIPLIER;
        }
        if (duration > NINETY_DAYS) {
            segment = Math.min(duration, ONE_HUNDRED_EIGHTY_DAYS) - NINETY_DAYS;
            weightedSeconds += segment * NINETY_DAY_MULTIPLIER;
        }
        if (duration > ONE_HUNDRED_EIGHTY_DAYS) {
            // Rewards continue accruing indefinitely, capped at the 3x multiplier.
            weightedSeconds += (duration - ONE_HUNDRED_EIGHTY_DAYS) * MAX_MULTIPLIER;
        }
    }

    function setCollectionAllowed(address collection, bool allowed) external onlyOwner {
        if (collection == address(0)) revert AddressZero();
        if (allowed && collection.code.length == 0) revert NotAContract(collection);
        allowedCollections[collection] = allowed;
        emit CollectionAllowed(collection, allowed);
    }

    /// @notice Changes the rate only for NFTs staked after this transaction.
    function setRewardRatePerDay(uint256 newRatePerDay) external onlyOwner {
        uint256 oldRate = rewardRatePerDay;
        rewardRatePerDay = newRatePerDay;
        emit RewardRateUpdated(oldRate, newRatePerDay);
    }

    function pauseNewStakes() external onlyOwner {
        _pause();
    }

    function resumeNewStakes() external onlyOwner {
        _unpause();
    }

    /// @notice Recovers tokens accidentally sent here, except the configured reward token.
    function recoverForeignERC20(address token, address recipient, uint256 amount)
        external
        onlyOwner
        nonReentrant
    {
        if (token == address(0) || recipient == address(0)) revert AddressZero();
        if (token == address(rewardToken)) revert RewardTokenRecoveryForbidden();

        IERC20(token).safeTransfer(recipient, amount);
        emit ForeignERC20Recovered(token, recipient, amount);
    }

    /// @notice Withdraws reward tokens only when no NFT is actively accruing rewards.
    /// @dev Tokens already owed to unstaked users always remain reserved in the contract.
    function withdrawRewardSurplus(address recipient, uint256 amount)
        external
        onlyOwner
        nonReentrant
    {
        if (recipient == address(0)) revert AddressZero();
        if (totalStaked != 0) revert StakesStillActive(totalStaked);

        uint256 balance = rewardToken.balanceOf(address(this));
        if (amount > balance) revert InsufficientRewardPool(balance, amount);

        uint256 remainingBalance = balance - amount;
        if (remainingBalance < totalUnpaidRewards) {
            revert ReservedRewards(remainingBalance, totalUnpaidRewards);
        }

        rewardToken.safeTransfer(recipient, amount);
        emit RewardSurplusWithdrawn(recipient, amount);
    }

    /// @notice Recovers only NFTs that are not represented by an active stake.
    function recoverUntrackedNFT(address collection, address recipient, uint256 tokenId)
        external
        onlyOwner
        nonReentrant
    {
        if (recipient == address(0)) revert AddressZero();
        if (vault[collection][tokenId].owner != address(0)) revert ActiveStake(collection, tokenId);

        IERC721(collection).safeTransferFrom(address(this), recipient, tokenId);
        emit UntrackedNFTRecovered(collection, recipient, tokenId);
    }

    function recoverETH(address payable recipient, uint256 amount) external onlyOwner nonReentrant {
        if (recipient == address(0)) revert AddressZero();
        (bool success,) = recipient.call{value: amount}("");
        require(success, "ETH transfer failed");
        emit ETHRecovered(recipient, amount);
    }

    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata)
        external
        view
        override
        returns (bytes4)
    {
        Stake memory userStake = vault[msg.sender][tokenId];
        if (
            !allowedCollections[msg.sender] || operator != address(this) || from == address(0)
                || userStake.owner != from
        ) {
            revert UnexpectedNFTTransfer();
        }
        return IERC721Receiver.onERC721Received.selector;
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    receive() external payable {}

    // Reserved for future state variables without shifting the existing storage layout.
    uint256[40] private __gap;
}
