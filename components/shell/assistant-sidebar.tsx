import { CalendarDays, ListChecks } from "lucide-react";

import { getLinkedHeadTeachers, getTodayPendingCount } from "@/app/etut/data";
import { signOutAction } from "@/app/onay-bekliyor/actions";
import { Avatar } from "@/components/avatar";
import { SidebarBrand, SidebarNav, SidebarNavLink, SidebarSection, SidebarSpacer, SidebarUserCard } from "@/components/shell/sidebar";
import type { Profile } from "@/db/schema";
import { todayISODate } from "@/lib/date";
import { initialsOf } from "@/lib/avatar-colors";

export async function AssistantSidebar({ user, active }: { user: Profile; active: "etut" | "gruplar" | null }) {
  const [headTeachers, pendingCount] = await Promise.all([
    getLinkedHeadTeachers(user),
    getTodayPendingCount(user, todayISODate()),
  ]);

  return (
    <>
      <SidebarBrand subtitle="2026–2027 dönemi" />
      <SidebarNav>
        <SidebarNavLink
          href="/etut"
          icon={ListChecks}
          active={active === "etut"}
          badge={
            pendingCount > 0 ? (
              <span className="rounded-[5px] bg-warn-soft px-1.5 py-0.5 font-mono text-[11px] font-medium text-warn-text">
                {pendingCount}
              </span>
            ) : undefined
          }
        >
          Etüt listesi
        </SidebarNavLink>
        <SidebarNavLink href="/gruplar" icon={CalendarDays} active={active === "gruplar"}>
          Gün grupları
        </SidebarNavLink>
      </SidebarNav>

      {headTeachers.length > 0 ? (
        <SidebarSection title="ÖĞRETMENLER">
          {headTeachers.map((ht) => (
            <div key={ht.id} className="flex h-[38px] items-center gap-2.5 rounded-[9px] px-2.5 text-ink-2">
              <Avatar name={ht.name} colorId={ht.id} size={22} />
              <span className="flex-1 truncate">{ht.name}</span>
              <span className="font-mono text-xs text-muted">{ht.studentCount}</span>
            </div>
          ))}
        </SidebarSection>
      ) : null}

      <SidebarSpacer />
      <SidebarUserCard
        initials={initialsOf(`${user.firstName} ${user.lastName}`)}
        name={`${user.firstName} ${user.lastName}`}
        roleLabel="Öğretmen"
        profileHref="/profil"
        signOutAction={signOutAction}
      />
    </>
  );
}
