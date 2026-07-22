/** Date helpers. Pure functions, no deps. All "today" logic goes through
 *  `todayISO()` so tests (and the demo seed) can stay deterministic. */

import type { Cadence } from '../types';
import { getLocale } from './locale';

export function todayISO(): string {
  return toISO(new Date());
}

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromISO(iso: string): Date {
  const parts = iso.split('-').map(Number);
  return new Date(parts[0] ?? 1970, (parts[1] ?? 1) - 1, parts[2] ?? 1);
}

export function addDays(iso: string, days: number): string {
  const d = fromISO(iso);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

export function addWeeks(iso: string, weeks: number): string {
  return addDays(iso, weeks * 7);
}

export function addMonths(iso: string, months: number): string {
  const d = fromISO(iso);
  const day = d.getDate();
  // clamp to the target month's length so Jan 31 + 1mo is Feb 28, not Mar 3
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const daysInTarget = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, daysInTarget));
  return toISO(d);
}

/** Advance a date by one cadence interval (days / weeks / months). */
export function addCadence(iso: string, c: Cadence): string {
  if (c.unit === 'day') return addDays(iso, c.every);
  if (c.unit === 'week') return addWeeks(iso, c.every);
  return addMonths(iso, c.every);
}

/** The phrase after "every": "week" · "10 days" · "3 months". */
export function cadenceEvery(c: Cadence): string {
  return c.every === 1 ? c.unit : `${c.every} ${c.unit}s`;
}

export function diffDays(fromIso: string, toIso: string): number {
  const ms = fromISO(toIso).getTime() - fromISO(fromIso).getTime();
  return Math.round(ms / 86400000);
}

export function isSameMonth(aIso: string, bIso: string): boolean {
  return aIso.slice(0, 7) === bIso.slice(0, 7);
}

export function startOfMonth(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

export function daysInMonth(iso: string): number {
  const d = fromISO(iso);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

/** Monday-first weekday index, 0..6. */
export function weekdayMon0(iso: string): number {
  return (fromISO(iso).getDay() + 6) % 7;
}

export function startOfWeek(iso: string): string {
  return addDays(iso, -weekdayMon0(iso));
}

const MONTHS_BY: Record<string, string[]> = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
};
const MONTHS_SHORT_BY: Record<string, string[]> = {
  en: MONTHS_BY.en!.map((m) => m.slice(0, 3)),
  ar: MONTHS_BY.ar!, // Arabic month names don't abbreviate — use them whole
  fr: MONTHS_BY.fr!.map((m) => m.slice(0, 4)),
};
const WEEKDAYS_SHORT_BY: Record<string, string[]> = {
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  ar: ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'],
  fr: ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'],
};
const months = () => MONTHS_BY[getLocale()] ?? MONTHS_BY.en!;
const monthsShort = () => MONTHS_SHORT_BY[getLocale()] ?? MONTHS_SHORT_BY.en!;
const weekdaysShort = () => WEEKDAYS_SHORT_BY[getLocale()] ?? WEEKDAYS_SHORT_BY.en!;

export function formatMonthYear(iso: string): string {
  const d = fromISO(iso);
  return `${months()[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatMedium(iso: string): string {
  const d = fromISO(iso);
  return `${monthsShort()[d.getMonth()]} ${d.getDate()}`;
}

export function formatLong(iso: string): string {
  const d = fromISO(iso);
  return `${weekdaysShort()[weekdayMon0(iso)]}, ${monthsShort()[d.getMonth()]} ${d.getDate()}`;
}

export function monthShort(iso: string): string {
  return monthsShort()[fromISO(iso).getMonth()] ?? '';
}

export function weekdayShort(iso: string): string {
  return weekdaysShort()[weekdayMon0(iso)] ?? '';
}

/** "3 days overdue", "due tomorrow", "due in 5 weeks"… */
export function humanizeDue(nextDueISO: string): string {
  const days = diffDays(todayISO(), nextDueISO);
  if (days <= -14) return `${Math.round(-days / 7)} weeks overdue`;
  if (days < -1) return `${-days} days overdue`;
  if (days === -1) return '1 day overdue';
  if (days === 0) return 'due today';
  if (days === 1) return 'due tomorrow';
  if (days < 14) return `due in ${days} days`;
  return `due in ${Math.round(days / 7)} weeks`;
}
