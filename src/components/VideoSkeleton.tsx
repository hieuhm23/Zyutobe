import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

const { width } = Dimensions.get('window');

const VideoSkeleton = () => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();

        return () => pulse.stop();
    }, []);

    return (
        <View style={styles.container}>
            {/* Thumbnail Skeleton */}
            <Animated.View style={[styles.thumbnail, { opacity }]} />

            <View style={styles.infoContainer}>
                {/* Avatar Skeleton */}
                <Animated.View style={[styles.avatar, { opacity }]} />

                <View style={styles.textContainer}>
                    {/* Title Line 1 */}
                    <Animated.View style={[styles.titleLine, { opacity, width: '90%' }]} />
                    {/* Title Line 2 */}
                    <Animated.View style={[styles.titleLine, { opacity, width: '60%', marginTop: 6 }]} />
                    {/* Meta Info */}
                    <Animated.View style={[styles.metaLine, { opacity }]} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.l,
        paddingHorizontal: SPACING.m,
    },
    thumbnail: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: RADIUS.m,
        marginBottom: SPACING.m,
    },
    infoContainer: {
        flexDirection: 'row',
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.surfaceLight,
        marginRight: SPACING.m,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    titleLine: {
        height: 14,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 4,
    },
    metaLine: {
        height: 10,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 4,
        width: '40%',
        marginTop: 8,
    },
});

export default VideoSkeleton;
