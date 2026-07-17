import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation';
import { ToastHost } from './src/components/ui';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <RootNavigator />
      <ToastHost />
    </SafeAreaProvider>
  );
}
