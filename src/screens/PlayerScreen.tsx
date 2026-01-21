import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { usePlayer } from '../context/PlayerContext';

const PlayerScreen = ({ route, navigation }: any) => {
    const { videoId, video } = route.params || {};
    const { playVideo } = usePlayer();

    useEffect(() => {
        if (video) {
            playVideo(video); // Hand over to GlobalPlayer
            navigation.goBack(); // Close this screen
        } else if (videoId) {
            // Fallback object if only ID passed
            playVideo({ url: `/watch?v=${videoId}`, title: 'Loading...', type: 'video', thumbnail: '', uploaderName: '' } as any);
            navigation.goBack();
        } else {
            navigation.goBack();
        }
    }, [videoId, video]);

    return (
        <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#00D26A" />
        </View>
    );
};

export default PlayerScreen;
