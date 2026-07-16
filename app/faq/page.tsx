import type { Metadata } from "next";
import { InformationPage } from "../InformationPage";

export const metadata: Metadata = { title: "FAQ — Kingdom Within", description: "Answers about the Malkuta Protocol, canonical minting, IPFS, Base, royalties, and verification." };

const questions = [
  ["What is Kingdom Within?", "A precision instrument that converts mapped text into an auditable numerical signature and deterministic geometric mandala. It is also a Base mainnet NFT minting interface for canonical artifacts produced by that protocol."],
  ["Is the mandala random?", "No. The mapped sum determines symmetry, rotation, golden-ratio scale, and hue. Identical normalized text, mapping mode, custom map where applicable, and protocol version produce identical canonical parameters."],
  ["Which mapping modes are available?", "Ancient Hebrew/Aramaic uses the fixed 1–400 MASTER_MAP. Root-60 maps normalized ASCII alphanumeric characters through a sexagesimal matrix. Custom mappings may be inspected and exported, but only protocol-approved modes are eligible for canonical minting."],
  ["What is stored when I mint?", "The canonical SVG and metadata manifest are pinned to public IPFS. The token records the metadata URI, its content hash, protocol version, epoch, and timestamp on Base. Wallet addresses and transactions are public blockchain data."],
  ["What does minting cost?", "The current Genesis Epoch price is 0.03 ETH, plus Base network gas. The contract administrator can set the price for a current or future epoch. Your wallet always shows the transaction value before approval."],
  ["How many NFTs can exist?", "The protocol has no fixed maximum supply. It is organized into named epochs, creating a growing archive instead of a capped edition."],
  ["Are there creator royalties?", "Yes. The contract reports a 7% ERC-2981 royalty for secondary sales. A marketplace must support and honor ERC-2981 for that royalty to be paid; on-chain royalty signaling does not force every marketplace to collect it."],
  ["Can a mint be refunded or reversed?", "Blockchain transactions are normally final. Review the text, geometry, price, network, and wallet address before signing. The Mint Policy explains the limited circumstances governed by mandatory law."],
  ["Why do I sign a message before minting?", "The signature authorizes the server to pin the artifact for your wallet. It is not the mint transaction, does not transfer funds, expires quickly, and prevents anonymous abuse of the upload service."],
  ["How do I verify an NFT?", "Open Verify, enter the token ID, and compare its immutable provenance with the IPFS manifest. The collection includes only manifests whose bytes match the on-chain content hash."],
  ["Why is my NFT not visible in the collection yet?", "Indexing and public IPFS gateways can take time. Confirm the transaction succeeded on Base and that the metadata URI resolves. The gallery refreshes from verified mint events."],
  ["Is a Malkuta NFT an investment?", "No promise of value, liquidity, appreciation, income, or utility is made. Acquire only for the artifact, provenance, and protocol participation, and only if you can bear a total loss of the purchase price."],
] as const;

export default function FaqPage() {
  return <InformationPage code="?" eyebrow="FREQUENTLY ASKED QUESTIONS" title={<>The instrument,<br /><em>clearly explained.</em></>} intro="Direct answers about the protocol, the mint, and the permanent record.">
    <div className="faq-list">{questions.map(([question, answer], index) => <details key={question}><summary><span>{String(index + 1).padStart(2, "0")}</span>{question}<i>+</i></summary><p>{answer}</p></details>)}</div>
  </InformationPage>;
}
