"use client";

import { startTransition, useActionState, useState } from "react";
import type { FormState } from "@/app/studio/actions";
import type { Letter } from "@/lib/artwork-types";
import { SingleImagePicker, useSingleImage } from "./SingleImage";

type Props = {
  letter?: Letter;
  /** Pre-filled month for a new letter, "YYYY-MM". */
  defaultMonth: string;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
};

export function LetterForm({ letter, defaultMonth, action }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const image = useSingleImage(letter?.image ?? null);
  const [preparing, setPreparing] = useState(false);
  const errors = state?.fieldErrors ?? {};
  const busy = pending || preparing;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setPreparing(Boolean(image.file));
    await image.addTo(data);
    setPreparing(false);
    startTransition(() => formAction(data));
  }

  return (
    <form className="studio-form" onSubmit={handleSubmit} noValidate>
      {state?.error && (
        <p className="notice notice-error" role="alert">
          {state.error}
        </p>
      )}

      <section className="studio-card">
        <h2 className="studio-card-title">The letter</h2>
        <div className="form">
          <div className="field-row">
            <Field label="Month *" error={errors.month}>
              <input name="month" type="month" className="input" defaultValue={letter?.month ?? defaultMonth} required />
            </Field>
            <Field label="Message of the month *" error={errors.title}>
              <input name="title" className="input" defaultValue={letter?.title} maxLength={120} placeholder="e.g. Slow is also a direction" />
            </Field>
          </div>
          <Field label="Letter *" error={errors.message} hint="The words visitors read on /letters. Leave an empty line between paragraphs.">
            <textarea name="message" className="input" rows={10} defaultValue={letter?.message.join("\n\n")} />
          </Field>
          <label className="check">
            <input type="checkbox" name="visible" defaultChecked={letter?.visible ?? true} />
            <span>Show on the website — turn off to keep it just for subscribers.</span>
          </label>
        </div>
      </section>

      <section className="studio-card">
        <h2 className="studio-card-title">Painting of the month</h2>
        <p className="muted">Optional. The print tucked inside the envelope.</p>
        <SingleImagePicker image={image} error={errors.image} />
      </section>

      <div className="studio-actions">
        <button className="btn btn-accent" disabled={busy}>
          {preparing ? "Preparing image…" : pending ? "Saving…" : letter ? "Save changes" : "Publish letter"}
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
