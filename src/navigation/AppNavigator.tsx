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

// Custom Tab Bar
import TelegramTabBar from '../components/TelegramTabBar';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
    return (
        <Tab.Navigator
            tabBar={(props) => <TelegramTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tab.Screen name="HomeTab" component={HomeScreen} />
            <Tab.Screen name="SearchTab" component={SearchScreen} />
            <Tab.Screen name="LibraryTab" component={LibraryScreen} />
            <Tab.Screen name="SettingsTab" component={SettingsScreen} />
        </Tab.Navigator>
    );
};

const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                }}
            >
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
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
