"use client";

import { Check, ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  createBranchAction,
  createInstitutionAction,
  deleteBranchAction,
  deleteInstitutionAction,
  renameInstitutionAction,
  setInstitutionBranchesAction,
} from "@/app/yonetim/kurumlar/actions";
import type { BranchRow, InstitutionRow } from "@/app/yonetim/kurumlar/data";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { institutionLabels } from "@/lib/institutions";
import { LEVEL_LABELS, LEVELS, type Level } from "@/lib/levels";

const inputClass =
  "h-10 rounded-[10px] border border-line-2 bg-surface px-3 text-sm text-ink outline-none focus:border-accent";
const primaryButton =
  "flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-[9px] bg-accent px-3.5 text-[13px] font-medium text-white transition hover:opacity-90 active:scale-[0.98] active:opacity-80 disabled:cursor-default disabled:opacity-60";
const iconButton =
  "flex h-9 w-9 cursor-pointer items-center justify-center rounded-[9px] border border-line bg-surface text-ink-2 transition-colors hover:bg-sunken hover:text-ink active:bg-line disabled:cursor-not-allowed disabled:opacity-40";

type Result = { ok: true } | { ok: false; message: string };

export function OrgManager({
  initialInstitutions,
  initialBranches,
}: {
  initialInstitutions: InstitutionRow[];
  initialBranches: BranchRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [instName, setInstName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const [branchName, setBranchName] = useState("");
  const [branchLevel, setBranchLevel] = useState<Level>("lise");

  const [confirm, setConfirm] = useState<{ kind: "institution" | "branch"; id: string; label: string } | null>(null);
  const labels = institutionLabels(initialInstitutions);
  const [openId, setOpenId] = useState<string | null>(null);

  function run(task: () => Promise<Result>, onDone?: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await task();
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onDone?.();
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-8 p-6">
      <div>
        <h1 className="m-0 text-[28px] font-semibold tracking-[-0.03em]">Kurumlar ve dallar</h1>
        <p className="mt-1.5 max-w-[640px] text-ink-2">
          Kurumları ve dalları (branş + seviye) yalnızca siz oluşturur ve atarsınız. Her kuruma hangi dalların ait
          olduğunu kurum satırındaki &ldquo;Dallar&rdquo; düğmesinden seçersiniz; öğretmenlere dal ve kurum ataması
          Öğretmenler sayfasındaki öğretmen panelinden yapılır. Aynı adlı iki kurum açabilirsiniz; her kurumun ayrı
          bir kimliği vardır.
        </p>
        {error ? (
          <p role="alert" className="mt-3 text-[13px] font-medium text-warn-text">
            {error}
          </p>
        ) : null}
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="m-0 text-base font-semibold">Kurumlar</h2>
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => createInstitutionAction(instName), () => setInstName(""));
          }}
        >
          <label htmlFor="kurum-adi" className="sr-only">
            Yeni kurum adı
          </label>
          <input
            id="kurum-adi"
            value={instName}
            onChange={(e) => setInstName(e.target.value)}
            placeholder="Yeni kurum adı"
            maxLength={100}
            className={inputClass + " w-72"}
          />
          <button type="submit" disabled={isPending || !instName.trim()} className={primaryButton}>
            <Plus size={15} aria-hidden="true" />
            Kurum ekle
          </button>
        </form>

        <div className="overflow-hidden rounded-[14px] border border-line">
          {initialInstitutions.length === 0 ? (
            <p className="px-4 py-8 text-center text-ink-2">Henüz kurum yok.</p>
          ) : (
            <ul className="m-0 list-none p-0">
              {initialInstitutions.map((inst) => (
                <li key={inst.id} className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-2.5 first:border-t-0">
                  {editingId === inst.id ? (
                    <form
                      className="flex flex-1 flex-wrap items-center gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        run(() => renameInstitutionAction(inst.id, editName), () => setEditingId(null));
                      }}
                    >
                      <input
                        aria-label="Kurum adı"
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        maxLength={100}
                        className={inputClass + " w-72"}
                      />
                      <button type="submit" disabled={isPending || !editName.trim()} className={primaryButton}>
                        Kaydet
                      </button>
                      <button type="button" onClick={() => setEditingId(null)} className={iconButton + " w-auto px-3 text-[13px]"}>
                        Vazgeç
                      </button>
                    </form>
                  ) : (
                    <>
                      <span className="min-w-[200px] flex-1 font-medium">{labels[inst.id]}</span>
                      <span className="font-mono text-xs text-muted">{inst.teacherCount} öğretmen</span>
                      <button
                        type="button"
                        aria-expanded={openId === inst.id}
                        aria-label={`${labels[inst.id]} kurumunun dalları`}
                        onClick={() => setOpenId(openId === inst.id ? null : inst.id)}
                        className="flex h-9 cursor-pointer items-center gap-1.5 rounded-[9px] border border-line bg-surface px-3 text-[13px] font-medium text-ink-2 transition-colors hover:bg-sunken hover:text-ink active:bg-line"
                      >
                        Dallar · {inst.branchIds.length}
                        <ChevronDown
                          size={14}
                          aria-hidden="true"
                          className={"transition-transform " + (openId === inst.id ? "rotate-180" : "")}
                        />
                      </button>
                      <button
                        type="button"
                        aria-label={`${labels[inst.id]} kurumunu yeniden adlandır`}
                        onClick={() => {
                          setEditingId(inst.id);
                          setEditName(inst.name);
                        }}
                        className={iconButton}
                      >
                        <Pencil size={14} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label={`${labels[inst.id]} kurumunu sil`}
                        onClick={() => setConfirm({ kind: "institution", id: inst.id, label: labels[inst.id] })}
                        className={iconButton}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                      {openId === inst.id ? (
                        <div className="flex basis-full flex-col gap-2 rounded-[12px] bg-surface-2 p-3">
                          <div className="text-xs text-muted">
                            Bu kurumda bulunan dallar. Asistanlar bir kurumda yalnızca buraya eklediğiniz dalları
                            görebilir ve talep edebilir.
                          </div>
                          {initialBranches.length === 0 ? (
                            <p className="m-0 text-[13px] text-ink-2">Önce aşağıdan dal oluşturun.</p>
                          ) : (
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-2">
                              {initialBranches.map((b) => {
                                const on = inst.branchIds.includes(b.id);
                                const next = on ? inst.branchIds.filter((id) => id !== b.id) : [...inst.branchIds, b.id];
                                return (
                                  <button
                                    key={b.id}
                                    type="button"
                                    role="checkbox"
                                    aria-checked={on}
                                    disabled={isPending}
                                    onClick={() => run(() => setInstitutionBranchesAction(inst.id, next))}
                                    className={
                                      "flex min-h-11 cursor-pointer items-center gap-2.5 rounded-[10px] border bg-surface px-3 text-[13px] font-medium text-ink transition-colors hover:bg-sunken active:bg-line disabled:cursor-default disabled:opacity-60 " +
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
                                    <span className="flex-1 text-left">{b.name}</span>
                                    <span className="text-xs text-muted">{LEVEL_LABELS[b.level as Level] ?? b.level}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : null}
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="m-0 text-base font-semibold">Dallar (branş + seviye)</h2>
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => createBranchAction(branchName, branchLevel), () => setBranchName(""));
          }}
        >
          <label htmlFor="dal-adi" className="sr-only">
            Branş adı
          </label>
          <input
            id="dal-adi"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            placeholder="Branş (örn. Matematik)"
            maxLength={100}
            className={inputClass + " w-72"}
          />
          <label htmlFor="dal-seviye" className="sr-only">
            Seviye
          </label>
          <select
            id="dal-seviye"
            value={branchLevel}
            onChange={(e) => setBranchLevel(e.target.value as Level)}
            className={inputClass}
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {LEVEL_LABELS[l]}
              </option>
            ))}
          </select>
          <button type="submit" disabled={isPending || !branchName.trim()} className={primaryButton}>
            <Plus size={15} aria-hidden="true" />
            Dal ekle
          </button>
        </form>

        <div className="overflow-hidden rounded-[14px] border border-line">
          {initialBranches.length === 0 ? (
            <p className="px-4 py-8 text-center text-ink-2">Henüz dal yok.</p>
          ) : (
            <ul className="m-0 list-none p-0">
              {initialBranches.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-2.5 first:border-t-0">
                  <span className="min-w-[200px] flex-1 font-medium">{b.name}</span>
                  <span className="inline-flex h-[26px] items-center rounded-[7px] bg-accent-soft px-2.5 text-xs font-medium text-accent-text">
                    {LEVEL_LABELS[b.level as Level] ?? b.level}
                  </span>
                  <span className="font-mono text-xs text-muted">{b.teacherCount} öğretmen</span>
                  <button
                    type="button"
                    aria-label={`${b.name} (${LEVEL_LABELS[b.level as Level] ?? b.level}) dalını sil`}
                    onClick={() => setConfirm({ kind: "branch", id: b.id, label: `${b.name} · ${LEVEL_LABELS[b.level as Level] ?? b.level}` })}
                    className={iconButton}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.kind === "institution" ? "Kurumu sil" : "Dalı sil"}
        description={
          confirm
            ? `“${confirm.label}” silinecek. Yalnızca hiçbir öğretmene ve talebe bağlı değilse silinebilir. Bu işlem geri alınamaz.`
            : ""
        }
        pending={isPending}
        onConfirm={() => {
          const target = confirm;
          if (!target) return;
          run(
            () => (target.kind === "institution" ? deleteInstitutionAction(target.id) : deleteBranchAction(target.id)),
            () => setConfirm(null),
          );
        }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
