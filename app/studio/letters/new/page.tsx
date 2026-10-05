import Link from "next/link";
import { LetterForm } from "@/components/studio/LetterForm";
import { requireAdmin } from "@/lib/auth";
import { saveLetter } from "../../actions";

export default async function NewLetterPage() {
  await requireAdmin();
  const defaultMonth = new Date().toISOString().slice(0, 7);
  return (
    <div className="container studio-page" style={{ maxWidth: 860 }}>
      <Link href="/studio/letters" className="back-link">
        ← All letters
      </Link>
      <h1 className="display h2" style={{ marginBottom: 32 }}>
        New letter
      </h1>
      <LetterForm defaultMonth={defaultMonth} action={saveLetter.bind(null, null)} />
    </div>
  );
}
