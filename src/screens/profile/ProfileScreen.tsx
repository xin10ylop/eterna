import React from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card, Chip, GhostButton, IOSSwitch, IconButton, Row, Screen, SectionLabel } from '../../components/ui';
import { spacing, type, type AccentName } from '../../theme';
import { useEterna, useTheme } from '../../store';
import { packFor } from '../../components/avatar/config';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const ACCENTS: AccentName[] = ['Terracotta', 'Rosé', 'Mauve', 'Sage'];

export function ProfileScreen({ navigation }: Props) {
  const t = useTheme();
  const profile = useEterna((s) => s.profile);
  const accent = useEterna((s) => s.accent);
  const setAccent = useEterna((s) => s.setAccent);
  const setNotifications = useEterna((s) => s.setNotifications);
  const savedClinicIds = useEterna((s) => s.savedClinicIds);
  const treatments = useEterna((s) => s.treatments);
  const signOut = useEterna((s) => s.signOut);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m, paddingTop: spacing.s }}>
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} accessibilityLabel="Back" />
        <Text style={[type.title, { color: t.text }]}>Profile</Text>
      </View>

      <ScrollView
        style={{ marginTop: spacing.l }}
        contentContainerStyle={{ gap: spacing.m, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.l }}>
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: t.accentSoft,
                overflow: 'hidden',
                alignItems: 'center',
              }}
            >
              <Image
                source={packFor(profile?.avatar).frames[0]}
                style={{ height: 140, width: 140 * packFor(profile?.avatar).aspect, marginTop: 4 }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: '600', color: t.text }}>
                {profile ? `${profile.firstName} ${profile.lastName}`.trim() : 'You'}
              </Text>
              <Text style={{ fontSize: 13, color: t.sub, marginTop: 2 }}>
                {profile?.email || 'demo account'} · {treatments.length} rituals tracked
              </Text>
              {profile?.heightCm && profile?.weightKg ? (
                <Text style={{ fontSize: 13, color: t.sub, marginTop: 1 }}>
                  {profile.heightCm} cm · {profile.weightKg} kg
                </Text>
              ) : null}
            </View>
          </View>
        </Card>

        <Card style={{ paddingVertical: 4 }}>
          <Row
            title="Avatar"
            subtitle="Skin tone and hair"
            onPress={() => navigation.navigate('AvatarStudio', { fromProfile: true })}
          />
          <Row
            title="Notifications"
            right={
              <IOSSwitch
                on={profile?.notificationsOn ?? true}
                onToggle={() => setNotifications(!(profile?.notificationsOn ?? true))}
              />
            }
          />
          <Row title="Remind me" subtitle={`${profile?.remindDaysBefore ?? 5} days before`} last />
        </Card>

        <Card>
          <SectionLabel>Accent color</SectionLabel>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s }}>
            {ACCENTS.map((a) => (
              <Chip key={a} label={a} selected={accent === a} onPress={() => setAccent(a)} />
            ))}
          </View>
        </Card>

        <Card style={{ paddingVertical: 4 }}>
          <Row title="My clinics" subtitle={`${savedClinicIds.length} saved`} last />
        </Card>

        <GhostButton title="Sign out" onPress={signOut} />
      </ScrollView>
    </Screen>
  );
}
