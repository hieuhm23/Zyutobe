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
    FlatList,
    Alert,
    Platform,
    AppState,
    AppStateStatus
} from 'react-native';

const PipHandler = Platform.OS === 'android' ? require('react-native-pip-android').default : null;
import { Video, ResizeMode, Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as Brightness from 'expo-brightness';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PlayerSettingsModal from './PlayerSettingsModal';
import { COLORS } from '../constants/theme';
import pipedApi from '../services/pipedApi';
import youtubeApi from '../services/youtubeApi';
import { useLibrary } from '../hooks/useLibrary';
import { usePlayer } from '../context/PlayerContext';
import { useSettings } from '../context/SettingsContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const VIDEO_HEIGHT = (SCREEN_WIDTH * 9) / 16;
const MINI_HEIGHT = 64;

const GlobalPlayer = () => {
    const { video, videoId, isMinimized, playVideo, minimizePlayer, maximizePlayer, closePlayer } = usePlayer();
    const insets = useSafeAreaInsets();
    const { addToHistory, isFavorite: checkIsFav, toggleFavorite } = useLibrary();
    const { autoPlay, backgroundPlay, autoPiP } = useSettings();

    const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 94 : 80;
    const SNAP_TOP = 0;
    const MINI_BOTTOM_OFFSET = TAB_BAR_HEIGHT + (insets.bottom > 0 ? insets.bottom / 2 : 10);
    const SNAP_BOTTOM = SCREEN_HEIGHT - MINI_HEIGHT - MINI_BOTTOM_OFFSET;

    const videoRef = useRef<Video>(null);
    const [status, setStatus] = useState<any>({});
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [videoHeaders, setVideoHeaders] = useState<Record<string, string> | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [videoReady, setVideoReady] = useState(false);
    const [meta, setMeta] = useState<any>({});
    const [relatedVideos, setRelatedVideos] = useState<any[]>([]);
    const [relatedPageToken, setRelatedPageToken] = useState<string | null>(null);
    const [loadingRelated, setLoadingRelated] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const [videoVolume, setVideoVolume] = useState(1.0);

    // Settings State
    const [qualities, setQualities] = useState<{ height: number; url: string }[]>([]);
    const [currentQuality, setCurrentQuality] = useState<string | number>('auto');
    const [showSettings, setShowSettings] = useState(false);

    // Gesture State
    const [gestureMode, setGestureMode] = useState<'volume' | 'brightness' | null>(null);
    const [gestureValue, setGestureValue] = useState(0); // For display UI only
    const touchStartY = useRef(0);
    const initialValue = useRef(0);

    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    // --- CẤU HÌNH PHÁT NỀN (CRITICAL) ---
    useEffect(() => {
        const configAudio = async () => {
            try {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    staysActiveInBackground: backgroundPlay, // QUAN TRỌNG: Phát khi ẩn app
                    playsInSilentModeIOS: true,
                    shouldDuckAndroid: true,
                    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
                    interruptionModeIOS: InterruptionModeIOS.DoNotMix,
                });
            } catch (e) { console.log("Audio Config Error", e); }
        };
        configAudio();
    }, [backgroundPlay]);

    // --- CẤU HÌNH PIP KHI VUỐT ẨN APP ---
    useEffect(() => {
        const handleAppStateChange = async (nextAppState: AppStateStatus) => {
            if (
                (nextAppState === 'inactive' || nextAppState === 'background') &&
                autoPiP && videoId && status.isPlaying && videoRef.current
            ) {
                try {
                    if (Platform.OS === 'android') {
                        PipHandler?.enterPipMode(300, 170); // Kích hoạt PiP Android
                    }
                    // iOS: Tự động kích hoạt PiP nếu allowsPictureInPicture=true
                } catch (e) { console.log('PiP Error:', e); }
            }
        };
        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription.remove();
    }, [autoPiP, videoId, status.isPlaying]);

    // --- ANIMATIONS ---
    const playerBorderRadius = translateY.interpolate({
        inputRange: [SNAP_TOP, SNAP_BOTTOM],
        outputRange: [0, 15],
        extrapolate: 'clamp',
    });
    const contentOpacity = translateY.interpolate({
        inputRange: [SNAP_TOP, SNAP_BOTTOM / 3],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });
    const miniControlsOpacity = translateY.interpolate({
        inputRange: [SNAP_BOTTOM * 0.8, SNAP_BOTTOM],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 10 && !isMinimized,
            onPanResponderMove: (_, gesture) => gesture.dy > 0 && translateY.setValue(gesture.dy),
            onPanResponderRelease: (_, gesture) => {
                if (gesture.dy > 120 || gesture.vy > 0.5) minimizePlayer();
                else Animated.spring(translateY, { toValue: SNAP_TOP, useNativeDriver: true, damping: 25, stiffness: 150 }).start();
            }
        })
    ).current;

    useEffect(() => {
        if (videoId) {
            Animated.spring(translateY, { toValue: isMinimized ? SNAP_BOTTOM : SNAP_TOP, useNativeDriver: true, damping: 25, stiffness: 150, mass: 0.8 }).start();
        } else { translateY.setValue(SCREEN_HEIGHT); }
    }, [isMinimized, videoId, SNAP_BOTTOM]);

    useEffect(() => {
        if (!videoId) return;
        let isMounted = true;
        setLoading(true);
        setError(false);
        setVideoReady(false);
        setVideoUrl(null);
        setMeta(video || {});
        setRelatedVideos([]);

        const initPlayer = async () => {
            try {
                const stream = await pipedApi.getBestStreamUrl(videoId);
                if (isMounted && stream?.url) {
                    setVideoUrl(stream.url);
                    if (stream.headers) setVideoHeaders(stream.headers);
                } else if (isMounted) { setError(true); }

                const info = await youtubeApi.getStream(videoId);
                if (isMounted && info) {
                    setMeta((prev: any) => ({ ...prev, ...info }));
                    if (info.relatedStreams) setRelatedVideos(info.relatedStreams);
                    if (info.relatedNextPageToken) setRelatedPageToken(info.relatedNextPageToken);
                }
            } catch (err) { if (isMounted) setError(true); }
            finally { if (isMounted) setLoading(false); }
        };
        addToHistory(video || { url: `/watch?v=${videoId}`, title: videoId } as any);
        initPlayer();

        // Fetch full streams for quality selection
        pipedApi.getStream(videoId).then(info => {
            if (info && info.videoStreams) {
                const streams = info.videoStreams
                    .filter(s => !s.videoOnly && s.mimeType.includes('mp4'))
                    .map(s => ({ height: s.height || 0, url: s.url }))
                    .sort((a, b) => b.height - a.height);
                // remove duplicates
                const unique = streams.filter((v, i, a) => a.findIndex(t => (t.height === v.height)) === i);
                setQualities(unique);
            }
        });

        return () => { isMounted = false; };
    }, [videoId]);

    // Gesture Responder for Video Area
    const videoPanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false, // Let taps pass through to parent TouchableOpacity
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                const { locationX } = evt.nativeEvent;
                const width = Dimensions.get('window').width;
                const isSide = locationX < width * 0.35 || locationX > width * 0.65;
                const isVertical = Math.abs(gestureState.dy) > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 2;
                return isSide && isVertical;
            },
            onPanResponderGrant: (evt) => {
                touchStartY.current = evt.nativeEvent.locationY;
                const touchX = evt.nativeEvent.locationX;
                const width = Dimensions.get('window').width;
                if (touchX < width / 2) {
                    setGestureMode('brightness');
                    Brightness.getBrightnessAsync().then(v => initialValue.current = v);
                } else {
                    setGestureMode('volume');
                    initialValue.current = videoVolume;
                }
            },
            onPanResponderMove: (evt, gestureState) => {
                const dy = gestureState.dy; // Negative is UP
                const delta = -dy / 250; // Sensitivity
                let newValue = Math.min(1, Math.max(0, initialValue.current + delta));

                setGestureValue(newValue);
                if (gestureMode === 'brightness') {
                    Brightness.setBrightnessAsync(newValue);
                } else {
                    setVideoVolume(newValue);
                }
            },
            onPanResponderRelease: () => {
                setGestureMode(null);
            },
            onPanResponderTerminate: () => setGestureMode(null),
        })
    ).current;

    const changeQuality = async (url: string, height: number) => {
        const status = await videoRef.current?.getStatusAsync();
        const currentPos = status && status.isLoaded ? status.positionMillis : 0;
        const isPlaying = status && status.isLoaded ? status.isPlaying : true;

        setVideoUrl(url);
        setCurrentQuality(height);
        // Wait for video load then seek
        // Note: This is simplified, robust implementation needs onReady
    };


    const loadMoreRelatedVideos = async () => {
        if (loadingRelated || !relatedPageToken || !meta.title) return;
        setLoadingRelated(true);
        try {
            const res = await youtubeApi.searchNextPage(meta.title, relatedPageToken, 'video');
            if (res.items) {
                setRelatedVideos(prev => [...prev, ...res.items]);
            }
            setRelatedPageToken(res.nextPageToken || null);
        } catch (error) {
            console.log('Error loading more related:', error);
        } finally {
            setLoadingRelated(false);
        }
    };

    const togglePlay = async () => {
        if (!videoRef.current) return;
        if (status.isPlaying) await videoRef.current.pauseAsync();
        else await videoRef.current.playAsync();
    };

    const seek = (amount: number) => {
        if (!videoRef.current || !status.durationMillis) return;
        const newPos = status.positionMillis + (amount * 1000);
        videoRef.current.setPositionAsync(Math.max(0, Math.min(newPos, status.durationMillis)));
    };

    const formatTime = (millis: number) => {
        if (!millis) return "00:00";
        const totalSeconds = Math.floor(millis / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    if (!videoId) return null;

    return (
        <Animated.View style={{
            position: 'absolute',
            zIndex: 99999,
            width: isMinimized ? SCREEN_WIDTH - 20 : SCREEN_WIDTH,
            height: isMinimized ? MINI_HEIGHT : SCREEN_HEIGHT,
            backgroundColor: '#1A1A1A',
            borderRadius: playerBorderRadius,
            marginHorizontal: isMinimized ? 10 : 0,
            overflow: 'hidden',
            top: 0,
            transform: [{ translateY }],
            ...(isMinimized && { elevation: 15, shadowColor: "#000", shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' })
        }}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <View style={{ flex: 1, flexDirection: isMinimized ? 'row' : 'column', alignItems: isMinimized ? 'center' : 'stretch' }}>

                {/* VIDEO BOX */}
                <View
                    style={{ width: isMinimized ? 106 : SCREEN_WIDTH, height: isMinimized ? 60 : VIDEO_HEIGHT + insets.top, backgroundColor: '#000' }}
                    {...(isMinimized ? {} : panResponder.panHandlers)}
                >
                    <TouchableOpacity activeOpacity={1} onPress={() => isMinimized ? maximizePlayer() : setShowControls(!showControls)} style={{ width: '100%', height: isMinimized ? 60 : VIDEO_HEIGHT, marginTop: isMinimized ? 0 : insets.top }}>
                        {videoUrl && (
                            <Video
                                ref={videoRef}
                                style={StyleSheet.absoluteFill}
                                source={{ uri: videoUrl, headers: videoHeaders }}
                                resizeMode={isMinimized ? ResizeMode.COVER : ResizeMode.CONTAIN}
                                shouldPlay={true}
                                rate={playbackRate}
                                volume={videoVolume}
                                allowsPictureInPicture={autoPiP} // iOS Native PiP
                                usePoster
                                posterSource={{ uri: video?.thumbnail || meta.thumbnailUrl || meta.thumbnail }}
                                onPlaybackStatusUpdate={s => setStatus(s)}
                                onReadyForDisplay={() => setVideoReady(true)}
                            />
                        )}

                        {/* Gesture Overlay (For Brightness/Volume) */}
                        {!isMinimized && videoReady && (
                            <View
                                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 5 }}
                                {...videoPanResponder.panHandlers}
                            />
                        )}

                        {(!videoReady || loading) && (
                            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                                <ActivityIndicator size="small" color={COLORS.primary} />
                            </View>
                        )}

                        {!isMinimized && showControls && videoReady && (
                            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10, justifyContent: 'center', alignItems: 'center' }]}>
                                {/* Top Controls */}
                                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', padding: 10 }}>
                                    <TouchableOpacity onPress={minimizePlayer} style={{ padding: 5 }}>
                                        <Ionicons name="chevron-down" size={32} color="#fff" />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setShowSettings(true)} style={{ padding: 5 }}>
                                        <Ionicons name="settings-outline" size={28} color="#fff" />
                                    </TouchableOpacity>
                                </View>

                                {/* Center Controls */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 40 }}>
                                    <TouchableOpacity onPress={() => seek(-10)}>
                                        <Ionicons name="play-back" size={35} color="#fff" />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={togglePlay}>
                                        <Ionicons name={status.isPlaying ? "pause-circle" : "play-circle"} size={75} color="#fff" />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => seek(10)}>
                                        <Ionicons name="play-forward" size={35} color="#fff" />
                                    </TouchableOpacity>
                                </View>

                                {/* Bottom Controls */}
                                <View style={{ position: 'absolute', bottom: 10, left: 10, right: 10 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                                        <Text style={{ color: '#fff', fontSize: 12 }}>
                                            {formatTime(status.positionMillis)} / {formatTime(status.durationMillis)}
                                        </Text>
                                        <TouchableOpacity onPress={() => videoRef.current?.presentFullscreenPlayer()} style={{ padding: 5 }}>
                                            <Ionicons name="scan-outline" size={24} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                    <Slider
                                        style={{ width: '100%', height: 40 }}
                                        minimumValue={0}
                                        maximumValue={status.durationMillis || 0}
                                        value={status.positionMillis || 0}
                                        minimumTrackTintColor={COLORS.primary}
                                        maximumTrackTintColor="#FFFFFF"
                                        thumbTintColor={COLORS.primary}
                                        onSlidingComplete={(val) => videoRef.current?.setPositionAsync(val)}
                                    />
                                </View>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* MINI PLAYER CONTROLS */}
                {isMinimized && (
                    <Animated.View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', opacity: miniControlsOpacity }}>
                        <TouchableOpacity style={{ flex: 1, paddingLeft: 12 }} onPress={maximizePlayer}>
                            <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }} numberOfLines={1}>{meta.title || videoId}</Text>
                            <Text style={{ color: '#aaa', fontSize: 11 }} numberOfLines={1}>{meta.uploaderName}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={togglePlay} style={{ padding: 10 }}><Ionicons name={status.isPlaying ? "pause" : "play"} size={26} color="#fff" /></TouchableOpacity>
                        <TouchableOpacity onPress={closePlayer} style={{ padding: 10 }}><Ionicons name="close" size={26} color="#fff" /></TouchableOpacity>
                    </Animated.View>
                )}

                {/* FULL PLAYER LIST */}
                {!isMinimized && (
                    <Animated.View style={{ flex: 1, opacity: contentOpacity, backgroundColor: '#0F0F0F' }}>
                        <FlatList
                            data={relatedVideos}
                            keyExtractor={(item, index) => item.url + index}
                            ListHeaderComponent={
                                <View style={{ padding: 16 }}>
                                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', lineHeight: 26 }}>{meta.title}</Text>
                                    <Text style={{ color: '#aaa', fontSize: 12, marginTop: 8 }}>{pipedApi.formatViews(meta.views || 0)} lượt xem • {meta.uploadedDate}</Text>

                                    <View style={{ flexDirection: 'row', marginTop: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#222' }}>
                                        <TouchableOpacity style={{ alignItems: 'center', marginRight: 35 }} onPress={() => toggleFavorite(video)}>
                                            <Ionicons name={checkIsFav(videoId) ? 'heart' : 'heart-outline'} size={24} color={checkIsFav(videoId) ? COLORS.primary : '#fff'} />
                                            <Text style={{ color: '#fff', fontSize: 11, marginTop: 4 }}>Thích</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={{ alignItems: 'center', marginRight: 35 }} onPress={() => Alert.alert('Chia sẻ', `https://youtube.com/watch?v=${videoId}`)}>
                                            <Ionicons name="share-social-outline" size={24} color="#fff" />
                                            <Text style={{ color: '#fff', fontSize: 11, marginTop: 4 }}>Chia sẻ</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 15 }}>Tiếp theo</Text>
                                </View>
                            }
                            renderItem={({ item }) => (
                                <TouchableOpacity onPress={() => playVideo(item)} style={{ flexDirection: 'row', marginBottom: 16, paddingHorizontal: 16 }}>
                                    <Image source={{ uri: item.thumbnail }} style={{ width: 140, height: 78, borderRadius: 10 }} />
                                    <View style={{ marginLeft: 12, flex: 1, justifyContent: 'center' }}>
                                        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500' }} numberOfLines={2}>{item.title}</Text>
                                        <Text style={{ color: '#aaa', fontSize: 12, marginTop: 5 }}>{item.uploaderName}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            onEndReached={loadMoreRelatedVideos}
                            onEndReachedThreshold={0.5}
                            ListFooterComponent={loadingRelated ? <ActivityIndicator size="small" color="#fff" style={{ padding: 20 }} /> : null}
                        />
                    </Animated.View>
                )}
            </View>

            {/* Gesture Feedback UI */}
            {gestureMode && (
                <View style={{ position: 'absolute', top: '40%', left: '40%', backgroundColor: 'rgba(0,0,0,0.7)', padding: 20, borderRadius: 10, alignItems: 'center' }}>
                    <Ionicons name={gestureMode === 'volume' ? 'volume-high' : 'sunny'} size={30} color="#fff" />
                    <Text style={{ color: '#fff', marginTop: 10, fontWeight: 'bold' }}>{Math.round(gestureValue * 100)}%</Text>
                </View>
            )}

            <PlayerSettingsModal
                visible={showSettings}
                onClose={() => setShowSettings(false)}
                qualities={qualities}
                currentQuality={currentQuality}
                onSelectQuality={changeQuality}
                currentSpeed={playbackRate}
                onSelectSpeed={(s) => setPlaybackRate(s)}
            />
        </Animated.View>
    );
};

export default GlobalPlayer;
