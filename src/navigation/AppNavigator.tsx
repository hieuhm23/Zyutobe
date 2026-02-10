import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Screens
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import PlayerScreen from '../screens/PlayerScreen';
import LibraryScreen from '../screens/LibraryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/TermsOfServiceScreen';
import ChannelScreen from '../screens/ChannelScreen';
import PremiumScreen from '../screens/PremiumScreen';
import LoginScreen from '../screens/LoginScreen';

// Components
import TelegramTabBar from '../components/TelegramTabBar';
import GlobalPlayer from '../components/GlobalPlayer';

// Auth
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
    return (
        <Tab.Navigator
            tabBar={(props) => <TelegramTabBar {...props} />}
            screenOptions={{
                headerShown: false,
                lazy: true, // Lazy load tabs - chỉ load khi user chuyển đến
                freezeOnBlur: true, // Freeze inactive screens để tiết kiệm memory
                animation: 'fade', // Smooth fade animation khi chuyển tab
            }}
        >
            <Tab.Screen name="HomeTab" component={HomeScreen} />
            <Tab.Screen name="LibraryTab" component={LibraryScreen} />
            <Tab.Screen name="SettingsTab" component={SettingsScreen} />
        </Tab.Navigator>
    );
};

const AppNavigator = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return null; // SplashScreen đã handle loading state
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                }}
            >
                {/* Nếu chưa đăng nhập, hiện LoginScreen đầu tiên */}
                {!user && (
                    <Stack.Screen
                        name="Login"
                        component={LoginScreen}
                        options={{ animation: 'fade' }}
                    />
                )}

                <Stack.Screen name="Main" component={TabNavigator} />
                <Stack.Screen
                    name="Player"
                    component={PlayerScreen}
                    options={{
                        animation: 'slide_from_bottom',
                    }}
                />
                <Stack.Screen name="Search" component={SearchScreen} />
                <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
                <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
                <Stack.Screen name="Channel" component={ChannelScreen} />
                <Stack.Screen name="Premium" component={PremiumScreen} />
            </Stack.Navigator>
            <GlobalPlayer />
        </NavigationContainer>
    );
};

export default AppNavigator;
