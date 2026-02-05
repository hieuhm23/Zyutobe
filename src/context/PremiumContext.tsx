import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PremiumContextType {
    isPremium: boolean;
    activatePremium: (code: string) => Promise<boolean>;
    checkStatus: () => Promise<void>;
    expiryDate: string | null;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export const PremiumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isPremium, setIsPremium] = useState(false);
    const [expiryDate, setExpiryDate] = useState<string | null>(null);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const status = await AsyncStorage.getItem('@premium_status');
            const expiry = await AsyncStorage.getItem('@premium_expiry');

            if (status === 'active') {
                // If there's an expiry date, check if it's passed
                if (expiry && expiry !== 'LIFETIME') {
                    const now = new Date();
                    const expDate = new Date(parseInt(expiry));

                    if (now > expDate) {
                        // Expired -> Downgrade
                        await AsyncStorage.setItem('@premium_status', 'inactive');
                        await AsyncStorage.removeItem('@premium_expiry');
                        setIsPremium(false);
                        setExpiryDate(null);
                        return;
                    }
                    setExpiryDate(expDate.toLocaleDateString('vi-VN'));
                } else if (expiry === 'LIFETIME') {
                    setExpiryDate('Vĩnh viễn');
                }
                setIsPremium(true);
            } else {
                setIsPremium(false);
                setExpiryDate(null);
            }
        } catch (e) {
            console.error('Failed to check premium status', e);
        }
    };

    const activatePremium = async (code: string) => {
        const cleanCode = code.toUpperCase().trim();
        let duration = 0; // 0 = fail
        let type = '';

        // DEFINED CODES
        if (cleanCode === 'VIP-1M') {
            duration = 30 * 24 * 60 * 60 * 1000; // 30 days
            type = 'LIMITED';
        } else if (cleanCode === 'VIP-1Y') {
            duration = 365 * 24 * 60 * 60 * 1000; // 365 days
            type = 'LIMITED';
        } else if (['VIP-LIFETIME', 'ADMIN-2024'].includes(cleanCode)) {
            type = 'LIFETIME';
        }

        if (type !== '') {
            await AsyncStorage.setItem('@premium_status', 'active');

            if (type === 'LIFETIME') {
                await AsyncStorage.setItem('@premium_expiry', 'LIFETIME');
                setExpiryDate('Vĩnh viễn');
            } else {
                const newExpiry = Date.now() + duration;
                await AsyncStorage.setItem('@premium_expiry', String(newExpiry));
                setExpiryDate(new Date(newExpiry).toLocaleDateString('vi-VN'));
            }

            setIsPremium(true);
            return true;
        }
        return false;
    };

    return (
        <PremiumContext.Provider value={{ isPremium, activatePremium, checkStatus, expiryDate }}>
            {children}
        </PremiumContext.Provider>
    );
};

export const usePremium = () => {
    const context = useContext(PremiumContext);
    if (!context) {
        throw new Error('usePremium must be used within a PremiumProvider');
    }
    return context;
};
