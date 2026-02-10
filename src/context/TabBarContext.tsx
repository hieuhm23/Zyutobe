import React, { createContext, useState, useContext, useCallback, useRef, ReactNode } from 'react';

interface TabBarContextType {
    isTabBarVisible: boolean;
    setTabBarVisible: (visible: boolean) => void;
}

const TabBarContext = createContext<TabBarContextType | undefined>(undefined);

export const TabBarProvider = ({ children }: { children: ReactNode }) => {
    const [isTabBarVisible, setIsTabBarVisible] = useState(true);
    const visibleRef = useRef(true);

    // Guard: chỉ trigger setState khi giá trị thực sự thay đổi
    // Tránh re-render không cần thiết khi onScroll gọi liên tục
    const setTabBarVisible = useCallback((visible: boolean) => {
        if (visibleRef.current !== visible) {
            visibleRef.current = visible;
            setIsTabBarVisible(visible);
        }
    }, []);

    return (
        <TabBarContext.Provider value={{ isTabBarVisible, setTabBarVisible }}>
            {children}
        </TabBarContext.Provider>
    );
};

export const useTabBar = () => {
    const context = useContext(TabBarContext);
    if (!context) throw new Error('useTabBar must be used within a TabBarProvider');
    return context;
};
