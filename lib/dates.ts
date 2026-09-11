// Minimal date utility wrappers used by scoring.ts and throughout the app.
// Using native Date to avoid adding date-fns dependency.

export function format(date: Date, formatStr: string): string {
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthFull = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Token-based replacement in longest-first order to avoid substring collisions
  const tokens: [string, string][] = [
    ["yyyy", String(year)],
    ["MMMM", monthFull[month - 1]],
    ["MMM", monthNames[month - 1]],
    ["MM", pad(month)],
    ["dd", pad(day)],
    ["d", String(day)],
  ];

  let result = formatStr;
  for (const [token, value] of tokens) {
    result = result.split(token).join(value);
  }
  return result;
}

export function parseISO(dateStr: string): Date {
  // Parse YYYY-MM-DD as local date (not UTC)
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function today(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function subDays(date: Date, days: number): Date {
  return addDays(date, -days);
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function isWithinInterval(date: Date, { start, end }: { start: Date; end: Date }): boolean {
  return date >= start && date <= end;
}

export function eachDayOfInterval({ start, end }: { start: Date; end: Date }): Date[] {
  const days: Date[] = [];
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);
  while (current <= endDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

export function eachWeekOfInterval({ start, end }: { start: Date; end: Date }): Date[] {
  const weeks: Date[] = [];
  const current = startOfWeek(new Date(start));
  const endDate = new Date(end);
  while (current <= endDate) {
    weeks.push(new Date(current));
    current.setDate(current.getDate() + 7);
  }
  return weeks;
}

export function eachMonthOfInterval({ start, end }: { start: Date; end: Date }): Date[] {
  const months: Date[] = [];
  const current = startOfMonth(new Date(start));
  const endDate = new Date(end);
  while (current <= endDate) {
    months.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }
  return months;
}

export function getDateRange(range: "week" | "month" | "year", endDate?: string): { start: string; end: string } {
  const end = endDate ? parseISO(endDate) : new Date();
  const start = new Date(end);

  if (range === "week") {
    start.setDate(start.getDate() - 6);
  } else if (range === "month") {
    start.setDate(start.getDate() - 29);
  } else if (range === "year") {
    start.setDate(start.getDate() - 364);
  }

  return {
    start: format(start, "yyyy-MM-dd"),
    end: format(end, "yyyy-MM-dd"),
  };
}

export function formatDisplayDate(dateStr: string): string {
  const d = parseISO(dateStr);
  return format(d, "MMM d, yyyy");
}

export function getDefaultGranularity(range: "week" | "month" | "year" | "custom", startDate?: string, endDate?: string): "daily" | "weekly" | "monthly" {
  if (range === "week") return "daily";
  if (range === "month") return "daily";
  if (range === "year") return "weekly";
  // Custom: pick based on date span
  if (startDate && endDate) {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 31) return "daily";
    if (diffDays <= 180) return "weekly";
    return "monthly";
  }
  return "daily";
}
