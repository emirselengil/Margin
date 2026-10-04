import { describe, expect, it } from "vitest";

import { ApiError, readBody, requireDate, requireOneOf, requireString } from "@/lib/api-validation";

describe("requireDate", () => {
  it("geçerli YYYY-MM-DD tarihini kabul eder", () => {
    expect(requireDate("2026-10-04")).toBe("2026-10-04");
  });

  it("biçimi bozuk veya olmayan tarihi 400 ile reddeder", () => {
    for (const bad of ["2026-13-45", "04.10.2026", "", null, undefined, 20261004]) {
      expect(() => requireDate(bad)).toThrow(ApiError);
    }
    try {
      requireDate("x");
    } catch (e) {
      expect((e as ApiError).status).toBe(400);
    }
  });
});

describe("requireOneOf", () => {
  it("izin verilen değeri döner, diğerlerini reddeder", () => {
    expect(requireOneOf("done", ["done", "missing"] as const, "Ödev")).toBe("done");
    expect(() => requireOneOf("x", ["done", "missing"] as const, "Ödev")).toThrow(ApiError);
    expect(() => requireOneOf(undefined, ["done", "missing"] as const, "Ödev")).toThrow(ApiError);
  });
});

describe("requireString", () => {
  it("kırpılmış metni döner; boş, çok uzun veya metin olmayanı reddeder", () => {
    expect(requireString("  Ali  ", "Ad")).toBe("Ali");
    expect(() => requireString("   ", "Ad")).toThrow(ApiError);
    expect(() => requireString("a".repeat(201), "Ad")).toThrow(ApiError);
    expect(() => requireString(5, "Ad")).toThrow(ApiError);
  });
});

describe("readBody", () => {
  it("geçerli JSON gövdesini okur, bozuk gövdede 400 verir", async () => {
    const ok = new Request("http://x", { method: "POST", body: JSON.stringify({ a: 1 }) });
    expect(await readBody(ok)).toEqual({ a: 1 });
    const bad = new Request("http://x", { method: "POST", body: "{not json" });
    await expect(readBody(bad)).rejects.toThrow(ApiError);
  });
});
