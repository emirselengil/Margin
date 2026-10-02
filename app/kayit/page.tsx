import { AuthHeader } from "@/components/auth/auth-header";
import { SignUpForm } from "@/components/auth/sign-up-form";

export default function KayitPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <AuthHeader prompt="Zaten hesabınız var mı?" linkHref="/giris" linkLabel="Giriş yap" />

      <main className="flex flex-1 items-center justify-center px-4 py-6">
        <div className="flex w-full max-w-[480px] flex-col gap-6 rounded-[18px] border border-line bg-surface p-8 shadow-[var(--shadow-panel)] sm:p-9">
          <h1 className="text-[26px] font-semibold tracking-[-0.03em]">
            Öğretmen hesabı oluşturun
          </h1>

          <SignUpForm />
        </div>
      </main>
    </div>
  );
}
