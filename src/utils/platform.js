/**
 * Platform detection utilities for Tauri applications
 * Helps differentiate between web browser and native app contexts
 */

/**
 * Check if the app is running in a Tauri environment
 * @returns {boolean} True if running in Tauri, false otherwise
 */
export function isTauri() {
    return typeof window !== 'undefined' &&
        (window.__TAURI__ !== undefined || window.__TAURI_INTERNALS__ !== undefined);
}

/**
 * Check if the app is running on Android via Tauri
 * @returns {boolean} True if running on Android, false otherwise
 */
export function isAndroid() {
    if (!isTauri()) return false;

    // Check user agent for Android
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('android');
}

/**
 * Check if the app is running on iOS via Tauri
 * @returns {boolean} True if running on iOS, false otherwise
 */
export function isIOS() {
    if (!isTauri()) return false;

    // Check user agent for iOS
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod');
}

/**
 * Check if the app is running in a web browser (not Tauri)
 * @returns {boolean} True if running in web browser, false otherwise
 */
export function isWeb() {
    return !isTauri();
}

/**
 * Get the current platform type
 * @returns {'android' | 'ios' | 'desktop' | 'web'} Platform type
 */
export function getPlatform() {
    if (!isTauri()) return 'web';

    if (isAndroid()) return 'android';
    if (isIOS()) return 'ios';

    return 'desktop';
}

/**
 * Check if running on a mobile platform (Android or iOS via Tauri, or mobile web)
 * @returns {boolean} True if on mobile platform
 */
export function isMobilePlatform() {
    const platform = getPlatform();
    return platform === 'android' || platform === 'ios' || isMobileWeb();
}

/**
 * Check if running in a mobile web browser (based on screen size)
 * @returns {boolean} True if mobile web browser
 */
export function isMobileWeb() {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
}
