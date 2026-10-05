import type { Metadata } from "next";
import { LegalDoc } from "@/components/LegalDoc";
import { privacy } from "@/data/legal";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return <LegalDoc title="Privacy Policy" effective={privacy.effective} body={privacy.body} />;
}
