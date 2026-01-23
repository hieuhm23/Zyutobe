import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NetworkStatus = () => {
    const netInfo = useNetInfo();
    const insets = useSafeAreaInsets();
    const translateY = useRef(new Animated.Value(-100)).current;

    // Use a local state to delay the "back online" message disappearance
    const [statusText, setStatusText] = useState('Đang mất kết nối internet');
    const [statusColor, setStatusColor] = useState(COLORS.error);

    useEffect(() => {
        if (netInfo.isConnected === false) {
            // Offline
            setStatusText('Bạn đang offline');
            setStatusColor(COLORS.error);
            showBanner();
        } else if (netInfo.isConnected === true) {
            // Online - if previously shown offline
            // We can show "Back online" briefly then hide
            // For now, let's just seek simple behavior: hide when online.

            // Optional: Show "Back online" green banner?
            // Let's implement a simple "Offline" banner that slides in/out.
            hideBanner();
        }
    }, [netInfo.isConnected]);

    const showBanner = () => {
        Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            speed: 12,
            bounciness: 8,
        }).start();
    };

    const hideBanner = () => {
        Animated.timing(translateY, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    if (netInfo.isConnected === null) return null; // Initial state

    return (
        <Animated.View style={[
            styles.container,
            {
                top: insets.top,
                transform: [{ translateY }]
            }
        ]}>
            <View style={[styles.banner, { backgroundColor: COLORS.error }]}>
                <Ionicons name="cloud-offline" size={20} color="#fff" />
                <Text style={styles.text}>Không có kết nối Internet</Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 20,
        right: 20,
        alignItems: 'center',
        zIndex: 9999,
    },
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.m,
        paddingVertical: 10,
        borderRadius: RADIUS.l,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    text: {
        color: '#fff',
        marginLeft: SPACING.s,
        fontWeight: '600',
        fontSize: FONTS.sizes.s,
    }
});

export default NetworkStatus;
