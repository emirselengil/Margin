/** Öğretmenin çalıştığı eğitim seviyesi. "Dal" = branş (ders alanı) + seviye. */
export const LEVELS = ["ilkokul", "ortaokul", "lise"] as const;
export type Level = (typeof LEVELS)[number];

export const LEVEL_LABELS: Record<Level, string> = {
  ilkokul: "İlkokul",
  ortaokul: "Ortaokul",
  lise: "Lise",
};

export function isLevel(value: unknown): value is Level {
  return typeof value === "string" && (LEVELS as readonly string[]).includes(value);
}
