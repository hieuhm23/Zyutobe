import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { PlayerProvider } from './src/context/PlayerContext';
import { SettingsProvider } from './src/context/SettingsContext';
import GlobalPlayer from './src/components/GlobalPlayer';

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <PlayerProvider>
          <AppNavigator />
          <GlobalPlayer />
        </PlayerProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
