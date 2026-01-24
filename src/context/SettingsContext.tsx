import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsContextType {
    autoPlay: boolean;
    backgroundPlay: boolean;
    autoPiP: boolean;
    videoQuality: string;
    region: string;
    toggleAutoPlay: () => void;
    toggleBackgroundPlay: () => void;
    toggleAutoPiP: () => void;
    setVideoQuality: (quality: string) => void;
    setRegion: (region: string) => void;
    sponsorBlockEnabled: boolean;
    toggleSponsorBlock: () => void;
    clearCache: () => Promise<{ success: boolean; size: string }>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
    const [autoPlay, setAutoPlay] = useState(true);
    const [backgroundPlay, setBackgroundPlay] = useState(true);
    const [autoPiP, setAutoPiP] = useState(true);
    const [videoQuality, setVideoQualityState] = useState('720p');
    const [region, setRegionState] = useState('VN');
    const [sponsorBlockEnabled, setSponsorBlockEnabled] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const keys = ['setting_autoPlay', 'setting_backgroundPlay', 'setting_autoPiP', 'setting_videoQuality', 'setting_region', 'setting_sponsorBlockEnabled'];
            const stores = await AsyncStorage.multiGet(keys);

            const valAutoPlay = stores[0][1];
            const valBgPlay = stores[1][1];
            const valPiP = stores[2][1];
            const valQuality = stores[3][1];
            const valRegion = stores[4][1];
            const valSponsorBlock = stores[5][1];

            if (valAutoPlay !== null) setAutoPlay(valAutoPlay === 'true');
            if (valBgPlay !== null) setBackgroundPlay(valBgPlay === 'true');
            if (valPiP !== null) setAutoPiP(valPiP === 'true');
            if (valQuality !== null) setVideoQualityState(valQuality);
            if (valRegion !== null) setRegionState(valRegion);
            if (valSponsorBlock !== null) setSponsorBlockEnabled(valSponsorBlock === 'true');

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

    const setRegion = async (newRegion: string) => {
        setRegionState(newRegion);
        await AsyncStorage.setItem('setting_region', newRegion);
    };

    const toggleSponsorBlock = async () => {
        const newValue = !sponsorBlockEnabled;
        setSponsorBlockEnabled(newValue);
        await AsyncStorage.setItem('setting_sponsorBlockEnabled', String(newValue));
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
            region,
            toggleAutoPlay,
            toggleBackgroundPlay,
            toggleAutoPiP,
            setVideoQuality,
            setRegion,
            sponsorBlockEnabled,
            toggleSponsorBlock,
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
