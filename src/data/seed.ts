import type {
  Appointment,
  Cadence,
  Clinic,
  Practitioner,
  SalonEvent,
  Session,
  Treatment,
  Zone,
  ZoneId,
} from '../types';
import { addDays, addWeeks, todayISO } from '../lib/dates';

/**
 * Demo dataset. Everything is derived from "today" so the demo always shows
 * a believable mix of overdue / due-soon / on-track and a forecastable
 * budget. Replace this module with a Supabase-backed repository later, the
 * shapes are the contract, not the values.
 */

export const ZONES: Zone[] = [
  { id: 'hair', label: 'Hair', marker: { xPct: 50, yPct: 3 } },
  { id: 'face', label: 'Face', marker: { xPct: 50, yPct: 7 } },
  { id: 'lips', label: 'Lips', marker: { xPct: 50, yPct: 9.5 } },
  { id: 'torso', label: 'Body', marker: { xPct: 50, yPct: 28 } },
  { id: 'hands', label: 'Hands', marker: { xPct: 18, yPct: 52 } },
  { id: 'hips', label: 'Hips', marker: { xPct: 50, yPct: 45 } },
  { id: 'legs', label: 'Legs', marker: { xPct: 50, yPct: 73 } },
];

/**
 * The five fixed markers shown on the Home avatar — hair, face, body, hands,
 * feet. Each carries a matching line icon and aggregates related zones so the
 * figure stays uncluttered; tapping opens the primary zone. Positions are fixed
 * % of the avatar display box, measured against the rendered figure so every
 * marker lands exactly on its body part. `icon` is an Ionicons glyph name.
 */
export const AVATAR_MARKERS: {
  id: ZoneId;
  label: string;
  icon: string;
  zones: ZoneId[];
  marker: { xPct: number; yPct: number };
}[] = [
  // on the falling hair beside the face — at the crown it read as a second
  // face glow, two lights stacked on the head
  { id: 'hair', label: 'Hair', icon: 'sparkles-outline', zones: ['hair'], marker: { xPct: 32, yPct: 17 } },
  { id: 'face', label: 'Face', icon: 'happy-outline', zones: ['face', 'lips'], marker: { xPct: 50, yPct: 13 } },
  { id: 'torso', label: 'Body', icon: 'body-outline', zones: ['torso', 'hips'], marker: { xPct: 50, yPct: 28 } },
  { id: 'hands', label: 'Hands', icon: 'hand-left-outline', zones: ['hands'], marker: { xPct: 13, yPct: 54 } },
  { id: 'legs', label: 'Feet', icon: 'footsteps-outline', zones: ['legs'], marker: { xPct: 54, yPct: 96 } },
];

export const PRACTITIONERS: Practitioner[] = [
  { id: 'pr1', name: 'Dr. Amira Khoury', role: 'Aesthetic doctor' },
  { id: 'pr2', name: 'Sofia Marchetti', role: 'Nurse injector' },
  { id: 'pr3', name: 'Camille Roux', role: 'Colorist' },
  { id: 'pr4', name: 'Léa Fontaine', role: 'Hair stylist' },
  { id: 'pr5', name: 'Mina Park', role: 'Nail artist' },
  { id: 'pr6', name: 'Yasmin Haddad', role: 'Esthetician' },
  { id: 'pr7', name: 'Elena Petrova', role: 'Laser technician' },
  { id: 'pr8', name: 'Dr. Ines Delacroix', role: 'Dermatologist' },
];

export const CLINICS: Clinic[] = [
  { id: 'c1', name: 'Amwaj Hair Lounge', category: 'Hair', rating: 4.9, distanceKm: 0.8, slots: ['Tomorrow 14:30', 'Fri 10:00', 'Fri 16:15'], sponsored: true, womenOnly: true },
  { id: 'c2', name: 'Jamila Skin Clinic', category: 'Skin', rating: 4.8, distanceKm: 1.4, slots: ['Thu 11:00', 'Fri 15:30', 'Sat 09:45'] },
  { id: 'c3', name: 'Kohl Lash Bar', category: 'Lashes & Brows', rating: 4.7, distanceKm: 1.2, slots: ['Today 17:00', 'Tomorrow 12:15', 'Wed 18:30'], womenOnly: true },
  { id: 'c4', name: 'Layali Nail Studio', category: 'Nails', rating: 4.9, distanceKm: 2.1, slots: ['Tomorrow 10:30', 'Thu 13:00', 'Sat 16:00'], homeService: true, womenOnly: true },
  { id: 'c5', name: 'Noor Aesthetics', category: 'Skin', rating: 4.8, distanceKm: 1.9, slots: ['Fri 09:30', 'Mon 14:00', 'Tue 17:15'], sponsored: true },
  { id: 'c6', name: 'The Brow Room', category: 'Lashes & Brows', rating: 4.6, distanceKm: 0.6, slots: ['Today 16:15', 'Thu 11:30', 'Fri 10:45'], womenOnly: true },
  { id: 'c7', name: 'Rose Hammam & Spa', category: 'Spa', rating: 4.7, distanceKm: 2.4, slots: ['Sat 11:00', 'Sun 15:00', 'Mon 10:30'], homeService: true, womenOnly: true },
];

