export function normalizePhone(phone: string): string {
  let p = (phone || "").replace(/[\s\-()]/g, "");
  if (p.startsWith("00961")) p = "+" + p.slice(2);
  if (p.startsWith("961")) p = "+" + p;
  if (!p.startsWith("+") && p.startsWith("0")) p = "+961" + p.slice(1);
  return p;
}

export function isValidLebanesePhone(phone: string): boolean {
  return /^\+961\d{7,8}$/.test(normalizePhone(phone));
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Returns an array of the next `count` days as { key: YYYY-MM-DD, ... }.
export function nextDays(count: number) {
  const days = [];
  const now = new Date();
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
    days.push({ key, weekday: weekdays[d.getDay()], day: d.getDate(), isToday: i === 0 });
  }
  return days;
}

export const HOURLY_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00",
  "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00",
];

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatMoney(n: number): string {
  return `$${Number(n || 0).toLocaleString()}`;
}
