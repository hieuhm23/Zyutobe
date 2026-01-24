import axios from 'axios';

export interface SponsorSegment {
    category: string;
    segment: [number, number]; // [startTime, endTime]
    UUID: string;
}

const BASE_URL = 'https://sponsor.ajay.app/api/skipSegments';

// Categories to skip
const CATEGORIES = [
    'sponsor',
    'intro',
    'outro',
    'selfpromo',
    'interaction', // Subscribe reminders
    'music_offtopic' // Non-music parts in music videos
];

export const getSkipSegments = async (videoId: string): Promise<SponsorSegment[]> => {
    try {
        const response = await axios.get(BASE_URL, {
            params: {
                videoID: videoId,
                categories: JSON.stringify(CATEGORIES)
            },
            timeout: 5000 // Short timeout to not delay playback
        });

        if (response.status === 200 && Array.isArray(response.data)) {
            return response.data;
        }
        return [];
    } catch (error) {
        // 404 means no segments found, which is normal
        return [];
    }
};
