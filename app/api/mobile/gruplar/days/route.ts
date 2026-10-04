import { saveStudyDaysAction } from "@/app/gruplar/actions";
import { ApiError, json, readBody, requireString, withUser } from "@/lib/mobile-api";

export const PUT = withUser(["assistant"], async (req) => {
  const body = await readBody<{ changes?: unknown }>(req);
  if (!Array.isArray(body.changes) || body.changes.length > 500) throw new ApiError(400, "Değişiklikler geçersiz.");

  const changes = body.changes.map((c: { studentId?: unknown; weekdays?: unknown }) => {
    const weekdays = c.weekdays;
    if (!Array.isArray(weekdays) || !weekdays.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)) {
      throw new ApiError(400, "Etüt günleri geçersiz.");
    }
    return { studentId: requireString(c.studentId, "Öğrenci", 100), weekdays: Array.from(new Set(weekdays as number[])) };
  });
  await saveStudyDaysAction(changes);
  return json({ ok: true });
});
