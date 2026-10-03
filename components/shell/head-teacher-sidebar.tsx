import { CalendarDays, Users } from "lucide-react";

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

export async function HeadTeacherSidebar({
  user,
  studentCount,
  active = "ogrencilerim",
}: {
  user: Profile;
  studentCount: number;
  active?: "ogrencilerim" | "etutler" | null;
}) {
  const assistants = await getMyAssistants(user);

  return (
    <>
      <SidebarBrand subtitle="2026–2027 dönemi" />
      <SidebarNav>
        <SidebarNavLink
          href="/ogrencilerim"
          icon={Users}
          active={active === "ogrencilerim"}
          badge={<span className="font-mono text-xs text-muted">{studentCount}</span>}
        >
          Öğrencilerim
        </SidebarNavLink>
        <SidebarNavLink href="/etutler" icon={CalendarDays} active={active === "etutler"}>
          Etütler
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
        profileHref="/profil"
        signOutAction={signOutAction}
      />
    </>
  );
}
