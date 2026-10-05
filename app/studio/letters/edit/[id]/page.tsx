import Link from "next/link";
import { notFound } from "next/navigation";
import { LetterForm } from "@/components/studio/LetterForm";
import { formatMonth } from "@/lib/artwork-types";
import { getLetters } from "@/lib/artworks";
import { requireAdmin } from "@/lib/auth";
import { saveLetter } from "../../../actions";

export default async function EditLetterPage({ params }: PageProps<"/studio/letters/edit/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const letter = (await getLetters()).find((l) => l.id === id);
  if (!letter) notFound();

  return (
    <div className="container studio-page" style={{ maxWidth: 860 }}>
      <Link href="/studio/letters" className="back-link">
        ← All letters
      </Link>
      <p className="eyebrow">{formatMonth(letter.month)}</p>
      <h1 className="display h2" style={{ marginBottom: 32 }}>
        {letter.title}
      </h1>
      <LetterForm key={letter.id} letter={letter} defaultMonth={letter.month} action={saveLetter.bind(null, letter.id)} />
    </div>
  );
}
