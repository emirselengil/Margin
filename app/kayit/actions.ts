"use server";

import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { profiles } from "@/db/schema";
import { auth } from "@/lib/auth/server";

export type SignUpState = { error?: string };

export async function signUpAction(
  _prevState: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");
  const kvkk = formData.get("kvkk");

  if (!firstName || !lastName) {
    return { error: "Ad ve soyad gerekli." };
  }
  if (!email.includes("@")) {
    return { error: "Geçerli bir e-posta adresi girin." };
  }
  if (password.length < 8) {
    return { error: "Şifre en az 8 karakter olmalı." };
  }
  if (password !== passwordConfirm) {
    return { error: "Şifreler eşleşmiyor." };
  }
  if (kvkk !== "on") {
    return { error: "KVKK aydınlatma metnini onaylamanız gerekir." };
  }

  const { error } = await auth.signUp.email({
    name: `${firstName} ${lastName}`,
    email,
    password,
  });
  if (error) {
    console.error("signUp.email başarısız:", error);
    if (error.status === 422) {
      return { error: "Bu e-posta zaten kullanılıyor." };
    }
    return {
      error: `Kayıt oluşturulamadı${error.message ? `: ${error.message}` : "."} Lütfen tekrar deneyin.`,
    };
  }

  const { data: session } = await auth.getSession();
  if (session?.user) {
    await db
      .insert(profiles)
      .values({ id: session.user.id, firstName, lastName, email })
      .onConflictDoNothing({ target: profiles.id });
  }

  redirect("/onay-bekliyor");
}
