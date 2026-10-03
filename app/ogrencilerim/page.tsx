import { ChevronRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { AddMyStudentButton } from "@/app/ogrencilerim/add-my-student-button";
import { getMyAssistants, getStudentsForDate, getWeekdayCounts } from "@/app/ogrencilerim/data";
import { Avatar } from "@/components/avatar";
import { ProgressRing } from "@/components/progress-ring";
import { AppShell } from "@/components/shell/app-shell";
import { HeadTeacherSidebar } from "@/components/shell/head-teacher-sidebar";
import { Topbar } from "@/components/shell/topbar";
import { StatusChip } from "@/components/status-chip";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { addDaysISO, formatLong, startOfWeekISO, todayISODate, WEEKDAY_SHORT } from "@/lib/date";
import { requirePageRole } from "@/lib/page-guard";
import { visibleStudentIds } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const HOMEWORK_LABEL = { done: "Yapıldı", missing: "Eksik" } as const;
const BOOK_LABEL = { brought: "Getirdi", not_brought: "Getirmedi" } as const;

export default async function OgrencilerimPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await requirePageRole("head_teacher");
  const { date: dateParam } = await searchParams;
  const dateISO = dateParam || todayISODate();
  const weekStart = startOfWeekISO(dateISO);

  const [allStudentIds, todayStudents, weekdayCounts, assistants] = await Promise.all([
    visibleStudentIds(user),
    getStudentsForDate(user, dateISO),
    getWeekdayCounts(user),
    getMyAssistants(user),
  ]);

  const total = todayStudents.length;
  const done = todayStudents.filter((s) => s.homework && s.book).length;
  const eksik = todayStudents.filter((s) => s.homework === "missing");

  let homeworkDone = 0;
  let homeworkTotal = 0;
  for (const s of todayStudents) {
    for (const h of s.last4Homework) {
      if (h === null) continue;
      homeworkTotal++;
      if (h === "done") homeworkDone++;
    }
  }

  const assistantNames = assistants.map((a) => `${a.firstName} ${a.lastName}`).join(", ");

  const days = Array.from({ length: 7 }, (_, i) => {
    const iso = addDaysISO(weekStart, i);
    const d = new Date(`${iso}T12:00:00`);
    const selected = iso === dateISO;
    const dotCount = Math.min(weekdayCounts[i], 6);
    return { iso, label: WEEKDAY_SHORT[i], num: d.getDate(), selected, dotCount };
  });

  return (
    <AppShell sidebar={<HeadTeacherSidebar user={user} studentCount={allStudentIds.length} />}>
      <Topbar
        crumbs={
          <>
            <span>Öğrencilerim</span>
            <ChevronRight size={14} aria-hidden="true" />
            <span className="font-medium text-ink">{formatLong(dateISO).split(",")[0]}</span>
          </>
        }
        right={
          <>
            <span className="flex h-[30px] items-center gap-1.5 rounded-lg border border-line bg-sunken px-2.5 text-xs font-medium text-ink-2">
              <ShieldCheck size={13} aria-hidden="true" />
              Salt görüntüleme
            </span>
            <AddMyStudentButton headTeacherId={user.id} headTeacherName={`${user.firstName} ${user.lastName}`} />
            <ThemeToggle />
          </>
        }
      />

      <div className="flex flex-col gap-[22px] px-6 py-6 pb-10">
        <div>
          <div className="font-mono text-xs font-medium uppercase tracking-[0.06em] text-accent-text">
            {formatLong(dateISO)}
          </div>
          <h1 className="mt-1.5 text-[30px] font-semibold tracking-[-0.03em]">
            Merhaba, {user.firstName} {user.lastName}
          </h1>
          <p className="mt-1.5 text-ink-2">
            {assistants.length > 0
              ? `Öğrencilerinizin etüt kayıtlarını asistanınız ${assistantNames} giriyor. Buradan yalnızca takip edebilirsiniz.`
              : "Henüz size bağlı bir asistan yok. Kayıtlar girilmeye başladığında burada görünecek."}
          </p>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3">
          <div className="rounded-[14px] border border-line bg-surface-2 p-4">
            <div className="text-[13px] text-muted">Öğrencilerim</div>
            <div className="mt-1.5 font-mono text-[26px] font-medium tracking-[-0.03em]">
              {allStudentIds.length}
            </div>
            <div className="mt-0.5 text-xs text-muted">bugün {total}&apos;ü etütte</div>
          </div>
          <div className="flex items-center justify-between rounded-[14px] border border-line bg-surface-2 p-4">
            <div>
              <div className="text-[13px] text-muted">Bugün kayıt girildi</div>
              <div className="mt-1.5 font-mono text-[26px] font-medium tracking-[-0.03em]">
                {done}
                <span className="text-muted">/{total}</span>
              </div>
            </div>
            {total > 0 ? <ProgressRing done={done} total={total} /> : null}
          </div>
          <div className="rounded-[14px] border border-accent-line bg-accent-soft p-4">
            <div className="text-[13px] text-accent-text">Ödev yapılma · son 4 etüt</div>
            <div className="mt-1.5 font-mono text-[26px] font-medium tracking-[-0.03em] text-accent-text">
              {homeworkDone}
              <span className="opacity-60">/{homeworkTotal}</span>
            </div>
            <div className="mt-0.5 text-xs text-accent-text">bugün etütteki {total} öğrenci</div>
          </div>
          <div className="rounded-[14px] border border-warn-line bg-warn-soft p-4">
            <div className="text-[13px] text-warn-text">Bugün ödev eksik</div>
            <div className="mt-1.5 font-mono text-[26px] font-medium tracking-[-0.03em] text-warn-text">
              {eksik.length}
            </div>
            <div className="mt-0.5 truncate text-xs text-warn-text">
              {eksik.map((s) => s.fullName).join(", ") || "—"}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="grid min-w-[640px] grid-cols-7 gap-2">
            {days.map((d) => (
              <Link
                key={d.iso}
                href={`/ogrencilerim?date=${d.iso}`}
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

        <div className="overflow-hidden rounded-[14px] border border-line">
          <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-line bg-surface-2 px-[18px] py-3.5">
            <h2 className="m-0 text-[15px] font-semibold">
              {formatLong(dateISO).split(",")[0]} etüdü{" "}
              <span className="font-mono text-[13px] font-normal text-muted">{total}</span>
            </h2>
            <span className="flex gap-3.5 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-[3px] bg-accent" />
                Ödev yapıldı
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-[3px] border-2 border-warn" />
                Eksik
              </span>
            </span>
          </div>

          {total === 0 ? (
            <p className="px-[18px] py-10 text-center text-ink-2">
              Bu gün etüde gelecek öğrenci yok.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse">
                <thead>
                  <tr className="text-left text-xs text-muted">
                    <th className="px-[18px] py-2.5 font-medium">Öğrenci</th>
                    <th className="px-3 py-2.5 font-medium">Bugün ödev</th>
                    <th className="px-3 py-2.5 font-medium">Bugün kitap</th>
                    <th className="px-3 py-2.5 font-medium">Not</th>
                    <th className="px-3 py-2.5 font-medium">Son 4 etüt</th>
                    <th className="px-[18px] py-2.5">
                      <span className="sr-only">Aç</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {todayStudents.map((s) => (
                    <tr key={s.id} className="border-t border-line transition-colors hover:bg-surface-2">
                      <td className="px-[18px] py-3">
                        <Link
                          href={`/ogrencilerim/${s.id}`}
                          className="flex items-center gap-3 text-ink no-underline transition-colors hover:text-accent-text"
                        >
                          <Avatar name={s.fullName} colorId={s.id} />
                          <span className="flex flex-col gap-0.5">
                            <span className="font-medium">{s.fullName}</span>
                            <span className="font-mono text-xs text-muted">{s.className}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        <StatusChip tone={s.homework === "done" ? "pos" : s.homework === "missing" ? "neg" : "wait"}>
                          {s.homework ? HOMEWORK_LABEL[s.homework] : "Bekleniyor"}
                        </StatusChip>
                      </td>
                      <td className="px-3 py-3">
                        <StatusChip tone={s.book === "brought" ? "pos" : s.book === "not_brought" ? "neg" : "wait"}>
                          {s.book ? BOOK_LABEL[s.book] : "Bekleniyor"}
                        </StatusChip>
                      </td>
                      <td className="max-w-[240px] px-3 py-3 text-[13px] text-ink-2">{s.note || "—"}</td>
                      <td className="px-3 py-3">
                        <span className="flex gap-1" aria-label="Son 4 etütte ödev durumu">
                          {s.last4Homework.map((h, i) => (
                            <span
                              key={i}
                              className="h-2 w-2.5 rounded-sm"
                              style={
                                h === "done"
                                  ? { background: "var(--accent)" }
                                  : h === "missing"
                                    ? { border: "2px solid var(--warn)", boxSizing: "border-box" }
                                    : { background: "var(--line)" }
                              }
                            />
                          ))}
                        </span>
                      </td>
                      <td className="px-[18px] py-3 text-right">
                        <Link
                          href={`/ogrencilerim/${s.id}`}
                          aria-label="Öğrenciyi aç"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-[9px] text-muted transition-colors hover:bg-sunken hover:text-ink"
                        >
                          <ChevronRight size={16} aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
