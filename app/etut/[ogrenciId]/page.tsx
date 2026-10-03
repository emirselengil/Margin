import { ChevronDown, ChevronRight, ChevronUp } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getStudentsForDate } from "@/app/etut/data";
import { getPastRecords, getStudentDetail, getTodayRecord } from "@/app/etut/[ogrenciId]/data";
import { RecordForm } from "@/app/etut/[ogrenciId]/record-form";
import { Avatar } from "@/components/avatar";
import { AppShell } from "@/components/shell/app-shell";
import { AssistantSidebar } from "@/components/shell/assistant-sidebar";
import { Topbar } from "@/components/shell/topbar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  formatBadgeDate,
  formatDayMonth,
  formatTimelineDate,
  todayISODate,
  weekdayOfISODate,
  WEEKDAY_LONG,
} from "@/lib/date";
import { requirePageRole } from "@/lib/page-guard";

export const dynamic = "force-dynamic";

const HOMEWORK_LABEL = { done: "Ödev yapıldı", missing: "Ödev eksik" } as const;
const ATTENDANCE_LABEL = { came: "Geldi", absent: "Gelmedi" } as const;
const BOOK_LABEL = { brought: "Kitap getirdi", not_brought: "Kitap getirmedi" } as const;

export default async function OgrenciDetayPage({
  params,
  searchParams,
}: {
  params: Promise<{ ogrenciId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await requirePageRole("assistant");
  const { ogrenciId } = await params;
  const { date: dateParam } = await searchParams;
  const dateISO = dateParam || todayISODate();

  const student = await getStudentDetail(user, ogrenciId);
  if (!student) notFound();

  const [sameDayStudents, pastRecords, todayRecord] = await Promise.all([
    getStudentsForDate(user, dateISO),
    getPastRecords(ogrenciId, dateISO),
    getTodayRecord(ogrenciId, dateISO),
  ]);

  const currentIndex = sameDayStudents.findIndex((s) => s.id === ogrenciId);
  const prevStudent = currentIndex > 0 ? sameDayStudents[currentIndex - 1] : null;
  const nextStudent =
    currentIndex >= 0 && currentIndex < sameDayStudents.length - 1
      ? sameDayStudents[currentIndex + 1]
      : null;

  const isScheduledToday = student.studyDays.includes(weekdayOfISODate(dateISO));
  const filledPast = pastRecords.filter((r) => r.homework || r.book || r.attendance);
  const homeworkDoneCount = pastRecords.filter((r) => r.homework === "done").length;
  const bookBroughtCount = pastRecords.filter((r) => r.book === "brought").length;

  return (
    <AppShell sidebar={<AssistantSidebar user={user} active="etut" />}>
      <div className="flex min-w-0 flex-1 flex-wrap overflow-hidden">
        <section className="flex max-w-full flex-[1_1_280px] flex-col border-r border-line bg-surface-2">
          <div className="box-border flex min-h-14 items-center gap-2 border-b border-line px-[18px] text-muted">
            <Link href={`/etut?date=${dateISO}`} className="text-muted no-underline hover:text-ink hover:underline">
              Etüt listesi
            </Link>
            <ChevronRight size={14} aria-hidden="true" />
            <span className="font-medium text-ink">{formatDayMonth(dateISO)}</span>
          </div>
          <div className="flex flex-col gap-0.5 p-2.5">
            {sameDayStudents.map((s) => {
              const filled = s.homework && s.book;
              const active = s.id === ogrenciId;
              return (
                <Link
                  key={s.id}
                  href={`/etut/${s.id}?date=${dateISO}`}
                  className={
                    "flex min-h-[52px] items-center gap-2.5 rounded-[10px] px-2.5 text-ink no-underline transition-colors " +
                    (active
                      ? "bg-surface shadow-[0_0_0_1px_var(--line),0_1px_3px_rgba(0,0,0,0.06)]"
                      : "hover:bg-surface/60 active:bg-surface")
                  }
                >
                  <Avatar name={s.fullName} colorId={s.headTeacherId} size={30} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-medium">{s.fullName}</span>
                    <span className={"text-xs " + (filled ? "text-muted" : "text-warn-text")}>
                      {filled ? "Kayıt girildi" : "Kayıt bekliyor"}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="flex min-w-0 flex-[999_1_520px] flex-col">
          <Topbar
            crumbs={
              <span className="font-mono text-xs font-medium text-muted">
                ÖĞRENCİ {Math.max(currentIndex, 0) + 1} / {sameDayStudents.length || 1}
              </span>
            }
            right={
              <>
                <Link
                  href={prevStudent ? `/etut/${prevStudent.id}?date=${dateISO}` : "#"}
                  aria-label="Önceki öğrenci"
                  aria-disabled={!prevStudent}
                  className={
                    "flex h-9 w-9 items-center justify-center rounded-[9px] border border-line bg-surface text-ink-2 transition-colors " +
                    (prevStudent
                      ? "hover:bg-sunken hover:border-line-2 hover:text-ink active:bg-line"
                      : "pointer-events-none opacity-40")
                  }
                >
                  <ChevronUp size={16} aria-hidden="true" />
                </Link>
                <Link
                  href={nextStudent ? `/etut/${nextStudent.id}?date=${dateISO}` : "#"}
                  aria-label="Sonraki öğrenci"
                  aria-disabled={!nextStudent}
                  className={
                    "flex h-9 w-9 items-center justify-center rounded-[9px] border border-line bg-surface text-ink-2 transition-colors " +
                    (nextStudent
                      ? "hover:bg-sunken hover:border-line-2 hover:text-ink active:bg-line"
                      : "pointer-events-none opacity-40")
                  }
                >
                  <ChevronDown size={16} aria-hidden="true" />
                </Link>
                <ThemeToggle />
              </>
            }
          />

          <div className="flex max-w-[800px] flex-col gap-[26px] p-7">
            <div className="flex flex-wrap items-center gap-[18px]">
              <Avatar name={student.fullName} colorId={student.headTeacherId} size={60} />
              <div className="flex-[1_1_240px]">
                <h1 className="m-0 text-[28px] font-semibold tracking-[-0.03em]">{student.fullName}</h1>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="inline-flex h-[26px] items-center rounded-[7px] border border-line bg-sunken px-2.5 font-mono text-xs font-medium">
                    {student.className}
                  </span>
                  <span className="inline-flex h-[26px] items-center gap-1.5 rounded-[7px] bg-accent-soft px-2.5 text-xs font-medium text-accent-text">
                    {student.headTeacherName}
                  </span>
                  <span className="inline-flex h-[26px] items-center rounded-[7px] border border-line bg-sunken px-2.5 text-xs text-ink-2">
                    {student.studyDays.map((d) => WEEKDAY_LONG[d]).join(" · ") || "Gün belirlenmemiş"}
                  </span>
                </div>
              </div>
            </div>

            {isScheduledToday ? (
              <RecordForm
                studentId={student.id}
                dateISO={dateISO}
                dateLabel={formatBadgeDate(dateISO)}
                initialHomework={todayRecord?.homework ?? null}
                initialBook={todayRecord?.book ?? null}
                initialAttendance={todayRecord?.attendance ?? null}
                initialNote={todayRecord?.note ?? ""}
              />
            ) : (
              <div className="rounded-2xl border border-line bg-surface-2 p-5 text-ink-2">
                {student.fullName}, {formatBadgeDate(dateISO)} için etüde atanmamış. Bu tarihe kayıt
                eklenemez.
              </div>
            )}

            <div>
              <div className="mb-3.5 flex flex-wrap items-baseline justify-between gap-2.5">
                <h2 className="m-0 text-[15px] font-semibold">Geçmiş etütler</h2>
                {pastRecords.length > 0 ? (
                  <span className="text-[13px] text-muted">
                    Ödev{" "}
                    <span className="font-mono text-ink">
                      {homeworkDoneCount}/{pastRecords.length}
                    </span>{" "}
                    · Kitap{" "}
                    <span className="font-mono text-ink">
                      {bookBroughtCount}/{pastRecords.length}
                    </span>
                  </span>
                ) : null}
              </div>

              {pastRecords.length === 0 ? (
                <p className="text-ink-2">Bu öğrenci için henüz geçmiş etüt kaydı yok.</p>
              ) : (
                <div className="relative pl-[26px]">
                  <div className="absolute bottom-1.5 left-[7px] top-1.5 w-0.5 bg-line" />
                  {filledPast.map((r) => {
                    const ok = r.homework !== "missing" && r.book !== "not_brought";
                    return (
                      <div key={r.date} className="relative pb-5">
                        <span
                          className="absolute -left-[25px] top-[3px] h-3 w-3 rounded-full"
                          style={{
                            boxSizing: "border-box",
                            border: "3px solid var(--surface)",
                            boxShadow: `0 0 0 1px ${ok ? "var(--accent)" : "var(--warn)"}`,
                            background: ok ? "var(--accent)" : "var(--warn)",
                          }}
                        />
                        <div className="font-mono text-xs font-medium text-muted">
                          {formatTimelineDate(r.date)}
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {r.attendance ? (
                            <span
                              className={
                                "inline-flex h-6 items-center rounded-md px-2 text-xs font-medium " +
                                (r.attendance === "came"
                                  ? "bg-accent-soft text-accent-text"
                                  : "bg-warn-soft text-warn-text")
                              }
                            >
                              {ATTENDANCE_LABEL[r.attendance]}
                            </span>
                          ) : null}
                          {r.homework ? (
                            <span
                              className={
                                "inline-flex h-6 items-center rounded-md px-2 text-xs font-medium " +
                                (r.homework === "done"
                                  ? "bg-accent-soft text-accent-text"
                                  : "bg-warn-soft text-warn-text")
                              }
                            >
                              {HOMEWORK_LABEL[r.homework]}
                            </span>
                          ) : null}
                          {r.book ? (
                            <span
                              className={
                                "inline-flex h-6 items-center rounded-md px-2 text-xs font-medium " +
                                (r.book === "brought"
                                  ? "bg-accent-soft text-accent-text"
                                  : "bg-warn-soft text-warn-text")
                              }
                            >
                              {BOOK_LABEL[r.book]}
                            </span>
                          ) : null}
                        </div>
                        {r.note ? <p className="mt-2 leading-relaxed text-ink-2">{r.note}</p> : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
