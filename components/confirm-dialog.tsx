"use client";

import { useEffect, useRef } from "react";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Sil",
  cancelLabel = "Vazgeç",
  pending,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onClose={onCancel}
      className="m-auto w-[min(400px,calc(100vw-32px))] rounded-2xl border border-line bg-surface p-0 text-ink backdrop:bg-black/40"
    >
      <div className="p-6">
        <h2 className="m-0 text-lg font-semibold">{title}</h2>
        <p className="mt-2 leading-relaxed text-ink-2">{description}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 rounded-[9px] border border-line bg-surface px-4 text-sm font-medium text-ink"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="h-10 rounded-[9px] bg-warn px-4 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
