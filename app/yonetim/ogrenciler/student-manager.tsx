"use client";

import { Plus, Search } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import {
  addStudentAction,
  deleteStudentAction,
  setStudentDaysAction,
  updateStudentAction,
} from "@/app/yonetim/ogrenciler/actions";
import type { AdminStudentRow, HeadTeacherOption } from "@/app/yonetim/ogrenciler/data";
import { Avatar, ColorDot } from "@/components/avatar";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { WEEKDAY_LONG, WEEKDAY_SHORT } from "@/lib/date";

type EditState = { fullName: string; className: string; headTeacherId: string; days: number[] };

function toEditState(s: AdminStudentRow): EditState {
  return { fullName: s.fullName, className: s.className, headTeacherId: s.headTeacherId, days: s.days };
}

export function StudentManager({
  initialStudents,
  headTeachers,
}: {
  initialStudents: AdminStudentRow[];
  headTeachers: HeadTeacherOption[];
}) {
  const [students, setStudents] = useState(initialStudents);
  const [selectedId, setSelectedId] = useState<string | null>(initialStudents[0]?.id ?? null);
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [edit, setEdit] = useState<EditState | null>(
    initialStudents[0] ? toEditState(initialStudents[0]) : null,
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selected = selectedId ? students.find((s) => s.id === selectedId) : undefined;

  // Seçim değiştiğinde düzenleme formunu sıfırla. Bu, React'ın render
  // sırasında önceki render bilgisini saklama deseni: bir efekte gerek
  // kalmadan, ekstra render turu olmadan yapılır.
  const [editedForId, setEditedForId] = useState(selectedId);
  if (selectedId !== editedForId) {
    setEditedForId(selectedId);
    setEdit(selected ? toEditState(selected) : null);
  }

  const shown = useMemo(() => {
    let list = students;
    if (filter !== "all") list = list.filter((s) => s.headTeacherId === filter);
    const q = query.trim().toLocaleLowerCase("tr");
    if (q) list = list.filter((s) => s.fullName.toLocaleLowerCase("tr").includes(q));
    return list;
  }, [students, filter, query]);

  const dirty =
    !!selected &&
    !!edit &&
    (edit.fullName !== selected.fullName ||
      edit.className !== selected.className ||
      edit.headTeacherId !== selected.headTeacherId ||
      edit.days.join(",") !== selected.days.join(","));

  function toggleDay(weekday: number) {
    if (!edit) return;
    const has = edit.days.includes(weekday);
    setEdit({ ...edit, days: has ? edit.days.filter((d) => d !== weekday) : [...edit.days, weekday].sort((a, b) => a - b) });
  }

  function addStudent() {
    const headTeacherId = headTeachers[0]?.id;
    if (!headTeacherId) return;
    startTransition(async () => {
      const { id } = await addStudentAction(headTeacherId);
      const headTeacher = headTeachers[0];
      const newStudent: AdminStudentRow = {
        id,
        fullName: "Yeni öğrenci",
        className: "5-A",
        headTeacherId,
        headTeacherName: `${headTeacher.firstName} ${headTeacher.lastName}`,
        assistantNames: "",
        isActive: true,
        days: [],
      };
      setStudents((prev) => [newStudent, ...prev]);
      setSelectedId(id);
      setFilter("all");
    });
  }

  function save() {
    if (!selected || !edit) return;
    const headTeacher = headTeachers.find((h) => h.id === edit.headTeacherId);
    startTransition(async () => {
      await updateStudentAction(selected.id, {
        fullName: edit.fullName,
        className: edit.className,
        headTeacherId: edit.headTeacherId,
      });
      await setStudentDaysAction(selected.id, edit.days);
      setStudents((prev) =>
        prev.map((s) =>
          s.id === selected.id
            ? {
                ...s,
                fullName: edit.fullName,
                className: edit.className,
                headTeacherId: edit.headTeacherId,
                headTeacherName: headTeacher ? `${headTeacher.firstName} ${headTeacher.lastName}` : s.headTeacherName,
                days: edit.days,
              }
            : s,
        ),
      );
    });
  }

  function confirmDelete() {
    if (!confirmDeleteId) return;
    startTransition(async () => {
      await deleteStudentAction(confirmDeleteId);
      setStudents((prev) => prev.map((s) => (s.id === confirmDeleteId ? { ...s, isActive: false } : s)));
      setConfirmDeleteId(null);
    });
  }

  const deletingStudent = confirmDeleteId ? students.find((s) => s.id === confirmDeleteId) : undefined;

  return (
    <div className="flex flex-1 flex-wrap items-stretch">
      <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-[18px] p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="m-0 text-[28px] font-semibold tracking-[-0.03em]">Öğrenciler</h1>
            <p className="mt-1.5 text-ink-2">
              Öğrencileri baş öğretmenlere atayın, sınıf ve etüt günlerini düzenleyin. Asistan, baş
              öğretmen üzerinden otomatik belirlenir.
            </p>
          </div>
          <button
            type="button"
            onClick={addStudent}
            disabled={isPending || headTeachers.length === 0}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-[9px] bg-accent px-3.5 text-[13px] font-medium text-white disabled:opacity-60"
          >
            <Plus size={15} aria-hidden="true" />
            Öğrenci ekle
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <label htmlFor="s-ara" className="sr-only">
              Öğrenci ara
            </label>
            <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              id="s-ara"
              type="search"
              placeholder="Öğrenci ara"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 w-56 rounded-[9px] border border-line bg-sunken pl-8 pr-2.5 text-[13px] text-ink outline-none focus:border-accent"
            />
          </div>
          <div className="inline-flex gap-0.5 rounded-[10px] border border-line bg-sunken p-[3px]">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={
                "h-[30px] rounded-[7px] border-0 px-2.5 text-xs font-medium " +
                (filter === "all" ? "bg-surface text-ink shadow-[0_0_0_1px_var(--line)]" : "bg-transparent text-muted")
              }
            >
              Tümü
            </button>
            {headTeachers.map((ht) => (
              <button
                key={ht.id}
                type="button"
                onClick={() => setFilter(ht.id)}
                className={
                  "h-[30px] rounded-[7px] border-0 px-2.5 text-xs font-medium " +
                  (filter === ht.id ? "bg-surface text-ink shadow-[0_0_0_1px_var(--line)]" : "bg-transparent text-muted")
                }
              >
                {ht.firstName} {ht.lastName}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[14px] border border-line">
          {shown.length === 0 ? (
            <p className="px-4 py-10 text-center text-ink-2">Eşleşen öğrenci bulunamadı.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse">
                <thead>
                  <tr className="bg-surface-2 text-left text-xs text-muted">
                    <th className="px-4 py-2.5 font-medium">Öğrenci</th>
                    <th className="px-3 py-2.5 font-medium">Sınıf</th>
                    <th className="px-3 py-2.5 font-medium">Baş öğretmen</th>
                    <th className="px-3 py-2.5 font-medium">Asistan</th>
                    <th className="px-4 py-2.5 font-medium">Etüt günleri</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((s) => (
                    <tr key={s.id} className={"border-t border-line " + (s.id === selectedId ? "bg-accent-soft" : "")}>
                      <td className="px-4 py-2.5">
                        <button
                          type="button"
                          onClick={() => setSelectedId(s.id)}
                          className="flex cursor-pointer items-center gap-3 border-0 bg-transparent p-0 text-left text-sm font-medium text-ink"
                        >
                          <Avatar name={s.fullName} colorId={s.headTeacherId} size={32} />
                          {s.fullName}
                          {!s.isActive ? (
                            <span className="rounded-[5px] bg-sunken px-1.5 py-0.5 text-[11px] font-medium text-muted">
                              Pasif
                            </span>
                          ) : null}
                        </button>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[13px]">{s.className}</td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-[7px] bg-sunken px-2.5 py-1 text-xs font-medium">
                          <ColorDot colorId={s.headTeacherId} />
                          {s.headTeacherName}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-[13px] text-ink-2">{s.assistantNames || "—"}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-ink-2">
                        {s.days.map((d) => WEEKDAY_SHORT[d]).join(" · ") || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selected && edit ? (
        <aside
          aria-label="Öğrenciyi düzenle"
          className="box-border flex max-w-full flex-[1_1_320px] flex-col gap-[18px] border-l border-line bg-surface-2 p-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="m-0 text-base font-semibold">Öğrenciyi düzenle</h2>
            {!selected.isActive ? (
              <span className="rounded-[5px] bg-sunken px-1.5 py-0.5 text-[11px] font-medium text-muted">
                Pasif
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="e-ad" className="text-[13px] font-medium">
              Ad soyad
            </label>
            <input
              id="e-ad"
              type="text"
              value={edit.fullName}
              onChange={(e) => setEdit({ ...edit, fullName: e.target.value })}
              className="h-[42px] rounded-[10px] border border-line-2 bg-surface px-3 text-sm text-ink outline-none focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex min-w-0 flex-col gap-1.5">
              <label htmlFor="e-sinif" className="text-[13px] font-medium">
                Sınıf
              </label>
              <input
                id="e-sinif"
                type="text"
                value={edit.className}
                onChange={(e) => setEdit({ ...edit, className: e.target.value })}
                className="h-[42px] rounded-[10px] border border-line-2 bg-surface px-2.5 text-sm font-medium text-ink outline-none focus:border-accent"
              />
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <label htmlFor="e-bas" className="text-[13px] font-medium">
                Baş öğretmen
              </label>
              <select
                id="e-bas"
                value={edit.headTeacherId}
                onChange={(e) => setEdit({ ...edit, headTeacherId: e.target.value })}
                className="h-[42px] rounded-[10px] border border-line-2 bg-surface px-2.5 text-sm font-medium text-ink"
              >
                {headTeachers.map((ht) => (
                  <option key={ht.id} value={ht.id}>
                    {ht.firstName} {ht.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-[10px] bg-accent-soft px-3 py-2.5 text-[13px] leading-relaxed text-accent-text">
            Kayıtları{" "}
            <strong>
              {headTeachers.find((h) => h.id === edit.headTeacherId)?.assistantNames || "henüz atanmamış asistan"}
            </strong>{" "}
            girecek (baş öğretmenin asistanı).
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-[13px] font-medium">Etüt günleri</div>
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAY_SHORT.map((label, di) => {
                const on = edit.days.includes(di);
                return (
                  <button
                    key={di}
                    type="button"
                    aria-pressed={on}
                    aria-label={WEEKDAY_LONG[di]}
                    onClick={() => toggleDay(di)}
                    className={
                      "h-10 rounded-[9px] border-0 text-xs font-medium " +
                      (on ? "bg-accent text-white" : "border border-line bg-surface text-ink-2")
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grow" />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmDeleteId(selected.id)}
              disabled={isPending || !selected.isActive}
              className="h-10 rounded-[9px] border border-warn-line bg-transparent px-3 text-[13px] font-medium text-warn-text disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sil
            </button>
            <button
              type="button"
              onClick={save}
              disabled={isPending || !dirty}
              className="h-10 flex-1 rounded-[9px] bg-accent text-[13px] font-medium text-white disabled:opacity-50"
            >
              {isPending ? "Kaydediliyor…" : "Değişiklikleri kaydet"}
            </button>
          </div>
        </aside>
      ) : null}

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Öğrenciyi sil"
        description={
          deletingStudent
            ? `${deletingStudent.fullName} aktif listelerden kaldırılacak. Geçmiş etüt kayıtları korunur. Bu işlem geri alınamaz.`
            : ""
        }
        pending={isPending}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
