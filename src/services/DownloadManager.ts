import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VideoItem } from './pipedApi';
import { Alert } from 'react-native';

const DOWNLOAD_FOLDER = FileSystem.documentDirectory + 'downloads/';
const METADATA_KEY = 'downloaded_videos_metadata';

export interface DownloadedVideo extends VideoItem {
    localUri: string;
    downloadDate: string;
    fileSize?: number;
}

class DownloadManager {
    constructor() {
        this.ensureDownloadFolder();
    }

    private async ensureDownloadFolder() {
        const info = await FileSystem.getInfoAsync(DOWNLOAD_FOLDER);
        if (!info.exists) {
            await FileSystem.makeDirectoryAsync(DOWNLOAD_FOLDER, { intermediates: true });
        }
    }

    async getDownloads(): Promise<DownloadedVideo[]> {
        try {
            const json = await AsyncStorage.getItem(METADATA_KEY);
            return json ? JSON.parse(json) : [];
        } catch (error) {
            console.error('Error fetching downloads:', error);
            return [];
        }
    }

    async saveMetadata(video: DownloadedVideo) {
        const current = await this.getDownloads();
        // Remove if exists to update
        const filtered = current.filter(v => v.url !== video.url);
        filtered.unshift(video);
        await AsyncStorage.setItem(METADATA_KEY, JSON.stringify(filtered));
    }

    async downloadVideo(video: VideoItem, streamUrl: string, onProgress?: (ratio: number) => void): Promise<string | null> {
        await this.ensureDownloadFolder();

        // Clean filename logic
        const filename = `${video.url.split('v=')[1] || Date.now()}.mp4`;
        const fileUri = DOWNLOAD_FOLDER + filename;

        const downloadResumable = FileSystem.createDownloadResumable(
            streamUrl,
            fileUri,
            {},
            (downloadProgress) => {
                const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                if (onProgress) onProgress(progress);
            }
        );

        try {
            const result = await downloadResumable.downloadAsync();
            if (result && result.uri) {
                const downloadedItem: DownloadedVideo = {
                    ...video,
                    localUri: result.uri,
                    downloadDate: new Date().toISOString(),
                    fileSize: 0 // You can get this from result.headers or getInfoAsync
                };
                await this.saveMetadata(downloadedItem);
                return result.uri;
            }
        } catch (e) {
            console.error("Download failed:", e);
            Alert.alert("Lỗi tải xuống", "Không thể tải video này.");
        }
        return null;
    }

    async deleteDownload(videoUrl: string) {
        try {
            const downloads = await this.getDownloads();
            const video = downloads.find(v => v.url === videoUrl);

            if (video && video.localUri) {
                // Delete actual file
                await FileSystem.deleteAsync(video.localUri, { idempotent: true });
            }

            // Update Metadata
            const newDownloads = downloads.filter(v => v.url !== videoUrl);
            await AsyncStorage.setItem(METADATA_KEY, JSON.stringify(newDownloads));
            return true;
        } catch (error) {
            console.error('Error deleting download:', error);
            return false;
        }
    }

    async isDownloaded(videoId: string): Promise<boolean> {
        const downloads = await this.getDownloads();
        return downloads.some(v => v.url.includes(videoId));
    }
}

export default new DownloadManager();
