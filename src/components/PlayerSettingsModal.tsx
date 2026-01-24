import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, FlatList, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

interface PlayerSettingsModalProps {
    visible: boolean;
    onClose: () => void;
    qualities: { height: number; url: string }[];
    currentQuality: string | number;
    onSelectQuality: (url: string, height: number) => void;
    currentSpeed: number;
    onSelectSpeed: (speed: number) => void;
    sleepTimer: number | null; // minutes, null = off
    onSetSleepTimer: (minutes: number | null) => void;
}

const SPEEDS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
const SLEEP_OPTIONS = [
    { label: 'Tắt hẹn giờ', value: null },
    { label: '15 phút', value: 15 },
    { label: '30 phút', value: 30 },
    { label: '45 phút', value: 45 },
    { label: '60 phút', value: 60 },
    { label: 'Kết thúc video', value: -1 }, // Special value for end of track
];

const PlayerSettingsModal: React.FC<PlayerSettingsModalProps> = ({
    visible,
    onClose,
    qualities,
    currentQuality,
    onSelectQuality,
    currentSpeed,
    onSelectSpeed,
    sleepTimer,
    onSetSleepTimer
}) => {
    const [viewMode, setViewMode] = React.useState<'main' | 'quality' | 'speed' | 'sleep'>('main');

    // Reset view mode on close
    React.useEffect(() => {
        if (!visible) setViewMode('main');
    }, [visible]);

    const formatSleepLabel = () => {
        if (sleepTimer === null) return 'Tắt';
        if (sleepTimer === -1) return 'Kết thúc video';
        return `${sleepTimer} phút`;
    };

    const renderMainDiff = () => (
        <View>
            <TouchableOpacity style={styles.menuItem} onPress={() => setViewMode('quality')}>
                <Ionicons name="settings-outline" size={24} color="#fff" />
                <Text style={styles.menuText}>Chất lượng</Text>
                <Text style={styles.valueText}>{currentQuality === 'auto' ? 'Tự động' : `${currentQuality}p`}</Text>
                <Ionicons name="chevron-forward" size={20} color="#aaa" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => setViewMode('speed')}>
                <Ionicons name="speedometer-outline" size={24} color="#fff" />
                <Text style={styles.menuText}>Tốc độ phát</Text>
                <Text style={styles.valueText}>{currentSpeed}x</Text>
                <Ionicons name="chevron-forward" size={20} color="#aaa" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => setViewMode('sleep')}>
                <Ionicons name="timer-outline" size={24} color="#fff" />
                <Text style={styles.menuText}>Hẹn giờ tắt</Text>
                <Text style={styles.valueText}>{formatSleepLabel()}</Text>
                <Ionicons name="chevron-forward" size={20} color="#aaa" />
            </TouchableOpacity>
        </View>
    );

    const renderQuality = () => (
        <View>
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => setViewMode('main')}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chất lượng video</Text>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
                <TouchableOpacity
                    style={styles.subMenuItem}
                    onPress={() => {
                        onSelectQuality('auto', 0);
                        onClose();
                    }}
                >
                    {currentQuality === 'auto' && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                    <Text style={[styles.subText, currentQuality === 'auto' && { color: COLORS.primary }]}>
                        Tự động (Lên tới 4K)
                    </Text>
                </TouchableOpacity>

                {qualities.map((q) => (
                    <TouchableOpacity
                        key={q.height}
                        style={styles.subMenuItem}
                        onPress={() => {
                            onSelectQuality(q.url, q.height);
                            onClose();
                        }}
                    >
                        {currentQuality !== 'auto' && parseInt(currentQuality.toString()) === q.height && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                        <Text style={[styles.subText, currentQuality !== 'auto' && parseInt(currentQuality.toString()) === q.height && { color: COLORS.primary }]}>
                            {q.height}p
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const renderSpeed = () => (
        <View>
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => setViewMode('main')}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tốc độ phát</Text>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
                {SPEEDS.map((s) => (
                    <TouchableOpacity
                        key={s}
                        style={styles.subMenuItem}
                        onPress={() => {
                            onSelectSpeed(s);
                            onClose();
                        }}
                    >
                        {currentSpeed === s && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                        <Text style={[styles.subText, currentSpeed === s && { color: COLORS.primary }]}>
                            {s === 1.0 ? 'Bình thường' : `${s}x`}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const renderSleepTimer = () => (
        <View>
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => setViewMode('main')}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Hẹn giờ tắt</Text>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
                {SLEEP_OPTIONS.map((opt) => (
                    <TouchableOpacity
                        key={opt.label}
                        style={styles.subMenuItem}
                        onPress={() => {
                            onSetSleepTimer(opt.value);
                            onClose();
                        }}
                    >
                        {sleepTimer === opt.value && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                        <Text style={[styles.subText, sleepTimer === opt.value && { color: COLORS.primary }]}>
                            {opt.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <View style={styles.modalParams} onStartShouldSetResponder={() => true}>
                    <View style={styles.dragHandle} />
                    {viewMode === 'main' && renderMainDiff()}
                    {viewMode === 'quality' && renderQuality()}
                    {viewMode === 'speed' && renderSpeed()}
                    {viewMode === 'sleep' && renderSleepTimer()}
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalParams: {
        backgroundColor: '#222',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 16,
        minHeight: 250,
        paddingBottom: 40,
    },
    dragHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#555',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    menuText: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        marginLeft: 16,
    },
    valueText: {
        color: '#aaa',
        fontSize: 14,
        marginRight: 8,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        paddingBottom: 10,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 16,
    },
    subMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 10,
    },
    subText: {
        color: '#fff',
        fontSize: 16,
        marginLeft: 12,
    },
});

export default PlayerSettingsModal;
