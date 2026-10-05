"use client";

import { useState } from "react";

/** No backend yet: composes the letter in the visitor's own email app. */
export function ContactForm({ email, defaultSubject = "" }: { email: string; defaultSubject?: string }) {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const get = (k: string) => String(data.get(k) ?? "").trim();
    const subject = get("subject") || "A letter from the website";
    const body = `${get("message")}\n\n— ${get("name")} (${get("email")})`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="field-row">
        <Field label="Your name" name="name" autoComplete="name" required />
        <Field label="Email address" name="email" type="email" autoComplete="email" required />
      </div>
      <Field label="Subject" name="subject" defaultValue={defaultSubject} placeholder="e.g. Enquiry about a painting" />
      <div className="field">
        <label htmlFor="message">Your message</label>
        <textarea id="message" name="message" className="input" rows={6} required />
      </div>
      <button type="submit" className="btn btn-accent btn-block">
        Send letter to Han →
      </button>
      {sent && (
        <p className="form-note" role="status">
          Your email app should open with the letter ready. If nothing happened, write to{" "}
          <a href={`mailto:${email}`}>{email}</a>.
        </p>
      )}
    </form>
  );
}

function Field({ label, name, ...props }: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} className="input" {...props} />
    </div>
  );
}
