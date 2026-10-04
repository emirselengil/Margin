import { getAllRecords, getStudentDetail } from "@/app/ogrencilerim/[ogrenciId]/data";
import { ApiError, json, withUser } from "@/lib/mobile-api";

/** Öğrencinin bugüne kadarki tüm etüt kayıtları (salt görüntüleme). */
export const GET = withUser<{ id: string }>(["head_teacher"], async (_req, user, { id }) => {
  const student = await getStudentDetail(user, id);
  if (!student) throw new ApiError(404, "Öğrenci bulunamadı.");
  const records = await getAllRecords(id, user.role);
  return json({ student, records });
});
