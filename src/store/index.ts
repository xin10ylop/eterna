import { useMemo } from 'react';
import { create } from 'zustand';
import { I18nManager } from 'react-native';
import type {
  Appointment,
  AvatarConfig,
  Clinic,
  Profile,
  SalonEvent,
  Session,
  Treatment,
} from '../types';
import type { Lang } from '../i18n';
import { APPOINTMENTS, CLINICS, SEED_EVENTS, SESSIONS, TREATMENTS, treatmentsForRoutine } from '../data/seed';
import type { AccentName } from '../theme';
import { todayISO } from '../lib/dates';

/**
 * App state. One store, sliced by concern. No persistence yet by design —
 * when Supabase lands, `data` becomes server state (react-query or
 * equivalent) and only `ui`/`session` stay client-side.
 */

interface OnboardingDraft {
  email: string;
  firstName: string;
  lastName: string;
  birthdayISO: string | null;
  heightCm: number | null;
  weightKg: number | null;
  routine: string[]; // treatment names picked in the questionnaire
  avatar: AvatarConfig;
}

const defaultAvatar: AvatarConfig = {
  skinTone: 0,
  hairColor: 0,
};

const emptyDraft: OnboardingDraft = {
  email: '',
  firstName: '',
  lastName: '',
  birthdayISO: null,
  heightCm: null,
  weightKg: null,
  routine: [],
  avatar: defaultAvatar,
};

interface EternaState {
  // session
  isSignedIn: boolean;
  profile: Profile | null;
  draft: OnboardingDraft;
  accent: AccentName;
  lang: Lang;

  // data
  treatments: Treatment[];
  sessions: Session[];
  appointments: Appointment[];
  clinics: Clinic[];
  savedClinicIds: string[];
  events: SalonEvent[];
  showPastEvents: boolean;

  // ui
  toast: string | null;

  // actions
  setDraft(patch: Partial<OnboardingDraft>): void;
  completeOnboarding(): void;
  signOut(): void;
  setAccent(a: AccentName): void;
  setLang(l: Lang): void;
  setNotifications(on: boolean): void;

  toggleReminder(treatmentId: string): void;
  logDone(treatmentId: string): void;
  book(treatmentId: string, dateISO: string, timeLabel: string): void;
  cancelAppointment(appointmentId: string): void;
  addTreatment(t: Treatment): void;
  toggleSavedClinic(clinicId: string): void;
  addOwnClinic(name: string): Clinic;
  setAvatar(patch: Partial<AvatarConfig>): void;
  addEvent(name: string, dateISO: string): void;
  updateEvent(id: string, patch: Partial<Omit<SalonEvent, 'id'>>): void;
  removeEvent(id: string): void;
  setShowPastEvents(v: boolean): void;

