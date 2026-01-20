import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
    `${window.location.origin.replace(":5173", ":5000")}`;

class CallSocketService {
    constructor() {
        this.socket = null;
        this.connected = false;
    }

    connect(userId) {
        if (this.socket && this.connected) {
            console.log('Call socket already connected');
            return this.socket;
        }

        this.socket = io(API_BASE_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        this.socket.on('connect', () => {
            console.log('Call socket connected:', this.socket.id);
            this.connected = true;

            // Register user with their ID
            if (userId) {
                this.socket.emit('register', userId);
            }
        });

        this.socket.on('disconnect', () => {
            console.log('Call socket disconnected');
            this.connected = false;
        });

        this.socket.on('registered', (data) => {
            console.log('User registered for calls:', data);
        });

        this.socket.on('connect_error', (error) => {
            console.error('Call socket connection error:', error);
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
        }
    }

    getSocket() {
        return this.socket;
    }

    isConnected() {
        return this.connected;
    }
}

// Singleton instance
const callSocketService = new CallSocketService();

export default callSocketService;
