import {
    HelpCircle,
    Settings,
    Menu,
    X,
    LogOut
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuthContext } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { sidebarConfig } from "@/components/ui/navbar/sidebarConfig";
import NavItem from "@/components/ui/navbar/SidebarNavItem";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { useWebSocket } from '@/hooks/useWebSocket';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
    const [location, navigate] = useLocation();
    const { user, logout } = useAuthContext();
    const { theme } = useTheme();
    const [collapsed, setCollapsed] = useState(() => {
        return localStorage.getItem("sidebarCollapsed") === "true";
    });

    // Close mobile menu on route change
    useEffect(() => {
        if (setMobileOpen) setMobileOpen(false);
    }, [location, setMobileOpen]);

    const toggleCollapsed = () => {
        const newState = !collapsed;
        setCollapsed(newState);
        localStorage.setItem("sidebarCollapsed", newState);
    };

    const role = user?.role || "patient";
    const navItems = sidebarConfig[role] || [];

    // Fetch chats to get unread count
    const { data: chats = [] } = useQuery({
        queryKey: ['/api/chat'],
        queryFn: async () => apiRequest('GET', '/api/chat'),
        enabled: !!user
    });

    // Calculate unread messages count
    const unreadMessagesCount = Array.isArray(chats) ? chats.reduce((acc, chat) => {
        return acc + (chat.unreadCount || 0);
    }, 0) : 0;

    // WebSocket for real-time updates
    const queryClient = useQueryClient();
    const socket = useWebSocket(user?.id, user?.role);

    useEffect(() => {
        if (!socket) return;

        const handleMessageUpdate = () => {
            // Refetch chat data when messages are received or read
            queryClient.refetchQueries({ queryKey: ['/api/chat'] });
        };

        socket.on('receive_message', handleMessageUpdate);
        socket.on('new_message', handleMessageUpdate);
        socket.on('message_read', handleMessageUpdate);

        return () => {
            socket.off('receive_message', handleMessageUpdate);
            socket.off('new_message', handleMessageUpdate);
            socket.off('message_read', handleMessageUpdate);
        };
    }, [socket, queryClient]);

    const SidebarContent = ({ isMobile = false }) => (
        <>
            {/* Logo & Toggle */}
            <div className={`p-4 border-b border-gray-200 flex items-center ${collapsed && !isMobile ? "justify-center flex-col gap-4" : "justify-between"}`}>
                <div className={`flex items-center ${collapsed && !isMobile ? "hidden" : ""}`}>
                    <img
                        src={theme === 'dark' ? "/logo-dark.png" : "/logo-light.png"}
                        alt="MedBeacon Logo"
                        className="h-10 w-auto max-w-full object-contain"
                    />
                </div>

                {collapsed && !isMobile && (
                    <img
                        src="/logo-collapsed.png"
                        alt="MedBeacon"
                        className="h-10 w-auto object-contain mb-2"
                    />
                )}

                {isMobile ? (
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                    >
                        <X size={24} />
                    </button>
                ) : (
                    <button
                        onClick={toggleCollapsed}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                    >
                        <Menu size={24} />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
                {navItems.map((item) => (
                    <NavItem
                        key={item.label}
                        icon={item.icon}
                        label={item.label}
                        active={location === item.path}
                        onClick={() => navigate(item.path)}
                        collapsed={collapsed && !isMobile}
                        badge={item.label === 'Messages' && unreadMessagesCount > 0 ? unreadMessagesCount : undefined}
                    />
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 space-y-1 border-t border-gray-200">
                <NavItem
                    icon={HelpCircle}
                    label="Help"
                    onClick={() => navigate("/help")}
                    collapsed={collapsed && !isMobile}
                />
                <NavItem
                    icon={Settings}
                    label="Settings"
                    onClick={() => navigate("/settings")}
                    collapsed={collapsed && !isMobile}
                />

                {/* Theme Toggle */}
                {(!collapsed || isMobile) && (
                    <div className="pt-2">
                        <ThemeToggle />
                    </div>
                )}

                {/* Logout */}
                <NavItem
                    icon={LogOut}
                    label="Logout"
                    onClick={() => {
                        logout();
                        navigate("/login");
                    }}
                    collapsed={collapsed && !isMobile}
                />

                {(!collapsed || isMobile) && (
                    <div className="pt-4 px-4 flex flex-col items-center">
                        <p className="text-xs text-gray-500 mb-1">Developed by</p>
                        <img src="/developer-watermark.png" alt="Developer" className="h-8 opacity-60 hover:opacity-100 transition-opacity" />
                    </div>
                )}
            </div>
        </>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <div className={`hidden md:flex ${collapsed ? "w-20" : "w-64"} bg-white border-r border-gray-200 flex-col transition-all duration-300 h-screen sticky top-0`} style={{
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)'
            }}>
                <SidebarContent />
            </div>

            {/* Mobile Sidebar Backdrop */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile Sidebar Drawer */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`} style={{
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)'
            }}>
                <SidebarContent isMobile={true} />
            </div>
        </>
    );
}  
