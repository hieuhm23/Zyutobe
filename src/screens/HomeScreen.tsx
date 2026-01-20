import React, { useState, useEffect } from 'react';
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

type TabType = 'music' | 'video' | 'trending' | 'recent';

const HomeScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<TabType>('trending');
    const [searchQuery, setSearchQuery] = useState('');
    const [videos, setVideos] = useState<VideoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadContent();
    }, [activeTab]);

    const loadContent = async () => {
        setLoading(true);
        try {
            let data: VideoItem[] = [];

            switch (activeTab) {
                case 'trending':
                    data = await pipedApi.getTrending('VN');
                    break;
                case 'music':
                    const musicResult = await pipedApi.search('nhạc việt nam hot 2024', 'music_songs');
                    data = musicResult.items || [];
                    break;
                case 'video':
                    const videoResult = await pipedApi.search('video hot việt nam', 'videos');
                    data = videoResult.items || [];
                    break;
                default:
                    data = await pipedApi.getTrending('VN');
            }

            setVideos(data);
        } catch (error) {
            console.error('Error loading content:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadContent();
    };

    const handleSearch = () => {
        if (searchQuery.trim()) {
            navigation.navigate('Search', { query: searchQuery });
        }
    };

    const handleVideoPress = (video: VideoItem) => {
        const videoId = video.url?.replace('/watch?v=', '') || '';
        navigation.navigate('Player', { videoId, video });
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
                        {pipedApi.formatDuration(item.duration)}
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
                        {pipedApi.formatViews(item.views)} views • {item.uploadedDate}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

            <View style={styles.header}>
                <View style={styles.logoRow}>
                    <Image
                        source={require('../../assets/icon.png')}
                        style={{ width: 32, height: 32, borderRadius: 6 }}
                        resizeMode="contain"
                    />
                    <Text style={styles.logoText}>ZyTube</Text>
                </View>

                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={COLORS.textTertiary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm video, nhạc..."
                        placeholderTextColor={COLORS.textTertiary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                    />
                </View>
            </View>

            <View style={styles.tabBar}>
                {renderTab('music', 'Nhạc', 'musical-notes')}
                {renderTab('video', 'Video', 'videocam')}
                {renderTab('trending', 'Xu hướng', 'flame')}
                {renderTab('recent', 'Gần đây', 'time')}
            </View>

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            ) : (
                <FlatList
                    data={videos}
                    keyExtractor={(item, index) => item.url + index}
                    renderItem={renderVideoCard}
                    contentContainerStyle={styles.videoList}
                    showsVerticalScrollIndicator={false}
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
