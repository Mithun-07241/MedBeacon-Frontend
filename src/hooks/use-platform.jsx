import { useState, useEffect } from 'react';
import { isTauri, isAndroid, isIOS, isWeb, getPlatform, isMobilePlatform } from '@/utils/platform';

/**
 * Hook to detect the current platform and environment
 * @returns {Object} Platform detection object
 * @returns {boolean} return.isTauri - True if running in Tauri
 * @returns {boolean} return.isAndroid - True if running on Android
 * @returns {boolean} return.isIOS - True if running on iOS
 * @returns {boolean} return.isWeb - True if running in web browser
 * @returns {boolean} return.isMobile - True if on mobile (native or web)
 * @returns {'android' | 'ios' | 'desktop' | 'web'} return.platform - Current platform
 */
export function usePlatform() {
    const [platformInfo, setPlatformInfo] = useState(() => ({
        isTauri: isTauri(),
        isAndroid: isAndroid(),
        isIOS: isIOS(),
        isWeb: isWeb(),
        isMobile: isMobilePlatform(),
        platform: getPlatform()
    }));

    useEffect(() => {
        // Update platform info on window resize (for mobile web detection)
        const handleResize = () => {
            setPlatformInfo({
                isTauri: isTauri(),
                isAndroid: isAndroid(),
                isIOS: isIOS(),
                isWeb: isWeb(),
                isMobile: isMobilePlatform(),
                platform: getPlatform()
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return platformInfo;
}
