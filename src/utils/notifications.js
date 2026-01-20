/**
 * Notification Utility Module
 * Handles local notifications using Tauri notification plugin
 */

import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';

/**
 * Notification channels for Android
 */
export const NOTIFICATION_CHANNELS = {
    CALLS: 'calls',
    APPOINTMENTS: 'appointments',
    MEDICATIONS: 'medications',
    MESSAGES: 'messages',
    ALERTS: 'alerts'
};

/**
 * Check if notification permission is granted
 * @returns {Promise<boolean>}
 */
export async function checkNotificationPermission() {
    try {
        // Check if we're in Tauri environment
        if (!window.__TAURI_INTERNALS__) {
            console.warn('Not in Tauri environment, skipping notification permission check');
            return false;
        }

        const permissionGranted = await isPermissionGranted();
        return permissionGranted;
    } catch (error) {
        console.error('Error checking notification permission:', error);
        return false;
    }
}

/**
 * Request notification permission from user
 * @returns {Promise<boolean>}
 */
export async function requestNotificationPermission() {
    try {
        if (!window.__TAURI_INTERNALS__) {
            console.warn('Not in Tauri environment, skipping notification permission request');
            return false;
        }

        const permission = await requestPermission();
        return permission === 'granted';
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
    }
}

/**
 * Send a local notification
 * @param {Object} options - Notification options
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body
 * @param {string} options.channel - Notification channel ID
 * @param {string} options.icon - Notification icon path
 * @param {Array} options.actions - Notification actions
 * @param {Object} options.data - Additional data
 * @returns {Promise<void>}
 */
export async function sendLocalNotification({ title, body, channel, icon, actions, data }) {
    console.log('🔔 Attempting to send notification:', { title, body, channel });

    try {
        if (!window.__TAURI_INTERNALS__) {
            console.warn('❌ Not in Tauri environment, skipping local notification');
            return;
        }

        // Check permission first
        let permissionGranted = await isPermissionGranted();
        console.log('🔔 Permission status:', permissionGranted);

        if (!permissionGranted) {
            console.log('🔔 Requesting notification permission...');
            const permission = await requestPermission();
            permissionGranted = permission === 'granted';
            console.log('🔔 Permission after request:', permissionGranted);
        }

        if (!permissionGranted) {
            console.error('❌ Notification permission not granted');
            return;
        }

        // Send notification
        console.log('🔔 Sending notification via Tauri plugin...');
        await sendNotification({
            title,
            body,
            icon: icon || '/icon-192x192.png',
            // Note: Tauri notification plugin doesn't support actions directly
            // Actions need to be handled through Android native code
            // For now, we'll use data payload
            ...data
        });

        console.log('✅ Local notification sent successfully:', title);
    } catch (error) {
        console.error('❌ Error sending local notification:', error);
        console.error('Error details:', error.message, error.stack);
        throw error;
    }
}

/**
 * Send incoming call notification
 * @param {Object} callData - Call information
 * @returns {Promise<void>}
 */
export async function sendCallNotification(callData) {
    const { callId, callerName, callType, callerProfilePic } = callData;

    await sendLocalNotification({
        title: `${callType === 'video' ? '📹' : '📞'} Incoming ${callType} call`,
        body: `${callerName} is calling you...`,
        channel: NOTIFICATION_CHANNELS.CALLS,
        icon: callerProfilePic || '/icon-192x192.png',
        data: {
            type: 'incoming_call',
            callId,
            callType,
            callerName
        }
    });
}

/**
 * Send appointment reminder notification
 * @param {Object} appointmentData - Appointment information
 * @returns {Promise<void>}
 */
export async function sendAppointmentReminder(appointmentData) {
    const { appointmentId, doctorName, date, time } = appointmentData;

    await sendLocalNotification({
        title: '📅 Appointment Reminder',
        body: `You have an appointment with Dr. ${doctorName} at ${time} on ${date}`,
        channel: NOTIFICATION_CHANNELS.APPOINTMENTS,
        data: {
            type: 'appointment_reminder',
            appointmentId
        }
    });
}

/**
 * Send medication reminder notification
 * @param {Object} medicationData - Medication information
 * @returns {Promise<void>}
 */
export async function sendMedicationReminder(medicationData) {
    const { medicationId, name, dosage, time } = medicationData;

    await sendLocalNotification({
        title: '💊 Medication Reminder',
        body: `Time to take ${name} (${dosage}) at ${time}`,
        channel: NOTIFICATION_CHANNELS.MEDICATIONS,
        data: {
            type: 'medication_reminder',
            medicationId
        }
    });
}

/**
 * Send new message notification
 * @param {Object} messageData - Message information
 * @returns {Promise<void>}
 */
export async function sendMessageNotification(messageData) {
    const { conversationId, senderName, message } = messageData;

    await sendLocalNotification({
        title: `💬 New message from ${senderName}`,
        body: message,
        channel: NOTIFICATION_CHANNELS.MESSAGES,
        data: {
            type: 'new_message',
            conversationId
        }
    });
}

/**
 * Send alert notification
 * @param {Object} alertData - Alert information
 * @returns {Promise<void>}
 */
export async function sendAlertNotification(alertData) {
    const { title, message, severity } = alertData;

    const icon = severity === 'critical' ? '🚨' : severity === 'warning' ? '⚠️' : 'ℹ️';

    await sendLocalNotification({
        title: `${icon} ${title}`,
        body: message,
        channel: NOTIFICATION_CHANNELS.ALERTS,
        data: {
            type: 'alert',
            severity
        }
    });
}

/**
 * Initialize notification system
 * @returns {Promise<boolean>}
 */
export async function initializeNotifications() {
    try {
        console.log('🔔 Initializing notification system...');

        if (!window.__TAURI_INTERNALS__) {
            console.log('Web environment detected, using FCM only');
            return false;
        }

        console.log('🔔 Tauri environment detected, checking permissions...');
        const hasPermission = await checkNotificationPermission();
        console.log('🔔 Current permission status:', hasPermission);

        if (!hasPermission) {
            console.log('🔔 Requesting notification permission...');
            const granted = await requestNotificationPermission();

            if (granted) {
                console.log('✅ Notification permission granted');

                // Send test notification to confirm it works
                try {
                    await sendLocalNotification({
                        title: '🎉 Notifications Enabled',
                        body: 'You will now receive notifications for messages and calls'
                    });
                    console.log('✅ Test notification sent successfully');
                } catch (err) {
                    console.error('❌ Failed to send test notification:', err);
                }

                return true;
            } else {
                console.warn('⚠️ Notification permission denied');
                return false;
            }
        }

        console.log('✅ Notifications already enabled');

        // Send test notification even if already enabled
        try {
            await sendLocalNotification({
                title: '✅ MedBeacon Ready',
                body: 'Notifications are active'
            });
            console.log('✅ Test notification sent successfully');
        } catch (err) {
            console.error('❌ Failed to send test notification:', err);
        }

        return true;
    } catch (error) {
        console.error('❌ Error initializing notifications:', error);
        console.error('Error details:', error.message, error.stack);
        return false;
    }
}
