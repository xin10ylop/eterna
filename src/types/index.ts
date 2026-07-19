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
}

/** A treatment the user keeps up with (a "ritual"). */
export interface Treatment {
  id: string;
  name: string;
  zone: ZoneId;
  cadenceWeeks: number;
  clinicId: string;
  practitionerId: string;
  /** Typical price, used for budget forecasting. */
  priceEUR: number;
  /** ISO date of the most recent completed session. */
  lastDoneISO: string;
  reminderOn: boolean;
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
  priceEUR: number;
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
  priceEUR: number;
}

export type TreatmentStatus = 'overdue' | 'dueSoon' | 'scheduled' | 'onTrack';

export interface AvatarConfig {
  skinTone: number; // 0..4, index into SKIN_TONES
  hairLength: number; // 0=Long, 1=Short
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
