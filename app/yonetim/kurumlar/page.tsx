import { ChevronRight } from "lucide-react";

import { getBranches, getInstitutions } from "@/app/yonetim/kurumlar/data";
import { OrgManager } from "@/app/yonetim/kurumlar/org-manager";
import { getPendingTeachers } from "@/app/yonetim/ogretmenler/data";
import { AdminSidebar } from "@/components/shell/admin-sidebar";
import { AppShell } from "@/components/shell/app-shell";
import { Topbar } from "@/components/shell/topbar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { requirePageRole } from "@/lib/page-guard";
import { visibleStudentIds } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function KurumlarPage() {
  const user = await requirePageRole("admin");
  const [institutions, branches, pending, studentIds] = await Promise.all([
    getInstitutions(),
    getBranches(),
    getPendingTeachers(),
    visibleStudentIds(user),
  ]);

  return (
    <AppShell
      sidebar={
        <AdminSidebar user={user} active="kurumlar" pendingCount={pending.length} studentCount={studentIds.length} />
      }
    >
      <Topbar
        crumbs={
          <>
            <span>Yönetim</span>
            <ChevronRight size={14} aria-hidden="true" />
            <span className="font-medium text-ink">Kurumlar ve branşlar</span>
          </>
        }
        right={<ThemeToggle />}
      />
      <OrgManager initialInstitutions={institutions} initialBranches={branches} />
    </AppShell>
  );
}
