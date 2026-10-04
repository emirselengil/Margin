"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import { profiles } from "@/db/schema";
import { getRequestAuth } from "@/lib/auth/mobile";
import { getOrCreateProfile } from "@/lib/profile";

export type ProfileActionResult = { ok: boolean; message: string };

async function requireActiveProfile() {
  const profile = await getOrCreateProfile();
  if (!profile || !profile.isActive || profile.role === "pending") return null;
  return profile;
}

export async function updateNameAction(firstName: string, lastName: string): Promise<ProfileActionResult> {
  const profile = await requireActiveProfile();
  if (!profile) return { ok: false, message: "Oturumunuz geçersiz veya hesabınız aktif değil." };

  const first = firstName.trim();
  const last = lastName.trim();
  if (!first || !last) return { ok: false, message: "Ad ve soyad gerekli." };

  const { error } = await (await getRequestAuth()).updateUser({ name: `${first} ${last}` });
  if (error) {
    console.error("updateUser başarısız:", error);
    return { ok: false, message: "İsim güncellenemedi, lütfen tekrar deneyin." };
  }

  await db.update(profiles).set({ firstName: first, lastName: last }).where(eq(profiles.id, profile.id));
  revalidatePath("/", "layout");
  return { ok: true, message: "İsminiz güncellendi." };
}

export async function changePasswordAction(
  currentPassword: string,
  newPassword: string,
  newPasswordConfirm: string,
): Promise<ProfileActionResult> {
  const profile = await requireActiveProfile();
  if (!profile) return { ok: false, message: "Oturumunuz geçersiz veya hesabınız aktif değil." };

  if (!currentPassword) return { ok: false, message: "Mevcut şifrenizi girin." };
  if (newPassword.length < 8) return { ok: false, message: "Yeni şifre en az 8 karakter olmalı." };
  if (newPassword !== newPasswordConfirm) return { ok: false, message: "Yeni şifreler eşleşmiyor." };
  if (newPassword === currentPassword) return { ok: false, message: "Yeni şifre mevcut şifreden farklı olmalı." };

  const { error } = await (await getRequestAuth()).changePassword({ currentPassword, newPassword });
  if (error) {
    console.error("changePassword başarısız:", error);
    if (error.status === 400 || error.status === 401 || error.status === 403) {
      return { ok: false, message: "Mevcut şifre yanlış." };
    }
    return { ok: false, message: "Şifre değiştirilemedi, lütfen tekrar deneyin." };
  }
  return { ok: true, message: "Şifreniz değiştirildi." };
}
