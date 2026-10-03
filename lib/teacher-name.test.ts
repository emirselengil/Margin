import { describe, expect, it } from "vitest";

import { HIDDEN_TEACHER_NAME, teacherDisplayName } from "@/lib/teacher-name";

const active = { firstName: "Ayşe", lastName: "Yıldız", isActive: true };
const inactive = { ...active, isActive: false };

describe("teacherDisplayName", () => {
  it("aktif öğretmenin adını herkese gösterir", () => {
    expect(teacherDisplayName(active, "assistant")).toBe("Ayşe Yıldız");
    expect(teacherDisplayName(active, "head_teacher")).toBe("Ayşe Yıldız");
  });

  it("pasif öğretmenin adını yönetici dışında kimseye göstermez", () => {
    expect(teacherDisplayName(inactive, "assistant")).toBe(HIDDEN_TEACHER_NAME);
    expect(teacherDisplayName(inactive, "head_teacher")).toBe(HIDDEN_TEACHER_NAME);
    expect(teacherDisplayName(inactive, "pending")).toBe(HIDDEN_TEACHER_NAME);
  });

  it("yönetici pasif öğretmeni de görür", () => {
    expect(teacherDisplayName(inactive, "admin")).toBe("Ayşe Yıldız");
  });
});
