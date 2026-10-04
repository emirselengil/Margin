import { getAllHeadTeachers, getStudentsWithDays } from "@/app/gruplar/data";
import { json, withUser } from "@/lib/mobile-api";

/** Gün grupları: öğrenci × etüt günleri + atanabilecek öğretmenler. */
export const GET = withUser(["assistant"], async (_req, user) => {
  const [students, allHeadTeachers] = await Promise.all([getStudentsWithDays(user), getAllHeadTeachers()]);
  return json({ students, allHeadTeachers });
});
