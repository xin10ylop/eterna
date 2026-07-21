import { create } from 'zustand';
import type {
  Appointment,
  AvatarConfig,
  Clinic,
  Profile,
  SalonEvent,
  Session,
  Treatment,
} from '../types';
import { APPOINTMENTS, CLINICS, SEED_EVENT, SESSIONS, TREATMENTS } from '../data/seed';
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

  // data
  treatments: Treatment[];
  sessions: Session[];
  appointments: Appointment[];
  clinics: Clinic[];
  savedClinicIds: string[];
  event: SalonEvent | null;

  // ui
  toast: string | null;

  // actions
  setDraft(patch: Partial<OnboardingDraft>): void;
  completeOnboarding(): void;
  signOut(): void;
  setAccent(a: AccentName): void;
  setNotifications(on: boolean): void;

  toggleReminder(treatmentId: string): void;
  logDone(treatmentId: string): void;
  book(treatmentId: string, dateISO: string, timeLabel: string): void;
  cancelAppointment(appointmentId: string): void;
  addTreatment(t: Treatment): void;
  toggleSavedClinic(clinicId: string): void;
  addOwnClinic(name: string): Clinic;
  setAvatar(patch: Partial<AvatarConfig>): void;
  setEvent(e: SalonEvent | null): void;

  showToast(msg: string): void;
  clearToast(): void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useEterna = create<EternaState>((set, get) => ({
  isSignedIn: false,
  profile: null,
  draft: emptyDraft,
  accent: 'Terracotta',

  treatments: TREATMENTS,
  sessions: SESSIONS,
  appointments: APPOINTMENTS,
  clinics: CLINICS,
  savedClinicIds: ['c1', 'c2', 'c3', 'c4'],
  event: SEED_EVENT,

  toast: null,

  setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),

  completeOnboarding: () => {
    const d = get().draft;
    set({
      isSignedIn: true,
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
      const session: Session = {
        id: `s-log-${Date.now()}`,
        treatmentId,
        dateISO: todayISO(),
        clinicId: t.clinicId,
        practitioner: { id: 'self', name: 'Logged by you', role: 'Esthetician' },
        price: 0,
        detail: 'Marked as done',
      };
      return {
        treatments: s.treatments.map((x) =>
          x.id === treatmentId ? { ...x, lastDoneISO: todayISO() } : x,
        ),
        sessions: [session, ...s.sessions],
      };
    }),

  book: (treatmentId, dateISO, timeLabel) =>
    set((s) => {
      const t = s.treatments.find((x) => x.id === treatmentId);
      if (!t) return s;
      const appt: Appointment = {
        id: `a-${Date.now()}`,
        treatmentId,
        dateISO,
        timeLabel,
        clinicId: t.clinicId,
        price: t.price,
      };
      return { appointments: [...s.appointments, appt] };
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

  setEvent: (e) => set({ event: e }),

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
  return getTheme(accent);
}
