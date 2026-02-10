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
    DeviceEventEmitter,
    Modal
} from 'react-native';
import { Video, ResizeMode, Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PlayerSettingsModal from './PlayerSettingsModal';
import { COLORS } from '../constants/theme';
import pipedApi from '../services/pipedApi';
import youtubeApi from '../services/youtubeApi';
import { getSkipSegments, SponsorSegment } from '../services/sponsorBlockApi';
import { useLibrary } from '../hooks/useLibrary';
import { usePlayer } from '../context/PlayerContext';
import { useSettings } from '../context/SettingsContext';
import { usePremium } from '../context/PremiumContext';
import { useNavigation } from '@react-navigation/native';
import DownloadManager from '../services/DownloadManager';
import TrackPlayer, { Capability, State } from 'react-native-track-player';
import * as ScreenOrientation from 'expo-screen-orientation';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const VIDEO_HEIGHT = (SCREEN_WIDTH * 9) / 16;
const MINI_HEIGHT = 64;

// --- SMART PIP LOADER ---
let PipHandler: any = null;
if (Platform.OS === 'android') {
    try {
        PipHandler = require('react-native-pip-android').default;
    } catch (e) {
        console.log("PiP Module Native not found - Feature disabled");
    }
}
// ------------------------

// Custom JS Slider (Interactive & Safe)
const InteractiveSlider = ({ value, maximumValue, onSeek }: { value: number, maximumValue: number, onSeek: (val: number) => void }) => {
    const widthRef = useRef(0);
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => handleTouch(evt.nativeEvent.locationX),
            onPanResponderMove: (evt) => handleTouch(evt.nativeEvent.locationX),
        })
    ).current;

    const handleTouch = (x: number) => {
        if (widthRef.current > 0 && maximumValue > 0) {
            const percentage = Math.max(0, Math.min(1, x / widthRef.current));
            onSeek(percentage * maximumValue);
        }
    };

    const percent = maximumValue > 0 ? (value / maximumValue) * 100 : 0;

    return (
        <View
            style={{ height: 40, justifyContent: 'center', width: '100%' }}
            onLayout={(e) => widthRef.current = e.nativeEvent.layout.width}
            {...panResponder.panHandlers}
        >
            <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' }}>
                <View style={{ width: `${percent}%`, height: '100%', backgroundColor: COLORS.primary }} />
            </View>
            {/* Thumb Circle */}
            <View style={{
                position: 'absolute',
                left: `${percent}%`,
                marginLeft: -6,
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: COLORS.primary,
                transform: [{ translateX: 0 }]
            }} />
        </View>
    );
};

