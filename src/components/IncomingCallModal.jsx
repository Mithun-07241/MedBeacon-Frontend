import React from 'react';
import { Phone, PhoneOff, Video, User } from 'lucide-react';
import { useCallContext } from '@/context/CallContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
    `${window.location.origin.replace(":5173", ":5000")}`;

export default function IncomingCallModal() {
    const { incomingCall, acceptCall, rejectCall } = useCallContext();

    if (!incomingCall) return null;

    const callerProfilePic = incomingCall.callerProfilePic
        ? incomingCall.callerProfilePic.startsWith('http')
            ? incomingCall.callerProfilePic
            : `${API_BASE_URL}${incomingCall.callerProfilePic}`
        : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                {/* Caller Info */}
                <div className="text-center mb-8">
                    {callerProfilePic ? (
                        <img
                            src={callerProfilePic}
                            alt={incomingCall.callerName}
                            className="w-24 h-24 rounded-full mx-auto mb-4 object-cover ring-4 ring-blue-500"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-4 ring-blue-500">
                            <User size={48} className="text-white" />
                        </div>
                    )}
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {incomingCall.callerName}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2">
                        {incomingCall.callType === 'video' ? (
                            <>
                                <Video size={18} />
                                Incoming video call...
                            </>
                        ) : (
                            <>
                                <Phone size={18} />
                                Incoming voice call...
                            </>
                        )}
                    </p>
                </div>

                {/* Call Actions */}
                <div className="flex gap-4 justify-center">
                    {/* Reject Button */}
                    <button
                        onClick={rejectCall}
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all transform hover:scale-110 shadow-lg">
                            <PhoneOff size={28} className="text-white" />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Decline</span>
                    </button>

                    {/* Accept Button */}
                    <button
                        onClick={acceptCall}
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-all transform hover:scale-110 shadow-lg animate-pulse">
                            <Phone size={28} className="text-white" />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Accept</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
