"use client";

import { useActionState, useState } from "react";
import { login, loginWithCode, requestLoginCode } from "@/app/studio/actions";

/** Password login, with an emailed one-time code as the way back in when the password is forgotten or locked out. */
export function LoginForm({ codeEmail }: { codeEmail: string | null }) {
  const [mode, setMode] = useState<"password" | "code">("password");
  return mode === "password" ? (
    <PasswordLogin onUseCode={codeEmail ? () => setMode("code") : undefined} />
  ) : (
    <CodeLogin email={codeEmail!} onUsePassword={() => setMode("password")} />
  );
}

function PasswordLogin({ onUseCode }: { onUseCode?: () => void }) {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="form form-card">
      <div className="field">
        <label htmlFor="password">Studio password</label>
        <input id="password" name="password" type="password" className="input" autoComplete="current-password" required autoFocus />
      </div>
      {state?.error && (
        <p className="field-error" role="alert">
          {state.error}
        </p>
      )}
      <button className="btn btn-ink btn-block" disabled={pending}>
        {pending ? "Checking…" : "Open the studio"}
      </button>
      {onUseCode && (
        <button type="button" className="text-link login-switch" onClick={onUseCode}>
          Forgot the password, or locked out? Email me a code
        </button>
      )}
    </form>
  );
}

function CodeLogin({ email, onUsePassword }: { email: string; onUsePassword: () => void }) {
  const [sendState, send, sending] = useActionState(requestLoginCode, undefined);
  const [state, action, pending] = useActionState(loginWithCode, undefined);
  const sent = sendState?.sent;

  return (
    <div className="form form-card">
      {!sent ? (
        <>
          <p className="muted">
            We&apos;ll email a 6-digit code to <strong>{email}</strong>. It works once, for 10 minutes.
          </p>
          <form action={send}>
            <button className="btn btn-ink btn-block" disabled={sending}>
              {sending ? "Sending…" : "Email me a code"}
            </button>
          </form>
        </>
      ) : (
        <form action={action} className="form">
          <p className="muted">
            Code sent to <strong>{email}</strong>. Check spam if it isn&apos;t there in a minute.
          </p>
          <div className="field">
            <label htmlFor="code">6-digit code</label>
            <input
              id="code"
              name="code"
              className="input code-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9 ]*"
              maxLength={7}
              required
              autoFocus
            />
          </div>
          {state?.error && (
            <p className="field-error" role="alert">
              {state.error}
            </p>
          )}
          <button className="btn btn-ink btn-block" disabled={pending}>
            {pending ? "Checking…" : "Open the studio"}
          </button>
        </form>
      )}
      {sendState?.error && (
        <p className="field-error" role="alert">
          {sendState.error}
        </p>
      )}
      <div className="login-links">
        {sent && (
          <form action={send}>
            <button className="text-link login-switch" disabled={sending}>
              {sending ? "Sending…" : "Send a new code"}
            </button>
          </form>
        )}
        <button type="button" className="text-link login-switch" onClick={onUsePassword}>
          Use the password instead
        </button>
      </div>
    </div>
  );
}
