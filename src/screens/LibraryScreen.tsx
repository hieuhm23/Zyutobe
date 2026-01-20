import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    StatusBar,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';
import { useLibrary } from '../hooks/useLibrary';
import pipedApi from '../services/pipedApi';

const LibraryScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<'favorites' | 'history' | 'downloads'>('favorites');
    const { favorites, history, loading, refreshLibrary } = useLibrary();

    useFocusEffect(
        useCallback(() => {
            refreshLibrary();
        }, [])
    );

    const renderTab = (tab: 'favorites' | 'history' | 'downloads', label: string, icon: string) => (
        <TouchableOpacity
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
        >
            <Ionicons
                name={icon as any}
                size={20}
                color={activeTab === tab ? COLORS.primary : COLORS.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    const renderEmptyState = (icon: string, title: string, subtitle: string) => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
                <Ionicons name={icon as any} size={60} color={COLORS.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>{title}</Text>
            <Text style={styles.emptySubtitle}>{subtitle}</Text>
        </View>
    );

    const renderVideoList = (videos: any[]) => (
        videos.map((video, index) => (
            <TouchableOpacity
                key={index + video.url}
                style={styles.videoCard}
                onPress={() => {
                    const videoId = video.url?.replace('/watch?v=', '') || '';
                    navigation.navigate('Player', { videoId, video });
                }}
            >
                <Image source={{ uri: video.thumbnail }} style={styles.thumbnail} />
                <View style={styles.videoInfo}>
                    <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
                    <Text style={styles.channelName}>{video.uploaderName}</Text>
                    <Text style={styles.viewsDate}>
                        {pipedApi.formatViews(video.views)} views
                    </Text>
                </View>
            </TouchableOpacity>
        ))
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Thư viện</Text>
            </View>

            <View style={styles.tabBar}>
                {renderTab('favorites', 'Yêu thích', 'heart')}
                {renderTab('history', 'Lịch sử', 'time')}
                {renderTab('downloads', 'Đã tải', 'download')}
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={refreshLibrary} tintColor={COLORS.primary} />
                }
            >
                {activeTab === 'favorites' && (
                    favorites.length > 0 ? renderVideoList(favorites) : renderEmptyState(
                        'heart-outline',
                        'Chưa có video yêu thích',
                        'Nhấn ❤️ khi xem video để thêm vào đây'
                    )
                )}

                {activeTab === 'history' && (
                    history.length > 0 ? renderVideoList(history) : renderEmptyState(
                        'time-outline',
                        'Chưa có lịch sử xem',
                        'Video bạn xem sẽ xuất hiện ở đây'
                    )
                )}

                {activeTab === 'downloads' && renderEmptyState(
                    'download-outline',
                    'Chưa có video đã tải',
                    'Tải video để xem offline'
                )}

                <View style={{ height: 100 }} />
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
    tabBar: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.m,
        marginBottom: SPACING.m,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.s,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.surface,
        marginRight: SPACING.s,
    },
    tabActive: {
        backgroundColor: COLORS.primary + '20',
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    tabText: {
        fontSize: FONTS.sizes.s,
        color: COLORS.textSecondary,
        fontWeight: '500',
        marginLeft: SPACING.xs,
    },
    tabTextActive: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        paddingHorizontal: SPACING.m,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.l,
    },
    emptyTitle: {
        fontSize: FONTS.sizes.l,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: SPACING.s,
    },
    emptySubtitle: {
        fontSize: FONTS.sizes.s,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    videoCard: {
        flexDirection: 'row',
        marginBottom: SPACING.m,
    },
    thumbnail: {
        width: 160,
        height: 90,
        borderRadius: RADIUS.s,
        backgroundColor: COLORS.surface,
    },
    videoInfo: {
        flex: 1,
        marginLeft: SPACING.m,
        justifyContent: 'center',
    },
    videoTitle: {
        fontSize: FONTS.sizes.s,
        fontWeight: '500',
        color: COLORS.textPrimary,
        lineHeight: 18,
    },
    channelName: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    viewsDate: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.textTertiary,
        marginTop: 2,
    },
});

export default LibraryScreen;
