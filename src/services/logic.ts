import type { Appointment, Cadence, SalonEvent, Session, Treatment, TreatmentStatus, ZoneId } from '../types';
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
  const today = todayISO();
  const hasPending = appointments.some((a) => a.treatmentId === t.id && a.dateISO >= today);
  // A one-off (an event add-on) never nags on the avatar — it lives in event prep.
  if (t.oneOff) return hasPending ? 'booked' : 'onTrack';
  // Only a *pending* booking counts. A date that has already passed without
  // being logged shouldn't keep the ritual reading as sorted forever.
  if (hasPending) return 'booked';
  const days = diffDays(today, nextDueISO(t));
  if (days < 0) return 'bookNow';
  // Lead scales with the interval: a 10-day window is right for a monthly ritual
  // but would make a weekly/daily one read "coming up" forever. Cap at LEAD_DAYS.
  const lead = Math.min(LEAD_DAYS, Math.max(1, Math.ceil(cadenceDays(t.cadence) / 3)));
  if (days <= lead) return 'comingUp';
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
  projected: number; // due-but-unbooked in a future month (0 for past/current)
}

/** Due-but-unbooked spend for a given month: treatments falling due that month
 *  with no appointment already covering that month. */
function projectedForMonth(monthISO: string, appointments: Appointment[], treatments: Treatment[]): number {
  return treatments
    .filter((t) => !appointments.some((a) => a.treatmentId === t.id && isSameMonth(a.dateISO, monthISO)))
    .filter((t) => isSameMonth(nextDueISO(t), monthISO))
    .reduce((x, t) => x + t.price, 0);
}

/** Spent per month from history, booked from appointments, plus projected
 *  (due-but-unbooked) for future months so the forecast bar matches the hero. */
export function budgetByMonth(
  sessions: Session[],
  appointments: Appointment[],
  treatments: Treatment[],
): BudgetMonth[] {
  const today = todayISO();
  const thisM = startOfMonth(today);
  const months: BudgetMonth[] = [];
  for (let off = -5; off <= 1; off++) {
    const monthISO = startOfMonth(addMonths(today, off));
    const spent = sessions
      .filter((s) => isSameMonth(s.dateISO, monthISO))
      .reduce((sum, s) => sum + s.price, 0);
    const booked = appointments
      .filter((a) => isSameMonth(a.dateISO, monthISO))
      .reduce((sum, a) => sum + a.price, 0);
    const projected = monthISO > thisM ? projectedForMonth(monthISO, appointments, treatments) : 0;
    months.push({ monthISO, spent, booked, projected });
  }
  return months;
}

export function spentThisMonth(sessions: Session[]): number {
  const m = startOfMonth(todayISO());
  return sessions.filter((s) => isSameMonth(s.dateISO, m)).reduce((x, s) => x + s.price, 0);
}

export function bookedThisMonth(appointments: Appointment[]): number {
  const today = todayISO();
  const m = startOfMonth(today);
  // only still-upcoming visits this month count as "still booked"
  return appointments
    .filter((a) => isSameMonth(a.dateISO, m) && a.dateISO >= today)
    .reduce((x, a) => x + a.price, 0);
}

/** How many distinct treatments fall due next month without a booking — drives
 *  the forecast copy so it can't contradict the numbers. */
export function projectedNextMonthCount(appointments: Appointment[], treatments: Treatment[]): number {
  const next = startOfMonth(addMonths(todayISO(), 1));
  return treatments
    .filter((t) => !appointments.some((a) => a.treatmentId === t.id && isSameMonth(a.dateISO, next)))
    .filter((t) => isSameMonth(nextDueISO(t), next)).length;
}

