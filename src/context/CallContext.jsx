import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuthContext } from './AuthContext';
import callSocketService from '@/lib/callSocket';
import { apiRequest } from '@/lib/queryClient';
import { requestNotificationPermission, onForegroundMessage } from '@/lib/firebase';
import { sendCallNotification, initializeNotifications } from '@/utils/notifications';

const CallContext = createContext();

export const useCallContext = () => {
    const context = useContext(CallContext);
    if (!context) {
        throw new Error('useCallContext must be used within CallProvider');
    }
    return context;
};

export const CallProvider = ({ children }) => {
    const { user } = useAuthContext();
    const [incomingCall, setIncomingCall] = useState(null);
    const [activeCall, setActiveCall] = useState(null);
    const [callStatus, setCallStatus] = useState('idle'); // idle, ringing, connecting, connected, ended
    const [peerConnection, setPeerConnection] = useState(null);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);

    const socketRef = useRef(null);
    const ringtoneRef = useRef(null);

    // Initialize socket connection, FCM, and local notifications when user logs in
    useEffect(() => {
        if (user?.id) {
            socketRef.current = callSocketService.connect(user.id);
            setupSocketListeners();
            registerFCMToken();
            setupForegroundMessageListener();
            initializeNotifications(); // Initialize local notifications
        }

        return () => {
            if (socketRef.current) {
                callSocketService.disconnect();
            }
        };
    }, [user]);

    // Register FCM token with backend
    const registerFCMToken = async () => {
        try {
            console.log('🔔 Registering FCM token...');

            // Check if running on Tauri (Android/Desktop)
            if (window.__TAURI_INTERNALS__) {
                console.log('🔔 Tauri environment detected, using native push notifications');

                // Import Tauri notification plugin
                const { registerForPushNotifications } = await import('@tauri-apps/plugin-notification');

                try {
                    // Register for push notifications and get FCM token
                    const fcmToken = await registerForPushNotifications();
                    console.log('✅ FCM Token from Tauri:', fcmToken);

                    if (fcmToken) {
                        // Check if token changed
                        const storedToken = localStorage.getItem('fcmToken');

                        if (storedToken !== fcmToken) {
                            console.log('🔔 FCM token changed, updating backend');

                            // Send token to backend
                            await apiRequest('POST', '/api/fcm/register', {
                                fcmToken,
                                platform: 'android',
                                deviceId: 'tauri-android'
                            });

                            // Store locally
                            localStorage.setItem('fcmToken', fcmToken);
                            console.log('✅ FCM token registered with backend');
                        } else {
                            console.log('✅ FCM token unchanged, skipping registration');
                        }
                    }
                } catch (pushError) {
                    console.error('❌ Failed to register for push notifications:', pushError);
                }
            } else {
                // Web environment - use Firebase
                console.log('🔔 Web environment, using Firebase FCM');
                const fcmToken = await requestNotificationPermission();

                if (fcmToken) {
                    const storedToken = localStorage.getItem('fcmToken');

                    if (storedToken !== fcmToken) {
                        console.log('🔔 FCM token changed, updating backend');

                        await apiRequest('POST', '/api/fcm/register', {
                            fcmToken,
                            platform: 'web',
                            deviceId: navigator.userAgent
                        });

                        localStorage.setItem('fcmToken', fcmToken);
                        console.log('✅ FCM token registered with backend');
                    } else {
                        console.log('✅ FCM token unchanged, skipping registration');
                    }
                }
            }
        } catch (error) {
            console.error('Failed to register FCM token:', error);
        }
    };

    // Listen for foreground messages
    const setupForegroundMessageListener = () => {
        onForegroundMessage((payload) => {
            console.log('Foreground message:', payload);

            // Handle incoming call notification
            if (payload.data?.type === 'incoming_call') {
                const { callId, callerId, callerName, callerProfilePic, callType } = payload.data;
                const callData = {
                    callId,
                    callerId,
                    callerName,
                    callerProfilePic,
                    callType
                };
                setIncomingCall(callData);
                setCallStatus('ringing');
                playRingtone();

                // Send local notification for foreground calls
                sendCallNotification(callData).catch(err =>
                    console.error('Failed to send local notification:', err)
                );
            }
        });
    };

    const setupSocketListeners = () => {
        const socket = socketRef.current;
        if (!socket) return;

        // Incoming call
        socket.on('call:incoming', (data) => {
            console.log('Incoming call:', data);
            setIncomingCall(data);
            setCallStatus('ringing');
            playRingtone();

            // Send local notification
            sendCallNotification(data).catch(err =>
                console.error('Failed to send local notification:', err)
            );
        });

        // Call accepted
        socket.on('call:accepted', async (data) => {
            console.log('Call accepted:', data);
            setCallStatus('connecting');
            stopRingtone();
        });

        // Call rejected
        socket.on('call:rejected', (data) => {
            console.log('Call rejected:', data);
            endCall();
        });

        // Call ended
        socket.on('call:ended', (data) => {
            console.log('Call ended:', data);
            endCall();
        });

        // Receiver is offline
        socket.on('call:receiver-offline', (data) => {
            console.log('Receiver is offline:', data);
            // TODO: Trigger push notification
            setCallStatus('ringing');
        });

        // WebRTC signaling
        socket.on('webrtc:offer', async (data) => {
            console.log('Received WebRTC offer:', data);
            await handleWebRTCOffer(data);
        });

        socket.on('webrtc:answer', async (data) => {
            console.log('Received WebRTC answer:', data);
            await handleWebRTCAnswer(data);
        });

        socket.on('webrtc:ice-candidate', async (data) => {
            console.log('Received ICE candidate:', data);
            await handleICECandidate(data);
        });
    };

    // Initiate a call
    const initiateCall = async (receiverId, callType, receiverName, receiverProfilePic) => {
        try {
            // Create call in database
            const res = await apiRequest('POST', '/api/calls/initiate', {
                receiverId,
                callType
            });

            const { call } = res;
            setActiveCall(call);
            setCallStatus('ringing');

            // Get local media stream
            const stream = await getLocalStream(callType);
            setLocalStream(stream);

            // Create peer connection
            const pc = createPeerConnection(call.callId, receiverId);
            setPeerConnection(pc);

            // Add local stream to peer connection
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            // Create and send offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            // Send call initiation via socket
            socketRef.current.emit('call:initiate', {
                callId: call.callId,
                callerId: user.id,
                receiverId,
                callType,
                callerName: user.username || user.email,
                callerProfilePic: user.profilePicUrl
            });

            // Send WebRTC offer
            socketRef.current.emit('webrtc:offer', {
                receiverId,
                offer,
                callId: call.callId
            });

            playRingtone();
        } catch (error) {
            console.error('Failed to initiate call:', error);
            alert('Failed to initiate call: ' + error.message);
        }
    };

    // Accept incoming call
    const acceptCall = async () => {
        try {
            if (!incomingCall) return;

            stopRingtone();
            setCallStatus('connecting');

            // Update call status in database
            await apiRequest('POST', `/api/calls/${incomingCall.callId}/accept`);

            // Get local media stream
            const stream = await getLocalStream(incomingCall.callType);
            setLocalStream(stream);

            // Notify caller
            socketRef.current.emit('call:accept', {
                callId: incomingCall.callId,
                callerId: incomingCall.callerId
            });

            setActiveCall(incomingCall);
            setIncomingCall(null);
        } catch (error) {
            console.error('Failed to accept call:', error);
            alert('Failed to accept call: ' + error.message);
        }
    };

    // Reject incoming call
    const rejectCall = async () => {
        try {
            if (!incomingCall) return;

            stopRingtone();

            // Update call status in database
            await apiRequest('POST', `/api/calls/${incomingCall.callId}/reject`);

            // Notify caller
            socketRef.current.emit('call:reject', {
                callId: incomingCall.callId,
                callerId: incomingCall.callerId
            });

            setIncomingCall(null);
            setCallStatus('idle');
        } catch (error) {
            console.error('Failed to reject call:', error);
        }
    };

    // End active call
    const endCall = async () => {
        try {
            stopRingtone();

            if (activeCall) {
                // Update call status in database
                await apiRequest('POST', `/api/calls/${activeCall.callId}/end`);

                // Notify other party
                const otherUserId = activeCall.callerId === user.id
                    ? activeCall.receiverId
                    : activeCall.callerId;

                socketRef.current.emit('call:end', {
                    callId: activeCall.callId,
                    otherUserId
                });
            }

            // Clean up
            if (peerConnection) {
                peerConnection.close();
                setPeerConnection(null);
            }

            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
                setLocalStream(null);
            }

            setRemoteStream(null);
            setActiveCall(null);
            setIncomingCall(null);
            setCallStatus('idle');
        } catch (error) {
            console.error('Failed to end call:', error);
        }
    };

    // Get local media stream
    const getLocalStream = async (callType) => {
        try {
            const constraints = {
                audio: true,
                video: callType === 'video'
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            return stream;
        } catch (error) {
            console.error('Failed to get local stream:', error);
            throw new Error('Failed to access camera/microphone');
        }
    };

    // Create WebRTC peer connection
    const createPeerConnection = (callId, otherUserId) => {
        const configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };

        const pc = new RTCPeerConnection(configuration);

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current.emit('webrtc:ice-candidate', {
                    targetUserId: otherUserId,
                    candidate: event.candidate,
                    callId
                });
            }
        };

        // Handle remote stream
        pc.ontrack = (event) => {
            console.log('Received remote track:', event);
            setRemoteStream(event.streams[0]);
            setCallStatus('connected');
        };

        pc.onconnectionstatechange = () => {
            console.log('Connection state:', pc.connectionState);
            if (pc.connectionState === 'connected') {
                setCallStatus('connected');
                stopRingtone();
            } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                endCall();
            }
        };

        return pc;
    };

    // Handle WebRTC offer
    const handleWebRTCOffer = async (data) => {
        try {
            const { offer, callId, senderId } = data;

            // Get local stream
            const stream = await getLocalStream(incomingCall?.callType || 'voice');
            setLocalStream(stream);

            // Create peer connection
            const pc = createPeerConnection(callId, senderId);
            setPeerConnection(pc);

            // Add local stream
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            // Set remote description
            await pc.setRemoteDescription(new RTCSessionDescription(offer));

            // Create answer
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            // Send answer
            socketRef.current.emit('webrtc:answer', {
                callerId: senderId,
                answer,
                callId
            });
        } catch (error) {
            console.error('Failed to handle WebRTC offer:', error);
        }
    };

    // Handle WebRTC answer
    const handleWebRTCAnswer = async (data) => {
        try {
            const { answer } = data;
            if (peerConnection) {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            }
        } catch (error) {
            console.error('Failed to handle WebRTC answer:', error);
        }
    };

    // Handle ICE candidate
    const handleICECandidate = async (data) => {
        try {
            const { candidate } = data;
            if (peerConnection) {
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            }
        } catch (error) {
            console.error('Failed to handle ICE candidate:', error);
        }
    };

    // Ringtone functions
    const playRingtone = () => {
        // TODO: Add actual ringtone audio file
        console.log('Playing ringtone...');
    };

    const stopRingtone = () => {
        console.log('Stopping ringtone...');
    };

    const value = {
        incomingCall,
        activeCall,
        callStatus,
        localStream,
        remoteStream,
        initiateCall,
        acceptCall,
        rejectCall,
        endCall
    };

    return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};
