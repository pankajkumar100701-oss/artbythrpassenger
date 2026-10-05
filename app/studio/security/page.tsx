import Link from "next/link";
import { PasswordForm } from "@/components/studio/PasswordForm";
import { getAuthActivity, MAX_SESSIONS, MIN_PASSWORD_LENGTH, requireAdmin, type AuthEvent } from "@/lib/auth";

export default async function SecurityPage({ searchParams }: PageProps<"/studio/security">) {
  await requireAdmin();
  const [{ sessions, events, passwordChanged }, { changed }] = await Promise.all([getAuthActivity(), searchParams]);

  return (
    <div className="container studio-page" style={{ maxWidth: 860 }}>
      <Link href="/studio" className="back-link">
        ← Control centre
      </Link>
      <p className="eyebrow">Keep the studio yours</p>
      <h1 className="display h2" style={{ marginBottom: 24 }}>
        Security
      </h1>

      {changed && (
        <p className="notice" role="status">
          ✦ Password changed. Use the new one next time you log in — any other device has been signed out.
        </p>
      )}

      <section className="studio-card">
        <h2 className="studio-card-title">Studio password</h2>
        <p className="muted">
          {passwordChanged ? `Last changed ${timeAgo(passwordChanged)}.` : "Still the password from the setup file — change it to one only you know."}
        </p>
        <PasswordForm minLength={MIN_PASSWORD_LENGTH} />
      </section>

      <section className="studio-card" style={{ marginTop: 24 }}>
        <h2 className="studio-card-title">Who is signed in</h2>
        <p className="muted">
          Up to {MAX_SESSIONS} devices can be in the host control at once. A login ends when you log out, or after 30 minutes
          without use.
        </p>
        <ul className="todo-list">
          {sessions.map((s) => (
            <li key={s.id}>
              {s.device} · {s.ip} · since {timeAgo(s.started)}
              {s.current && <strong> — this device</strong>}
            </li>
          ))}
        </ul>
        <table className="activity">
          <caption className="field-label">Recent sign-in attempts</caption>
          <tbody>
            {events.map((e) => (
              <tr key={`${e.at}-${e.result}`} className={WARNINGS.includes(e.result) ? "is-warning" : ""}>
                <td>{EVENT_LABEL[e.result]}</td>
                <td className="muted">{e.device}</td>
                <td className="muted">{e.ip}</td>
                <td className="muted">{timeAgo(e.at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="field-hint" style={{ marginTop: 12 }}>
          See something you don&apos;t recognise? Change the password above — that signs out every other device at once.
        </p>
      </section>
    </div>
  );
}

const WARNINGS: AuthEvent["result"][] = ["wrong-password", "locked-out", "blocked-busy", "wrong-code"];

const EVENT_LABEL: Record<AuthEvent["result"], string> = {
  "signed-in": "Signed in",
  "signed-out": "Logged out",
  "password-changed": "Password changed",
  "code-sent": "Login code emailed",
  "code-signed-in": "Signed in with email code",
  "wrong-code": "Wrong email code",
  "wrong-password": "Wrong password",
  "locked-out": "Blocked — too many tries",
  "blocked-busy": "Refused — already in use",
};

function timeAgo(at: number) {
  const min = Math.round((Date.now() - at) / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  return h < 24 ? `${h} h ago` : new Date(at).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
