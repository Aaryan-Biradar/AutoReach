// Central API client — owned by Person 3.
// Every fetch to the backend goes through this file so no component ever
// hardcodes a URL. Uses NEXT_PUBLIC_API_URL from .env.local.

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Types ────────────────────────────────────────────────────────────────

export interface Call {
  id: string;
  store_name: string;
  phone_number: string;
  called_at: string;
  answered: boolean;
  outcome: "agreed" | "callback" | "rejected" | "no_answer";
  pickup_scheduled: boolean;
  notes: string | null;
}

export interface Stats {
  total: number;
  agreed: number;
  rejected: number;
  callback: number;
  no_answer: number;
}

// ── Fetch helpers ────────────────────────────────────────────────────────

export async function fetchCalls(): Promise<Call[]> {
  const res = await fetch(`${BASE_URL}/api/calls`);
  if (!res.ok) throw new Error(`Failed to fetch calls: ${res.status}`);
  return res.json();
}

export async function fetchStats(): Promise<Stats> {
  const res = await fetch(`${BASE_URL}/api/calls/stats`);
  if (!res.ok) throw new Error(`Failed to fetch stats: ${res.status}`);
  return res.json();
}

export async function triggerCall(
  storeName: string,
  phoneNumber: string
): Promise<Call> {
  const res = await fetch(`${BASE_URL}/api/calls/trigger`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ store_name: storeName, phone_number: phoneNumber }),
  });
  if (!res.ok) throw new Error(`Failed to trigger call: ${res.status}`);
  return res.json();
}
