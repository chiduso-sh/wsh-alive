import { NextRequest, NextResponse } from "next/server";

const SERVER = "https://engageai-sdk-production.up.railway.app";
const API_KEY = process.env.NEXT_PUBLIC_ENGAGEAI_KEY!;
const HEADERS = {
  "Content-Type": "application/json",
  "X-EngageAI-Key": API_KEY,
};

export async function POST(req: NextRequest) {
  const { path, body } = await req.json();

  const url = `${SERVER}${path}`;
  console.log(`[EngageAI proxy] POST ${url}`);
  console.log(`[EngageAI proxy] Body:`, JSON.stringify(body, null, 2));

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(body),
    });

    const text = await res.text();
    console.log(`[EngageAI proxy] Response ${res.status}:`, text);

    let data;
    try { data = JSON.parse(text); } catch { data = { error: text }; }

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[EngageAI proxy] fetch failed:", err);
    return NextResponse.json({ error: "Proxy error" }, { status: 502 });
  }
}
