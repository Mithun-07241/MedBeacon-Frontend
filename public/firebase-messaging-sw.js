// Firebase Cloud Messaging Service Worker
// This file is loaded separately and cannot access import.meta.env
// Config will be injected by the main app

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase configuration will be set by the main app
let firebaseConfig = null;

// Listen for config message from main app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'FIREBASE_CONFIG') {
        firebaseConfig = event.data.config;

        // Initialize Firebase with the config
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log('✅ Firebase initialized in service worker');
        }

        // Get messaging instance
        const messaging = firebase.messaging();

        // Handle background messages
        messaging.onBackgroundMessage((payload) => {
            console.log('📩 Background message received:', payload);

            const notificationTitle = payload.notification?.title || 'New Notification';
            const notificationOptions = {
                body: payload.notification?.body || '',
                icon: '/icon-192x192.png',
                badge: '/badge-72x72.png',
                tag: payload.data?.callId || 'notification',
                requireInteraction: true,
                data: payload.data
            };

            // Show notification
            self.registration.showNotification(notificationTitle, notificationOptions);
        });
    }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('🔔 Notification clicked:', event);

    event.notification.close();

    const data = event.notification.data;
    let url = '/';

    // Determine URL based on notification type
    if (data && data.type === 'incoming_call') {
        url = `/call/${data.callId}`;
    } else if (data && data.type === 'message') {
        // Message notification - navigate to chat
        url = `/chat/${data.senderId}`;
    } else if (data && data.conversationId) {
        // Fallback: extract user ID from conversation ID
        const parts = data.conversationId.split('_');
        if (parts.length === 2) {
            // Determine which ID is the other user (not current user)
            // This will be handled by the app routing
            url = `/chat`;
        }
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if app is already open
                for (const client of clientList) {
                    if ('focus' in client) {
                        // Focus existing window and navigate
                        return client.focus().then(() => {
                            if (client.navigate) {
                                return client.navigate(url);
                            }
                        });
                    }
                }
                // Open new window
                if (clients.openWindow) {
                    return clients.openWindow(url);
                }
            })
    );
});
