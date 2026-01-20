import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Firebase configuration
// NOTE: Replace these with your actual Firebase config values
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

// VAPID key for web push
const VAPID_KEY = "BKayoH4iBfcJfU0DM6t-JdKmTHCDHSVCGJ2gRnLJCMQNC12nJ0CU7smhl3tS8NtzgoKt6CL8vK_aSDfBsIyjsZY";

// Initialize Firebase
let app;
let messaging;

try {
    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    console.log('✅ Firebase initialized successfully');

    // Register service worker and send config
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/firebase-messaging-sw.js')
            .then((registration) => {
                console.log('✅ Service Worker registered:', registration);

                // Send Firebase config to service worker
                if (registration.active) {
                    registration.active.postMessage({
                        type: 'FIREBASE_CONFIG',
                        config: firebaseConfig
                    });
                }

                // Also send when service worker becomes active
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    if (navigator.serviceWorker.controller) {
                        navigator.serviceWorker.controller.postMessage({
                            type: 'FIREBASE_CONFIG',
                            config: firebaseConfig
                        });
                    }
                });
            })
            .catch((error) => {
                console.error('❌ Service Worker registration failed:', error);
            });
    }
} catch (error) {
    console.error('❌ Firebase initialization error:', error);
}

/**
 * Request notification permission and get FCM token
 * @returns {Promise<string|null>} FCM token or null
 */
export const requestNotificationPermission = async () => {
    try {
        // Check if notifications are supported
        if (!('Notification' in window)) {
            console.warn('This browser does not support notifications');
            return null;
        }

        // Request permission
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            console.log('✅ Notification permission granted');

            // Get FCM token
            const token = await getToken(messaging, { vapidKey: VAPID_KEY });

            if (token) {
                console.log('✅ FCM Token:', token);
                return token;
            } else {
                console.warn('⚠️  No FCM token available');
                return null;
            }
        } else {
            console.warn('⚠️  Notification permission denied');
            return null;
        }
    } catch (error) {
        console.error('❌ Error getting FCM token:', error);
        return null;
    }
};

/**
 * Listen for foreground messages
 * @param {Function} callback - Callback function to handle messages
 */
export const onForegroundMessage = (callback) => {
    if (!messaging) {
        console.warn('Messaging not initialized');
        return;
    }

    onMessage(messaging, (payload) => {
        console.log('📩 Foreground message received:', payload);
        callback(payload);
    });
};

/**
 * Show notification
 * @param {string} title - Notification title
 * @param {object} options - Notification options
 */
export const showNotification = (title, options = {}) => {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, options);
    }
};

export { messaging };
