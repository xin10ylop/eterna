import type {
  Appointment,
  Clinic,
  Practitioner,
  Session,
  Treatment,
  Zone,
} from '../types';
import { addDays, addWeeks, todayISO } from '../lib/dates';

/**
 * Demo dataset. Everything is derived from "today" so the demo always shows
 * a believable mix of overdue / due-soon / on-track and a forecastable
 * budget. Replace this module with a Supabase-backed repository later, the
 * shapes are the contract, not the values.
 */

export const ZONES: Zone[] = [
  { id: 'hair', label: 'Hair', marker: { xPct: 50, yPct: 4 } },
  { id: 'face', label: 'Face', marker: { xPct: 44, yPct: 9.5 } },
  { id: 'lips', label: 'Lips', marker: { xPct: 50, yPct: 13 } },
  { id: 'torso', label: 'Body', marker: { xPct: 50, yPct: 36 } },
  { id: 'hands', label: 'Hands', marker: { xPct: 9, yPct: 50 } },
  { id: 'hips', label: 'Hips', marker: { xPct: 66, yPct: 44 } },
  { id: 'legs', label: 'Legs', marker: { xPct: 44, yPct: 72 } },
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
  { id: 'c1', name: 'Maison Cheveu', category: 'Hair', rating: 4.9, distanceKm: 0.8, slots: ['Tomorrow 14:30', 'Fri 10:00', 'Fri 16:15'] },
  { id: 'c2', name: 'Atelier Peau', category: 'Skin', rating: 4.8, distanceKm: 1.4, slots: ['Thu 11:00', 'Fri 15:30', 'Sat 09:45'] },
  { id: 'c3', name: 'Blink Beauty Bar', category: 'Lashes & Brows', rating: 4.7, distanceKm: 1.2, slots: ['Today 17:00', 'Tomorrow 12:15', 'Wed 18:30'] },
  { id: 'c4', name: 'Velvet Nails Studio', category: 'Nails', rating: 4.9, distanceKm: 2.1, slots: ['Tomorrow 10:30', 'Thu 13:00', 'Sat 16:00'] },
  { id: 'c5', name: 'Lumière Aesthetics', category: 'Skin', rating: 4.8, distanceKm: 1.9, slots: ['Fri 09:30', 'Mon 14:00', 'Tue 17:15'] },
  { id: 'c6', name: 'The Brow Room', category: 'Lashes & Brows', rating: 4.6, distanceKm: 0.6, slots: ['Today 16:15', 'Thu 11:30', 'Fri 10:45'] },
  { id: 'c7', name: 'Onsen Spa & Body', category: 'Spa', rating: 4.7, distanceKm: 2.4, slots: ['Sat 11:00', 'Sun 15:00', 'Mon 10:30'] },
];

const T = todayISO();

export const TREATMENTS: Treatment[] = [
  // hair
  { id: 't-roots', name: 'Roots touch-up', zone: 'hair', cadenceWeeks: 6, clinicId: 'c1', practitionerId: 'pr3', priceEUR: 95, lastDoneISO: addWeeks(T, -7), reminderOn: true },
  { id: 't-cut', name: 'Cut & style', zone: 'hair', cadenceWeeks: 8, clinicId: 'c1', practitionerId: 'pr4', priceEUR: 70, lastDoneISO: addWeeks(T, -5), reminderOn: true },
  // face
  { id: 't-botox', name: 'Botox', zone: 'face', cadenceWeeks: 16, clinicId: 'c2', practitionerId: 'pr1', priceEUR: 240, lastDoneISO: addWeeks(T, -11), reminderOn: true },
  { id: 't-facial', name: 'Hydrafacial', zone: 'face', cadenceWeeks: 4, clinicId: 'c5', practitionerId: 'pr6', priceEUR: 110, lastDoneISO: addWeeks(T, -3), reminderOn: true },
  { id: 't-brows', name: 'Brow shaping', zone: 'face', cadenceWeeks: 3, clinicId: 'c6', practitionerId: 'pr6', priceEUR: 35, lastDoneISO: addWeeks(T, -2), reminderOn: false },
  // lips
  { id: 't-lipfiller', name: 'Lip filler', zone: 'lips', cadenceWeeks: 12, clinicId: 'c2', practitionerId: 'pr2', priceEUR: 280, lastDoneISO: addWeeks(T, -12), reminderOn: true },
  // torso
  { id: 't-massage', name: 'Deep tissue massage', zone: 'torso', cadenceWeeks: 4, clinicId: 'c7', practitionerId: 'pr6', priceEUR: 85, lastDoneISO: addWeeks(T, -2), reminderOn: false },
  // hands
  { id: 't-mani', name: 'Gel manicure', zone: 'hands', cadenceWeeks: 3, clinicId: 'c4', practitionerId: 'pr5', priceEUR: 45, lastDoneISO: addWeeks(T, -3), reminderOn: true },
  // hips
  { id: 't-laserbody', name: 'Laser hair removal', zone: 'hips', cadenceWeeks: 6, clinicId: 'c5', practitionerId: 'pr7', priceEUR: 120, lastDoneISO: addWeeks(T, -4), reminderOn: true },
  // legs
  { id: 't-pedi', name: 'Pedicure', zone: 'legs', cadenceWeeks: 4, clinicId: 'c4', practitionerId: 'pr5', priceEUR: 55, lastDoneISO: addWeeks(T, -2), reminderOn: false },
  { id: 't-waxlegs', name: 'Leg wax', zone: 'legs', cadenceWeeks: 4, clinicId: 'c2', practitionerId: 'pr6', priceEUR: 55, lastDoneISO: addWeeks(T, -5), reminderOn: true },
];

