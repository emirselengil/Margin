import { addStudentAction } from "@/app/gruplar/actions";
import { json, readBody, requireString, withUser } from "@/lib/mobile-api";

export const POST = withUser(["assistant"], async (req) => {
  const body = await readBody(req);
  const created = await addStudentAction(
    requireString(body.headTeacherId, "Öğretmen", 100),
    requireString(body.fullName, "Ad soyad"),
    requireString(body.className, "Sınıf", 50),
  );
  return json(created, 201);
});
