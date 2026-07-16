import type { Metadata } from "next";
import { InformationPage } from "../InformationPage";

export const metadata: Metadata = { title: "Mint and Refund Policy — Kingdom Within", description: "Mint pricing, finality, refunds, royalties, and canonical artifact policy." };

export default function MintPolicyPage() {
  return <InformationPage code="M" eyebrow="MINT AND REFUND POLICY" title={<>Review the proof.<br /><em>Then make it permanent.</em></>} intro="Canonical minting creates irreversible public records. This policy explains the price, sequence, and limits before you sign." sections={[
    { title: "Canonical mint sequence", content: <><p>The instrument normalizes and calculates the source, renders the fixed SVG, creates the manifest, hashes its exact bytes, pins the artwork and metadata to public IPFS, and submits the token ID, content hash, protocol version, and metadata URI to the Base mainnet contract.</p></> },
    { title: "Price and network fees", content: <><p>The Genesis Epoch mint price is currently 0.03 ETH. The active contract price controls and may be changed by an administrator for later transactions or epochs. Base gas is charged separately by the network. Always rely on the final wallet confirmation rather than cached website copy.</p></> },
    { title: "Review before signing", content: <><p>Confirm the source text, mapping mode, numerical signature, geometry, wallet, token ID, Base network, metadata URI, and transaction value. The interface submits the exact active epoch price; do not manually increase the value. The contract does not provide an automatic refund for excess ETH sent in a modified transaction.</p></> },
    { title: "Finality and refunds", content: <><p>Completed blockchain mints are final and cannot be cancelled, exchanged, edited, or reversed by us. To the fullest extent permitted by law, mint payments and network fees are non-refundable. This does not limit a refund or remedy that applicable law requires and cannot be waived.</p></> },
    { title: "Failed and rejected transactions", content: <><p>If a transaction fails on-chain, no NFT is created and the contract does not retain the mint price, but the network may still charge gas. Rejected wallet prompts do not create a token. Temporary IPFS or interface errors should be resolved before submitting the mint transaction.</p></> },
    { title: "Royalties and secondary markets", content: <><p>The contract reports a 7% creator royalty under ERC-2981. Royalties depend on marketplace support and are not guaranteed on every secondary transfer. Secondary prices, marketplace fees, authenticity checks, and buyer disputes are controlled by the marketplace and participants, not this interface.</p></> },
    { title: "Airdrops", content: <><p>Authorized administrators may airdrop a canonical token without charging the recipient a mint price. The transaction remains public, permanent, and subject to the same provenance, content, and risk terms.</p></> },
  ]} />;
}
