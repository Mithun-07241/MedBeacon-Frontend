import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuthContext } from './AuthContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import { sendMessageNotification } from '@/utils/notifications';

const NotificationContext = createContext();

export const useNotificationContext = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotificationContext must be used within NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const { user } = useAuthContext();
    const socket = useWebSocket(user?.id, user?.role);
    const [currentChatId, setCurrentChatId] = useState(null);

    useEffect(() => {
        if (!socket || !user) return;

        console.log('🔔 NotificationContext: Setting up global message listener');

        const handleGlobalMessage = async (msg) => {
            console.log('🔔 Global message received:', {
                sender: msg.sender,
                currentUser: user.id,
                currentChatId,
                msgChatId: `${msg.doctorId}_${msg.patientId}`
            });

            // Don't notify if message is from current user
            const isFromOtherUser = msg.sender !== user.id;
            if (!isFromOtherUser) {
                console.log('🔔 Message from self, skipping notification');
                return;
            }

            // Don't notify if viewing this specific chat
            const messageChatId = `${msg.doctorId}_${msg.patientId}`;
            const isCurrentChat = currentChatId === messageChatId;

            if (isCurrentChat) {
                console.log('🔔 Viewing this chat, skipping notification');
                return;
            }

            // Get sender name - prefer username, fallback to "Someone"
            const senderName = msg.senderName || msg.senderUsername || 'Someone';

            console.log('🔔 Sending notification for message from:', senderName);

            try {
                await sendMessageNotification({
                    senderId: msg.sender,
                    senderName: senderName,
                    message: msg.text
                });
            } catch (err) {
                console.error('❌ Failed to send notification:', err);
            }
        };

        socket.on('receive_message', handleGlobalMessage);
        socket.on('new_message', handleGlobalMessage);

        return () => {
            socket.off('receive_message', handleGlobalMessage);
            socket.off('new_message', handleGlobalMessage);
        };
    }, [socket, user, currentChatId]);

    const value = {
        currentChatId,
        setCurrentChatId
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
