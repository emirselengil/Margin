"use client";

import { AlertTriangle } from "lucide-react";

export default function EtutError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="flex max-w-sm flex-col items-center gap-3 rounded-2xl border border-line bg-surface p-8 text-center shadow-[var(--shadow-panel)]">
        <AlertTriangle className="text-warn-text" size={28} aria-hidden="true" />
        <h1 className="text-lg font-semibold">Bir şeyler ters gitti</h1>
        <p className="text-ink-2">Etüt listesi yüklenirken bir hata oluştu. Tekrar deneyebilirsiniz.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-1 h-10 cursor-pointer rounded-[9px] bg-accent px-4 text-sm font-medium text-white transition hover:opacity-90 active:scale-[0.98] active:opacity-80"
        >
          Tekrar dene
        </button>
      </div>
    </div>
  );
}
