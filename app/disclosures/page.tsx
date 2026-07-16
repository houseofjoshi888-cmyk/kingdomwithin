import type { Metadata } from "next";
import { InformationPage } from "../InformationPage";

export const metadata: Metadata = { title: "Blockchain Risk Disclosures — Kingdom Within", description: "Important NFT, blockchain, wallet, IPFS, smart-contract, and market risks." };

export default function DisclosuresPage() {
  return <InformationPage code="R" eyebrow="BLOCKCHAIN RISK DISCLOSURES" title={<>Know the risk<br /><em>before the ritual.</em></>} intro="Blockchain permanence creates strong provenance and meaningful responsibility. Read these disclosures before connecting or minting." sections={[
    { title: "Irreversible transactions", content: <><p>Base transactions generally cannot be cancelled or reversed after confirmation. Incorrect addresses, token IDs, approvals, network selections, or transaction values may cause permanent loss.</p></> },
    { title: "Wallet and security risk", content: <><p>Phishing, malicious approvals, compromised devices, lost seed phrases, and wallet software defects can result in loss. Verify the domain and transaction details. We will never ask for your seed phrase or private key.</p></> },
    { title: "Smart-contract and network risk", content: <><p>Audits and testing cannot eliminate all defects. Contracts, Base, Ethereum, sequencers, bridges, RPC endpoints, and standards may fail, change, congest, reorganize, or become unavailable. Fees and confirmation times can vary.</p></> },
    { title: "IPFS and metadata risk", content: <><p>Content-addressing proves which bytes were referenced, but availability depends on pins, peers, and gateways. A gateway outage does not alter the content hash, yet it may temporarily prevent artwork or metadata from loading.</p></> },
    { title: "Market and liquidity risk", content: <><p>NFT prices are volatile and subjective. There may be no buyer or marketplace support. You may lose the entire amount spent. Royalties, display, metadata refresh, and collection recognition vary by marketplace.</p></> },
    { title: "Legal, regulatory, and tax risk", content: <><p>Laws, classifications, sanctions, reporting duties, and tax treatment differ by location and can change. You are responsible for determining whether participation is lawful and for obtaining professional advice relevant to your circumstances.</p></> },
    { title: "Source-content risk", content: <><p>Minting makes source text and derived metadata public. Publication may create privacy, copyright, trademark, cultural, religious, reputational, or other legal concerns. Deterministic calculation does not validate the truth, ownership, or appropriateness of submitted text.</p></> },
    { title: "Protocol meaning", content: <><p>The numerical and geometric output is a deterministic protocol artifact, not scientific proof of metaphysical claims, medical guidance, divination, or a guarantee of historical interpretation. Verify the math and decide what meaning, if any, it holds for you.</p></> },
  ]} />;
}
