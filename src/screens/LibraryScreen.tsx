import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Alert,
    StatusBar,
    Animated,
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
import DownloadManager, { DownloadedVideo } from '../services/DownloadManager';
import VideoSkeleton from '../components/VideoSkeleton';
import { FavoritesEmptyState, HistoryEmptyState, DownloadsEmptyState } from '../components/EmptyState';
import { useTabBar } from '../context/TabBarContext';

const LibraryScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const { setTabBarVisible } = useTabBar();
    const [activeTab, setActiveTab] = useState<'favorites' | 'history' | 'downloads'>('favorites');
    const { favorites, history, loading, refreshLibrary, clearHistory, clearFavorites } = useLibrary();
    const [downloads, setDownloads] = useState<DownloadedVideo[]>([]);
    const { playVideo } = usePlayer();

    // Scroll handling
    const scrollOffset = React.useRef(0);
    const lastScrollY = React.useRef(0);

    const handleScroll = (e: any) => {
        const currentOffset = e.nativeEvent.contentOffset.y;
        const direction = currentOffset > scrollOffset.current ? 'down' : 'up';
        const distance = Math.abs(currentOffset - scrollOffset.current);

        // Vuốt lên > 10px -> Hiện ngay lập tức
        if (direction === 'up' && distance > 10) {
            setTabBarVisible(true);
        }

        // Ở gần top (< 50) -> Luôn hiện
        if (currentOffset < 50) {
            setTabBarVisible(true);
        }

        scrollOffset.current = currentOffset;
    };

    const handleScrollEndDrag = (e: any) => {
        const currentOffset = e.nativeEvent.contentOffset.y;
        const direction = currentOffset > lastScrollY.current ? 'down' : 'up';
        const velocity = Math.abs(currentOffset - lastScrollY.current);

        // Chỉ ẩn khi vuốt xuống rõ ràng (> 40px) và thả tay ra
        if (velocity > 40 && direction === 'down' && currentOffset > 100) {
            setTabBarVisible(false);
        }

        lastScrollY.current = currentOffset;
    };

    const handleMomentumScrollEnd = (e: any) => {
        const currentOffset = e.nativeEvent.contentOffset.y;
        if (currentOffset <= 0) setTabBarVisible(true);
        lastScrollY.current = currentOffset;
    };

    const loadDownloads = async () => {
        const data = await DownloadManager.getDownloads();
        setDownloads(data);
    };

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
                        else if (activeTab === 'downloads') {
                            // Clear all downloads logic if needed, or just warn
                            Alert.alert('Thông báo', 'Vui lòng xóa từng video một.');
                        }
                    }
                }
            ]
        );
    };

    useFocusEffect(
        useCallback(() => {
            refreshLibrary();
            loadDownloads();
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

    // Empty states now use the new EmptyState component
    const goToHome = () => navigation.navigate('HomeTab');

    const renderVideoItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.videoCard}
            onPress={() => {
                if (activeTab === 'downloads') {
                    // Play local file
                    playVideo({
                        ...item,
                        url: (item as DownloadedVideo).localUri || item.url,
                        isLocal: true
                    });
                } else {
                    playVideo(item);
                }
            }}
            activeOpacity={0.8}
        >
            <View style={styles.thumbnailContainer}>
                <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} contentFit="cover" transition={500} />
                <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>
                        {youtubeApi.formatDuration(Number(item.duration) || 0)}
                    </Text>
                </View>
            </View>
            <View style={styles.videoInfo}>
                <Image
                    source={{ uri: item.uploaderAvatar || 'https://via.placeholder.com/40' }}
                    style={styles.channelAvatar}
                    contentFit="cover"
                    transition={500}
                />
                <View style={styles.textContainer}>
                    <Text style={styles.videoTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.channelName}>
                        {item.uploaderName} • {activeTab === 'downloads' ? 'Đã tải xuống' : pipedApi.formatViews(item.views || 0)}
                    </Text>
                </View>
                {activeTab === 'downloads' && (
                    <TouchableOpacity style={{ padding: 10 }} onPress={() => handleDeleteDownload(item)}>
                        <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );

    const getActiveData = () => {
        switch (activeTab) {
            case 'favorites': return favorites;
            case 'history': return history;
            case 'downloads': return downloads;
            default: return [];
        }
    };

    const EmptyComponent = () => {
        if (loading) return <View style={{ paddingTop: 10 }}>{[1, 2, 3].map(i => <VideoSkeleton key={i} />)}</View>;

        switch (activeTab) {
            case 'favorites': return <FavoritesEmptyState onExplore={goToHome} />;
            case 'history': return <HistoryEmptyState />;
            case 'downloads': return <DownloadsEmptyState onBrowse={goToHome} />;
            default: return null;
        }
    };

    const handleDeleteDownload = (video: DownloadedVideo) => {
        Alert.alert('Xóa video', `Bạn muốn xóa video "${video.title}"?`, [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Xóa',
                style: 'destructive',
                onPress: async () => {
                    await DownloadManager.deleteDownload(video.url);
                    loadDownloads();
                }
            }
        ]);
    };

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

            <FlatList
                key={activeTab} // Force remount when tab changes
                data={getActiveData()}
                renderItem={renderVideoItem}
                keyExtractor={(item, index) => item.url + index}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={refreshLibrary} tintColor={COLORS.primary} />
                }
                ListEmptyComponent={EmptyComponent}

                // Scroll handling for TabBar visibility
                onScroll={handleScroll}
                onScrollEndDrag={handleScrollEndDrag}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                scrollEventThrottle={16}

                // Performance optimizations
                removeClippedSubviews={true}
                maxToRenderPerBatch={5}
                windowSize={7}
                initialNumToRender={4}
                updateCellsBatchingPeriod={50}
                getItemLayout={(data, index) => ({
                    length: 280, // Approximate height of video card
                    offset: 280 * index,
                    index,
                })}
            />
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
        paddingBottom: SPACING.s, // Add breathing room
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.s,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.surface,
        marginRight: SPACING.s,
        borderWidth: 1,
        borderColor: 'transparent', // Prepare for active border
    },
    tabActive: {
        backgroundColor: COLORS.primary + '20', // 20% opacity
        borderColor: COLORS.primary,
    },
    tabText: {
        fontSize: FONTS.sizes.s,
        color: COLORS.textSecondary,
        fontWeight: '600',
        marginLeft: SPACING.xs,
    },
    tabTextActive: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        // Removed default padding to allow full-width items
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
        paddingHorizontal: SPACING.l,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    emptyTitle: {
        fontSize: FONTS.sizes.l,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: SPACING.xs,
    },
    emptySubtitle: {
        fontSize: FONTS.sizes.s,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    // --- VIDEO CARD STYLES (MATCHING HOME) ---
    videoCard: {
        marginBottom: SPACING.l,
        backgroundColor: COLORS.background,
    },
    thumbnailContainer: {
        width: '100%',
        // No border radius for premium feel
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
        backgroundColor: 'rgba(0,0,0,0.85)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    durationText: {
        color: COLORS.textPrimary,
        fontSize: 10,
        fontWeight: 'bold',
    },
    videoInfo: {
        flexDirection: 'row',
        marginTop: 12, // More spacing
        paddingHorizontal: SPACING.m, // Content padding
        alignItems: 'flex-start',
    },
    channelAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 12,
        backgroundColor: COLORS.surface,
    },
    textContainer: {
        flex: 1,
    },
    videoTitle: {
        fontSize: 15, // Standard YouTube readable size
        fontWeight: '500', // Medium weight
        color: COLORS.textPrimary,
        lineHeight: 22,
        marginBottom: 4,
    },
    channelName: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
});

export default LibraryScreen;
