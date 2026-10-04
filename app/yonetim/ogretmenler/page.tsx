import { ChevronRight } from "lucide-react";

import { getBranches, getInstitutions } from "@/app/yonetim/kurumlar/data";
import { getAllTeachers, getPendingTeachers } from "@/app/yonetim/ogretmenler/data";
import { TeacherManager } from "@/app/yonetim/ogretmenler/teacher-manager";
import { AppShell } from "@/components/shell/app-shell";
import { AdminSidebar } from "@/components/shell/admin-sidebar";
import { Topbar } from "@/components/shell/topbar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { requirePageRole } from "@/lib/page-guard";
import { visibleStudentIds } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function YonetimOgretmenlerPage() {
  const user = await requirePageRole("admin");
  const [pending, teachers, studentIds, branches, institutions] = await Promise.all([
    getPendingTeachers(),
    getAllTeachers(),
    visibleStudentIds(user),
    getBranches(),
    getInstitutions(),
  ]);

  return (
    <AppShell
      sidebar={
        <AdminSidebar
          user={user}
          active="ogretmenler"
          pendingCount={pending.length}
          studentCount={studentIds.length}
        />
      }
    >
      <Topbar
        crumbs={
          <>
            <span>Yönetim</span>
            <ChevronRight size={14} aria-hidden="true" />
            <span className="font-medium text-ink">Öğretmenler</span>
          </>
        }
        right={<ThemeToggle />}
      />
      <TeacherManager
        currentAdminId={user.id}
        initialPending={pending}
        initialTeachers={teachers}
        branches={branches}
        institutions={institutions}
      />
    </AppShell>
  );
}
