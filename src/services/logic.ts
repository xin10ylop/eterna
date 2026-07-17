import type { Appointment, Session, Treatment, TreatmentStatus, ZoneId } from '../types';
import { addWeeks, diffDays, isSameMonth, addMonths, startOfMonth, todayISO } from '../lib/dates';

/** Days before the due date at which a treatment becomes "due soon". */
export const DUE_SOON_DAYS = 7;

export function nextDueISO(t: Treatment): string {
  return addWeeks(t.lastDoneISO, t.cadenceWeeks);
}

export function treatmentStatus(t: Treatment, appointments: Appointment[]): TreatmentStatus {
  if (appointments.some((a) => a.treatmentId === t.id)) return 'scheduled';
  const days = diffDays(todayISO(), nextDueISO(t));
  if (days < 0) return 'overdue';
  if (days <= DUE_SOON_DAYS) return 'dueSoon';
  return 'onTrack';
}

export function needsAttention(status: TreatmentStatus): boolean {
  return status === 'overdue' || status === 'dueSoon';
}

/** A zone needs attention when any of its treatments does. */
export function zoneAttentionCount(
  zone: ZoneId,
  treatments: Treatment[],
  appointments: Appointment[],
): number {
  return treatments.filter(
    (t) => t.zone === zone && needsAttention(treatmentStatus(t, appointments)),
  ).length;
}

export interface BudgetMonth {
  monthISO: string; // first of month
  spent: number; // completed sessions in that month
  booked: number; // appointments in that month
}

/** Spent per month from history + booked per month from appointments. */
export function budgetByMonth(sessions: Session[], appointments: Appointment[]): BudgetMonth[] {
  const t = todayISO();
  const months: BudgetMonth[] = [];
  for (let off = -5; off <= 1; off++) {
    const monthISO = startOfMonth(addMonths(t, off));
    const spent = sessions
      .filter((s) => isSameMonth(s.dateISO, monthISO))
      .reduce((sum, s) => sum + s.priceEUR, 0);
    const booked = appointments
      .filter((a) => isSameMonth(a.dateISO, monthISO))
      .reduce((sum, a) => sum + a.priceEUR, 0);
    months.push({ monthISO, spent, booked });
  }
  return months;
}

export function spentThisMonth(sessions: Session[]): number {
  const m = startOfMonth(todayISO());
  return sessions.filter((s) => isSameMonth(s.dateISO, m)).reduce((x, s) => x + s.priceEUR, 0);
}

export function bookedThisMonth(appointments: Appointment[]): number {
  const m = startOfMonth(todayISO());
  return appointments.filter((a) => isSameMonth(a.dateISO, m)).reduce((x, a) => x + a.priceEUR, 0);
}

export function expectedNextMonth(appointments: Appointment[], treatments: Treatment[]): number {
  const next = startOfMonth(addMonths(todayISO(), 1));
  const booked = appointments
    .filter((a) => isSameMonth(a.dateISO, next))
    .reduce((x, a) => x + a.priceEUR, 0);
  // Treatments that will fall due next month but have no appointment yet.
  const projected = treatments
    .filter((t) => !appointments.some((a) => a.treatmentId === t.id))
    .filter((t) => isSameMonth(nextDueISO(t), next))
    .reduce((x, t) => x + t.priceEUR, 0);
  return booked + projected;
}
