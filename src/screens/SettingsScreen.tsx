import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';

const SettingsScreen = () => {
    const insets = useSafeAreaInsets();

    const [backgroundPlay, setBackgroundPlay] = useState(true);
    const [autoPlay, setAutoPlay] = useState(true);

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
                {/* Profile Section */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <MaterialCommunityIcons name="account" size={40} color={COLORS.primary} />
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>Đăng nhập</Text>
                        <Text style={styles.profileSubtext}>Đồng bộ dữ liệu của bạn</Text>
                    </View>
                    <TouchableOpacity style={styles.loginButton}>
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
                        () => setBackgroundPlay(!backgroundPlay)
                    )}
                    {renderSettingItem(
                        'play-circle',
                        '#FF6B35',
                        'Tự động phát',
                        'Phát video tiếp theo tự động',
                        true,
                        autoPlay,
                        () => setAutoPlay(!autoPlay)
                    )}
                </View>

                {/* Data & Storage */}
                <Text style={styles.sectionTitle}>Dữ liệu & Lưu trữ</Text>
                <View style={styles.settingsCard}>
                    {renderSettingItem(
                        'cloud-download',
                        '#00B4D8',
                        'Chất lượng video mặc định',
                        '720p',
                        false,
                        false,
                        undefined,
                        () => Alert.alert('Chất lượng video', 'Chọn chất lượng: 360p, 480p, 720p, 1080p')
                    )}
                    {renderSettingItem(
                        'trash',
                        COLORS.error,
                        'Xóa cache',
                        '0 MB',
                        false,
                        false,
                        undefined,
                        () => Alert.alert('Thành công', 'Cache đã được xóa!')
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
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <MaterialCommunityIcons name="youtube" size={32} color={COLORS.primary} />
                    <Text style={styles.footerTitle}>ZyTube</Text>
                    <Text style={styles.footerSubtitle}>Xem video không giới hạn</Text>
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
    },
    footerTitle: {
        fontSize: FONTS.sizes.l,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginTop: SPACING.s,
    },
    footerSubtitle: {
        fontSize: FONTS.sizes.s,
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
    },
});

export default SettingsScreen;
