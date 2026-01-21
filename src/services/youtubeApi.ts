import AsyncStorage from '@react-native-async-storage/async-storage';
import { VideoItem, StreamInfo, StreamSource, Subtitle, SearchResult, TrendingItem } from './pipedApi';

// PRIMARY KEY (Backup keys can be added here)
const API_KEYS = [
    'AIzaSyCyIW5vnpaIM5LbBEu8I1m4ne-CQQT-72A', // Newest Key
    'AIzaSyDstD_eS5dpsmb9kdLtnmrW_GYF4pDehes', // Backup
];
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

import pipedApi from './pipedApi'; // Fallback Source

const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 Hours

// Helper for calling API
async function fetchYouTube(endpoint: string, params: Record<string, string>, forceRefresh: boolean = false) {
    const cacheKey = `yt_cache_${endpoint}_${JSON.stringify(params)}`;

    // 1. Try Cache
    if (!forceRefresh) {
        try {
            const cached = await AsyncStorage.getItem(cacheKey);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Date.now() - parsed.timestamp < CACHE_TTL) {
                    console.log('Returning CACHED result for:', endpoint);
                    return parsed.data;
                }
            }
        } catch (e) {
            console.warn('Cache read error:', e);
        }
    }

    // 2. Try Network
    const query = new URLSearchParams({
        key: API_KEYS[0],
        ...params
    }).toString();

    console.log(`Fetching YouTube API: ${endpoint}`);
    const response = await fetch(`${BASE_URL}${endpoint}?${query}`);

    if (!response.ok) {
        // If Quota Exceeded (403), throw specific error to trigger fallback
        if (response.status === 403) {
            console.warn('YouTube API Quota Exceeded. Switching to Piped API fallback.');
            throw new Error('QUOTA_EXCEEDED');
        }
        const errorText = await response.text();
        console.warn('YouTube API Error Detail:', errorText);
        throw new Error(`YouTube API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // 3. Save to Cache
    try {
        await AsyncStorage.setItem(cacheKey, JSON.stringify({
            timestamp: Date.now(),
            data: data
        }));
    } catch (e) {
        console.warn('Cache write error:', e);
    }

    return data;
}

// Convert YouTube API Response to our App's Interface
const mapYouTubeItemToVideoItem = (item: any): VideoItem => {
    const snippet = item.snippet;
    const statistics = item.statistics;

    let id = item.id;
    let type = 'video';

    if (item.id && item.id.kind) {
        if (item.id.kind === 'youtube#video') {
            id = item.id.videoId;
            type = 'video';
        } else if (item.id.kind === 'youtube#channel') {
            id = item.id.channelId;
            type = 'channel';
        } else if (item.id.kind === 'youtube#playlist') {
            id = item.id.playlistId;
            type = 'playlist';
        }
    } else if (item.kind && item.kind === 'youtube#video') {
        id = item.id;
        type = 'video';
    }

    return {
        url: type === 'channel' ? `/channel/${id}` : (type === 'playlist' ? `/playlist?list=${id}` : `/watch?v=${id}`),
        type,
        title: snippet.title,
        thumbnail: snippet.thumbnails.high?.url || snippet.thumbnails.medium?.url || snippet.thumbnails.default?.url,
        uploaderName: snippet.channelTitle,
        uploaderUrl: `/channel/${snippet.channelId}`,
        uploaderAvatar: '',
        uploadedDate: new Date(snippet.publishedAt).toLocaleDateString(),
        duration: 0,
        views: statistics ? parseInt(statistics.viewCount) : 0,
        uploaded: new Date(snippet.publishedAt).getTime(),
        uploaderVerified: false,
        isShort: false,
    };
};

// Helper to batch fetch channel avatars
async function fetchChannelAvatars(items: VideoItem[]): Promise<VideoItem[]> {
    try {
        const channelIds = Array.from(new Set(items.map(item => {
            const parts = item.uploaderUrl?.split('/');
            return parts ? parts[parts.length - 1] : null;
        }).filter(id => id)));

        if (channelIds.length === 0) return items;

        const chunks = [];
        for (let i = 0; i < channelIds.length; i += 50) {
            chunks.push(channelIds.slice(i, i + 50));
        }

        const avatarMap = new Map<string, string>();

        await Promise.all(chunks.map(async (chunk) => {
            const data = await fetchYouTube('/channels', {
                part: 'snippet',
                id: chunk.join(',')
            });
            if (data.items) {
                data.items.forEach((ch: any) => {
                    avatarMap.set(ch.id, ch.snippet.thumbnails.default?.url);
                });
            }
        }));

        return items.map(item => {
            const id = item.uploaderUrl?.split('/').pop();
            if (id && avatarMap.has(id)) {
                return { ...item, uploaderAvatar: avatarMap.get(id) };
            }
            return item;
        });
    } catch (e) {
        console.warn('Error fetching avatars:', e);
        return items;
    }
}

export const youtubeApi = {
    // Search videos
    search: async (query: string, filter: string = 'video'): Promise<SearchResult> => {
        let typeParam = 'video';
        if (filter === 'channels') typeParam = 'channel';
        if (filter === 'playlists') typeParam = 'playlist';

        const data = await fetchYouTube('/search', {
            part: 'snippet',
            q: query,
            type: typeParam,
            maxResults: '20',
        });

        let items = data.items.map(mapYouTubeItemToVideoItem);
        items = await fetchChannelAvatars(items);

        return {
            items,
            nextPageToken: data.nextPageToken,
        };
    },

    // Search next page
    searchNextPage: async (query: string, nextpage: string, filter: string = 'video'): Promise<SearchResult> => {
        let typeParam = 'video';
        if (filter === 'channels') typeParam = 'channel';
        if (filter === 'playlists') typeParam = 'playlist';

        const data = await fetchYouTube('/search', {
            part: 'snippet',
            q: query,
            type: typeParam,
            pageToken: nextpage,
            maxResults: '20',
        });

        let items = data.items.map(mapYouTubeItemToVideoItem);
        items = await fetchChannelAvatars(items);

        return {
            items,
            nextPageToken: data.nextPageToken,
        };
    },

    // Get video details (mocking StreamInfo for metadata)
    getStream: async (videoId: string): Promise<StreamInfo> => {
        try {
            // 1. Get Video Details
            const videoData = await fetchYouTube('/videos', {
                part: 'snippet,statistics,contentDetails',
                id: videoId
            });

            if (!videoData.items || videoData.items.length === 0) throw new Error('Video not found');
            const item = videoData.items[0];
            const snippet = item.snippet;
            const statistics = item.statistics;

            // 3. Get Related Videos
            let relatedStreams: VideoItem[] = [];
            let relatedNextPageToken: string | null = null;
            try {
                const relatedData = await fetchYouTube('/search', {
                    part: 'snippet',
                    q: snippet.title,
                    type: 'video',
                    maxResults: '15'
                });
                relatedStreams = relatedData.items.map(mapYouTubeItemToVideoItem);
                relatedStreams = await fetchChannelAvatars(relatedStreams);
                relatedNextPageToken = relatedData.nextPageToken || null;
            } catch (e) {
                console.warn('Failed to fetch related videos:', e);
            }

            return {
                title: snippet.title,
                description: snippet.description,
                uploadDate: new Date(snippet.publishedAt).toLocaleDateString(),
                uploader: snippet.channelTitle,
                uploaderUrl: `/channel/${snippet.channelId}`,
                uploaderAvatar: 'https://www.gravatar.com/avatar/default?d=mp',
                thumbnailUrl: snippet.thumbnails.high?.url,
                duration: 0,
                hls: null, // Required by interface
                views: parseInt(statistics.viewCount),
                videoStreams: [],
                audioStreams: [],
                relatedStreams,
                relatedNextPageToken,
            };
        } catch (error: any) {
            console.error('YouTube API Error in getStream:', error);
            throw error;
        }
    },

    // Get trending videos
    getTrending: async (region: string = 'VN', nextPageToken?: string, forceRefresh: boolean = false): Promise<SearchResult> => {
        try {
            const params: any = {
                part: 'snippet,statistics',
                chart: 'mostPopular',
                regionCode: region,
                maxResults: '20',
            };
            if (nextPageToken) params.pageToken = nextPageToken;

            const data = await fetchYouTube('/videos', params, forceRefresh);

            let items = data.items.map(mapYouTubeItemToVideoItem);
            items = await fetchChannelAvatars(items);

            return {
                items,
                nextPageToken: data.nextPageToken
            };
        } catch (error: any) {
            console.error('YouTube API Error in getTrending:', error);
            throw error;
        }
    },

    // Helpers
    formatDuration: (seconds: number): string => {
        if (!seconds) return '';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
    },

    formatViews: (views: number): string => {
        if (views >= 1000000000) return (views / 1000000000).toFixed(1) + 'B';
        if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
        if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
        return views.toString();
    }
};

export default youtubeApi;
