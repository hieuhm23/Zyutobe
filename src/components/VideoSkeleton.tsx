import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Shimmer component with opacity pulse animation
const ShimmerEffect = ({ style }: { style?: any }) => {
    const opacity = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.8,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.4,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();

        return () => pulse.stop();
    }, []);

    return (
        <Animated.View style={[styles.shimmerContainer, style, { opacity }]} />
    );
};

const VideoSkeleton = () => {
    return (
        <View style={styles.container}>
            {/* Thumbnail Skeleton with Shimmer */}
            <View style={styles.thumbnailWrapper}>
                <ShimmerEffect style={styles.thumbnail} />
                {/* Duration badge placeholder */}
                <View style={styles.durationBadge}>
                    <ShimmerEffect style={styles.durationShimmer} />
                </View>
            </View>

            <View style={styles.infoContainer}>
                {/* Avatar Skeleton */}
                <ShimmerEffect style={styles.avatar} />

                <View style={styles.textContainer}>
                    {/* Title Line 1 */}
                    <ShimmerEffect style={[styles.titleLine, { width: '95%' }]} />
                    {/* Title Line 2 */}
                    <ShimmerEffect style={[styles.titleLine, { width: '70%', marginTop: 8 }]} />
                    {/* Meta Info */}
                    <ShimmerEffect style={[styles.metaLine, { width: '50%' }]} />
                </View>
            </View>
        </View>
    );
};

// Multiple skeletons for list loading
export const VideoSkeletonList = ({ count = 3 }: { count?: number }) => {
    return (
        <View>
            {Array.from({ length: count }).map((_, index) => (
                <VideoSkeleton key={index} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.l,
        paddingHorizontal: SPACING.m,
    },
    thumbnailWrapper: {
        position: 'relative',
        marginBottom: SPACING.m,
    },
    thumbnail: {
        width: '100%',
        aspectRatio: 16 / 9,
        borderRadius: RADIUS.m,
    },
    durationBadge: {
        position: 'absolute',
        bottom: 8,
        right: 8,
    },
    durationShimmer: {
        width: 45,
        height: 18,
        borderRadius: 4,
    },
    infoContainer: {
        flexDirection: 'row',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: SPACING.m,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    titleLine: {
        height: 14,
        borderRadius: 6,
    },
    metaLine: {
        height: 12,
        borderRadius: 4,
        marginTop: 10,
    },
    // Shimmer styles
    shimmerContainer: {
        backgroundColor: COLORS.surfaceLight,
    },
});

export default VideoSkeleton;
