import type { Metadata } from "next";
import { LegalDoc } from "@/components/LegalDoc";
import { terms } from "@/data/legal";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return <LegalDoc title="Terms of Service" effective={terms.effective} body={terms.body} />;
}
