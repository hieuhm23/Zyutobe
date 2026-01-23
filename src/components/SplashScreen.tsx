import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    Image,
    StatusBar
} from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
    onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
    const logoScale = useRef(new Animated.Value(0.3)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;
    const loadingOpacity = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animation sequence
        Animated.sequence([
            // 1. Logo fade in and scale up
            Animated.parallel([
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.spring(logoScale, {
                    toValue: 1,
                    tension: 100,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]),
            // 2. Text fade in
            Animated.timing(textOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            // 3. Loading indicator
            Animated.timing(loadingOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();

        // Pulse animation for logo
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Loading Bar Animation (Indeterminate)
        Animated.loop(
            Animated.timing(progressAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            })
        ).start();

        // Auto hide after 2.5 seconds
        const timer = setTimeout(() => {
            Animated.parallel([
                Animated.timing(logoOpacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(textOpacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(loadingOpacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                onFinish();
            });
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* Background gradient effect */}
            <View style={styles.gradientOverlay} />

            {/* Logo Container */}
            <Animated.View
                style={[
                    styles.logoContainer,
                    {
                        opacity: logoOpacity,
                        transform: [
                            { scale: Animated.multiply(logoScale, pulseAnim) }
                        ]
                    }
                ]}
            >
                <Image
                    source={require('../../assets/icon.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </Animated.View>

            {/* App Name */}
            <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
                <Text style={styles.appName}>ZyTube</Text>
                <Text style={styles.tagline}>Xem video không giới hạn</Text>
            </Animated.View>

            {/* Loading Indicator */}
            <Animated.View style={[styles.loadingContainer, { opacity: loadingOpacity }]}>
                <View style={styles.loadingBar}>
                    <Animated.View
                        style={[
                            styles.loadingProgress,
                            {
                                transform: [{
                                    translateX: progressAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [-150, 150]
                                    })
                                }]
                            }
                        ]}
                    />
                </View>
            </Animated.View>

            {/* Bottom Branding */}
            <Animated.View style={[styles.bottomBranding, { opacity: textOpacity }]}>
                <Text style={styles.brandingText}>from</Text>
                <Text style={styles.brandingName}>Zyea</Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0f1a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    gradientOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#0a0f1a',
    },
    logoContainer: {
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 100,
        height: 100,
        borderRadius: 20,
    },
    textContainer: {
        marginTop: 24,
        alignItems: 'center',
    },
    appName: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 2,
    },
    tagline: {
        fontSize: 14,
        color: COLORS.primary,
        marginTop: 8,
        letterSpacing: 1,
    },
    loadingContainer: {
        position: 'absolute',
        bottom: 120,
        width: 150,
    },
    loadingBar: {
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    loadingProgress: {
        height: '100%',
        width: '50%',
        backgroundColor: COLORS.primary,
        borderRadius: 2,
    },
    bottomBranding: {
        position: 'absolute',
        bottom: 50,
        alignItems: 'center',
    },
    brandingText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
    },
    brandingName: {
        fontSize: 16,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.6)',
        marginTop: 2,
    },
});

export default SplashScreen;
