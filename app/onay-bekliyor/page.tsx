import { Hourglass, LogOut, ShieldX } from "lucide-react";
import { redirect } from "next/navigation";

import { signOutAction } from "@/app/onay-bekliyor/actions";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { getOrCreateProfile } from "@/lib/profile";
import { ROLE_HOME } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function OnayBekliyorPage() {
  const profile = await getOrCreateProfile();
  if (!profile) {
    redirect("/giris");
  }
  if (profile.role !== "pending") {
    redirect(ROLE_HOME[profile.role]);
  }

  const rejected = !profile.isActive;

  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <header className="flex h-[72px] items-center justify-between px-8">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="flex w-full max-w-[440px] flex-col items-center gap-5 rounded-[18px] border border-line bg-surface p-9 text-center shadow-[var(--shadow-panel)]">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{
              background: rejected ? "var(--warn-soft)" : "var(--accent-soft)",
              color: rejected ? "var(--warn-text)" : "var(--accent-text)",
            }}
          >
            {rejected ? <ShieldX size={26} aria-hidden="true" /> : <Hourglass size={26} aria-hidden="true" />}
          </div>

          <div>
            <h1 className="text-xl font-semibold tracking-[-0.02em]">
              {rejected ? "Kaydınız onaylanmadı" : "Hesabınız onay bekliyor"}
            </h1>
            <p className="mt-2 leading-relaxed text-ink-2">
              {rejected
                ? "Yöneticiniz kayıt talebinizi onaylamadı. Bir hata olduğunu düşünüyorsanız okul yöneticinizle iletişime geçin."
                : "Kaydınız alındı. Yöneticiniz rolünüzü belirleyip onayladığında uygulamaya erişebileceksiniz."}
            </p>
          </div>

          <form action={signOutAction}>
            <button
              type="submit"
              className="flex h-10 items-center gap-2 rounded-[9px] border border-line bg-surface px-4 text-sm font-medium text-ink"
            >
              <LogOut size={15} aria-hidden="true" />
              Çıkış yap
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
