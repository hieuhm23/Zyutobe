import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Image,
    StatusBar,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';
import pipedApi, { VideoItem } from '../services/pipedApi';
import youtubeApi from '../services/youtubeApi';

import { usePlayer } from '../context/PlayerContext';

type TabType = 'featured' | 'trending';

const HomeScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const { playVideo } = usePlayer();

    // Refs for Scroll Logic
    const flatListRef = useRef<FlatList>(null);
    const scrollOffset = useRef(0);

    const [activeTab, setActiveTab] = useState<TabType>('featured');
    const [searchQuery, setSearchQuery] = useState('');
    const [videos, setVideos] = useState<VideoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [currentTag, setCurrentTag] = useState('video hot thịnh hành');

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
        loadContent();
    }, [activeTab]);

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
                    const data = await youtubeApi.getTrending('VN', tokenToUse, forceRefresh);
                    newItems = data.items;
                    newToken = data.nextPageToken || null;
                    break;
                case 'featured':
                    // "Tất cả" - Random Discovery Feed using Search
                    let featData;
                    if (tokenToUse) {
                        featData = await youtubeApi.searchNextPage(queryTag, tokenToUse);
                    } else {
                        featData = await youtubeApi.search(queryTag);
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
        setRefreshing(true);
        setNextPageToken(null);

        if (activeTab === 'featured') {
            // Prioritize Music content (80% music, 20% variety)
            const tags = [
                'nhạc trẻ remix hot tiktok',
                'lofi chill nhẹ nhàng',
                'top hit việt nam 2024',
                'nhạc edm gây nghiện',
                'bolero trữ tình hay nhất',
                'nhạc acoustic thư giãn',
                'nhạc rap việt mới nhất',
                'video hot thịnh hành',
                'hài mới nhất'
            ];
            const newTag = tags[Math.floor(Math.random() * tags.length)];
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
        <TouchableOpacity
            style={styles.videoCard}
            onPress={() => handleVideoPress(item)}
            activeOpacity={0.8}
        >
            <View style={styles.thumbnailContainer}>
                <Image
                    source={{ uri: item.thumbnail }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                />
                <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>
                        {youtubeApi.formatDuration(item.duration || 0)}
                    </Text>
                </View>
            </View>

            <View style={styles.videoInfo}>
                <Image
                    source={{ uri: item.uploaderAvatar || 'https://via.placeholder.com/40' }}
                    style={styles.channelAvatar}
                />

                <View style={styles.videoDetails}>
                    <Text style={styles.videoTitle} numberOfLines={2}>
                        {item.title}
                    </Text>
                    <Text style={styles.channelName} numberOfLines={1}>
                        {item.uploaderName}
                    </Text>
                    <Text style={styles.viewsDate}>
                        {youtubeApi.formatViews(item.views || 0)} views • {item.uploadedDate}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

            <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                <TouchableOpacity
                    style={[styles.logoRow, { marginBottom: 0 }]}
                    activeOpacity={0.7}
                    onPress={() => onRefresh()}
                >
                    <Image
                        source={require('../../assets/icon.png')}
                        style={{ width: 32, height: 32, borderRadius: 6 }}
                        resizeMode="contain"
                    />
                    <Text style={styles.logoText}>ZyTube</Text>
                </TouchableOpacity>

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

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Đang tải...</Text>
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
                        scrollOffset.current = e.nativeEvent.contentOffset.y;
                    }}
                    scrollEventThrottle={16}
                    ListFooterComponent={
                        loading && videos.length > 0 ? (
                            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 20 }} />
                        ) : <View style={{ height: 20 }} />
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
        paddingHorizontal: SPACING.m,
        paddingBottom: SPACING.xxl,
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
        lineHeight: 20,
    },
    channelName: {
        fontSize: FONTS.sizes.s,
        color: COLORS.textSecondary,
        marginTop: 4,
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
