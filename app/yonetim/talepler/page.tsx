import { ChevronRight } from "lucide-react";

import { getPendingTeachers } from "@/app/yonetim/ogretmenler/data";
import { getBranchRequests } from "@/app/yonetim/talepler/data";
import { RequestsManager } from "@/app/yonetim/talepler/requests-manager";
import { AdminSidebar } from "@/components/shell/admin-sidebar";
import { AppShell } from "@/components/shell/app-shell";
import { Topbar } from "@/components/shell/topbar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { requirePageRole } from "@/lib/page-guard";
import { visibleStudentIds } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function TaleplerPage() {
  const user = await requirePageRole("admin");
  const [requests, pending, studentIds] = await Promise.all([
    getBranchRequests(),
    getPendingTeachers(),
    visibleStudentIds(user),
  ]);

  return (
    <AppShell
      sidebar={
        <AdminSidebar user={user} active="talepler" pendingCount={pending.length} studentCount={studentIds.length} />
      }
    >
      <Topbar
        crumbs={
          <>
            <span>Yönetim</span>
            <ChevronRight size={14} aria-hidden="true" />
            <span className="font-medium text-ink">Branş talepleri</span>
          </>
        }
        right={<ThemeToggle />}
      />
      <RequestsManager initialRequests={requests} />
    </AppShell>
  );
}
