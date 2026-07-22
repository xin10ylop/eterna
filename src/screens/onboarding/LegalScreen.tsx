import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IconButton, Screen } from '../../components/ui';
import { spacing, type } from '../../theme';
import { useTheme } from '../../store';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Legal'>;

/** Placeholder legal copy until counsel writes the real thing. */
const DOCS: Record<'terms' | 'privacy', { title: string; sections: { h: string; p: string }[] }> = {
  terms: {
    title: 'Terms of Service',
    sections: [
      {
        h: '1. About Eterna',
        p: 'Eterna helps you keep track of your beauty and wellness rituals, your clinics, and your bookings. Eterna is a planning tool: treatments are provided by the clinics and salons you choose, not by Eterna.',
      },
      {
        h: '2. Your account',
        p: 'You are responsible for the accuracy of the information you add and for keeping your sign-in details private. You must be at least 16 to use Eterna.',
      },
      {
        h: '3. Bookings',
        p: 'Booking requests are passed to the clinic you selected. Prices, durations, availability, and the services themselves are set by each clinic and can change. Payment happens at the clinic; Eterna does not process payments.',
      },
      {
        h: '4. Clinic content',
        p: 'Clinic menus, prices, photos, and descriptions are provided by the clinics. Sponsored placements are always labelled.',
      },
      {
        h: '5. Fair use',
        p: 'Do not misuse the app, attempt to access data that is not yours, or use Eterna in a way that harms clinics or other users.',
      },
      {
        h: '6. Changes',
        p: 'We may update these terms as Eterna evolves. If a change is significant, we will tell you in the app before it takes effect.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    sections: [
      {
        h: '1. What we collect',
        p: 'Your name, the rituals you track, the clinics and services you choose, your bookings, and the events you add. This is the minimum the app needs to work for you.',
      },
      {
        h: '2. What we never do',
        p: 'We never sell your personal data. Your rituals and history are not shared with clinics beyond the bookings you make, and never with advertisers.',
      },
      {
        h: '3. Where it lives',
        p: 'In this preview, everything stays on your device. When accounts launch, your data will be stored securely and encrypted in transit.',
      },
      {
        h: '4. Reminders',
        p: 'Notification choices are yours: what to be reminded about, and how far ahead. You can change or switch them off any time in Profile.',
      },
      {
        h: '5. Your rights',
        p: 'You can export or delete everything you have added, at any time, from Profile. Deleting your account removes your data.',
      },
      {
        h: '6. Contact',
        p: 'Questions about privacy: privacy@eterna.app.',
      },
    ],
  },
};

export function LegalScreen({ navigation, route }: Props) {
  const t = useTheme();
  const doc = DOCS[route.params.doc];
  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m, paddingTop: spacing.s }}>
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} accessibilityLabel="Back" />
        <Text style={[type.title, { color: t.text }]}>{doc.title}</Text>
      </View>
      <ScrollView
        style={{ marginTop: spacing.l }}
        contentContainerStyle={{ gap: spacing.l, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontSize: 12.5, color: t.muted }}>
          Preview version. The final text will replace this before launch.
        </Text>
        {doc.sections.map((s) => (
          <View key={s.h} style={{ gap: 4 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: t.text }}>{s.h}</Text>
            <Text style={{ fontSize: 14, color: t.sub, lineHeight: 21 }}>{s.p}</Text>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
