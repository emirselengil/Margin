import { updateNameAction } from "@/app/profil/actions";
import { json, readBody, requireString, withUser } from "@/lib/mobile-api";

export const PATCH = withUser(null, async (req) => {
  const body = await readBody(req);
  const result = await updateNameAction(requireString(body.firstName, "Ad", 80), requireString(body.lastName, "Soyad", 80));
  return json(result, result.ok ? 200 : 400);
});
