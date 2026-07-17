import type { ZoneId } from '../types';

export type RootStackParamList = {
  // onboarding
  Welcome: undefined;
  Features: undefined;
  SignIn: undefined;
  SignUp: undefined;
  Verify: undefined;
  Name: undefined;
  Birthday: undefined;
  Metrics: undefined;
  Routine: undefined;
  AvatarStudio: { fromProfile?: boolean } | undefined;
  Notifications: undefined;
  Ready: undefined;
  // main
  Tabs: undefined;
  ZoneDetail: { zone: ZoneId };
  TreatmentDetail: { treatmentId: string };
  Book: { treatmentId: string };
  AddRitual: undefined;
  Profile: undefined;
};

export type TabParamList = {
  Home: undefined;
  Planning: undefined;
  Add: undefined;
  Discover: undefined;
  Budget: undefined;
};
