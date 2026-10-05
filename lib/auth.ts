import "server-only";

import { createHash, createHmac, randomBytes, randomInt, scrypt, timingSafeEqual } from "node:crypto";
import path from "node:path";
import { promisify } from "node:util";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { readDoc, updateDoc, type JsonDoc } from "./store";

const COOKIE = "abtp_studio";
/** A login lasts at most this long, even while in use. */
const MAX_AGE = 60 * 60 * 12; // 12 hours
/** Unused for this long, the login ends and the seat is free for another device. */
export const IDLE_MS = 30 * 60 * 1000;
/** How often "last active" is written while the host is clicking around. */
const TOUCH_MS = 60 * 1000;
/** Wrong passwords allowed per network before it is locked out for LOCK_MS. */
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;
const MAX_EVENTS = 30;
/** Devices that may be signed in to the Studio at the same time. */
export const MAX_SESSIONS = 3;
export const MIN_PASSWORD_LENGTH = 10;
/** Email login codes: valid this long, this many guesses, at most this many sent per hour. */
const CODE_TTL_MS = 10 * 60 * 1000;
const CODE_MAX_TRIES = 5;
/**
 * No waiting between codes — the email route must always work for the host.
 * This ceiling only stops someone flooding the inbox (and getting the sending Gmail flagged as spam).
 */
const CODES_PER_HOUR = 30;

// Server-only state, outside /content and /public. Ignored by git. On a live host it is a private
// Vercel Blob (lib/store.ts). Deleting it resets the Studio password to ADMIN_PASSWORD.
const STATE_DOC: JsonDoc<State> = {
  key: "studio/auth.json",
  file: path.join(process.cwd(), ".studio", "auth.json"),
  empty: () => ({ sessions: [], events: [], fails: {} }),
};

type Session = { id: string; key: string; started: number; lastSeen: number; ip: string; device: string };
/** A password set from Studio → Security. Only the scrypt hash is stored. */
type StoredPassword = { salt: string; hash: string; changed: number };
export type AuthEvent = {
  at: number;
  ip: string;
  device: string;
  result:
    | "signed-in"
    | "wrong-password"
    | "locked-out"
    | "blocked-busy"
    | "signed-out"
    | "password-changed"
    | "code-sent"
    | "code-signed-in"
    | "wrong-code";
};
type Fails = { count: number; first: number; until: number };
/** The one pending email login code (only its HMAC is stored). */
type LoginCode = { hash: string; expires: number; tries: number };
type State = {
  sessions: Session[];
  events: AuthEvent[];
  fails: Record<string, Fails>;
  password?: StoredPassword;
  code?: LoginCode | null;
  /** When codes were emailed, for the hourly limit. */
  codesSent?: number[];
};

/** True when ADMIN_PASSWORD and SESSION_SECRET are set in .env.local */
export const authConfigured = () =>
  Boolean(process.env.ADMIN_PASSWORD) && (process.env.SESSION_SECRET?.length ?? 0) >= 32;

// The current password is part of the signing key, so changing it signs every other device out.
const signingKey = (state: State) => `${process.env.SESSION_SECRET}:${state.password?.hash ?? process.env.ADMIN_PASSWORD}`;
const keyId = (state: State) => createHash("sha256").update(signingKey(state)).digest("base64url").slice(0, 16);
const sign = (state: State, value: string) => createHmac("sha256", signingKey(state)).update(value).digest("base64url");

function safeEqual(a: string, b: string) {
  // Hash first so different lengths don't leak through timing.
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

const scryptAsync = promisify(scrypt) as (password: string, salt: string, keylen: number) => Promise<Buffer>;

async function hashPassword(password: string): Promise<StoredPassword> {
  const salt = randomBytes(16).toString("base64url");
  const hash = (await scryptAsync(password, salt, 64)).toString("base64url");
  return { salt, hash, changed: Date.now() };
}

/** Checks against the Studio-set password, or ADMIN_PASSWORD until one has been set. */
async function passwordMatches(state: State, input: string) {
  if (!authConfigured()) return false;
  if (!state.password) return safeEqual(input, process.env.ADMIN_PASSWORD!);
  const hash = await scryptAsync(input, state.password.salt, 64);
  return timingSafeEqual(hash, Buffer.from(state.password.hash, "base64url"));
}

// ------------------------------------------------------------------ state file

async function readState(): Promise<State> {
  try {
    return migrate(await readDoc(STATE_DOC));
  } catch {
    return STATE_DOC.empty!();
  }
}

/** Older files kept a single "session". */
function migrate(state: State & { session?: Session | null }): State {
  state.sessions ??= state.session ? [state.session] : [];
  delete state.session;
  return state;
}

const updateState = <R>(change: (state: State) => R): Promise<R> => updateDoc(STATE_DOC, (state) => change(migrate(state)));

/** Sessions used recently and signed with the current password. Each one takes a seat. */
const liveSessions = (state: State, now: number) =>
  state.sessions.filter((s) => s.key === keyId(state) && now - s.lastSeen < IDLE_MS && now - s.started < MAX_AGE * 1000);

function logEvent(state: State, event: Omit<AuthEvent, "at">) {
  state.events.unshift({ at: Date.now(), ...event });
  state.events.length = Math.min(state.events.length, MAX_EVENTS);
}

// ------------------------------------------------------------------ request details

async function client() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "local";
  return { ip, device: describeDevice(h.get("user-agent") ?? "") };
}

