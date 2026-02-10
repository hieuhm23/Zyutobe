import React, { useRef, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';
import { VideoItem } from '../services/pipedApi';
import youtubeApi from '../services/youtubeApi';
import pipedApi from '../services/pipedApi';

// Placeholder blurhash for fast loading (gray gradient)
const THUMBNAIL_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';
const AVATAR_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

interface VideoCardProps {
    video: VideoItem;
    onPress: (video: VideoItem) => void;
    onPressChannel?: (channelId: string) => void;
    showAvatar?: boolean;
}

const VideoCard = memo(({ video, onPress, onPressChannel, showAvatar = true }: VideoCardProps) => {
    // Animation values
    const scaleAnim = useRef(new Animated.Value(1)).current;

    // Extract channel ID logic if needed, or pass full object
    const handleChannelPress = () => {
        if (onPressChannel && video.uploaderUrl) {
            onPressChannel(video.uploaderUrl.split('/').pop() || video.uploaderUrl);
        }
    };

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.97,
            useNativeDriver: true,
            tension: 150,
            friction: 10,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 150,
            friction: 10,
        }).start();
    };

    const handlePress = () => {
        onPress(video);
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ scale: scaleAnim }],
                },
            ]}
        >
            <Pressable
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                accessibilityLabel={`Video: ${video.title}, bởi ${video.uploaderName}`}
                accessibilityRole="button"
            >
                {/* Thumbnail Section - Optimized Caching */}
                <View style={styles.thumbnailContainer}>
                    <Image
                        source={{ uri: video.thumbnail }}
                        style={styles.thumbnail}
                        contentFit="cover"
                        transition={150}
                        placeholder={THUMBNAIL_BLURHASH}
                        cachePolicy="memory-disk"
                        recyclingKey={video.url}
                    />
                    <View style={styles.durationBadge}>
                        <Text style={styles.durationText}>
                            {youtubeApi.formatDuration(Number(video.duration) || 0)}
                        </Text>
                    </View>
                </View>

                {/* Info Section */}
                <View style={styles.infoContainer}>
                    {showAvatar && (
                        <TouchableOpacity
                            onPress={handleChannelPress}
                            accessibilityLabel={`Kênh ${video.uploaderName}`}
                        >
                            <Image
                                source={{ uri: video.uploaderAvatar || 'https://via.placeholder.com/40' }}
                                style={styles.avatar}
                                contentFit="cover"
                                transition={100}
                                placeholder={AVATAR_BLURHASH}
                                cachePolicy="memory-disk"
                                recyclingKey={video.uploaderUrl}
                            />
                        </TouchableOpacity>
                    )}
                    <View style={styles.textContainer}>
                        <Text style={styles.title} numberOfLines={2}>
                            {video.title}
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            <TouchableOpacity onPress={handleChannelPress}>
                                <Text style={[styles.meta, { color: COLORS.textPrimary, fontWeight: '500' }]}>
                                    {video.uploaderName}
                                </Text>
                            </TouchableOpacity>
                            <Text style={styles.meta}>
                                {' • '}{pipedApi.formatViews(video.views || 0)} • {video.uploadedDate}
                            </Text>
                        </View>
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    );
}, (prevProps, nextProps) => {
    // Custom comparison for memo - only re-render if video URL changes
    return prevProps.video.url === nextProps.video.url;
});

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.l,
        backgroundColor: 'transparent',
        borderRadius: RADIUS.m,
    },
    thumbnailContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: RADIUS.m,
        overflow: 'hidden',
        position: 'relative',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    durationBadge: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    durationText: {
        color: COLORS.textPrimary,
        fontSize: 11,
        fontWeight: 'bold',
    },
    infoContainer: {
        flexDirection: 'row',
        padding: SPACING.s,
        paddingTop: SPACING.m,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: SPACING.m,
        backgroundColor: COLORS.surfaceLight,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 20,
        marginBottom: 4,
    },
    meta: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
});

export default VideoCard;
