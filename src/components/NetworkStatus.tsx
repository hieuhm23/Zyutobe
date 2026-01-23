import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NetworkStatus = () => {
    // Safety check: NetInfo hooks might crash if native module missing
    let netInfo = { isConnected: true };
    try {
        netInfo = useNetInfo();
    } catch (e) {
        // Fallback fake online state
        return null;
    }

    const insets = useSafeAreaInsets();
    const translateY = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        if (netInfo && netInfo.isConnected === false) {
            showBanner();
        } else {
            hideBanner();
        }
    }, [netInfo?.isConnected]);

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

    if (!netInfo || netInfo.isConnected === null || netInfo.isConnected === true) return null;

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
