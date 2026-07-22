/**
 * Eterna domain model.
 *
 * These types are the contract between the UI and the data layer. The mock
 * repository in `src/services` implements them in memory today; a Supabase
 * repository can implement the same interfaces later without touching screens.
 */

/** Fixed anatomical zones shown on the avatar. Markers are FIXED per zone —
 *  a zone aggregates every treatment that belongs to it. */
export type ZoneId = 'hair' | 'face' | 'lips' | 'torso' | 'hands' | 'hips' | 'legs';

export interface Zone {
  id: ZoneId;
  label: string;
  /** Marker position on the front avatar frame, in % of the rendered image box. */
  marker: { xPct: number; yPct: number };
}

export type PractitionerRole =
  | 'Dermatologist'
  | 'Nurse injector'
  | 'Aesthetic doctor'
  | 'Colorist'
  | 'Hair stylist'
  | 'Nail artist'
  | 'Esthetician'
  | 'Lash technician'
  | 'Laser technician'
  | 'Massage therapist';

export interface Practitioner {
  id: string;
  name: string;
  role: PractitionerRole;
}

export interface Clinic {
  id: string;
  name: string;
  category: 'Hair' | 'Skin' | 'Nails' | 'Lashes & Brows' | 'Spa';
  rating: number;
  distanceKm: number;
  /** Next open slots, newest first. Mocked; will come from booking API later. */
  slots: string[];
  /** Offers at-home service (home-visit beautician). */
  homeService?: boolean;
  /** Ladies-only salon (a table-stakes filter in the Gulf). */
  womenOnly?: boolean;
  /** Paid placement — surfaced as a clearly-labelled "Sponsored" suggestion. */
  sponsored?: boolean;
}

/** A dated event she's prepping for (a wedding, Eid). Rituals are back-planned
 *  from the date so everything peaks in time. */
export interface SalonEvent {
  id: string;
  name: string;
  dateISO: string;
  /** The rituals she wants ready for this event — chosen by her, never inferred. */
  treatmentIds: string[];
}

export type CadenceUnit = 'day' | 'week' | 'month';

/** A personal repeat interval — every N days, weeks, or months. There is no
 *  fixed range: a brow tint might be every 10 days, a facial every month. */
export interface Cadence {
  every: number;
  unit: CadenceUnit;
}

/** A treatment the user keeps up with (a "ritual"). */
export interface Treatment {
  id: string;
  name: string;
  zone: ZoneId;
  cadence: Cadence;
  clinicId: string;
  practitionerId: string;
  /** Typical price, used for budget forecasting. */
  price: number;
  /** ISO date of the most recent completed session. */
  lastDoneISO: string;
  reminderOn: boolean;
  /** True when this is usually done at home (home-service beautician). */
  atHome?: boolean;
  /** Progress when sold as a multi-session package (laser, etc.). Each clinic
   *  runs its own package logic; we only track her progress against it. */
  pkg?: { total: number; done: number };
  /** A one-off (a treatment added just for an event, e.g. bridal makeup). It
   *  never nags on the avatar; it only shows in the prep for events. */
  oneOff?: boolean;
}

/** One completed visit. The clinical detail lives here: what exactly was
 *  done, by whom, with which products. `notes` is optional on purpose —
 *  not every visit has practitioner notes. */
export interface Session {
  id: string;
  treatmentId: string;
  dateISO: string;
  clinicId: string;
  practitioner: Practitioner;
  price: number;
  /** Specifics, e.g. "0.5 ml Restylane Kysse, mid-lip + border". */
  detail: string;
  /** Products/brands used, when known. */
  products?: string[];
  /** Practitioner notes. Often absent. */
  notes?: string;
}

/** A future booked visit. Feeds the calendar and the budget forecast. */
export interface Appointment {
  id: string;
  treatmentId: string;
  dateISO: string;
  timeLabel: string;
  clinicId: string;
  price: number;
}

/**
 * Status is about *booking*, not lateness:
 *  booked   — an appointment is on the books for this cycle → sorted
 *  onTrack  — recently done, next cycle far off
 *  comingUp — nearing the interval, not yet booked → plan it
 *  bookNow  — interval elapsed and still no appointment → book it
 */
export type TreatmentStatus = 'bookNow' | 'comingUp' | 'booked' | 'onTrack';

export interface AvatarConfig {
  skinTone: number; // 0..4, index into SKIN_TONES
  hairColor: number; // 0=Brown, 1=Black, 2=Blonde
}

export interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  birthdayISO: string | null;
  heightCm: number | null;
  weightKg: number | null;
  avatar: AvatarConfig;
  notificationsOn: boolean;
  remindDaysBefore: number;
}
