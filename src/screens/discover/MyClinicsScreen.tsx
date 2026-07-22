import React, { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { IconButton, Screen } from '../../components/ui';
import { ServiceMenu } from '../../components/ServiceMenu';
import { formatAED } from '../../lib/money';
import { cardShadow, radii, spacing, type } from '../../theme';
import { useEterna, useTheme } from '../../store';
import { useT } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'MyClinics'>;

/**
 * Her clinics, the simplest possible way: one card per place, and under it the
 * services she does THERE (nails here, hair there), each with price and time.
 * "Edit" opens the clinic's menu with big ticks. Nothing to figure out.
 */
export function MyClinicsScreen({ navigation }: Props) {
  const t = useTheme();
  const tr = useT();
  const clinics = useEterna((s) => s.clinics);
  const savedIds = useEterna((s) => s.savedClinicIds);
  const myServices = useEterna((s) => s.myServices);
  const toggleMyService = useEterna((s) => s.toggleMyService);
  const toggleSaved = useEterna((s) => s.toggleSavedClinic);
  const addOwnClinic = useEterna((s) => s.addOwnClinic);
  const showToast = useEterna((s) => s.showToast);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<string | null>(null);

  const saved = clinics.filter((c) => savedIds.includes(c.id));

  const addOwn = () => {
    const n = name.trim();
    if (!n) return;
    addOwnClinic(n);
    setName('');
    showToast(n);
  };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m, paddingTop: spacing.s }}>
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} accessibilityLabel="Back" />
        <View style={{ flex: 1 }}>
          <Text style={[type.title, { color: t.text }]}>{tr('clinics.title')}</Text>
          <Text style={{ fontSize: 13, color: t.sub, marginTop: 1 }}>{tr('clinics.saved', { n: saved.length })}</Text>
        </View>
      </View>

      <ScrollView
        style={{ marginTop: spacing.l }}
        contentContainerStyle={{ gap: spacing.m, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {saved.length === 0 ? (
          <View
            style={{
              backgroundColor: t.bg,
              borderRadius: radii.card,
              borderWidth: 1,
              borderColor: t.border,
              padding: spacing.l,
              ...cardShadow,
            }}
          >
            <Text style={{ fontSize: 14, color: t.sub, lineHeight: 20 }}>{tr('clinics.empty')}</Text>
          </View>
        ) : (
          saved.map((c) => {
            const mine = myServices[c.id] ?? [];
            const chosen = c.offerings.filter((o) => mine.includes(o.name));
            const isEditing = editing === c.id;
            return (
              <View
                key={c.id}
                style={{
                  backgroundColor: t.bg,
                  borderRadius: radii.card,
                  borderWidth: 1,
                  borderColor: t.border,
                  padding: spacing.m,
                  gap: spacing.s,
                  ...cardShadow,
                }}
              >
                {/* clinic header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m }}>
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      backgroundColor: t.accentSoft,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 17, fontWeight: '700', color: t.accent }}>{c.name[0]}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ fontSize: 15.5, fontWeight: '700', color: t.text }}>
                      {c.name}
                    </Text>
                    {c.homeService ? (
                      <Text style={{ fontSize: 12, color: t.sub, marginTop: 1 }}>
                        {tr('discover.homeService')}
                      </Text>
                    ) : null}
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={tr('common.remove')}
                    onPress={() => toggleSaved(c.id)}
                    hitSlop={8}
                    style={({ pressed }) => ({ padding: 6, opacity: pressed ? 0.6 : 1 })}
                  >
                    <Ionicons name="bookmark" size={19} color={t.accent} />
                  </Pressable>
                </View>

                {/* what she does here */}
                {chosen.length > 0 ? (
                  <View style={{ gap: 6 }}>
                    {chosen.map((o) => (
                      <View key={o.name} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s }}>
                        <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: t.accent }} />
                        <Text numberOfLines={1} style={{ flex: 1, fontSize: 14, fontWeight: '600', color: t.text }}>
                          {o.name}
                        </Text>
                        <Text style={{ fontSize: 12.5, color: t.sub }}>
                          {formatAED(o.price)} · {o.mins} {tr('clinics.min')}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={{ fontSize: 13, color: t.muted }}>{tr('clinics.nothingHere')}</Text>
                )}

                {/* edit: the clinic's menu with big ticks */}
                {c.offerings.length > 0 ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded: isEditing }}
                    onPress={() => setEditing(isEditing ? null : c.id)}
                    hitSlop={6}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingVertical: 9,
                      borderTopWidth: 1,
                      borderTopColor: t.separator,
                      opacity: pressed ? 0.6 : 1,
                    })}
                  >
                    <Ionicons name={isEditing ? 'chevron-up' : 'create-outline'} size={16} color={t.accent} />
                    <Text style={{ flex: 1, fontSize: 13.5, fontWeight: '700', color: t.accent }}>
                      {isEditing ? tr('event.done') : tr('clinics.editServices')}
                    </Text>
                  </Pressable>
                ) : null}
                {isEditing ? (
                  <ServiceMenu
                    mode="tick"
                    offerings={c.offerings}
                    tickedNames={mine}
                    onToggle={(n) => toggleMyService(c.id, n)}
                    maxHeight={280}
                  />
                ) : null}
              </View>
            );
          })
        )}

        {/* add your own */}
        <View style={{ flexDirection: 'row', gap: spacing.s }}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={tr('clinics.addPlaceholder')}
            placeholderTextColor={t.muted}
            accessibilityLabel={tr('clinics.add')}
            onSubmitEditing={addOwn}
            style={{
              flex: 1,
              backgroundColor: t.surface,
              borderRadius: radii.m,
              borderWidth: 1,
              borderColor: t.border,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 15,
              color: t.text,
            }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tr('common.add')}
            onPress={addOwn}
            style={({ pressed }) => ({
              paddingHorizontal: 18,
              borderRadius: radii.m,
              backgroundColor: name.trim() ? t.accent : t.faint,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: pressed ? 0.96 : 1 }],
            })}
          >
            <Text style={{ color: name.trim() ? t.onAccent : t.sub, fontWeight: '700' }}>{tr('common.add')}</Text>
          </Pressable>
        </View>

        {/* find more */}
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('Tabs', { screen: 'Discover' })}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.s,
            paddingVertical: 13,
            borderRadius: radii.l,
            borderWidth: 1,
            borderColor: t.accent,
            transform: [{ scale: pressed ? 0.99 : 1 }],
          })}
        >
          <Ionicons name="search" size={16} color={t.accent} />
          <Text style={{ fontSize: 15, fontWeight: '700', color: t.accent }}>{tr('clinics.find')}</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
