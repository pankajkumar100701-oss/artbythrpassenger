import type { Metadata } from "next";
import { AboutSection, BookCard, ContactBand } from "@/components/Sections";
import { getSettings } from "@/lib/artworks";

export const metadata: Metadata = {
  title: "Who I Am",
  description: "Bao Han — an artist living in the Himalayas, painting slowly and writing letters by hand.",
};

export default async function WhoIAmPage() {
  const { about, book } = await getSettings();
  return (
    <>
      <AboutSection about={about} headingLevel="h1" />
      <section className="section band">
        <div className="container" style={{ maxWidth: 820 }}>
          <BookCard book={book} />
        </div>
      </section>
      <ContactBand />
    </>
  );
}
