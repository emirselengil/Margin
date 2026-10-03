import Link from "next/link";

import { AuthHeader } from "@/components/auth/auth-header";
import { SignInForm } from "@/components/auth/sign-in-form";

export default function GirisPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <AuthHeader prompt="Hesabınız yok mu?" linkHref="/kayit" linkLabel="Kayıt ol" />

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="flex w-full max-w-[420px] flex-col gap-6 rounded-[18px] border border-line bg-surface p-8 shadow-[var(--shadow-panel)] sm:p-9">
          <div>
            <h1 className="text-[26px] font-semibold tracking-[-0.03em]">
              Tekrar hoş geldiniz
            </h1>
            <p className="mt-2 leading-relaxed text-ink-2">
              Öğretmen hesabınızla giriş yapın.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-0.5 rounded-[11px] border border-line bg-sunken p-[3px]">
            <button
              type="button"
              className="h-[38px] cursor-default rounded-[8px] bg-surface text-[13px] font-medium text-ink shadow-[0_0_0_1px_var(--line),0_1px_2px_rgba(0,0,0,0.06)]"
            >
              Öğretmen
            </button>
            <button
              type="button"
              disabled
              className="h-[38px] cursor-not-allowed rounded-[8px] text-[13px] font-medium text-muted"
            >
              Veli · yakında
            </button>
            <button
              type="button"
              disabled
              className="h-[38px] cursor-not-allowed rounded-[8px] text-[13px] font-medium text-muted"
            >
              Öğrenci · yakında
            </button>
          </div>

          <SignInForm />

          <p className="border-t border-line pt-4 text-center text-[13px] text-muted">
            Hesabınız yok mu?{" "}
            <Link href="/kayit" className="font-medium text-accent-text no-underline hover:underline">
              Kayıt olun
            </Link>
          </p>
        </div>
      </main>

      <footer className="flex h-14 items-center justify-between px-8 font-mono text-xs text-muted">
        <span>© 2026 Margin</span>
        <span>Yardım · Gizlilik</span>
      </footer>
    </div>
  );
}
