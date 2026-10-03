import { UserX } from "lucide-react";
import Link from "next/link";

export default function OgrenciNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="flex max-w-sm flex-col items-center gap-3 rounded-2xl border border-line bg-surface p-8 text-center shadow-[var(--shadow-panel)]">
        <UserX className="text-muted" size={28} aria-hidden="true" />
        <h1 className="text-lg font-semibold">Öğrenci bulunamadı</h1>
        <p className="text-ink-2">
          Bu öğrenci mevcut değil veya görüntüleme yetkiniz yok.
        </p>
        <Link
          href="/etut"
          className="mt-1 flex h-10 items-center rounded-[9px] bg-accent px-4 text-sm font-medium text-white no-underline transition hover:opacity-90 active:scale-[0.98] active:opacity-80"
        >
          Etüt listesine dön
        </Link>
      </div>
    </div>
  );
}
