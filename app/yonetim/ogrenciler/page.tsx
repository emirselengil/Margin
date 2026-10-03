import { ChevronRight } from "lucide-react";

import { getAllStudentsAdmin, getHeadTeacherOptions } from "@/app/yonetim/ogrenciler/data";
import { StudentManager } from "@/app/yonetim/ogrenciler/student-manager";
import { getPendingTeachers } from "@/app/yonetim/ogretmenler/data";
import { AdminSidebar } from "@/components/shell/admin-sidebar";
import { AppShell } from "@/components/shell/app-shell";
import { Topbar } from "@/components/shell/topbar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { requirePageRole } from "@/lib/page-guard";

export const dynamic = "force-dynamic";

export default async function YonetimOgrencilerPage() {
  const user = await requirePageRole("admin");
  const [students, headTeachers, pending] = await Promise.all([
    getAllStudentsAdmin(),
    getHeadTeacherOptions(),
    getPendingTeachers(),
  ]);

  return (
    <AppShell
      sidebar={
        <AdminSidebar
          user={user}
          active="ogrenciler"
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
            <span className="font-medium text-ink">Öğrenciler</span>
          </>
        }
        right={<ThemeToggle />}
      />
      <StudentManager initialStudents={students} headTeachers={headTeachers} />
    </AppShell>
  );
}
