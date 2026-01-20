import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Monitor, MonitorOff } from 'lucide-react';

const SOCKET_URL = "https://my-backend-ii5m.onrender.com";
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

export default function VideoCall({ roomId, userName = 'User' }) {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState('');
    const [callStatus, setCallStatus] = useState('Initializing...');

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const socketRef = useRef(null);
    const screenStreamRef = useRef(null);

    // Initialize Socket.IO
    useEffect(() => {
        socketRef.current = io(SOCKET_URL, {
            transports: ['websocket'],
            reconnection: true
        });

        socketRef.current.on('connect', () => {
            console.log('Connected to signaling server');
            setCallStatus('Connected to server');
            socketRef.current.emit('join-room', { roomId, userName });
        });

        socketRef.current.on('user-joined', ({ userName: joinedUser }) => {
            console.log(`${joinedUser} joined the room`);
            setCallStatus(`${joinedUser} joined`);
        });

        socketRef.current.on('offer', handleReceiveOffer);
        socketRef.current.on('answer', handleReceiveAnswer);
        socketRef.current.on('ice-candidate', handleReceiveIceCandidate);
        socketRef.current.on('user-left', handleUserLeft);

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [roomId, userName]);

    // Initialize local media
    useEffect(() => {
        const initMedia = async () => {
            try {
                setCallStatus('Requesting camera and microphone...');
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 1280, height: 720 },
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });

                setLocalStream(stream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
                setCallStatus('Ready to connect');

                // Create peer connection once media is ready
                createPeerConnection(stream);
            } catch (err) {
                console.error('Error accessing media devices:', err);
                setError('Failed to access camera/microphone. Please grant permissions.');
                setCallStatus('Media access denied');
            }
        };

        initMedia();

        return () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Create RTCPeerConnection
    const createPeerConnection = (stream) => {
        try {
            const peerConnection = new RTCPeerConnection(ICE_SERVERS);
            peerConnectionRef.current = peerConnection;

            // Add local tracks to peer connection
            stream.getTracks().forEach(track => {
                peerConnection.addTrack(track, stream);
            });

            // Handle incoming remote tracks
            peerConnection.ontrack = (event) => {
                console.log('Received remote track');
                const [remoteStream] = event.streams;
                setRemoteStream(remoteStream);
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = remoteStream;
                }
                setIsConnected(true);
                setCallStatus('Connected');
            };

            // Handle ICE candidates
            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('Sending ICE candidate');
                    socketRef.current.emit('ice-candidate', {
                        roomId,
                        candidate: event.candidate
                    });
                }
            };

            // Handle connection state changes
            peerConnection.onconnectionstatechange = () => {
                console.log('Connection state:', peerConnection.connectionState);
                setCallStatus(`Connection: ${peerConnection.connectionState}`);

                if (peerConnection.connectionState === 'connected') {
                    setIsConnected(true);
                    setCallStatus('Call in progress');
                } else if (peerConnection.connectionState === 'disconnected') {
                    setCallStatus('Disconnected');
                } else if (peerConnection.connectionState === 'failed') {
                    setCallStatus('Connection failed');
                    setError('Connection failed. Please try again.');
                }
            };

            // Create and send offer
            createAndSendOffer(peerConnection);

        } catch (err) {
            console.error('Error creating peer connection:', err);
            setError('Failed to establish connection');
        }
    };

    // Create and send WebRTC offer
    const createAndSendOffer = async (peerConnection) => {
        try {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            console.log('Sending offer');
            socketRef.current.emit('offer', {
                roomId,
                offer: peerConnection.localDescription
            });
        } catch (err) {
            console.error('Error creating offer:', err);
        }
    };

    // Handle received offer
    const handleReceiveOffer = async ({ offer }) => {
        try {
            console.log('Received offer');
            const peerConnection = peerConnectionRef.current;

            if (!peerConnection) {
                console.error('Peer connection not initialized');
                return;
            }

            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            console.log('Sending answer');
            socketRef.current.emit('answer', {
                roomId,
                answer: peerConnection.localDescription
            });
        } catch (err) {
            console.error('Error handling offer:', err);
        }
    };

    // Handle received answer
    const handleReceiveAnswer = async ({ answer }) => {
        try {
            console.log('Received answer');
            const peerConnection = peerConnectionRef.current;

            if (!peerConnection) {
                console.error('Peer connection not initialized');
                return;
            }

            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
            console.error('Error handling answer:', err);
        }
    };

    // Handle received ICE candidate
    const handleReceiveIceCandidate = async ({ candidate }) => {
        try {
            console.log('Received ICE candidate');
            const peerConnection = peerConnectionRef.current;

            if (!peerConnection) {
                console.error('Peer connection not initialized');
                return;
            }

            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
            console.error('Error adding ICE candidate:', err);
        }
    };

    // Handle user left
    const handleUserLeft = () => {
        console.log('User left the room');
        setCallStatus('User disconnected');
        setIsConnected(false);
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }
        setRemoteStream(null);
    };

    // Toggle microphone
    const toggleMute = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    // Toggle video
    const toggleVideo = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    };

    // Toggle screen sharing
    const toggleScreenShare = async () => {
        try {
            if (!isScreenSharing) {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { cursor: 'always' },
                    audio: false
                });

                screenStreamRef.current = screenStream;

                const screenTrack = screenStream.getVideoTracks()[0];
                const peerConnection = peerConnectionRef.current;

                if (peerConnection) {
                    const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
                    if (sender) {
                        sender.replaceTrack(screenTrack);
                    }
                }

                screenTrack.onended = () => {
                    toggleScreenShare();
                };

                setIsScreenSharing(true);
            } else {
                const peerConnection = peerConnectionRef.current;
                const videoTrack = localStream.getVideoTracks()[0];

                if (peerConnection && videoTrack) {
                    const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
                    if (sender) {
                        sender.replaceTrack(videoTrack);
                    }
                }

                if (screenStreamRef.current) {
                    screenStreamRef.current.getTracks().forEach(track => track.stop());
                    screenStreamRef.current = null;
                }

                setIsScreenSharing(false);
            }
        } catch (err) {
            console.error('Error toggling screen share:', err);
            setError('Screen sharing failed');
        }
    };

    // End call
    const endCall = () => {
        // Stop all tracks
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
        }

        // Close peer connection
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        // Disconnect socket
        if (socketRef.current) {
            socketRef.current.emit('leave-room', { roomId });
            socketRef.current.disconnect();
        }

        // Clear state
        setLocalStream(null);
        setRemoteStream(null);
        setIsConnected(false);
        setCallStatus('Call ended');

        // Redirect or show end call screen
        window.location.href = '/';
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <div style={styles.logo}>M</div>
                    <div>
                        <h1 style={styles.title}>MedBeacon Consultation</h1>
                        <p style={styles.subtitle}>Room: {roomId}</p>
                    </div>
                </div>
                <div style={styles.statusBadge}>
                    <div style={{ ...styles.statusDot, backgroundColor: isConnected ? '#10b981' : '#6b7280' }}></div>
                    {callStatus}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div style={styles.errorBanner}>
                    {error}
                </div>
            )}

            {/* Video Grid */}
            <div style={styles.videoGrid}>
                {/* Remote Video (Main) */}
                <div style={styles.remoteVideoContainer}>
                    {remoteStream ? (
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            style={styles.remoteVideo}
                        />
                    ) : (
                        <div style={styles.waitingScreen}>
                            <div style={styles.waitingIcon}>
                                <Video size={64} color="#6b7280" />
                            </div>
                            <p style={styles.waitingText}>Waiting for participant to join...</p>
                        </div>
                    )}

                    {/* Local Video (Picture-in-Picture) */}
                    <div style={styles.localVideoContainer}>
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            style={styles.localVideo}
                        />
                        {isVideoOff && (
                            <div style={styles.videoOffOverlay}>
                                <VideoOff size={32} color="#fff" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div style={styles.controls}>
                <button
                    onClick={toggleMute}
                    style={{
                        ...styles.controlButton,
                        backgroundColor: isMuted ? '#ef4444' : '#000'
                    }}
                    title={isMuted ? 'Unmute' : 'Mute'}
                >
                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </button>

                <button
                    onClick={toggleVideo}
                    style={{
                        ...styles.controlButton,
                        backgroundColor: isVideoOff ? '#ef4444' : '#000'
                    }}
                    title={isVideoOff ? 'Enable Video' : 'Disable Video'}
                >
                    {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                </button>

                <button
                    onClick={toggleScreenShare}
                    style={{
                        ...styles.controlButton,
                        backgroundColor: isScreenSharing ? '#3b82f6' : '#000'
                    }}
                    title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
                >
                    {isScreenSharing ? <MonitorOff size={24} /> : <Monitor size={24} />}
                </button>

                <button
                    onClick={endCall}
                    style={{
                        ...styles.controlButton,
                        backgroundColor: '#ef4444',
                        width: '64px',
                        height: '64px'
                    }}
                    title="End Call"
                >
                    <PhoneOff size={28} />
                </button>
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#0f172a',
        color: '#fff',
        overflow: 'hidden'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 10
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
    },
    logo: {
        width: '48px',
        height: '48px',
        backgroundColor: '#000',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#fff'
    },
    title: {
        fontSize: '20px',
        fontWeight: 'bold',
        margin: 0
    },
    subtitle: {
        fontSize: '14px',
        color: '#9ca3af',
        margin: 0
    },
    statusBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '24px',
        fontSize: '14px'
    },
    statusDot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        animation: 'pulse 2s infinite'
    },
    errorBanner: {
        padding: '12px 24px',
        backgroundColor: '#ef4444',
        color: '#fff',
        textAlign: 'center',
        fontSize: '14px'
    },
    videoGrid: {
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '16px',
        position: 'relative'
    },
    remoteVideoContainer: {
        width: '100%',
        height: '100%',
        backgroundColor: '#1e293b',
        borderRadius: '16px',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
    },
    remoteVideo: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
    },
    waitingScreen: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '16px'
    },
    waitingIcon: {
        width: '128px',
        height: '128px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '50%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    },
    waitingText: {
        fontSize: '18px',
        color: '#9ca3af'
    },
    localVideoContainer: {
        position: 'absolute',
        bottom: '24px',
        right: '24px',
        width: '240px',
        height: '180px',
        backgroundColor: '#000',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
    },
    localVideo: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: 'scaleX(-1)'
    },
    videoOffOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    },
    controls: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '16px',
        padding: '24px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
    },
    controlButton: {
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        border: 'none',
        color: '#fff',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
    }
};
