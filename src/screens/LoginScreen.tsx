import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const LoginScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const { signInWithGoogle, isSigningIn } = useAuth();

    // Animations
    const logoAnim = useRef(new Animated.Value(0)).current;
    const titleAnim = useRef(new Animated.Value(0)).current;
    const subtitleAnim = useRef(new Animated.Value(0)).current;
    const featuresAnim = useRef(new Animated.Value(0)).current;
    const buttonAnim = useRef(new Animated.Value(0)).current;
    const skipAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Staggered entrance animations
        Animated.stagger(120, [
            Animated.spring(logoAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }),
            Animated.spring(titleAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }),
            Animated.spring(subtitleAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }),
            Animated.spring(featuresAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }),
            Animated.spring(buttonAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }),
            Animated.spring(skipAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }),
        ]).start();

        // Continuous pulse animation on logo
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.05, duration: 2000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const makeAnimStyle = (anim: Animated.Value) => ({
        opacity: anim,
        transform: [{
            translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
            })
        }],
    });

    const handleGoogleSignIn = async () => {
        await signInWithGoogle();
    };

    const handleSkip = () => {
        navigation.replace('Main');
    };

    const features = [
        { icon: 'cloud-upload-outline', text: 'Đồng bộ lịch sử xem giữa các thiết bị' },
        { icon: 'heart-outline', text: 'Lưu playlist yêu thích lên cloud' },
        { icon: 'shield-checkmark-outline', text: 'Bảo mật dữ liệu với Google' },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Background gradient */}
            <LinearGradient
                colors={['#0a0f1a', '#0d1525', '#101c30']}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Decorative glowing orbs */}
            <View style={styles.orbContainer}>
                <View style={[styles.orb, styles.orb1]} />
                <View style={[styles.orb, styles.orb2]} />
                <View style={[styles.orb, styles.orb3]} />
            </View>

            <View style={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>

                {/* Logo Section */}
                <Animated.View style={[styles.logoSection, makeAnimStyle(logoAnim)]}>
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <View style={styles.logoWrapper}>
                            <LinearGradient
                                colors={['#E74C3C', '#C0392B']}
                                style={styles.logoGradient}
                            >
                                <Image
                                    source={require('../../assets/icon.png')}
                                    style={styles.logo}
                                    contentFit="contain"
                                />
                            </LinearGradient>
                            {/* Glow effect */}
                            <View style={styles.logoGlow} />
                        </View>
                    </Animated.View>
                </Animated.View>

                {/* Title */}
                <Animated.View style={makeAnimStyle(titleAnim)}>
                    <Text style={styles.title}>
                        Chào mừng đến{'\n'}
                        <Text style={styles.titleAccent}>ZyTube</Text>
                    </Text>
                </Animated.View>

                {/* Subtitle */}
                <Animated.View style={makeAnimStyle(subtitleAnim)}>
                    <Text style={styles.subtitle}>
                        Đăng nhập để đồng bộ dữ liệu và trải nghiệm đầy đủ tính năng
                    </Text>
                </Animated.View>

                {/* Features List */}
                <Animated.View style={[styles.featuresContainer, makeAnimStyle(featuresAnim)]}>
                    {features.map((feature, index) => (
                        <View key={index} style={styles.featureRow}>
                            <View style={styles.featureIconWrapper}>
                                <Ionicons name={feature.icon as any} size={20} color={COLORS.primary} />
                            </View>
                            <Text style={styles.featureText}>{feature.text}</Text>
                        </View>
                    ))}
                </Animated.View>

                {/* Spacer */}
                <View style={{ flex: 1 }} />

                {/* Google Sign-In Button */}
                <Animated.View style={makeAnimStyle(buttonAnim)}>
                    <TouchableOpacity
                        style={styles.googleButton}
                        onPress={handleGoogleSignIn}
                        activeOpacity={0.8}
                        disabled={isSigningIn}
                    >
                        <LinearGradient
                            colors={['#ffffff', '#f5f5f5']}
                            style={styles.googleButtonGradient}
                        >
                            {isSigningIn ? (
                                <ActivityIndicator size="small" color="#333" />
                            ) : (
                                <>
                                    <Image
                                        source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                                        style={styles.googleIcon}
                                        contentFit="contain"
                                    />
                                    <Text style={styles.googleButtonText}>Đăng nhập với Google</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                {/* Skip Button */}
                <Animated.View style={makeAnimStyle(skipAnim)}>
                    <TouchableOpacity
                        style={styles.skipButton}
                        onPress={handleSkip}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.skipText}>Bỏ qua, dùng không cần đăng nhập</Text>
                        <Ionicons name="arrow-forward" size={16} color={COLORS.textTertiary} />
                    </TouchableOpacity>
                </Animated.View>

                {/* Footer */}
                <Text style={styles.footerText}>
                    Bằng việc đăng nhập, bạn đồng ý với{' '}
                    <Text style={styles.footerLink} onPress={() => navigation.navigate('TermsOfService')}>
                        Điều khoản
                    </Text>
                    {' '}và{' '}
                    <Text style={styles.footerLink} onPress={() => navigation.navigate('PrivacyPolicy')}>
                        Chính sách bảo mật
                    </Text>
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    orbContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    orb: {
        position: 'absolute',
        borderRadius: 999,
    },
    orb1: {
        width: 300,
        height: 300,
        backgroundColor: `${COLORS.primary}08`,
        top: -50,
        right: -100,
    },
    orb2: {
        width: 200,
        height: 200,
        backgroundColor: '#E74C3C08',
        bottom: 100,
        left: -60,
    },
    orb3: {
        width: 150,
        height: 150,
        backgroundColor: `${COLORS.primary}06`,
        bottom: 300,
        right: -30,
    },
    content: {
        flex: 1,
        paddingHorizontal: SPACING.xl,
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    logoWrapper: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoGradient: {
        width: 90,
        height: 90,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.large,
    },
    logo: {
        width: 60,
        height: 60,
    },
    logoGlow: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#E74C3C15',
        zIndex: -1,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: COLORS.textPrimary,
        textAlign: 'center',
        lineHeight: 42,
        marginBottom: SPACING.m,
    },
    titleAccent: {
        color: '#E74C3C',
        fontWeight: '900',
        fontSize: 36,
    },
    subtitle: {
        fontSize: FONTS.sizes.m,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: SPACING.xl,
        paddingHorizontal: SPACING.m,
    },
    featuresContainer: {
        backgroundColor: `${COLORS.surface}CC`,
        borderRadius: RADIUS.xl,
        padding: SPACING.l,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    featureIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: `${COLORS.primary}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.m,
    },
    featureText: {
        flex: 1,
        fontSize: FONTS.sizes.s,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    googleButton: {
        borderRadius: RADIUS.xl,
        overflow: 'hidden',
        marginBottom: SPACING.m,
        ...SHADOWS.medium,
    },
    googleButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: SPACING.xl,
    },
    googleIcon: {
        width: 22,
        height: 22,
        marginRight: SPACING.m,
    },
    googleButtonText: {
        fontSize: FONTS.sizes.l,
        fontWeight: '600',
        color: '#333333',
    },
    skipButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.m,
        marginBottom: SPACING.m,
    },
    skipText: {
        fontSize: FONTS.sizes.s,
        color: COLORS.textTertiary,
        marginRight: SPACING.xs,
    },
    footerText: {
        fontSize: 11,
        color: COLORS.textTertiary,
        textAlign: 'center',
        lineHeight: 18,
    },
    footerLink: {
        color: COLORS.primary,
        textDecorationLine: 'underline',
    },
});

export default LoginScreen;
