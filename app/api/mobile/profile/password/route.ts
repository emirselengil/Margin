import { changePasswordAction } from "@/app/profil/actions";
import { json, readBody, withUser } from "@/lib/mobile-api";

export const POST = withUser(null, async (req) => {
  const body = await readBody(req);
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const result = await changePasswordAction(str(body.currentPassword), str(body.newPassword), str(body.newPasswordConfirm));
  return json(result, result.ok ? 200 : 400);
});
