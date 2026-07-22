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

/** One thing to do (or already done) for one or more events. A single visit —
 *  because a ritual done once stays fresh across nearby events. */
export interface PrepRitual {
  treatment: Treatment;
  /** Recommended "have it done by" date, backed off the earliest event it serves. */
  doByISO: string;
  /** Every event this one visit covers — a real, derived list, never assumed. */
  events: EventRef[];
  /** True when a real appointment already sits in this visit's window. */
  booked: boolean;
  /** The appointment that covers it, if booked (so the UI can show its date). */
  bookedApptId?: string;
  bookedDateISO?: string;
  /** One visit serving more than one event. */
  shared: boolean;
  /** The event is so close the ideal date has already passed — book ASAP. */
  urgent: boolean;
}

export interface EventReadiness {
  /** Per event: how much of its prep is already booked (drives a progress line). */
  perEvent: { id: string; name: string; dateISO: string; total: number; booked: number }[];
  /** Rituals a real appointment already covers. */
  booked: PrepRitual[];
  /** Rituals still to schedule, soonest first. */
  toBook: PrepRitual[];
}

/**
 * Break one ritual into the visits its upcoming events need. A visit stays fresh
 * for the ritual's cadence length, so nearby events fold into one visit; events
 * beyond that window get their own. Coverage (booked or not) is *derived* from
 * real appointment dates — so a booking made before an event was even added
 * still counts, and nothing is silently assumed.
 */
function prepForTreatment(
  tr: Treatment,
  upcoming: { ev: SalonEvent }[] | SalonEvent[],
  appointments: Appointment[],
  today: string,
): PrepRitual[] {
  const events = (upcoming as SalonEvent[]);
  const lead = EVENT_LEAD[tr.zone] ?? 5;
  const fresh = cadenceDays(tr.cadence);
  const targets = events.map((ev) => ({ ev, doBy: addDays(ev.dateISO, -lead) }));
  const out: PrepRitual[] = [];
  let i = 0;
  while (i < targets.length) {
    const doByISO = targets[i].doBy;
    // Always cover at least event i, then fold in any later event this one visit
    // stays fresh for. Seeding with event i keeps `covered` non-empty (no crash
    // when lead > freshness) and guarantees `i` advances.
    const first = targets[i].ev;
    const covered: EventRef[] = [{ id: first.id, name: first.name, dateISO: first.dateISO }];
    let j = i + 1;
    while (j < targets.length && diffDays(doByISO, targets[j].ev.dateISO) <= fresh) {
      const { ev } = targets[j];
      covered.push({ id: ev.id, name: ev.name, dateISO: ev.dateISO });
      j++;
    }
    const windowEnd = covered[covered.length - 1].dateISO;

    // Already fresh from a recent completion through the last event it serves?
    // Then it needs no prep — don't nag her to re-book it.
    const freshFromDone = diffDays(tr.lastDoneISO, windowEnd) <= fresh;
    if (!freshFromDone) {
      // A real appointment covers it when it lands on/before the last event and
      // is still fresh there (within `fresh` days of it) — so a booking made
      // even before the event was added still counts.
      const windowStart = addDays(windowEnd, -fresh);
      const appt = appointments
        .filter((a) => a.treatmentId === tr.id && a.dateISO >= windowStart && a.dateISO <= windowEnd)
        .sort((a, b) => a.dateISO.localeCompare(b.dateISO))[0];
      out.push({
        treatment: tr,
        doByISO,
        events: covered,
        booked: !!appt,
        bookedApptId: appt?.id,
        bookedDateISO: appt?.dateISO,
        shared: covered.length > 1,
        urgent: !appt && diffDays(today, doByISO) < 0,
      });
    }
    i = j;
  }
  return out;
}

/**
 * The connected picture across every upcoming event: what's already booked (and
 * which events each booking covers), what's still to schedule, what one visit
 * covers for several events, and how ready each event is. Nothing is merged
 * behind the user's back — the sharing is shown, and it's all reversible.
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

  const all: PrepRitual[] = [];
  for (const tr of treatments) all.push(...prepForTreatment(tr, upcoming, appointments, today));

  const byDate = (a: PrepRitual, b: PrepRitual) => a.doByISO.localeCompare(b.doByISO);
  const perEvent = upcoming.map((ev) => {
    const rel = all.filter((p) => p.events.some((e) => e.id === ev.id));
    return {
      id: ev.id,
      name: ev.name,
      dateISO: ev.dateISO,
      total: rel.length,
      booked: rel.filter((p) => p.booked).length,
    };
  });
  return {
    perEvent,
    booked: all.filter((p) => p.booked).sort(byDate),
    toBook: all.filter((p) => !p.booked).sort(byDate),
  };
}