  showToast(msg: string): void;
  clearToast(): void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useEterna = create<EternaState>((set, get) => ({
  isSignedIn: false,
  profile: null,
  draft: emptyDraft,
  accent: 'Terracotta',
  lang: 'en',

  treatments: TREATMENTS,
  sessions: SESSIONS,
  appointments: APPOINTMENTS,
  clinics: CLINICS,
  savedClinicIds: ['c1', 'c2', 'c3', 'c4'],
  events: SEED_EVENTS,
  showPastEvents: false,

  toast: null,

  setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),

  completeOnboarding: () => {
    const d = get().draft;
    const extra = treatmentsForRoutine(d.routine, TREATMENTS);
    set({
      isSignedIn: true,
      treatments: extra.length ? [...TREATMENTS, ...extra] : TREATMENTS,
      profile: {
        firstName: d.firstName || 'Lina',
        lastName: d.lastName || '',
        email: d.email,
        birthdayISO: d.birthdayISO,
        heightCm: d.heightCm,
        weightKg: d.weightKg,
        avatar: d.avatar,
        notificationsOn: true,
        remindDaysBefore: 5,
      },
      draft: emptyDraft,
    });
  },

  signOut: () => set({ isSignedIn: false, profile: null, draft: emptyDraft }),

  setAccent: (a) => set({ accent: a }),

  setLang: (l) => {
    // Text switches immediately; full layout mirroring for Arabic applies on the
    // next app start (native RTL is a reload-level setting).
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(l === 'ar');
    set({ lang: l });
  },

  setNotifications: (on) =>
    set((s) => (s.profile ? { profile: { ...s.profile, notificationsOn: on } } : s)),

  toggleReminder: (treatmentId) =>
    set((s) => ({
      treatments: s.treatments.map((t) =>
        t.id === treatmentId ? { ...t, reminderOn: !t.reminderOn } : t,
      ),
    })),

  logDone: (treatmentId) =>
    set((s) => {
      const t = s.treatments.find((x) => x.id === treatmentId);
      if (!t) return s;
      const today = todayISO();
      const session: Session = {
        id: `s-log-${Date.now()}`,
        treatmentId,
        dateISO: today,
        clinicId: t.clinicId,
        practitioner: { id: 'self', name: 'Logged by you', role: 'Esthetician' },
        // a prepaid package session is already paid; otherwise record real spend
        price: t.pkg ? 0 : t.price,
        detail: 'Marked as done',
      };
      return {
        treatments: s.treatments.map((x) =>
          x.id === treatmentId
            ? {
                ...x,
                lastDoneISO: today,
                pkg: x.pkg && x.pkg.done < x.pkg.total ? { ...x.pkg, done: x.pkg.done + 1 } : x.pkg,
              }
            : x,
        ),
        sessions: [session, ...s.sessions],
        // the visit is done — clear its pending booking so it stops reading as
        // booked, off the calendar, and out of the budget forecast
        appointments: s.appointments.filter(
          (a) => !(a.treatmentId === treatmentId && a.dateISO >= today),
        ),
      };
    }),

  book: (treatmentId, dateISO, timeLabel) =>
    set((s) => {
      const t = s.treatments.find((x) => x.id === treatmentId);
      if (!t) return s;
      const today = todayISO();
      const appt: Appointment = {
        id: `a-${Date.now()}`,
        treatmentId,
        dateISO,
        timeLabel,
        clinicId: t.clinicId,
        price: t.pkg ? 0 : t.price,
      };
      // one pending booking per treatment — replace any existing future one so a
      // re-book or a double-tapped Confirm can't create a duplicate that
      // double-counts in the budget
      const rest = s.appointments.filter(
        (a) => !(a.treatmentId === treatmentId && a.dateISO >= today),
      );
      return { appointments: [...rest, appt] };
    }),

  cancelAppointment: (appointmentId) =>
    set((s) => ({ appointments: s.appointments.filter((a) => a.id !== appointmentId) })),

  addTreatment: (t) => set((s) => ({ treatments: [...s.treatments, t] })),

  toggleSavedClinic: (clinicId) =>
    set((s) => ({
      savedClinicIds: s.savedClinicIds.includes(clinicId)
        ? s.savedClinicIds.filter((id) => id !== clinicId)
        : [...s.savedClinicIds, clinicId],
    })),

  addOwnClinic: (name) => {
    const clinic: Clinic = {
      id: `c-own-${Date.now()}`,
      name: name.trim(),
      category: 'Spa',
      rating: 0,
      distanceKm: 0,
      slots: [],
    };
    set((s) => ({
      clinics: [...s.clinics, clinic],
      savedClinicIds: [...s.savedClinicIds, clinic.id],
    }));
    return clinic;
  },

  setAvatar: (patch) =>
    set((s) =>
      s.profile
        ? { profile: { ...s.profile, avatar: { ...s.profile.avatar, ...patch } } }
        : { draft: { ...s.draft, avatar: { ...s.draft.avatar, ...patch } } },
    ),

  addEvent: (name, dateISO) =>
    set((s) => ({ events: [...s.events, { id: `ev-${Date.now()}`, name, dateISO }] })),
  updateEvent: (id, patch) =>
    set((s) => ({ events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
  removeEvent: (id) => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),
  setShowPastEvents: (v) => set({ showPastEvents: v }),

  showToast: (msg) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: msg });
    toastTimer = setTimeout(() => set({ toast: null }), 2400);
  },
  clearToast: () => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: null });
  },
}));

/** Theme hook, accent-aware, single source of truth for colors. */
import { getTheme } from '../theme';
export function useTheme() {
  const accent = useEterna((s) => s.accent);
  // Stable object per accent — returning a fresh getTheme() every render would
  // re-run any effect/memo that depends on `t`.
  return useMemo(() => getTheme(accent), [accent]);
}
