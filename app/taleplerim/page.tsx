import { ChevronRight } from "lucide-react";

import { getMyOrgInfo } from "@/app/taleplerim/data";
import { RequestForm } from "@/app/taleplerim/request-form";
import { AppShell } from "@/components/shell/app-shell";
import { AssistantSidebar } from "@/components/shell/assistant-sidebar";
import { Topbar } from "@/components/shell/topbar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LEVEL_LABELS, type Level } from "@/lib/levels";
import { requirePageRole } from "@/lib/page-guard";

export const dynamic = "force-dynamic";

export default async function TaleplerimPage() {
  const user = await requirePageRole("assistant");
  const info = await getMyOrgInfo(user.id);

  return (
    <AppShell sidebar={<AssistantSidebar user={user} active="talepler" />}>
      <Topbar
        crumbs={
          <>
            <span>Hesabım</span>
            <ChevronRight size={14} aria-hidden="true" />
            <span className="font-medium text-ink">Branş talepleri</span>
          </>
        }
        right={<ThemeToggle />}
      />
      <div className="flex max-w-[760px] flex-col gap-7 p-6">
        <div>
          <h1 className="m-0 text-[28px] font-semibold tracking-[-0.03em]">Branş talepleri</h1>
          <p className="mt-1.5 text-ink-2">
            Yalnızca kendi kurumunuzdaki, kendi seviyenizdeki ve kendi dalınızdaki öğretmenleri görürsünüz. Kurumunuzdaki
            başka bir daldaki öğretmenleri görmek için buradan yöneticiye talep açabilirsiniz.
          </p>
        </div>

        <section className="flex flex-col gap-2 rounded-[14px] border border-line bg-surface-2 p-4">
          <h2 className="m-0 text-[15px] font-semibold">Sizin bilgileriniz</h2>
          {info.branch ? (
            <p className="m-0 text-ink-2">
              Dalınız: <strong className="text-ink">{info.branch.name}</strong> ·{" "}
              {LEVEL_LABELS[info.branch.level as Level] ?? info.branch.level}
            </p>
          ) : (
            <p className="m-0 text-warn-text">
              Size henüz bir branş atanmamış. Yönetici branş ve kurum atayana kadar öğretmen listeniz boş görünür.
            </p>
          )}
          <p className="m-0 text-ink-2">
            Kurumlarınız:{" "}
            {info.institutions.length > 0 ? (
              <strong className="text-ink">{info.institutions.map((i) => i.name).join(", ")}</strong>
            ) : (
              <span className="text-warn-text">Size henüz kurum atanmamış.</span>
            )}
          </p>
        </section>

        <RequestForm info={info} />
      </div>
    </AppShell>
  );
}
