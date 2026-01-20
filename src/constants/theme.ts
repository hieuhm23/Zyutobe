// ZyTube Theme - PureTuber Style (Dark Theme with Neon Green Accent)

export const COLORS = {
    // Primary Dark Theme
    background: '#0a0f1a',      // Deep Dark Navy
    surface: '#141b2d',         // Card background
    surfaceLight: '#1e2840',    // Elevated surfaces

    // Accent Colors
    primary: '#00D26A',         // Neon Green (PureTuber style)
    primaryDark: '#00A854',
    primaryLight: '#33DC8A',

    // Secondary
    secondary: '#FF6B35',       // Orange for highlights

    // Text Colors
    textPrimary: '#FFFFFF',
    textSecondary: '#8B9BB4',
    textTertiary: '#5A6A85',

    // Semantic Colors
    success: '#00D26A',
    warning: '#FFB800',
    error: '#FF4757',
    info: '#00B4D8',

    // Others
    border: '#2A3550',
    overlay: 'rgba(0, 0, 0, 0.7)',

    // Gradients
    gradientStart: '#00D26A',
    gradientEnd: '#00A854',
};

export const SPACING = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
};

export const FONTS = {
    sizes: {
        xs: 11,
        s: 13,
        m: 15,
        l: 18,
        xl: 22,
        xxl: 28,
        huge: 36,
    },
    weights: {
        regular: 'normal' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: 'bold' as const,
        heavy: '900' as const,
    },
};

export const RADIUS = {
    xs: 4,
    s: 8,
    m: 12,
    l: 16,
    xl: 20,
    xxl: 28,
    full: 9999,
};

export const SHADOWS = {
    small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 3,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    large: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
    },
    glow: {
        shadowColor: '#00D26A',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
    },
};

export const ANIMATION = {
    fast: 150,
    normal: 300,
    slow: 500,
};
