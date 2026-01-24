import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';
import { VideoItem } from '../services/pipedApi';
import youtubeApi from '../services/youtubeApi';
import pipedApi from '../services/pipedApi';

interface VideoCardProps {
    video: VideoItem;
    onPress: (video: VideoItem) => void;
    onPressChannel?: (channelId: string) => void;
    showAvatar?: boolean;
}

const VideoCard = ({ video, onPress, onPressChannel, showAvatar = true }: VideoCardProps) => {

    // Extract channel ID logic if needed, or pass full object
    const handleChannelPress = () => {
        if (onPressChannel && video.uploaderUrl) {
            onPressChannel(video.uploaderUrl.split('/').pop() || video.uploaderUrl);
        }
    };

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => onPress(video)}
            activeOpacity={0.8}
        >
            {/* Thumbnail Section */}
            <View style={styles.thumbnailContainer}>
                <Image
                    source={{ uri: video.thumbnail }}
                    style={styles.thumbnail}
                    contentFit="cover"
                    transition={200}
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
                    <TouchableOpacity onPress={handleChannelPress}>
                        <Image
                            source={{ uri: video.uploaderAvatar || 'https://via.placeholder.com/40' }}
                            style={styles.avatar}
                            contentFit="cover"
                            transition={200}
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
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.l,
        backgroundColor: 'transparent',
    },
    thumbnailContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: COLORS.surfaceLight,
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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    durationText: {
        color: COLORS.textPrimary,
        fontSize: 10,
        fontWeight: 'bold',
    },
    infoContainer: {
        flexDirection: 'row',
        padding: SPACING.s,
        paddingTop: SPACING.m,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: SPACING.s,
        backgroundColor: COLORS.surfaceLight,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 20,
        marginBottom: 2,
    },
    meta: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
});

export default VideoCard;
