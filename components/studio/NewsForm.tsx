"use client";

import { startTransition, useActionState, useState } from "react";
import type { FormState } from "@/app/studio/actions";
import type { NewsPost } from "@/lib/artwork-types";
import { SingleImagePicker, useSingleImage } from "./SingleImage";

type Props = {
  post?: NewsPost;
  /** Pre-filled date for a new post, "YYYY-MM-DD". */
  defaultDate: string;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
};

export function NewsForm({ post, defaultDate, action }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const image = useSingleImage(post?.image ?? null);
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
        <h2 className="studio-card-title">The news</h2>
        <div className="form">
          <Field label="Headline *" error={errors.title}>
            <input name="title" className="input" defaultValue={post?.title} maxLength={140} placeholder="e.g. New works at the spring exhibition" />
          </Field>
          <div className="field-row">
            <Field label="Date *" error={errors.date}>
              <input name="date" type="date" className="input" defaultValue={post?.date ?? defaultDate} required />
            </Field>
            <Field label="Summary" hint="One or two lines for the news list. Left empty, the start of the post is used.">
              <input name="summary" className="input" defaultValue={post?.summary} maxLength={280} />
            </Field>
          </div>
          <Field label="Post *" error={errors.body} hint="Leave an empty line between paragraphs.">
            <textarea name="body" className="input" rows={12} defaultValue={post?.body.join("\n\n")} />
          </Field>
          <label className="check">
            <input type="checkbox" name="published" defaultChecked={post?.published ?? true} />
            <span>Published — turn off to save it as a draft.</span>
          </label>
        </div>
      </section>

      <section className="studio-card">
        <h2 className="studio-card-title">Photo</h2>
        <p className="muted">Optional. Shown at the top of the post and in the news list.</p>
        <SingleImagePicker image={image} error={errors.image} />
      </section>

      <div className="studio-actions">
        <button className="btn btn-accent" disabled={busy}>
          {preparing ? "Preparing image…" : pending ? "Saving…" : post ? "Save changes" : "Publish news"}
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
