import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    BackHandler,
    Alert,
    Dimensions,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { COLORS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

interface PolicyConsentScreenProps {
    onAccept: () => void;
}

const PolicyConsentScreen: React.FC<PolicyConsentScreenProps> = ({ onAccept }) => {
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');

    const handleAccept = async () => {
        try {
            await AsyncStorage.setItem('policy_accepted', 'true');
            onAccept();
        } catch (e) {
            console.error('Error saving policy consent:', e);
        }
    };

    const handleDecline = () => {
        Alert.alert(
            'Decline Terms',
            'You must agree to the Terms of Service and Privacy Policy to use ZyTube.',
            [
                { text: 'Review', style: 'cancel' },
                {
                    text: 'Exit App',
                    style: 'destructive',
                    onPress: () => BackHandler.exitApp()
                }
            ]
        );
    };

    const termsContent = [
        { icon: 'document-text-outline', text: 'By using this app, you agree to the YouTube Terms of Service (ToS).' },
        { icon: 'logo-google', text: 'Compliance with Google Privacy Policy.' },
        { icon: 'cloud-download-outline', text: 'Content is provided via YouTube API Services.' },
        { icon: 'alert-circle-outline', text: 'Unauthorized downloading or separation of content is prohibited.' },
        { icon: 'shield-checkmark-outline', text: 'Respect copyright and creator ownership rights.' },
    ];

    const privacyContent = [
        { icon: 'finger-print-outline', text: 'We do not collect or store personal information on our servers.' },
        { icon: 'phone-portrait-outline', text: 'History & favorites are stored locally on this device only.' },
        { icon: 'share-social-outline', text: 'We do not share user data with any third parties.' },
        { icon: 'trash-outline', text: 'You have full control to clear app data in Settings.' },
        { icon: 'server-outline', text: 'Data retrieval strictly follows API Client regulations.' },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Background Gradient */}
            <LinearGradient
                colors={['#0a0a0a', '#1a1a2e', '#0a0a0a']}
                style={StyleSheet.absoluteFill}
            />

            {/* Decorative Circles */}
            <View style={[styles.decorCircle, styles.circle1]} />
            <View style={[styles.decorCircle, styles.circle2]} />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 140 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Logo & Title */}
                <View style={styles.headerSection}>
                    <View style={styles.logoWrapper}>
                        <Image
                            source={require('../../assets/adaptive-icon.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.appName}>ZyTube</Text>
                    <Text style={styles.tagline}>Watch unlimited videos</Text>
                </View>

                {/* Welcome Card */}
                <View style={styles.welcomeCard}>
                    <LinearGradient
                        colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
                        style={styles.welcomeCardGradient}
                    >
                        <Ionicons name="hand-left" size={28} color={COLORS.primary} />
                        <View style={styles.welcomeTextContainer}>
                            <Text style={styles.welcomeTitle}>Welcome!</Text>
                            <Text style={styles.welcomeSubtitle}>
                                Please review the terms before starting
                            </Text>
                        </View>
                    </LinearGradient>
                </View>

                {/* Tab Switcher */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'terms' && styles.tabActive]}
                        onPress={() => setActiveTab('terms')}
                    >
                        <Ionicons
                            name="document-text"
                            size={18}
                            color={activeTab === 'terms' ? '#fff' : 'rgba(255,255,255,0.5)'}
                        />
                        <Text style={[styles.tabText, activeTab === 'terms' && styles.tabTextActive]}>
                            Terms
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'privacy' && styles.tabActive]}
                        onPress={() => setActiveTab('privacy')}
                    >
                        <Ionicons
                            name="shield-checkmark"
                            size={18}
                            color={activeTab === 'privacy' ? '#fff' : 'rgba(255,255,255,0.5)'}
                        />
                        <Text style={[styles.tabText, activeTab === 'privacy' && styles.tabTextActive]}>
                            Privacy
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Content Card */}
                <View style={styles.contentCard}>
                    <View style={styles.contentHeader}>
                        <Ionicons
                            name={activeTab === 'terms' ? 'document-text' : 'shield-checkmark'}
                            size={24}
                            color={activeTab === 'terms' ? COLORS.primary : '#10B981'}
                        />
                        <Text style={styles.contentTitle}>
                            {activeTab === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
                        </Text>
                    </View>

                    <View style={styles.contentList}>
                        {(activeTab === 'terms' ? termsContent : privacyContent).map((item, index) => (
                            <View key={index} style={styles.contentItem}>
                                <View style={[
                                    styles.contentItemIcon,
                                    { backgroundColor: activeTab === 'terms' ? 'rgba(255,0,85,0.15)' : 'rgba(16,185,129,0.15)' }
                                ]}>
                                    <Ionicons
                                        name={item.icon as any}
                                        size={18}
                                        color={activeTab === 'terms' ? COLORS.primary : '#10B981'}
                                    />
                                </View>
                                <Text style={styles.contentItemText}>{item.text}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Disclaimer */}
                <View style={styles.disclaimerCard}>
                    <Ionicons name="information-circle" size={20} color="#F59E0B" />
                    <Text style={styles.disclaimerText}>
                        ZyTube is an independent application, not affiliated with YouTube or Google.
                    </Text>
                </View>
            </ScrollView>

            {/* Bottom Fixed Area */}
            <View style={[styles.bottomArea, { paddingBottom: insets.bottom + 20 }]}>
                <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={styles.bottomContent}>
                    <Text style={styles.agreementNote}>
                        Tap "Agree" to confirm you have read and accepted
                    </Text>
                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.declineBtn} onPress={handleDecline}>
                            <Text style={styles.declineBtnText}>Decline</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept} activeOpacity={0.8}>
                            <LinearGradient
                                colors={[COLORS.primary, '#E11D48']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.acceptBtnGradient}
                            >
                                <Text style={styles.acceptBtnText}>Agree & Continue</Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    decorCircle: {
        position: 'absolute',
        borderRadius: 999,
        opacity: 0.15,
    },
    circle1: {
        width: 300,
        height: 300,
        backgroundColor: COLORS.primary,
        top: -100,
        right: -100,
    },
    circle2: {
        width: 200,
        height: 200,
        backgroundColor: '#6366F1',
        bottom: 200,
        left: -80,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoWrapper: {
        marginBottom: 16,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
    },
    logoImage: {
        width: 100,
        height: 100,
        borderRadius: 24,
    },
    appName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 1,
    },
    tagline: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
        marginTop: 4,
    },
    welcomeCard: {
        marginBottom: 24,
        borderRadius: 20,
        overflow: 'hidden',
    },
    welcomeCardGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
    },
    welcomeTextContainer: {
        marginLeft: 16,
        flex: 1,
    },
    welcomeTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    welcomeSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 4,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 4,
        marginBottom: 20,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    tabActive: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.5)',
    },
    tabTextActive: {
        color: '#fff',
    },
    contentCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        marginBottom: 16,
    },
    contentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    contentTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 12,
    },
    contentList: {
        gap: 16,
    },
    contentItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    contentItemIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    contentItemText: {
        flex: 1,
        fontSize: 14,
        color: 'rgba(255,255,255,0.85)',
        lineHeight: 20,
    },
    disclaimerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245,158,11,0.1)',
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(245,158,11,0.2)',
        gap: 12,
    },
    disclaimerText: {
        flex: 1,
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        lineHeight: 18,
    },
    bottomArea: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        overflow: 'hidden',
    },
    bottomContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    agreementNote: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
        textAlign: 'center',
        marginBottom: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    declineBtn: {
        flex: 0.4,
        paddingVertical: 16,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    declineBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.6)',
    },
    acceptBtn: {
        flex: 0.6,
        borderRadius: 14,
        overflow: 'hidden',
    },
    acceptBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 10,
    },
    acceptBtnText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#fff',
    },
});

export default PolicyConsentScreen;
