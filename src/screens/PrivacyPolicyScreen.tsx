import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';

const PrivacyPolicyScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chính sách bảo mật</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Last Updated */}
                <Text style={styles.updateDate}>Cập nhật lần cuối: 22/01/2026</Text>

                {/* Introduction */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. Giới thiệu</Text>
                    <Text style={styles.sectionText}>
                        Chào mừng bạn đến với ZyTube. Chúng tôi cam kết bảo vệ quyền riêng tư và dữ liệu cá nhân của bạn.
                        Chính sách bảo mật này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ thông tin của bạn khi sử dụng ứng dụng.
                    </Text>
                </View>

                {/* Data Collection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. Thu thập dữ liệu</Text>
                    <Text style={styles.sectionText}>
                        ZyTube thu thập các loại thông tin sau:{'\n\n'}
                        • <Text style={styles.bold}>Lịch sử xem:</Text> Các video bạn đã xem để cải thiện đề xuất.{'\n'}
                        • <Text style={styles.bold}>Lịch sử tìm kiếm:</Text> Các từ khóa bạn đã tìm để tiện tra cứu lại.{'\n'}
                        • <Text style={styles.bold}>Danh sách yêu thích:</Text> Video bạn đã lưu vào danh sách.{'\n'}
                        • <Text style={styles.bold}>Cài đặt:</Text> Các tùy chọn bạn đã thiết lập trong ứng dụng.
                    </Text>
                </View>

                {/* Data Storage */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>3. Lưu trữ dữ liệu</Text>
                    <Text style={styles.sectionText}>
                        Tất cả dữ liệu được lưu trữ <Text style={styles.bold}>cục bộ trên thiết bị của bạn</Text>.
                        Chúng tôi không gửi dữ liệu cá nhân của bạn lên máy chủ bên ngoài.
                        Điều này đảm bảo quyền riêng tư tối đa cho bạn.
                    </Text>
                </View>

                {/* Third Party */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>4. Dịch vụ bên thứ ba</Text>
                    <Text style={styles.sectionText}>
                        Ứng dụng sử dụng các API công khai để tải nội dung video.
                        Chúng tôi không chịu trách nhiệm về chính sách bảo mật của các dịch vụ bên thứ ba này.
                        Khuyến khích bạn đọc kỹ chính sách của họ.
                    </Text>
                </View>

                {/* User Rights */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>5. Quyền của bạn</Text>
                    <Text style={styles.sectionText}>
                        Bạn có quyền:{'\n\n'}
                        • Xóa lịch sử xem và tìm kiếm bất cứ lúc nào.{'\n'}
                        • Xóa toàn bộ dữ liệu bằng cách gỡ cài đặt ứng dụng.{'\n'}
                        • Từ chối cập nhật nếu không đồng ý với chính sách mới.
                    </Text>
                </View>

                {/* Contact */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>6. Liên hệ</Text>
                    <Text style={styles.sectionText}>
                        Nếu bạn có bất kỳ câu hỏi nào về chính sách bảo mật, vui lòng liên hệ:{'\n\n'}
                        📧 Email: hieuiospubgm@gmail.com{'\n'}
                        🌐 Website: www.data5g.site
                    </Text>
                </View>

                <View style={{ height: 50 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        padding: SPACING.xs,
    },
    headerTitle: {
        fontSize: FONTS.sizes.l,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    content: {
        flex: 1,
        paddingHorizontal: SPACING.m,
    },
    updateDate: {
        fontSize: FONTS.sizes.xs,
        color: COLORS.textTertiary,
        marginTop: SPACING.m,
        marginBottom: SPACING.l,
    },
    section: {
        marginBottom: SPACING.l,
    },
    sectionTitle: {
        fontSize: FONTS.sizes.m,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: SPACING.s,
    },
    sectionText: {
        fontSize: FONTS.sizes.s,
        color: COLORS.textSecondary,
        lineHeight: 22,
    },
    bold: {
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
});

export default PrivacyPolicyScreen;
