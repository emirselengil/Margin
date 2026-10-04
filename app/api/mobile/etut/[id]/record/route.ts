import { saveRecordAction, setAttendanceAction, setBookAction, setHomeworkAction } from "@/app/etut/actions";
import { json, readBody, requireDate, requireOneOf, withUser } from "@/lib/mobile-api";

/**
 * Bir günün kaydını kısmen günceller: gönderilen alanlar (ödev, kitap,
 * katılım, not) yazılır, gönderilmeyenlere dokunulmaz. Yetki ve "yalnızca
 * atandığı günler" kuralı sunucu eylemlerinde uygulanır.
 */
export const PUT = withUser<{ id: string }>(["assistant"], async (req, _user, { id }) => {
  const body = await readBody(req);
  const date = requireDate(body.date);

  if (body.homework !== undefined) {
    await setHomeworkAction(id, date, requireOneOf(body.homework, ["done", "missing"] as const, "Ödev"));
  }
  if (body.book !== undefined) {
    await setBookAction(id, date, requireOneOf(body.book, ["brought", "not_brought"] as const, "Kitap"));
  }
  if (body.attendance !== undefined) {
    await setAttendanceAction(id, date, requireOneOf(body.attendance, ["came", "absent"] as const, "Katılım"));
  }
  if (body.note !== undefined) {
    const note = body.note === null ? null : typeof body.note === "string" ? body.note.trim() || null : undefined;
    if (note === undefined) return json({ error: "Not geçersiz." }, 400);
    await saveRecordAction(id, date, { homework: null, book: null, attendance: null, note });
  }
  return json({ ok: true });
});
