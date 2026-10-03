import { Users } from "lucide-react";

import { getMyAssistants } from "@/app/ogrencilerim/data";
import { signOutAction } from "@/app/onay-bekliyor/actions";
import { Avatar } from "@/components/avatar";
import {
  SidebarBrand,
  SidebarNav,
  SidebarNavLink,
  SidebarSection,
  SidebarSpacer,
  SidebarUserCard,
} from "@/components/shell/sidebar";
import type { Profile } from "@/db/schema";
import { initialsOf } from "@/lib/avatar-colors";

export async function HeadTeacherSidebar({ user, studentCount }: { user: Profile; studentCount: number }) {
  const assistants = await getMyAssistants(user);

  return (
    <>
      <SidebarBrand subtitle="2026–2027 dönemi" />
      <SidebarNav>
        <SidebarNavLink
          href="/ogrencilerim"
          icon={Users}
          active
          badge={<span className="font-mono text-xs text-muted">{studentCount}</span>}
        >
          Öğrencilerim
        </SidebarNavLink>
      </SidebarNav>

      {assistants.length > 0 ? (
        <SidebarSection title="ÖĞRETMENİM">
          {assistants.map((a) => (
            <div key={a.id} className="flex h-[38px] items-center gap-2.5 rounded-[9px] px-2.5 text-ink-2">
              <Avatar name={`${a.firstName} ${a.lastName}`} colorId={a.id} size={22} />
              <span className="truncate">{`${a.firstName} ${a.lastName}`}</span>
            </div>
          ))}
        </SidebarSection>
      ) : null}

      <SidebarSpacer />
      <SidebarUserCard
        initials={initialsOf(`${user.firstName} ${user.lastName}`)}
        name={`${user.firstName} ${user.lastName}`}
        roleLabel="Öğretmen"
        signOutAction={signOutAction}
      />
    </>
  );
}
