import { setHeadTeacherNoteAction } from "@/app/ogrencilerim/actions";
import { ApiError, json, readBody, requireDate, withUser } from "@/lib/mobile-api";

/**
 * Baş öğretmen, öğrencisinin bir günkü etüt kaydına not yazar/siler.
 * Yetki ve "kayıt önceden girilmiş olmalı" kuralı sunucu eyleminde uygulanır.
 */
export const PUT = withUser<{ id: string }>(["head_teacher"], async (req, _user, { id }) => {
  const body = await readBody(req);
  const date = requireDate(body.date);
  if (body.note !== null && typeof body.note !== "string") throw new ApiError(400, "Not geçersiz.");

  const result = await setHeadTeacherNoteAction(id, date, body.note);
  if (!result.ok) throw new ApiError(403, result.message);
  return json({ ok: true });
});
