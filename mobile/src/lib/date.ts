// Web'deki lib/date.ts ile aynı kurallar: hafta Pazartesi'den başlar,
// 0 = Pazartesi … 6 = Pazar. Saat dilimi Europe/Istanbul.
const TIMEZONE = "Europe/Istanbul";

export const WEEKDAY_SHORT = ["PZT", "SAL", "ÇAR", "PER", "CUM", "CMT", "PAZ"];
export const WEEKDAY_LONG = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const MONTHS_SHORT = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
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
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function at(iso: string) {
  return new Date(`${iso}T12:00:00`);
}

export function weekdayOfISODate(iso: string): number {
  return (at(iso).getDay() + 6) % 7;
}

export function addDaysISO(iso: string, delta: number): string {
  const d = at(iso);
  d.setDate(d.getDate() + delta);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function startOfWeekISO(iso: string): string {
  return addDaysISO(iso, -weekdayOfISODate(iso));
}

export function dayOfMonth(iso: string): number {
  return at(iso).getDate();
}

export function monthShortOfISO(iso: string): string {
  return MONTHS_SHORT[at(iso).getMonth()];
}

export function formatLong(iso: string): string {
  const d = at(iso);
  return `${WEEKDAY_LONG[weekdayOfISODate(iso)]}, ${d.getDate()} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDayMonth(iso: string): string {
  const d = at(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** "SAL 06.10.2026" */
export function formatBadgeDate(iso: string): string {
  const d = at(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${WEEKDAY_SHORT[weekdayOfISODate(iso)]} ${dd}.${mm}.${d.getFullYear()}`;
}

function trUpper(s: string) {
  return s.replace(/i/g, "İ").replace(/ı/g, "I").toUpperCase();
}

/** "PERŞEMBE · 01.10.2026" */
export function formatTimelineDate(iso: string): string {
  const d = at(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${trUpper(WEEKDAY_LONG[weekdayOfISODate(iso)])} · ${dd}.${mm}.${d.getFullYear()}`;
}
