"use client";

import { useActionState, useState } from "react";

import { signUpAction, type SignUpState } from "@/app/kayit/actions";

const initialState: SignUpState = {};

function passwordScore(password: string) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}

const STRENGTH_LABEL = ["Zayıf", "Zayıf", "Orta", "İyi", "Güçlü"];

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);
  const [password, setPassword] = useState("");
  const score = passwordScore(password);

  return (
    <form action={formAction} className="flex flex-col gap-[18px]">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="r-ad" className="text-[13px] font-medium">
            Ad
          </label>
          <input
            id="r-ad"
            name="firstName"
            type="text"
            required
            autoComplete="given-name"
            className="h-11 w-full rounded-[10px] border border-line-2 bg-surface px-3.5 text-sm text-ink outline-none focus:border-accent"
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="r-soyad" className="text-[13px] font-medium">
            Soyad
          </label>
          <input
            id="r-soyad"
            name="lastName"
            type="text"
            required
            autoComplete="family-name"
            className="h-11 w-full rounded-[10px] border border-line-2 bg-surface px-3.5 text-sm text-ink outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="r-eposta" className="text-[13px] font-medium">
          E-posta
        </label>
        <input
          id="r-eposta"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="ad.soyad@okul.edu.tr"
          className="h-11 rounded-[10px] border border-line-2 bg-surface px-3.5 text-sm text-ink outline-none focus:border-accent"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="r-sifre" className="text-[13px] font-medium">
          Şifre
        </label>
        <input
          id="r-sifre"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="En az 8 karakter"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11 rounded-[10px] border border-line-2 bg-surface px-3.5 text-sm text-ink outline-none focus:border-accent"
        />
        <div className="mt-0.5 flex items-center gap-2.5">
          <div className="grid flex-1 grid-cols-4 gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="h-1 rounded-full"
                style={{ background: i < score ? "var(--accent)" : "var(--line)" }}
              />
            ))}
          </div>
          <span className="text-xs text-muted">{STRENGTH_LABEL[score]}</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="r-sifre2" className="text-[13px] font-medium">
          Şifre tekrar
        </label>
        <input
          id="r-sifre2"
          name="passwordConfirm"
          type="password"
          required
          autoComplete="new-password"
          className="h-11 rounded-[10px] border border-line-2 bg-surface px-3.5 text-sm text-ink outline-none focus:border-accent"
        />
      </div>

      <label className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink-2">
        <input
          type="checkbox"
          name="kvkk"
          required
          className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
        />
        <span>
          <span className="font-medium text-accent-text">KVKK aydınlatma metnini</span> okudum ve
          kabul ediyorum.
        </span>
      </label>

      {state.error ? (
        <p role="alert" className="text-[13px] font-medium text-warn-text">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-0.5 flex h-[46px] cursor-pointer items-center justify-center rounded-[10px] bg-accent font-medium text-white shadow-[0_6px_18px_rgba(79,70,229,0.28)] transition hover:opacity-90 active:scale-[0.98] active:opacity-80 disabled:cursor-default disabled:opacity-70 disabled:hover:opacity-70"
      >
        {pending ? "Hesap oluşturuluyor…" : "Hesap oluştur"}
      </button>
    </form>
  );
}
