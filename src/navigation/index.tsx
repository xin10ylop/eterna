import React from 'react';
import { Pressable, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, type BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useEterna, useTheme } from '../store';
import { useT } from '../i18n';
import type { RootStackParamList, TabParamList } from './types';

import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { FeaturesScreen } from '../screens/onboarding/FeaturesScreen';
import { SignInScreen, SignUpScreen, VerifyScreen } from '../screens/onboarding/AuthScreens';
import { BirthdayScreen, NameScreen, RoutineScreen } from '../screens/onboarding/ProfileSteps';
import { PlanScreen } from '../screens/onboarding/PlanScreen';
import { AvatarStudioScreen } from '../screens/onboarding/AvatarStudioScreen';
import { NotificationsScreen, ReadyScreen } from '../screens/onboarding/FinishScreens';

import { HomeScreen } from '../screens/home/HomeScreen';
import { ZoneDetailScreen } from '../screens/home/ZoneDetailScreen';
import { TreatmentDetailScreen } from '../screens/home/TreatmentDetailScreen';
import { EventPrepScreen } from '../screens/home/EventPrepScreen';
import { PlanningScreen } from '../screens/planning/PlanningScreen';
import { DiscoverScreen } from '../screens/discover/DiscoverScreen';
import { MyClinicsScreen } from '../screens/discover/MyClinicsScreen';
import { BudgetScreen } from '../screens/budget/BudgetScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { BookScreen } from '../screens/modals/BookScreen';
import { AddRitualScreen } from '../screens/modals/AddRitualScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();

/** Placeholder for the center tab, the button intercepts and opens Add. */
function NullScreen() {
  return null;
}

function AddTabButton(props: BottomTabBarButtonProps) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add a ritual"
        onPress={props.onPress as never}
        style={({ pressed }) => ({
          width: 46,
          height: 46,
          borderRadius: 23,
          backgroundColor: t.accent,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: -8,
          shadowColor: t.accent,
          shadowOpacity: 0.35,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 5,
          transform: [{ scale: pressed ? 0.92 : 1 }],
        })}
      >
        <Ionicons name="add" size={26} color={t.onAccent} />
      </Pressable>
    </View>
  );
}

const TAB_LABEL: Record<string, string> = {
  Home: 'tab.home',
  Planning: 'tab.planning',
  Discover: 'tab.discover',
  Budget: 'tab.budget',
};

function MainTabs() {
  const t = useTheme();
  const tr = useT();
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.muted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarLabel: TAB_LABEL[route.name] ? tr(TAB_LABEL[route.name]) : undefined,
        tabBarStyle: {
          backgroundColor: t.tabBg,
          borderTopColor: t.border,
        },
        tabBarIcon: ({ color, focused }) => {
          const size = 24;
          switch (route.name) {
            case 'Home':
              return <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />;
            case 'Planning':
              return <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color} />;
            case 'Discover':
              return <Ionicons name={focused ? 'location' : 'location-outline'} size={size} color={color} />;
            case 'Budget':
              return <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={size} color={color} />;
            default:
              return null;
          }
        },
      })}
    >
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="Planning" component={PlanningScreen} />
      <Tabs.Screen
        name="Add"
        component={NullScreen}
        options={{
          tabBarLabel: () => null,
          tabBarButton: (props) => <AddTabButton {...props} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.getParent()?.navigate('AddRitual' as never);
          },
        })}
      />
      <Tabs.Screen name="Budget" component={BudgetScreen} />
      <Tabs.Screen name="Discover" component={DiscoverScreen} />
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  const t = useTheme();
  const isSignedIn = useEterna((s) => s.isSignedIn);

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: t.bg,
      primary: t.accent,
      card: t.bg,
      text: t.text,
      border: t.border,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isSignedIn ? (
          <Stack.Group>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Features" component={FeaturesScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen name="Verify" component={VerifyScreen} />
            <Stack.Screen name="Name" component={NameScreen} />
            <Stack.Screen name="Birthday" component={BirthdayScreen} />
            <Stack.Screen name="Routine" component={RoutineScreen} />
            <Stack.Screen name="Plan" component={PlanScreen} />
            <Stack.Screen name="AvatarStudio" component={AvatarStudioScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Ready" component={ReadyScreen} />
          </Stack.Group>
        ) : (
          <Stack.Group>
            <Stack.Screen name="Tabs" component={MainTabs} />
            <Stack.Screen name="ZoneDetail" component={ZoneDetailScreen} />
            <Stack.Screen name="TreatmentDetail" component={TreatmentDetailScreen} />
            <Stack.Screen name="EventPrep" component={EventPrepScreen} />
            <Stack.Screen name="MyClinics" component={MyClinicsScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            {/* Distinct route name from the onboarding AvatarStudio: a shared
                name across the two conditional groups made the main app
                present over the studio (draggable back to it). A plain card
                push here also removes the drag-to-dismiss. */}
            <Stack.Screen name="AvatarEdit" component={AvatarStudioScreen} />
            <Stack.Screen name="Book" component={BookScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen
              name="AddRitual"
              component={AddRitualScreen}
              options={{ presentation: 'modal' }}
            />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
