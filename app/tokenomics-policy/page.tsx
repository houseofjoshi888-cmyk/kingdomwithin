import Link from "next/link";
import { InformationPage } from "../InformationPage";

export const metadata = {
  title: "Protocol Operations & Tokenomics Policy | Kingdom Within",
  description:
    "The governance framework for Malkuta NFT staking emissions, rate snapshots, reward-pool funding, and surplus management.",
};

export default function TokenomicsPolicyPage() {
  return (
    <InformationPage
      code="P-01"
      eyebrow="PROTOCOL OPERATIONS & TOKENOMICS"
      title={<>Staking economics,<br /><em>governed in public.</em></>}
      intro="This policy defines when and why Malkuta staking emissions may change, how active stakers are protected, and how the KING JOSHI reward reserve is managed. It separates community-facing rules from the technical actions used to carry them out."
      lastUpdated="29 JULY 2026"
      sections={[
        {
          title: "Policy purpose and scope",
          content: (
            <>
              <p>This policy governs the Malkuta NFT staking program on Base and applies to changes in the base reward rate, treasury funding cadence, reward surplus management, and related public communications.</p>
              <p>Its purpose is to support sustainable participation without allowing short-term market movements or unilateral convenience to override commitments already made to active stakers.</p>
            </>
          ),
        },
        {
          title: "Baseline emission model",
          content: (
            <>
              <p>The initial base emission is 240 KING JOSHI per NFT per day, equivalent to 10 tokens per hour. Duration multipliers are 1× through day 30, 2× from day 31 through day 90, 2.5× from day 91 through day 180, and 3× after day 180.</p>
              <p>The 3× multiplier is the permanent maximum tier. Rewards may continue accruing after day 180, but the multiplier does not increase beyond that cap.</p>
            </>
          ),
        },
        {
          title: "Authority to adjust future emission rates",
          content: (
            <>
              <p>The contract owner may use <code>setRewardRatePerDay</code> to adjust the base emission rate for newly created stakes. A change may be considered when exceptional market volatility, material token-price discovery, treasury runway, participation growth, or broader ecosystem stability makes the existing rate economically unsustainable.</p>
              <p>Rate authority is a safety mechanism, not a promise to track or defend a market price. Adjustments should be proportionate, documented, and made in the long-term interest of the protocol.</p>
            </>
          ),
        },
        {
          title: "Active-staker rate protection",
          content: (
            <>
              <p>Every stake records the applicable base reward rate when the NFT enters the vault. Later administrative changes apply only to NFTs staked after the change.</p>
              <p>An active stake keeps its recorded rate until that NFT is unstaked. If the same NFT is staked again later, the newly prevailing rate applies. Duration tiers continue to operate against the stake’s recorded base rate.</p>
            </>
          ),
        },
        {
          title: "Reward reserve and funding policy",
          content: (
            <>
              <p>KING JOSHI rewards are held by the staking proxy as a separate reward reserve. Treasury operators may vary the timing and size of reserve funding according to expected liabilities, participation, market conditions, and treasury runway.</p>
              <p>Funding cadence does not alter a stake’s recorded emission rate. The reserve should be monitored against accrued obligations and projected tier growth, particularly as stakes approach the 2.5× and 3× tiers.</p>
            </>
          ),
        },
        {
          title: "Liquidity shortfalls and unpaid rewards",
          content: (
            <>
              <p>A reward-pool shortfall must never prevent a participant from recovering a staked Malkuta NFT. On unstaking, any reward amount the pool cannot pay is recorded as unpaid reward debt for that wallet.</p>
              <p>Recorded debt remains claimable when the reserve is replenished. Treasury operators should prioritize disclosed reward liabilities before treating reserve tokens as surplus.</p>
            </>
          ),
        },
        {
          title: "Surplus management",
          content: (
            <>
              <p>The owner may withdraw only reward tokens that the contract identifies as surplus above protected unpaid-reward liabilities. Surplus withdrawals must not erase recorded participant debt.</p>
              <p>Before withdrawing surplus, operators should review the current reserve, unpaid rewards, active stake count, tier distribution, anticipated claims, and planned funding schedule. Technical permission to withdraw does not replace this fiduciary operating standard.</p>
            </>
          ),
        },
        {
          title: "Transparency and change record",
          content: (
            <>
              <p>Before or promptly after a material rate adjustment, the team should publish the effective on-chain rate, transaction reference, reason for the change, effective time, and confirmation that existing stake snapshots remain unchanged.</p>
              <p>Material policy changes should be versioned and dated. On-chain events remain the authoritative execution record; this page explains the governance intent behind those actions.</p>
            </>
          ),
        },
        {
          title: "Technical execution procedure",
          content: (
            <>
              <p>Once a policy decision is authorized, the contract owner connects the designated owner wallet on Base, opens the staking controls, enters the new daily rate, reviews the token-unit conversion, and submits <code>setRewardRatePerDay</code> through the deployed UUPS proxy.</p>
              <p>The operator must verify the proxy address, owner account, Base chain, resulting <code>rewardRatePerDay</code> value, and emitted rate-update transaction before announcing completion. The implementation contract must never be used as the operational staking address.</p>
              <p><Link href="/admin">OPEN ADMIN CONTROLS ↗</Link> &nbsp; <Link href="/staking">VIEW STAKING DASHBOARD ↗</Link></p>
            </>
          ),
        },
      ]}
    />
  );
}
