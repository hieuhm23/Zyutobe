import { registerRootComponent } from 'expo';
import { AppRegistry } from 'react-native';
import TrackPlayer from 'react-native-track-player';
import App from './App';
import { PlaybackService } from './src/services/trackPlayerService';

registerRootComponent(App);
TrackPlayer.registerPlaybackService(() => PlaybackService);
