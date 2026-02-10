import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './src/navigation/AppNavigator';
import { PlayerProvider } from './src/context/PlayerContext';
import { SettingsProvider } from './src/context/SettingsContext';
import { PremiumProvider } from './src/context/PremiumContext';
import { TabBarProvider } from './src/context/TabBarContext';
import { AuthProvider } from './src/context/AuthContext';
import GlobalPlayer from './src/components/GlobalPlayer';
import UpdateModal from './src/components/UpdateModal';
import NetworkStatus from './src/components/NetworkStatus';
import SplashScreen from './src/components/SplashScreen';
import PolicyConsentScreen from './src/screens/PolicyConsentScreen';
import { checkForUpdateSilent } from './src/utils/updateChecker';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import TrackPlayer from 'react-native-track-player';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState<boolean | null>(null);

  // Setup TrackPlayer safely
  useEffect(() => {
    const setup = async () => {
      try {
        // Only setup if native module is available
        await TrackPlayer.setupPlayer();
      } catch (e) {
        console.log("TrackPlayer setup failed - Native module might be missing", e);
      }
    };
    setup();
  }, []);

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
        <ErrorBoundary>
          <PolicyConsentScreen onAccept={() => setPolicyAccepted(true)} />
        </ErrorBoundary>
      </SafeAreaProvider>
    );
  }

  // Still loading policy status
  if (policyAccepted === null) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <PremiumProvider>
          <AuthProvider>
            <SettingsProvider>
              <PlayerProvider>
                <TabBarProvider>
                  <AppNavigator />
                </TabBarProvider>

                {/* Update Modal - shows when new version available */}
                <UpdateModal
                  visible={showUpdateModal}
                  onDismiss={() => setShowUpdateModal(false)}
                  forceUpdate={false}
                />
                <NetworkStatus />
              </PlayerProvider>
            </SettingsProvider>
          </AuthProvider>
        </PremiumProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
