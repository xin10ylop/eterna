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
/** Lead scales with the interval: a 10-day window is right for a monthly ritual
 *  but would make a weekly/daily one read "coming up" forever. Cap at LEAD_DAYS. */
export function treatmentLead(t: Treatment): number {
  return Math.min(LEAD_DAYS, Math.max(1, Math.ceil(cadenceDays(t.cadence) / 3)));
}

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
  if (days <= treatmentLead(t)) return 'comingUp';
  return 'onTrack';
}

export function needsAttention(status: TreatmentStatus): boolean {
  return status === 'comingUp' || status === 'bookNow';
}

/** What the avatar shows. Two colours only: maroon for "coming up", red for
 *  "overdue". calm is not a colour — just a quiet shimmer so the area stays
 *  tappable without shouting. */
export type GlowStatus = 'calm' | 'soon' | 'due';

export interface ZoneGlowInfo {
  status: GlowStatus;
  /** For `soon`: how far through the booking window we are (0 = the window just
   *  opened, 1 = due tomorrow). Drives the breathing speed — the glow pulses
   *  faster as the day approaches. 1 for `due`, 0 for `calm`. */
  urgency: number;
}

/** Worst glow among a zone's treatments (due > soon > calm), with the highest
 *  urgency among the "soon" ones so the pulse tracks the closest deadline. */
export function zoneGlowInfo(
  zone: ZoneId,
  treatments: Treatment[],
  appointments: Appointment[],
): ZoneGlowInfo {
  let status: GlowStatus = 'calm';
  let urgency = 0;
  for (const tr of treatments) {
    if (tr.zone !== zone) continue;
    const s = treatmentStatus(tr, appointments);
    if (s === 'bookNow') return { status: 'due', urgency: 1 };
    if (s === 'comingUp') {
      const days = Math.max(0, diffDays(todayISO(), nextDueISO(tr)));
      const u = Math.min(1, Math.max(0, 1 - days / Math.max(1, treatmentLead(tr))));
      status = 'soon';
      urgency = Math.max(urgency, u);
    }
  }
  return { status, urgency };
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

/** Where one of an event's chosen rituals stands — the five real situations:
 *  booked   — an appointment lands where it will actually be fresh at the event
 *  fresh    — recently done, still fresh on the day; nothing needed
 *  move     — she HAS a booking, but it's after the event or too early to last
 *             (her usual Friday nails vs. a Wednesday event) — shift it
 *  toBook   — comes due before the event and nothing is booked
 *  later    — the event is further away than this ritual lasts; her normal
 *             routine covers her for now, we'll surface it closer */
export type EventItemStatus = 'booked' | 'fresh' | 'move' | 'toBook' | 'later';

export interface EventItem {
  treatment: Treatment;
  status: EventItemStatus;
  /** The covering appointment's date, when booked. */
  apptDateISO?: string;
  /** The misplaced appointment's date, when status is `move`. */
  moveDateISO?: string;
  /** Best date to book by — the sooner of "when it comes due" and "the ideal
   *  window before the event" (filler needs time to settle; nails go last-minute). */
  bookByISO: string;
  /** When it next comes due. */
  dueISO: string;
  /** Other upcoming events that ALSO chose this ritual — shown so she can
   *  coordinate (one booking might do for both). Never merged for her. */
  alsoFor: EventRef[];
}

/**
 * The status of each ritual she chose for one event — nothing inferred beyond
 * her own picks. An appointment only counts as covering the event when it lands
 * inside the window where the ritual will still be fresh on the day; a booking
 * outside that window (after the event, or too early to last) becomes `move`.
 */
export function eventItems(
  event: SalonEvent,
  treatments: Treatment[],
  appointments: Appointment[],
  allEvents: SalonEvent[],
): EventItem[] {
  const today = todayISO();
  return event.treatmentIds
    .map((id): EventItem | null => {
      const tr = treatments.find((t) => t.id === id);
      if (!tr) return null;
      const fresh = cadenceDays(tr.cadence);
      const lead = EVENT_LEAD[tr.zone] ?? 3;
      // done inside [event - fresh, event] → still fresh on the day
      const windowStart = addDays(event.dateISO, -fresh);
      const future = appointments
        .filter((a) => a.treatmentId === id && a.dateISO >= today)
        .sort((a, b) => a.dateISO.localeCompare(b.dateISO));
      const covering = future.find((a) => a.dateISO >= windowStart && a.dateISO <= event.dateISO);
      const misplaced = future[0];
      const due = nextDueISO(tr);
      const idealBy = addDays(event.dateISO, -lead);
      const bookByISO = due < idealBy ? due : idealBy;
      const alsoFor: EventRef[] = allEvents
        .filter((e) => e.id !== event.id && e.dateISO >= today && e.treatmentIds.includes(id))
        .map((e) => ({ id: e.id, name: e.name, dateISO: e.dateISO }));

      let status: EventItemStatus;
      if (covering) status = 'booked';
      else if (due > event.dateISO) status = 'fresh';
      else if (!tr.oneOff && diffDays(today, event.dateISO) > fresh) status = 'later';
      else if (misplaced) status = 'move';
      else status = 'toBook';

      return {
        treatment: tr,
        status,
        apptDateISO: covering?.dateISO,
        moveDateISO: status === 'move' ? misplaced?.dateISO : undefined,
        bookByISO,
        dueISO: due,
        alsoFor,
      };
    })
    .filter((x): x is EventItem => x !== null);
}

/** Progress over what's actionable now — `later` items aren't counted, so a far
 *  event doesn't read as unready when there's nothing to do yet. */
export function eventProgress(items: EventItem[]): { done: number; total: number } {
  const actionable = items.filter((i) => i.status !== 'later');
  return {
    total: actionable.length,
    done: actionable.filter((i) => i.status === 'booked' || i.status === 'fresh').length,
  };
}

/** Upcoming appointments she has that no upcoming event claimed — her routine /
 *  other commitments, so she can manage everything together. */
export function unplannedUpcoming(
  events: SalonEvent[],
  treatments: Treatment[],
  appointments: Appointment[],
): { appt: Appointment; treatment?: Treatment }[] {
  const today = todayISO();
  const claimed = new Set(
    events.filter((e) => e.dateISO >= today).flatMap((e) => e.treatmentIds),
  );
  return appointments
    .filter((a) => a.dateISO >= today && !claimed.has(a.treatmentId))
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
    .map((a) => ({ appt: a, treatment: treatments.find((t) => t.id === a.treatmentId) }));
}
