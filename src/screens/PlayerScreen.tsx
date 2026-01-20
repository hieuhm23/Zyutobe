import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    ActivityIndicator,
    Dimensions,
    Image,
    Alert,
    Linking,
} from 'react-native';
import { Video, ResizeMode, Audio, AVPlaybackStatus, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';
import pipedApi, { StreamInfo, VideoItem } from '../services/pipedApi';
import { useLibrary } from '../hooks/useLibrary';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_HEIGHT = (SCREEN_WIDTH * 9) / 16;

const PlayerScreen = ({ route, navigation }: any) => {
    const { videoId, video } = route.params;
    const insets = useSafeAreaInsets();
    const videoRef = useRef<Video>(null);
    const { addToHistory, toggleFavorite, isFavorite: checkIsFav } = useLibrary();

    const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFav, setIsFav] = useState(false);
    const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
    const [audioMode, setAudioMode] = useState(false);

    useEffect(() => {
        loadStreamInfo();
        setupAudio();

        // Add to history and check favorite status
        if (video) {
            addToHistory(video);
            setIsFav(checkIsFav(videoId));
        }

        return () => {
            if (videoRef.current) {
                videoRef.current.pauseAsync();
            }
        };
    }, [videoId]);

    const setupAudio = async () => {
        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
                interruptionModeIOS: InterruptionModeIOS.DoNotMix,
                shouldDuckAndroid: true,
                interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
                playThroughEarpieceAndroid: false
            });
        } catch (e) {
            console.warn("Audio setup failed", e);
        }
    };

    const loadStreamInfo = async () => {
        setLoading(true);
        try {
            const info = await pipedApi.getStream(videoId);
            setStreamInfo(info);
        } catch (error) {
            console.error('Error loading stream:', error);
            Alert.alert('Lỗi', 'Không thể tải video. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const handleRelatedVideoPress = (relatedVideo: VideoItem) => {
        setStreamInfo(null);
        setStatus(null);
        const newVideoId = relatedVideo.url?.replace('/watch?v=', '') || '';
        navigation.replace('Player', { videoId: newVideoId, video: relatedVideo });
    };

    const handleToggleFavorite = async () => {
        if (video || streamInfo) {
            const videoToSave = video || {
                title: streamInfo?.title,
                thumbnail: streamInfo?.thumbnailUrl,
                url: `/watch?v=${videoId}`,
                uploaderName: streamInfo?.uploader,
                uploaderAvatar: streamInfo?.uploaderAvatar,
                views: streamInfo?.views,
                uploadedDate: streamInfo?.uploadDate,
                duration: 0
            };
            const newStatus = await toggleFavorite(videoToSave as VideoItem);
            setIsFav(newStatus);
        }
    };

    const getStreamUrl = () => {
        if (!streamInfo) return null;

        if (audioMode) {
            const audioStream = streamInfo.audioStreams?.find(s => s.mimeType === 'audio/mp4') || streamInfo.audioStreams?.[0];
            return audioStream?.url;
        }

        // Sử dụng hàm chuẩn từ API service để đảm bảo logic ưu tiên HLS
        return pipedApi.getVideoUrl(streamInfo);
    };

    const playUrl = getStreamUrl();

    // Debug URL để xem nó lấy link gì
    console.log('Playing URL:', playUrl);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

            <View style={styles.playerContainer}>
                {loading ? (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingText}>Đang tải video...</Text>
                    </View>
                ) : playUrl ? (
                    <View style={{ flex: 1 }}>
                        <Video
                            ref={videoRef}
                            style={styles.thumbnail}
                            source={{ uri: playUrl }}
                            useNativeControls={true}
                            resizeMode={ResizeMode.CONTAIN}
                            isLooping={false}
                            shouldPlay={true}
                            onPlaybackStatusUpdate={status => setStatus(() => status)}
                            posterSource={{ uri: streamInfo?.thumbnailUrl || video?.thumbnail }}
                            posterStyle={{ resizeMode: 'cover' }}
                            usePoster={true}
                            onError={(error) => {
                                console.log("Video Error:", error);
                                Alert.alert("Lỗi Video", "Không thể phát video này. Code: " + error);
                            }}
                            onLoad={() => console.log("Video Loaded Successfully")}
                        />
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={[styles.backButton, { position: 'absolute', top: 10, left: 10, zIndex: 999 }]}
                        >
                            <Ionicons name="chevron-down" size={28} color="white" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.loadingOverlay}>
                        <Text style={styles.loadingText}>Không tìm thấy nguồn phát</Text>
                        <TouchableOpacity onPress={navigation.goBack} style={{ marginTop: 20 }}>
                            <Text style={{ color: COLORS.primary }}>Quay lại</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.videoTitle} numberOfLines={2}>
                    {streamInfo?.title || video?.title}
                </Text>

                <View style={styles.statsRow}>
                    <Text style={styles.statsText}>
                        {pipedApi.formatViews(streamInfo?.views || video?.views || 0)} lượt xem
                    </Text>
                    <Text style={styles.statsText}>•</Text>
                    <Text style={styles.statsText}>
                        {streamInfo?.uploadDate || video?.uploadedDate}
                    </Text>
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="thumbs-up-outline" size={22} color={COLORS.textPrimary} />
                        <Text style={styles.actionText}>
                            {pipedApi.formatViews(streamInfo?.likes || 0)}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="thumbs-down-outline" size={22} color={COLORS.textPrimary} />
                        <Text style={styles.actionText}>Dislike</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="share-social-outline" size={22} color={COLORS.textPrimary} />
                        <Text style={styles.actionText}>Chia sẻ</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleToggleFavorite}
                    >
                        <Ionicons
                            name={isFav ? 'heart' : 'heart-outline'}
                            size={22}
                            color={isFav ? COLORS.error : COLORS.textPrimary}
                        />
                        <Text style={styles.actionText}>{isFav ? 'Đã lưu' : 'Lưu'}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.channelRow}>
                    <Image
                        source={{ uri: streamInfo?.uploaderAvatar || video?.uploaderAvatar }}
                        style={styles.channelAvatar}
                    />
                    <View style={styles.channelInfo}>
                        <Text style={styles.channelName}>
                            {streamInfo?.uploader || video?.uploaderName}
                        </Text>
                        <Text style={styles.subscriberCount}>
                            {pipedApi.formatViews(streamInfo?.uploaderSubscriberCount || 0)} subscribers
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.subscribeButton}>
                        <Text style={styles.subscribeText}>Đăng ký</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>Video liên quan</Text>
                {streamInfo?.relatedStreams?.slice(0, 10).map((related, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.relatedCard}
                        onPress={() => handleRelatedVideoPress(related)}
                    >
                        <Image
                            source={{ uri: related.thumbnail }}
                            style={styles.relatedThumbnail}
                        />
                        <View style={styles.relatedInfo}>
                            <Text style={styles.relatedTitle} numberOfLines={2}>
                                {related.title}
                            </Text>
                            <Text style={styles.relatedChannel} numberOfLines={1}>
                                {related.uploaderName}
                            </Text>
                            <Text style={styles.relatedViews}>
                                {pipedApi.formatViews(related.views)} views
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    playerContainer: {
        width: SCREEN_WIDTH,
        height: VIDEO_HEIGHT,
        backgroundColor: '#000',
    },
    loadingOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    loadingText: {
        marginTop: SPACING.m,
        color: COLORS.textSecondary,
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    backButton: {
        padding: SPACING.s,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: RADIUS.full,
    },
    content: {
        flex: 1,
        padding: SPACING.m,
    },
    videoTitle: {
        fontSize: FONTS.sizes.l,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginTop: SPACING.s,
        lineHeight: 24,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SPACING.s,
    },
    statsText: {
        fontSize: FONTS.sizes.s,
        color: COLORS.textSecondary,
        marginRight: SPACING.s,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        marginTop: SPACING.s,
    },
    actionButton: {
        alignItems: 'center',
    },
    actionText: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
    },
    channelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    channelAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.surface,
    },
    channelInfo: {
        flex: 1,
        marginLeft: SPACING.m,
    },
    channelName: {
        fontSize: FONTS.sizes.m,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    subscriberCount: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    subscribeButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.s,
        borderRadius: RADIUS.full,
    },
    subscribeText: {
        color: COLORS.background,
        fontWeight: 'bold',
        fontSize: FONTS.sizes.s,
    },
    sectionTitle: {
        fontSize: FONTS.sizes.l,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginTop: SPACING.l,
        marginBottom: SPACING.m,
    },
    relatedCard: {
        flexDirection: 'row',
        marginBottom: SPACING.m,
    },
    relatedThumbnail: {
        width: 160,
        height: 90,
        borderRadius: RADIUS.s,
        backgroundColor: COLORS.surface,
    },
    relatedInfo: {
        flex: 1,
        marginLeft: SPACING.m,
        justifyContent: 'center',
    },
    relatedTitle: {
        fontSize: FONTS.sizes.s,
        fontWeight: '500',
        color: COLORS.textPrimary,
        lineHeight: 18,
    },
    relatedChannel: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    relatedViews: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.textTertiary,
        marginTop: 2,
    },
});

export default PlayerScreen;