const T = todayISO();

export const TREATMENTS: Treatment[] = [
  // hair
  { id: 't-roots', name: 'Roots touch-up', zone: 'hair', cadence: { every: 6, unit: 'week' }, clinicId: 'c1', practitionerId: 'pr3', price: 380, lastDoneISO: addWeeks(T, -7), reminderOn: true },
  { id: 't-cut', name: 'Cut & style', zone: 'hair', cadence: { every: 8, unit: 'week' }, clinicId: 'c1', practitionerId: 'pr4', price: 280, lastDoneISO: addWeeks(T, -5), reminderOn: true },
  // face
  { id: 't-botox', name: 'Botox', zone: 'face', cadence: { every: 4, unit: 'month' }, clinicId: 'c2', practitionerId: 'pr1', price: 960, lastDoneISO: addWeeks(T, -11), reminderOn: true },
  { id: 't-facial', name: 'Hydrafacial', zone: 'face', cadence: { every: 1, unit: 'month' }, clinicId: 'c5', practitionerId: 'pr6', price: 440, lastDoneISO: addWeeks(T, -3), reminderOn: true },
  { id: 't-brows', name: 'Brow shaping', zone: 'face', cadence: { every: 3, unit: 'week' }, clinicId: 'c6', practitionerId: 'pr6', price: 140, lastDoneISO: addWeeks(T, -2), reminderOn: false },
  // lips
  { id: 't-lipfiller', name: 'Lip filler', zone: 'lips', cadence: { every: 3, unit: 'month' }, clinicId: 'c2', practitionerId: 'pr2', price: 1120, lastDoneISO: addWeeks(T, -12), reminderOn: true },
  // torso
  { id: 't-massage', name: 'Deep tissue massage', zone: 'torso', cadence: { every: 4, unit: 'week' }, clinicId: 'c7', practitionerId: 'pr6', price: 340, lastDoneISO: addWeeks(T, -2), reminderOn: false, atHome: true },
  // hands
  { id: 't-mani', name: 'Gel manicure', zone: 'hands', cadence: { every: 3, unit: 'week' }, clinicId: 'c4', practitionerId: 'pr5', price: 180, lastDoneISO: addWeeks(T, -3), reminderOn: true, atHome: true },
  // hips
  { id: 't-laserbody', name: 'Laser hair removal', zone: 'hips', cadence: { every: 6, unit: 'week' }, clinicId: 'c5', practitionerId: 'pr7', price: 480, lastDoneISO: addWeeks(T, -4), reminderOn: true, pkg: { total: 8, done: 4 } },
  // legs
  { id: 't-pedi', name: 'Pedicure', zone: 'legs', cadence: { every: 4, unit: 'week' }, clinicId: 'c4', practitionerId: 'pr5', price: 220, lastDoneISO: addWeeks(T, -2), reminderOn: false, atHome: true },
  { id: 't-waxlegs', name: 'Leg wax', zone: 'legs', cadence: { every: 4, unit: 'week' }, clinicId: 'c2', practitionerId: 'pr6', price: 220, lastDoneISO: addWeeks(T, -5), reminderOn: true },
];

/** Specs for onboarding routine picks not already in the seed set, so a new
 *  user's own choices become tracked rituals (appended, not replacing the demo
 *  data). Names mirror the onboarding RoutineScreen options. */
const ROUTINE_SPECS: Record<string, { zone: ZoneId; price: number; cadence: Cadence; clinicId: string }> = {
  Keratin: { zone: 'hair', price: 700, cadence: { every: 16, unit: 'week' }, clinicId: 'c1' },
  Extensions: { zone: 'hair', price: 1200, cadence: { every: 8, unit: 'week' }, clinicId: 'c1' },
  'Brows & lashes': { zone: 'face', price: 300, cadence: { every: 3, unit: 'week' }, clinicId: 'c6' },
  'Skin boosters': { zone: 'face', price: 900, cadence: { every: 3, unit: 'month' }, clinicId: 'c2' },
  Waxing: { zone: 'legs', price: 200, cadence: { every: 4, unit: 'week' }, clinicId: 'c2' },
  Massage: { zone: 'torso', price: 340, cadence: { every: 4, unit: 'week' }, clinicId: 'c7' },
  'Body contouring': { zone: 'hips', price: 800, cadence: { every: 4, unit: 'week' }, clinicId: 'c5' },
};

