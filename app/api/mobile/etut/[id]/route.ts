import { getPastRecords, getStudentDetail, getTodayRecord } from "@/app/etut/[ogrenciId]/data";
import { getStudentsForDate } from "@/app/etut/data";
import { todayISODate, weekdayOfISODate } from "@/lib/date";
import { ApiError, json, requireDate, withUser } from "@/lib/mobile-api";

/** Öğrenci detayı: seçili günün kaydı, geçmiş etütler, o gün etüt günü mü. */
export const GET = withUser<{ id: string }>(["assistant"], async (req, user, { id }) => {
  const dateParam = new URL(req.url).searchParams.get("date");
  const date = dateParam ? requireDate(dateParam) : todayISODate();

  const student = await getStudentDetail(user, id);
  if (!student) throw new ApiError(404, "Öğrenci bulunamadı.");

  const [record, pastRecords, sameDayStudents] = await Promise.all([
    getTodayRecord(id, date),
    getPastRecords(id, date),
    getStudentsForDate(user, date),
  ]);

  return json({
    date,
    student,
    scheduled: student.studyDays.includes(weekdayOfISODate(date)),
    record: record
      ? {
          homework: record.homework,
          book: record.book,
          attendance: record.attendance,
          note: record.note,
          headTeacherNote: record.headTeacherNote,
        }
      : null,
    pastRecords,
    sameDayStudentIds: sameDayStudents.map((s) => s.id),
  });
});
