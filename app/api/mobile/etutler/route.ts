import { getMyAssistants, getStudentsForDate, getWeekdayCounts } from "@/app/ogrencilerim/data";
import { todayISODate } from "@/lib/date";
import { json, requireDate, withUser } from "@/lib/mobile-api";
import { visibleStudentIds } from "@/lib/permissions";

/** Öğretmenin etütler görünümü: seçili günün öğrencileri + haftalık yoğunluk. */
export const GET = withUser(["head_teacher"], async (req, user) => {
  const dateParam = new URL(req.url).searchParams.get("date");
  const date = dateParam ? requireDate(dateParam) : todayISODate();

  const [students, weekdayCounts, assistants, allIds] = await Promise.all([
    getStudentsForDate(user, date),
    getWeekdayCounts(user),
    getMyAssistants(user),
    visibleStudentIds(user),
  ]);
  return json({
    date,
    today: todayISODate(),
    students,
    weekdayCounts,
    totalStudents: allIds.length,
    assistants: assistants.map((a) => ({ id: a.id, name: `${a.firstName} ${a.lastName}` })),
  });
});
