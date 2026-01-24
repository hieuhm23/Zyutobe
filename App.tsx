import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './src/navigation/AppNavigator';
import { PlayerProvider } from './src/context/PlayerContext';
import { SettingsProvider } from './src/context/SettingsContext';
import GlobalPlayer from './src/components/GlobalPlayer';
import UpdateModal from './src/components/UpdateModal';
import NetworkStatus from './src/components/NetworkStatus';
import SplashScreen from './src/components/SplashScreen';
import PolicyConsentScreen from './src/screens/PolicyConsentScreen';
import { checkForUpdateSilent } from './src/utils/updateChecker';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState<boolean | null>(null);

  // Check policy acceptance status
  useEffect(() => {
    const checkPolicyStatus = async () => {
      try {
        const accepted = await AsyncStorage.getItem('policy_accepted');
        setPolicyAccepted(accepted === 'true');
      } catch (e) {
        setPolicyAccepted(false);
      }
    };
    checkPolicyStatus();
  }, []);

  // Check for OTA updates after splash
  useEffect(() => {
    if (!showSplash && policyAccepted) {
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
  }, [showSplash, policyAccepted]);

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // Show policy consent screen if not yet accepted
  if (policyAccepted === false) {
    return (
      <SafeAreaProvider>
        <PolicyConsentScreen onAccept={() => setPolicyAccepted(true)} />
      </SafeAreaProvider>
    );
  }

  // Still loading policy status
  if (policyAccepted === null) {
    return null;
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
