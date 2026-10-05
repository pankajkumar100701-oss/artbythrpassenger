import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { instagramHandle } from "@/data/site";
import { getSettings } from "@/lib/artworks";

export const metadata: Metadata = {
  title: "Contact",
  description: "Write to Bao Han about a painting, the book, or the monthly letters.",
};

export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const [{ subject }, { contact }] = await Promise.all([searchParams, getSettings()]);

  return (
    <section className="section-tight" style={{ paddingTop: 72 }}>
      <div className="container contact-grid">
        <div>
          <p className="eyebrow">Contact</p>
          <h1 className="display h1" style={{ margin: "12px 0 20px" }}>
            Write to <em>the studio.</em>
          </h1>
          <p className="lead">
            Whether it&apos;s about an original painting, the book, or the monthly letters — Han reads and replies to every
            letter personally.
          </p>
          <ul className="contact-list">
            <li>
              <span className="muted">Email · </span>
              <a href={`mailto:${contact.email}`} className="text-link">
                {contact.email}
              </a>
            </li>
            <li>
              <span className="muted">Instagram · </span>
              <a href={contact.instagram} target="_blank" rel="noopener noreferrer" className="text-link">
                {instagramHandle(contact.instagram)}
              </a>
            </li>
          </ul>
        </div>
        <div className="form-card">
          <ContactForm email={contact.email} defaultSubject={typeof subject === "string" ? subject : ""} />
        </div>
      </div>
    </section>
  );
}
