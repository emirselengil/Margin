import { mobileSignOut } from "@/lib/auth/mobile";
import { json } from "@/lib/mobile-api";

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (token) await mobileSignOut(token);
  return json({ ok: true });
}
