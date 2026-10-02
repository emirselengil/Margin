export const ROLE_HOME = {
  admin: "/yonetim/ogretmenler",
  head_teacher: "/ogrencilerim",
  assistant: "/etut",
  pending: "/onay-bekliyor",
} as const;

export type Role = keyof typeof ROLE_HOME;

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Yönetici",
  head_teacher: "Baş öğretmen",
  assistant: "Asistan öğretmen",
  pending: "Onay bekliyor",
};
