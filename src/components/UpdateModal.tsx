import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    Image,
    ScrollView,
    ActivityIndicator
} from 'react-native';
import * as Updates from 'expo-updates';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface UpdateModalProps {
    visible: boolean;
    onDismiss: () => void;
    forceUpdate?: boolean;
}

interface UpdateInfo {
    version: string;
    changes: string[];
}

const UpdateModal: React.FC<UpdateModalProps> = ({ visible, onDismiss, forceUpdate = false }) => {
    const [updating, setUpdating] = useState(false);

    const updateInfo: UpdateInfo = {
        version: '1.1.0',
        changes: [
            '🎬 Cải thiện trình phát video',
            '❤️ Thêm nút Like trong Player',
            '⚙️ Thêm cài đặt tốc độ phát',
            '🔁 Thêm chế độ lặp video',
            '🐛 Sửa các lỗi nhỏ'
        ]
    };

    const handleUpdate = async () => {
        setUpdating(true);
        try {
            await Updates.fetchUpdateAsync();
            await Updates.reloadAsync();
        } catch (e) {
            console.error('Update error:', e);
            setUpdating(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={forceUpdate ? undefined : onDismiss}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        <Ionicons name="megaphone" size={50} color={COLORS.primary} />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>Có phiên bản mới!</Text>

                    {/* Version Badge */}
                    <View style={styles.versionBadge}>
                        <Ionicons name="arrow-up-circle" size={14} color="#fff" />
                        <Text style={styles.versionText}>v{updateInfo.version}</Text>
                    </View>

                    {/* Subtitle */}
                    <Text style={styles.subtitle}>Tối ưu & Trải nghiệm</Text>

                    {/* Changes List */}
                    <View style={styles.changesList}>
                        {updateInfo.changes.map((change, index) => (
                            <View key={index} style={styles.changeItem}>
                                <Text style={styles.changeText}>{change}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Update Button */}
                    <TouchableOpacity
                        style={[styles.updateButton, updating && styles.updateButtonDisabled]}
                        onPress={handleUpdate}
                        disabled={updating}
                    >
                        {updating ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="download" size={20} color="#fff" />
                                <Text style={styles.updateButtonText}>Cập nhật ngay</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Dismiss Button (only if not forced) */}
                    {!forceUpdate && (
                        <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
                            <Text style={styles.dismissText}>Để sau</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.l,
    },
    container: {
        backgroundColor: '#fff',
        borderRadius: RADIUS.xl,
        padding: SPACING.xl,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    title: {
        fontSize: FONTS.sizes.xl,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: SPACING.s,
    },
    versionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: RADIUS.full,
        marginBottom: SPACING.s,
    },
    versionText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: FONTS.sizes.s,
        marginLeft: 4,
    },
    subtitle: {
        fontSize: FONTS.sizes.m,
        color: '#666',
        marginBottom: SPACING.m,
    },
    changesList: {
        width: '100%',
        marginBottom: SPACING.l,
    },
    changeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
    },
    changeText: {
        fontSize: FONTS.sizes.s,
        color: '#444',
    },
    updateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 40,
        paddingVertical: 14,
        borderRadius: RADIUS.full,
        width: '100%',
        marginBottom: SPACING.s,
    },
    updateButtonDisabled: {
        opacity: 0.7,
    },
    updateButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: FONTS.sizes.m,
        marginLeft: 8,
    },
    dismissButton: {
        paddingVertical: 10,
    },
    dismissText: {
        color: '#888',
        fontSize: FONTS.sizes.s,
    },
});

export default UpdateModal;
