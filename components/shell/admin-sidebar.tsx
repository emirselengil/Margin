import { Building2, ClipboardList, Inbox, UserCog, Users } from "lucide-react";

import { signOutAction } from "@/app/onay-bekliyor/actions";
import { countPendingBranchRequests } from "@/app/yonetim/talepler/data";
import { SidebarBrand, SidebarNav, SidebarNavLink, SidebarSpacer, SidebarUserCard } from "@/components/shell/sidebar";
import type { Profile } from "@/db/schema";
import { initialsOf } from "@/lib/avatar-colors";

export async function AdminSidebar({
  user,
  active,
  pendingCount,
  studentCount,
}: {
  user: Profile;
  active: "ogretmenler" | "ogrenciler" | "kayitlar" | "kurumlar" | "talepler" | null;
  pendingCount: number;
  studentCount: number;
}) {
  const requestCount = await countPendingBranchRequests();

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
        <SidebarNavLink href="/yonetim/kurumlar" icon={Building2} active={active === "kurumlar"}>
          Kurumlar ve branşlar
        </SidebarNavLink>
        <SidebarNavLink
          href="/yonetim/talepler"
          icon={Inbox}
          active={active === "talepler"}
          badge={
            requestCount > 0 ? (
              <span className="rounded-[5px] bg-warn-soft px-1.5 py-0.5 font-mono text-[11px] font-medium text-warn-text">
                {requestCount}
              </span>
            ) : undefined
          }
        >
          Branş talepleri
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
