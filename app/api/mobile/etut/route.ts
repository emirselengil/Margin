import { getLinkedHeadTeachers, getStudentsForDate, getWeekdayCounts } from "@/app/etut/data";
import { todayISODate } from "@/lib/date";
import { json, requireDate, withUser } from "@/lib/mobile-api";

/** Asistanın etüt listesi: seçili günün öğrencileri + haftalık yoğunluk. */
export const GET = withUser(["assistant"], async (req, user) => {
  const dateParam = new URL(req.url).searchParams.get("date");
  const date = dateParam ? requireDate(dateParam) : todayISODate();

  const [students, weekdayCounts, headTeachers] = await Promise.all([
    getStudentsForDate(user, date),
    getWeekdayCounts(user),
    getLinkedHeadTeachers(user),
  ]);
  return json({ date, today: todayISODate(), students, weekdayCounts, headTeachers });
});
