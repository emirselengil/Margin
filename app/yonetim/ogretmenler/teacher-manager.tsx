"use client";

import { Check, Search, UserPlus } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import {
  approvePendingAction,
  deleteTeacherAction,
  rejectPendingAction,
  sendPasswordResetAction,
  setActiveAction,
  setAssistantLinksAction,
  setRoleAction,
} from "@/app/yonetim/ogretmenler/actions";
import type { PendingTeacher, TeacherRow } from "@/app/yonetim/ogretmenler/data";
import { Avatar } from "@/components/avatar";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { formatBadgeDate } from "@/lib/date";
import { ROLE_LABELS, type Role } from "@/lib/roles";

const ASSIGNABLE_ROLES: Exclude<Role, "pending">[] = ["assistant", "head_teacher", "admin"];
const ROLE_SHORT_LABEL: Record<Exclude<Role, "pending">, string> = {
  assistant: "Asistan",
  head_teacher: "Baş öğr.",
  admin: "Yönetici",
};

function linksText(t: TeacherRow, byId: Map<string, TeacherRow>): string {
  if (t.role === "assistant") {
    const names = t.linkedHeadTeacherIds.map((id) => byId.get(id)).filter(Boolean) as TeacherRow[];
    return names.length
      ? "Bağlı: " + names.map((n) => `${n.firstName} ${n.lastName}`).join(", ")
      : "Henüz bağlı baş öğretmen yok";
  }
  if (t.role === "head_teacher") {
    const assistants = Array.from(byId.values()).filter(
      (x) => x.role === "assistant" && x.linkedHeadTeacherIds.includes(t.id),
    );
    const names = assistants.map((a) => `${a.firstName} ${a.lastName}`).join(", ");
    return `${t.studentCount} öğrenci · ${names ? "Asistan: " + names : "Asistan atanmamış"}`;
  }
  return "Tüm verilere erişim";
}

