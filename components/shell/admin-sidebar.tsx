import { ClipboardList, UserCog, Users } from "lucide-react";

import { signOutAction } from "@/app/onay-bekliyor/actions";
import { SidebarBrand, SidebarNav, SidebarNavLink, SidebarSpacer, SidebarUserCard } from "@/components/shell/sidebar";
import type { Profile } from "@/db/schema";
import { initialsOf } from "@/lib/avatar-colors";

export function AdminSidebar({
  user,
  active,
  pendingCount,
  studentCount,
}: {
  user: Profile;
  active: "ogretmenler" | "ogrenciler" | "kayitlar" | null;
  pendingCount: number;
  studentCount: number;
}) {
  return (
    <>
      <SidebarBrand subtitle="Yönetim paneli" />
      <SidebarNav>
        <SidebarNavLink
          href="/yonetim/ogretmenler"
          icon={UserCog}
          active={active === "ogretmenler"}
          badge={
            pendingCount > 0 ? (
              <span className="rounded-[5px] bg-warn-soft px-1.5 py-0.5 font-mono text-[11px] font-medium text-warn-text">
                {pendingCount}
              </span>
            ) : undefined
          }
        >
          Öğretmenler
        </SidebarNavLink>
        <SidebarNavLink
          href="/yonetim/ogrenciler"
          icon={Users}
          active={active === "ogrenciler"}
          badge={<span className="font-mono text-xs text-muted">{studentCount}</span>}
        >
          Öğrenciler
        </SidebarNavLink>
        <SidebarNavLink href="/yonetim/kayitlar" icon={ClipboardList} active={active === "kayitlar"}>
          Etüt kayıtları
        </SidebarNavLink>
      </SidebarNav>

      <SidebarSpacer />
      <SidebarUserCard
        initials={initialsOf(`${user.firstName} ${user.lastName}`)}
        avatarClassName="bg-ink text-bg"
        name={`${user.firstName} ${user.lastName}`}
        roleLabel="Tam yetki"
        profileHref="/profil"
        signOutAction={signOutAction}
      />
    </>
  );
}
