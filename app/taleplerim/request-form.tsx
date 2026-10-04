"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { cancelBranchRequestAction, createBranchRequestAction } from "@/app/taleplerim/actions";
import type { MyOrgInfo } from "@/app/taleplerim/data";
import { LEVEL_LABELS, type Level } from "@/lib/levels";

const selectClass =
  "h-11 min-w-[200px] flex-1 rounded-[10px] border border-line-2 bg-surface px-3 text-sm font-medium text-ink disabled:opacity-60";

const STATUS_LABEL = { pending: "Bekliyor", approved: "Onaylandı", rejected: "Reddedildi" } as const;
const STATUS_CLASS = {
  pending: "border border-dashed border-line-2 bg-sunken text-muted",
  approved: "bg-accent-soft text-accent-text",
  rejected: "bg-warn-soft text-warn-text",
} as const;

export function RequestForm({ info }: { info: MyOrgInfo }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [institutionId, setInstitutionId] = useState(info.institutions[0]?.id ?? "");
  const [branchId, setBranchId] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const canRequest = !!info.branch && info.institutions.length > 0;
  const requestable = info.institutions.find((i) => i.id === institutionId)?.requestableBranches ?? [];

  function submit() {
    setMessage(null);
    startTransition(async () => {
      const result = await createBranchRequestAction(institutionId, branchId);
      if (!result.ok) {
        setMessage({ ok: false, text: result.message });
        return;
      }
      setMessage({ ok: true, text: "Talebiniz yöneticiye iletildi." });
      setBranchId("");
      router.refresh();
    });
  }

  function cancel(id: string) {
    setMessage(null);
    startTransition(async () => {
      const result = await cancelBranchRequestAction(id);
      if (!result.ok) setMessage({ ok: false, text: result.message });
      router.refresh();
    });
  }

  return (
    <>
      <section className="flex flex-col gap-3">
        <h2 className="m-0 text-base font-semibold">Yeni talep</h2>
        {!canRequest ? (
          <p className="m-0 text-ink-2">Talep açabilmek için yöneticinin size bir dal ve en az bir kurum atamış olması gerekir.</p>
        ) : (
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (institutionId && branchId) submit();
            }}
          >
            <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
              <label htmlFor="talep-kurum" className="text-[13px] font-medium">
                Kurum
              </label>
              <select id="talep-kurum" value={institutionId} onChange={(e) => {
                  setInstitutionId(e.target.value);
                  setBranchId("");
                }}
                className={selectClass}
              >
                {info.institutions.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
              <label htmlFor="talep-dal" className="text-[13px] font-medium">
                Görmek istediğim dal
              </label>
              <select id="talep-dal" value={branchId} onChange={(e) => setBranchId(e.target.value)} className={selectClass}>
                <option value="">Dal seçin</option>
                {requestable.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} · {LEVEL_LABELS[b.level as Level] ?? b.level}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={isPending || !institutionId || !branchId}
              className="h-11 cursor-pointer rounded-[9px] bg-accent px-4 text-sm font-medium text-white transition hover:opacity-90 active:scale-[0.98] active:opacity-80 disabled:cursor-default disabled:opacity-60"
            >
              Talep gönder
            </button>
          </form>
        )}
        {canRequest && requestable.length === 0 ? (
          <p className="m-0 text-[13px] text-muted">
            Bu kurumda, kendi seviyenizde talep edebileceğiniz başka bir dal tanımlı değil.
          </p>
        ) : null}
        {message ? (
          <p role={message.ok ? "status" : "alert"} className={"m-0 text-[13px] font-medium " + (message.ok ? "text-accent-text" : "text-warn-text")}>
            {message.text}
          </p>
        ) : null}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="m-0 text-base font-semibold">Taleplerim</h2>
        <div className="overflow-hidden rounded-[14px] border border-line">
          {info.requests.length === 0 ? (
            <p className="px-4 py-8 text-center text-ink-2">Henüz talep açmadınız.</p>
          ) : (
            <ul className="m-0 list-none p-0">
              {info.requests.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3 first:border-t-0">
                  <div className="min-w-[200px] flex-1">
                    <div className="font-medium">
                      {r.branchName} · {LEVEL_LABELS[r.level as Level] ?? r.level}
                    </div>
                    <div className="text-[13px] text-muted">Kurum: {r.institutionName}</div>
                  </div>
                  <span className={"inline-flex h-[26px] items-center rounded-[7px] px-2.5 text-xs font-medium " + STATUS_CLASS[r.status]}>
                    {STATUS_LABEL[r.status]}
                  </span>
                  {r.status === "pending" ? (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => cancel(r.id)}
                      className="h-9 cursor-pointer rounded-[9px] border border-line bg-surface px-3 text-[13px] font-medium text-ink-2 transition-colors hover:bg-sunken hover:border-line-2 active:bg-line disabled:cursor-default disabled:opacity-60"
                    >
                      Geri çek
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
