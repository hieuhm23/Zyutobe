import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
import TrackPlayer from 'react-native-track-player';
import { PlaybackService } from './src/services/trackPlayerService';

registerRootComponent(App);
TrackPlayer.registerPlaybackService(() => PlaybackService);
