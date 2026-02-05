import TrackPlayer, { Event } from 'react-native-track-player';
import { DeviceEventEmitter } from 'react-native';

export const PlaybackService = async function () {
    TrackPlayer.addEventListener(Event.RemotePlay, () => {
        TrackPlayer.play();
        DeviceEventEmitter.emit('tp-play');
    });
    TrackPlayer.addEventListener(Event.RemotePause, () => {
        TrackPlayer.pause();
        DeviceEventEmitter.emit('tp-pause');
    });
    TrackPlayer.addEventListener(Event.RemoteNext, () => {
        DeviceEventEmitter.emit('tp-next');
    });
    TrackPlayer.addEventListener(Event.RemotePrevious, () => {
        DeviceEventEmitter.emit('tp-prev');
    });
    TrackPlayer.addEventListener(Event.RemoteStop, () => {
        TrackPlayer.reset();
        DeviceEventEmitter.emit('tp-stop');
    });
    TrackPlayer.addEventListener(Event.RemoteSeek, (event) => {
        TrackPlayer.seekTo(event.position);
        DeviceEventEmitter.emit('tp-seek', event.position);
    });
};
