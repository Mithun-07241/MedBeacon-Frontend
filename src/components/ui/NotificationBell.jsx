import React, { useState, useEffect, useRef } from 'react';
import { Bell, MessageSquare, AlertCircle, X } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { useAuthContext } from "@/context/AuthContext";
import { useWebSocket } from '@/hooks/useWebSocket';
import { useLocation } from "wouter";

export default function NotificationBell() {
    const { user } = useAuthContext();
    const [, navigate] = useLocation();
    const queryClient = useQueryClient();
    const socket = useWebSocket(user?.id, user?.role);

    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'alerts', 'messages'

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    // Fetch Alerts (Only for Doctors usually, but generic implementation)
    const { data: alerts = [] } = useQuery({
        queryKey: ['/api/alerts'],
        queryFn: async () => {
            if (user?.role !== 'doctor') return [];
            const res = await apiRequest('GET', '/api/alerts');
            return Array.isArray(res) ? res : res.alerts || [];
        },
        enabled: !!user && user.role === 'doctor',
    });

    // Fetch Unread Messages Count
    // The API returns individual messages, not chat objects with unread counts
    const { data: chats = [] } = useQuery({
        queryKey: ['/api/chat'],
        queryFn: async () => apiRequest('GET', '/api/chat'),
        enabled: !!user
    });

    // Count unread messages from chat conversations
    // The API returns chat objects with unreadCount property
    const unreadMessagesCount = Array.isArray(chats) ? chats.reduce((acc, chat) => {
        // Each chat has an unreadCount property
        return acc + (chat.unreadCount || 0);
    }, 0) : 0;

    const unreadAlertsCount = Array.isArray(alerts) ? alerts.filter(a => !a.read).length : 0;
    const totalCount = unreadMessagesCount + unreadAlertsCount;

    // Debug logging
    useEffect(() => {
        console.log('NotificationBell Debug:', {
            chats: chats?.length || 0,
            alerts: alerts?.length || 0,
            unreadMessagesCount,
            unreadAlertsCount,
            totalCount,
            userRole: user?.role,
            userId: user?.id,
            sampleChat: chats?.[0]
        });
    }, [chats, alerts, unreadMessagesCount, unreadAlertsCount, totalCount, user?.role, user?.id]);

    // Listen for real-time updates
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (data) => {
            console.log('New message received:', data);

            // Add the new message directly to the cache for instant update
            queryClient.setQueryData(['/api/chat'], (oldData) => {
                if (!Array.isArray(oldData)) return [data];
                // Check if message already exists to avoid duplicates
                const exists = oldData.some(msg => msg._id === data._id);
                if (exists) return oldData;
                return [...oldData, data];
            });

            // Also invalidate to ensure we have the latest data
            queryClient.invalidateQueries({ queryKey: ['/api/chat'] });
        };

        const handleNewAlert = (data) => {
            console.log('New alert:', data);
            queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
        };

        socket.on('receive_message', handleNewMessage);
        socket.on('new_message', handleNewMessage); // Also listen for new_message event
        socket.on('new_alert', handleNewAlert);

        return () => {
            socket.off('receive_message', handleNewMessage);
            socket.off('new_message', handleNewMessage);
            socket.off('new_alert', handleNewAlert);
        };
    }, [socket, queryClient]);


    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };

    const hasUrgent = Array.isArray(alerts) && alerts.some(a => a.priority === 'urgent');

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded-lg relative transition-all duration-200 ${isOpen ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
            >
                <Bell size={20} className={hasUrgent ? "text-red-500 animate-pulse" : ""} />

                {totalCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                        {totalCount > 99 ? '99+' : totalCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    {/* Mobile: Backdrop overlay */}
                    <div className="fixed inset-0 bg-black/20 z-40 md:hidden" onClick={() => setIsOpen(false)} />

                    {/* Dropdown - Top right on all screens */}
                    <div className="fixed md:absolute right-2 md:right-0 top-14 md:top-full mt-0 md:mt-2 w-[calc(100vw-1rem)] max-w-sm md:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl md:shadow-xl border border-gray-200 dark:border-slate-700 z-50 max-h-[calc(100vh-4rem)] md:max-h-[600px] overflow-hidden transform transition-all">
                        <div className="p-3 md:p-4 border-b border-gray-50 dark:border-slate-700 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 dark:text-white text-base md:text-lg">Notifications</h3>
                            {totalCount > 0 && (
                                <span className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 text-xs px-2 py-1 rounded-full font-medium">
                                    {totalCount} New
                                </span>
                            )}
                        </div>

                        <div className="flex border-b border-gray-50 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
                            <button
                                onClick={() => handleTabClick('all')}
                                className={`flex-1 py-2.5 md:py-2 text-sm font-medium transition-colors relative ${activeTab === 'all' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'}`}
                            >
                                <span className="flex items-center justify-center gap-1.5">
                                    All
                                    {totalCount > 0 && (
                                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                            {totalCount > 99 ? '99+' : totalCount}
                                        </span>
                                    )}
                                </span>
                                {activeTab === 'all' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900 dark:bg-white"></span>}
                            </button>
                            <button
                                onClick={() => handleTabClick('messages')}
                                className={`flex-1 py-2.5 md:py-2 text-sm font-medium transition-colors relative ${activeTab === 'messages' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'}`}
                            >
                                <span className="flex items-center justify-center gap-1.5">
                                    Messages
                                    {unreadMessagesCount > 0 && (
                                        <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                            {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                                        </span>
                                    )}
                                </span>
                                {activeTab === 'messages' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900 dark:bg-white"></span>}
                            </button>
                            <button
                                onClick={() => handleTabClick('alerts')}
                                className={`flex-1 py-2.5 md:py-2 text-sm font-medium transition-colors relative ${activeTab === 'alerts' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'}`}
                            >
                                <span className="flex items-center justify-center gap-1.5">
                                    Alerts
                                    {unreadAlertsCount > 0 && (
                                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                            {unreadAlertsCount > 99 ? '99+' : unreadAlertsCount}
                                        </span>
                                    )}
                                </span>
                                {activeTab === 'alerts' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900 dark:bg-white"></span>}
                            </button>
                        </div>

                        <div className="max-h-[calc(85vh-140px)] md:max-h-[400px] overflow-y-auto">
                            {(activeTab === 'all' || activeTab === 'alerts') && Array.isArray(alerts) && alerts.length > 0 && (
                                <div className="p-2">
                                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 py-1 mb-1">Alerts</div>
                                    {alerts.map(alert => (
                                        <div key={alert._id} className="p-3 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer border-l-2 border-red-500 bg-red-50/30 dark:bg-red-900/10 mb-2">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg shrink-0">
                                                    <AlertCircle size={16} />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white text-sm">{alert.type?.replace('_', ' ').toUpperCase() || 'ALERT'}</div>
                                                    <p className="text-sm text-gray-600 dark:text-slate-400 line-clamp-2 mt-0.5">{alert.message || alert.description}</p>
                                                    <div className="text-xs text-gray-400 dark:text-slate-500 mt-1.5">{new Date(alert.createdAt).toLocaleString()}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {(activeTab === 'all' || activeTab === 'messages') && Array.isArray(chats) && chats.length > 0 && (
                                <div className="p-2">
                                    {/* Show unread messages first if any */}
                                    {chats.filter(chat => (chat.unreadCount || 0) > 0).length > 0 && (
                                        <>
                                            <div className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wider px-2 py-1 mb-1">Unread Messages</div>
                                            {chats.filter(chat => (chat.unreadCount || 0) > 0).map(chat => {
                                                const otherId = user.role === 'doctor' ? chat.patientId : chat.doctorId;

                                                const handleChatClick = () => {
                                                    // Optimistically update the cache to mark as read
                                                    queryClient.setQueryData(['/api/chat'], (oldData) => {
                                                        if (!Array.isArray(oldData)) return oldData;
                                                        return oldData.map(c =>
                                                            c._id === chat._id ? { ...c, unreadCount: 0 } : c
                                                        );
                                                    });
                                                    setIsOpen(false);
                                                    navigate(`/chat/${otherId}`);
                                                };

                                                return (
                                                    <div
                                                        key={`unread-${chat._id || `${chat.doctorId}-${chat.patientId}`}`}
                                                        onClick={handleChatClick}
                                                        className="p-3 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-start gap-3 min-h-[60px] bg-blue-50/50 dark:bg-blue-900/10 border-l-2 border-blue-500 mb-2"
                                                    >
                                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                                                            <MessageSquare size={16} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-start">
                                                                <div className="font-medium text-gray-900 dark:text-white text-sm">New Message</div>
                                                                <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{chat.unreadCount}</span>
                                                            </div>
                                                            <p className="text-sm text-gray-600 dark:text-slate-400 line-clamp-1 mt-0.5 truncate">{chat.lastMessage}</p>
                                                            <div className="text-xs text-gray-400 dark:text-slate-500 mt-1.5">{new Date(chat.timestamp).toLocaleString()}</div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </>
                                    )}

                                    {/* Show all recent chats in Messages tab only */}
                                    {activeTab === 'messages' && (
                                        <>
                                            <div className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wider px-2 py-1 mb-1 mt-3">Recent Conversations</div>
                                            {chats.map(chat => {
                                                const otherId = user.role === 'doctor' ? chat.patientId : chat.doctorId;
                                                const hasUnread = (chat.unreadCount || 0) > 0;

                                                const handleChatClick = () => {
                                                    // Optimistically update the cache to mark as read
                                                    queryClient.setQueryData(['/api/chat'], (oldData) => {
                                                        if (!Array.isArray(oldData)) return oldData;
                                                        return oldData.map(c =>
                                                            c._id === chat._id ? { ...c, unreadCount: 0 } : c
                                                        );
                                                    });
                                                    setIsOpen(false);
                                                    navigate(`/chat/${otherId}`);
                                                };

                                                return (
                                                    <div
                                                        key={chat._id || `${chat.doctorId}-${chat.patientId}`}
                                                        onClick={handleChatClick}
                                                        className="p-3 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-start gap-3 min-h-[60px]"
                                                    >
                                                        <div className="p-2 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-lg shrink-0">
                                                            <MessageSquare size={16} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-start">
                                                                <div className={`text-sm ${hasUnread ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-slate-300'}`}>
                                                                    Conversation
                                                                </div>
                                                                {hasUnread && (
                                                                    <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{chat.unreadCount}</span>
                                                                )}
                                                            </div>
                                                            <p className={`text-sm line-clamp-1 mt-0.5 truncate ${hasUnread ? 'text-gray-700 dark:text-slate-300 font-medium' : 'text-gray-500 dark:text-slate-400'}`}>
                                                                {chat.lastMessage || 'No messages yet'}
                                                            </p>
                                                            <div className="text-xs text-gray-400 dark:text-slate-500 mt-1.5">{new Date(chat.timestamp).toLocaleString()}</div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </>
                                    )}
                                </div>
                            )}

                            {totalCount === 0 && (
                                <div className="py-12 flex flex-col items-center justify-center text-center text-gray-500">
                                    <Bell size={32} className="mb-3 text-gray-300" />
                                    <p className="text-sm font-medium text-gray-900">No notifications</p>
                                    <p className="text-xs text-gray-500 mt-1">You're all caught up!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
