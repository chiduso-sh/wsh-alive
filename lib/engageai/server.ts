import "server-only";
import { buildManifest } from "./manifest";

const SERVER = "https://engageai-sdk-production.up.railway.app";
const TIMEOUT_MS = 30_000;

export type UpstreamPath = "/api/v1/chat" | "/api/v1/results" | "/api/v1/confirm";

export class UpstreamError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

function config() {
  const apiKey = process.env.ENGAGEAI_API_KEY;
  if (!apiKey) throw new UpstreamError(503, "ENGAGEAI_API_KEY is not set");
  // Must match the app the key was created for in the EngageAI dashboard.
  const appId = process.env.ENGAGEAI_APP_ID || "wsh_alive";
  return { apiKey, appId };
}

export function appId() {
  return config().appId;
}

async function post(path: string, body: unknown) {
  const { apiKey } = config();
  let res: Response;
  try {
    res = await fetch(`${SERVER}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-EngageAI-Key": apiKey },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (err) {
    const timedOut = err instanceof DOMException && err.name === "TimeoutError";
    throw new UpstreamError(timedOut ? 504 : 502, `${path} ${timedOut ? "timed out" : "unreachable"}`);
  }
  // Only the status is surfaced: bodies can contain user messages and emails.
  if (!res.ok) throw new UpstreamError(res.status, `${path} upstream ${res.status}`);
  return res.json();
}

// Register once per server instance instead of once per page view.
let registration: Promise<void> | null = null;

function ensureRegistered(force = false) {
  if (force || !registration) {
    registration = post("/api/v1/register", { manifest: buildManifest(config().appId) }).then(
      () => undefined,
      err => { registration = null; throw err; },
    );
  }
  return registration;
}

// Sends a request on behalf of this app. If EngageAI has lost the registration
// (it answers 404 for unknown apps), registers again and retries once.
export async function callEngageAI(path: UpstreamPath, body: Record<string, unknown>) {
  const payload = { ...body, app_id: config().appId };
  await ensureRegistered();
  try {
    return await post(path, payload);
  } catch (err) {
    if (!(err instanceof UpstreamError) || err.status !== 404) throw err;
    await ensureRegistered(true);
    return post(path, payload);
  }
}
