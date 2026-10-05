"use client";

import { Check, Minus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { saveRecordAction } from "@/app/etut/actions";

type Homework = "done" | "missing";
type Book = "brought" | "not_brought";
type Attendance = "came" | "absent";

const NOTE_SHORTCUTS = ["Derse aktif katıldı", "Eksiği tamamlayacak"];

function OptionCard({
  selected,
  tone,
  title,
  subtitle,
  onClick,
}: {
  selected: boolean;
  tone: "pos" | "neg";
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  const toneClasses = !selected
    ? "border-line bg-surface text-ink hover:border-line-2 hover:bg-sunken active:bg-line"
    : tone === "pos"
      ? "border-accent bg-accent-soft text-accent-text hover:opacity-85 active:opacity-70"
      : "border-warn bg-warn-soft text-warn-text hover:opacity-85 active:opacity-70";
  const iconClasses = !selected
    ? "bg-sunken text-muted"
    : tone === "pos"
      ? "bg-accent text-white"
      : "bg-warn text-white";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[68px] cursor-pointer items-center gap-3 rounded-xl border-[1.5px] px-3.5 py-3 text-left transition active:scale-[0.98] ${toneClasses}`}
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl ${iconClasses}`}>
        {selected ? (
          tone === "pos" ? (
            <Check size={16} strokeWidth={2.8} aria-hidden="true" />
          ) : (
            <Minus size={16} strokeWidth={2.8} aria-hidden="true" />
          )
        ) : null}
      </span>
      <span className="flex flex-col items-start gap-0.5">
        <span className="text-[15px] font-semibold">{title}</span>
        <span className="text-xs" style={{ color: selected ? undefined : "var(--muted)" }}>
          {subtitle}
        </span>
      </span>
    </button>
  );
}

export function RecordForm({
  studentId,
  dateISO,
  dateLabel,
  initialHomework,
  initialBook,
  initialAttendance,
  initialNote,
  headTeacherNote,
}: {
  studentId: string;
  dateISO: string;
  dateLabel: string;
  initialHomework: Homework | null;
  initialBook: Book | null;
  initialAttendance: Attendance | null;
  initialNote: string;
  headTeacherNote: string | null;
}) {
  const router = useRouter();
  const [homework, setHomework] = useState<Homework | null>(initialHomework);
  const [book, setBook] = useState<Book | null>(initialBook);
  const [attendance, setAttendance] = useState<Attendance | null>(initialAttendance);
  const [note, setNote] = useState(initialNote);
  const [pending, startTransition] = useTransition();

  function addShortcut(text: string) {
    setNote((prev) => (prev ? `${prev}${prev.endsWith(" ") ? "" : " "}${text}` : text));
  }

  function save() {
    startTransition(async () => {
      await saveRecordAction(studentId, dateISO, { homework, book, attendance, note: note || null });
      router.push("/etut");
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line bg-surface-2 px-5 py-3.5">
        <h2 className="m-0 text-[15px] font-semibold">Bugünkü kayıt</h2>
        <span className="rounded-[7px] bg-accent-soft px-2.5 py-1 font-mono text-xs font-medium text-accent-text">
          {dateLabel}
        </span>
      </div>

      <div className="flex flex-col gap-5 p-5">
        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className="mb-2.5 font-semibold">Katılım</legend>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2.5">
            <OptionCard
              selected={attendance === "came"}
              tone="pos"
              title="Geldi"
              subtitle="Etüde katıldı"
              onClick={() => setAttendance("came")}
            />
            <OptionCard
              selected={attendance === "absent"}
              tone="neg"
              title="Gelmedi"
              subtitle="Etüde katılmadı"
              onClick={() => setAttendance("absent")}
            />
          </div>
        </fieldset>

        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className="mb-2.5 font-semibold">Ödev durumu</legend>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2.5">
            <OptionCard
              selected={homework === "done"}
              tone="pos"
              title="Yapıldı"
              subtitle="Ödevin tamamı yapılmış"
              onClick={() => setHomework("done")}
            />
            <OptionCard
              selected={homework === "missing"}
              tone="neg"
              title="Eksik"
              subtitle="Eksik kalan kısım var"
              onClick={() => setHomework("missing")}
            />
          </div>
        </fieldset>

        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className="mb-2.5 font-semibold">Kitap</legend>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2.5">
            <OptionCard
              selected={book === "brought"}
              tone="pos"
              title="Getirdi"
              subtitle="Kitabı yanında"
              onClick={() => setBook("brought")}
            />
            <OptionCard
              selected={book === "not_brought"}
              tone="neg"
              title="Getirmedi"
              subtitle="Kitabı yanında değil"
              onClick={() => setBook("not_brought")}
            />
          </div>
        </fieldset>

        <div className="flex flex-col gap-2.5">
          <label htmlFor="k-not" className="font-semibold">
            Not
          </label>
          <div className="flex flex-wrap gap-1.5">
            {NOTE_SHORTCUTS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addShortcut(s)}
                className="h-8 cursor-pointer rounded-2xl border border-line bg-surface-2 px-2.5 text-xs font-medium text-ink-2 transition-colors hover:border-line-2 hover:bg-sunken hover:text-ink active:bg-line"
              >
                + {s}
              </button>
            ))}
          </div>
          <textarea
            id="k-not"
            rows={3}
            placeholder="Öğretmen notu (isteğe bağlı)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="box-border w-full resize-y rounded-[10px] border border-line-2 bg-sunken px-3 py-2.5 font-sans text-sm leading-relaxed text-ink outline-none focus:border-accent"
          />
        </div>

        {headTeacherNote ? (
          <div className="rounded-[10px] border border-line bg-accent-soft px-3.5 py-3">
            <div className="text-xs font-medium text-accent-text">Öğretmen notu (salt okunur)</div>
            <p className="m-0 mt-1 whitespace-pre-wrap leading-relaxed text-ink">{headTeacherNote}</p>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-line bg-surface-2 px-5 py-3.5">
        <span className="text-xs text-muted">Kaydet ve sonrakine geç</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push("/etut")}
            className="flex h-[38px] cursor-pointer items-center rounded-[9px] border border-line bg-surface px-3.5 font-medium text-ink transition-colors hover:bg-sunken hover:border-line-2 active:bg-line"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="flex h-[38px] cursor-pointer items-center rounded-[9px] bg-accent px-4 font-medium text-white transition hover:opacity-90 active:scale-[0.98] active:opacity-80 disabled:cursor-default disabled:opacity-70"
          >
            {pending ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}
