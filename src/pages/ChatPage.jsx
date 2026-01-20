import React, { useEffect, useMemo, useRef, useState } from "react";
import BackButton from "@/components/BackButton";
import {
    ArrowLeft,
    Phone,
    Video,
    Send,
    Search,
    Mic,
    Smile,
    Image, PhoneOff, MicOff, VideoOff, X, MoreHorizontal,
} from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { useNotificationContext } from "@/context/NotificationContext";
import { useParams, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { getSocket } from "@/lib/socket";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MobileMenuToggle from "@/components/ui/navbar/MobileMenuToggle";
import { useQueryClient } from '@tanstack/react-query';

/* =========================================================
   MAIN
========================================================= */
const MessagingApp = () => {
    const { user } = useAuthContext();
    const { setCurrentChatId } = useNotificationContext();
    const { id: otherUserId } = useParams();
    const [, setLocation] = useLocation();
    const socket = getSocket();
    const queryClient = useQueryClient();

    const isDoctor = user?.role === "doctor";
    const doctorId = isDoctor ? user?.id : otherUserId;
    const patientId = isDoctor ? otherUserId : user?.id;

    const [chatList, setChatList] = useState([]);
    const [userMap, setUserMap] = useState({});
    const [messages, setMessages] = useState([]);
    const [chatUser, setChatUser] = useState(null);

    const [newMessage, setNewMessage] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [messageSearchQuery, setMessageSearchQuery] = useState(""); // NEW: Search within chat
    const [showMsgSearch, setShowMsgSearch] = useState(false); // NEW: Toggle search input in sidebar
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [typingUser, setTypingUser] = useState(null);

    const typingTimeout = useRef(null);
    const messagesEndRef = useRef(null);

    // Filter messages for search
    const displayedMessages = useMemo(() => {
        if (!messageSearchQuery.trim()) return messages;
        return messages.filter(m => m.text.toLowerCase().includes(messageSearchQuery.toLowerCase()));
    }, [messages, messageSearchQuery]);

    // ... (existing WebRTC state)
    const [stream, setStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null); // NEW: Manage remote stream in state
    const [receivingCall, setReceivingCall] = useState(false);
    const [caller, setCaller] = useState("");
    const [callerSignal, setCallerSignal] = useState(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [name, setName] = useState("");
    const [isVideoCall, setIsVideoCall] = useState(true);
    const [micOn, setMicOn] = useState(true);
    const [cameraOn, setCameraOn] = useState(true);

    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();
    const iceCandidatesQueue = useRef([]); // NEW: Queue for early ICE candidates
    const configuration = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };


    /* ===============================
       SOCKET SETUP
    ================================ */

    useEffect(() => {
        if (!user || !socket) return;

        // 1. Declare Online
        socket.emit("user_online", user.id);

        // 2. Listeners
        const handleOnlineUsers = (users) => setOnlineUsers(users);
        const handleReceiveMessage = (msg) => {
            console.log('📩 ChatPage: Received message');
            setMessages((prev) => [...prev, msg]);

            // Note: Notification handling is now in NotificationContext (global)

            // Update chat list with new message and increment unread if not in current chat
            setChatList(prevChats => {
                const chatIndex = prevChats.findIndex(c =>
                    c.doctorId === msg.doctorId && c.patientId === msg.patientId
                );

                if (chatIndex >= 0) {
                    const updatedChats = [...prevChats];
                    const chat = updatedChats[chatIndex];

                    // Only increment unread if this message is not from current chat or user is sender
                    const isCurrentChat = msg.doctorId === doctorId && msg.patientId === patientId;
                    const isUserSender = msg.sender === user.id;

                    updatedChats[chatIndex] = {
                        ...chat,
                        lastMessage: msg.text,
                        updatedAt: msg.timestamp || new Date().toISOString(),
                        unreadCount: (isCurrentChat || isUserSender) ? 0 : (chat.unreadCount || 0) + 1
                    };

                    return updatedChats;
                }
                return prevChats;
            });

            scrollToBottom();
        };
        const handleTyping = () => setTypingUser(otherUserId); // Simplified for now
        const handleStopTyping = () => setTypingUser(null);

        // WebRTC: Helper to add candidate safely
        const addCandidate = async (candidate) => {
            try {
                if (connectionRef.current && connectionRef.current.remoteDescription) {
                    await connectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                } else {
                    iceCandidatesQueue.current.push(candidate);
                }
            } catch (err) {
                console.error("Error adding ice candidate", err);
            }
        };

        socket.on("online_users", handleOnlineUsers);
        socket.on("receive_message", handleReceiveMessage);
        socket.on("typing", handleTyping);
        socket.on("stop_typing", handleStopTyping);

        // WebRTC Signaling Listeners
        socket.on("callUser", (data) => {
            setReceivingCall(true);
            setCaller(data.from);
            setName(data.name);
            setCallerSignal(data.signal);
        });

        socket.on("callAccepted", async (signal) => {
            setCallAccepted(true);
            if (connectionRef.current) {
                try {
                    await connectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
                    // Process queued candidates
                    while (iceCandidatesQueue.current.length > 0) {
                        const candidate = iceCandidatesQueue.current.shift();
                        await connectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                    }
                } catch (err) {
                    console.error("Error setting remote description", err);
                }
            }
        });

        socket.on("iceCandidate", async (candidate) => {
            if (connectionRef.current) {
                await addCandidate(candidate);
            }
        });

        socket.on("endCall", () => {
            setCallEnded(true);
            setReceivingCall(false);
            setCallAccepted(false);
            setRemoteStream(null); // Clear remote stream
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }
            if (connectionRef.current) {
                connectionRef.current.close();
            }
            window.location.reload();
        });

        return () => {
            socket.off("online_users", handleOnlineUsers);
            socket.off("receive_message", handleReceiveMessage);
            socket.off("typing", handleTyping);
            socket.off("stop_typing", handleStopTyping);
            socket.off("callUser");
            socket.off("callAccepted");
            socket.off("iceCandidate");
            socket.off("endCall");
        };
    }, [user, socket, otherUserId]);

    // NEW: Effect to attach remote stream to video element
    useEffect(() => {
        if (userVideo.current && remoteStream) {
            userVideo.current.srcObject = remoteStream;
        }
    }, [remoteStream, callAccepted]); // Re-run when stream arrives or call gets accepted (video mounts)

    /* ===============================
       JOIN ROOM
    ================================ */
    useEffect(() => {
        if (doctorId && patientId && socket) {
            const chatId = `${doctorId}_${patientId}`;

            // Tell NotificationContext which chat is active
            console.log('📍 Setting current chat:', chatId);
            setCurrentChatId(chatId);

            socket.emit("join_chat", { doctorId, patientId });

            // Optimistically clear unread count for this chat
            setChatList(prevChats =>
                prevChats.map(chat => {
                    const chatDoctorId = chat.doctorId;
                    const chatPatientId = chat.patientId;
                    if (chatDoctorId === doctorId && chatPatientId === patientId) {
                        return { ...chat, unreadCount: 0 };
                    }
                    return chat;
                })
            );
        }

        // Clear current chat when leaving
        return () => {
            console.log('📍 Clearing current chat');
            setCurrentChatId(null);
        };
    }, [doctorId, patientId, socket, setCurrentChatId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);


    /* ===============================
       LOAD CHATS + USERS
    ================================ */
    const refreshChats = async () => {
        try {
            const chats = await apiRequest("GET", "/api/chat");
            setChatList(chats);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        async function load() {
            await refreshChats();

            try {
                const users = await apiRequest(
                    "GET",
                    isDoctor ? "/api/patients" : "/api/doctors"
                );

                const map = {};
                users.forEach((u) => (map[u.id] = u));
                setUserMap(map);
            } catch (err) {
                console.error(err);
            }
        }
        load();
    }, [isDoctor]);

    /* ===============================
       LOAD CHAT USER & MESSAGES
    ================================ */
    useEffect(() => {
        if (!otherUserId) {
            setChatUser(null);
            return;
        }
        setChatUser(userMap[otherUserId]);

        if (doctorId && patientId) {
            // mark chat as read
            apiRequest("POST", "/api/chat/read", { doctorId, patientId })
                .then(() => {
                    refreshChats();
                    // Invalidate notification cache to update badge immediately
                    queryClient.invalidateQueries({ queryKey: ['/api/chat'] });
                })
                .catch(console.error);

            // load messages
            apiRequest("GET", `/api/chat/${doctorId}/${patientId}`)
                .then(setMessages)
                .catch(console.error);
        }
    }, [otherUserId, userMap, doctorId, patientId, queryClient]);


    /* ===============================
       SEND MESSAGE
    ================================ */
    const sendMessage = async () => {
        if (!newMessage.trim()) return;

        try {
            const msg = await apiRequest("POST", "/api/chat/send", {
                doctorId,
                patientId,
                text: newMessage,
            });

            // Optimistic update handled by socket receive usually, but safe to add if socket is slow
            // However, socket.emit("send_message") triggers "receive_message" to others.
            // Current backend socket.js: socket.to(room).emit("receive_message", msg);
            // So SENDER does NOT get "receive_message" back from server via socket.
            // We must add it manually here for the sender.

            socket.emit("send_message", msg);
            setMessages((prev) => [...prev, msg]);
            setNewMessage("");
            refreshChats();
            scrollToBottom();
        } catch (err) {
            console.error("Failed to send", err);
        }
    };

    /* ===============================
       TYPING
    ================================ */
    const handleTypingInput = () => {
        if (doctorId && patientId) {
            const room = `${doctorId}_${patientId}`;
            socket.emit("typing", { room });

            clearTimeout(typingTimeout.current);
            typingTimeout.current = setTimeout(() => {
                socket.emit("stop_typing", { room });
            }, 1000);
        }
    };

    /* ===============================
       FILTER CHATS
    ================================ */
    const filteredChats = useMemo(() => {
        return chatList
            .sort(
                (a, b) =>
                    new Date(b.updatedAt).getTime() -
                    new Date(a.updatedAt).getTime()
            )
            .filter((chat) => {
                const id = isDoctor ? chat.patientId : chat.doctorId;
                return userMap[id]?.username
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase());
            });
    }, [chatList, searchQuery, userMap, isDoctor]);

    const formatTime = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    /* ===============================
       UI HELPERS
    ================================ */
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `${window.location.origin.replace(':5173', ':5000')}`;

    const getProfileSrc = (u) => {
        if (!u?.profilePicUrl) return null;
        return u.profilePicUrl.startsWith("http")
            ? u.profilePicUrl
            : `${API_BASE_URL}${u.profilePicUrl}`;
    };

    const handleViewProfile = () => {
        if (!chatUser) return;
        const profilePath = isDoctor
            ? `/patients/${chatUser.id}`
            : `/doctors/${chatUser.id}`;
        setLocation(profilePath);
    };

    /* ===============================
       WEBRTC FUNCTIONS
    ================================ */
    const startCall = async (video = true) => {
        setIsVideoCall(video);
        setCallEnded(false);
        setMicOn(true);
        setCameraOn(video);

        try {
            const currentStream = await navigator.mediaDevices.getUserMedia({ video, audio: true });
            setStream(currentStream);
            if (myVideo.current) myVideo.current.srcObject = currentStream;

            const peer = new RTCPeerConnection(configuration);
            connectionRef.current = peer;

            currentStream.getTracks().forEach(track => peer.addTrack(track, currentStream));

            peer.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("iceCandidate", { to: otherUserId, candidate: event.candidate });
                }
            };

            peer.ontrack = (event) => {
                setRemoteStream(event.streams[0]); // store in state
            };

            // Toggle tracks based on initial state
            currentStream.getAudioTracks()[0].enabled = true; // Mic always starts on
            if (video) currentStream.getVideoTracks()[0].enabled = true;

            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);

            socket.emit("callUser", {
                userToCall: otherUserId,
                signalData: offer,
                from: user.id,
                name: user.username,
                isVideo: video
            });

        } catch (err) {
            console.error("Error starting call:", err);
            alert("Could not start call. Please allow camera/microphone access.");
        }
    };

    const answerCall = async () => {
        setCallAccepted(true);
        setMicOn(true);
        setCameraOn(isVideoCall);

        try {
            const currentStream = await navigator.mediaDevices.getUserMedia({ video: isVideoCall, audio: true });
            setStream(currentStream);
            if (myVideo.current) myVideo.current.srcObject = currentStream;

            const peer = new RTCPeerConnection(configuration);
            connectionRef.current = peer;

            currentStream.getTracks().forEach(track => peer.addTrack(track, currentStream));

            peer.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("iceCandidate", { to: caller, candidate: event.candidate });
                }
            };

            peer.ontrack = (event) => {
                setRemoteStream(event.streams[0]); // store in state
            };

            await peer.setRemoteDescription(new RTCSessionDescription(callerSignal));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);

            // Process queued candidates
            while (iceCandidatesQueue.current.length > 0) {
                const candidate = iceCandidatesQueue.current.shift();
                await connectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            }

            socket.emit("answerCall", { signal: answer, to: caller });

        } catch (err) {
            console.error("Error answering call:", err);
        }
    };

    const leaveCall = () => {
        setCallEnded(true);
        if (connectionRef.current) {
            connectionRef.current.close();
        }
        socket.emit("endCall", { to: otherUserId || caller });
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
            setStream(null);
        }
        setRemoteStream(null);
        setReceivingCall(false);
        setCallAccepted(false);
        window.location.reload();
    };


    const toggleMic = () => {
        const track = stream?.getAudioTracks()[0];
        if (track) {
            track.enabled = !track.enabled;
            setMicOn(track.enabled);
        }
    };

    const toggleCamera = () => {
        const track = stream?.getVideoTracks()[0];
        if (track) {
            track.enabled = !track.enabled;
            setCameraOn(track.enabled);
        }
    };

    /* ===============================
       UI
    ================================ */
    return (
        <DashboardLayout>
            <div className={`flex h-full bg-white dark:bg-slate-900`}>
                {/* SIDEBAR */}
                <div className={`w-full md:w-[320px] border-r flex flex-col bg-white dark:bg-slate-900 ${otherUserId ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b bg-gray-50/50">
                        <div className="flex items-center gap-2 mb-4">
                            <MobileMenuToggle />
                            <BackButton className="mb-0" />
                            <h1 className="text-xl font-bold text-gray-900">MedBeacon</h1>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                                placeholder="Search chats..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {filteredChats.map((chat) => {
                            const id = isDoctor ? chat.patientId : chat.doctorId;
                            const u = userMap[id];
                            if (!u) return null;

                            return (
                                <ChatListItem
                                    key={id}
                                    user={u}
                                    online={onlineUsers.includes(id)}
                                    unread={chat.unreadCount || 0}
                                    lastMessage={chat.lastMessage}
                                    time={chat.updatedAt}
                                    onClick={() => setLocation(`/chat/${id}`)}
                                    active={otherUserId === id}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* VIDEO CALL OVERLAY - MODERN UI */}
                {(receivingCall || callAccepted) && !callEnded && (
                    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
                        {/* Remote Video - Full Screen */}
                        {callAccepted ? (
                            <div className="relative w-full h-full">
                                <video
                                    playsInline
                                    ref={userVideo}
                                    autoPlay
                                    className="w-full h-full object-cover"
                                />
                                {!remoteStream && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900 border-b border-gray-800">
                                        <div className="text-white text-center">
                                            <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4" />
                                            <p>Connecting...</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Incoming Call / Dialing Screen
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/95 backdrop-blur-xl z-30">
                                <div className="w-32 h-32 rounded-full bg-linear-to-br from-gray-700 to-black border-4 border-gray-800 flex items-center justify-center text-5xl text-white font-bold mb-8 shadow-2xl">
                                    {name?.[0]?.toUpperCase()}
                                </div>
                                <h3 className="text-3xl font-bold text-white mb-2">{name}</h3>
                                <p className="text-gray-400 mb-12 animate-pulse">{receivingCall ? "Incoming Call..." : "Calling..."}</p>

                                {receivingCall && (
                                    <div className="flex gap-16">
                                        <div className="flex flex-col items-center gap-2">
                                            <button onClick={answerCall} className="w-20 h-20 bg-green-500 rounded-full hover:bg-green-600 transition-all hover:scale-110 flex items-center justify-center shadow-lg shadow-green-900/50">
                                                <Phone className="w-8 h-8 text-white fill-current" />
                                            </button>
                                            <span className="text-sm text-gray-400">Accept</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-2">
                                            <button onClick={leaveCall} className="w-20 h-20 bg-red-500 rounded-full hover:bg-red-600 transition-all hover:scale-110 flex items-center justify-center shadow-lg shadow-red-900/50">
                                                <PhoneOff className="w-8 h-8 text-white fill-current" />
                                            </button>
                                            <span className="text-sm text-gray-400">Decline</span>
                                        </div>
                                    </div>
                                )}
                                {!receivingCall && (
                                    <button onClick={leaveCall} className="w-16 h-16 bg-red-500/20 text-red-500 border border-red-500/50 rounded-full hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                                        <X className="w-8 h-8" />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* My Video - Draggable look (Fixed for now) */}
                        {callAccepted && stream && cameraOn && (
                            <div className="absolute top-8 right-8 w-48 aspect-3/4 bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 transition-transform hover:scale-105 z-40 hidden md:block">
                                <video
                                    playsInline
                                    muted
                                    ref={myVideo}
                                    autoPlay
                                    className="w-full h-full object-cover"
                                    style={{ transform: "scaleX(-1)" }}
                                />
                            </div>
                        )}
                        {/* My Video - Mobile Small */}
                        {callAccepted && stream && cameraOn && (
                            <div className="absolute top-4 right-4 w-28 aspect-3/4 bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10 z-40 md:hidden">
                                <video
                                    playsInline
                                    muted
                                    ref={myVideo}
                                    autoPlay
                                    className="w-full h-full object-cover"
                                    style={{ transform: "scaleX(-1)" }}
                                />
                            </div>
                        )}

                        {/* Controls Bar */}
                        {callAccepted && (
                            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 z-40 px-8 py-5 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl">
                                <button
                                    onClick={toggleMic}
                                    className={`p-4 rounded-full transition-all ${micOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
                                >
                                    {micOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                                </button>

                                <button
                                    onClick={leaveCall}
                                    className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-red-700 hover:scale-105 transition-all"
                                >
                                    <PhoneOff className="w-8 h-8 fill-current" />
                                </button>

                                <button
                                    onClick={toggleCamera}
                                    className={`p-4 rounded-full transition-all ${cameraOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
                                >
                                    {cameraOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* CHAT AREA */}
                <div className={`flex-1 flex flex-col bg-[#F0F2F5] dark:bg-slate-900 ${!otherUserId ? 'hidden md:flex' : 'flex'}`}>
                    {!chatUser ? (
                        <div className="m-auto text-center">
                            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Smile className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Welcome to MedBeacon Chat</h3>
                            <p className="text-gray-500">Select a conversation to start messaging</p>
                        </div>
                    ) : (
                        <>
                            {/* HEADER */}
                            <div className="bg-white dark:bg-slate-900 border-b dark:border-slate-700 px-4 md:px-6 py-3 flex justify-between items-center shadow-sm z-10 sticky top-0">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setLocation('/messages')}
                                        className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                    <div className="relative">
                                        {getProfileSrc(chatUser) ? (
                                            <img src={getProfileSrc(chatUser)} alt={chatUser.username} className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-100" />
                                        ) : (
                                            <div className="w-10 h-10 bg-linear-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center text-white font-medium shadow-md">
                                                {chatUser.username?.[0]?.toUpperCase()}
                                            </div>
                                        )}
                                        {onlineUsers.includes(chatUser.id) && (
                                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900">{chatUser.username}</div>
                                        <div className="text-xs text-gray-500 font-medium">
                                            {typingUser === chatUser.id ? (
                                                <span className="text-green-600 font-bold animate-pulse">typing...</span>
                                            ) : onlineUsers.includes(chatUser.id) ? (
                                                "Online"
                                            ) : (
                                                "Offline"
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => startCall(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                        <Phone className="w-5 h-5 text-gray-600" />
                                    </button>
                                    <button onClick={() => startCall(true)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                        <Video className="w-5 h-5 text-gray-600" />
                                    </button>
                                </div>
                            </div>

                            {/* MESSAGES */}
                            <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 bg-[#F0F2F5] dark:bg-slate-900">
                                {displayedMessages.map((m, idx) => {
                                    const isMe = m.sender === user?.id;
                                    const showAvatar = !isMe && (idx === 0 || displayedMessages[idx - 1].sender !== m.sender);

                                    const msgDate = new Date(m.timestamp || m.createdAt || new Date());
                                    const prevMsg = displayedMessages[idx - 1];
                                    const prevDate = prevMsg ? new Date(prevMsg.timestamp || prevMsg.createdAt || new Date()) : null;

                                    const getDateLabel = (date) => {
                                        const today = new Date();
                                        const yesterday = new Date(today);
                                        yesterday.setDate(yesterday.getDate() - 1);

                                        if (date.toDateString() === today.toDateString()) return "Today";
                                        if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
                                        return date.toLocaleDateString();
                                    };

                                    const showDateDivider = !prevDate || getDateLabel(msgDate) !== getDateLabel(prevDate);
                                    const dateLabel = getDateLabel(msgDate);

                                    return (
                                        <React.Fragment key={m._id || idx}>
                                            {showDateDivider && (
                                                <div className="flex justify-center my-4">
                                                    <span className="bg-gray-100 text-gray-500 text-xs py-1 px-3 rounded-full font-medium shadow-sm">
                                                        {dateLabel}
                                                    </span>
                                                </div>
                                            )}
                                            <div className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                                                {!isMe && (
                                                    <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs overflow-hidden">
                                                        {showAvatar ? (
                                                            getProfileSrc(chatUser) ? (
                                                                <img src={getProfileSrc(chatUser)} alt={chatUser.username} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                                                    {chatUser.username?.[0]}
                                                                </div>
                                                            )
                                                        ) : <div className="w-8 h-8" />}
                                                    </div>
                                                )}
                                                <div
                                                    className={`max-w-[85%] md:max-w-[70%] px-4 py-2 rounded-2xl shadow-sm relative group ${isMe
                                                        ? "bg-black text-white rounded-br-none"
                                                        : "bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 rounded-bl-none border border-gray-100 dark:border-slate-700"
                                                        }`}
                                                >
                                                    <div className="text-sm leading-relaxed wrap-break-word">{m.text}</div>
                                                    <div className={`text-[10px] mt-1 flex justify-end opacity-70 ${isMe ? "text-gray-300" : "text-gray-500"}`}>
                                                        {formatTime(m.timestamp || m.createdAt || new Date())}
                                                    </div>
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* INPUT */}
                            <div className="bg-white p-3 md:p-4 border-t">
                                <div className="max-w-4xl mx-auto flex items-center gap-2 md:gap-3 bg-gray-50 px-3 md:px-4 py-2 rounded-2xl border border-gray-200 focus-within:border-black/20 focus-within:ring-1 focus-within:ring-black/10 transition-all">
                                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors hidden sm:block">
                                        <Smile className="w-6 h-6" />
                                    </button>
                                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors hidden sm:block">
                                        <Image className="w-6 h-6" />
                                    </button>
                                    <input
                                        value={newMessage}
                                        onChange={(e) => {
                                            setNewMessage(e.target.value);
                                            handleTypingInput();
                                        }}
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                        placeholder="Type a message..."
                                        className="flex-1 bg-transparent border-0 focus:ring-0 text-gray-900 placeholder:text-gray-400 min-w-0"
                                    />
                                    {newMessage.trim() ? (
                                        <button
                                            onClick={sendMessage}
                                            className="p-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-transform hover:scale-105 shadow-lg"
                                        >
                                            <Send className="w-5 h-5" />
                                        </button>
                                    ) : (
                                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                            <Mic className="w-6 h-6" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* RIGHT SIDEBAR */}
                {chatUser && (
                    <div className="w-[300px] bg-white dark:bg-slate-900 border-l border-gray-100 dark:border-slate-700 hidden xl:flex flex-col">
                        <div className="p-8 flex flex-col items-center border-b border-gray-50 pb-8">
                            <div className="w-24 h-24 rounded-full p-1 bg-white border border-gray-100 shadow-sm mb-4">
                                {getProfileSrc(chatUser) ? (
                                    <img src={getProfileSrc(chatUser)} alt={chatUser.username} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-3xl font-medium text-gray-400">
                                        {chatUser.username?.[0]?.toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-1">{chatUser.username}</h2>
                            <p className="text-sm text-gray-500 mb-6">
                                {onlineUsers.includes(chatUser.id) ? "Active now" : "Offline"}
                            </p>

                            <button
                                onClick={handleViewProfile}
                                className="w-full py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
                            >
                                View profile
                            </button>
                        </div>

                        <div className="p-4 space-y-1">
                            <button
                                onClick={() => setShowMsgSearch(!showMsgSearch)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-sm font-medium ${showMsgSearch ? "bg-gray-100 text-black" : "text-gray-700 hover:bg-gray-50"}`}
                            >
                                <Search className="w-5 h-5 text-gray-400" />
                                Search chat
                            </button>

                            {showMsgSearch && (
                                <div className="px-3 pb-3">
                                    <input
                                        autoFocus
                                        placeholder="Search in conversation..."
                                        value={messageSearchQuery}
                                        onChange={(e) => setMessageSearchQuery(e.target.value)}
                                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black/10"
                                    />
                                </div>
                            )}

                            <button className="w-full flex items-center gap-3 p-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors text-sm font-medium cursor-default" title="No media found">
                                <Image className="w-5 h-5 text-gray-400" />
                                Media & Files
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

const ChatListItem = ({ user, online, unread, lastMessage, time, onClick, active }) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `${window.location.origin.replace(':5173', ':5000')}`;

    const getProfileSrc = (u) => {
        if (!u?.profilePicUrl) return null;
        return u.profilePicUrl.startsWith("http")
            ? u.profilePicUrl
            : `${API_BASE_URL}${u.profilePicUrl}`;
    };

    return (
        <div
            onClick={onClick}
            className={`p-4 flex gap-3 cursor-pointer hover:bg-gray-50 transition-colors relative ${active ? "bg-gray-50" : ""}`}
        >
            <div className="relative shrink-0">
                {getProfileSrc(user) ? (
                    <img src={getProfileSrc(user)} alt={user.username} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-lg font-medium text-gray-500">
                        {user.username?.[0]?.toUpperCase()}
                    </div>
                )}
                {online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                    <h3 className={`font-semibold text-gray-900 truncate ${unread ? "font-bold" : ""}`}>
                        {user.username}
                    </h3>
                    {time && (
                        <span className="text-xs text-gray-400 shrink-0">
                            {new Date(time).toLocaleDateString() === new Date().toLocaleDateString()
                                ? new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : new Date(time).toLocaleDateString()}
                        </span>
                    )}
                </div>
                <div className="flex justify-between items-center">
                    <p className={`text-sm truncate ${unread ? "text-gray-900 font-medium" : "text-gray-500"}`}>
                        {lastMessage || "Start a conversation"}
                    </p>
                    {unread > 0 && (
                        <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-xs text-white font-bold ml-2">
                            {unread}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessagingApp;