/** Tracked rituals for onboarding picks the seed doesn't already cover. */
export function treatmentsForRoutine(picks: string[], existing: Treatment[]): Treatment[] {
  const have = new Set(existing.map((t) => t.name.toLowerCase()));
  const out: Treatment[] = [];
  picks.forEach((name, i) => {
    if (have.has(name.toLowerCase())) return;
    const spec = ROUTINE_SPECS[name];
    if (!spec) return;
    out.push({
      id: `t-ob-${i}-${name.replace(/[^a-z]/gi, '').toLowerCase()}`,
      name,
      zone: spec.zone,
      cadence: spec.cadence,
      clinicId: spec.clinicId,
      practitionerId: 'pr6',
      price: spec.price,
      lastDoneISO: addWeeks(T, -3),
      reminderOn: true,
    });
  });
  return out;
}

const pr = (id: string): Practitioner => PRACTITIONERS.find((p) => p.id === id) as Practitioner;

/** Rich visit history. Detail strings carry the clinical specifics; notes
 *  appear only when the practitioner actually left them. */
export const SESSIONS: Session[] = [
  // Lip filler, the flagship example of deep history
  {
    id: 's-lip1', treatmentId: 't-lipfiller', dateISO: addWeeks(T, -12), clinicId: 'c2',
    practitioner: pr('pr2'), price: 1120,
    detail: '0.5 ml Restylane Kysse, mid-lip volume + border definition',
    products: ['Restylane Kysse 0.5 ml', 'Topical lidocaine 4%'],
    notes: 'Slight asymmetry on the left corrected from last time. Review at 2 weeks; client happy with shape. Next time consider 0.3 ml top-up only.',
  },
  {
    id: 's-lip2', treatmentId: 't-lipfiller', dateISO: addWeeks(T, -25), clinicId: 'c2',
    practitioner: pr('pr2'), price: 1120,
    detail: '0.5 ml Restylane Kysse, full lip refresh',
    products: ['Restylane Kysse 0.5 ml'],
    notes: 'Mild bruising expected 3–4 days. Arnica advised.',
  },
  {
    id: 's-lip3', treatmentId: 't-lipfiller', dateISO: addWeeks(T, -38), clinicId: 'c5',
    practitioner: pr('pr1'), price: 1200,
    detail: '0.55 ml Juvéderm Volbella, first session, conservative volume',
    products: ['Juvéderm Volbella 0.55 ml'],
  },
  // Botox
  {
    id: 's-bot1', treatmentId: 't-botox', dateISO: addWeeks(T, -11), clinicId: 'c2',
    practitioner: pr('pr1'), price: 960,
    detail: 'Forehead 12u + glabella 18u + crow’s feet 12u',
    products: ['Botox (onabotulinumtoxinA) 42u total'],
    notes: 'Settled fully at day 10. Same dosing next round.',
  },
  {
    id: 's-bot2', treatmentId: 't-botox', dateISO: addWeeks(T, -28), clinicId: 'c2',
    practitioner: pr('pr1'), price: 880,
    detail: 'Forehead 10u + glabella 16u',
  },
  // Roots
  {
    id: 's-roots1', treatmentId: 't-roots', dateISO: addWeeks(T, -7), clinicId: 'c1',
    practitioner: pr('pr3'), price: 380,
    detail: 'Root color 5.3 golden brown + gloss toner',
    products: ['Wella Koleston 5/3', 'Gloss toner'],
  },
  {
    id: 's-roots2', treatmentId: 't-roots', dateISO: addWeeks(T, -13), clinicId: 'c1',
    practitioner: pr('pr3'), price: 380,
    detail: 'Root color 5.3 + brightness refresh on lengths',
    notes: 'Move to 6-week cadence, regrowth visible at week 5.',
  },
  // Cut
  {
    id: 's-cut1', treatmentId: 't-cut', dateISO: addWeeks(T, -5), clinicId: 'c1',
    practitioner: pr('pr4'), price: 280,
    detail: 'Long layers refresh + face-framing trim, blow-dry',
  },
  // Hydrafacial
  {
    id: 's-fac1', treatmentId: 't-facial', dateISO: addWeeks(T, -3), clinicId: 'c5',
    practitioner: pr('pr6'), price: 440,
    detail: 'Deluxe Hydrafacial with brightening booster',
    products: ['Britenol booster', 'LED blue light 10 min'],
  },
  // Brows
  {
    id: 's-brow1', treatmentId: 't-brows', dateISO: addWeeks(T, -2), clinicId: 'c6',
    practitioner: pr('pr6'), price: 140,
    detail: 'Wax + tweeze shaping, clear brow gel finish',
  },
  // Massage
  {
    id: 's-mas1', treatmentId: 't-massage', dateISO: addWeeks(T, -2), clinicId: 'c7',
    practitioner: pr('pr6'), price: 340,
    detail: '60 min deep tissue, shoulders and lower back focus',
    notes: 'Recurring tension right trapezius; stretch routine suggested.',
  },
  // Manicure
  {
    id: 's-man1', treatmentId: 't-mani', dateISO: addWeeks(T, -3), clinicId: 'c4',
    practitioner: pr('pr5'), price: 180,
    detail: 'Gel, almond shape, shade "Ballet Slipper"',
    products: ['OPI GelColor'],
  },
  {
    id: 's-man2', treatmentId: 't-mani', dateISO: addWeeks(T, -6), clinicId: 'c4',
    practitioner: pr('pr5'), price: 180,
    detail: 'Gel, almond shape, shade "Terracotta"',
  },
  // Laser
  {
    id: 's-las1', treatmentId: 't-laserbody', dateISO: addWeeks(T, -4), clinicId: 'c5',
    practitioner: pr('pr7'), price: 480,
    detail: 'Session 4 of 8, bikini + underarms, Candela GentleMax',
    notes: 'Energy raised to 16 J/cm². No adverse reaction.',
  },
  // Pedicure
  {
    id: 's-ped1', treatmentId: 't-pedi', dateISO: addWeeks(T, -2), clinicId: 'c4',
    practitioner: pr('pr5'), price: 220,
    detail: 'Spa pedicure, shade "Cream Silk"',
  },
  // Leg wax
  {
    id: 's-wax1', treatmentId: 't-waxlegs', dateISO: addWeeks(T, -5), clinicId: 'c2',
    practitioner: pr('pr6'), price: 220,
    detail: 'Full legs, warm wax',
  },
];

