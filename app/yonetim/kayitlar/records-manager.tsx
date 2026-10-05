"use client";

import { Check, Pencil, StickyNote, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import {
  adminDeleteRecordAction,
  adminSetAttendanceAction,
  adminSetBookAction,
  adminSetHomeworkAction,
  adminUpdateNoteAction,
} from "@/app/yonetim/kayitlar/actions";
import type { AdminRecordRow, HeadTeacherOption, RecordFilters } from "@/app/yonetim/kayitlar/data";
import { setHeadTeacherNoteAction } from "@/app/ogrencilerim/actions";
import { Avatar } from "@/components/avatar";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { StatusToggle } from "@/components/status-toggle";
import { formatBadgeDate } from "@/lib/date";

const HOMEWORK_OPTIONS = [
  { value: "done", label: "Yapıldı", tone: "pos" },
  { value: "missing", label: "Eksik", tone: "neg" },
] as const;

const ATTENDANCE_OPTIONS = [
  { value: "came", label: "Geldi", tone: "pos" },
  { value: "absent", label: "Gelmedi", tone: "neg" },
] as const;

const BOOK_OPTIONS = [
  { value: "brought", label: "Getirdi", tone: "pos" },
  { value: "not_brought", label: "Getirmedi", tone: "neg" },
] as const;

export function RecordsManager({
  initialRecords,
  headTeachers,
  initialFilters,
}: {
  initialRecords: AdminRecordRow[];
  headTeachers: HeadTeacherOption[];
  initialFilters: RecordFilters;
}) {
  const router = useRouter();
  const [records, setRecords] = useState(initialRecords);
  const [from, setFrom] = useState(initialFilters.from);
  const [to, setTo] = useState(initialFilters.to);
  const [headTeacherId, setHeadTeacherId] = useState("all");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [editingHeadNoteId, setEditingHeadNoteId] = useState<string | null>(null);
  const [headNoteDraft, setHeadNoteDraft] = useState("");
  const [headNoteError, setHeadNoteError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const shown = useMemo(() => {
    let list = records;
    if (headTeacherId !== "all") list = list.filter((r) => r.headTeacherId === headTeacherId);
    if (onlyMissing) list = list.filter((r) => r.homework === "missing" || r.book === "not_brought");
    return list;
  }, [records, headTeacherId, onlyMissing]);

  function applyDateRange() {
    const params = new URLSearchParams({ from, to });
    router.push(`/yonetim/kayitlar?${params.toString()}`);
  }

  function setHomework(r: AdminRecordRow, value: "done" | "missing") {
    setRecords((prev) => prev.map((x) => (x.id === r.id ? { ...x, homework: value, editedByAdmin: true } : x)));
    startTransition(async () => {
      await adminSetHomeworkAction(r.id, value);
    });
  }

  function setAttendance(r: AdminRecordRow, value: "came" | "absent") {
    setRecords((prev) => prev.map((x) => (x.id === r.id ? { ...x, attendance: value, editedByAdmin: true } : x)));
    startTransition(async () => {
      await adminSetAttendanceAction(r.id, value);
    });
  }

  function setBook(r: AdminRecordRow, value: "brought" | "not_brought") {
    setRecords((prev) => prev.map((x) => (x.id === r.id ? { ...x, book: value, editedByAdmin: true } : x)));
    startTransition(async () => {
      await adminSetBookAction(r.id, value);
    });
  }

  function startEditNote(r: AdminRecordRow) {
    setEditingNoteId(r.id);
    setNoteDraft(r.note ?? "");
  }

  function saveNote(r: AdminRecordRow) {
    const note = noteDraft.trim() || null;
    setRecords((prev) => prev.map((x) => (x.id === r.id ? { ...x, note, editedByAdmin: true } : x)));
    setEditingNoteId(null);
    startTransition(async () => {
      await adminUpdateNoteAction(r.id, note);
    });
  }

  function startEditHeadNote(r: AdminRecordRow) {
    setEditingNoteId(null);
    setHeadNoteError(null);
    setEditingHeadNoteId(r.id);
    setHeadNoteDraft(r.headTeacherNote ?? "");
  }

  function saveHeadNote(r: AdminRecordRow) {
    const note = headNoteDraft.trim() || null;
    startTransition(async () => {
      const result = await setHeadTeacherNoteAction(r.studentId, r.date, note);
      if (!result.ok) {
        setHeadNoteError(result.message);
        return;
      }
      setRecords((prev) => prev.map((x) => (x.id === r.id ? { ...x, headTeacherNote: note } : x)));
      setEditingHeadNoteId(null);
      setHeadNoteError(null);
    });
  }

  function confirmDelete() {
    if (!confirmDeleteId) return;
    startTransition(async () => {
      await adminDeleteRecordAction(confirmDeleteId);
      setRecords((prev) => prev.filter((x) => x.id !== confirmDeleteId));
      setConfirmDeleteId(null);
    });
  }

  return (
    <div className="flex flex-col gap-[18px] p-6 pb-10">
      <div>
        <h1 className="m-0 text-[28px] font-semibold tracking-[-0.03em]">Etüt kayıtları</h1>
        <p className="mt-1.5 text-ink-2">
          Tüm kayıtları görüntüleyin, düzeltin veya silin. Yöneticinin yaptığı her değişiklik kayıt
          geçmişine yazılır.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="from-date">
          Başlangıç tarihi
        </label>
        <input
          id="from-date"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="h-9 rounded-[9px] border border-line bg-surface px-2.5 font-mono text-[13px] text-ink"
        />
        <span className="text-muted">–</span>
        <label className="sr-only" htmlFor="to-date">
          Bitiş tarihi
        </label>
        <input
          id="to-date"
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="h-9 rounded-[9px] border border-line bg-surface px-2.5 font-mono text-[13px] text-ink"
        />
        <button
          type="button"
          onClick={applyDateRange}
          className="h-9 cursor-pointer rounded-[9px] border border-line bg-surface px-3 text-[13px] font-medium text-ink transition-colors hover:bg-sunken hover:border-line-2 active:bg-line"
        >
          Uygula
        </button>

        <div className="inline-flex gap-0.5 rounded-[10px] border border-line bg-sunken p-[3px]">
          <button
            type="button"
            onClick={() => setHeadTeacherId("all")}
            className={
              "h-[30px] cursor-pointer rounded-[7px] border-0 px-2.5 text-xs font-medium transition-colors " +
              (headTeacherId === "all"
                ? "bg-surface text-ink shadow-[0_0_0_1px_var(--line)]"
                : "bg-transparent text-muted hover:text-ink active:bg-line")
            }
          >
            Tümü
          </button>
          {headTeachers.map((ht) => (
            <button
              key={ht.id}
              type="button"
              onClick={() => setHeadTeacherId(ht.id)}
              className={
                "h-[30px] cursor-pointer rounded-[7px] border-0 px-2.5 text-xs font-medium transition-colors " +
                (headTeacherId === ht.id
                  ? "bg-surface text-ink shadow-[0_0_0_1px_var(--line)]"
                  : "bg-transparent text-muted hover:text-ink active:bg-line")
              }
            >
              {ht.firstName} {ht.lastName}
            </button>
          ))}
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={onlyMissing}
          onClick={() => setOnlyMissing((v) => !v)}
          className="flex h-9 cursor-pointer items-center gap-2 rounded-[9px] border border-line bg-surface px-2.5 text-[13px] font-medium text-ink transition-colors hover:bg-sunken hover:border-line-2 active:bg-line"
        >
          <span
            className="flex h-[18px] w-[30px] items-center rounded-full p-0.5"
            style={{ justifyContent: onlyMissing ? "flex-end" : "flex-start", background: onlyMissing ? "var(--accent)" : "var(--line-2)" }}
          >
            <span className="h-3.5 w-3.5 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.25)]" />
          </span>
          Yalnızca eksikler
        </button>

        <span className="ml-auto font-mono text-[13px] text-muted">{shown.length} kayıt</span>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-line">
        {shown.length === 0 ? (
          <p className="px-4 py-10 text-center text-ink-2">Bu filtrelerle eşleşen kayıt yok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1240px] border-collapse">
              <thead>
                <tr className="bg-surface-2 text-left text-xs text-muted">
                  <th className="px-4 py-2.5 font-medium">Tarih</th>
                  <th className="px-3 py-2.5 font-medium">Öğrenci</th>
                  <th className="px-3 py-2.5 font-medium">Katılım</th>
                  <th className="px-3 py-2.5 font-medium">Ödev</th>
                  <th className="px-3 py-2.5 font-medium">Kitap</th>
                  <th className="px-3 py-2.5 font-medium">Not</th>
                  <th className="px-3 py-2.5 font-medium">Giren</th>
                  <th className="px-4 py-2.5">
                    <span className="sr-only">İşlemler</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id} className="border-t border-line transition-colors hover:bg-surface-2">
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-ink-2">
                      {formatBadgeDate(r.date).slice(0, -5)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="flex items-center gap-2.5">
                        <Avatar name={r.studentName} colorId={r.headTeacherId} size={30} />
                        <span className="flex flex-col">
                          <span className="font-medium">{r.studentName}</span>
                          <span className="text-xs text-muted">{r.headTeacherName}</span>
                        </span>
                      </span>
                    </td>
                    <td className="py-1.5 px-3">
                      <StatusToggle
                        value={r.attendance}
                        options={ATTENDANCE_OPTIONS}
                        onSelect={(v) => setAttendance(r, v as "came" | "absent")}
                        pending={isPending}
                      />
                    </td>
                    <td className="py-1.5 px-3">
                      <StatusToggle
                        value={r.homework}
                        options={HOMEWORK_OPTIONS}
                        onSelect={(v) => setHomework(r, v as "done" | "missing")}
                        pending={isPending}
                      />
                    </td>
                    <td className="py-1.5 px-3">
                      <StatusToggle
                        value={r.book}
                        options={BOOK_OPTIONS}
                        onSelect={(v) => setBook(r, v as "brought" | "not_brought")}
                        pending={isPending}
                      />
                    </td>
                    <td className="max-w-[240px] px-3 py-2.5 text-[13px] text-ink-2">
                      {editingNoteId === r.id ? (
                        <span className="flex items-center gap-1">
                          <input
                            autoFocus
                            value={noteDraft}
                            onChange={(e) => setNoteDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveNote(r);
                              if (e.key === "Escape") setEditingNoteId(null);
                            }}
                            className="h-8 w-full rounded-md border border-line-2 bg-surface px-2 text-[13px] text-ink outline-none focus:border-accent"
                          />
                          <button
                            type="button"
                            aria-label="Kaydet"
                            onClick={() => saveNote(r)}
                            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-accent-text transition-colors hover:bg-accent-soft active:bg-accent-soft"
                          >
                            <Check size={15} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            aria-label="Vazgeç"
                            onClick={() => setEditingNoteId(null)}
                            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-sunken hover:text-ink active:bg-line"
                          >
                            <X size={15} aria-hidden="true" />
                          </button>
                        </span>
                      ) : (
                        <>
                          {r.note || "—"}
                          {editingHeadNoteId === r.id ? (
                            <span className="mt-1.5 flex flex-col gap-1">
                              <span className="flex items-center gap-1">
                                <input
                                  autoFocus
                                  aria-label="Baş öğretmen notu"
                                  value={headNoteDraft}
                                  onChange={(e) => setHeadNoteDraft(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveHeadNote(r);
                                    if (e.key === "Escape") setEditingHeadNoteId(null);
                                  }}
                                  className="h-8 w-full rounded-md border border-line-2 bg-surface px-2 text-[13px] text-ink outline-none focus:border-accent"
                                />
                                <button
                                  type="button"
                                  aria-label="Baş öğretmen notunu kaydet"
                                  onClick={() => saveHeadNote(r)}
                                  disabled={isPending}
                                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-accent-text transition-colors hover:bg-accent-soft active:bg-accent-soft disabled:opacity-60"
                                >
                                  <Check size={15} aria-hidden="true" />
                                </button>
                                <button
                                  type="button"
                                  aria-label="Baş öğretmen notundan vazgeç"
                                  onClick={() => setEditingHeadNoteId(null)}
                                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-sunken hover:text-ink active:bg-line"
                                >
                                  <X size={15} aria-hidden="true" />
                                </button>
                              </span>
                              {headNoteError ? (
                                <span role="alert" className="text-xs font-medium text-warn-text">
                                  {headNoteError}
                                </span>
                              ) : null}
                            </span>
                          ) : r.headTeacherNote ? (
                            <span className="mt-1 block text-xs text-accent-text">
                              Baş öğretmen: {r.headTeacherNote}
                            </span>
                          ) : null}
                        </>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[13px] text-ink-2">
                      {r.createdByName}
                      {r.editedByAdmin ? (
                        <span className="ml-1.5 inline-flex h-5 items-center rounded-[5px] bg-accent-soft px-1.5 text-[11px] font-medium text-accent-text">
                          düzenlendi
                        </span>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right">
                      <button
                        type="button"
                        aria-label="Notu düzenle"
                        onClick={() => startEditNote(r)}
                        className="inline-flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-lg border border-line bg-surface text-ink-2 transition-colors hover:bg-sunken hover:border-line-2 hover:text-ink active:bg-line"
                      >
                        <Pencil size={15} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label="Baş öğretmen notunu düzenle"
                        onClick={() => startEditHeadNote(r)}
                        className="ml-1 inline-flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-lg border border-line bg-surface text-ink-2 transition-colors hover:bg-sunken hover:border-line-2 hover:text-ink active:bg-line"
                      >
                        <StickyNote size={15} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label="Kaydı sil"
                        onClick={() => setConfirmDeleteId(r.id)}
                        className="ml-1 inline-flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-lg border border-warn-line bg-transparent text-warn-text transition-colors hover:bg-warn-soft active:opacity-70"
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Kaydı sil"
        description="Bu etüt kaydı kalıcı olarak silinecek. Bu işlem geri alınamaz."
        pending={isPending}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
