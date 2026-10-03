"use client";

import { Check, Plus } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import { addStudentAction, saveStudyDaysAction } from "@/app/gruplar/actions";
import type { StudentWithDays } from "@/app/gruplar/data";
import { AddStudentDialog } from "@/components/add-student-dialog";
import { Avatar, ColorDot } from "@/components/avatar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { WEEKDAY_LONG, WEEKDAY_SHORT } from "@/lib/date";

export function GroupGrid({
  initialStudents,
  headTeachers,
  allHeadTeachers,
}: {
  initialStudents: StudentWithDays[];
  headTeachers: { id: string; name: string }[];
  /** Yeni öğrenci eklerken seçilebilecek tüm baş öğretmenler (yalnızca bağlı olanlar değil). */
  allHeadTeachers: { id: string; name: string }[];
}) {
  const [students, setStudents] = useState(initialStudents);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<string>("all");
  const [pending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addPending, setAddPending] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const shown = useMemo(
    () => (filter === "all" ? students : students.filter((s) => s.headTeacherId === filter)),
    [students, filter],
  );

  const totals = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    for (const s of shown) for (const d of s.days) counts[d]++;
    return counts;
  }, [shown]);

  function toggleDay(studentId: string, weekday: number) {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        const has = s.days.includes(weekday);
        return { ...s, days: has ? s.days.filter((d) => d !== weekday) : [...s.days, weekday].sort((a, b) => a - b) };
      }),
    );
    setDirtyIds((prev) => new Set(prev).add(studentId));
  }

  function save() {
    setSaveError(null);
    const changes = Array.from(dirtyIds).map((studentId) => ({
      studentId,
      weekdays: students.find((s) => s.id === studentId)?.days ?? [],
    }));
    startTransition(async () => {
      try {
        await saveStudyDaysAction(changes);
        setDirtyIds(new Set());
      } catch {
        setSaveError("Kaydedilemedi, lütfen tekrar deneyin.");
      }
    });
  }

  const dirty = dirtyIds.size > 0;

  function addStudent(data: { fullName: string; className: string; headTeacherId: string }) {
    setAddPending(true);
    setAddError(null);
    startTransition(async () => {
      try {
        const { id } = await addStudentAction(data.headTeacherId, data.fullName, data.className);
        const headTeacher = allHeadTeachers.find((h) => h.id === data.headTeacherId);
        setStudents((prev) => [
          ...prev,
          {
            id,
            fullName: data.fullName,
            className: data.className,
            headTeacherId: data.headTeacherId,
            headTeacherName: headTeacher?.name ?? "",
            days: [],
          },
        ]);
        setFilter("all");
        setAddOpen(false);
      } catch {
        setAddError("Öğrenci eklenemedi, lütfen tekrar deneyin.");
      } finally {
        setAddPending(false);
      }
    });
  }

  return (
    <>
      <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-2">
        <span className="font-medium">Gün grupları</span>
        <div className="flex items-center gap-2.5">
          {saveError ? <span className="text-[13px] font-medium text-warn-text">{saveError}</span> : null}
          {dirty ? (
            <span className="flex h-7 items-center gap-1.5 rounded-[7px] bg-warn-soft px-2.5 text-xs font-medium text-warn-text">
              <span className="h-1.5 w-1.5 rounded-full bg-warn-text" />
              Kaydedilmemiş değişiklik
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            disabled={allHeadTeachers.length === 0}
            className="flex h-9 cursor-pointer items-center gap-1.5 rounded-[9px] border border-line bg-surface px-3 text-[13px] font-medium text-ink transition-colors hover:bg-sunken hover:border-line-2 active:bg-line disabled:cursor-default disabled:opacity-50"
          >
            <Plus size={15} aria-hidden="true" />
            Öğrenci ekle
          </button>
          <ThemeToggle />
          <button
            type="button"
            onClick={save}
            disabled={!dirty || pending}
            className="flex h-9 cursor-pointer items-center rounded-[9px] bg-accent px-4 font-medium text-white transition hover:opacity-90 active:scale-[0.98] active:opacity-80 disabled:cursor-default disabled:opacity-50 disabled:hover:opacity-50"
          >
            {pending ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-[22px] px-6 py-6 pb-10">
        <div className="flex flex-wrap items-stretch gap-5">
          <div className="flex-[1_1_320px]">
            <div className="font-mono text-xs font-medium uppercase tracking-[0.06em] text-accent-text">
              Haftalık plan
            </div>
            <h1 className="mt-1.5 text-[30px] font-semibold tracking-[-0.03em]">Kim hangi gün geliyor?</h1>
            <p className="mt-2 max-w-[460px] leading-relaxed text-ink-2">
              Kutulara tıklayarak etüt günlerini belirleyin. Etüt listesi her gün bu plana göre
              oluşur.
            </p>
            <div className="mt-4 inline-flex gap-0.5 rounded-[10px] border border-line bg-sunken p-[3px]">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={
                  "h-[34px] cursor-pointer rounded-[7px] border-0 px-3 text-[13px] font-medium transition-colors " +
                  (filter === "all"
                    ? "bg-surface text-ink shadow-[0_0_0_1px_var(--line)]"
                    : "bg-transparent text-muted hover:text-ink active:bg-line")
                }
              >
                Tümü · {students.length}
              </button>
              {headTeachers.map((ht) => (
                <button
                  key={ht.id}
                  type="button"
                  onClick={() => setFilter(ht.id)}
                  className={
                    "h-[34px] cursor-pointer rounded-[7px] border-0 px-3 text-[13px] font-medium transition-colors " +
                    (filter === ht.id
                      ? "bg-surface text-ink shadow-[0_0_0_1px_var(--line)]"
                      : "bg-transparent text-muted hover:text-ink active:bg-line")
                  }
                >
                  {ht.name} · {students.filter((s) => s.headTeacherId === ht.id).length}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-[1_1_380px] flex-col gap-2.5 rounded-[14px] border border-line bg-surface-2 p-4">
            <div className="flex justify-between text-[13px]">
              <span className="font-semibold">Günlük yoğunluk</span>
              <span className="text-muted">öğrenci sayısı</span>
            </div>
            <div className="grid min-h-[120px] flex-1 grid-cols-7 items-end gap-2.5">
              {WEEKDAY_SHORT.map((label, i) => (
                <div key={label} className="flex h-full flex-col items-center justify-end gap-1.5">
                  <span className="font-mono text-xs font-medium">{totals[i]}</span>
                  <span
                    className="w-full max-w-[34px] rounded-md"
                    style={{
                      background: totals[i] ? "var(--accent)" : "var(--line)",
                      height: Math.max(4, totals[i] * 13),
                    }}
                  />
                  <span className="font-mono text-[11px] font-medium text-muted">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {shown.length === 0 ? (
          <div className="rounded-[14px] border border-line py-16 text-center text-ink-2">
            Gösterilecek öğrenci yok.
          </div>
        ) : (
          <div className="overflow-hidden rounded-[14px] border border-line">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr className="bg-surface-2 text-xs text-muted">
                    <th className="px-[18px] py-3 text-left font-medium">Öğrenci</th>
                    <th className="px-3 py-3 text-left font-medium">Baş öğretmen</th>
                    {WEEKDAY_SHORT.map((l) => (
                      <th
                        key={l}
                        className="w-[58px] px-0.5 py-3 text-center font-mono text-[11px] font-medium tracking-[0.06em]"
                      >
                        {l}
                      </th>
                    ))}
                    <th className="w-14 px-[18px] py-3 text-right font-medium">Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((s) => (
                    <tr key={s.id} className="border-t border-line">
                      <td className="px-[18px] py-2">
                        <span className="flex items-center gap-3">
                          <Avatar name={s.fullName} colorId={s.headTeacherId} size={32} />
                          <span className="flex flex-col">
                            <span className="font-medium">{s.fullName}</span>
                            <span className="font-mono text-xs text-muted">{s.className}</span>
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-2 text-ink-2">
                        <span className="inline-flex items-center gap-2">
                          <ColorDot colorId={s.headTeacherId} />
                          {s.headTeacherName}
                        </span>
                      </td>
                      {WEEKDAY_LONG.map((full, di) => {
                        const on = s.days.includes(di);
                        return (
                          <td key={di} className="px-0.5 py-1.5 text-center">
                            <button
                              type="button"
                              aria-label={`${s.fullName}, ${full}`}
                              aria-pressed={on}
                              onClick={() => toggleDay(s.id, di)}
                              className={
                                "inline-flex h-[42px] w-[42px] cursor-pointer items-center justify-center rounded-[10px] border-0 p-0 transition " +
                                (on
                                  ? "bg-accent text-white shadow-[0_2px_8px_rgba(79,70,229,0.3)] hover:opacity-85 active:opacity-70"
                                  : "border border-dashed border-line-2 bg-sunken hover:border-accent hover:bg-accent-soft active:bg-line")
                              }
                            >
                              {on ? <Check size={16} strokeWidth={3} aria-hidden="true" /> : null}
                            </button>
                          </td>
                        );
                      })}
                      <td className="px-[18px] py-2 text-right font-mono text-[13px] font-medium">
                        {s.days.length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <AddStudentDialog
        open={addOpen}
        headTeacherOptions={allHeadTeachers}
        showHeadTeacherSelect
        pending={addPending}
        error={addError}
        onSubmit={addStudent}
        onCancel={() => {
          setAddOpen(false);
          setAddError(null);
        }}
      />
    </>
  );
}
