import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Image,
    StatusBar,
    Animated,
    PanResponder,
    ScrollView,
    FlatList,
    Modal
} from 'react-native';
import { Video, ResizeMode, Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import pipedApi from '../services/pipedApi';
import youtubeApi from '../services/youtubeApi';
import { useLibrary } from '../hooks/useLibrary';
import { usePlayer } from '../context/PlayerContext';
import { useSettings } from '../context/SettingsContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const VIDEO_HEIGHT = (SCREEN_WIDTH * 9) / 16;
const MINI_HEIGHT = 60;
const TAB_BAR_HEIGHT = 60;

const GlobalPlayer = () => {
    // Hooks
    const { video, videoId, isMinimized, playVideo, minimizePlayer, maximizePlayer, closePlayer } = usePlayer();
    const insets = useSafeAreaInsets();
    const { addToHistory, isFavorite: checkIsFav } = useLibrary();
    const { autoPlay, backgroundPlay } = useSettings();

    // Enable Background Play
    useEffect(() => {
        const configAudio = async () => {
            try {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    staysActiveInBackground: backgroundPlay,
                    playsInSilentModeIOS: true,
                    shouldDuckAndroid: true,
                    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
                    interruptionModeIOS: InterruptionModeIOS.DoNotMix,
                });
            } catch (e) { console.log("Audio Config Error", e); }
        };
        configAudio();
    }, [backgroundPlay]);

    // Player Vars
    const videoRef = useRef<Video>(null);
    const [status, setStatus] = useState<any>({});
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [videoHeaders, setVideoHeaders] = useState<Record<string, string> | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [videoReady, setVideoReady] = useState(false);

    // Metadata
    const [meta, setMeta] = useState<any>({});
    // Related Infinite Scroll
    const [relatedVideos, setRelatedVideos] = useState<any[]>([]);
    const [relatedPageToken, setRelatedPageToken] = useState<string | null>(null);
    const [loadingRelated, setLoadingRelated] = useState(false);

    // Video Settings Modal
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const [isLooping, setIsLooping] = useState(false);

    useEffect(() => {
        if (!videoId) return;

        let isMounted = true;
        setLoading(true);
        setError(false);
        setVideoReady(false);
        setVideoUrl(null);
        setVideoHeaders(undefined);
        setMeta(video || {});
        setRelatedVideos([]);
        setRelatedPageToken(null);

        const initPlayer = async () => {
            try {
                console.log("GLOBAL PLAYER INIT:", videoId);
                const stream = await pipedApi.getBestStreamUrl(videoId);

                if (!isMounted) return;

                if (stream && stream.url) {
                    setVideoUrl(stream.url);
                    if (stream.headers) setVideoHeaders(stream.headers);
                } else {
                    setError(true);
                }

                const info = await youtubeApi.getStream(videoId);
                if (isMounted && info) {
                    setMeta((prev: any) => ({ ...prev, ...info }));
                    if (info.relatedStreams) setRelatedVideos(info.relatedStreams);
                    if (info.relatedNextPageToken) setRelatedPageToken(info.relatedNextPageToken);
                }

            } catch (err) {
                console.log("Player Init Error:", err);
                if (isMounted) setError(true);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        addToHistory(video || { url: `/watch?v=${videoId}`, title: videoId } as any);
        initPlayer();

        return () => { isMounted = false; };
    }, [videoId]);

    // Helpers
    const formatTime = (millis: number) => {
        if (!millis) return "00:00";
        const totalSeconds = millis / 1000;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const togglePlay = async () => {
        if (!videoRef.current) return;
        if (status.isPlaying) {
            await videoRef.current.pauseAsync();
        } else {
            await videoRef.current.playAsync();
        }
    };

    const seek = async (amount: number) => {
        if (!videoRef.current || !status.durationMillis) return;
        const newPos = status.positionMillis + (amount * 1000);
        await videoRef.current.setPositionAsync(Math.max(0, Math.min(newPos, status.durationMillis)));
    };

    const toggleFullscreen = async () => {
        if (!videoRef.current) return;
        try {
            await videoRef.current.presentFullscreenPlayer();
        } catch (e) { console.log(e); }
    };

    const loadMoreRelated = async () => {
        if (loadingRelated || !relatedPageToken || !meta.title) return;
        setLoadingRelated(true);
        try {
            const res = await youtubeApi.searchNextPage(meta.title, relatedPageToken);
            if (res.items.length > 0) {
                setRelatedVideos(prev => [...prev, ...res.items]);
                setRelatedPageToken(res.nextPageToken || null);
            } else {
                setRelatedPageToken(null);
            }
        } catch (e) {
            console.log("Load more related error", e);
        } finally {
            setLoadingRelated(false);
        }
    };

    const toggleControls = () => {
        if (isMinimized) {
            maximizePlayer();
        } else {
            setShowControls(!showControls);
        }
    };

    // Custom Slider Logic
    const [isSeeking, setIsSeeking] = useState(false);
    const [sliderWidth, setSliderWidth] = useState(1);
    const [seekDragTime, setSeekDragTime] = useState(0);

    const handleSeekTouch = (e: any) => {
        // Handle both start and move
        const x = e.nativeEvent.locationX;
        const pct = Math.max(0, Math.min(1, x / sliderWidth));
        const time = pct * (status.durationMillis || 0);
        setSeekDragTime(time);
        return time;
    };

    const onSliderTouchStart = (e: any) => {
        setIsSeeking(true);
        handleSeekTouch(e);
    };

    const onSliderTouchMove = (e: any) => {
        if (isSeeking) handleSeekTouch(e);
    };

    const onSliderTouchEnd = async (e: any) => {
        const time = handleSeekTouch(e);
        if (videoRef.current) {
            await videoRef.current.setPositionAsync(time);
        }
        setTimeout(() => setIsSeeking(false), 200);
    };

    const changePlaybackRate = async (rate: number) => {
        setPlaybackRate(rate);
        if (videoRef.current) {
            await videoRef.current.setRateAsync(rate, true);
        }
        setShowSettingsModal(false);
    };

    const toggleLoop = async () => {
        const newValue = !isLooping;
        setIsLooping(newValue);
        if (videoRef.current) {
            await videoRef.current.setIsLoopingAsync(newValue);
        }
    };

    const speedOptions = [
        { label: '0.25x', value: 0.25 },
        { label: '0.5x', value: 0.5 },
        { label: '0.75x', value: 0.75 },
        { label: 'Bình thường', value: 1.0 },
        { label: '1.25x', value: 1.25 },
        { label: '1.5x', value: 1.5 },
        { label: '2x', value: 2.0 },
    ];

    if (!videoId) return null;

    // --- ANIMATIONS & STYLES ---
    // For V1, we use conditional rendering of styles. Animated values for smooth transition can be added later.

    // If Minimized:
    // Container: Position absolute bottom (above tab bar), height 60, width 100%. Background dark.
    // Video: width 100 (approx 16:9 ratio of height), height 60.
    // Content: Row.

    // If Full:
    // Container: Position absolute fill. Background Black.
    // Video: Height VIDEO_HEIGHT, top.

    const containerStyle: any = isMinimized ? {
        position: 'absolute',
        bottom: TAB_BAR_HEIGHT + insets.bottom + 10, // Lift it up above TabBar + Home Indicator
        left: 10,
        right: 10,
        height: MINI_HEIGHT,
        backgroundColor: '#222',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        zIndex: 99999,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    } : {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000',
        zIndex: 99999,
        paddingTop: insets.top
    };

    const videoStyle: any = isMinimized ? {
        width: 106, // 16:9 of 60h
        height: 60,
    } : {
        width: SCREEN_WIDTH,
        height: VIDEO_HEIGHT
    };

    return (
        <>
            <View style={containerStyle}>
                <StatusBar barStyle="light-content" backgroundColor="#000" />

                {/* VIDEO COMPONENT (Persistent) */}
                <TouchableOpacity activeOpacity={1} onPress={toggleControls} style={isMinimized ? { width: 106, height: 60 } : { width: SCREEN_WIDTH, height: VIDEO_HEIGHT }}>
                    {videoUrl && !error ? (
                        <Video
                            ref={videoRef}
                            style={StyleSheet.absoluteFill}
                            source={{ uri: videoUrl, headers: videoHeaders }}
                            resizeMode={isMinimized ? ResizeMode.COVER : ResizeMode.CONTAIN}
                            useNativeControls={false}
                            shouldPlay={true}
                            onPlaybackStatusUpdate={status => {
                                setStatus(status);
                                if (status.isLoaded && status.didJustFinish && !status.isLooping && autoPlay) {
                                    if (relatedVideos.length > 0) {
                                        playVideo(relatedVideos[0]);
                                    }
                                }
                            }}
                            onReadyForDisplay={() => setVideoReady(true)}
                        />
                    ) : null}

                    {/* Visual Placeholder (The "Trick") */}
                    {(!videoReady || loading) && (
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', zIndex: 1 }]}>
                            <Image
                                source={{ uri: video?.thumbnail || meta.thumbnailUrl || meta.thumbnail }}
                                style={[StyleSheet.absoluteFill, { opacity: 0.6 }]}
                                resizeMode="cover"
                            />
                            <ActivityIndicator size="large" color={COLORS.primary} />
                        </View>
                    )}
                </TouchableOpacity>

                {/* MINI PLAYER CONTENT */}
                {isMinimized ? (
                    <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 }} onPress={maximizePlayer}>
                        <View style={{ flex: 1, justifyContent: 'center' }}>
                            <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }} numberOfLines={1}>{meta.title || videoId}</Text>
                            <Text style={{ color: '#aaa', fontSize: 11 }} numberOfLines={1}>{meta.uploaderName}</Text>
                        </View>

                        <TouchableOpacity onPress={togglePlay} style={{ padding: 8 }}>
                            <Ionicons name={status.isPlaying ? "pause" : "play"} size={24} color="#fff" />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={closePlayer} style={{ padding: 8 }}>
                            <Ionicons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                    </TouchableOpacity>
                ) : (
                    /* FULL PLAYER CONTENT */
                    <>
                        {/* Controls Overlay */}
                        {!loading && !error && showControls && (
                            <View style={[{ position: 'absolute', top: insets.top, left: 0, right: 0, height: VIDEO_HEIGHT, zIndex: 10 }]} pointerEvents="box-none">
                                <TouchableOpacity activeOpacity={1} style={{ flex: 1 }} onPress={() => setShowControls(false)}>
                                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }}>

                                        {/* HEADER */}
                                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, zIndex: 2 }}>
                                            <TouchableOpacity onPress={minimizePlayer} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} style={{ padding: 5 }}>
                                                <Ionicons name="chevron-down" size={32} color="#fff" />
                                            </TouchableOpacity>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <TouchableOpacity style={{ padding: 5 }} onPress={() => setShowSettingsModal(true)}>
                                                    <Ionicons name="settings-outline" size={24} color="#fff" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        {/* CENTER */}
                                        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', paddingHorizontal: 50 }}>
                                            <TouchableOpacity onPress={() => seek(-10)}>
                                                <Ionicons name="play-back" size={30} color="#fff" />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={togglePlay}>
                                                <Ionicons name={status.isPlaying ? "pause-circle" : "play-circle"} size={70} color="#fff" />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => seek(10)}>
                                                <Ionicons name="play-forward" size={30} color="#fff" />
                                            </TouchableOpacity>
                                        </View>

                                        {/* BOTTOM */}
                                        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 0, zIndex: 2 }}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, marginBottom: 10 }}>
                                                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '500' }}>
                                                    {formatTime(status.positionMillis)} / {formatTime(status.durationMillis)}
                                                </Text>
                                                <TouchableOpacity onPress={toggleFullscreen} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                                    <Ionicons name="scan-outline" size={22} color="#fff" />
                                                </TouchableOpacity>
                                            </View>
                                            {/* Interactive Custom Slider */}
                                            <View
                                                style={{ height: 40, justifyContent: 'center', marginBottom: -10, zIndex: 100 }}
                                                onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
                                                onTouchStart={onSliderTouchStart}
                                                onTouchMove={onSliderTouchMove}
                                                onTouchEnd={onSliderTouchEnd}
                                            >
                                                {/* Track Background */}
                                                <View style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.3)', width: '100%', borderRadius: 1.5, pointerEvents: 'none' }}>
                                                    {/* Filled Track */}
                                                    <View style={{
                                                        width: `${Math.min(100, ((isSeeking ? seekDragTime : status.positionMillis) / (status.durationMillis || 1)) * 100)}%`,
                                                        height: '100%',
                                                        backgroundColor: COLORS.primary,
                                                        borderRadius: 1.5
                                                    }} />
                                                </View>

                                                {/* Thumb Circle */}
                                                <View style={{
                                                    position: 'absolute',
                                                    left: `${Math.min(100, ((isSeeking ? seekDragTime : status.positionMillis) / (status.durationMillis || 1)) * 100)}%`,
                                                    marginLeft: -7,
                                                    width: 14,
                                                    height: 14,
                                                    borderRadius: 7,
                                                    backgroundColor: COLORS.primary,
                                                    pointerEvents: 'none',
                                                }} />
                                            </View>
                                        </View>

                                    </View>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Details Section (Below Video) */}
                        <View style={{ flex: 1, backgroundColor: '#000' }}>
                            <FlatList
                                data={relatedVideos}
                                keyExtractor={(item, index) => item.url + index}
                                onEndReached={loadMoreRelated}
                                onEndReachedThreshold={0.5}
                                ListFooterComponent={loadingRelated ? <ActivityIndicator color={COLORS.primary} style={{ margin: 20 }} /> : <View style={{ height: 50 }} />}
                                contentContainerStyle={{ paddingBottom: 50 }}
                                ListHeaderComponent={
                                    <View style={{ padding: 15 }}>
                                        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                                            {meta.title}
                                        </Text>
                                        <Text style={{ color: '#aaa', fontSize: 12, marginTop: 5 }}>
                                            {pipedApi.formatViews(meta.views || 0)} views • {meta.uploadedDate}
                                        </Text>

                                        {/* Action Buttons */}
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginTop: 15 }}>
                                            {[
                                                { icon: 'heart-outline', label: 'Like' },
                                                { icon: 'thumbs-down-outline', label: 'Dislike' },
                                                { icon: 'share-social-outline', label: 'Share' },
                                                { icon: 'download-outline', label: 'Download' },
                                                { icon: 'bookmark-outline', label: 'Save' }
                                            ].map((action, idx) => (
                                                <TouchableOpacity key={idx} style={{ alignItems: 'center', marginRight: 25 }}>
                                                    <Ionicons name={action.icon as any} size={24} color="#fff" />
                                                    <Text style={{ color: '#fff', fontSize: 10, marginTop: 4 }}>{action.label}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>

                                        {/* Channel Info */}
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, paddingVertical: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#222' }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                                <Image source={{ uri: meta.uploaderAvatar || 'https://via.placeholder.com/40' }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }} />
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }} numberOfLines={1}>{meta.uploaderName}</Text>
                                                </View>
                                            </View>
                                            <TouchableOpacity style={{ backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 }}>
                                                <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 12 }}>Đăng ký</Text>
                                            </TouchableOpacity>
                                        </View>

                                        {/* Description Teaser */}
                                        <TouchableOpacity style={{ marginTop: 15, backgroundColor: '#1a1a1a', padding: 12, borderRadius: 10 }}>
                                            <Text style={{ color: '#aaa', fontSize: 12 }} numberOfLines={2}>
                                                {meta.description || 'Nhấn để xem mô tả video...'}
                                            </Text>
                                        </TouchableOpacity>

                                        {/* Related Videos Header */}
                                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 20, marginBottom: 10 }}>Next</Text>
                                    </View>
                                }
                                renderItem={({ item }) => (
                                    <TouchableOpacity onPress={() => playVideo(item)} style={{ flexDirection: 'row', marginBottom: 15, paddingHorizontal: 15 }}>
                                        <Image source={{ uri: item.thumbnail }} style={{ width: 120, height: 68, borderRadius: 8, backgroundColor: '#333' }} />
                                        <View style={{ marginLeft: 10, flex: 1 }}>
                                            <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }} numberOfLines={2}>{item.title}</Text>
                                            <Text style={{ color: '#aaa', fontSize: 12, marginTop: 4 }}>{item.uploaderName}</Text>
                                            <Text style={{ color: '#aaa', fontSize: 12 }}>{pipedApi.formatViews(item.views || 0)}</Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </>
                )}
            </View>

            {/* Settings Modal */}
            <Modal
                visible={showSettingsModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowSettingsModal(false)}
            >
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
                    activeOpacity={1}
                    onPress={() => setShowSettingsModal(false)}
                >
                    <View style={{ backgroundColor: '#1a1a1a', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: insets.bottom + 20 }}>
                        {/* Header */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#333' }}>
                            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Cài đặt video</Text>
                            <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {/* Playback Speed */}
                        <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#333' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                <Ionicons name="speedometer-outline" size={22} color={COLORS.primary} />
                                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 10 }}>Tốc độ phát</Text>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {speedOptions.map((option) => (
                                    <TouchableOpacity
                                        key={option.value}
                                        onPress={() => changePlaybackRate(option.value)}
                                        style={{
                                            paddingHorizontal: 16,
                                            paddingVertical: 10,
                                            borderRadius: 20,
                                            marginRight: 8,
                                            backgroundColor: playbackRate === option.value ? COLORS.primary : '#333',
                                        }}
                                    >
                                        <Text style={{ color: playbackRate === option.value ? '#000' : '#fff', fontWeight: '500' }}>
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Loop Toggle */}
                        <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#333' }}
                            onPress={toggleLoop}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="repeat" size={22} color={COLORS.primary} />
                                <View style={{ marginLeft: 10 }}>
                                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Lặp lại video</Text>
                                    <Text style={{ color: '#888', fontSize: 12 }}>Tự động phát lại khi kết thúc</Text>
                                </View>
                            </View>
                            <View style={{
                                width: 50,
                                height: 28,
                                borderRadius: 14,
                                backgroundColor: isLooping ? COLORS.primary : '#444',
                                justifyContent: 'center',
                                paddingHorizontal: 2
                            }}>
                                <View style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: 12,
                                    backgroundColor: '#fff',
                                    alignSelf: isLooping ? 'flex-end' : 'flex-start'
                                }} />
                            </View>
                        </TouchableOpacity>

                        {/* Current Speed Indicator */}
                        <View style={{ padding: 16 }}>
                            <Text style={{ color: '#888', fontSize: 12, textAlign: 'center' }}>
                                Tốc độ hiện tại: {playbackRate === 1 ? 'Bình thường' : `${playbackRate}x`}
                                {isLooping ? ' • Lặp lại: Bật' : ''}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
};

export default GlobalPlayer;