/** "Chrome on Android" — enough for the host to recognise their own devices. */
function describeDevice(ua: string) {
  const browser = /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iPhone/iPad" : /Mac OS X/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "unknown device";
  return `${browser} on ${os}`;
}

/**
 * The session id from this browser's cookie, if the cookie is genuine and unexpired.
 * A browser can hold two cookies with this name (e.g. a leftover one on another path), and
 * cookies().get() returns only the last, so every copy in the raw header is checked.
 */
async function readToken(state: State) {
  const tokens = ((await headers()).get("cookie") ?? "")
    .split(/; */)
    .filter((pair) => pair.startsWith(`${COOKIE}=`))
    .map((pair) => pair.slice(COOKIE.length + 1));
  for (const token of tokens) {
    const [id, expires, signature] = token.split(".");
    if (!id || !expires || !signature || !safeEqual(signature, sign(state, `${id}.${expires}`))) continue;
    if (Number(expires) > Date.now()) return id;
  }
  return null;
}

async function setSessionCookie(state: State, id: string) {
  const started = state.sessions.find((s) => s.id === id)?.started ?? Date.now();
  const expires = started + MAX_AGE * 1000;
  (await cookies()).set(COOKIE,`${id}.${expires}.${sign(state, `${id}.${expires}`)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/studio",
    maxAge: Math.round((expires - Date.now()) / 1000),
  });
}

const minutes = (ms: number) => Math.max(1, Math.ceil(ms / 60000));

// ------------------------------------------------------------------ public API

/**
 * Checks the password and opens one of the MAX_SESSIONS Studio seats.
 * Returns an error message, or null when signed in.
 */
export async function signIn(password: string): Promise<string | null> {
  const { ip, device } = await client();
  const before = await readState();
  const ownId = await readToken(before);
  const correct = await passwordMatches(before, password);
  const now = Date.now();

  const outcome = await updateState((state): { error: string } | { state: State; id: string } => {
    const fails = state.fails[ip];
    if (fails && fails.until > now) {
      logEvent(state, { ip, device, result: "locked-out" });
      return { error: `Password login is paused for ${minutes(fails.until - now)} minutes. Use “Email me a code” below to get in now.` };
    }

    if (!correct) {
      const f = fails && now - fails.first < LOCK_MS ? fails : { count: 0, first: now, until: 0 };
      f.count += 1;
      if (f.count >= MAX_FAILS) f.until = now + LOCK_MS;
      state.fails[ip] = f;
      logEvent(state, { ip, device, result: "wrong-password" });
      const left = MAX_FAILS - f.count;
      return {
        error: left > 0 ? `That password isn't right. ${left} ${left === 1 ? "try" : "tries"} left.` : "Too many wrong passwords. Password login is paused for 15 minutes — use “Email me a code” below to get in now.",
      };
    }

    // Right password — take a seat. (Checked after the password, so strangers can't tell whether the host is online.)
    return takeSeat(state, { ip, device, ownId, now, result: "signed-in" });
  });

  if ("error" in outcome) return outcome.error;
  await setSessionCookie(outcome.state, outcome.id);
  return null;
}

/** Opens a session if fewer than MAX_SESSIONS other devices are signed in. Runs inside updateState. */
function takeSeat(
  state: State,
  { ip, device, ownId, now, result }: { ip: string; device: string; ownId: string | null; now: number; result: AuthEvent["result"] },
): { error: string } | { state: State; id: string } {
  const others = liveSessions(state, now).filter((s) => s.id !== ownId);
  if (others.length >= MAX_SESSIONS) {
    logEvent(state, { ip, device, result: "blocked-busy" });
    const idleLeft = IDLE_MS - Math.max(...others.map((s) => now - s.lastSeen));
    return {
      error: `The host control is already open on ${MAX_SESSIONS} devices. Log out on one of them, or try again in ${minutes(idleLeft)} minutes.`,
    };
  }
  delete state.fails[ip];
  const id = randomBytes(18).toString("base64url");
  state.sessions = [...others, { id, key: keyId(state), started: now, lastSeen: now, ip, device }];
  logEvent(state, { ip, device, result });
  return { state, id };
}

// ------------------------------------------------------------------ email login code

const hashCode = (code: string) => createHmac("sha256", `${process.env.SESSION_SECRET}:login-code`).update(code).digest("base64url");

/**
 * Makes a new 6-digit login code (replacing any earlier one) for the caller to email.
 * Returns the code, or an error when codes are being asked for too often.
 */