const pr = (id: string): Practitioner => PRACTITIONERS.find((p) => p.id === id) as Practitioner;

/** Rich visit history. Detail strings carry the clinical specifics; notes
 *  appear only when the practitioner actually left them. */
export const SESSIONS: Session[] = [
  // Lip filler, the flagship example of deep history
  {
    id: 's-lip1', treatmentId: 't-lipfiller', dateISO: addWeeks(T, -12), clinicId: 'c2',
    practitioner: pr('pr2'), priceEUR: 280,
    detail: '0.5 ml Restylane Kysse, mid-lip volume + border definition',
    products: ['Restylane Kysse 0.5 ml', 'Topical lidocaine 4%'],
    notes: 'Slight asymmetry on the left corrected from last time. Review at 2 weeks; client happy with shape. Next time consider 0.3 ml top-up only.',
  },
  {
    id: 's-lip2', treatmentId: 't-lipfiller', dateISO: addWeeks(T, -25), clinicId: 'c2',
    practitioner: pr('pr2'), priceEUR: 280,
    detail: '0.5 ml Restylane Kysse, full lip refresh',
    products: ['Restylane Kysse 0.5 ml'],
    notes: 'Mild bruising expected 3–4 days. Arnica advised.',
  },
  {
    id: 's-lip3', treatmentId: 't-lipfiller', dateISO: addWeeks(T, -38), clinicId: 'c5',
    practitioner: pr('pr1'), priceEUR: 300,
    detail: '0.55 ml Juvéderm Volbella, first session, conservative volume',
    products: ['Juvéderm Volbella 0.55 ml'],
  },
  // Botox
  {
    id: 's-bot1', treatmentId: 't-botox', dateISO: addWeeks(T, -11), clinicId: 'c2',
    practitioner: pr('pr1'), priceEUR: 240,
    detail: 'Forehead 12u + glabella 18u + crow’s feet 12u',
    products: ['Botox (onabotulinumtoxinA) 42u total'],
    notes: 'Settled fully at day 10. Same dosing next round.',
  },
  {
    id: 's-bot2', treatmentId: 't-botox', dateISO: addWeeks(T, -28), clinicId: 'c2',
    practitioner: pr('pr1'), priceEUR: 220,
    detail: 'Forehead 10u + glabella 16u',
  },
  // Roots
  {
    id: 's-roots1', treatmentId: 't-roots', dateISO: addWeeks(T, -7), clinicId: 'c1',
    practitioner: pr('pr3'), priceEUR: 95,
    detail: 'Root color 5.3 golden brown + gloss toner',
    products: ['Wella Koleston 5/3', 'Gloss toner'],
  },
  {
    id: 's-roots2', treatmentId: 't-roots', dateISO: addWeeks(T, -13), clinicId: 'c1',
    practitioner: pr('pr3'), priceEUR: 95,
    detail: 'Root color 5.3 + brightness refresh on lengths',
    notes: 'Move to 6-week cadence, regrowth visible at week 5.',
  },
  // Cut
  {
    id: 's-cut1', treatmentId: 't-cut', dateISO: addWeeks(T, -5), clinicId: 'c1',
    practitioner: pr('pr4'), priceEUR: 70,
    detail: 'Long layers refresh + face-framing trim, blow-dry',
  },
  // Hydrafacial
  {
    id: 's-fac1', treatmentId: 't-facial', dateISO: addWeeks(T, -3), clinicId: 'c5',
    practitioner: pr('pr6'), priceEUR: 110,
    detail: 'Deluxe Hydrafacial with brightening booster',
    products: ['Britenol booster', 'LED blue light 10 min'],
  },
  // Brows
  {
    id: 's-brow1', treatmentId: 't-brows', dateISO: addWeeks(T, -2), clinicId: 'c6',
    practitioner: pr('pr6'), priceEUR: 35,
    detail: 'Wax + tweeze shaping, clear brow gel finish',
  },
  // Massage
  {
    id: 's-mas1', treatmentId: 't-massage', dateISO: addWeeks(T, -2), clinicId: 'c7',
    practitioner: pr('pr6'), priceEUR: 85,
    detail: '60 min deep tissue, shoulders and lower back focus',
    notes: 'Recurring tension right trapezius; stretch routine suggested.',
  },
  // Manicure
  {
    id: 's-man1', treatmentId: 't-mani', dateISO: addWeeks(T, -3), clinicId: 'c4',
    practitioner: pr('pr5'), priceEUR: 45,
    detail: 'Gel, almond shape, shade "Ballet Slipper"',
    products: ['OPI GelColor'],
  },
  {
    id: 's-man2', treatmentId: 't-mani', dateISO: addWeeks(T, -6), clinicId: 'c4',
    practitioner: pr('pr5'), priceEUR: 45,
    detail: 'Gel, almond shape, shade "Terracotta"',
  },
  // Laser
  {
    id: 's-las1', treatmentId: 't-laserbody', dateISO: addWeeks(T, -4), clinicId: 'c5',
    practitioner: pr('pr7'), priceEUR: 120,
    detail: 'Session 4 of 8, bikini + underarms, Candela GentleMax',
    notes: 'Energy raised to 16 J/cm². No adverse reaction.',
  },
  // Pedicure
  {
    id: 's-ped1', treatmentId: 't-pedi', dateISO: addWeeks(T, -2), clinicId: 'c4',
    practitioner: pr('pr5'), priceEUR: 55,
    detail: 'Spa pedicure, shade "Cream Silk"',
  },
  // Leg wax
  {
    id: 's-wax1', treatmentId: 't-waxlegs', dateISO: addWeeks(T, -5), clinicId: 'c2',
    practitioner: pr('pr6'), priceEUR: 55,
    detail: 'Full legs, warm wax',
  },
];

