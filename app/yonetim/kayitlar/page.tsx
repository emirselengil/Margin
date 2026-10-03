import { ChevronRight, Download } from "lucide-react";

import { getHeadTeacherOptions, getRecordsAdmin } from "@/app/yonetim/kayitlar/data";
import { RecordsManager } from "@/app/yonetim/kayitlar/records-manager";
import { getAllStudentsAdmin } from "@/app/yonetim/ogrenciler/data";
import { getPendingTeachers } from "@/app/yonetim/ogretmenler/data";
import { AdminSidebar } from "@/components/shell/admin-sidebar";
import { AppShell } from "@/components/shell/app-shell";
import { Topbar } from "@/components/shell/topbar";
import { ComingSoonButton } from "@/components/coming-soon-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { addDaysISO, todayISODate } from "@/lib/date";
import { requirePageRole } from "@/lib/page-guard";

export const dynamic = "force-dynamic";

export default async function YonetimKayitlarPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const user = await requirePageRole("admin");
  const { from: fromParam, to: toParam } = await searchParams;
  const to = toParam || todayISODate();
  const from = fromParam || addDaysISO(to, -13);

  const [records, headTeachers, students, pending] = await Promise.all([
    getRecordsAdmin({ from, to }),
    getHeadTeacherOptions(),
    getAllStudentsAdmin(),
    getPendingTeachers(),
  ]);

  return (
    <AppShell
      sidebar={
        <AdminSidebar
          user={user}
          active="kayitlar"
          pendingCount={pending.length}
          studentCount={students.length}
        />
      }
    >
      <Topbar
        crumbs={
          <>
            <span>Yönetim</span>
            <ChevronRight size={14} aria-hidden="true" />
            <span className="font-medium text-ink">Etüt kayıtları</span>
          </>
        }
        right={
          <>
            <ComingSoonButton icon={Download}>Excel&apos;e aktar</ComingSoonButton>
            <ThemeToggle />
          </>
        }
      />
      <RecordsManager initialRecords={records} headTeachers={headTeachers} initialFilters={{ from, to }} />
    </AppShell>
  );
}
