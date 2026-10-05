import { ChevronRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getAllRecords, getStudentDetail } from "@/app/ogrencilerim/[ogrenciId]/data";
import { Avatar } from "@/components/avatar";
import { HeadTeacherNoteEditor } from "@/components/head-teacher-note-editor";
import { HomeworkPie } from "@/components/homework-pie";
import { AppShell } from "@/components/shell/app-shell";
import { HeadTeacherSidebar } from "@/components/shell/head-teacher-sidebar";
import { Topbar } from "@/components/shell/topbar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { formatDayMonth, formatTimelineDate, todayISODate, WEEKDAY_LONG } from "@/lib/date";
import { requirePageRole } from "@/lib/page-guard";
import { visibleStudentIds } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const HOMEWORK_LABEL = { done: "Ödev yapıldı", missing: "Ödev eksik" } as const;
const ATTENDANCE_LABEL = { came: "Geldi", absent: "Gelmedi" } as const;
const BOOK_LABEL = { brought: "Kitap getirdi", not_brought: "Kitap getirmedi" } as const;

function Square({ pos }: { pos: boolean | null }) {
  return (
    <span
      className="h-2 flex-1 max-w-[44px] rounded-sm box-border"
      style={
        pos === true
          ? { background: "var(--accent)" }
          : pos === false
            ? { border: "2px solid var(--warn)" }
            : { background: "var(--line)" }
      }
    />
  );
}

