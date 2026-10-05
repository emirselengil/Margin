"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { setHeadTeacherNoteAction } from "@/app/ogrencilerim/actions";

/** Baş öğretmenin etüt kaydına yazdığı not: gösterir, ekler, düzenler. */
export function HeadTeacherNoteEditor({
  studentId,
  dateISO,
  initialNote,
}: {
  studentId: string;
  dateISO: string;
  initialNote: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(initialNote ?? "");
  const [draft, setDraft] = useState(initialNote ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputId = `bas-not-${dateISO}`;

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await setHeadTeacherNoteAction(studentId, dateISO, draft);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setSaved(draft.trim());
      setEditing(false);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <div className="mt-2.5 flex flex-col gap-2 rounded-[10px] border border-line bg-surface-2 p-3">
        <label htmlFor={inputId} className="text-xs font-medium text-ink-2">
          Baş öğretmen notu
        </label>
        <textarea
          id={inputId}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          maxLength={1000}
          className="w-full resize-y rounded-[9px] border border-line-2 bg-surface px-3 py-2 text-sm text-ink"
        />
        {error ? (
          <p role="alert" className="m-0 text-[13px] font-medium text-warn-text">
            {error}
          </p>
        ) : null}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={save}
            disabled={isPending}
            className="h-9 cursor-pointer rounded-[9px] bg-accent px-3.5 text-[13px] font-medium text-white transition hover:opacity-90 active:scale-[0.98] disabled:cursor-default disabled:opacity-60"
          >
            Kaydet
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(saved);
              setError(null);
              setEditing(false);
            }}
            disabled={isPending}
            className="h-9 cursor-pointer rounded-[9px] border border-line bg-surface px-3.5 text-[13px] font-medium text-ink-2 transition-colors hover:bg-sunken active:bg-line disabled:opacity-60"
          >
            Vazgeç
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2.5">
      {saved ? (
        <div className="rounded-[10px] border border-line bg-accent-soft px-3 py-2">
          <div className="text-xs font-medium text-accent-text">Baş öğretmen notu</div>
          <p className="m-0 mt-1 whitespace-pre-wrap leading-relaxed text-ink">{saved}</p>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => {
          setDraft(saved);
          setEditing(true);
        }}
        className="mt-1.5 inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-[9px] border border-line bg-surface px-3 text-[13px] font-medium text-ink-2 transition-colors hover:bg-sunken hover:text-ink active:bg-line"
      >
        <Pencil size={13} aria-hidden="true" />
        {saved ? "Notu düzenle" : "Not ekle"}
      </button>
    </div>
  );
}
