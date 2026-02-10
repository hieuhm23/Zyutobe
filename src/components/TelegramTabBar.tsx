import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Animated,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import { BlurView } from 'expo-blur';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { useTabBar } from '../context/TabBarContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TabConfig {
    name: string;
    label: string;
    iconActive: keyof typeof Ionicons.glyphMap;
    iconInactive: keyof typeof Ionicons.glyphMap;
}

const TABS: TabConfig[] = [
    { name: 'HomeTab', label: 'Trang chủ', iconActive: 'home', iconInactive: 'home-outline' },
    { name: 'LibraryTab', label: 'Thư viện', iconActive: 'library', iconInactive: 'library-outline' },
    { name: 'SettingsTab', label: 'Cài đặt', iconActive: 'settings', iconInactive: 'settings-outline' },
];

const TelegramTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
    const insets = useSafeAreaInsets();
    const { isTabBarVisible } = useTabBar();

    // Tính toán chiều rộng để tạo hiệu ứng thuốc nổi (floating pill)
    // Container width nhỏ hơn màn hình 32px (margin 16px mỗi bên)
    const CONTAINER_WIDTH = SCREEN_WIDTH - 32;
    const NEW_TAB_WIDTH = CONTAINER_WIDTH / TABS.length;

    // Tính toán vị trí và animation
    const translateX = useRef(new Animated.Value(state.index * NEW_TAB_WIDTH)).current;
    const scaleAnims = useRef(TABS.map(() => new Animated.Value(1))).current;

    // Animation ẩn/hiện tab bar
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animate hide/show tab bar
        // Dùng spring với damping cao hơn → giảm bouncy, mượt hơn
        Animated.spring(translateY, {
            toValue: isTabBarVisible ? 0 : 120, // 120 đủ ẩn (60 height + margin)
            useNativeDriver: true,
            damping: 18,        // Giảm dao động (ít nảy)
            stiffness: 120,     // Tốc độ phản hồi vừa phải
            mass: 0.8,          // Nhẹ hơn → phản hồi nhanh hơn
        }).start();
    }, [isTabBarVisible]);

    useEffect(() => {
        // Animate pill movement
        Animated.spring(translateX, {
            toValue: state.index * NEW_TAB_WIDTH + 6, // +6 offset để canh giữa pill (padding container)
            useNativeDriver: true,
            tension: 68,
            friction: 10,
        }).start();

        // Animate scale effect for active tab
        scaleAnims.forEach((anim, index) => {
            const isActive = index === state.index;
            Animated.spring(anim, {
                toValue: isActive ? 1.15 : 1, // Active tab scale lên 1.15
                useNativeDriver: true,
                tension: 68,
                friction: 10,
            }).start();
        });
    }, [state.index]);

    const handleTabPress = (routeName: string, index: number) => {
        // Haptic feedback khi bấm tab
        Haptics.selectionAsync();

        const isFocused = state.index === index;

        const event = navigation.emit({
            type: 'tabPress',
            target: state.routes[index].key,
            canPreventDefault: true,
        });

        if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(routeName);
        }
    };

    const PILL_WIDTH = NEW_TAB_WIDTH - 12; // Pill nhỏ hơn tab width một chút

    return (
        <Animated.View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            transform: [{ translateY }]
        }}>
            {/* Background container to match app bg color (prevents white corners) */}

            <View style={[
                styles.containerWrapper,
                {
                    width: CONTAINER_WIDTH,
                    marginBottom: Platform.OS === 'ios' ? 34 : 20,
                }
            ]}>
                <BlurView
                    intensity={30}
                    tint="light"
                    style={[
                        styles.blurContainer,
                        {
                            paddingBottom: Platform.OS === 'ios' ? 20 : 12,
                        }
                    ]}
                >
                    {/* Animated Pill Background */}
                    <Animated.View
                        style={[
                            styles.pillBackground,
                            {
                                transform: [{ translateX }],
                                width: PILL_WIDTH,
                            }
                        ]}
                    />

                    {/* Tab Items */}
                    {TABS.map((tab, index) => {
                        const isFocused = state.index === index;
                        return (
                            <TouchableOpacity
                                key={tab.name}
                                onPress={() => handleTabPress(tab.name, index)}
                                style={styles.tabItem}
                                activeOpacity={0.7}
                            >
                                <Animated.View
                                    style={[
                                        styles.tabContent,
                                        {
                                            transform: [{ scale: scaleAnims[index] }],
                                        }
                                    ]}
                                >
                                    <Ionicons
                                        name={isFocused ? tab.iconActive : tab.iconInactive}
                                        size={24}
                                        color={isFocused ? COLORS.primary : COLORS.textTertiary}
                                    />
                                    <Text
                                        style={[
                                            styles.tabLabel,
                                            {
                                                color: isFocused ? COLORS.primary : COLORS.textTertiary,
                                                fontWeight: isFocused ? '600' : '400',
                                            }
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {tab.label}
                                    </Text>
                                </Animated.View>
                            </TouchableOpacity>
                        );
                    })}
                </BlurView>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    containerWrapper: {
        alignSelf: 'center',
        borderRadius: 35,
        overflow: 'hidden', // Quan trọng để bo tròn BlurView
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',

        // Shadow apply lên wrapper
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.05)', // Very transparent - see through
    },
    blurContainer: {
        flexDirection: 'row',
        paddingVertical: 5,
        paddingHorizontal: 4,
        height: 60,
        alignItems: 'center',
        width: '100%',
    },
    pillBackground: {
        position: 'absolute',
        top: 5,
        left: 0, // Sẽ được điều chỉnh bởi translateX và offset ban đầu
        height: 50,
        backgroundColor: `${COLORS.primary}15`, // Màu nền pill nhạt
        borderRadius: 25,
        borderWidth: 1,
        borderColor: `${COLORS.primary}30`,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    tabContent: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    tabLabel: {
        fontSize: 9, // Font nhỏ gọn
        marginTop: 2,
    },
});

export default TelegramTabBar;