export default async function BasOgrenciDetayPage({
  params,
}: {
  params: Promise<{ ogrenciId: string }>;
}) {
  const user = await requirePageRole("head_teacher");
  const { ogrenciId } = await params;

  const student = await getStudentDetail(user, ogrenciId);
  if (!student) notFound();

  const [allStudentIds, records] = await Promise.all([visibleStudentIds(user), getAllRecords(ogrenciId, user.role)]);

  const today = todayISODate();
  const todayRecord = records.find((r) => r.date === today);
  const last4 = records.slice(0, 4);
  const homeworkSquares = Array.from({ length: 4 }, (_, i) => {
    const h = last4[3 - i]?.homework;
    return h === undefined || h === null ? null : h === "done";
  });
  const bookSquares = Array.from({ length: 4 }, (_, i) => {
    const b = last4[3 - i]?.book;
    return b === undefined || b === null ? null : b === "brought";
  });
  const homeworkDone = last4.filter((r) => r.homework === "done").length;
  const homeworkCounted = last4.filter((r) => r.homework !== null).length;
  const allHomeworkDone = records.filter((r) => r.homework === "done").length;
  const allHomeworkMissing = records.filter((r) => r.homework === "missing").length;
  const bookBrought = last4.filter((r) => r.book === "brought").length;
  const bookCounted = last4.filter((r) => r.book !== null).length;

  return (
    <AppShell sidebar={<HeadTeacherSidebar user={user} studentCount={allStudentIds.length} />}>
      <Topbar
        crumbs={
          <>
            <Link href="/ogrencilerim" className="text-muted no-underline hover:text-ink hover:underline">
              Öğrencilerim
            </Link>
            <ChevronRight size={14} aria-hidden="true" />
            <span className="font-medium text-ink">{student.fullName}</span>
          </>
        }
        right={
          <>
            <span className="flex h-[30px] items-center gap-1.5 rounded-lg border border-line bg-sunken px-2.5 text-xs font-medium text-ink-2">
              <ShieldCheck size={13} aria-hidden="true" />
              Kayıtlar salt görüntüleme
            </span>
            <ThemeToggle />
          </>
        }
      />

      <div className="flex flex-col gap-6 px-6 py-7 pb-10">
        <div className="flex flex-wrap items-center gap-5">
          <Avatar name={student.fullName} colorId={student.id} size={68} />
          <div className="flex-[1_1_260px]">
            <h1 className="m-0 text-[32px] font-semibold tracking-[-0.03em]">{student.fullName}</h1>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="inline-flex h-[26px] items-center rounded-[7px] border border-line bg-sunken px-2.5 font-mono text-xs font-medium">
                {student.className}
              </span>
              <span className="inline-flex h-[26px] items-center rounded-[7px] border border-line bg-sunken px-2.5 text-xs text-ink-2">
                {student.studyDays.map((d) => WEEKDAY_LONG[d]).join(" · ") || "Gün belirlenmemiş"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
          <div className="rounded-[14px] border border-line bg-surface-2 p-[18px]">
            <div className="text-[13px] text-muted">Ödev yapıldı</div>
            <div className="mt-1.5 font-mono text-[28px] font-medium tracking-[-0.03em]">
              {homeworkDone}
              <span className="text-muted">/{homeworkCounted}</span>
            </div>
            <div className="mt-2.5 flex gap-1">
              {homeworkSquares.map((s, i) => (
                <Square key={i} pos={s} />
              ))}
            </div>
          </div>
          <div className="rounded-[14px] border border-line bg-surface-2 p-[18px]">
            <div className="text-[13px] text-muted">Kitap getirdi</div>
            <div className="mt-1.5 font-mono text-[28px] font-medium tracking-[-0.03em]">
              {bookBrought}
              <span className="text-muted">/{bookCounted}</span>
            </div>
            <div className="mt-2.5 flex gap-1">
              {bookSquares.map((s, i) => (
                <Square key={i} pos={s} />
              ))}
            </div>
          </div>
          <div className="rounded-[14px] border border-dashed border-line-2 bg-sunken p-[18px]">
            <div className="text-[13px] text-muted">Bugün · {formatDayMonth(today)}</div>
            {todayRecord ? (
              <>
                <div className="mt-2.5 text-xs text-muted">
                  {todayRecord.attendance ? ATTENDANCE_LABEL[todayRecord.attendance] : "Katılım bekleniyor"}
                </div>
                <div className="mt-1 text-base font-semibold">
                  {todayRecord.homework ? HOMEWORK_LABEL[todayRecord.homework] : "Ödev bekleniyor"}
                </div>
                <div className="mt-1 text-xs text-muted">
                  {todayRecord.book ? BOOK_LABEL[todayRecord.book] : "Kitap bekleniyor"}
                </div>
              </>
            ) : (
              <>
                <div className="mt-2.5 text-base font-semibold">Kayıt bekleniyor</div>
                <div className="mt-1 text-xs text-muted">Öğretmen girince burada görünür</div>
              </>
            )}
          </div>
        </div>

        <div className="rounded-[14px] border border-line bg-surface-2 p-[18px]">
          <h2 className="m-0 text-[15px] font-semibold">Genel ödev durumu</h2>
          <p className="m-0 mb-4 mt-1 text-[13px] text-muted">Tüm etütlerdeki ödev kayıtlarının dağılımı.</p>
          <HomeworkPie done={allHomeworkDone} missing={allHomeworkMissing} />
        </div>

        <div className="overflow-hidden rounded-[14px] border border-line">
          <div className="border-b border-line bg-surface-2 px-[18px] py-3.5">
            <h2 className="m-0 text-[15px] font-semibold">Etüt kayıtları</h2>
          </div>
          {records.length === 0 ? (
            <p className="px-[18px] py-10 text-center text-ink-2">
              Bu öğrenci için henüz etüt kaydı yok.
            </p>
          ) : (
            <div className="relative px-[18px] py-5 pl-11">
              <div className="absolute bottom-6 left-6 top-6 w-0.5 bg-line" />
              {records.map((r) => {
                const ok = r.homework !== "missing" && r.book !== "not_brought";
                return (
                  <div key={r.date} className="relative flex flex-wrap gap-2 pb-[22px]">
                    <span
                      className="absolute -left-[25px] top-[3px] h-3 w-3 rounded-full box-border"
                      style={{
                        border: "3px solid var(--surface)",
                        boxShadow: `0 0 0 1px ${ok ? "var(--accent)" : "var(--warn)"}`,
                        background: ok ? "var(--accent)" : "var(--warn)",
                      }}
                    />
                    <div className="flex-[1_1_360px]">
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
                      <HeadTeacherNoteEditor studentId={student.id} dateISO={r.date} initialNote={r.headTeacherNote} />
                    </div>
                    <div className="text-xs text-muted">Giren: {r.enteredBy}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
