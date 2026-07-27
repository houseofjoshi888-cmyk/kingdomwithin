import type { Metadata } from "next";
import "./staking.css";

export const metadata: Metadata = {
  title: "Malkuta Staking — Kingdom Within",
  description: "Stake Malkuta Mandalas on Base and earn KINGJOSHI through duration-based reward tiers.",
  openGraph: {
    title: "Malkuta Staking",
    description: "Hold the signal. Deepen the reward.",
    images: [{ url: "/og-staking.png", width: 1730, height: 909, alt: "Malkuta Staking — Hold the signal. Deepen the reward." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Malkuta Staking",
    description: "Hold the signal. Deepen the reward.",
    images: ["/og-staking.png"],
  },
};

export default function StakingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
