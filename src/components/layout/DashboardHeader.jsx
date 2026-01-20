import React from 'react';
import { Search, ChevronDown, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { useAuthContext } from "@/context/AuthContext";
import MobileMenuToggle from "@/components/ui/navbar/MobileMenuToggle";
import BackButton from "@/components/BackButton";
import NotificationBell from "@/components/ui/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `${window.location.origin.replace(':5173', ':5000')} `;

export default function DashboardHeader({
    title,
    subtitle,
    showBack = false,
    showSearch = false,
    searchPlaceholder = "Search...",
    onSearchChange,
    searchValue = "",
    rightContent = null
}) {
    const { user, logout } = useAuthContext();
    const [, navigate] = useLocation();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const handleProfileClick = () => {
        if (!user) return;

        if (user.role === 'doctor') {
            navigate('/profile'); // Or /profile depending on routes
        } else if (user.role === 'patient') {
            navigate('/profile');
        } else {
            logout();
            navigate('/login');
        }
    };

    const profilePicSrc = user?.profilePicUrl
        ? user.profilePicUrl.startsWith("http")
            ? user.profilePicUrl
            : `${API_BASE_URL}${user.profilePicUrl} `
        : null;

    return (
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-3 md:px-8 py-3 md:py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                    <MobileMenuToggle />
                    {showBack && <BackButton className="mb-0" />}
                    <div>
                        {typeof title === 'string' ? (
                            <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white truncate">{title}</h1>
                        ) : title}

                        {subtitle && (
                            <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                                {subtitle}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                    {rightContent}

                    <NotificationBell />

                    <div className="flex items-center gap-2 md:gap-3">
                        <div
                            className="cursor-pointer"
                            onClick={handleProfileClick}
                        >
                            {profilePicSrc ? (
                                <img
                                    src={profilePicSrc}
                                    alt={user?.username || 'User'}
                                    className="w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full object-cover border border-gray-200"
                                />
                            ) : (
                                <div
                                    className="w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-semibold text-sm"
                                >
                                    {(user?.username?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                                </div>
                            )}
                        </div>

                        <div className="text-sm hidden lg:block cursor-pointer" onClick={handleProfileClick}>
                            <div className="font-semibold text-gray-900 dark:text-white">{user?.username || user?.email}</div>
                            <div className="text-gray-500 dark:text-gray-400 capitalize">{user?.role || 'User'}</div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
