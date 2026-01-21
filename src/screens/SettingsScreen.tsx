import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Alert,
    Image
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
        clearCache
    } = useSettings();

    const handleVideoQuality = () => {
        Alert.alert(
            'Chất lượng video mặc định',
            'Chọn chất lượng video:',
            [
                { text: '360p', onPress: () => setVideoQuality('360p') },
                { text: '480p', onPress: () => setVideoQuality('480p') },
                { text: '720p', onPress: () => setVideoQuality('720p') },
                { text: '1080p', onPress: () => setVideoQuality('1080p') },
                { text: 'Hủy', style: 'cancel' }
            ]
        );
    };

    const handleClearCache = async () => {
        Alert.alert(
            'Xóa cache',
            'Bạn có chắc muốn xóa tất cả cache? Điều này sẽ xóa dữ liệu tạm thời.',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await clearCache();
                        if (result.success) {
                            Alert.alert('Thành công', `Đã xóa ${result.size} cache!`);
                        } else {
                            Alert.alert('Lỗi', 'Không thể xóa cache.');
                        }
                    }
                }
            ]
        );
    };

    const renderSettingItem = (
        icon: string,
        iconColor: string,
        title: string,
        subtitle?: string,
        isToggle?: boolean,
        toggleValue?: boolean,
        onToggle?: () => void,
        onPress?: () => void
    ) => (
        <TouchableOpacity
            style={styles.settingItem}
            onPress={isToggle ? onToggle : onPress}
        >
            <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
                <Ionicons name={icon as any} size={22} color={iconColor} />
            </View>
            <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{title}</Text>
                {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
            </View>
            {isToggle ? (
                <View style={[styles.toggleBtn, toggleValue && styles.toggleBtnActive]}>
                    <Text style={styles.toggleText}>{toggleValue ? 'Bật' : 'Tắt'}</Text>
                </View>
            ) : (
                <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
            )}
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Cài đặt</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Account Section (Demo) */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <Ionicons name="person-circle-outline" size={40} color={COLORS.primary} />
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>Khách (Demo Mode)</Text>
                        <Text style={styles.profileSubtext}>Đăng nhập để lưu lịch sử đám mây</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={() => Alert.alert('Đăng nhập', 'Tính năng tài khoản & đồng bộ Cloud sẽ sớm ra mắt ở phiên bản tiếp theo!')}
                    >
                        <Text style={styles.loginButtonText}>Đăng nhập</Text>
                    </TouchableOpacity>
                </View>

                {/* Playback */}
                <Text style={styles.sectionTitle}>Phát video</Text>
                <View style={styles.settingsCard}>
                    {renderSettingItem(
                        'headset',
                        COLORS.primary,
                        'Phát nền',
                        'Tiếp tục phát khi tắt màn hình',
                        true,
                        backgroundPlay,
                        toggleBackgroundPlay
                    )}
                    {renderSettingItem(
                        'play-circle',
                        '#FF6B35',
                        'Tự động phát',
                        'Phát video tiếp theo tự động',
                        true,
                        autoPlay,
                        toggleAutoPlay
                    )}
                    {renderSettingItem(
                        'albums',
                        '#8B5CF6',
                        'Tự động PiP',
                        'Mở hình trong hình khi thoát',
                        true,
                        autoPiP,
                        toggleAutoPiP
                    )}
                </View>

                {/* Data & Storage */}
                <Text style={styles.sectionTitle}>Dữ liệu & Lưu trữ</Text>
                <View style={styles.settingsCard}>
                    {renderSettingItem(
                        'cloud-download',
                        '#00B4D8',
                        'Chất lượng video mặc định',
                        videoQuality,
                        false,
                        false,
                        undefined,
                        handleVideoQuality
                    )}
                    {renderSettingItem(
                        'trash',
                        COLORS.error,
                        'Xóa cache',
                        'Xóa dữ liệu tạm thời',
                        false,
                        false,
                        undefined,
                        handleClearCache
                    )}
                </View>

                {/* About */}
                <Text style={styles.sectionTitle}>Thông tin</Text>
                <View style={styles.settingsCard}>
                    {renderSettingItem(
                        'information-circle',
                        '#6366F1',
                        'Phiên bản',
                        '1.0.0'
                    )}
                    {renderSettingItem(
                        'cloud-download',
                        COLORS.primary,
                        'Kiểm tra cập nhật',
                        'Kiểm tra phiên bản mới',
                        false,
                        false,
                        undefined,
                        () => checkForUpdates(true)
                    )}
                    {renderSettingItem(
                        'shield-checkmark',
                        '#10B981',
                        'Chính sách bảo mật',
                        undefined,
                        false,
                        false,
                        undefined,
                        () => navigation.navigate('PrivacyPolicy')
                    )}
                    {renderSettingItem(
                        'document-text',
                        '#8B5CF6',
                        'Điều khoản sử dụng',
                        undefined,
                        false,
                        false,
                        undefined,
                        () => navigation.navigate('TermsOfService')
                    )}
                    {renderSettingItem(
                        'bug',
                        '#EF4444',
                        'Phản hồi & Báo lỗi',
                        undefined,
                        false,
                        false,
                        undefined,
                        () => Alert.alert('Phản hồi', 'Cảm ơn bạn đã đóng góp ý kiến!')
                    )}
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Image
                        source={require('../../assets/icon.png')}
                        style={{ width: 32, height: 32, borderRadius: 8, marginBottom: 5 }}
                        resizeMode="contain"
                    />
                    <Text style={styles.footerTitle}>ZyTube</Text>
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
    header: {
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.m,
    },
    headerTitle: {
        fontSize: FONTS.sizes.xl,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    content: {
        flex: 1,
        paddingHorizontal: SPACING.m,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.l,
        padding: SPACING.m,
        marginBottom: SPACING.l,
    },
    avatarContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInfo: {
        flex: 1,
        marginLeft: SPACING.m,
    },
    profileName: {
        fontSize: FONTS.sizes.m,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    profileSubtext: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    loginButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.s,
        borderRadius: RADIUS.full,
    },
    loginButtonText: {
        color: COLORS.background,
        fontWeight: 'bold',
        fontSize: FONTS.sizes.s,
    },
    sectionTitle: {
        fontSize: FONTS.sizes.s,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: SPACING.s,
        marginTop: SPACING.m,
    },
    settingsCard: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.l,
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: RADIUS.m,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingInfo: {
        flex: 1,
        marginLeft: SPACING.m,
    },
    settingTitle: {
        fontSize: FONTS.sizes.m,
        fontWeight: '500',
        color: COLORS.textPrimary,
    },
    settingSubtitle: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    toggleBtn: {
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.xs,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.border,
    },
    toggleBtnActive: {
        backgroundColor: COLORS.primary,
    },
    toggleText: {
        fontSize: FONTS.sizes.xs,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    footer: {
        alignItems: 'center',
        paddingVertical: SPACING.xxl,
        opacity: 0.6,
    },
    footerTitle: {
        fontSize: FONTS.sizes.m,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
    },
});

export default SettingsScreen;