export function expectedNextMonth(appointments: Appointment[], treatments: Treatment[]): number {
  const next = startOfMonth(addMonths(todayISO(), 1));
  const booked = appointments
    .filter((a) => isSameMonth(a.dateISO, next))
    .reduce((x, a) => x + a.price, 0);
  // Treatments due next month with no appointment *that month* (an appointment
  // in some other month must not suppress the projection).
  return booked + projectedForMonth(next, appointments, treatments);
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

/** How long a ritual stays "fresh" after it's done — its own cadence length in
 *  days. Used to decide whether one appointment can carry over to a later event. */
function cadenceDays(c: Cadence): number {
  const per = c.unit === 'day' ? 1 : c.unit === 'week' ? 7 : 30;
  return Math.max(1, c.every) * per;
}

export interface EventRef {
  id: string;
  name: string;
  dateISO: string;
}

/** A ritual that comes due before your events and isn't booked yet. */
export interface PrepRitual {
  treatment: Treatment;
  /** When it next comes due — roughly when to book it by. */
  doByISO: string;
  /** The events it falls before (so one booking can serve several). */
  events: EventRef[];
  /** Relevant to more than one event. */
  shared: boolean;
  /** Already overdue. */
  urgent: boolean;
}

/** An appointment already on the books between now and your events. */
export interface BookedItem {
  treatment?: Treatment;
  name: string;
  dateISO: string;
  timeLabel?: string;
  clinicId?: string;
  /** The events this visit comes before. */
  events: EventRef[];
  shared: boolean;
}

export interface EventReadiness {
  /** Per event: how much of what falls before it is already booked. */
  perEvent: { id: string; name: string; dateISO: string; total: number; booked: number }[];
  /** Everything already booked between today and your last event. */
  booked: BookedItem[];
  /** Usuals (and one-off add-ons) that come due before an event and aren't booked. */
  toBook: PrepRitual[];
}

/**
 * Your schedule from now until your events: what's already on the books, what
 * still needs booking, and which events each thing falls before. Everything is
 * derived from real dates — a booking made before an event existed still counts,
 * and anything that serves more than one event is tagged with each of them.
 */
export function eventReadiness(
  events: SalonEvent[],
  treatments: Treatment[],
  appointments: Appointment[],
): EventReadiness {
  const today = todayISO();
  const upcoming = events
    .filter((e) => diffDays(today, e.dateISO) >= 0)
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  if (upcoming.length === 0) return { perEvent: [], booked: [], toBook: [] };
  const lastEvent = upcoming[upcoming.length - 1]!.dateISO;
  const evRefs: EventRef[] = upcoming.map((e) => ({ id: e.id, name: e.name, dateISO: e.dateISO }));
  const eventsFrom = (dateISO: string) => evRefs.filter((e) => e.dateISO >= dateISO);

  // Already on the books between now and the last event — her usuals, whatever
  // she's booked, whether or not she booked it "for" an event.
  const booked: BookedItem[] = appointments
    .filter((a) => a.dateISO >= today && a.dateISO <= lastEvent)
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
    .map((a) => {
      const tr = treatments.find((t) => t.id === a.treatmentId);
      const ev = eventsFrom(a.dateISO);
      return {
        treatment: tr,
        name: tr?.name ?? 'Appointment',
        dateISO: a.dateISO,
        timeLabel: a.timeLabel,
        clinicId: a.clinicId,
        events: ev,
        shared: ev.length > 1,
      };
    });
  const bookedIds = new Set(booked.map((b) => b.treatment?.id).filter(Boolean));

  // Usuals (and one-off add-ons) that come due on/before an event and aren't
  // booked — what she still needs to schedule before her events.
  const toBook: PrepRitual[] = [];
  for (const tr of treatments) {
    if (bookedIds.has(tr.id)) continue;
    const due = nextDueISO(tr);
    if (due > lastEvent) continue; // stays fresh past all her events → no prep needed
    const ev = eventsFrom(due < today ? today : due);
    if (!ev.length) continue;
    toBook.push({
      treatment: tr,
      doByISO: due,
      events: ev,
      shared: ev.length > 1,
      urgent: diffDays(today, due) < 0,
    });
  }
  toBook.sort((a, b) => a.doByISO.localeCompare(b.doByISO));

  const perEvent = upcoming.map((ev) => {
    const b = booked.filter((x) => x.events.some((e) => e.id === ev.id)).length;
    const tb = toBook.filter((x) => x.events.some((e) => e.id === ev.id)).length;
    return { id: ev.id, name: ev.name, dateISO: ev.dateISO, total: b + tb, booked: b };
  });

  return { perEvent, booked, toBook };
}
