import React, { createContext, useState, useContext, ReactNode } from 'react';
import { VideoItem } from '../services/pipedApi';

interface PlayerContextType {
    video: VideoItem | null;
    videoId: string | null;
    isMinimized: boolean;
    isPlaying: boolean;
    playVideo: (video: VideoItem) => void;
    minimizePlayer: () => void;
    maximizePlayer: () => void;
    closePlayer: () => void;
    togglePlay: () => void;
    setIsPlaying: (playing: boolean) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
    const [video, setVideo] = useState<VideoItem | null>(null);
    const [videoId, setVideoId] = useState<string | null>(null);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    const playVideo = (newVideo: VideoItem) => {
        const vId = newVideo.url?.replace('/watch?v=', '') || '';
        setVideo(newVideo);
        setVideoId(vId);
        setIsMinimized(false);
        setIsPlaying(true);
    };

    const minimizePlayer = () => {
        setIsMinimized(true);
    };

    const maximizePlayer = () => {
        setIsMinimized(false);
    };

    const closePlayer = () => {
        setVideo(null);
        setVideoId(null);
        setIsPlaying(false);
    };

    const togglePlay = () => {
        setIsPlaying(prev => !prev);
    };

    return (
        <PlayerContext.Provider value={{
            video,
            videoId,
            isMinimized,
            isPlaying,
            playVideo,
            minimizePlayer,
            maximizePlayer,
            closePlayer,
            togglePlay,
            setIsPlaying,
        }}>
            {children}
        </PlayerContext.Provider>
    );
};

export const usePlayer = () => {
    const context = useContext(PlayerContext);
    if (!context) throw new Error('usePlayer must be used within a PlayerProvider');
    return context;
};
