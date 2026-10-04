import { addMyStudentAction } from "@/app/ogrencilerim/actions";
import { getAllMyStudents } from "@/app/ogrencilerim/data";
import { json, readBody, requireString, withUser } from "@/lib/mobile-api";

/** Öğretmenin (baş öğretmen) tüm öğrencileri; etüt günleri ve son etüt durumuyla. */
export const GET = withUser(["head_teacher"], async (_req, user) => {
  return json({ students: await getAllMyStudents(user) });
});

export const POST = withUser(["head_teacher"], async (req) => {
  const body = await readBody(req);
  const created = await addMyStudentAction(requireString(body.fullName, "Ad soyad"), requireString(body.className, "Sınıf", 50));
  return json(created, 201);
});
