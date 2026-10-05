import "server-only";

import nodemailer from "nodemailer";
import { site } from "@/data/site";

/** Where Studio login codes go. Set in .env.local, never typed on the login page. */
export const recoveryEmail = () => process.env.STUDIO_RECOVERY_EMAIL?.trim() || null;

/** "a•••••r@gmail.com" — enough for the host to know which inbox to check. */
export function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  return `${name[0]}${"•".repeat(Math.max(3, name.length - 2))}${name.length > 1 ? name.at(-1) : ""}@${domain}`;
}

const smtpConfigured = () => Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

/**
 * Emails a Studio login code. Uses Gmail (SMTP_USER + an App Password in SMTP_PASS).
 * In development without SMTP settings the code is printed to the server terminal instead.
 * Returns an error message, or null when sent.
 */
export async function sendLoginCode(code: string): Promise<string | null> {
  const to = recoveryEmail();
  if (!to) return "Email login isn't set up. Add STUDIO_RECOVERY_EMAIL to .env.local.";

  if (!smtpConfigured()) {
    if (process.env.NODE_ENV === "production") return "Email sending isn't set up yet (SMTP_USER / SMTP_PASS).";
    console.log(`\n  [studio] Login code for ${to}: ${code}  (SMTP not set up — printed here instead of emailed)\n`);
    return null;
  }

  try {
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 465),
      secure: Number(process.env.SMTP_PORT || 465) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transport.sendMail({
      from: `"${site.name} Studio" <${process.env.SMTP_USER}>`,
      to,
      subject: `Your Studio login code: ${code}`,
      text: `Your login code for the ${site.name} host control is:\n\n    ${code}\n\nIt works once, for 10 minutes.\n\nIf you didn't ask for this, someone may be trying to get in — change the Studio password from Studio → Security.`,
    });
    return null;
  } catch (err) {
    console.error("[studio] Could not send login code:", err);
    return "The code could not be emailed. Try again in a minute.";
  }
}
