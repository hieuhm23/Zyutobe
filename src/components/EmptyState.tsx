import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';

interface EmptyStateProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    actionLabel?: string;
    onAction?: () => void;
    type?: 'default' | 'search' | 'library' | 'history' | 'downloads' | 'favorites' | 'error';
}

const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    subtitle,
    actionLabel,
    onAction,
    type = 'default',
}) => {
    // Get colors based on type
    const getTypeColors = () => {
        switch (type) {
            case 'search':
                return { iconBg: '#3B82F620', iconColor: '#3B82F6' };
            case 'library':
                return { iconBg: '#8B5CF620', iconColor: '#8B5CF6' };
            case 'history':
                return { iconBg: '#F59E0B20', iconColor: '#F59E0B' };
            case 'downloads':
                return { iconBg: '#10B98120', iconColor: '#10B981' };
            case 'favorites':
                return { iconBg: '#EF444420', iconColor: '#EF4444' };
            case 'error':
                return { iconBg: '#EF444420', iconColor: '#EF4444' };
            default:
                return { iconBg: COLORS.primary + '20', iconColor: COLORS.primary };
        }
    };

    const { iconBg, iconColor } = getTypeColors();

    return (
        <View style={styles.container}>
            {/* Icon Circle */}
            <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
                <Ionicons name={icon} size={48} color={iconColor} />
            </View>

            {/* Title */}
            <Text style={styles.title}>{title}</Text>

            {/* Subtitle */}
            {subtitle && (
                <Text style={styles.subtitle}>{subtitle}</Text>
            )}

            {/* Action Button */}
            {actionLabel && onAction && (
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={onAction}
                    activeOpacity={0.8}
                    accessibilityLabel={actionLabel}
                    accessibilityRole="button"
                >
                    <Text style={styles.actionText}>{actionLabel}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

// Pre-configured empty states for common scenarios
export const SearchEmptyState = ({ onExplore }: { onExplore?: () => void }) => (
    <EmptyState
        icon="search-outline"
        title="Không tìm thấy kết quả"
        subtitle="Thử tìm kiếm với từ khóa khác hoặc kiểm tra lỗi chính tả"
        actionLabel={onExplore ? "Khám phá video" : undefined}
        onAction={onExplore}
        type="search"
    />
);

export const LibraryEmptyState = ({ onExplore }: { onExplore?: () => void }) => (
    <EmptyState
        icon="library-outline"
        title="Thư viện trống"
        subtitle="Các video bạn thích và lịch sử xem sẽ xuất hiện ở đây"
        actionLabel="Khám phá video"
        onAction={onExplore}
        type="library"
    />
);

export const HistoryEmptyState = () => (
    <EmptyState
        icon="time-outline"
        title="Chưa có lịch sử xem"
        subtitle="Video bạn đã xem sẽ xuất hiện ở đây"
        type="history"
    />
);

export const DownloadsEmptyState = ({ onBrowse }: { onBrowse?: () => void }) => (
    <EmptyState
        icon="download-outline"
        title="Chưa có video đã tải"
        subtitle="Tải video để xem offline khi không có mạng"
        actionLabel={onBrowse ? "Duyệt video" : undefined}
        onAction={onBrowse}
        type="downloads"
    />
);

export const FavoritesEmptyState = ({ onExplore }: { onExplore?: () => void }) => (
    <EmptyState
        icon="heart-outline"
        title="Chưa có video yêu thích"
        subtitle="Nhấn ❤️ để lưu video bạn thích"
        actionLabel={onExplore ? "Tìm video" : undefined}
        onAction={onExplore}
        type="favorites"
    />
);

export const NetworkErrorState = ({ onRetry }: { onRetry?: () => void }) => (
    <EmptyState
        icon="cloud-offline-outline"
        title="Không có kết nối mạng"
        subtitle="Vui lòng kiểm tra kết nối internet của bạn"
        actionLabel="Thử lại"
        onAction={onRetry}
        type="error"
    />
);

export const LoadErrorState = ({ onRetry }: { onRetry?: () => void }) => (
    <EmptyState
        icon="warning-outline"
        title="Đã xảy ra lỗi"
        subtitle="Không thể tải nội dung. Vui lòng thử lại sau"
        actionLabel="Thử lại"
        onAction={onRetry}
        type="error"
    />
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.xxl,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.l,
    },
    title: {
        fontSize: FONTS.sizes.l,
        fontWeight: '700',
        color: COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: SPACING.s,
    },
    subtitle: {
        fontSize: FONTS.sizes.m,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: SPACING.l,
    },
    actionButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.m,
        borderRadius: RADIUS.full,
        marginTop: SPACING.m,
    },
    actionText: {
        color: '#000',
        fontSize: FONTS.sizes.m,
        fontWeight: '600',
    },
});

export default EmptyState;
