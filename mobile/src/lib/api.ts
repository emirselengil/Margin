import { storage } from "@/lib/storage";

/**
 * Sunucu adresi. Geliştirme: EXPO_PUBLIC_API_URL (mobile/.env). Android
 * emülatöründe bilgisayarın localhost'u http://10.0.2.2:3000'dir.
 */
const BASE = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setApiToken(t: string | null) {
  token = t;
}
export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

type Options = { method?: "GET" | "POST" | "PUT" | "PATCH"; body?: unknown; query?: Record<string, string | undefined> };

export async function api<T>(path: string, { method = "GET", body, query }: Options = {}): Promise<T> {
  if (!BASE) throw new ApiError(0, "Sunucu adresi ayarlanmamış (EXPO_PUBLIC_API_URL).");

  const qs = query
    ? Object.entries(query)
        .filter((e): e is [string, string] => e[1] !== undefined)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&")
    : "";
  const url = `${BASE}/api/mobile${path}${qs ? `?${qs}` : ""}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(0, "Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.");
  } finally {
    clearTimeout(timer);
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // gövde yok / JSON değil
  }

  if (!res.ok) {
    const body = (data ?? {}) as { error?: unknown; message?: unknown };
    const message =
      (typeof body.error === "string" && body.error) ||
      (typeof body.message === "string" && body.message) ||
      "İşlem başarısız oldu.";
    if (res.status === 401 && token) onUnauthorized?.();
    throw new ApiError(res.status, message);
  }
  return data as T;
}

export const TOKEN_KEY = "margin.token";
export async function loadStoredToken() {
  return storage.get(TOKEN_KEY);
}
