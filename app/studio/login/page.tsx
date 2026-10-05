import { redirect } from "next/navigation";
import { LoginForm } from "@/components/studio/LoginForm";
import { authConfigured, isAdmin } from "@/lib/auth";
import { maskEmail, recoveryEmail } from "@/lib/mail";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/studio");
  const email = recoveryEmail();

  return (
    <div className="studio-login">
      <p className="eyebrow">Studio</p>
      <h1 className="display h2" style={{ margin: "8px 0 24px" }}>
        Welcome back, Han.
      </h1>
      {authConfigured() ? (
        <LoginForm codeEmail={email ? maskEmail(email) : null} />
      ) : (
        <div className="notice notice-error">
          The Studio isn&apos;t set up yet. Add <code>ADMIN_PASSWORD</code> and a 32+ character <code>SESSION_SECRET</code>{" "}
          to <code>.env.local</code>, then restart the server.
        </div>
      )}
    </div>
  );
}
