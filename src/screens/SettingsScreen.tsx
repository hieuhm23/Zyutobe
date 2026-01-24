import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Alert,
    Image,
    Linking,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';
import { useNavigation } from '@react-navigation/native';
import { checkForUpdates } from '../utils/updateChecker';

const SettingsScreen = () => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const {
        autoPlay,
        toggleAutoPlay,
        backgroundPlay,
        toggleBackgroundPlay,
        autoPiP,
        toggleAutoPiP,
        videoQuality,
        setVideoQuality,
        region,
        setRegion,
        sponsorBlockEnabled,
        toggleSponsorBlock,
        clearCache
    } = useSettings();

    const REGIONS = [
        { label: 'Việt Nam', value: 'VN' },
        { label: 'Hoa Kỳ (US)', value: 'US' },
        { label: 'Hàn Quốc', value: 'KR' },
        { label: 'Nhật Bản', value: 'JP' },
        { label: 'Vương Quốc Anh', value: 'GB' },
    ];

    const handleRegion = () => {
        Alert.alert(
            'Chọn quốc gia',
            'Thay đổi quốc gia để xem các video xu hướng tại đó.',
            [
                ...REGIONS.map(r => ({
                    text: r.label,
                    onPress: () => setRegion(r.value)
                })),
                { text: 'Hủy', style: 'cancel' }
            ]
        );
    };

    const handleVideoQuality = () => {
        Alert.alert(
            'Chất lượng mặc định',
            'Chọn độ phân giải ưu tiên:',
            [
                { text: '360p (Tiết kiệm)', onPress: () => setVideoQuality('360p') },
                { text: '480p (Trung bình)', onPress: () => setVideoQuality('480p') },
                { text: '720p (HD)', onPress: () => setVideoQuality('720p') },
                { text: '1080p (Full HD)', onPress: () => setVideoQuality('1080p') },
                { text: 'Hủy', style: 'cancel' }
            ]
        );
    };

    const handleClearCache = async () => {
        Alert.alert(
            'Dọn dẹp bộ nhớ',
            'Xóa bộ nhớ đệm giúp ứng dụng chạy mượt hơn và giải phóng dung lượng.',
            [
                { text: 'Để sau', style: 'cancel' },
                {
                    text: 'Xóa ngay',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await clearCache();
                        if (result.success) {
                            Alert.alert('Thành công', `Đã giải phóng ${result.size} bộ nhớ!`);
                        } else {
                            Alert.alert('Lỗi', 'Không thể xóa cache lúc này.');
                        }
                    }
                }
            ]
        );
    };

    const SettingItem = ({ icon, color, title, subtitle, isToggle, toggleValue, onToggle, onPress, isDestructive }: any) => (
        <TouchableOpacity
            style={styles.settingItem}
            onPress={isToggle ? onToggle : onPress}
            activeOpacity={0.7}
        >
            <LinearGradient
                colors={[color, color + '90']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconContainer}
            >
                <Ionicons name={icon} size={20} color="#fff" />
            </LinearGradient>

            <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, isDestructive && { color: COLORS.error }]}>{title}</Text>
                {subtitle && <Text style={styles.settingSubtitle} numberOfLines={1}>{subtitle}</Text>}
            </View>

            {isToggle ? (
                <View style={[styles.toggleTrack, toggleValue && { backgroundColor: COLORS.primary }]}>
                    <View style={[styles.toggleThumb, toggleValue && { transform: [{ translateX: 18 }] }]} />
                </View>
            ) : (
                <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
            )}
        </TouchableOpacity>
    );

    const SectionHeader = ({ title }: { title: string }) => (
        <Text style={styles.sectionHeader}>{title}</Text>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

            {/* Header Background */}
            <View style={[styles.fixedHeader, { height: 120 + insets.top }]}>
                <LinearGradient
                    colors={[COLORS.primary + '40', COLORS.background]}
                    style={StyleSheet.absoluteFill}
                />
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Title */}
                <Text style={styles.screenTitle}>Cài đặt</Text>

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <LinearGradient
                        colors={[COLORS.surface, COLORS.surface]}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.profileContent}>
                        <View style={styles.avatarBorder}>
                            <Image
                                source={{ uri: 'https://ui-avatars.com/api/?name=User&background=random' }}
                                style={styles.avatar}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.profileName}>Khách (Guest)</Text>
                            <Text style={styles.profileStatus}>Chế độ ẩn danh</Text>
                        </View>
                        <TouchableOpacity style={styles.loginBtn} onPress={() => Alert.alert('Thông báo', 'Tính năng đăng nhập đang được phát triển!')}>
                            <Text style={styles.loginBtnText}>Đăng nhập</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Settings Sections */}
                <View style={styles.sectionContainer}>
                    <SectionHeader title="TRẢI NGHIỆM XEM" />
                    <View style={styles.card}>
                        <SettingItem
                            icon="headset"
                            color={COLORS.primary}
                            title="Phát nền (Background Play)"
                            subtitle="Nghe nhạc khi tắt màn hình"
                            isToggle
                            toggleValue={backgroundPlay}
                            onToggle={toggleBackgroundPlay}
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon="albums"
                            color="#8B5CF6"
                            title="Hình trong hình (PiP)"
                            subtitle="Tự động thu nhỏ video"
                            isToggle
                            toggleValue={autoPiP}
                            onToggle={toggleAutoPiP}
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon="infinite"
                            color="#10B981"
                            title="Tự động phát tiếp"
                            subtitle="Phát video gợi ý tiếp theo"
                            isToggle
                            toggleValue={autoPlay}
                            onToggle={toggleAutoPlay}
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon="shield-checkmark"
                            color="#3B82F6"
                            title="SponsorBlock"
                            subtitle="Tự động bỏ qua quảng cáo tài trợ"
                            isToggle
                            toggleValue={sponsorBlockEnabled}
                            onToggle={toggleSponsorBlock}
                        />
                    </View>

                    <SectionHeader title="CHẤT LƯỢNG & DỮ LIỆU" />
                    <View style={styles.card}>
                        <SettingItem
                            icon="globe"
                            color="#10B981"
                            title="Quốc gia"
                            subtitle={`Đang chọn: ${REGIONS.find(r => r.value === region)?.label || region}`}
                            onPress={handleRegion}
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon="options" // Changed icon to be more relevant
                            color="#F59E0B"
                            title="Chất lượng video"
                            subtitle={`Mặc định: ${videoQuality === 'auto' ? 'Tự động' : videoQuality}`}
                            onPress={handleVideoQuality}
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon="trash"
                            color="#EF4444"
                            title="Xóa bộ nhớ đệm"
                            subtitle="Giải phóng dung lượng máy"
                            onPress={handleClearCache}
                        />
                    </View>

                    <SectionHeader title="ỨNG DỤNG" />
                    <View style={styles.card}>
                        <SettingItem
                            icon="cloud-download"
                            color="#3B82F6"
                            title="Kiểm tra cập nhật"
                            subtitle="Phiên bản hiện tại: 1.0.0"
                            onPress={() => checkForUpdates(true)}
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon="paper-plane"
                            color="#229ED9"
                            title="Liên hệ Admin"
                            subtitle="Hỗ trợ qua Telegram @Niidios"
                            onPress={() => Linking.openURL('https://t.me/Niidios')}
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon="shield-checkmark"
                            color="#10B981"
                            title="Chính sách bảo mật"
                            subtitle="Quyền riêng tư & Dữ liệu"
                            onPress={() => navigation.navigate('PrivacyPolicy')}
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon="document-text"
                            color="#8B5CF6"
                            title="Điều khoản sử dụng"
                            subtitle="Quy định khi dùng App"
                            onPress={() => navigation.navigate('TermsOfService')}
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon="information-circle"
                            color="#6366F1"
                            title="Về ZyTube"
                            subtitle="Thông tin phiên bản & Tác giả"
                            onPress={() => Alert.alert('ZyTube v1.0.0', 'Developed by Hieukka for Zyea')}
                        />
                    </View>
                </View>

                {/* Footer Logo */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>ZyTube for Zyea</Text>
                    <Text style={styles.footerVersion}>Version 1.0.0 (Build 2026)</Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    fixedHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: -1,
    },
    content: {
        flex: 1,
        paddingHorizontal: SPACING.m,
    },
    screenTitle: {
        fontSize: 34,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: SPACING.l,
    },
    profileCard: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: SPACING.xl,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    profileContent: {
        padding: SPACING.l,
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarBorder: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 2,
        borderColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.m,
        padding: 3,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 30,
        backgroundColor: COLORS.textTertiary,
    },
    profileName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    profileStatus: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    loginBtn: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    loginBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.primary,
    },
    sectionContainer: {
        marginBottom: SPACING.l,
    },
    sectionHeader: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.textSecondary,
        marginBottom: SPACING.s,
        marginLeft: SPACING.s,
        textTransform: 'uppercase',
        letterSpacing: 1,
        opacity: 0.8,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    settingTextContainer: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.textPrimary,
    },
    settingSubtitle: {
        fontSize: 13,
        color: COLORS.textTertiary,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginLeft: 68, // Align with text
    },
    toggleTrack: {
        width: 44,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        padding: 2,
    },
    toggleThumb: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#fff',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 30,
        opacity: 0.5,
    },
    footerIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        marginBottom: 10,
        tintColor: COLORS.textSecondary,
    },
    footerText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    footerVersion: {
        color: COLORS.textTertiary,
        fontSize: 12,
        marginTop: 4,
    },
});

export default SettingsScreen;
