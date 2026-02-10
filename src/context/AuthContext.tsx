import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Alert } from 'react-native';
import { COLLECTIONS } from '../services/firebase';

// Configure Google Sign-In
GoogleSignin.configure({
    // Lấy webClientId từ Firebase Console > Authentication > Sign-in method > Google
    // Hoặc từ google-services.json (Android) / GoogleService-Info.plist (iOS)
    scopes: ['profile', 'email'],
});

interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    createdAt: Date;
    lastLoginAt: Date;
}

interface AuthContextType {
    user: FirebaseAuthTypes.User | null;
    userProfile: UserProfile | null;
    isLoading: boolean;
    isSigningIn: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSigningIn, setIsSigningIn] = useState(false);

    // Listen to auth state changes
    useEffect(() => {
        const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                // Fetch or create user profile in Firestore
                await syncUserProfile(firebaseUser);
            } else {
                setUserProfile(null);
            }

            setIsLoading(false);
        });

        return unsubscribe;
    }, []);

    const syncUserProfile = async (firebaseUser: FirebaseAuthTypes.User) => {
        try {
            const userRef = firestore().collection(COLLECTIONS.users).doc(firebaseUser.uid);
            const userDoc = await userRef.get();
            const existingData = userDoc.data();

            const profile: UserProfile = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                createdAt: existingData?.createdAt ? existingData.createdAt.toDate() : new Date(),
                lastLoginAt: new Date(),
            };

            // Merge (create if not exists, update if exists)
            await userRef.set({
                ...profile,
                createdAt: existingData?.createdAt ?? firestore.FieldValue.serverTimestamp(),
                lastLoginAt: firestore.FieldValue.serverTimestamp(),
            }, { merge: true });

            setUserProfile(profile);
        } catch (error) {
            console.error('Error syncing user profile:', error);
        }
    };

    // Google Sign-In
    const signInWithGoogle = useCallback(async () => {
        try {
            setIsSigningIn(true);

            // Check Google Play Services (Android)
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

            // Trigger Google Sign-In flow
            const signInResult = await GoogleSignin.signIn();

            // Get the ID token
            const idToken = signInResult?.data?.idToken;
            if (!idToken) {
                throw new Error('Không lấy được ID token từ Google');
            }

            // Create Firebase credential
            const googleCredential = auth.GoogleAuthProvider.credential(idToken);

            // Sign in to Firebase
            await auth().signInWithCredential(googleCredential);

        } catch (error: any) {
            console.error('Google Sign-In Error:', error);

            // Handle specific errors
            if (error.code === 'SIGN_IN_CANCELLED') {
                // User cancelled - do nothing
                return;
            }

            Alert.alert(
                'Lỗi đăng nhập',
                'Không thể đăng nhập bằng Google. Vui lòng thử lại.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsSigningIn(false);
        }
    }, []);

    // Sign Out
    const signOut = useCallback(async () => {
        try {
            await GoogleSignin.signOut();
            await auth().signOut();
            setUserProfile(null);
        } catch (error) {
            console.error('Sign-Out Error:', error);
            Alert.alert('Lỗi', 'Không thể đăng xuất. Vui lòng thử lại.');
        }
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            userProfile,
            isLoading,
            isSigningIn,
            signInWithGoogle,
            signOut,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
