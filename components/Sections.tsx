import Image from "next/image";
import Link from "next/link";
import { contactHref, portrait } from "@/data/site";
import type { SiteSettings } from "@/lib/artwork-types";
import { TiltCard } from "./TiltCard";

/** "Who I Am" — used on the home page and on /who-i-am. */
export function AboutSection({ about, headingLevel = "h2" }: { about: SiteSettings["about"]; headingLevel?: "h1" | "h2" }) {
  const Heading = headingLevel;
  return (
    <section className="section" id="who-i-am">
      <div className="container about-grid">
        <TiltCard className="portrait-card" max={6}>
          <Image
            src={portrait.src}
            alt="Portrait of Bao Han"
            width={portrait.width}
            height={portrait.height}
            sizes="(max-width: 1000px) 90vw, 440px"
          />
          <p className="portrait-caption">Bao Han, in the studio</p>
        </TiltCard>

        <div>
          <p className="eyebrow">Who I am</p>
          <Heading className="display h2" style={{ margin: "10px 0 28px" }}>
            {about.greeting}
          </Heading>
          <div className="prose">
            {about.paragraphs.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
          <p className="signature" style={{ marginTop: 24 }}>
            {about.signoff}
          </p>
        </div>
      </div>
    </section>
  );
}

/** Subscription plans as tilt cards — used on home and /letters. */
export function ClubPlans({ club }: { club: SiteSettings["club"] }) {
  return (
    <div className="plans">
      {club.plans.map((plan, i) => (
        <TiltCard key={plan.id} className={`plan ${i === 1 ? "plan-featured" : ""}`} max={7}>
          <p className="eyebrow">{plan.label}</p>
          <p className="plan-price">
            {plan.price}
            <small>{plan.cadence}</small>
          </p>
          <p className="muted">{plan.note}</p>
          <Link href={contactHref(`Join ${club.name} — ${plan.label}`)} className={`btn ${i === 1 ? "btn-accent" : "btn-ghost"}`}>
            Join {plan.label.toLowerCase()}
          </Link>
        </TiltCard>
      ))}
    </div>
  );
}

export function ClubSection({ club }: { club: SiteSettings["club"] }) {
  return (
    <section className="section band">
      <div className="container club-grid">
        <div>
          <p className="eyebrow">Monthly letters</p>
          <h2 className="display h2" style={{ margin: "10px 0 20px" }}>
            {club.name}
          </h2>
          <p className="lead">{club.summary}</p>
          <ul className="ticks">
            {club.details.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
        <ClubPlans club={club} />
      </div>
    </section>
  );
}

export function BookCard({ book }: { book: SiteSettings["book"] }) {
  return (
    <TiltCard className="book-card" max={5}>
      <p className="eyebrow">The book</p>
      <h2 className="display h3" style={{ margin: "10px 0 16px" }}>
        {book.title}
      </h2>
      <p className="muted">{book.summary}</p>
      <blockquote className="quote" style={{ margin: "24px 0" }}>
        “{book.quote}”
      </blockquote>
      <Link href={contactHref(`Enquiry: ${book.title}`)} className="btn btn-ghost">
        Ask about the book
      </Link>
    </TiltCard>
  );
}

export function ContactBand() {
  return (
    <section className="section">
      <div className="container" style={{ textAlign: "center" }}>
        <p className="eyebrow">Write to the studio</p>
        <h2 className="display h2" style={{ margin: "10px auto 16px", maxWidth: "16ch" }}>
          A painting caught your eye?
        </h2>
        <p className="lead" style={{ margin: "0 auto 28px" }}>
          Every piece is sold personally, by email. Ask about a work, a commission, or the monthly letters.
        </p>
        <div className="btn-row" style={{ justifyContent: "center" }}>
          <Link href="/contact" className="btn btn-ink">
            Write a letter
          </Link>
          <Link href="/gallery" className="btn btn-ghost">
            Browse the gallery
          </Link>
        </div>
      </div>
    </section>
  );
}
