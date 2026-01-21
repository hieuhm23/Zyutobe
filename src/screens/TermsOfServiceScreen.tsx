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

const TermsOfServiceScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Điều khoản sử dụng</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Last Updated */}
                <Text style={styles.updateDate}>Cập nhật lần cuối: 22/01/2026</Text>

                {/* Introduction */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. Chấp nhận điều khoản</Text>
                    <Text style={styles.sectionText}>
                        Bằng việc tải xuống, cài đặt hoặc sử dụng ứng dụng ZyTube, bạn đồng ý tuân thủ và bị ràng buộc bởi các điều khoản và điều kiện này.
                        Nếu bạn không đồng ý với bất kỳ phần nào của điều khoản, vui lòng không sử dụng ứng dụng.
                    </Text>
                </View>

                {/* Usage */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. Sử dụng ứng dụng</Text>
                    <Text style={styles.sectionText}>
                        ZyTube được cung cấp <Text style={styles.bold}>miễn phí</Text> cho mục đích cá nhân và phi thương mại. Bạn đồng ý:{'\n\n'}
                        • Không sử dụng ứng dụng cho mục đích bất hợp pháp.{'\n'}
                        • Không cố gắng can thiệp hoặc phá hoại hệ thống.{'\n'}
                        • Không sao chép, phân phối lại hoặc bán ứng dụng.{'\n'}
                        • Tôn trọng bản quyền nội dung của các bên thứ ba.
                    </Text>
                </View>

                {/* Content */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>3. Nội dung</Text>
                    <Text style={styles.sectionText}>
                        ZyTube là một ứng dụng trình phát video sử dụng các nguồn API công khai.
                        Chúng tôi <Text style={styles.bold}>không sở hữu</Text> bất kỳ nội dung video nào được hiển thị trong ứng dụng.
                        Tất cả nội dung thuộc quyền sở hữu của các chủ sở hữu tương ứng.
                    </Text>
                </View>

                {/* Disclaimer */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>4. Miễn trừ trách nhiệm</Text>
                    <Text style={styles.sectionText}>
                        Ứng dụng được cung cấp "nguyên trạng" (as-is). Chúng tôi không đảm bảo:{'\n\n'}
                        • Ứng dụng sẽ hoạt động liên tục, không lỗi.{'\n'}
                        • Nội dung luôn có sẵn hoặc chính xác.{'\n'}
                        • Ứng dụng phù hợp với mọi mục đích sử dụng.
                    </Text>
                </View>

                {/* Intellectual Property */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>5. Sở hữu trí tuệ</Text>
                    <Text style={styles.sectionText}>
                        Thương hiệu ZyTube, logo và giao diện người dùng thuộc quyền sở hữu của chúng tôi.
                        Bạn không được sử dụng các tài sản này mà không có sự cho phép bằng văn bản.
                    </Text>
                </View>

                {/* Modifications */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>6. Thay đổi điều khoản</Text>
                    <Text style={styles.sectionText}>
                        Chúng tôi có quyền sửa đổi các điều khoản này bất cứ lúc nào.
                        Việc tiếp tục sử dụng ứng dụng sau khi thay đổi đồng nghĩa với việc bạn chấp nhận các điều khoản mới.
                    </Text>
                </View>

                {/* Termination */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>7. Chấm dứt</Text>
                    <Text style={styles.sectionText}>
                        Chúng tôi có quyền chấm dứt hoặc đình chỉ quyền truy cập của bạn vào ứng dụng ngay lập tức,
                        mà không cần thông báo trước, nếu bạn vi phạm bất kỳ điều khoản nào.
                    </Text>
                </View>

                {/* Contact */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>8. Liên hệ</Text>
                    <Text style={styles.sectionText}>
                        Nếu bạn có câu hỏi về điều khoản sử dụng, vui lòng liên hệ:{'\n\n'}
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

export default TermsOfServiceScreen;
