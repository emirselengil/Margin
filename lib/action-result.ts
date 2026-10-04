import { PermissionError } from "@/lib/permissions";

/**
 * Sunucu eylemlerinden fırlatılan hata mesajları üretimde istemciye gizlenir.
 * Kullanıcıya Türkçe, anlaşılır bir mesaj göstermek istediğimiz işlemler bu
 * sarmalayıcıyla sonuç nesnesi döner.
 */
export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; message: string };

export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (e instanceof PermissionError) return { ok: false, message: e.message };
    console.error("Sunucu eylemi başarısız:", e);
    return { ok: false, message: "İşlem başarısız oldu, lütfen tekrar deneyin." };
  }
}
