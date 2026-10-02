import { describe, expect, it } from "vitest";

import { ROLE_HOME, ROLE_LABELS } from "@/lib/roles";

describe("ROLE_HOME", () => {
  it("CLAUDE.md'deki giriş sonrası yönlendirme kurallarıyla eşleşir", () => {
    expect(ROLE_HOME.admin).toBe("/yonetim/ogretmenler");
    expect(ROLE_HOME.head_teacher).toBe("/ogrencilerim");
    expect(ROLE_HOME.assistant).toBe("/etut");
    expect(ROLE_HOME.pending).toBe("/onay-bekliyor");
  });

  it("her rol için bir etiket tanımlanmış", () => {
    for (const role of Object.keys(ROLE_HOME) as (keyof typeof ROLE_HOME)[]) {
      expect(ROLE_LABELS[role]).toBeTruthy();
    }
  });
});
