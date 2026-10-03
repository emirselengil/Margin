"use client";

import { useEffect, useRef, useState } from "react";

export function EditStudentDialog({
  open,
  initialFullName,
  initialClassName,
  initialHeadTeacherId,
  headTeacherOptions,
  pending,
  error,
  onSubmit,
  onCancel,
}: {
  open: boolean;
  initialFullName: string;
  initialClassName: string;
  initialHeadTeacherId: string;
  headTeacherOptions: { id: string; name: string }[];
  pending?: boolean;
  error?: string | null;
  onSubmit: (data: { fullName: string; className: string; headTeacherId: string }) => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [fullName, setFullName] = useState(initialFullName);
  const [className, setClassName] = useState(initialClassName);
  const [headTeacherId, setHeadTeacherId] = useState(initialHeadTeacherId);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      setFullName(initialFullName);
      setClassName(initialClassName);
      setHeadTeacherId(initialHeadTeacherId);
      el.showModal();
    }
    if (!open && el.open) el.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function submit() {
    if (!fullName.trim() || !className.trim() || !headTeacherId) return;
    onSubmit({ fullName: fullName.trim(), className: className.trim(), headTeacherId });
  }

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onClose={onCancel}
      className="m-auto w-[min(420px,calc(100vw-32px))] rounded-2xl border border-line bg-surface p-0 text-ink backdrop:bg-black/40"
    >
      <form
        className="flex flex-col gap-4 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <h2 className="m-0 text-lg font-semibold">Öğrenciyi düzenle</h2>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="es-ad" className="text-[13px] font-medium">
            Ad soyad
          </label>
          <input
            id="es-ad"
            type="text"
            autoFocus
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="h-11 rounded-[10px] border border-line-2 bg-surface px-3 text-sm text-ink outline-none focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="es-sinif" className="text-[13px] font-medium">
            Sınıf
          </label>
          <input
            id="es-sinif"
            type="text"
            required
            placeholder="örn. 7-B"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className="h-11 rounded-[10px] border border-line-2 bg-surface px-3 text-sm text-ink outline-none focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="es-ogretmen" className="text-[13px] font-medium">
            Öğretmen
          </label>
          <select
            id="es-ogretmen"
            value={headTeacherId}
            onChange={(e) => setHeadTeacherId(e.target.value)}
            className="h-11 rounded-[10px] border border-line-2 bg-surface px-3 text-sm font-medium text-ink"
          >
            {headTeacherOptions.map((ht) => (
              <option key={ht.id} value={ht.id}>
                {ht.name}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <p role="alert" className="m-0 text-[13px] font-medium text-warn-text">
            {error}
          </p>
        ) : null}

        <div className="mt-1 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 cursor-pointer rounded-[9px] border border-line bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-sunken hover:border-line-2 active:bg-line"
          >
            Vazgeç
          </button>
          <button
            type="submit"
            disabled={pending}
            className="h-10 cursor-pointer rounded-[9px] bg-accent px-4 text-sm font-medium text-white transition hover:opacity-90 active:scale-[0.98] active:opacity-80 disabled:cursor-default disabled:opacity-60"
          >
            {pending ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
