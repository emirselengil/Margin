import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { getStudentsForDate, getWeekdayCounts } from "@/app/etut/data";
import { StudentTable } from "@/app/etut/student-table";
import { AppShell } from "@/components/shell/app-shell";
import { AssistantSidebar } from "@/components/shell/assistant-sidebar";
import { Topbar } from "@/components/shell/topbar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ProgressRing } from "@/components/progress-ring";
import { addDaysISO, formatLong, startOfWeekISO, todayISODate, WEEKDAY_SHORT } from "@/lib/date";
import { requirePageRole } from "@/lib/page-guard";

export const dynamic = "force-dynamic";

export default async function EtutPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await requirePageRole("assistant");
  const { date: dateParam } = await searchParams;
  const dateISO = dateParam || todayISODate();
  const weekStart = startOfWeekISO(dateISO);

  const [students, weekdayCounts] = await Promise.all([
    getStudentsForDate(user, dateISO),
    getWeekdayCounts(user),
  ]);

  const done = students.filter((s) => s.homework && s.book).length;
  const total = students.length;
  const odevEksik = students.filter((s) => s.homework === "missing").length;
  const kitapYok = students.filter((s) => s.book === "not_brought").length;
  const headTeacherCount = new Set(students.map((s) => s.headTeacherId)).size;

  const days = Array.from({ length: 7 }, (_, i) => {
    const iso = addDaysISO(weekStart, i);
    const d = new Date(`${iso}T12:00:00`);
    const selected = iso === dateISO;
    const dotCount = Math.min(weekdayCounts[i], 6);
    return { iso, label: WEEKDAY_SHORT[i], num: d.getDate(), selected, dotCount };
  });

  return (
    <AppShell sidebar={<AssistantSidebar user={user} active="etut" />}>
      <Topbar
        crumbs={
          <>
            <span>Etüt listesi</span>
            <ChevronRight size={14} aria-hidden="true" />
            <span className="font-medium text-ink">{formatLong(dateISO).split(",")[0]}</span>
          </>
        }
        right={<ThemeToggle />}
      />

      <div className="flex flex-col gap-[22px] px-6 py-6 pb-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-mono text-xs font-medium tracking-[0.06em] text-accent-text uppercase">
              {formatLong(dateISO)}
            </div>
            <h1 className="mt-1.5 text-[30px] font-semibold tracking-[-0.03em]">Bugünün etüdü</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <Link
              href={`/etut?date=${addDaysISO(weekStart, -7)}`}
              aria-label="Önceki hafta"
              className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-line bg-surface text-ink-2 transition-colors hover:bg-sunken hover:border-line-2 hover:text-ink active:bg-line"
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </Link>
            <Link
              href="/etut"
              className="flex h-9 items-center rounded-[9px] border border-line bg-surface px-3 text-[13px] font-medium text-ink no-underline transition-colors hover:bg-sunken hover:border-line-2 active:bg-line"
            >
              Bu hafta
            </Link>
            <Link
              href={`/etut?date=${addDaysISO(weekStart, 7)}`}
              aria-label="Sonraki hafta"
              className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-line bg-surface text-ink-2 transition-colors hover:bg-sunken hover:border-line-2 hover:text-ink active:bg-line"
            >
              <ChevronRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3">
          <div className="flex items-center justify-between rounded-[14px] border border-line bg-surface-2 p-4">
            <div>
              <div className="text-[13px] text-muted">Kayıt girildi</div>
              <div className="mt-1.5 font-mono text-[26px] font-medium tracking-[-0.03em]">
                {done}
                <span className="text-muted">/{total}</span>
              </div>
            </div>
            <ProgressRing done={done} total={total} />
          </div>
          <div className="rounded-[14px] border border-line bg-surface-2 p-4">
            <div className="text-[13px] text-muted">Etüde gelecek</div>
            <div className="mt-1.5 font-mono text-[26px] font-medium tracking-[-0.03em]">{total}</div>
            <div className="mt-0.5 text-xs text-muted">{headTeacherCount} öğretmen</div>
          </div>
          <div className="rounded-[14px] border border-warn-line bg-warn-soft p-4">
            <div className="text-[13px] text-warn-text">Ödev eksik</div>
            <div className="mt-1.5 font-mono text-[26px] font-medium tracking-[-0.03em] text-warn-text">
              {odevEksik}
            </div>
            <div className="mt-0.5 text-xs text-warn-text">öğrenci</div>
          </div>
          <div className="rounded-[14px] border border-warn-line bg-warn-soft p-4">
            <div className="text-[13px] text-warn-text">Kitap getirmedi</div>
            <div className="mt-1.5 font-mono text-[26px] font-medium tracking-[-0.03em] text-warn-text">
              {kitapYok}
            </div>
            <div className="mt-0.5 text-xs text-warn-text">öğrenci</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="grid min-w-[640px] grid-cols-7 gap-2">
            {days.map((d) => (
              <Link
                key={d.iso}
                href={`/etut?date=${d.iso}`}
                className={
                  "flex h-[88px] flex-col items-start justify-between rounded-xl border px-3 py-2.5 text-left no-underline transition " +
                  (d.selected
                    ? "border-accent bg-accent text-white shadow-[0_6px_18px_rgba(79,70,229,0.28)] hover:opacity-90 active:opacity-80"
                    : "border-line bg-surface text-ink hover:bg-sunken hover:border-line-2 active:bg-line")
                }
              >
                <span
                  className={
                    "font-mono text-[11px] font-medium tracking-[0.06em] " +
                    (d.selected ? "text-white/85" : "text-muted")
                  }
                >
                  {d.label}
                </span>
                <span className="text-[22px] font-semibold tracking-[-0.03em]">{d.num}</span>
                <span className="flex h-1.5 gap-[3px]">
                  {Array.from({ length: d.dotCount }, (_, i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 rounded-[3px]"
                      style={{ background: d.selected ? "rgba(255,255,255,0.8)" : "var(--accent)" }}
                    />
                  ))}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <StudentTable students={students} dateISO={dateISO} />
      </div>
    </AppShell>
  );
}
