import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { PlayerProvider } from './src/context/PlayerContext';
import { SettingsProvider } from './src/context/SettingsContext';
import GlobalPlayer from './src/components/GlobalPlayer';
import UpdateModal from './src/components/UpdateModal';
import NetworkStatus from './src/components/NetworkStatus';
import SplashScreen from './src/components/SplashScreen';
import { checkForUpdateSilent } from './src/utils/updateChecker';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Check for OTA updates after splash
  useEffect(() => {
    if (!showSplash) {
      const checkUpdate = async () => {
        const result = await checkForUpdateSilent();
        if (result.hasUpdate) {
          setShowUpdateModal(true);
        }
      };

      // Delay check by 1 second after splash
      const timer = setTimeout(checkUpdate, 1000);
      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <PlayerProvider>
          <AppNavigator />
          <GlobalPlayer />

          {/* Update Modal - shows when new version available */}
          <UpdateModal
            visible={showUpdateModal}
            onDismiss={() => setShowUpdateModal(false)}
            forceUpdate={false}
          />
          <NetworkStatus />
        </PlayerProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
