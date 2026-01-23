import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Alert,
    StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';
import { useLibrary } from '../hooks/useLibrary';
import pipedApi from '../services/pipedApi';
import youtubeApi from '../services/youtubeApi';
import { usePlayer } from '../context/PlayerContext';
import VideoSkeleton from '../components/VideoSkeleton';

const LibraryScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<'favorites' | 'history' | 'downloads'>('favorites');
    const { favorites, history, loading, refreshLibrary, clearHistory, clearFavorites } = useLibrary();
    const { playVideo } = usePlayer();

    const handleClear = () => {
        Alert.alert(
            activeTab === 'favorites' ? 'Xóa mục yêu thích' : 'Xóa lịch sử',
            `Bạn có chắc chắn muốn xóa toàn bộ ${activeTab === 'favorites' ? 'danh sách yêu thích' : 'lịch sử xem'} không?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa tất cả',
                    style: 'destructive',
                    onPress: () => {
                        if (activeTab === 'favorites') clearFavorites();
                        else if (activeTab === 'history') clearHistory();
                    }
                }
            ]
        );
    };

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
                onPress={() => playVideo(video)}
                activeOpacity={0.8}
            >
                <View style={styles.thumbnailContainer}>
                    <Image source={{ uri: video.thumbnail }} style={styles.thumbnail} contentFit="cover" transition={500} />
                    <View style={styles.durationBadge}>
                        <Text style={styles.durationText}>
                            {youtubeApi.formatDuration(Number(video.duration) || 0)}
                        </Text>
                    </View>
                </View>
                <View style={styles.videoInfo}>
                    <Image
                        source={{ uri: video.uploaderAvatar || 'https://via.placeholder.com/40' }}
                        style={styles.channelAvatar}
                        contentFit="cover"
                        transition={500}
                    />
                    <View style={styles.textContainer}>
                        <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
                        <Text style={styles.channelName}>
                            {video.uploaderName} • {pipedApi.formatViews(video.views || 0)}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        ))
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

            <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                <Text style={styles.headerTitle}>Thư viện</Text>
                {((activeTab === 'favorites' && favorites.length > 0) || (activeTab === 'history' && history.length > 0)) && (
                    <TouchableOpacity onPress={handleClear} style={{ padding: 5 }}>
                        <Ionicons name="trash-outline" size={22} color={COLORS.error} />
                    </TouchableOpacity>
                )}
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
                    loading && favorites.length === 0 ? (
                        <View style={{ paddingTop: 10 }}>{[1, 2, 3].map(i => <VideoSkeleton key={i} />)}</View>
                    ) : favorites.length > 0 ? renderVideoList(favorites) : renderEmptyState(
                        'heart-outline',
                        'Chưa có video yêu thích',
                        'Nhấn ❤️ khi xem video để thêm vào đây'
                    )
                )}

                {activeTab === 'history' && (
                    loading && history.length === 0 ? (
                        <View style={{ paddingTop: 10 }}>{[1, 2, 3].map(i => <VideoSkeleton key={i} />)}</View>
                    ) : history.length > 0 ? renderVideoList(history) : renderEmptyState(
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
        marginBottom: SPACING.l,
    },
    thumbnailContainer: {
        borderRadius: RADIUS.m,
        overflow: 'hidden',
    },
    thumbnail: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: COLORS.surface,
    },
    durationBadge: {
        position: 'absolute',
        bottom: SPACING.s,
        right: SPACING.s,
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingHorizontal: SPACING.s,
        paddingVertical: 2,
        borderRadius: RADIUS.xs,
    },
    durationText: {
        color: COLORS.textPrimary,
        fontSize: FONTS.sizes.xs,
        fontWeight: '500',
    },
    videoInfo: {
        flexDirection: 'row',
        marginTop: SPACING.m,
    },
    channelAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 10,
        backgroundColor: COLORS.surface,
    },
    textContainer: {
        flex: 1,
    },
    videoTitle: {
        fontSize: FONTS.sizes.m,
        fontWeight: '500',
        color: COLORS.textPrimary,
        lineHeight: 20,
    },
    channelName: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
});

export default LibraryScreen;
