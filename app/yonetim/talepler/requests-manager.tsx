"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { decideBranchRequestAction, revokeBranchRequestAction } from "@/app/yonetim/talepler/actions";
import type { AdminRequestRow } from "@/app/yonetim/talepler/data";
import { Avatar } from "@/components/avatar";
import { formatBadgeDate } from "@/lib/date";
import { LEVEL_LABELS, type Level } from "@/lib/levels";

type Result = { ok: true } | { ok: false; message: string };

const secondaryButton =
  "h-9 cursor-pointer rounded-[9px] border border-line bg-surface px-3 text-[13px] font-medium text-ink-2 transition-colors hover:bg-sunken hover:border-line-2 active:bg-line disabled:cursor-default disabled:opacity-60";
const primaryButton =
  "h-9 cursor-pointer rounded-[9px] bg-accent px-3.5 text-[13px] font-medium text-white transition hover:opacity-90 active:scale-[0.98] active:opacity-80 disabled:cursor-default disabled:opacity-60";

function Request({ r, children }: { r: AdminRequestRow; children: React.ReactNode }) {
  return (
    <li className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3 first:border-t-0">
      <Avatar name={r.assistantName} colorId={r.assistantId} />
      <div className="min-w-[220px] flex-1">
        <div className="font-medium">{r.assistantName}</div>
        <div className="text-[13px] text-ink-2">
          <strong>{r.branchName}</strong> · {LEVEL_LABELS[r.level as Level] ?? r.level} öğretmenlerini görmek istiyor
        </div>
        <div className="font-mono text-xs text-muted">
          Kurum: {r.institutionName} · {formatBadgeDate(r.createdAt.slice(0, 10))}
        </div>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </li>
  );
}

function Section({ title, count, empty, children }: { title: string; count: number; empty: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="m-0 text-base font-semibold">
        {title} <span className="font-mono text-[13px] font-normal text-muted">{count}</span>
      </h2>
      <div className="overflow-hidden rounded-[14px] border border-line">
        {count === 0 ? <p className="px-4 py-8 text-center text-ink-2">{empty}</p> : <ul className="m-0 list-none p-0">{children}</ul>}
      </div>
    </section>
  );
}

export function RequestsManager({ initialRequests }: { initialRequests: AdminRequestRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(task: () => Promise<Result>) {
    setError(null);
    startTransition(async () => {
      const result = await task();
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.refresh();
    });
  }

  const pending = initialRequests.filter((r) => r.status === "pending");
  const approved = initialRequests.filter((r) => r.status === "approved");
  const rejected = initialRequests.filter((r) => r.status === "rejected");

  return (
    <div className="flex flex-col gap-7 p-6">
      <div>
        <h1 className="m-0 text-[28px] font-semibold tracking-[-0.03em]">Dal talepleri</h1>
        <p className="mt-1.5 max-w-[640px] text-ink-2">
          Asistan öğretmenler, kendi kurumlarındaki farklı bir daldaki öğretmenleri görmek için talep açabilir.
          Onayladığınızda o asistan, o kurumdaki o daldaki öğretmenleri (kendi seviyesinde) görebilir. Seviyesi farklı
          öğretmenler talep onaylansa da görünmez.
        </p>
        {error ? (
          <p role="alert" className="mt-3 text-[13px] font-medium text-warn-text">
            {error}
          </p>
        ) : null}
      </div>

      <Section title="Bekleyen talepler" count={pending.length} empty="Bekleyen talep yok.">
        {pending.map((r) => (
          <Request key={r.id} r={r}>
            <button type="button" disabled={isPending} onClick={() => run(() => decideBranchRequestAction(r.id, "rejected"))} className={secondaryButton}>
              Reddet
            </button>
            <button type="button" disabled={isPending} onClick={() => run(() => decideBranchRequestAction(r.id, "approved"))} className={primaryButton}>
              Onayla
            </button>
          </Request>
        ))}
      </Section>

      <Section title="Onaylı erişimler" count={approved.length} empty="Onaylı erişim yok.">
        {approved.map((r) => (
          <Request key={r.id} r={r}>
            <button type="button" disabled={isPending} onClick={() => run(() => revokeBranchRequestAction(r.id))} className={secondaryButton}>
              Erişimi kaldır
            </button>
          </Request>
        ))}
      </Section>

      <Section title="Reddedilenler" count={rejected.length} empty="Reddedilen talep yok.">
        {rejected.map((r) => (
          <Request key={r.id} r={r}>
            <button type="button" disabled={isPending} onClick={() => run(() => revokeBranchRequestAction(r.id))} className={secondaryButton}>
              Kaydı sil
            </button>
          </Request>
        ))}
      </Section>
    </div>
  );
}
