import { describe, expect, it } from "vitest";

import { addDaysISO, startOfWeekISO, weekdayOfISODate } from "@/lib/date";

describe("weekdayOfISODate", () => {
  it("CLAUDE.md'deki 0=Pazartesi…6=Pazar kuralını izler", () => {
    // 2026-10-05 bir Pazartesi
    expect(weekdayOfISODate("2026-10-05")).toBe(0);
    expect(weekdayOfISODate("2026-10-06")).toBe(1); // Salı
    expect(weekdayOfISODate("2026-10-11")).toBe(6); // Pazar
  });
});

describe("addDaysISO / startOfWeekISO", () => {
  it("gün ekler/çıkarır", () => {
    expect(addDaysISO("2026-10-06", 1)).toBe("2026-10-07");
    expect(addDaysISO("2026-10-06", -7)).toBe("2026-09-29");
  });

  it("haftanın pazartesisini bulur", () => {
    expect(startOfWeekISO("2026-10-08")).toBe("2026-10-05");
    expect(startOfWeekISO("2026-10-05")).toBe("2026-10-05");
    expect(startOfWeekISO("2026-10-11")).toBe("2026-10-05");
  });
});
