import type { NavigatorScreenParams } from '@react-navigation/native';
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
  Plan: undefined;
  AvatarStudio: { fromProfile?: boolean } | undefined;
  AvatarEdit: undefined;
  Notifications: undefined;
  Ready: undefined;
  // main
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  ZoneDetail: { zone: ZoneId };
  TreatmentDetail: { treatmentId: string };
  EventPrep: undefined;
  MyClinics: undefined;
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
