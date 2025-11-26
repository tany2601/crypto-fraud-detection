// src/lib/api.ts
const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

// ---- generic helpers used by AuthContext.tsx ----
export async function getAuth(path: string, token: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || `GET ${path} failed`);
  return data;
}

export async function postForm(path: string, form: Record<string, string>) {
  const body = new URLSearchParams(form);
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || `POST ${path} failed`);
  return data;
}

export async function postJson(path: string, payload: unknown) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || `POST ${path} failed`);
  return data;
}

// ---- chain-aware analyze ----
export async function analyzeAddress(
  chain: "eth" | "btc",
  address: string,
  page = 1,
  offset = 50
) {
  const res = await fetch(
    `${API_BASE}/api/analyze/${chain}/${address}?page=${page}&offset=${offset}`
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || "Analyze failed");
  return data as { count: number; items: any[] };
}
