"use server";

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/server";
import { getOrCreateProfile } from "@/lib/profile";
import { ROLE_HOME } from "@/lib/roles";

export type SignInState = { error?: string };

export async function signInAction(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "E-posta ve şifre gerekli." };
  }

  const { error } = await auth.signIn.email({ email, password });
  if (error) {
    return { error: "E-posta veya şifre yanlış." };
  }

  const profile = await getOrCreateProfile();
  redirect(ROLE_HOME[profile?.role ?? "pending"]);
}
