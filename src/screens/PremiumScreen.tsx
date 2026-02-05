import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';
import { usePremium } from '../context/PremiumContext';

const { width } = Dimensions.get('window');

const PremiumScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const { isPremium, activatePremium, expiryDate } = usePremium();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    const FEATURES = [
        { icon: 'film-outline', title: 'Chất lượng 4K Ultra HD', desc: 'Xem video với độ phân giải cao nhất, sắc nét đến từng chi tiết.' },
        { icon: 'musical-notes-outline', title: 'Nghe nhạc trong nền', desc: 'Tiếp tục nghe nhạc ngay cả khi tắt màn hình hoặc chuyển ứng dụng.' },
        { icon: 'download-outline', title: 'Tải video không giới hạn', desc: 'Lưu video và nhạc để xem offline bất cứ lúc nào, tốc độ cực cao.' },
        { icon: 'copy-outline', title: 'Ảnh trong ảnh (PiP)', desc: 'Vừa xem video vừa lướt mạng xã hội hoặc làm việc khác.' },
        { icon: 'medical-outline', title: 'SponsorBlock Pro', desc: 'Tự động bỏ qua các đoạn quảng cáo nội bộ, intro, outro phiền phức.' },
        { icon: 'color-palette-outline', title: 'Giao diện tùy biến', desc: 'Mở khóa hàng loạt màu sắc và icon ứng dụng độc quyền.' },
    ];

    const handleActivate = async () => {
        if (!code.trim()) {
            Alert.alert('Thông báo', 'Vui lòng nhập mã kích hoạt.');
            return;
        }

        setLoading(true);
        const success = await activatePremium(code);
        setLoading(false);

        if (success) {
            Alert.alert('Chúc mừng!', 'Bạn đã nâng cấp lên tài khoản Premium thành công.');
            navigation.goBack();
        } else {
            Alert.alert('Lỗi', 'Mã kích hoạt không chính xác hoặc đã hết hạn.');
        }
    };

    return (
        <ScrollView style={styles.container} bounces={false}>
            <LinearGradient
                colors={[COLORS.primary, '#000']}
                style={[styles.header, { paddingTop: insets.top + 20 }]}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>

                <View style={styles.logoBadge}>
                    <Ionicons name="diamond" size={40} color="#FFD700" />
                </View>

                <Text style={styles.title}>ZyTube Premium</Text>
                <Text style={styles.subtitle}>Nâng tầm trải nghiệm giải trí của bạn</Text>
            </LinearGradient>

            <View style={styles.content}>
                {isPremium ? (
                    <View style={styles.premiumBadge}>
                        <Ionicons name="checkmark-circle" size={50} color={COLORS.primary} />
                        <Text style={styles.premiumActiveText}>Bạn đang là thành viên VIP</Text>
                        <Text style={styles.premiumDesc}>Tận hưởng trọn vẹn mọi tính năng cao cấp không giới hạn.</Text>
                        <Text style={[styles.premiumDesc, { color: COLORS.primary, marginTop: 5 }]}>
                            Hạn dùng: {expiryDate || 'Vĩnh viễn'}
                        </Text>
                    </View>
                ) : (
                    <>
                        <Text style={styles.sectionTitle}>Tính năng đặc quyền</Text>
                        <View style={styles.featuresList}>
                            {FEATURES.map((item, index) => (
                                <View key={index} style={styles.featureItem}>
                                    <View style={styles.iconContainer}>
                                        <Ionicons name={item.icon as any} size={24} color={COLORS.primary} />
                                    </View>
                                    <View style={styles.featureText}>
                                        <Text style={styles.featureTitle}>{item.title}</Text>
                                        <Text style={styles.featureDesc}>{item.desc}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        <View style={styles.upgradeSection}>
                            <Text style={styles.upgradeTitle}>Nhập mã nâng cấp</Text>
                            <Text style={styles.upgradeSubtitle}>Liên hệ Admin để nhận mã kích hoạt gói VIP</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Nhập mã ưu đãi hoặc mã VIP..."
                                placeholderTextColor="#666"
                                value={code}
                                onChangeText={setCode}
                                autoCapitalize="characters"
                            />

                            <TouchableOpacity
                                style={styles.button}
                                onPress={handleActivate}
                                disabled={loading}
                            >
                                <LinearGradient
                                    colors={[COLORS.primary, '#FF4D4D']}
                                    style={styles.buttonGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <Text style={styles.buttonText}>
                                        {loading ? 'Đang xử lý...' : 'Kích hoạt ngay'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <Text style={styles.supportText}>Bằng cách kích hoạt, bạn đồng ý với các điều khoản của ZyTube.</Text>
                        </View>
                    </>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        height: 320,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    backButton: {
        position: 'absolute',
        left: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 8,
        borderRadius: 12,
    },
    logoBadge: {
        width: 80,
        height: 80,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.3)',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 10,
        textAlign: 'center',
    },
    content: {
        marginTop: -40,
        backgroundColor: '#000',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 20,
        paddingTop: 30,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
    },
    featuresList: {
        gap: 20,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 48,
        height: 48,
        backgroundColor: 'rgba(255,41,41,0.1)',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    featureDesc: {
        fontSize: 14,
        color: '#aaa',
        marginTop: 4,
        lineHeight: 20,
    },
    upgradeSection: {
        marginTop: 40,
        padding: 20,
        backgroundColor: '#111',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#222',
        marginBottom: 50,
    },
    upgradeTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    upgradeSubtitle: {
        fontSize: 13,
        color: '#888',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 20,
    },
    input: {
        backgroundColor: '#222',
        height: 55,
        borderRadius: 15,
        paddingHorizontal: 15,
        color: '#fff',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#333',
        marginBottom: 20,
    },
    button: {
        height: 55,
        borderRadius: 15,
        overflow: 'hidden',
    },
    buttonGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    supportText: {
        fontSize: 12,
        color: '#555',
        textAlign: 'center',
        marginTop: 15,
    },
    premiumBadge: {
        alignItems: 'center',
        padding: 40,
        marginTop: 20,
    },
    premiumActiveText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFD700',
        marginTop: 15,
    },
    premiumDesc: {
        fontSize: 15,
        color: '#aaa',
        textAlign: 'center',
        marginTop: 10,
    }
});

export default PremiumScreen;
