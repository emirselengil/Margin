"use client";

import { useState, useTransition } from "react";

import {
  changePasswordAction,
  updateNameAction,
  type ProfileActionResult,
} from "@/app/profil/actions";

const inputClass =
  "h-11 w-full rounded-[10px] border border-line-2 bg-surface px-3.5 text-sm text-ink outline-none focus:border-accent";

function Message({ result }: { result: ProfileActionResult | null }) {
  if (!result) return null;
  return (
    <p
      role={result.ok ? "status" : "alert"}
      className={"m-0 text-[13px] font-medium " + (result.ok ? "text-accent-text" : "text-warn-text")}
    >
      {result.message}
    </p>
  );
}

function SubmitButton({ pending, children }: { pending: boolean; children: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-10 cursor-pointer self-start rounded-[9px] bg-accent px-4 text-sm font-medium text-white transition hover:opacity-90 active:scale-[0.98] active:opacity-80 disabled:cursor-default disabled:opacity-60"
    >
      {pending ? "Kaydediliyor…" : children}
    </button>
  );
}

export function NameForm({
  initialFirstName,
  initialLastName,
}: {
  initialFirstName: string;
  initialLastName: string;
}) {
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [result, setResult] = useState<ProfileActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setResult(null);
        startTransition(async () => {
          setResult(await updateNameAction(firstName, lastName));
        });
      }}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="p-ad" className="text-[13px] font-medium">
            Ad
          </label>
          <input
            id="p-ad"
            type="text"
            required
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="p-soyad" className="text-[13px] font-medium">
            Soyad
          </label>
          <input
            id="p-soyad"
            type="text"
            required
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      <Message result={result} />
      <SubmitButton pending={pending}>İsmi kaydet</SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [result, setResult] = useState<ProfileActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setResult(null);
        startTransition(async () => {
          const res = await changePasswordAction(current, next, confirm);
          setResult(res);
          if (res.ok) {
            setCurrent("");
            setNext("");
            setConfirm("");
          }
        });
      }}
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="p-mevcut" className="text-[13px] font-medium">
          Mevcut şifre
        </label>
        <input
          id="p-mevcut"
          type="password"
          required
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="p-yeni" className="text-[13px] font-medium">
            Yeni şifre
          </label>
          <input
            id="p-yeni"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="p-tekrar" className="text-[13px] font-medium">
            Yeni şifre (tekrar)
          </label>
          <input
            id="p-tekrar"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      <p className="m-0 text-xs text-muted">Şifre en az 8 karakter olmalı.</p>
      <Message result={result} />
      <SubmitButton pending={pending}>Şifreyi değiştir</SubmitButton>
    </form>
  );
}
