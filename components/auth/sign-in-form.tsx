"use client";

import { ArrowRight } from "lucide-react";
import { useActionState } from "react";

import { signInAction, type SignInState } from "@/app/giris/actions";

const initialState: SignInState = {};

export function SignInForm() {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="g-eposta" className="text-[13px] font-medium">
          E-posta
        </label>
        <input
          id="g-eposta"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="ad.soyad@okul.edu.tr"
          className="h-11 rounded-[10px] border border-line-2 bg-surface px-3.5 text-sm text-ink outline-none focus:border-accent"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <label htmlFor="g-sifre" className="text-[13px] font-medium">
            Şifre
          </label>
          <button
            type="button"
            disabled
            className="cursor-default text-[13px] font-medium text-muted"
          >
            Şifremi unuttum
          </button>
        </div>
        <input
          id="g-sifre"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="h-11 rounded-[10px] border border-line-2 bg-surface px-3.5 text-sm text-ink outline-none focus:border-accent"
        />
      </div>
      <label className="flex items-center gap-2.5 text-[13px] text-ink-2">
        <input type="checkbox" name="remember" className="h-4 w-4 accent-accent" />
        Beni hatırla
      </label>

      {state.error ? (
        <p role="alert" className="text-[13px] font-medium text-warn-text">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 flex h-[46px] items-center justify-center gap-2 rounded-[10px] bg-accent font-medium text-white shadow-[0_6px_18px_rgba(79,70,229,0.28)] disabled:opacity-70"
      >
        {pending ? "Giriş yapılıyor…" : "Giriş yap"}
        <ArrowRight size={16} aria-hidden="true" />
      </button>
    </form>
  );
}