/** Booked future visits, these drive the calendar and the budget forecast. */
export const APPOINTMENTS: Appointment[] = [
  { id: 'a1', treatmentId: 't-lipfiller', dateISO: addDays(T, 3), timeLabel: '15:30', clinicId: 'c2', price: 1120 },
  { id: 'a2', treatmentId: 't-mani', dateISO: addDays(T, 6), timeLabel: '10:30', clinicId: 'c4', price: 180 },
  { id: 'a3', treatmentId: 't-laserbody', dateISO: addDays(T, 12), timeLabel: '17:15', clinicId: 'c5', price: 480 },
  { id: 'a4', treatmentId: 't-botox', dateISO: addDays(T, 33), timeLabel: '11:00', clinicId: 'c2', price: 960 },
  { id: 'a5', treatmentId: 't-roots', dateISO: addDays(T, 24), timeLabel: '14:30', clinicId: 'c1', price: 380 },
];

/** Dated events she's prepping for — drive the Home countdown + prep plan. Two
 *  close together on purpose: the planner should notice one appointment can keep
 *  a ritual fresh for both, instead of double-booking. She sets these in-app;
 *  seeded here so the feature is visible. */
export const SEED_EVENTS: SalonEvent[] = [
  // she picks what she wants ready for each; 't-mani' is in both on purpose, so
  // the app can *show* the overlap (not silently merge it)
  { id: 'ev-wedding', name: "Layla's wedding", dateISO: addDays(T, 26), treatmentIds: ['t-roots', 't-lipfiller', 't-mani', 't-facial'] },
  { id: 'ev-eid', name: 'Eid gathering', dateISO: addDays(T, 32), treatmentIds: ['t-mani', 't-brows'] },
];

/** Five skin tones (match the recolored render tones), light to deep. */
export const SKIN_TONES = ['#EBC6A6', '#D0A074', '#B07A50', '#8A5A3B', '#5C3A26'];

/** Hair colors (applied as a hair-only recolor on the render). */
export const HAIR_COLORS: { label: string; swatch: string }[] = [
  { label: 'Brown', swatch: '#4A342A' },
  { label: 'Black', swatch: '#211C1A' },
  { label: 'Blonde', swatch: '#C99D62' },
];