/** Booked future visits, these drive the calendar and the budget forecast. */
export const APPOINTMENTS: Appointment[] = [
  { id: 'a1', treatmentId: 't-lipfiller', dateISO: addDays(T, 3), timeLabel: '15:30', clinicId: 'c2', priceEUR: 280 },
  { id: 'a2', treatmentId: 't-mani', dateISO: addDays(T, 6), timeLabel: '10:30', clinicId: 'c4', priceEUR: 45 },
  { id: 'a3', treatmentId: 't-laserbody', dateISO: addDays(T, 12), timeLabel: '17:15', clinicId: 'c5', priceEUR: 120 },
  { id: 'a4', treatmentId: 't-botox', dateISO: addDays(T, 33), timeLabel: '11:00', clinicId: 'c2', priceEUR: 240 },
  { id: 'a5', treatmentId: 't-roots', dateISO: addDays(T, 24), timeLabel: '14:30', clinicId: 'c1', priceEUR: 95 },
];

/** Six skin tones, porcelain to deep. Every tone has its own render pack. */
export const SKIN_TONES = ['#F6E3D5', '#EFCFB6', '#DDAE8B', '#B97F5C', '#8D5A3B', '#5C3A26'];

/** Hair looks. Each (skin tone × look) pairing is a distinct render pack. */
export const HAIR_LOOKS: { key: 'long' | 'bob' | 'blonde'; label: string; swatch: string }[] = [
  { key: 'long', label: 'Long', swatch: '#4A342A' },
  { key: 'bob', label: 'Bob', swatch: '#4A342A' },
  { key: 'blonde', label: 'Blonde', swatch: '#C99D62' },
];
