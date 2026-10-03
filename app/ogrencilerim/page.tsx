import { ChevronRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { AddMyStudentButton } from "@/app/ogrencilerim/add-my-student-button";
import { getAllMyStudents } from "@/app/ogrencilerim/data";
import { Avatar } from "@/components/avatar";
import { AppShell } from "@/components/shell/app-shell";
import { HeadTeacherSidebar } from "@/components/shell/head-teacher-sidebar";
import { Topbar } from "@/components/shell/topbar";
import { StatusChip } from "@/components/status-chip";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { formatDayMonth, WEEKDAY_SHORT } from "@/lib/date";
import { requirePageRole } from "@/lib/page-guard";

export const dynamic = "force-dynamic";

const HOMEWORK_LABEL = { done: "Ödev yapıldı", missing: "Ödev eksik" } as const;
const BOOK_LABEL = { brought: "Kitap getirdi", not_brought: "Kitap getirmedi" } as const;
const ATTENDANCE_LABEL = { came: "Geldi", absent: "Gelmedi" } as const;

export default async function OgrencilerimPage() {
  const user = await requirePageRole("head_teacher");
  const students = await getAllMyStudents(user);

  return (
    <AppShell sidebar={<HeadTeacherSidebar user={user} studentCount={students.length} active="ogrencilerim" />}>
      <Topbar
        crumbs={
          <>
            <span>Öğretmen</span>
            <ChevronRight size={14} aria-hidden="true" />
            <span className="font-medium text-ink">Öğrencilerim</span>
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
          <h1 className="m-0 text-[30px] font-semibold tracking-[-0.03em]">Öğrencilerim</h1>
          <p className="mt-1.5 text-ink-2">
            Size bağlı tüm öğrenciler. Günlük etüt durumunu görmek için{" "}
            <Link href="/etutler" className="font-medium text-accent-text no-underline hover:underline">
              Etütler
            </Link>{" "}
            sayfasına bakın.
          </p>
        </div>

        <div className="overflow-hidden rounded-[14px] border border-line">
          <div className="flex items-center justify-between border-b border-line bg-surface-2 px-[18px] py-3.5">
            <h2 className="m-0 text-[15px] font-semibold">
              Tüm öğrenciler{" "}
              <span className="font-mono text-[13px] font-normal text-muted">{students.length}</span>
            </h2>
          </div>

          {students.length === 0 ? (
            <p className="px-[18px] py-10 text-center text-ink-2">
              Henüz size bağlı öğrenci yok. &ldquo;Öğrenci ekle&rdquo; ile ilk öğrencinizi ekleyebilirsiniz.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse">
                <thead>
                  <tr className="text-left text-xs text-muted">
                    <th className="px-[18px] py-2.5 font-medium">Öğrenci</th>
                    <th className="px-3 py-2.5 font-medium">Etüt günleri</th>
                    <th className="px-3 py-2.5 font-medium">Son etüt</th>
                    <th className="px-[18px] py-2.5">
                      <span className="sr-only">Aç</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
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
                      <td className="px-3 py-3 font-mono text-xs text-ink-2">
                        {s.days.map((d) => WEEKDAY_SHORT[d]).join(" · ") || "Gün belirlenmemiş"}
                      </td>
                      <td className="px-3 py-3">
                        {s.latest ? (
                          <span className="flex flex-wrap items-center gap-1.5">
                            <span className="font-mono text-xs text-muted">{formatDayMonth(s.latest.date)}</span>
                            {s.latest.attendance ? (
                              <StatusChip tone={s.latest.attendance === "came" ? "pos" : "neg"}>
                                {ATTENDANCE_LABEL[s.latest.attendance]}
                              </StatusChip>
                            ) : null}
                            {s.latest.homework ? (
                              <StatusChip tone={s.latest.homework === "done" ? "pos" : "neg"}>
                                {HOMEWORK_LABEL[s.latest.homework]}
                              </StatusChip>
                            ) : null}
                            {s.latest.book ? (
                              <StatusChip tone={s.latest.book === "brought" ? "pos" : "neg"}>
                                {BOOK_LABEL[s.latest.book]}
                              </StatusChip>
                            ) : null}
                          </span>
                        ) : (
                          <span className="text-[13px] text-muted">Henüz kayıt yok</span>
                        )}
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
