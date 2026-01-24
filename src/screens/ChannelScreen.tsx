import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    FlatList,
    Dimensions,
    Animated,
    StatusBar,
    Alert
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, SPACING, FONTS } from '../constants/theme';
import youtubeApi from '../services/youtubeApi';
import pipedApi from '../services/pipedApi';
import { usePlayer } from '../context/PlayerContext';
import VideoCard from '../components/VideoCard';

const { width } = Dimensions.get('window');
const BANNER_HEIGHT = width * 0.28; // ~3.5:1 ratio
const HEADER_HEIGHT = 60;

const ChannelScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { playVideo } = usePlayer();
    const { channelId, channelData } = route.params as any; // Allow passing pre-loaded data

    // State
    const [channel, setChannel] = useState<any>(channelData || null);
    const [videos, setVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [activeTab, setActiveTab] = useState<'videos' | 'about'>('videos');

    // Animation
    const scrollY = useRef(new Animated.Value(0)).current;

    const actualChannelId = channelId || (channelData?.url ? channelData.url.split('/').pop() : null);

    useEffect(() => {
        if (!actualChannelId) return;
        fetchChannelData();
    }, [actualChannelId]);

    const fetchChannelData = async () => {
        setLoading(true);
        try {
            // Parallel fetch: Channel Info & Videos
            const [info, vids] = await Promise.all([
                youtubeApi.getChannel(actualChannelId),
                youtubeApi.getChannelVideos(actualChannelId)
            ]);

            setChannel(info);
            setVideos(vids.items);
            setNextPageToken(vids.nextPageToken || null);
        } catch (error) {
            console.error(error);
            Alert.alert('Lỗi', 'Không thể tải thông tin kênh.');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const loadMoreVideos = async () => {
        if (loadingMore || !nextPageToken) return;
        setLoadingMore(true);
        try {
            const res = await youtubeApi.getChannelVideos(actualChannelId, nextPageToken);
            setVideos(prev => [...prev, ...res.items]);
            setNextPageToken(res.nextPageToken || null);
        } catch (error) {
            console.warn(error);
        } finally {
            setLoadingMore(false);
        }
    };

    const toggleSubscribe = () => {
        setIsSubscribed(!isSubscribed);
        Alert.alert(isSubscribed ? 'Đã hủy đăng ký' : 'Đã đăng ký',
            isSubscribed ? `Đã hủy nhận thông báo từ ${channel.title}` : `Bạn sẽ nhận được thông báo từ ${channel.title}`
        );
    };

    const renderHeader = () => {
        if (!channel) return null;

        const bannerOpacity = scrollY.interpolate({
            inputRange: [0, BANNER_HEIGHT],
            outputRange: [1, 0],
            extrapolate: 'clamp',
        });

        const headerTranslate = scrollY.interpolate({
            inputRange: [0, BANNER_HEIGHT],
            outputRange: [0, -BANNER_HEIGHT / 2],
            extrapolate: 'clamp',
        });

        return (
            <View style={styles.headerContainer}>
                {/* BANNER */}
                <Animated.View style={[styles.bannerWrapper, { opacity: bannerOpacity, transform: [{ translateY: headerTranslate }] }]}>
                    {channel.banner ? (
                        <Image source={{ uri: channel.banner }} style={styles.banner} contentFit="cover" />
                    ) : (
                        <View style={[styles.banner, { backgroundColor: COLORS.primary }]} />
                    )}
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />
                </Animated.View>

                {/* INFO */}
                <View style={styles.channelInfo}>
                    <View style={styles.avatarRow}>
                        <Image source={{ uri: channel.avatar }} style={styles.avatar} contentFit="cover" />
                        <View style={{ flex: 1, justifyContent: 'center' }}>
                            <Text style={styles.channelTitle} numberOfLines={1}>{channel.title}</Text>
                            <Text style={styles.channelStats}>
                                {channel.customUrl || '@user'} • {pipedApi.formatViews(channel.subscribers)} người đăng ký • {channel.videos} video
                            </Text>
                        </View>
                    </View>

                    {/* ACTION BUTTONS */}
                    <TouchableOpacity
                        style={[styles.subscribeBtn, isSubscribed && styles.subscribedBtn]}
                        onPress={toggleSubscribe}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.subscribeText, isSubscribed && { color: COLORS.textPrimary }]}>
                            {isSubscribed ? 'Đã đăng ký' : 'Đăng ký'}
                        </Text>
                        <Ionicons name={isSubscribed ? "notifications-off-outline" : "notifications-outline"} size={18} color={isSubscribed ? COLORS.textPrimary : "#000"} />
                    </TouchableOpacity>

                    {/* DESCRIPTION PREVIEW */}
                    {activeTab === 'about' && (
                        <Text style={styles.description}>{channel.description}</Text>
                    )}
                </View>

                {/* TABS */}
                <View style={styles.tabBar}>
                    <TouchableOpacity onPress={() => setActiveTab('videos')} style={[styles.tab, activeTab === 'videos' && styles.activeTab]}>
                        <Text style={[styles.tabText, activeTab === 'videos' && styles.activeTabText]}>Video</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab('about')} style={[styles.tab, activeTab === 'about' && styles.activeTab]}>
                        <Text style={[styles.tabText, activeTab === 'about' && styles.activeTabText]}>Giới thiệu</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    if (loading && !channel) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* Custom Navbar */}
            <View style={[styles.navBar, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Animated.Text style={[styles.navTitle, { opacity: scrollY.interpolate({ inputRange: [BANNER_HEIGHT, BANNER_HEIGHT + 50], outputRange: [0, 1] }) }]}>
                    {channel?.title}
                </Animated.Text>
            </View>

            {/* Content */}
            <Animated.FlatList
                data={activeTab === 'videos' ? videos : []}
                keyExtractor={(item) => item.url}
                renderItem={({ item }) => <VideoCard video={item} onPress={playVideo} showAvatar={false} />}
                ListHeaderComponent={renderHeader}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
                contentContainerStyle={{ paddingTop: 60 }} // Space for Navbar
                onEndReached={activeTab === 'videos' ? loadMoreVideos : null}
                onEndReachedThreshold={0.5}
                ListFooterComponent={loadingMore ? <ActivityIndicator color={COLORS.primary} style={{ margin: 20 }} /> : <View style={{ height: 100 }} />}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    navBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 80, // Approximate safe height
        zIndex: 100,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent
    },
    backBtn: {
        padding: 5,
        marginRight: 15,
    },
    navTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
    },
    headerContainer: {
        backgroundColor: COLORS.background,
        marginBottom: 10,
    },
    bannerWrapper: {
        height: BANNER_HEIGHT,
        width: '100%',
        backgroundColor: '#333',
    },
    banner: {
        width: '100%',
        height: '100%',
    },
    channelInfo: {
        padding: 16,
    },
    avatarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 2,
        borderColor: COLORS.background,
        marginRight: 12,
    },
    channelTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    channelStats: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
    subscribeBtn: {
        backgroundColor: '#fff',
        paddingVertical: 10,
        borderRadius: 20,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 10,
        gap: 8,
    },
    subscribedBtn: {
        backgroundColor: '#333',
        borderWidth: 1,
        borderColor: '#555',
    },
    subscribeText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 14,
    },
    description: {
        color: COLORS.textSecondary,
        fontSize: 13,
        lineHeight: 18,
        marginTop: 10,
    },
    tabBar: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#222',
        marginTop: 5,
    },
    tab: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#fff',
    },
    tabText: {
        color: COLORS.textSecondary,
        fontWeight: '600',
        fontSize: 15,
        textTransform: 'uppercase',
    },
    activeTabText: {
        color: '#fff',
    },
});

export default ChannelScreen;
