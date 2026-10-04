import { updateStudentInfoAction } from "@/app/gruplar/actions";
import { json, readBody, requireString, withUser } from "@/lib/mobile-api";

export const PATCH = withUser<{ id: string }>(["assistant"], async (req, _user, { id }) => {
  const body = await readBody(req);
  await updateStudentInfoAction(id, {
    fullName: requireString(body.fullName, "Ad soyad"),
    className: requireString(body.className, "Sınıf", 50),
    headTeacherId: requireString(body.headTeacherId, "Öğretmen", 100),
  });
  return json({ ok: true });
});
