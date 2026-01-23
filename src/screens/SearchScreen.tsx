import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Keyboard,
    StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import VideoSkeleton from '../components/VideoSkeleton';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';
import pipedApi, { VideoItem } from '../services/pipedApi';
import youtubeApi from '../services/youtubeApi';

import { usePlayer } from '../context/PlayerContext';

const SearchScreen = ({ route, navigation }: any) => {
    const { query: initialQuery } = route.params || {};
    const insets = useSafeAreaInsets();
    const { playVideo } = usePlayer();

    const [searchQuery, setSearchQuery] = useState(initialQuery || '');
    const [results, setResults] = useState<VideoItem[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeFilter, setActiveFilter] = useState<string>('videos');
    const [nextPage, setNextPage] = useState<string | null>(null);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [trendingKeywords] = useState<string[]>([
        'động bổn máy thay',
        'nhạc tết 2026',
        'phim hành động',
        'v-pop hot',
        'game livestream',
        'tin tức mới nhất',
        'hướng dẫn nấu ăn',
        'review phim',
    ]);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const history = await AsyncStorage.getItem('search_history');
            if (history) setSearchHistory(JSON.parse(history));
        } catch (e) {
            console.log('Error loading history:', e);
        }
    };

    const addToHistory = async (query: string) => {
        try {
            const newHistory = [query, ...searchHistory.filter(i => i !== query)].slice(0, 10);
            setSearchHistory(newHistory);
            await AsyncStorage.setItem('search_history', JSON.stringify(newHistory));
        } catch (e) {
            console.log('Error saving history:', e);
        }
    };

    const removeFromHistory = async (query: string) => {
        try {
            const newHistory = searchHistory.filter(i => i !== query);
            setSearchHistory(newHistory);
            await AsyncStorage.setItem('search_history', JSON.stringify(newHistory));
        } catch (e) {
            console.log('Error removing history:', e);
        }
    };

    useEffect(() => {
        if (initialQuery) {
            performSearch(initialQuery);
        }
    }, [initialQuery]);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setResults([]);
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const timer = setTimeout(async () => {
            if (searchQuery.length > 1) {
                try {
                    const sug = await pipedApi.getSuggestions(searchQuery);
                    setSuggestions(sug);
                    setShowSuggestions(true);
                } catch (error) {
                    console.error('Error getting suggestions:', error);
                }
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const performSearch = async (query: string, filter: string = activeFilter) => {
        if (!query.trim()) return;

        addToHistory(query);
        Keyboard.dismiss();
        setShowSuggestions(false);
        setLoading(true);
        setResults([]);

        try {
            let items: VideoItem[] = [];
            let token: string | null = null;

            try {
                // Ưu tiên YouTube API nếu có
                const ytData = await youtubeApi.search(query, filter);
                items = ytData.items || [];
                token = ytData.nextPageToken || null;
            } catch (e) {
                console.log('YouTube Search Error, fallback to Piped:', e);
                const pipedData = await pipedApi.search(query);
                items = pipedData;
            }

            setResults(items);
            setNextPage(token);
        } catch (error) {
            console.error('Error searching:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSuggestionPress = (suggestion: string) => {
        setSearchQuery(suggestion);
        performSearch(suggestion);
    };

    const handleVideoPress = (video: VideoItem) => {
        playVideo(video);
    };

    const handleLoadMore = async () => {
        if (loading || loadingMore || !nextPage || !searchQuery.trim()) return;

        setLoadingMore(true);
        try {
            const ytData = await youtubeApi.searchNextPage(searchQuery, nextPage, activeFilter);
            const items = ytData.items || [];
            const token = ytData.nextPageToken || null;

            if (items.length > 0) {
                setResults(prev => [...prev, ...items]);
                setNextPage(token);
            } else {
                setNextPage(null);
            }
        } catch (error) {
            console.error("Load more error:", error);
        } finally {
            setLoadingMore(false);
        }
    };

    const handleFilterChange = (filter: string) => {
        setActiveFilter(filter);
        if (searchQuery.trim()) {
            performSearch(searchQuery, filter);
        }
    };

    const renderFilter = (filter: string, label: string) => (
        <TouchableOpacity
            style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
            onPress={() => handleFilterChange(filter)}
        >
            <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    const renderVideoCard = ({ item }: { item: VideoItem }) => {
        const isChannel = item.type === 'channel';
        const isPlaylist = item.type === 'playlist';

        return (
            <TouchableOpacity
                style={[styles.videoCard, isChannel && { alignItems: 'center', flexDirection: 'row', paddingHorizontal: 10 }]}
                onPress={() => handleVideoPress(item)}
                activeOpacity={0.8}
            >
                {/* Thumbnail */}
                <View style={isChannel ? { width: 80, height: 80, borderRadius: 40, overflow: 'hidden', marginRight: 15 } : styles.thumbnailContainer}>
                    <Image
                        source={{ uri: item.thumbnail }}
                        style={isChannel ? { width: '100%', height: '100%' } : styles.thumbnail}
                        contentFit="cover"
                        transition={500}
                    />
                    {!isChannel && !isPlaylist && (
                        <View style={styles.durationBadge}>
                            <Text style={styles.durationText}>
                                {youtubeApi.formatDuration(Number(item.duration) || 0)}
                            </Text>
                        </View>
                    )}
                    {isPlaylist && (
                        <View style={[styles.durationBadge, { right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: 0 }]}>
                            <Text style={styles.durationText}>PLAYLIST</Text>
                        </View>
                    )}
                </View>

                {/* Info */}
                <View style={[styles.videoInfo, isChannel && { marginTop: 0, flex: 1, flexDirection: 'column', alignItems: 'flex-start' }]}>
                    {!isChannel && (
                        <Image
                            source={{ uri: item.uploaderAvatar || 'https://via.placeholder.com/40' }}
                            style={styles.channelAvatar}
                            contentFit="cover"
                            transition={500}
                        />
                    )}

                    <View style={styles.textContainer}>
                        <Text style={styles.videoTitle} numberOfLines={2}>
                            {item.title}
                        </Text>
                        <Text style={styles.videoMeta}>
                            {isChannel
                                ? `@${item.title} • Đăng ký`
                                : `${item.uploaderName} • ${!isPlaylist ? pipedApi.formatViews(item.views || 0) : 'Playlist'} • ${item.uploadedDate}`
                            }
                        </Text>
                    </View>

                    {!isChannel && (
                        <TouchableOpacity style={{ padding: 5, marginTop: -5 }}>
                            <Ionicons name="ellipsis-vertical" size={16} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    )}

                    {isChannel && (
                        <TouchableOpacity style={{ marginTop: 5 }}>
                            <Text style={{ color: COLORS.primary, fontWeight: 'bold', fontSize: 13 }}>ĐĂNG KÝ</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>

                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={COLORS.textTertiary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm..."
                        placeholderTextColor={COLORS.textTertiary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={() => performSearch(searchQuery)}
                        returnKeyType="search"
                        autoFocus
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color={COLORS.textTertiary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.filterRow}>
                {renderFilter('videos', 'Video')}
                {renderFilter('music_songs', 'Nhạc')}
                {renderFilter('channels', 'Kênh')}
                {renderFilter('playlists', 'Playlist')}
            </View>

            {showSuggestions && suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                    {suggestions.map((sug, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.suggestionItem}
                            onPress={() => handleSuggestionPress(sug)}
                        >
                            <Ionicons name="search" size={18} color={COLORS.textTertiary} />
                            <Text style={styles.suggestionText}>{sug}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Search History */}
            {!loading && results.length === 0 && searchQuery.length === 0 && searchHistory.length > 0 && (
                <View style={{ marginTop: SPACING.m }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: SPACING.m }}>
                        <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold', fontSize: 16 }}>Lịch sử tìm kiếm</Text>
                        <TouchableOpacity onPress={() => { setSearchHistory([]); AsyncStorage.removeItem('search_history'); }}>
                            <Text style={{ color: COLORS.textTertiary, fontSize: 12 }}>Xóa tất cả</Text>
                        </TouchableOpacity>
                    </View>
                    {searchHistory.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: SPACING.m,
                                paddingVertical: 12,
                                borderBottomWidth: 1,
                                borderBottomColor: COLORS.border
                            }}
                            onPress={() => { setSearchQuery(item); performSearch(item); }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                <Ionicons name="time-outline" size={20} color={COLORS.textTertiary} />
                                <Text style={{ color: COLORS.textPrimary, fontSize: 16, marginLeft: SPACING.m }} numberOfLines={1}>{item}</Text>
                            </View>
                            <TouchableOpacity onPress={() => removeFromHistory(item)} style={{ padding: 4 }}>
                                <Ionicons name="close" size={20} color={COLORS.textTertiary} />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Trending Keywords */}
            {!loading && results.length === 0 && searchQuery.length === 0 && (
                <View style={{ marginTop: SPACING.l, paddingHorizontal: SPACING.m }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <Ionicons name="trending-up" size={20} color={COLORS.primary} />
                        <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold', fontSize: 16, marginLeft: 8 }}>Xu hướng tìm kiếm</Text>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        {trendingKeywords.map((keyword, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => { setSearchQuery(keyword); performSearch(keyword); }}
                                style={{
                                    backgroundColor: COLORS.surface,
                                    paddingHorizontal: 14,
                                    paddingVertical: 10,
                                    borderRadius: 20,
                                    marginRight: 8,
                                    marginBottom: 10,
                                    borderWidth: 1,
                                    borderColor: COLORS.border
                                }}
                            >
                                <Text style={{ color: COLORS.textPrimary, fontSize: 13 }}>{keyword}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {loading ? (
                <View style={{ paddingTop: 10 }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <VideoSkeleton key={i} />
                    ))}
                </View>
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={(item, index) => item.url + index}
                    renderItem={renderVideoCard}
                    contentContainerStyle={styles.resultsList}
                    showsVerticalScrollIndicator={false}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                        loadingMore ? (
                            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 20 }} />
                        ) : <View style={{ height: 120 }} />
                    }
                    ListEmptyComponent={
                        !loading && searchQuery ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="search" size={60} color={COLORS.textTertiary} />
                                <Text style={styles.emptyText}>Không tìm thấy kết quả</Text>
                                <Text style={styles.emptySubtext}>Thử tìm kiếm từ khóa khác</Text>
                            </View>
                        ) : null
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.s,
    },
    backButton: {
        padding: SPACING.s,
        marginRight: SPACING.s,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.l,
        paddingHorizontal: SPACING.m,
        height: 44,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchInput: {
        flex: 1,
        marginLeft: SPACING.s,
        fontSize: FONTS.sizes.m,
        color: COLORS.textPrimary,
    },
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.s,
    },
    filterChip: {
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.s,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginRight: SPACING.s,
    },
    filterChipActive: {
        backgroundColor: COLORS.primary + '20',
        borderColor: COLORS.primary,
    },
    filterText: {
        fontSize: FONTS.sizes.s,
        color: COLORS.textSecondary,
    },
    filterTextActive: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    suggestionsContainer: {
        backgroundColor: COLORS.surface,
        marginHorizontal: SPACING.m,
        borderRadius: RADIUS.m,
        marginBottom: SPACING.m,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    suggestionText: {
        flex: 1,
        fontSize: FONTS.sizes.m,
        color: COLORS.textPrimary,
        marginLeft: SPACING.m,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: SPACING.m,
        color: COLORS.textSecondary,
    },
    resultsList: {
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
    videoMeta: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.textSecondary,
        marginTop: 4,
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
        fontWeight: '500',
    },
    emptySubtext: {
        marginTop: SPACING.s,
        color: COLORS.textTertiary,
        fontSize: FONTS.sizes.s,
    },
});

export default SearchScreen;
