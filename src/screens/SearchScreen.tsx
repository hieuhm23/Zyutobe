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
    Keyboard,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';
import pipedApi, { VideoItem } from '../services/pipedApi';

const SearchScreen = ({ route, navigation }: any) => {
    const { query: initialQuery } = route.params || {};
    const insets = useSafeAreaInsets();

    const [searchQuery, setSearchQuery] = useState(initialQuery || '');
    const [results, setResults] = useState<VideoItem[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeFilter, setActiveFilter] = useState<string>('videos');
    const [nextPage, setNextPage] = useState<string | null>(null);

    useEffect(() => {
        if (initialQuery) {
            performSearch(initialQuery);
        }
    }, [initialQuery]);

    useEffect(() => {
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

        Keyboard.dismiss();
        setShowSuggestions(false);
        setLoading(true);
        setResults([]);

        try {
            const data = await pipedApi.search(query, filter);
            setResults(data.items || []);
            setNextPage(data.nextpage);
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
        const videoId = video.url?.replace('/watch?v=', '') || '';
        navigation.navigate('Player', { videoId, video });
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
                <Text style={styles.videoTitle} numberOfLines={2}>
                    {item.title}
                </Text>
                <View style={styles.videoMeta}>
                    <Text style={styles.channelName} numberOfLines={1}>
                        {item.uploaderName}
                    </Text>
                    {item.uploaderVerified && (
                        <MaterialCommunityIcons
                            name="check-decagram"
                            size={12}
                            color={COLORS.primary}
                        />
                    )}
                </View>
                <Text style={styles.viewsText}>
                    {pipedApi.formatViews(item.views)} views • {item.uploadedDate}
                </Text>
            </View>
        </TouchableOpacity>
    );

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

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Đang tìm kiếm...</Text>
                </View>
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={(item, index) => item.url + index}
                    renderItem={renderVideoCard}
                    contentContainerStyle={styles.resultsList}
                    showsVerticalScrollIndicator={false}
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
        flexDirection: 'row',
        marginBottom: SPACING.m,
    },
    thumbnailContainer: {
        position: 'relative',
        borderRadius: RADIUS.s,
        overflow: 'hidden',
    },
    thumbnail: {
        width: 160,
        height: 90,
        backgroundColor: COLORS.surface,
    },
    durationBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    durationText: {
        color: COLORS.textPrimary,
        fontSize: FONTS.sizes.xs,
        fontWeight: '500',
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
    videoMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    channelName: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.textSecondary,
        marginRight: 4,
    },
    viewsText: {
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
        fontWeight: '500',
    },
    emptySubtext: {
        marginTop: SPACING.s,
        color: COLORS.textTertiary,
        fontSize: FONTS.sizes.s,
    },
});

export default SearchScreen;
