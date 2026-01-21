import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsContextType {
    autoPlay: boolean;
    backgroundPlay: boolean;
    autoPiP: boolean;
    videoQuality: string;
    toggleAutoPlay: () => void;
    toggleBackgroundPlay: () => void;
    toggleAutoPiP: () => void;
    setVideoQuality: (quality: string) => void;
    clearCache: () => Promise<{ success: boolean; size: string }>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
    const [autoPlay, setAutoPlay] = useState(true);
    const [backgroundPlay, setBackgroundPlay] = useState(true);
    const [autoPiP, setAutoPiP] = useState(false);
    const [videoQuality, setVideoQualityState] = useState('720p');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const keys = ['setting_autoPlay', 'setting_backgroundPlay', 'setting_autoPiP', 'setting_videoQuality'];
            const stores = await AsyncStorage.multiGet(keys);

            const valAutoPlay = stores[0][1];
            const valBgPlay = stores[1][1];
            const valPiP = stores[2][1];
            const valQuality = stores[3][1];

            if (valAutoPlay !== null) setAutoPlay(valAutoPlay === 'true');
            if (valBgPlay !== null) setBackgroundPlay(valBgPlay === 'true');
            if (valPiP !== null) setAutoPiP(valPiP === 'true');
            if (valQuality !== null) setVideoQualityState(valQuality);

        } catch (e) {
            console.error("Failed to load settings", e);
        }
    };

    const toggleAutoPlay = async () => {
        const newValue = !autoPlay;
        setAutoPlay(newValue);
        await AsyncStorage.setItem('setting_autoPlay', String(newValue));
    };

    const toggleBackgroundPlay = async () => {
        const newValue = !backgroundPlay;
        setBackgroundPlay(newValue);
        await AsyncStorage.setItem('setting_backgroundPlay', String(newValue));
    };

    const toggleAutoPiP = async () => {
        const newValue = !autoPiP;
        setAutoPiP(newValue);
        await AsyncStorage.setItem('setting_autoPiP', String(newValue));
    };

    const setVideoQuality = async (quality: string) => {
        setVideoQualityState(quality);
        await AsyncStorage.setItem('setting_videoQuality', quality);
    };

    const clearCache = async (): Promise<{ success: boolean; size: string }> => {
        try {
            const allKeys = await AsyncStorage.getAllKeys();
            const cacheKeys = allKeys.filter(key => key.startsWith('yt_cache_'));

            if (cacheKeys.length > 0) {
                await AsyncStorage.multiRemove(cacheKeys);
            }

            return { success: true, size: `${cacheKeys.length} mục` };
        } catch (e) {
            console.error("Failed to clear cache", e);
            return { success: false, size: '0 MB' };
        }
    };

    return (
        <SettingsContext.Provider value={{
            autoPlay,
            backgroundPlay,
            autoPiP,
            videoQuality,
            toggleAutoPlay,
            toggleBackgroundPlay,
            toggleAutoPiP,
            setVideoQuality,
            clearCache
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) throw new Error('useSettings must be used within a SettingsProvider');
    return context;
};
