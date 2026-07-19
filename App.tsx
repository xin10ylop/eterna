import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Asset } from 'expo-asset';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation';
import { ToastHost } from './src/components/ui';
import { ALL_FRONTS } from './src/components/avatar/config';

export default function App() {
  // Warm the avatar image cache once at launch so switching skin/hair is
  // instant and never waits on the network (matters most over an Expo tunnel).
  useEffect(() => {
    Asset.loadAsync(ALL_FRONTS as number[]).catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <RootNavigator />
      <ToastHost />
    </SafeAreaProvider>
  );
}