export function TeacherManager({
  currentAdminId,
  initialPending,
  initialTeachers,
}: {
  currentAdminId: string;
  initialPending: PendingTeacher[];
  initialTeachers: TeacherRow[];
}) {
  const [pending, setPending] = useState(initialPending);
  const [teachers, setTeachers] = useState(initialTeachers);
  const [selectedId, setSelectedId] = useState<string | null>(initialTeachers[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const [pendingRoles, setPendingRoles] = useState<Record<string, Exclude<Role, "pending">>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const byId = useMemo(() => new Map(teachers.map((t) => [t.id, t])), [teachers]);
  const headTeachers = useMemo(() => teachers.filter((t) => t.role === "head_teacher"), [teachers]);
  const activeAdminCount = useMemo(
    () => teachers.filter((t) => t.role === "admin" && t.isActive).length,
    [teachers],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    if (!q) return teachers;
    return teachers.filter(
      (t) => `${t.firstName} ${t.lastName}`.toLocaleLowerCase("tr").includes(q) || t.email.toLocaleLowerCase("tr").includes(q),
    );
  }, [teachers, query]);

  const selected = selectedId ? byId.get(selectedId) : undefined;
  const isSelf = selected?.id === currentAdminId;
  const isLastActiveAdmin = Boolean(selected?.role === "admin" && selected.isActive && activeAdminCount <= 1);

  function approve(p: PendingTeacher) {
    const role = pendingRoles[p.id] ?? "assistant";
    startTransition(async () => {
      await approvePendingAction(p.id, role);
      setPending((prev) => prev.filter((x) => x.id !== p.id));
      setTeachers((prev) => [
        ...prev,
        { id: p.id, firstName: p.firstName, lastName: p.lastName, email: p.email, role, isActive: true, linkedHeadTeacherIds: [], studentCount: 0 },
      ]);
      setSelectedId(p.id);
    });
  }

  function reject(p: PendingTeacher) {
    startTransition(async () => {
      await rejectPendingAction(p.id);
      setPending((prev) => prev.filter((x) => x.id !== p.id));
    });
  }

  function changeRole(role: Exclude<Role, "pending">) {
    if (!selected) return;
    startTransition(async () => {
      await setRoleAction(selected.id, role);
      setTeachers((prev) =>
        prev.map((t) => (t.id === selected.id ? { ...t, role, linkedHeadTeacherIds: role === "assistant" ? t.linkedHeadTeacherIds : [] } : t)),
      );
    });
  }

  function toggleActive() {
    if (!selected) return;
    const next = !selected.isActive;
    startTransition(async () => {
      await setActiveAction(selected.id, next);
      setTeachers((prev) => prev.map((t) => (t.id === selected.id ? { ...t, isActive: next } : t)));
    });
  }

  function toggleLink(headTeacherId: string) {
    if (!selected) return;
    const on = selected.linkedHeadTeacherIds.includes(headTeacherId);
    const next = on
      ? selected.linkedHeadTeacherIds.filter((id) => id !== headTeacherId)
      : [...selected.linkedHeadTeacherIds, headTeacherId];
    setTeachers((prev) => prev.map((t) => (t.id === selected.id ? { ...t, linkedHeadTeacherIds: next } : t)));
    startTransition(async () => {
      await setAssistantLinksAction(selected.id, next);
    });
  }

  function requestPasswordReset() {
    if (!selected) return;
    setResetMessage(null);
    startTransition(async () => {
      const res = await sendPasswordResetAction(selected.email);
      setResetMessage(res.message);
    });
  }

  function confirmDelete() {
    if (!confirmDeleteId) return;
    startTransition(async () => {
      await deleteTeacherAction(confirmDeleteId);
      setTeachers((prev) => prev.map((t) => (t.id === confirmDeleteId ? { ...t, isActive: false } : t)));
      setConfirmDeleteId(null);
    });
  }

  const deletingTeacher = confirmDeleteId ? byId.get(confirmDeleteId) : undefined;

  return (
    <div className="flex flex-1 flex-wrap items-stretch">
      <div className="flex flex-[999_1_560px] min-w-0 flex-col gap-5 p-6">
        <div>
          <h1 className="m-0 text-[28px] font-semibold tracking-[-0.03em]">Öğretmenler</h1>
          <p className="mt-1.5 text-ink-2">
            Yeni kayıtları onaylayın, rolleri belirleyin ve asistanları baş öğretmenlere bağlayın.
          </p>
        </div>

        {pending.length > 0 ? (
          <section className="overflow-hidden rounded-[14px] border border-warn-line">
            <div className="flex items-center gap-2 bg-warn-soft px-4 py-3 font-semibold text-warn-text">
              <UserPlus size={16} aria-hidden="true" />
              Onay bekleyen kayıtlar · {pending.length}
            </div>
            {pending.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3">
                <Avatar name={`${p.firstName} ${p.lastName}`} colorId={p.id} />
                <div className="min-w-[200px] flex-1">
                  <div className="font-medium">
                    {p.firstName} {p.lastName}
                  </div>
                  <div className="font-mono text-xs text-muted">
                    {p.email} · {formatBadgeDate(p.createdAt.slice(0, 10))}
                  </div>
                </div>
                <label className="flex items-center gap-2 text-[13px] text-ink-2">
                  Rol
                  <select
                    value={pendingRoles[p.id] ?? "assistant"}
                    onChange={(e) =>
                      setPendingRoles((prev) => ({ ...prev, [p.id]: e.target.value as Exclude<Role, "pending"> }))
                    }
                    className="h-9 rounded-[9px] border border-line-2 bg-surface px-2.5 text-[13px] font-medium text-ink"
                  >
                    <option value="assistant">Asistan öğretmen</option>
                    <option value="head_teacher">Baş öğretmen</option>
                    <option value="admin">Yönetici</option>
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => reject(p)}
                  disabled={isPending}
                  className="h-9 rounded-[9px] border border-line bg-surface px-3 text-[13px] font-medium text-ink-2"
                >
                  Reddet
                </button>
                <button
                  type="button"
                  onClick={() => approve(p)}
                  disabled={isPending}
                  className="h-9 rounded-[9px] bg-accent px-3.5 text-[13px] font-medium text-white"
                >
                  Onayla
                </button>
              </div>
            ))}
          </section>
        ) : null}

        <div className="overflow-hidden rounded-[14px] border border-line">
          <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-line bg-surface-2 px-4 py-3">
            <h2 className="m-0 text-[15px] font-semibold">
              Tüm öğretmenler <span className="font-mono text-[13px] font-normal text-muted">{teachers.length}</span>
            </h2>
            <div className="relative">
              <label htmlFor="ogr-ara" className="sr-only">
                Öğretmen ara
              </label>
              <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                id="ogr-ara"
                type="search"
                placeholder="Ad veya e-posta ara"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-[34px] w-56 rounded-[9px] border border-line bg-surface pl-8 pr-2.5 text-[13px] text-ink outline-none focus:border-accent"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="px-4 py-10 text-center text-ink-2">Eşleşen öğretmen bulunamadı.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse">
                <thead>
                  <tr className="text-left text-xs text-muted">
                    <th className="px-4 py-2.5 font-medium">Öğretmen</th>
                    <th className="px-3 py-2.5 font-medium">Rol</th>
                    <th className="px-3 py-2.5 font-medium">Bağlantılar</th>
                    <th className="px-4 py-2.5 font-medium">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr
                      key={t.id}
                      className={"border-t border-line " + (t.id === selectedId ? "bg-accent-soft" : "")}
                    >
                      <td className="px-4 py-2.5">
                        <button
                          type="button"
                          onClick={() => setSelectedId(t.id)}
                          className="flex cursor-pointer items-center gap-3 border-0 bg-transparent p-0 text-left text-ink"
                        >
                          <Avatar name={`${t.firstName} ${t.lastName}`} colorId={t.id} />
                          <span className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium">
                              {t.firstName} {t.lastName}
                            </span>
                            <span className="font-mono text-xs text-muted">{t.email}</span>
                          </span>
                        </button>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={
                            "inline-flex h-[26px] items-center whitespace-nowrap rounded-[7px] px-2.5 text-xs font-medium " +
                            (t.role === "head_teacher"
                              ? "bg-accent-soft text-accent-text"
                              : t.role === "admin"
                                ? "bg-ink text-bg"
                                : "border border-line bg-sunken text-ink-2")
                          }
                        >
                          {ROLE_LABELS[t.role]}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-[13px] text-ink-2">{linksText(t, byId)}</td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-2">
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: t.isActive ? "var(--ok)" : "var(--line-2)" }}
                          />
                          {t.isActive ? "Aktif" : "Pasif"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selected ? (
        <aside
          aria-label="Seçili öğretmen"
          className="box-border flex max-w-full flex-[1_1_320px] flex-col gap-5 border-l border-line bg-surface-2 p-6"
        >
          <div className="flex items-center gap-3.5">
            <Avatar name={`${selected.firstName} ${selected.lastName}`} colorId={selected.id} size={52} />
            <div className="min-w-0">
              <div className="text-[19px] font-semibold tracking-[-0.02em]">
                {selected.firstName} {selected.lastName}
              </div>
              <div className="overflow-wrap-anywhere font-mono text-xs text-muted">{selected.email}</div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-[13px] font-semibold">Rol</div>
            {isSelf ? (
              <p className="m-0 text-xs text-muted">Kendi rolünüzü buradan değiştiremezsiniz.</p>
            ) : null}
            <div className="grid grid-cols-3 gap-0.5 rounded-[10px] border border-line bg-sunken p-[3px]">
              {ASSIGNABLE_ROLES.map((r) => {
                const on = selected.role === r;
                const disabled = isSelf || isPending || (isLastActiveAdmin && r !== "admin");
                return (
                  <button
                    key={r}
                    type="button"
                    aria-pressed={on}
                    disabled={disabled}
                    onClick={() => changeRole(r)}
                    className={
                      "h-[34px] rounded-[7px] border-0 font-sans text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50 " +
                      (on ? "bg-surface text-ink shadow-[0_0_0_1px_var(--line),0_1px_2px_rgba(0,0,0,0.06)]" : "bg-transparent text-muted")
                    }
                  >
                    {ROLE_SHORT_LABEL[r]}
                  </button>
                );
              })}
            </div>
          </div>

          {selected.role === "assistant" ? (
            <div className="flex flex-col gap-2">
              <div className="text-[13px] font-semibold">Bağlı baş öğretmenler</div>
              <div className="text-xs text-muted">
                Asistan, seçili baş öğretmenlerin öğrencilerini görür ve kayıt girer.
              </div>
              {headTeachers.length === 0 ? (
                <p className="m-0 text-xs text-muted">Henüz hiç baş öğretmen yok.</p>
              ) : (
                headTeachers.map((ht) => {
                  const on = selected.linkedHeadTeacherIds.includes(ht.id);
                  return (
                    <button
                      key={ht.id}
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => toggleLink(ht.id)}
                      className={
                        "flex min-h-11 items-center gap-2.5 rounded-[10px] border bg-surface px-3 text-[13px] font-medium text-ink " +
                        (on ? "border-accent" : "border-line")
                      }
                    >
                      <span
                        className={
                          "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] " +
                          (on ? "bg-accent" : "border-[1.5px] border-line-2 bg-surface")
                        }
                      >
                        {on ? <Check size={12} strokeWidth={3.5} color="#fff" aria-hidden="true" /> : null}
                      </span>
                      <Avatar name={`${ht.firstName} ${ht.lastName}`} colorId={ht.id} size={24} />
                      <span className="flex-1 text-left">
                        {ht.firstName} {ht.lastName}
                      </span>
                      <span className="font-mono text-xs text-muted">{ht.studentCount} öğr.</span>
                    </button>
                  );
                })
              )}
            </div>
          ) : null}

          {selected.role === "head_teacher" ? (
            <div className="flex flex-col gap-2.5">
              <div className="text-[13px] font-semibold">Bu baş öğretmen</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-[10px] border border-line bg-surface p-3">
                  <div className="text-xs text-muted">Öğrenci</div>
                  <div className="font-mono text-[22px] font-medium">{selected.studentCount}</div>
                </div>
                <div className="rounded-[10px] border border-line bg-surface p-3">
                  <div className="text-xs text-muted">Asistan</div>
                  <div className="font-mono text-[22px] font-medium">
                    {teachers.filter((t) => t.role === "assistant" && t.linkedHeadTeacherIds.includes(selected.id)).length}
                  </div>
                </div>
              </div>
              <a href="/yonetim/ogrenciler" className="text-[13px] font-medium text-accent-text no-underline">
                Öğrenci atamalarını düzenle →
              </a>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3 border-y border-line py-3.5">
            <div>
              <div className="text-[13px] font-semibold">Hesap aktif</div>
              <div className="text-xs text-muted">Kapalıyken giriş yapamaz</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={selected.isActive}
              aria-label="Hesap aktif"
              disabled={isPending || isSelf || isLastActiveAdmin}
              onClick={toggleActive}
              className="flex h-[26px] w-11 shrink-0 cursor-pointer items-center rounded-full border-0 p-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                justifyContent: selected.isActive ? "flex-end" : "flex-start",
                background: selected.isActive ? "var(--accent)" : "var(--line-2)",
              }}
            >
              <span className="h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25)]" />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={requestPasswordReset}
              disabled={isPending}
              className="h-10 rounded-[9px] border border-line bg-surface text-[13px] font-medium text-ink"
            >
              Şifre sıfırlama bağlantısı gönder
            </button>
            {resetMessage ? <p className="m-0 text-xs text-ink-2">{resetMessage}</p> : null}
            <button
              type="button"
              onClick={() => setConfirmDeleteId(selected.id)}
              disabled={isSelf || isLastActiveAdmin}
              className="h-10 rounded-[9px] border border-warn-line bg-transparent text-[13px] font-medium text-warn-text disabled:cursor-not-allowed disabled:opacity-50"
            >
              Hesabı sil
            </button>
            {isSelf ? <p className="m-0 text-xs text-muted">Kendi hesabınızı silemezsiniz.</p> : null}
            {!isSelf && isLastActiveAdmin ? (
              <p className="m-0 text-xs text-muted">Sistemde en az bir aktif yönetici kalmalı.</p>
            ) : null}
          </div>
        </aside>
      ) : null}

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Öğretmen hesabını sil"
        description={
          deletingTeacher
            ? `${deletingTeacher.firstName} ${deletingTeacher.lastName} hesabı devre dışı bırakılacak ve bir daha giriş yapamayacak. Geçmiş kayıtlardaki "Giren: ..." bilgisi korunur. Bu işlem geri alınamaz.`
            : ""
        }
        pending={isPending}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