export async function createLoginCode(): Promise<{ code: string } | { error: string }> {
  if (!authConfigured()) return { error: "The Studio isn't set up yet." };
  const { ip, device } = await client();
  const now = Date.now();
  return updateState((state) => {
    const sent = (state.codesSent ?? []).filter((t) => now - t < 60 * 60 * 1000);
    if (sent.length >= CODES_PER_HOUR) return { error: "Too many codes asked for in the last hour. Use the newest code you received." };

    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    state.code = { hash: hashCode(code), expires: now + CODE_TTL_MS, tries: 0 };
    state.codesSent = [...sent, now];
    logEvent(state, { ip, device, result: "code-sent" });
    return { code };
  });
}

/** Undoes createLoginCode when the email could not be sent, so it doesn't count against the limits. */
export async function cancelLoginCode() {
  await updateState((state) => {
    state.code = null;
    state.codesSent = (state.codesSent ?? []).slice(0, -1);
    state.events = state.events.filter((e, i) => !(i === 0 && e.result === "code-sent"));
  });
}

/**
 * Signs in with an emailed code. Works even when the network is locked out for wrong passwords.
 * Returns an error message, or null when signed in.
 */
export async function signInWithCode(input: string): Promise<string | null> {
  const { ip, device } = await client();
  const ownId = await readToken(await readState());
  const now = Date.now();
  const typed = input.replace(/\D/g, "");

  const outcome = await updateState((state): { error: string } | { state: State; id: string } => {
    const code = state.code;
    if (!code || code.expires < now) return { error: "This code has expired. Ask for a new one." };
    if (code.tries >= CODE_MAX_TRIES) return { error: "Too many wrong codes. Ask for a new one." };
    if (typed.length !== 6 || !safeEqual(hashCode(typed), code.hash)) {
      code.tries += 1;
      logEvent(state, { ip, device, result: "wrong-code" });
      const left = CODE_MAX_TRIES - code.tries;
      return { error: left > 0 ? `That code isn't right. ${left} ${left === 1 ? "try" : "tries"} left.` : "Too many wrong codes. Ask for a new one." };
    }
    const seat = takeSeat(state, { ip, device, ownId, now, result: "code-signed-in" });
    if ("id" in seat) state.code = null; // single use
    return seat;
  });

  if ("error" in outcome) return outcome.error;
  await setSessionCookie(outcome.state, outcome.id);
  return null;
}

/** Ends this device's session and frees its seat. */
export async function signOut() {
  const id = await readToken(await readState());
  if (id) {
    const { ip, device } = await client();
    await updateState((state) => {
      if (!state.sessions.some((s) => s.id === id)) return;
      state.sessions = state.sessions.filter((s) => s.id !== id);
      logEvent(state, { ip, device, result: "signed-out" });
    });
  }
  (await cookies()).delete({ name: COOKIE, path: "/studio" });
}

/**
 * Replaces the Studio password. This device stays signed in; any other is signed out.
 * Returns an error per field, or null when changed.
 */
export async function changePassword(current: string, next: string): Promise<Record<string, string> | null> {
  const before = await readState();
  const id = await readToken(before);
  if (!id) return { current: "Your login has ended. Log in again first." };
  if (!(await passwordMatches(before, current))) return { current: "That isn't the current password." };
  if (next.length < MIN_PASSWORD_LENGTH) return { next: `Use at least ${MIN_PASSWORD_LENGTH} characters.` };
  if (next === current) return { next: "Choose a password different from the current one." };

  const stored = await hashPassword(next);
  const { ip, device } = await client();
  const state = await updateState((s) => {
    s.password = stored;
    // Re-sign this device's session with the new key, so it stays signed in; the others end.
    s.sessions = s.sessions.filter((x) => x.id === id).map((x) => ({ ...x, key: keyId(s) }));
    logEvent(s, { ip, device, result: "password-changed" });
    return s;
  });
  await setSessionCookie(state, id);
  return null;
}

export async function isAdmin() {
  if (!authConfigured()) return false;
  const state = await readState();
  const id = await readToken(state);
  const now = Date.now();
  const session = id ? liveSessions(state, now).find((s) => s.id === id) : undefined;
  if (!session) return false;
  if (now - session.lastSeen > TOUCH_MS) {
    await updateState((s) => {
      const own = s.sessions.find((x) => x.id === id);
      if (own) own.lastSeen = now;
    });
  }
  return true;
}

/** Call at the top of every Studio page and every Studio action. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/studio/login");
}

/** Signed-in devices, recent sign-in attempts and when the password last changed, for Studio → Security. */
export async function getAuthActivity() {
  const state = await readState();
  const ownId = await readToken(state);
  const sessions = liveSessions(state, Date.now()).map((s) => ({ ...s, current: s.id === ownId }));
  return { sessions, events: state.events.slice(0, 15), passwordChanged: state.password?.changed ?? null };
}
