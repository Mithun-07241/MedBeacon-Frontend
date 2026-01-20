import React, { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, User } from 'lucide-react';
import { useParams, useLocation } from 'wouter';
import { useCallContext } from '@/context/CallContext';

export default function ActiveCall() {
    const { id } = useParams();
    const [, navigate] = useLocation();
    const { activeCall, callStatus, localStream, remoteStream, endCall } = useCallContext();

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [callDuration, setCallDuration] = useState(0);

    // Set up video streams
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    // Call duration timer
    useEffect(() => {
        if (callStatus === 'connected') {
            const interval = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [callStatus]);

    // Handle call end
    const handleEndCall = async () => {
        await endCall();
        navigate('/');
    };

    // Toggle mute
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

    // Format call duration
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (!activeCall) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="text-center">
                    <p className="text-white text-lg">No active call</p>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const isVideoCall = activeCall.callType === 'video';

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col">
            {/* Call Status Header */}
            <div className="bg-gray-800 p-4 text-center">
                <h2 className="text-white text-xl font-semibold mb-1">
                    {callStatus === 'ringing' && 'Calling...'}
                    {callStatus === 'connecting' && 'Connecting...'}
                    {callStatus === 'connected' && formatDuration(callDuration)}
                </h2>
                <p className="text-gray-400 text-sm">
                    {isVideoCall ? 'Video Call' : 'Voice Call'}
                </p>
            </div>

            {/* Video Container */}
            <div className="flex-1 relative">
                {isVideoCall ? (
                    <>
                        {/* Remote Video */}
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />

                        {/* Local Video (Picture-in-Picture) */}
                        <div className="absolute top-4 right-4 w-32 h-48 bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </>
                ) : (
                    /* Voice Call - Show Avatar */
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                                <User size={64} className="text-white" />
                            </div>
                            <p className="text-white text-xl font-semibold">
                                {/* TODO: Show other user's name */}
                                In Call
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Call Controls */}
            <div className="bg-gray-800 p-6">
                <div className="flex justify-center items-center gap-6">
                    {/* Mute Button */}
                    <button
                        onClick={toggleMute}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted
                            ? 'bg-red-500 hover:bg-red-600'
                            : 'bg-gray-700 hover:bg-gray-600'
                            }`}
                    >
                        {isMuted ? (
                            <MicOff size={24} className="text-white" />
                        ) : (
                            <Mic size={24} className="text-white" />
                        )}
                    </button>

                    {/* End Call Button */}
                    <button
                        onClick={handleEndCall}
                        className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all shadow-lg"
                    >
                        <PhoneOff size={28} className="text-white" />
                    </button>

                    {/* Video Toggle Button (only for video calls) */}
                    {isVideoCall && (
                        <button
                            onClick={toggleVideo}
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isVideoOff
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-gray-700 hover:bg-gray-600'
                                }`}
                        >
                            {isVideoOff ? (
                                <VideoOff size={24} className="text-white" />
                            ) : (
                                <Video size={24} className="text-white" />
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
