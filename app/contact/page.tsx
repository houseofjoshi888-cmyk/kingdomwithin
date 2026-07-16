import type { Metadata } from "next";
import { InformationPage } from "../InformationPage";

export const metadata: Metadata = { title: "Contact — Kingdom Within", description: "Contact The House of Joshi and join the Kingdom Within community." };

const channels = [
  { label: "EMAIL", name: "support@thehouseofjoshi.com", detail: "SUPPORT · PRIVACY · LEGAL", href: "mailto:support@thehouseofjoshi.com" },
  { label: "X", name: "@thehouseofjoshi", detail: "NEWS · PROTOCOL UPDATES", href: "https://x.com/thehouseofjoshi" },
  { label: "DISCORD", name: "Join the community", detail: "COMMUNITY · CONVERSATION", href: "https://discord.com/invite/uH9zVeAwDu" },
  { label: "INSTAGRAM", name: "@thehouseofjoshi", detail: "ARTIFACTS · VISUAL ARCHIVE", href: "https://www.instagram.com/thehouseofjoshi" },
] as const;

export default function ContactPage() {
  return <InformationPage code="C" eyebrow="CONTACT THE HOUSE" title={<>Enter the circle.<br /><em>Join the record.</em></>} intro="For technical support, privacy requests, legal notices, and community conversation, use the official House of Joshi channels below.">
    <div className="contact-grid">{channels.map((channel) => <a key={channel.label} href={channel.href} target={channel.href.startsWith("http") ? "_blank" : undefined} rel={channel.href.startsWith("http") ? "noreferrer" : undefined}><span>{channel.label}</span><strong>{channel.name}</strong><small>{channel.detail}</small><i>↗</i></a>)}</div>
    <div className="contact-note"><span>OFFICIAL COMMUNICATION</span><p>The House of Joshi will never request a seed phrase, private key, wallet recovery phrase, or payment through direct messages. Confirm links through this page before responding.</p></div>
  </InformationPage>;
}
