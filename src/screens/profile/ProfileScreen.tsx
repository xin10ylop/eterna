import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card, Chip, GhostButton, IOSSwitch, IconButton, Row, Screen, SectionLabel } from '../../components/ui';
import { LanguagePicker } from '../../components/LanguagePicker';
import { spacing, type, type AccentName } from '../../theme';
import { useEterna, useTheme } from '../../store';
import { useT } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const ACCENTS: AccentName[] = ['Terracotta', 'Rosé', 'Mauve', 'Sage'];

export function ProfileScreen({ navigation }: Props) {
  const t = useTheme();
  const tr = useT();
  const profile = useEterna((s) => s.profile);
  const accent = useEterna((s) => s.accent);
  const setAccent = useEterna((s) => s.setAccent);
  const setNotifications = useEterna((s) => s.setNotifications);
  const savedClinicIds = useEterna((s) => s.savedClinicIds);
  const treatments = useEterna((s) => s.treatments);
  const setGuidePending = useEterna((s) => s.setGuidePending);
  const signOut = useEterna((s) => s.signOut);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m, paddingTop: spacing.s }}>
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} accessibilityLabel="Back" />
        <Text style={[type.title, { color: t.text }]}>{tr('profile.title')}</Text>
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
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 22, fontWeight: '700', color: t.accent }}>
                {((profile?.firstName?.[0] ?? 'Y') + (profile?.lastName?.[0] ?? '')).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: '600', color: t.text }}>
                {profile ? `${profile.firstName} ${profile.lastName}`.trim() : 'You'}
              </Text>
              <Text style={{ fontSize: 13, color: t.sub, marginTop: 2 }}>
                {profile?.email || 'demo account'} · {tr('profile.ritualsTracked', { n: treatments.length })}
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
            title={tr('profile.avatar')}
            subtitle={tr('profile.avatarSub')}
            onPress={() => navigation.navigate('AvatarEdit')}
          />
          <Row
            title={tr('profile.notifications')}
            right={
              <IOSSwitch
                on={profile?.notificationsOn ?? true}
                onToggle={() => setNotifications(!(profile?.notificationsOn ?? true))}
              />
            }
          />
          <Row
            title={tr('profile.remind')}
            subtitle={tr('profile.daysBefore', { n: profile?.remindDaysBefore ?? 5 })}
            last
          />
        </Card>

        <Card>
          <SectionLabel>{tr('profile.accent')}</SectionLabel>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s }}>
            {ACCENTS.map((a) => (
              <Chip key={a} label={a} selected={accent === a} onPress={() => setAccent(a)} />
            ))}
          </View>
        </Card>

        <Card>
          <SectionLabel>{tr('profile.language')}</SectionLabel>
          <LanguagePicker />
        </Card>

        <Card style={{ paddingVertical: 4 }}>
          <Row
            title={tr('profile.myClinics')}
            subtitle={tr('profile.saved', { n: savedClinicIds.length })}
            onPress={() => navigation.navigate('MyClinics')}
          />
          <Row
            title={tr('profile.guide')}
            subtitle={tr('profile.guideSub')}
            onPress={() => {
              // Home watches this flag and starts the tour when we land back on it
              setGuidePending(true);
              navigation.goBack();
            }}
            last
          />
        </Card>

        <GhostButton title={tr('profile.signOut')} onPress={signOut} />
      </ScrollView>
    </Screen>
  );
}
