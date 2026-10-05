"use client";

import { useActionState, useState } from "react";
import { updatePassword } from "@/app/studio/actions";

export function PasswordForm({ minLength }: { minLength: number }) {
  const [state, action, pending] = useActionState(updatePassword, undefined);
  const [show, setShow] = useState(false);
  const [next, setNext] = useState("");
  const errors = state?.fieldErrors ?? {};
  const type = show ? "text" : "password";

  return (
    <form action={action} className="form">
      {state?.error && (
        <p className="notice notice-error" role="alert">
          {state.error}
        </p>
      )}
      <Field label="Current password" error={errors.current}>
        <input name="current" type={type} className="input" autoComplete="current-password" required />
      </Field>
      <div className="field-row">
        <Field label="New password" error={errors.next} hint={`At least ${minLength} characters. ${strength(next)}`}>
          <input
            name="next"
            type={type}
            className="input"
            autoComplete="new-password"
            minLength={minLength}
            maxLength={200}
            required
            onChange={(e) => setNext(e.target.value)}
          />
        </Field>
        <Field label="New password, again" error={errors.confirm}>
          <input name="confirm" type={type} className="input" autoComplete="new-password" maxLength={200} required />
        </Field>
      </div>
      <label className="check">
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
        <span>Show passwords</span>
      </label>
      <div>
        <button className="btn btn-accent" disabled={pending}>
          {pending ? "Changing…" : "Change password"}
        </button>
      </div>
    </form>
  );
}

/** A rough guide, not a rule — length matters most. */
function strength(pw: string) {
  if (!pw) return "A short sentence is easy to remember and hard to guess.";
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  if (pw.length >= 16 && kinds >= 2) return "Strong.";
  if (pw.length >= 12 && kinds >= 3) return "Good.";
  return "Weak — make it longer.";
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
