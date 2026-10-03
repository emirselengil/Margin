export const ROLE_HOME = {
  admin: "/yonetim/ogretmenler",
  head_teacher: "/ogrencilerim",
  assistant: "/etut",
  pending: "/onay-bekliyor",
} as const;

export type Role = keyof typeof ROLE_HOME;

// head_teacher ve assistant aynı görünür etikete sahip: bu ayrım yalnızca
// arka planda (yetki kuralları, veri modeli) var; görsel olarak kullanıcıya
// hep tek bir "Öğretmen" kimliği gösteriliyor. Roller atanırken (yönetici
// paneli) hâlâ ayrı ayrı seçilebiliyor, bkz. teacher-manager.tsx.
export const ROLE_LABELS: Record<Role, string> = {
  admin: "Yönetici",
  head_teacher: "Öğretmen",
  assistant: "Öğretmen",
  pending: "Onay bekliyor",
};
