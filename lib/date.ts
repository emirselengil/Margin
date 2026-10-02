const TIMEZONE = "Europe/Istanbul";

export const WEEKDAY_SHORT = ["PZT", "SAL", "ÇAR", "PER", "CUM", "CMT", "PAZ"];
export const WEEKDAY_LONG = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
];
const MONTHS_SHORT = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
];
const MONTHS_LONG = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

/** Bugünün tarihi, Europe/Istanbul saat dilimine göre 'YYYY-MM-DD'. */
export function todayISODate(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const d = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${d}`;
}

/** 'YYYY-MM-DD' tarihinin haftanın günü: 0 = Pazartesi … 6 = Pazar. */
export function weekdayOfISODate(iso: string): number {
  const d = new Date(`${iso}T12:00:00`);
  return (d.getDay() + 6) % 7;
}

export function addDaysISO(iso: string, delta: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

/** Verilen tarihi içeren haftanın Pazartesi günü. */
export function startOfWeekISO(iso: string): string {
  return addDaysISO(iso, -weekdayOfISODate(iso));
}

export function formatShort(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return `${WEEKDAY_SHORT[weekdayOfISODate(iso)]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

export function formatLong(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return `${WEEKDAY_LONG[weekdayOfISODate(iso)]}, ${d.getDate()} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDayMonth(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** "SAL 06.10.2026" biçimi, rozet/etiketlerde kullanılır. */
export function formatBadgeDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${WEEKDAY_SHORT[weekdayOfISODate(iso)]} ${dd}.${mm}.${d.getFullYear()}`;
}

/** "PERŞEMBE · 01.10.2026" biçimi, zaman çizelgelerinde kullanılır. */
export function formatTimelineDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${WEEKDAY_LONG[weekdayOfISODate(iso)].toLocaleUpperCase("tr")} · ${dd}.${mm}.${d.getFullYear()}`;
}
