"use client";

import { startTransition, useActionState } from "react";
import { saveSettings } from "@/app/studio/actions";
import type { SiteSettings } from "@/lib/artwork-types";

export function SiteSettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, formAction, pending] = useActionState(saveSettings, undefined);
  const errors = state?.fieldErrors ?? {};
  const { contact, about, club, book } = settings;

  // Submit through a transition (not the form `action` prop) so React doesn't reset the fields on an error.
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => formAction(data));
  }

  return (
    <form className="studio-form" onSubmit={handleSubmit} noValidate>
      {state?.error && (
        <p className="notice notice-error" role="alert">
          {state.error}
        </p>
      )}

      <section className="studio-card" id="contact">
        <h2 className="studio-card-title">Site &amp; contact</h2>
        <p className="muted">Shown in the header, on the home page, the contact page and the footer.</p>
        <div className="form">
          <Field label="Tagline *" error={errors.tagline} hint="Under the logo, e.g. “Paintings & monthly letters”.">
            <input name="tagline" className="input" defaultValue={contact.tagline} maxLength={80} />
          </Field>
          <Field label="Description *" error={errors.description} hint="The line beside the home page title. Search engines show it too.">
            <textarea name="description" className="input" rows={2} defaultValue={contact.description} maxLength={300} />
          </Field>
          <div className="field-row">
            <Field label="Studio email *" error={errors.email} hint="Where “Write a letter” and “Bring it home” send people.">
              <input name="email" type="email" className="input" defaultValue={contact.email} maxLength={120} />
            </Field>
            <Field label="Instagram link *" error={errors.instagram}>
              <input name="instagram" type="url" className="input" defaultValue={contact.instagram} maxLength={200} />
            </Field>
          </div>
        </div>
      </section>

      <section className="studio-card" id="about">
        <h2 className="studio-card-title">Who I am</h2>
        <p className="muted">The About section on the home page and on /who-i-am.</p>
        <div className="form">
          <Field label="Greeting *" error={errors.aboutGreeting}>
            <input name="aboutGreeting" className="input" defaultValue={about.greeting} maxLength={80} />
          </Field>
          <Field label="Your story *" error={errors.aboutParagraphs} hint="Leave an empty line between paragraphs.">
            <textarea name="aboutParagraphs" className="input" rows={10} defaultValue={about.paragraphs.join("\n\n")} />
          </Field>
          <Field label="Sign-off" hint="The handwritten-style line at the end.">
            <input name="aboutSignoff" className="input" defaultValue={about.signoff} maxLength={200} />
          </Field>
        </div>
      </section>

      <section className="studio-card" id="letters">
        <h2 className="studio-card-title">Monthly letters</h2>
        <p className="muted">The subscription club on the home page and on /letters.</p>
        <div className="form">
          <Field label="Club name *" error={errors.clubName}>
            <input name="clubName" className="input" defaultValue={club.name} maxLength={80} />
          </Field>
          <Field label="Summary *" error={errors.clubSummary}>
            <textarea name="clubSummary" className="input" rows={3} defaultValue={club.summary} maxLength={600} />
          </Field>
          <Field label="Details" hint="One per line — shown as a ticked list.">
            <textarea name="clubDetails" className="input" rows={4} defaultValue={club.details.join("\n")} />
          </Field>
          <div className="plan-editor">
            {club.plans.map((plan) => (
              <fieldset key={plan.id} className="plan-editor-card">
                <legend className="field-label">{plan.id === "yearly" ? "Featured plan" : "Plan"}</legend>
                <div className="field-row">
                  <Field label="Name *" error={errors[`${plan.id}Label`]}>
                    <input name={`${plan.id}Label`} className="input" defaultValue={plan.label} maxLength={30} />
                  </Field>
                  <Field label="Price *" error={errors[`${plan.id}Price`]}>
                    <input name={`${plan.id}Price`} className="input" defaultValue={plan.price} maxLength={20} />
                  </Field>
                </div>
                <Field label="Billed" hint="e.g. “per month”.">
                  <input name={`${plan.id}Cadence`} className="input" defaultValue={plan.cadence} maxLength={30} />
                </Field>
                <Field label="Note">
                  <input name={`${plan.id}Note`} className="input" defaultValue={plan.note} maxLength={120} />
                </Field>
              </fieldset>
            ))}
          </div>
        </div>
      </section>

      <section className="studio-card" id="book">
        <h2 className="studio-card-title">The book</h2>
        <p className="muted">The book card on /who-i-am and /letters.</p>
        <div className="form">
          <Field label="Title *" error={errors.bookTitle}>
            <input name="bookTitle" className="input" defaultValue={book.title} maxLength={120} />
          </Field>
          <Field label="Summary">
            <textarea name="bookSummary" className="input" rows={3} defaultValue={book.summary} maxLength={600} />
          </Field>
          <Field label="Quote" hint="Shown in quotation marks — no need to type them.">
            <textarea name="bookQuote" className="input" rows={2} defaultValue={book.quote} maxLength={300} />
          </Field>
        </div>
      </section>

      <div className="studio-actions">
        <button className="btn btn-accent" disabled={pending}>
          {pending ? "Saving…" : "Save and publish"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className={`field ${error ? "has-error" : ""}`}>
      <span className="field-label">{label}</span>
      {children}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}
