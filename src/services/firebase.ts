// Firebase Config for ZyTube
// Sử dụng @react-native-firebase (native SDK)
// Auto-init từ GoogleService-Info.plist (iOS) / google-services.json (Android)

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Export instances
export const firebaseAuth = auth();
export const firestoreDb = firestore();

// Collections
export const COLLECTIONS = {
    users: 'users',
    watchHistory: 'watchHistory',
    playlists: 'playlists',
    favorites: 'favorites',
} as const;

export { auth, firestore };
