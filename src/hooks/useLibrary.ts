import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VideoItem } from '../services/pipedApi';

export const useLibrary = () => {
    const [favorites, setFavorites] = useState<VideoItem[]>([]);
    const [history, setHistory] = useState<VideoItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const favStr = await AsyncStorage.getItem('favorites');
            const histStr = await AsyncStorage.getItem('history');

            if (favStr) setFavorites(JSON.parse(favStr));
            if (histStr) setHistory(JSON.parse(histStr));
        } catch (error) {
            console.error('Error loading library:', error);
        } finally {
            setLoading(false);
        }
    };

    const addToHistory = async (video: VideoItem) => {
        try {
            const newHistory = [video, ...history.filter(v => v.url !== video.url)].slice(0, 50);
            setHistory(newHistory);
            await AsyncStorage.setItem('history', JSON.stringify(newHistory));
        } catch (error) {
            console.error('Error saving history:', error);
        }
    };

    const toggleFavorite = async (video: VideoItem) => {
        try {
            const isFav = favorites.some(v => v.url === video.url);
            let newFavorites;
            if (isFav) {
                newFavorites = favorites.filter(v => v.url !== video.url);
            } else {
                newFavorites = [video, ...favorites];
            }
            setFavorites(newFavorites);
            await AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
            return !isFav;
        } catch (error) {
            console.error('Error saving favorite:', error);
            return false;
        }
    };

    const isFavorite = (videoId: string) => {
        // Piped url format is /watch?v=VIDEO_ID
        return favorites.some(v => v.url?.includes(videoId));
    };

    const clearHistory = async () => {
        try {
            setHistory([]);
            await AsyncStorage.removeItem('history');
        } catch (e) { console.error(e); }
    };

    const clearFavorites = async () => {
        try {
            setFavorites([]);
            await AsyncStorage.removeItem('favorites');
        } catch (e) { console.error(e); }
    };

    return {
        favorites,
        history,
        loading,
        addToHistory,
        toggleFavorite,
        isFavorite,
        clearHistory,
        clearFavorites,
        refreshLibrary: loadData
    };
};
