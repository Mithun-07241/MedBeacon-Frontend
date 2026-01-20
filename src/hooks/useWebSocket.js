import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { getSocket } from '@/lib/socket';

export function useWebSocket(userId, role) {
    const socketRef = useRef(null);
    const queryClient = useQueryClient();
    const { toast } = useToast();

    useEffect(() => {
        if (!userId || !role) return;

        const socket = getSocket();
        socketRef.current = socket;

        if (!socket.connected) {
            socket.connect();
        }

        const onConnect = () => {
            console.log('Socket.io connected:', socket.id);
            socket.emit('user_online', userId);
        };

        const onOnlineUsers = (users) => {
            console.log('Online users:', users);
        };

        const onReceiveMessage = (msg) => {
            console.log('New message:', msg);
        };

        const onNewAlert = () => {
            if (role === 'doctor') {
                queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
                toast({
                    title: "New Patient Alert",
                    description: "A patient needs your attention",
                });
            }
        };

        const onDisconnect = () => {
            console.log('Socket.io disconnected');
        };

        const onConnectError = (err) => {
            console.error('Socket.io connection error:', err);
        };

        socket.on('connect', onConnect);
        socket.on('online_users', onOnlineUsers);
        socket.on('receive_message', onReceiveMessage);
        socket.on('new_alert', onNewAlert);
        socket.on('disconnect', onDisconnect);
        socket.on('connect_error', onConnectError);

        // Initial emit if already connected
        if (socket.connected) {
            socket.emit('user_online', userId);
        }

        return () => {
            socket.off('connect', onConnect);
            socket.off('online_users', onOnlineUsers);
            socket.off('receive_message', onReceiveMessage);
            socket.off('new_alert', onNewAlert);
            socket.off('disconnect', onDisconnect);
            socket.off('connect_error', onConnectError);
            // Do NOT disconnect, as it's a singleton shared by other components
        };
    }, [userId, role, queryClient, toast]);

    return socketRef.current;
}
