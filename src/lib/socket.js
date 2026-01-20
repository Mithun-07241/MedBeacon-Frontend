import { io } from "socket.io-client";

let socket = null;

export const getSocket = () => {
    if (!socket) {
        socket = io("https://my-backend-ii5m.onrender.com", {
            path: '/socket.io',
            withCredentials: true,
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            autoConnect: true
        });
    }
    return socket;
};
