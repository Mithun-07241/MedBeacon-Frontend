import BackButton from "@/components/BackButton";
import React, { useState, useEffect, useRef } from 'react';
import { UserPlus } from 'lucide-react';
import { useAuthContext } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { useConversation } from "@elevenlabs/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MobileMenuToggle from "@/components/ui/navbar/MobileMenuToggle";

const VoiceAssistant = () => {
    const { user } = useAuthContext();
    const [, setLocation] = useLocation();
    const [agentId] = useState("agent_3801k7k35avfeyxan286z8r34yj9"); // replace with your public agent ID
    const [userId] = useState(user?.id || "demo-user-001");
    const [connected, setConnected] = useState(false);
    const [micMuted, setMicMuted] = useState(false);
    const [volume, setVolume] = useState(0.8);
    const [message, setMessage] = useState('');
    const [audioLevel, setAudioLevel] = useState(0);
    const canvasRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animationFrameRef = useRef();
    const mediaStreamRef = useRef(null);

    const conversation = useConversation({
        micMuted,
        volume,
        onConnect: () => {
            setConnected(true);
            setMicMuted(false);
            startAudioVisualization();
        },
        onDisconnect: () => {
            setConnected(false);
            setMicMuted(true);
            stopAudioVisualization();
        },
        onError: (err) => { },
    });

    const startAudioVisualization = async () => {
        try {
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                return;
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            audioContextRef.current = new AudioContext();
            analyserRef.current = audioContextRef.current.createAnalyser();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);
            analyserRef.current.fftSize = 512;
            analyserRef.current.smoothingTimeConstant = 0.85;

            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const updateLevel = () => {
                if (analyserRef.current && connected) {
                    analyserRef.current.getByteFrequencyData(dataArray);
                    const average = dataArray.reduce((a, b) => a + b) / bufferLength;
                    setAudioLevel(Math.min(average / 128, 1));
                    animationFrameRef.current = requestAnimationFrame(updateLevel);
                }
            };

            updateLevel();
        } catch (err) {
            console.error("Audio visualization failed:", err);
        }
    };

    const stopAudioVisualization = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = undefined;
        }

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }

        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        analyserRef.current = null;
        setAudioLevel(0);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !connected) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        let time = 0;
        let animFrame;

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            time += 0.03;
            const numWaves = 5;

            for (let i = 0; i < numWaves; i++) {
                const baseRadius = 60 + i * 20;
                const numPoints = 64;
                const amplitude = 6 + audioLevel * 15;
                const frequency = 4 + i * 0.5;

                ctx.beginPath();

                for (let j = 0; j <= numPoints; j++) {
                    const angle = (j / numPoints) * Math.PI * 2;
                    const wave1 = Math.sin(angle * frequency + time * 2) * amplitude;
                    const wave2 = Math.cos(angle * (frequency - 1) - time * 1.5) * (amplitude * 0.5);
                    const radius = baseRadius + wave1 + wave2;

                    const x = centerX + Math.cos(angle) * radius;
                    const y = centerY + Math.sin(angle) * radius;

                    if (j === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }

                ctx.closePath();
                const opacity = 0.4 - i * 0.06;
                ctx.strokeStyle = `rgba(37, 99, 235, ${opacity})`;
                ctx.lineWidth = 2.5;
                ctx.stroke();

                ctx.fillStyle = `rgba(37, 99, 235, ${opacity * 0.15})`;
                ctx.fill();
            }

            animFrame = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animFrame) {
                cancelAnimationFrame(animFrame);
            }
        };
    }, [connected, audioLevel]);

    useEffect(() => {
        return () => {
            stopAudioVisualization();
        };
    }, []);

    const requestMicAccess = async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (err) {
            console.error("Microphone access denied.");
        }
    };

    const startConversation = async () => {
        try {
            await requestMicAccess();
            await conversation.startSession({
                agentId,
                connectionType: "webrtc",
                userId,
            });
        } catch (error) {
            console.error("Failed to start conversation:", error);
        }
    };

    const endConversation = async () => {
        await conversation.endSession();
    };

    const handleLogoClick = () => {
        if (!connected) {
            startConversation();
        }
    };

    const handleHomeClick = () => {
        if (user?.role === 'doctor') {
            setLocation('/doctor-dashboard');
        } else if (user?.role === 'patient') {
            setLocation('/patient-dashboard');
        } else {
            setLocation('/');
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim()) return;

        if (!connected) {
            await startConversation();
        }

        await conversation.sendUserMessage(message);
        setMessage("");
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <DashboardLayout>
            <div className="flex-1 overflow-auto flex flex-col h-full">
                <div className="min-h-full bg-gray-50 flex flex-col">
                    {/* Header */}
                    <header className="flex items-center justify-between px-4 md:px-6 py-4 bg-white border-b sticky top-0 z-10">
                        <div className="flex items-center gap-4">
                            <MobileMenuToggle />
                            <BackButton className="mb-0" />
                            <div className="items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 border rounded-lg hover:bg-gray-50 cursor-pointer hidden sm:flex" onClick={handleHomeClick}>
                                <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                </svg>
                                <span className="font-medium text-sm md:text-base">MedBeacon AI</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 md:gap-4">
                            <button className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 text-sm hover:bg-gray-100 rounded-lg">
                                <UserPlus className="w-4 h-4" />
                                <span className="hidden sm:inline">Invite</span>
                            </button>
                            <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-medium">
                                {user?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        </div>
                    </header>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8 md:pb-32 overflow-hidden">
                        {/* Logo with Voice Waves */}
                        <div className="relative mb-8 md:mb-12 flex items-center justify-center" style={{ width: '250px', height: '250px' }}>
                            {/* Canvas for wavy animation */}
                            {connected && (
                                <canvas
                                    ref={canvasRef}
                                    width={300}
                                    height={300}
                                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                                    style={{ pointerEvents: 'none' }}
                                />
                            )}

                            {/* Logo */}
                            <button
                                onClick={handleLogoClick}
                                disabled={connected}
                                className={`relative w-24 h-24 bg-linear-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center shadow-lg transition-all z-10 ${connected ? 'ring-4 ring-green-400 ring-opacity-50' : 'hover:scale-105 cursor-pointer'
                                    }`}
                            >
                                <span className="text-white font-bold text-2xl">MB</span>
                            </button>
                        </div>

                        <h1 className="text-xl md:text-2xl font-semibold mb-12 md:mb-20 text-center text-gray-800">
                            {connected ? "Listening..." : "Tap MB to start conversation"}
                        </h1>

                        {/* Voice Input Box */}
                        <div className="w-full max-w-md mx-auto">
                            <div className="relative bg-white border-2 border-gray-900 rounded-2xl p-4 md:p-6 shadow-sm">
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Type a message or just speak..."
                                    className="w-full h-16 md:h-20 resize-none text-sm md:text-base focus:outline-none placeholder:text-gray-400"
                                />

                                <div className="flex items-center justify-between mt-4">
                                    <button
                                        onClick={endConversation}
                                        disabled={!connected}
                                        className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded transition-colors ${connected
                                            ? 'hover:bg-red-50 text-red-600 cursor-pointer'
                                            : 'text-gray-300 cursor-not-allowed'
                                            }`}
                                    >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                            <line x1="23" y1="1" x2="1" y2="23" />
                                        </svg>
                                        <span>End call</span>
                                    </button>
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!message.trim()}
                                        className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default VoiceAssistant;
