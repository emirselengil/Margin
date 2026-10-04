import { mobileSignIn } from "@/lib/auth/mobile";
import { errorResponse, json, readBody, requireString } from "@/lib/mobile-api";

export async function POST(req: Request) {
  try {
    const body = await readBody(req);
    const email = requireString(body.email, "E-posta");
    const password = typeof body.password === "string" ? body.password : "";
    if (!password) return json({ error: "Şifre gerekli." }, 400);

    const result = await mobileSignIn(email, password);
    if ("error" in result) {
      if (result.error === "invalid") return json({ error: "E-posta veya şifre yanlış." }, 401);
      console.error("Mobil giriş başarısız:", result.message);
      return json({ error: "Giriş yapılamadı, lütfen tekrar deneyin." }, 502);
    }
    return json({ token: result.token });
  } catch (e) {
    return errorResponse(e);
  }
}
