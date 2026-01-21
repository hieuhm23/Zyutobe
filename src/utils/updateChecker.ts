import * as Updates from 'expo-updates';
import { Alert } from 'react-native';

export interface UpdateCheckResult {
    hasUpdate: boolean;
    error?: string;
}

/**
 * Check if there's an OTA update available
 * Returns result object instead of showing alert
 */
export const checkForUpdateSilent = async (): Promise<UpdateCheckResult> => {
    try {
        // Only check in production builds
        if (__DEV__) {
            return { hasUpdate: false };
        }

        const update = await Updates.checkForUpdateAsync();
        return { hasUpdate: update.isAvailable };
    } catch (e) {
        console.error('Error checking for updates:', e);
        return { hasUpdate: false, error: String(e) };
    }
};

/**
 * Check for OTA updates with alert UI
 */
export const checkForUpdates = async (showNoUpdateMessage = false) => {
    try {
        // Only check in production builds
        if (__DEV__) {
            if (showNoUpdateMessage) {
                Alert.alert('Chế độ phát triển', 'Kiểm tra cập nhật chỉ hoạt động trong bản build chính thức.');
            }
            return false;
        }

        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
            return true; // Let the modal handle it
        } else if (showNoUpdateMessage) {
            Alert.alert('✅ Đã cập nhật', 'Bạn đang sử dụng phiên bản mới nhất của ZyTube!');
        }
        return false;
    } catch (e: any) {
        console.error('Error checking for updates:', e);
        if (showNoUpdateMessage) {
            Alert.alert('Lỗi OTA', `Không thể kiểm tra bản cập nhật.\n\nChi tiết: ${e.message || String(e)}`);
        }
        return false;
    }
};

/**
 * Fetch and apply update
 */
export const applyUpdate = async (): Promise<boolean> => {
    try {
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
        return true;
    } catch (e) {
        console.error('Error applying update:', e);
        return false;
    }
};

/**
 * Get current update info
 */
export const getUpdateInfo = () => {
    if (__DEV__) {
        return {
            isEmbeddedLaunch: true,
            updateId: 'development',
            channel: 'development'
        };
    }

    return {
        isEmbeddedLaunch: Updates.isEmbeddedLaunch,
        updateId: Updates.updateId,
        channel: Updates.channel
    };
};
