import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    RefreshControl,
    Animated,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';
import pipedApi, { VideoItem } from '../services/pipedApi';
import youtubeApi from '../services/youtubeApi';

import { usePlayer } from '../context/PlayerContext';
import { useSettings } from '../context/SettingsContext';
import { useTabBar } from '../context/TabBarContext';
import VideoSkeleton from '../components/VideoSkeleton';
import VideoCard from '../components/VideoCard';

type TabType = 'featured' | 'trending';

const HomeScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const { playVideo } = usePlayer();
    const { region } = useSettings();
    const { setTabBarVisible } = useTabBar();

    // Refs for Scroll Logic
    const flatListRef = useRef<FlatList>(null);
    const scrollOffset = useRef(0);
    const lastScrollY = useRef(0);
    const accumulatedScroll = useRef(0); // Tích lũy khoảng cách scroll để tránh flickering

    const [activeTab, setActiveTab] = useState<TabType>('featured');
    const logoScale = useRef(new Animated.Value(1)).current;
    const [searchQuery, setSearchQuery] = useState('');
    const [videos, setVideos] = useState<VideoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const HOME_TAGS = [
        'nhạc trẻ remix hot tiktok 2026',
        'lofi chill nhẹ nhàng 2026',
        'top hit việt nam 2026',
        'nhạc edm gây nghiện 2026',
        'bolero trữ tình hay nhất 2026',
        'nhạc acoustic thư giãn mới nhất',
        'nhạc rap việt mới nhất 2026',
        'video hot thịnh hành hôm nay',
        'hài việt nam mới nhất 2026',
        'nhạc xuân 2026',
        'trending vietnam today'
    ];

    const [currentTag, setCurrentTag] = useState(HOME_TAGS[Math.floor(Math.random() * HOME_TAGS.length)]);

    // Tab Press Listener (YouTube Style: Scroll to top OR Refresh)
    useEffect(() => {
        const unsubscribe = navigation.addListener('tabPress', (e: any) => {
            if (navigation.isFocused()) {
                // If scrolled down > 100px, scroll to top
                if (scrollOffset.current > 100) {
                    e.preventDefault(); // Stop default jump
                    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                } else {
                    // If at top, Refresh
                    onRefresh();
                }
            }
        });
        return unsubscribe;
    }, [navigation, activeTab]);

    useEffect(() => {
        // Force refresh on tab change or region change
        loadContent(false, true);
    }, [activeTab, region]);

    const loadContent = async (loadMore: boolean = false, forceRefresh: boolean = false, overrideTag?: string) => {
        if (loadMore && !nextPageToken) return;
        if (!loadMore) setLoading(true);

        try {
            let newItems: VideoItem[] = [];
            let newToken: string | null = null;
            const tokenToUse = (loadMore && nextPageToken) ? nextPageToken : undefined;
            const queryTag = overrideTag || currentTag;

            switch (activeTab) {
                case 'trending':
                    const data = await youtubeApi.getTrending(region, tokenToUse, forceRefresh);
                    newItems = data.items;
                    newToken = data.nextPageToken || null;
                    break;
                case 'featured':
                    // "Tất cả" - Random Discovery Feed using Search
                    let featData;
                    if (tokenToUse) {
                        featData = await youtubeApi.searchNextPage(queryTag, tokenToUse, 'video', forceRefresh);
                    } else {
                        featData = await youtubeApi.search(queryTag, 'video', forceRefresh);
                    }
                    newItems = featData.items || [];
                    newToken = featData.nextPageToken || null;
                    break;
                default:
                    const defData = await youtubeApi.getTrending('VN', tokenToUse, forceRefresh);
                    newItems = defData.items;
                    newToken = defData.nextPageToken || null;
            }

            if (loadMore) {
                setVideos(prev => [...prev, ...newItems]);
            } else {
                setVideos(newItems);
            }
            setNextPageToken(newToken);
        } catch (error) {
            console.error('Error loading content:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        // Logo pulse animation
        Animated.sequence([
            Animated.timing(logoScale, { toValue: 0.9, duration: 100, useNativeDriver: true }),
            Animated.timing(logoScale, { toValue: 1.1, duration: 150, useNativeDriver: true }),
            Animated.timing(logoScale, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start();

        setRefreshing(true);
        setNextPageToken(null);

        if (activeTab === 'featured') {
            const newTag = HOME_TAGS[Math.floor(Math.random() * HOME_TAGS.length)];
            setCurrentTag(newTag);
            loadContent(false, true, newTag);
        } else {
            loadContent(false, true);
        }
    };

    const handleLoadMore = () => {
        if (!loading && nextPageToken) {
            loadContent(true);
        }
    };

    const handleSearch = () => {
        if (searchQuery.trim()) {
            navigation.navigate('Search', { query: searchQuery, useYoutube: true });
        }
    };

    const handleVideoPress = (video: VideoItem) => {
        playVideo(video);
    };

    const renderTab = (tab: TabType, label: string, icon: string) => (
        <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
        >
            <Ionicons
                name={icon as any}
                size={18}
                color={activeTab === tab ? COLORS.primary : COLORS.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    const renderVideoCard = ({ item }: { item: VideoItem }) => (
        <VideoCard
            video={item}
            onPress={playVideo}
            onPressChannel={(channelId) => navigation.navigate('Channel', { channelId })}
            showAvatar={true}
        />
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

            <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                <Animated.View style={{ transform: [{ scale: logoScale }], flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                        style={[styles.logoRow, { marginBottom: 0 }]}
                        activeOpacity={0.7}
                        onPress={() => onRefresh()}
                    >
                        <Image
                            source={require('../../assets/icon.png')}
                            style={{ width: 34, height: 34, borderRadius: 8, borderWidth: 2, borderColor: '#E74C3C' }}
                            contentFit="contain"
                        />
                        <Text style={[styles.logoText, { marginLeft: 10, color: '#E74C3C' }]}>ZyTube</Text>
                    </TouchableOpacity>
                    {/* Tết icon nhỏ */}
                    <Text style={{ fontSize: 16, marginLeft: 6 }}>🧧</Text>
                </Animated.View>

                <TouchableOpacity
                    onPress={() => navigation.navigate('Search')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="search-outline" size={26} color={COLORS.textPrimary} />
                </TouchableOpacity>
            </View>

            <View style={styles.tabBar}>
                {renderTab('featured', 'Tất cả', 'grid')}
                {renderTab('trending', 'Xu Hướng', 'flame')}
            </View>

            {loading && !refreshing && videos.length === 0 ? (
                <View style={{ paddingTop: 10 }}>
                    {[1, 2, 3, 4].map((i) => (
                        <VideoSkeleton key={i} />
                    ))}
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={videos}
                    keyExtractor={(item, index) => item.url + index}
                    renderItem={renderVideoCard}
                    contentContainerStyle={styles.videoList}
                    showsVerticalScrollIndicator={false}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    onScroll={(e) => {
                        const currentOffset = e.nativeEvent.contentOffset.y;
                        const delta = currentOffset - scrollOffset.current;

                        // Tích lũy scroll distance (reset khi đổi hướng)
                        if ((delta > 0 && accumulatedScroll.current < 0) || (delta < 0 && accumulatedScroll.current > 0)) {
                            accumulatedScroll.current = 0; // Reset khi đổi hướng
                        }
                        accumulatedScroll.current += delta;

                        // Vuốt lên tích lũy > 30px → Hiện tab bar
                        if (accumulatedScroll.current < -30) {
                            setTabBarVisible(true);
                            accumulatedScroll.current = 0;
                        }

                        // Ở gần top (< 50) → Luôn hiện
                        if (currentOffset < 50) {
                            setTabBarVisible(true);
                            accumulatedScroll.current = 0;
                        }

                        scrollOffset.current = currentOffset;
                    }}
                    onScrollBeginDrag={() => {
                        lastScrollY.current = scrollOffset.current;
                        accumulatedScroll.current = 0;
                    }}
                    onScrollEndDrag={(e) => {
                        const currentOffset = e.nativeEvent.contentOffset.y;
                        const totalDrag = currentOffset - lastScrollY.current;

                        // Chỉ ẩn khi vuốt xuống rõ ràng (> 60px tổng) và đã scroll xa đủ
                        if (totalDrag > 60 && currentOffset > 100) {
                            setTabBarVisible(false);
                        }

                        lastScrollY.current = currentOffset;
                    }}
                    onMomentumScrollEnd={(e) => {
                        const currentOffset = e.nativeEvent.contentOffset.y;
                        if (currentOffset <= 0) setTabBarVisible(true);
                        lastScrollY.current = currentOffset;
                        accumulatedScroll.current = 0;
                    }}
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
                    ListFooterComponent={
                        loading && videos.length > 0 ? (
                            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 20 }} />
                        ) : <View style={{ height: 100 }} />
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[COLORS.primary]}
                            tintColor={COLORS.primary}
                            progressBackgroundColor={COLORS.surface}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="videocam-off" size={60} color={COLORS.textTertiary} />
                            <Text style={styles.emptyText}>Không có video nào</Text>
                        </View>
                    }
                />
            )}
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
        paddingBottom: SPACING.m,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    logoText: {
        fontSize: FONTS.sizes.xl,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginLeft: SPACING.s,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.l,
        paddingHorizontal: SPACING.m,
        height: 48,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchInput: {
        flex: 1,
        marginLeft: SPACING.s,
        fontSize: FONTS.sizes.m,
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: SPACING.m,
        color: COLORS.textSecondary,
        fontSize: FONTS.sizes.m,
    },
    videoList: {
        paddingHorizontal: 0, // Full width for premium look
        paddingBottom: SPACING.xxl,
    },
    videoCard: {
        marginBottom: SPACING.l,
        backgroundColor: COLORS.background, // Ensure clean background
    },
    thumbnailContainer: {
        // Removed borderRadius for generic full-width feel, or keep small if desired
        // borderRadius: RADIUS.m, 
        width: '100%',
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
        paddingHorizontal: SPACING.m, // Add padding to info only
        alignItems: 'flex-start',
    },
    channelAvatar: {
        width: 40, // Slightly larger avatar
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
    },
    videoDetails: {
        flex: 1,
        marginLeft: SPACING.m,
    },
    videoTitle: {
        fontSize: FONTS.sizes.m,
        fontWeight: '500',
        color: COLORS.textPrimary,
        lineHeight: 22, // Better line height
        marginBottom: 4,
    },
    channelName: {
        fontSize: FONTS.sizes.s,
        color: COLORS.textSecondary,
    },
    viewsDate: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.textTertiary,
        marginTop: 2,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        marginTop: SPACING.m,
        color: COLORS.textSecondary,
        fontSize: FONTS.sizes.m,
    },
});

export default HomeScreen;
