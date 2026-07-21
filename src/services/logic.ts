import type { Appointment, Session, Treatment, TreatmentStatus, ZoneId } from '../types';
import { addCadence, addDays, diffDays, isSameMonth, addMonths, startOfMonth, todayISO } from '../lib/dates';

/** How many days before the due date we start nudging a booking. Salons fill
 *  up fast (especially around events), so we lead with a comfortable window. */
export const LEAD_DAYS = 10;

export function nextDueISO(t: Treatment): string {
  return addCadence(t.lastDoneISO, t.cadence);
}

/**
 * Status is about *booking*, not lateness. If an appointment is on the books
 * for this cycle she's sorted; otherwise it escalates as the interval elapses.
 */
export function treatmentStatus(t: Treatment, appointments: Appointment[]): TreatmentStatus {
  if (appointments.some((a) => a.treatmentId === t.id)) return 'booked';
  const days = diffDays(todayISO(), nextDueISO(t));
  if (days < 0) return 'bookNow';
  if (days <= LEAD_DAYS) return 'comingUp';
  return 'onTrack';
}

export function needsAttention(status: TreatmentStatus): boolean {
  return status === 'comingUp' || status === 'bookNow';
}

/** The three glow levels the avatar shows. onTrack + booked both read calm. */
export type GlowStatus = 'calm' | 'soon' | 'due';

export function glowForStatus(status: TreatmentStatus): GlowStatus {
  if (status === 'bookNow') return 'due';
  if (status === 'comingUp') return 'soon';
  return 'calm';
}

/** Worst glow among a zone's treatments (due > soon > calm). */
export function zoneGlow(
  zone: ZoneId,
  treatments: Treatment[],
  appointments: Appointment[],
): GlowStatus {
  let g: GlowStatus = 'calm';
  for (const tr of treatments) {
    if (tr.zone !== zone) continue;
    const s = glowForStatus(treatmentStatus(tr, appointments));
    if (s === 'due') return 'due';
    if (s === 'soon') g = 'soon';
  }
  return g;
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
      .reduce((sum, s) => sum + s.price, 0);
    const booked = appointments
      .filter((a) => isSameMonth(a.dateISO, monthISO))
      .reduce((sum, a) => sum + a.price, 0);
    months.push({ monthISO, spent, booked });
  }
  return months;
}

export function spentThisMonth(sessions: Session[]): number {
  const m = startOfMonth(todayISO());
  return sessions.filter((s) => isSameMonth(s.dateISO, m)).reduce((x, s) => x + s.price, 0);
}

export function bookedThisMonth(appointments: Appointment[]): number {
  const m = startOfMonth(todayISO());
  return appointments.filter((a) => isSameMonth(a.dateISO, m)).reduce((x, a) => x + a.price, 0);
}

export function expectedNextMonth(appointments: Appointment[], treatments: Treatment[]): number {
  const next = startOfMonth(addMonths(todayISO(), 1));
  const booked = appointments
    .filter((a) => isSameMonth(a.dateISO, next))
    .reduce((x, a) => x + a.price, 0);
  // Treatments that will fall due next month but have no appointment yet.
  const projected = treatments
    .filter((t) => !appointments.some((a) => a.treatmentId === t.id))
    .filter((t) => isSameMonth(nextDueISO(t), next))
    .reduce((x, t) => x + t.price, 0);
  return booked + projected;
}

/* --------------------------------- Event prep -------------------------------- */

/** How many days before an event each zone should ideally be freshened. Filler
 *  needs time to settle; hair and nails are best done right before. */
const EVENT_LEAD: Record<ZoneId, number> = {
  lips: 14,
  face: 7,
  hips: 10,
  torso: 5,
  legs: 4,
  hair: 3,
  hands: 2,
};

export interface EventPlanItem {
  treatment: Treatment;
  /** Recommended "have it done by" date, backed off from the event. */
  doByISO: string;
}

/**
 * Back-plan every ritual from an event date so it peaks in time, ordered by
 * when it needs to happen. Drops anything whose window has clearly passed.
 */
export function eventPlan(eventDateISO: string, treatments: Treatment[]): EventPlanItem[] {
  return treatments
    .map((tr) => ({ treatment: tr, doByISO: addDays(eventDateISO, -(EVENT_LEAD[tr.zone] ?? 5)) }))
    .filter((x) => diffDays(todayISO(), x.doByISO) >= -3)
    .sort((a, b) => a.doByISO.localeCompare(b.doByISO));
}
