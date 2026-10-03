import { ChevronRight } from "lucide-react";
import { redirect } from "next/navigation";

import { NameForm, PasswordForm } from "@/app/profil/profile-forms";
import { getPendingTeachers } from "@/app/yonetim/ogretmenler/data";
import { AdminSidebar } from "@/components/shell/admin-sidebar";
import { AppShell } from "@/components/shell/app-shell";
import { AssistantSidebar } from "@/components/shell/assistant-sidebar";
import { HeadTeacherSidebar } from "@/components/shell/head-teacher-sidebar";
import { Topbar } from "@/components/shell/topbar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { visibleStudentIds } from "@/lib/permissions";
import { getOrCreateProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const user = await getOrCreateProfile();
  if (!user) redirect("/giris");
  if (!user.isActive || user.role === "pending") redirect("/onay-bekliyor");

  let sidebar;
  if (user.role === "admin") {
    const [pending, studentIds] = await Promise.all([getPendingTeachers(), visibleStudentIds(user)]);
    sidebar = (
      <AdminSidebar user={user} active={null} pendingCount={pending.length} studentCount={studentIds.length} />
    );
  } else if (user.role === "head_teacher") {
    const studentIds = await visibleStudentIds(user);
    sidebar = <HeadTeacherSidebar user={user} studentCount={studentIds.length} active={false} />;
  } else {
    sidebar = <AssistantSidebar user={user} active={null} />;
  }

  return (
    <AppShell sidebar={sidebar}>
      <Topbar
        crumbs={
          <>
            <span>Hesabım</span>
            <ChevronRight size={14} aria-hidden="true" />
            <span className="font-medium text-ink">Profil</span>
          </>
        }
        right={<ThemeToggle />}
      />
      <div className="flex max-w-[640px] flex-col gap-8 px-6 py-6 pb-10">
        <div>
          <h1 className="m-0 text-[28px] font-semibold tracking-[-0.03em]">Profilim</h1>
          <p className="mt-1.5 text-ink-2">İsminizi ve şifrenizi buradan güncelleyebilirsiniz.</p>
          <p className="mt-1 font-mono text-xs text-muted">{user.email}</p>
        </div>

        <section className="flex flex-col gap-4 rounded-[14px] border border-line bg-surface-2 p-5">
          <h2 className="m-0 text-base font-semibold">İsim</h2>
          <NameForm initialFirstName={user.firstName} initialLastName={user.lastName} />
        </section>

        <section className="flex flex-col gap-4 rounded-[14px] border border-line bg-surface-2 p-5">
          <h2 className="m-0 text-base font-semibold">Şifre</h2>
          <PasswordForm />
        </section>
      </div>
    </AppShell>
  );
}