const GlobalPlayer = () => {
    const { video, videoId, isMinimized, playVideo, minimizePlayer, maximizePlayer, closePlayer } = usePlayer();
    const insets = useSafeAreaInsets();
    const { addToHistory, isFavorite: checkIsFav, toggleFavorite } = useLibrary();
    const { autoPlay, backgroundPlay, autoPiP, sponsorBlockEnabled, audioOnlyMode } = useSettings();
    const { isPremium } = usePremium();
    const navigation = useNavigation<any>();

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
    const [skipSegments, setSkipSegments] = useState<SponsorSegment[]>([]);
    const [lastSkippedUUID, setLastSkippedUUID] = useState<string | null>(null); // Avoid loop skipping

    // Settings State
    const [qualities, setQualities] = useState<{ height: number; url: string }[]>([]);
    const [currentQuality, setCurrentQuality] = useState<string | number>('auto');
    const [pendingSeek, setPendingSeek] = useState<number | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showSleepTimer, setShowSleepTimer] = useState(false);

    // Sleep Timer (Target Timestamp)
    const [sleepTarget, setSleepTarget] = useState<number | null>(null);
    // Keep track for UI display
    const [selectedSleepMinutes, setSelectedSleepMinutes] = useState<number | null>(null);

    // Audio-Only Mode State
    const [isAudioOnly, setIsAudioOnly] = useState(false);

    const [isTPReady, setIsTPReady] = useState(false); // TrackPlayer for Dynamic Island / Lock Screen

    // Initialize TrackPlayer for Now Playing (Dynamic Island / Lock Screen)
    useEffect(() => {
        const setupTrackPlayer = async () => {
            try {
                // Check if already initialized
                const currentTrack = await TrackPlayer.getActiveTrack().catch(() => null);
                if (currentTrack !== undefined) {
                    // Already initialized
                    setIsTPReady(true);
                    console.log('TrackPlayer already initialized');
                    return;
                }

                await TrackPlayer.setupPlayer();
                await TrackPlayer.updateOptions({
                    capabilities: [
                        Capability.Play,
                        Capability.Pause,
                        Capability.SeekTo,
                        Capability.SkipToNext,
                        Capability.SkipToPrevious,
                    ],
                    compactCapabilities: [Capability.Play, Capability.Pause],
                    notificationCapabilities: [Capability.Play, Capability.Pause, Capability.SeekTo],
                });
                setIsTPReady(true);
                console.log('TrackPlayer initialized for Now Playing');
            } catch (e: any) {
                // If error is "already been initialized", that's fine
                if (e?.message?.includes('already been initialized')) {
                    setIsTPReady(true);
                    console.log('TrackPlayer was already initialized');
                } else {
                    console.log('TrackPlayer setup error:', e);
                }
            }
        };
        setupTrackPlayer();
    }, []);

    // Listen for Remote Control Events from Dynamic Island / Lock Screen
    // Using TrackPlayer events directly for better background support
    useEffect(() => {
        if (!isTPReady) return;

        const setupRemoteListeners = async () => {
            try {
                const { Event } = await import('react-native-track-player');

                TrackPlayer.addEventListener(Event.RemotePlay, async () => {
                    console.log('Remote: PLAY');
                    await videoRef.current?.playAsync();
                });

                TrackPlayer.addEventListener(Event.RemotePause, async () => {
                    console.log('Remote: PAUSE');
                    await videoRef.current?.pauseAsync();
                });

                TrackPlayer.addEventListener(Event.RemoteNext, () => {
                    console.log('Remote: NEXT');
                    if (relatedVideos.length > 0) {
                        playVideo(relatedVideos[0]);
                    }
                });

                TrackPlayer.addEventListener(Event.RemoteStop, async () => {
                    console.log('Remote: STOP');
                    await videoRef.current?.pauseAsync();
                });

                console.log('Remote control listeners registered');
            } catch (e) {
                console.log('Failed to setup remote listeners:', e);
            }
        };

        setupRemoteListeners();
    }, [isTPReady, relatedVideos, playVideo]);

    const handleSetSleepTimer = (minutes: number | null) => {
        setSelectedSleepMinutes(minutes);
        if (minutes) {
            const target = Date.now() + (minutes * 60 * 1000);
            setSleepTarget(target);
            Alert.alert("⏰ Hẹn giờ", `Nhạc sẽ tắt lúc ${new Date(target).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
        } else {
            setSleepTarget(null);
            Alert.alert("Thông báo", "Đã hủy hẹn giờ tắt.");
        }
    };

    // Fake Fullscreen State (Just UI toggle, no native rotation)
    const [isFullscreen, setIsFullscreen] = useState(false);

    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    // Fix Stale Closure for PanResponder
    const isMinimizedRef = useRef(isMinimized);
    const isFullscreenRef = useRef(isFullscreen);

    useEffect(() => { isMinimizedRef.current = isMinimized; }, [isMinimized]);
    useEffect(() => { isFullscreenRef.current = isFullscreen; }, [isFullscreen]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => !isMinimizedRef.current && !isFullscreenRef.current,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return !isMinimizedRef.current && !isFullscreenRef.current && gestureState.dy > 10 && Math.abs(gestureState.dx) < 10;
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    translateY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 120 || gestureState.vy > 0.5) {
                    minimizePlayer();
                } else {
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: false,
                        tension: 60,
                        friction: 9
                    }).start();
                }
            }
        })
    ).current;

    // Sync translateY when minimized/maximized state changes
    useEffect(() => {
        if (isMinimized) {
            // Khi minimized, giá trị animation giữ ở mức tối đa (SNAP_BOTTOM) để giữ layout mini
            translateY.setValue(SNAP_BOTTOM);
        } else {
            // Khi maximized, reset về 0
            if ((translateY as any)._value !== 0) { // Check current value to avoid unnecessary spring
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: false,
                    tension: 50,
                    friction: 9
                }).start();
            }
        }
    }, [isMinimized]);

    // --- INTERPOLATIONS (Biến thiên Animation) ---
    // 1. Chiều rộng Video: Từ Full màn hình -> 106px
    const animatedVideoWidth = translateY.interpolate({
        inputRange: [0, SNAP_BOTTOM],
        outputRange: [SCREEN_WIDTH, 106],
        extrapolate: 'clamp',
    });

    // 2. Chiều cao Video: Từ Tỷ lệ 16:9 -> 60px
    const animatedVideoHeight = translateY.interpolate({
        inputRange: [0, SNAP_BOTTOM],
        outputRange: [VIDEO_HEIGHT + insets.top, 60],
        extrapolate: 'clamp',
    });

    // 3. Container Height: Từ Full màn hình -> 60px
    const animatedContainerHeight = translateY.interpolate({
        inputRange: [0, SNAP_BOTTOM],
        outputRange: [SCREEN_HEIGHT, MINI_HEIGHT],
        extrapolate: 'clamp',
    });

    // 4. List Opacity: Mờ dần nội dung list khi vuốt
    const contentOpacity = translateY.interpolate({
        inputRange: [0, SNAP_BOTTOM / 2],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    // 5. Mini Controls Opacity: Hiện dần lên khi gần đáy
    const miniControlsOpacity = translateY.interpolate({
        inputRange: [SNAP_BOTTOM * 0.7, SNAP_BOTTOM], // Bắt đầu hiện ở 70% quãng đường
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    // 6. Bo góc: Tròn dần
    const playerBorderRadius = translateY.interpolate({
        inputRange: [0, SNAP_BOTTOM],
        outputRange: [0, 12],
        extrapolate: 'clamp',
    });

    // Double Tap to Seek State
    const [seekAnims, setSeekAnims] = useState({ left: 0, right: 0 });
    const lastTap = useRef<{ time: number, side: 'left' | 'right' | null }>({ time: 0, side: null });
    const controlsTimeout = useRef<NodeJS.Timeout | null>(null);

    // Download State
    const [isDownloaded, setIsDownloaded] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);

    // Auto-hide controls after 3 seconds
    const showControlsWithTimer = () => {
        setShowControls(true);
        if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
        controlsTimeout.current = setTimeout(() => {
            setShowControls(false);
        }, 3000);
    };

    const handleTapOnVideo = (side: 'left' | 'right') => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (lastTap.current.side === side && (now - lastTap.current.time) < DOUBLE_TAP_DELAY) {
            // Double tap detected - Seek
            const seekAmount = side === 'left' ? -10 : 10;
            seek(seekAmount);
            setSeekAnims(prev => ({ ...prev, [side]: prev[side as keyof typeof prev] + 1 }));
            setTimeout(() => {
                setSeekAnims(prev => ({ ...prev, [side]: Math.max(0, prev[side as keyof typeof prev] - 1) }));
            }, 800);

            // If double tapping, ensure controls stay visible or hidden based on preference
            // YouTube keeps controls visible during double tap
            if (!showControls) setShowControls(true);

            lastTap.current = { time: now, side }; // Update time for consecutive taps (triple tap, etc)
            if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
        } else {
            // Single tap - Toggle controls INSTANTLY
            lastTap.current = { time: now, side };

            // Toggle logic
            if (showControls) {
                setShowControls(false);
                if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
            } else {
                showControlsWithTimer();
            }
        }
    };

    // --- AUTO PIP LOGIC (VIP Only) ---
    useEffect(() => {
        if (!autoPiP || !PipHandler || !isPremium) return; // Check VIP

        const sub = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'background' && videoId && status.isPlaying) {
                try {
                    PipHandler.enterPictureInPictureMode();
                } catch (e) {
                    console.log("PiP Trigger Failed", e);
                }
            }
        });

        return () => sub.remove();
    }, [autoPiP, videoId, status.isPlaying, isPremium]);

    // --- AUDIO CONFIG (Background Play - FREE feature) ---
    useEffect(() => {
        const configAudio = async () => {
            try {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    staysActiveInBackground: backgroundPlay, // FREE - no VIP check needed
                    playsInSilentModeIOS: true,
                    shouldDuckAndroid: true,
                    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
                    interruptionModeIOS: InterruptionModeIOS.DoNotMix,
                });
            } catch (e) { }
        };
        configAudio();
    }, [backgroundPlay]);


    // Note: Now Playing sync moved to Dynamic Island control below
    // --- DYNAMIC ISLAND VISIBILITY CONTROL ---
    // Show Dynamic Island ONLY when app goes to background
    // Hide (reset) when app comes to foreground
    const appStateRef = useRef(AppState.currentState);
    const dynamicIslandActive = useRef(false);

    useEffect(() => {
        if (!isTPReady || !videoId) return;

        const subscription = AppState.addEventListener('change', async nextAppState => {
            const prevState = appStateRef.current;
            appStateRef.current = nextAppState;

            try {
                // Going to background (from active/inactive to background)
                if (nextAppState === 'background' && prevState !== 'background') {
                    if (status.isPlaying && meta.title && !dynamicIslandActive.current) {
                        await TrackPlayer.reset();
                        await TrackPlayer.add({
                            id: videoId,
                            url: 'silence',
                            title: meta.title || 'ZyTube',
                            artist: meta.uploaderName || 'Unknown Artist',
                            artwork: meta.thumbnailUrl || meta.thumbnail || video?.thumbnail,
                            duration: meta.duration || 0,
                        });
                        await TrackPlayer.play();
                        dynamicIslandActive.current = true;
                        console.log('Dynamic Island: SHOWN');
                    }
                }
                // Coming back to foreground (from background to active)
                else if (nextAppState === 'active' && prevState === 'background') {
                    if (dynamicIslandActive.current) {
                        await TrackPlayer.reset();
                        dynamicIslandActive.current = false;
                        console.log('Dynamic Island: HIDDEN');
                    }
                }
            } catch (e) {
                console.log('Dynamic Island error:', e);
            }
        });

        return () => subscription.remove();
    }, [isTPReady, videoId, status.isPlaying, meta.title, meta.uploaderName, meta.thumbnailUrl]);

    // --- SYNC VIDEO STATE TO TRACKPLAYER WHEN IN BACKGROUND ---
    // This keeps Dynamic Island in sync with actual video playback
    useEffect(() => {
        if (!dynamicIslandActive.current || !isTPReady) return;

        const syncToTrackPlayer = async () => {
            try {
                if (status.isPlaying) {
                    await TrackPlayer.play();
                } else {
                    await TrackPlayer.pause();
                }
            } catch (e) { }
        };

        syncToTrackPlayer();
    }, [status.isPlaying, isTPReady]);

    // --- UPDATE DYNAMIC ISLAND WHEN VIDEO CHANGES IN BACKGROUND ---
    // This ensures Dynamic Island shows correct info when switching videos
    useEffect(() => {
        if (!dynamicIslandActive.current || !isTPReady || !videoId || !meta.title) return;

        const updateNowPlaying = async () => {
            try {
                console.log('Updating Dynamic Island for new video:', meta.title);
                await TrackPlayer.reset();
                await TrackPlayer.add({
                    id: videoId,
                    url: 'silence',
                    title: meta.title || 'ZyTube',
                    artist: meta.uploaderName || 'Unknown Artist',
                    artwork: meta.thumbnailUrl || meta.thumbnail || video?.thumbnail,
                    duration: meta.duration || 0,
                });
                if (status.isPlaying) {
                    await TrackPlayer.play();
                }
            } catch (e) {
                console.log('Update Now Playing error:', e);
            }
        };

        updateNowPlaying();
    }, [videoId, meta.title, isTPReady]);



    useEffect(() => {
        if (videoId && !isMinimized) {
            // Khi mở video mới Fullscreen -> Slide up
            translateY.setValue(SCREEN_HEIGHT);
            Animated.spring(translateY, { toValue: 0, useNativeDriver: false, damping: 25, stiffness: 150 }).start();
        }
    }, [videoId]);


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
                // Use audio-only stream if mode is enabled
                let stream;
                if (audioOnlyMode) {
                    console.log('🎵 Audio-Only Mode: Fetching audio stream...');
                    stream = await pipedApi.getBestAudioUrl(videoId);
                    if (isMounted) setIsAudioOnly(true);
                } else {
                    stream = await pipedApi.getBestStreamUrl(videoId);
                    if (isMounted) setIsAudioOnly(false);
                }

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

                // Fetch SponsorBlock segments
                if (sponsorBlockEnabled) {
                    getSkipSegments(videoId).then(segments => {
                        if (isMounted && segments.length > 0) {
                            console.log('SponsorBlock: Found segments', segments.length);
                            setSkipSegments(segments);
                        }
                    }).catch(e => console.log('SponsorBlock fetch error', e));
                } else {
                    setSkipSegments([]);
                }
            } catch (err) { if (isMounted) setError(true); }
            finally { if (isMounted) setLoading(false); }
        };
        addToHistory(video || { url: `/watch?v=${videoId}`, title: videoId } as any);
        const checkDownloadStatus = async () => {
            const downloaded = await DownloadManager.isDownloaded(videoId);
            setIsDownloaded(downloaded);
        };
        checkDownloadStatus();
        initPlayer();

        pipedApi.getStream(videoId).then(info => {
            if (info && info.videoStreams) {
                const streams = info.videoStreams
                    .filter(s => !s.videoOnly && s.mimeType.includes('mp4'))
                    .map(s => ({ height: s.height || 0, url: s.url }))
                    .sort((a, b) => b.height - a.height);
                const unique = streams.filter((v, i, a) => a.findIndex(t => (t.height === v.height)) === i);

                // Add HLS as "Auto" option if available
                const qualityOptions = [...unique];
                if (info.hls) {
                    // Check if already in list or add as a special object
                    // We'll handle 'auto' in changeQuality
                }
                setQualities(unique);

                // Try to match current videoUrl to a quality height
                if (videoUrl === info.hls) {
                    setCurrentQuality('auto');
                } else if (videoUrl) {
                    const matched = unique.find(q => q.url === videoUrl);
                    if (matched) setCurrentQuality(matched.height);
                } else if (unique.length > 0) {
                    // Default to highest available if not set
                    setCurrentQuality(unique[0].height);
                }
            }
        });

        return () => { isMounted = false; };
    }, [videoId, audioOnlyMode]);

    const changeQuality = async (url: string, height: number) => {
        if (!videoRef.current) return;

        let targetUrl = url;
        let targetHeight: string | number = height;

        if (url === 'auto') {
            if (!isPremium) {
                Alert.alert("ZyTube Premium", "Tính năng Tự động (4K) chỉ dành cho thành viên VIP.", [
                    { text: "Để sau", style: "cancel" },
                    { text: "Nâng cấp ngay", onPress: () => navigation.navigate('Premium') }
                ]);
                return;
            }
            if (!meta.hls) {
                Alert.alert("Thông báo", "Video này không hỗ trợ chế độ Tự động cao nhất.");
                return;
            }
            targetUrl = meta.hls;
            targetHeight = 'auto';
        }

        try {
            const status = await videoRef.current.getStatusAsync();
            if (status.isLoaded) {
                setPendingSeek(status.positionMillis);
            }

            setVideoUrl(targetUrl);
            setCurrentQuality(targetHeight);
        } catch (e) {
            setVideoUrl(targetUrl);
            setCurrentQuality(targetHeight);
        }
    };

    const loadMoreRelatedVideos = async () => {
        if (loadingRelated || !relatedPageToken || !meta.title) return;
        setLoadingRelated(true);
        try {
            const res = await youtubeApi.searchNextPage(meta.title, relatedPageToken, 'video');
            if (res.items) setRelatedVideos(prev => [...prev, ...res.items]);
            setRelatedPageToken(res.nextPageToken || null);
        } catch (error) { } finally { setLoadingRelated(false); }
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
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const toggleFullscreen = async () => {
        if (!isFullscreen) {
            // Enter fullscreen - lock to landscape
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
            StatusBar.setHidden(true);
            setIsFullscreen(true);
        } else {
            // Exit fullscreen - lock back to portrait
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
            StatusBar.setHidden(false);
            setIsFullscreen(false);
        }
    };

    // Sleep Timer Functions
    const SLEEP_OPTIONS = [
        { label: '15 phút', value: 15 },
        { label: '30 phút', value: 30 },
        { label: '45 phút', value: 45 },
        { label: '1 giờ', value: 60 },
        { label: '2 giờ', value: 120 },
    ];

    const selectSleepTimer = (minutes: number) => {
        const targetTime = Date.now() + minutes * 60 * 1000;
        setSleepTarget(targetTime);
        setSelectedSleepMinutes(minutes);
        setShowSleepTimer(false);
    };

    const cancelSleepTimer = () => {
        setSleepTarget(null);
        setSelectedSleepMinutes(null);
        setShowSleepTimer(false);
    };

    const formatSleepRemaining = (): string => {
        if (!sleepTarget) return '';
        const remaining = Math.max(0, sleepTarget - Date.now());
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        if (mins >= 60) {
            const hrs = Math.floor(mins / 60);
            const m = mins % 60;
            return `${hrs}h ${m}m`;
        }
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleDownload = async () => {
        if (!isPremium) {
            Alert.alert("ZyTube Premium", "Bạn cần nâng cấp VIP để sử dụng tính năng tải video.", [
                { text: "Để sau", style: "cancel" },
                { text: "Nâng cấp ngay", onPress: () => navigation.navigate('Premium') }
            ]);
            return;
        }

        if (isDownloaded) {
            Alert.alert('Video đã tải', 'Bạn có muốn xóa video này khỏi thiết bị?', [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        await DownloadManager.deleteDownload(videoId);
                        setIsDownloaded(false);
                        Alert.alert('Đã xóa', 'Video đã được xóa khỏi thư viện.');
                    }
                }
            ]);
            return;
        }

        if (!videoUrl) {
            Alert.alert('Lỗi', 'Không tìm thấy đường dẫn video.');
            return;
        }

        setIsDownloading(true);
        const result = await DownloadManager.downloadVideo(
            meta,
            videoUrl,
            (progress) => setDownloadProgress(progress)
        );

        setIsDownloading(false);
        setDownloadProgress(0);

        if (result) {
            setIsDownloaded(true);
            Alert.alert('Thành công', 'Video đã được tải xuống thư viện.');
        }
    };

    if (!videoId) return null;

    // Use safe layout values, fallback to static if hook fails/missing
    const dynamicVideoWidth = isFullscreen ? SCREEN_HEIGHT : (isMinimized ? 106 : SCREEN_WIDTH);
    const dynamicVideoHeight = isFullscreen ? SCREEN_WIDTH : (isMinimized ? 60 : VIDEO_HEIGHT + insets.top);

    return (
        <Animated.View style={{
            position: 'absolute',
            zIndex: 99999,
            width: isFullscreen ? '100%' : (isMinimized ? SCREEN_WIDTH - 20 : SCREEN_WIDTH),
            height: isFullscreen ? '100%' : (isMinimized ? MINI_HEIGHT : animatedContainerHeight),
            backgroundColor: '#000',
            borderRadius: isFullscreen ? 0 : playerBorderRadius,
            marginHorizontal: isMinimized ? 10 : 0,
            overflow: 'hidden',
            top: isFullscreen ? 0 : (isMinimized && !isFullscreen ? SNAP_BOTTOM : translateY.interpolate({
                inputRange: [0, SNAP_BOTTOM],
                outputRange: [0, SNAP_BOTTOM],
                extrapolate: 'clamp'
            })),
            left: isFullscreen ? 0 : 0,
            ...(isMinimized && { elevation: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' })
        }}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent hidden={isFullscreen} />

            <View style={{ flex: 1, flexDirection: isMinimized ? 'row' : 'column', alignItems: isMinimized ? 'center' : 'stretch' }}>

                {/* VIDEO BOX */}
                <Animated.View
                    style={{
                        width: isFullscreen ? '100%' : (isMinimized ? 106 : animatedVideoWidth),
                        height: isFullscreen ? '100%' : (isMinimized ? 60 : animatedVideoHeight),
                        backgroundColor: '#000',
                        paddingTop: (isMinimized || isFullscreen) ? 0 : insets.top,
                    }}
                    {...(isMinimized ? {} : panResponder.panHandlers)}
                >
                    <View style={{ width: '100%', height: '100%', position: 'relative' }}>
                        {videoUrl && (
                            <Video
                                ref={videoRef}
                                style={StyleSheet.absoluteFill}
                                source={{ uri: videoUrl, headers: videoHeaders }}
                                resizeMode={isMinimized ? ResizeMode.COVER : ResizeMode.CONTAIN}
                                shouldPlay={true}
                                rate={playbackRate}
                                usePoster
                                allowsPictureInPicture={true}
                                startsPictureInPictureAutomatically={autoPiP}
                                posterSource={{ uri: video?.thumbnail || meta.thumbnailUrl || meta.thumbnail }}
                                onPlaybackStatusUpdate={s => {
                                    setStatus(s);

                                    // Sync TrackPlayer State (Temporarily disabled to fix crash)
                                    /*
                                    if (s.isLoaded && isTPReady) {
                                        try {
                                            const TrackPlayer = require('react-native-track-player').default;
                                            if (s.isPlaying) TrackPlayer.play().catch(() => {});
                                            else TrackPlayer.pause().catch(() => {});
                                        } catch (e) {}
                                    }
                                    */

                                    if (sleepTarget && s.isLoaded && s.isPlaying && Date.now() >= sleepTarget) {
                                        videoRef.current?.pauseAsync();
                                        setSleepTarget(null);
                                        setSelectedSleepMinutes(null);
                                    }
                                    // Auto-Play Next
                                    if (s.isLoaded && s.didJustFinish && autoPlay && relatedVideos.length > 0) {
                                        const nextVideo = relatedVideos[0];
                                        if (nextVideo) {
                                            playVideo(nextVideo);
                                        }
                                    }

                                    // SponsorBlock Logic
                                    if (s.isLoaded && s.isPlaying && skipSegments.length > 0) {
                                        const currentTime = s.positionMillis / 1000;
                                        for (const seg of skipSegments) {
                                            if (currentTime >= seg.segment[0] && currentTime < seg.segment[1]) {
                                                if (lastSkippedUUID !== seg.UUID) {
                                                    // SKIP
                                                    console.log(`Skipping ${seg.category} from ${seg.segment[0]} to ${seg.segment[1]}`);
                                                    videoRef.current?.setPositionAsync(seg.segment[1] * 1000);
                                                    setLastSkippedUUID(seg.UUID);

                                                    // UI Feedback
                                                    Alert.alert('⏩ SponsorBlock', `Skipped ${seg.category}`);
                                                }
                                                break; // Only handle one segment at a time
                                            }
                                        }
                                    }
                                }}
                                onReadyForDisplay={() => setVideoReady(true)}
                                onLoad={(status) => {
                                    if (pendingSeek !== null && videoRef.current) {
                                        console.log(`Restoring position after quality switch: ${pendingSeek}ms`);
                                        videoRef.current.setPositionAsync(pendingSeek);
                                        setPendingSeek(null);
                                    }
                                }}
                            />
                        )}

                        {/* Tap Overlays - Handle Single & Double Tap */}
                        {!isMinimized && videoReady && (
                            <View style={styles.tapContainer} pointerEvents="box-none">
                                <TouchableOpacity
                                    activeOpacity={1}
                                    style={styles.tapSide}
                                    onPress={() => handleTapOnVideo('left')}
                                />
                                <TouchableOpacity
                                    activeOpacity={1}
                                    style={styles.tapSide}
                                    onPress={() => handleTapOnVideo('right')}
                                />
                            </View>
                        )}

                        {/* Tap overlay for minimized state */}
                        {isMinimized && (
                            <TouchableOpacity
                                activeOpacity={1}
                                onPress={maximizePlayer}
                                style={StyleSheet.absoluteFill}
                            />
                        )}

                        {/* Seek Indicators */}
                        {seekAnims.left > 0 && (
                            <View style={[styles.seekIndicator, { left: '15%' }]}>
                                <Ionicons name="play-back" size={30} color="white" />
                                <Text style={styles.seekText}>10s</Text>
                            </View>
                        )}
                        {seekAnims.right > 0 && (
                            <View style={[styles.seekIndicator, { right: '15%' }]}>
                                <Ionicons name="play-forward" size={30} color="white" />
                                <Text style={styles.seekText}>10s</Text>
                            </View>
                        )}

                        {(!videoReady || loading) && (
                            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                                <ActivityIndicator size="small" color={COLORS.primary} />
                            </View>
                        )}

                        {/* Audio-Only Mode Overlay */}
                        {isAudioOnly && !isMinimized && videoReady && (
                            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }]}>
                                {/* Blurred Thumbnail Background */}
                                <Image
                                    source={{ uri: video?.thumbnail || meta.thumbnailUrl || meta.thumbnail }}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        position: 'absolute',
                                        opacity: 0.25
                                    }}
                                    blurRadius={30}
                                />

                                {/* Gradient Overlay */}
                                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />

                                {/* Content */}
                                <View style={{ alignItems: 'center' }}>
                                    {/* Album Art Style */}
                                    <View style={{
                                        width: 120,
                                        height: 120,
                                        borderRadius: 16,
                                        overflow: 'hidden',
                                        marginBottom: 20,
                                        shadowColor: COLORS.primary,
                                        shadowOffset: { width: 0, height: 8 },
                                        shadowOpacity: 0.4,
                                        shadowRadius: 12,
                                        elevation: 15
                                    }}>
                                        <Image
                                            source={{ uri: video?.thumbnail || meta.thumbnailUrl || meta.thumbnail }}
                                            style={{ width: '100%', height: '100%' }}
                                        />
                                        {/* Play indicator overlay */}
                                        <View style={[StyleSheet.absoluteFill, {
                                            backgroundColor: 'rgba(0,0,0,0.3)',
                                            justifyContent: 'center',
                                            alignItems: 'center'
                                        }]}>
                                            <View style={{
                                                width: 50,
                                                height: 50,
                                                borderRadius: 25,
                                                backgroundColor: 'rgba(255,255,255,0.2)',
                                                justifyContent: 'center',
                                                alignItems: 'center'
                                            }}>
                                                <Ionicons name={status.isPlaying ? "musical-notes" : "pause"} size={24} color="#fff" />
                                            </View>
                                        </View>
                                    </View>

                                    {/* Title */}
                                    <Text style={{
                                        color: '#fff',
                                        fontSize: 16,
                                        fontWeight: '700',
                                        marginBottom: 6,
                                        textAlign: 'center',
                                        paddingHorizontal: 20,
                                        maxWidth: 280
                                    }} numberOfLines={2}>
                                        {meta.title || video?.title || 'Đang phát...'}
                                    </Text>

                                    {/* Artist */}
                                    <Text style={{
                                        color: 'rgba(255,255,255,0.6)',
                                        fontSize: 14,
                                        marginBottom: 16
                                    }}>
                                        {meta.uploader || meta.uploaderName || video?.uploaderName || ''}
                                    </Text>

                                    {/* Audio Mode Badge */}
                                    <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: COLORS.primary + '25',
                                        paddingHorizontal: 14,
                                        paddingVertical: 8,
                                        borderRadius: 20,
                                        borderWidth: 1,
                                        borderColor: COLORS.primary + '40'
                                    }}>
                                        <Ionicons name="musical-note" size={14} color={COLORS.primary} />
                                        <Text style={{
                                            color: COLORS.primary,
                                            fontSize: 12,
                                            fontWeight: '600',
                                            marginLeft: 6
                                        }}>
                                            Chế độ chỉ âm thanh
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {!isMinimized && showControls && videoReady && (
                            <View style={[StyleSheet.absoluteFill, { zIndex: 10 }]} pointerEvents="box-none">
                                {/* Background Dimmer - Visual Only, allow taps to pass through to Tap Overlays */}
                                <View
                                    style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]}
                                    pointerEvents="none"
                                />

                                {/* Interactive Controls Container - Sits ON TOP of dimmer */}
                                <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                                    {/* Top Bar */}
                                    <View style={{ position: 'absolute', top: 10, left: 10, right: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }} pointerEvents="box-none">
                                        <TouchableOpacity onPress={() => isFullscreen ? toggleFullscreen() : minimizePlayer()} style={{ padding: 5 }}>
                                            <Ionicons name="chevron-down" size={28} color="#fff" />
                                        </TouchableOpacity>

                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                            <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.badge}>
                                                <Text style={styles.badgeText}>{currentQuality === 'auto' ? 'Auto' : `${currentQuality}p`}</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.badge}>
                                                <Text style={styles.badgeText}>{playbackRate}x</Text>
                                            </TouchableOpacity>
                                            {/* Sleep Timer Button */}
                                            <TouchableOpacity
                                                onPress={() => setShowSleepTimer(true)}
                                                style={[
                                                    styles.badge,
                                                    sleepTarget ? { backgroundColor: COLORS.primary } : null
                                                ]}
                                            >
                                                <Ionicons name="moon" size={14} color="#fff" />
                                                {sleepTarget && (
                                                    <Text style={[styles.badgeText, { marginLeft: 4 }]}>
                                                        {formatSleepRemaining()}
                                                    </Text>
                                                )}
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => setShowSettings(true)} style={{ padding: 5 }}>
                                                <Ionicons name="settings-outline" size={24} color="#fff" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Center Controls */}
                                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 50 }} pointerEvents="box-none">
                                        <TouchableOpacity onPress={() => seek(-10)}>
                                            <Ionicons name="play-skip-back" size={32} color="#fff" />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={togglePlay} style={styles.playCenterBtn}>
                                            <Ionicons name={status.isPlaying ? "pause" : "play"} size={45} color="#000" />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => seek(10)}>
                                            <Ionicons name="play-skip-forward" size={32} color="#fff" />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Bottom Bar */}
                                    <View style={{ position: 'absolute', bottom: isFullscreen ? 30 : 5, left: 10, right: 10 }} pointerEvents="box-none">
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Text style={styles.timeLabel}>{formatTime(status.positionMillis)}</Text>
                                            <View style={{ flex: 1, marginHorizontal: 8 }}>
                                                <InteractiveSlider
                                                    value={status.positionMillis || 0}
                                                    maximumValue={status.durationMillis || 0}
                                                    onSeek={(val) => videoRef.current?.setPositionAsync(val)}
                                                />
                                            </View>
                                            <Text style={styles.timeLabel}>
                                                {'-' + formatTime((status.durationMillis || 0) - (status.positionMillis || 0))}
                                            </Text>
                                            <TouchableOpacity onPress={toggleFullscreen} style={{ padding: 8, marginLeft: 5 }}>
                                                <Ionicons name={isFullscreen ? "contract-outline" : "scan-outline"} size={20} color="#fff" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                </Animated.View>

                {/* MINI PLAYER CONTROLS - Always rendered but opacity controlled */}
                {(!isFullscreen) && (
                    <Animated.View style={{
                        position: 'absolute',
                        left: 106, right: 0, top: 0, bottom: 0,
                        flexDirection: 'row', alignItems: 'center',
                        opacity: miniControlsOpacity, // Fade in when dragging down
                        zIndex: isMinimized ? 10 : -1 // Hide clicks when full
                    }}>
                        <TouchableOpacity style={{ flex: 1, paddingLeft: 12 }} onPress={maximizePlayer}>
                            <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }} numberOfLines={1}>{meta.title || videoId}</Text>
                            <Text style={{ color: '#aaa', fontSize: 11 }} numberOfLines={1}>{meta.uploaderName}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={togglePlay} style={{ padding: 10 }}><Ionicons name={status.isPlaying ? "pause" : "play"} size={26} color="#fff" /></TouchableOpacity>
                        <TouchableOpacity onPress={closePlayer} style={{ padding: 10 }}><Ionicons name="close" size={26} color="#fff" /></TouchableOpacity>
                    </Animated.View>
                )}

                {/* FULL PLAYER LIST */}
                {!isMinimized && !isFullscreen && (
                    <Animated.View style={{ flex: 1, opacity: contentOpacity, backgroundColor: '#0F0F0F' }}>
                        <FlatList
                            data={relatedVideos}
                            keyExtractor={(item, index) => item.url + index}
                            ListHeaderComponent={
                                <View style={{ padding: 16 }}>
                                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', lineHeight: 24 }}>{meta.title}</Text>
                                    <Text style={{ color: '#aaa', fontSize: 12, marginTop: 6 }}>{pipedApi.formatViews(meta.views || 0)} lượt xem • {meta.uploadedDate}</Text>

                                    <View style={{ flexDirection: 'row', marginTop: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#222' }}>
                                        <TouchableOpacity style={{ alignItems: 'center', marginRight: 35 }} onPress={() => toggleFavorite(video)}>
                                            <Ionicons name={checkIsFav(videoId) ? 'heart' : 'heart-outline'} size={24} color={checkIsFav(videoId) ? COLORS.primary : '#fff'} />
                                            <Text style={{ color: '#fff', fontSize: 11, marginTop: 4 }}>Thích</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={{ alignItems: 'center', marginRight: 35 }} onPress={() => Alert.alert('Chia sẻ', `https://youtube.com/watch?v=${videoId}`)}>
                                            <Ionicons name="share-social-outline" size={24} color="#fff" />
                                            <Text style={{ color: '#fff', fontSize: 11, marginTop: 4 }}>Chia sẻ</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity style={{ alignItems: 'center', marginRight: 35 }} onPress={handleDownload} disabled={isDownloading}>
                                            {isDownloading ? (
                                                <View style={{ alignItems: 'center' }}>
                                                    <ActivityIndicator size="small" color={COLORS.primary} />
                                                    <Text style={{ color: COLORS.primary, fontSize: 10, marginTop: 4 }}>{Math.round(downloadProgress * 100)}%</Text>
                                                </View>
                                            ) : (
                                                <>
                                                    <Ionicons name={isDownloaded ? "checkmark-circle" : "download-outline"} size={24} color={isDownloaded ? COLORS.primary : "#fff"} />
                                                    <Text style={{ color: isDownloaded ? COLORS.primary : '#fff', fontSize: 11, marginTop: 4 }}>{isDownloaded ? 'Đã tải' : 'Tải về'}</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 15 }}>Tiếp theo</Text>
                                </View>
                            }
                            renderItem={({ item }) => (
                                <TouchableOpacity onPress={() => playVideo(item)} style={{ flexDirection: 'row', marginBottom: 16, paddingHorizontal: 16 }}>
                                    <Image source={{ uri: item.thumbnail }} style={{ width: 140, height: 79, borderRadius: 8, backgroundColor: '#333' }} resizeMode="cover" />
                                    <View style={{ flex: 1, marginLeft: 12, justifyContent: 'center' }}>
                                        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500', lineHeight: 20 }} numberOfLines={2}>{item.title}</Text>
                                        <Text style={{ color: '#aaa', fontSize: 12, marginTop: 4 }} numberOfLines={1}>{item.uploaderName}</Text>
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

            <PlayerSettingsModal
                visible={showSettings}
                onClose={() => setShowSettings(false)}
                qualities={qualities}
                currentQuality={currentQuality}
                onSelectQuality={changeQuality}
                currentSpeed={playbackRate}
                onSelectSpeed={(s) => setPlaybackRate(s)}
                sleepTimer={selectedSleepMinutes}
                onSetSleepTimer={handleSetSleepTimer}
            />

            {/* Sleep Timer Modal */}
            <Modal
                visible={showSleepTimer}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowSleepTimer(false)}
            >
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}
                    activeOpacity={1}
                    onPress={() => setShowSleepTimer(false)}
                >
                    <View style={{
                        backgroundColor: '#1a1a1a',
                        borderRadius: 20,
                        padding: 20,
                        width: '85%',
                        maxWidth: 340
                    }}>
                        {/* Header */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                            <View style={{
                                width: 44, height: 44, borderRadius: 22,
                                backgroundColor: COLORS.primary + '20',
                                justifyContent: 'center', alignItems: 'center',
                                marginRight: 12
                            }}>
                                <Ionicons name="moon" size={22} color={COLORS.primary} />
                            </View>
                            <View>
                                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Hẹn giờ tắt</Text>
                                <Text style={{ color: '#888', fontSize: 13 }}>
                                    {sleepTarget ? `Còn ${formatSleepRemaining()}` : 'Tự động dừng phát'}
                                </Text>
                            </View>
                        </View>

                        {/* Options */}
                        {SLEEP_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingVertical: 14,
                                    borderBottomWidth: 1,
                                    borderBottomColor: '#333'
                                }}
                                onPress={() => selectSleepTimer(option.value)}
                            >
                                <Ionicons
                                    name={selectedSleepMinutes === option.value ? "radio-button-on" : "radio-button-off"}
                                    size={22}
                                    color={selectedSleepMinutes === option.value ? COLORS.primary : '#666'}
                                />
                                <Text style={{
                                    color: selectedSleepMinutes === option.value ? COLORS.primary : '#fff',
                                    fontSize: 16,
                                    marginLeft: 12,
                                    fontWeight: selectedSleepMinutes === option.value ? '600' : '400'
                                }}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}

                        {/* Cancel Timer Button */}
                        {sleepTarget && (
                            <TouchableOpacity
                                style={{
                                    marginTop: 16,
                                    backgroundColor: '#ff444420',
                                    paddingVertical: 14,
                                    borderRadius: 12,
                                    alignItems: 'center'
                                }}
                                onPress={cancelSleepTimer}
                            >
                                <Text style={{ color: '#ff4444', fontSize: 15, fontWeight: '600' }}>
                                    Hủy hẹn giờ
                                </Text>
                            </TouchableOpacity>
                        )}

                        {/* Close Button */}
                        <TouchableOpacity
                            style={{
                                marginTop: 12,
                                paddingVertical: 14,
                                alignItems: 'center'
                            }}
                            onPress={() => setShowSleepTimer(false)}
                        >
                            <Text style={{ color: '#888', fontSize: 15 }}>Đóng</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </Animated.View >
    );
};

export default GlobalPlayer;

const styles = StyleSheet.create({
    tapContainer: {
        ...StyleSheet.absoluteFillObject,
        flexDirection: 'row',
        zIndex: 5,
    },
    tapSide: {
        flex: 1,
    },
    seekIndicator: {
        position: 'absolute',
        top: '40%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
    },
    seekText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 4,
    },
    badge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600'
    },
    playCenterBtn: {
        width: 65,
        height: 65,
        borderRadius: 33,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    timeLabel: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
        minWidth: 45
    }
});
