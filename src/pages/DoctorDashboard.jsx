import React, { useState, useEffect } from 'react';
import { Calendar, Clock, BarChart2, ChevronDown, ChevronLeft, ChevronRight, Bell, Search, Heart, Users, CalendarDays, BarChart3, MessageSquare, Settings, HelpCircle, Home, Pill, Phone, AlertCircle, Activity, TrendingUp, Video, FileText, Menu } from 'lucide-react';
import { useLocation } from "wouter";
import { useAuthContext } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { useWebSocket } from '@/hooks/useWebSocket';

export const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || `${window.location.origin.replace(":5173", ":5000")}`;

export default function DoctorDashboard() {
    const { user, logout } = useAuthContext();
    const [, navigate] = useLocation();
    const [doctorDetails, setDoctorDetails] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // ============================================
    // AUTHENTICATION & USER DATA FETCHING
    // ============================================

    useEffect(() => {
        async function fetchDetails() {
            try {
                const res = await apiRequest("GET", "/api/profile/details");
                setDoctorDetails(res.doctor);
            } catch (err) {
                console.error("Failed to fetch doctor details:", err);
            }
        }
        if (user) {
            fetchDetails();
        }
    }, [user]);

    // WebSocket for real-time updates
    const queryClient = useQueryClient();
    const socket = useWebSocket(user?.id, user?.role);

    useEffect(() => {
        if (!socket) return;

        const handleDataUpdate = () => {
            // Refetch all dashboard data when updates occur
            queryClient.refetchQueries({ queryKey: ['/api/appointments'] });
            queryClient.refetchQueries({ queryKey: ['/api/patients'] });
            queryClient.refetchQueries({ queryKey: ['/api/alerts'] });
        };

        // Listen for various update events
        socket.on('appointment_updated', handleDataUpdate);
        socket.on('appointment_created', handleDataUpdate);
        socket.on('patient_updated', handleDataUpdate);
        socket.on('new_alert', handleDataUpdate);
        socket.on('receive_message', () => {
            queryClient.refetchQueries({ queryKey: ['/api/chat'] });
        });

        return () => {
            socket.off('appointment_updated', handleDataUpdate);
            socket.off('appointment_created', handleDataUpdate);
            socket.off('patient_updated', handleDataUpdate);
            socket.off('new_alert', handleDataUpdate);
            socket.off('receive_message');
        };
    }, [socket, queryClient]);

    // ============================================
    // FETCH ALERTS
    // ============================================

    const { data: alerts = [], isLoading: alertsLoading } = useQuery({
        queryKey: ['/api/alerts'],
        queryFn: async () => {
            const res = await apiRequest('GET', '/api/alerts');
            return Array.isArray(res) ? res : res.alerts || [];
        },
        enabled: !!user,
    });

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        return { daysInMonth, startingDayOfWeek, year, month };
    };

    const changeMonth = (increment) => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(newDate.getMonth() + increment);
        setCurrentMonth(newDate);
    };

    const formatMonthYear = (date) => {
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const isToday = (day) => {
        const today = new Date();
        return day === today.getDate() &&
            currentMonth.getMonth() === today.getMonth() &&
            currentMonth.getFullYear() === today.getFullYear();
    };

    const isSelectedDate = (day) => {
        return day === selectedDate.getDate() &&
            currentMonth.getMonth() === selectedDate.getMonth() &&
            currentMonth.getFullYear() === selectedDate.getFullYear();
    };

    const handleDateClick = (day) => {
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        setSelectedDate(newDate);
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);

    // ============================================
    // LOADING STATE CHECK
    // ============================================

    if (!user) {
        return <div>Loading...</div>;
    }

    // ============================================
    // PROFILE PICTURE HANDLING
    // ============================================

    const profilePicSrc = doctorDetails?.profilePicUrl
        ? doctorDetails.profilePicUrl.startsWith("http")
            ? doctorDetails.profilePicUrl
            : `${API_BASE_URL}${doctorDetails.profilePicUrl}`
        : null;

    // ============================================
    // STATS CALCULATIONS
    // ============================================

    const urgentAlerts = Array.isArray(alerts) ? alerts.filter(alert => alert.severity === 'urgent' || alert.severity === 'critical') : [];
    const totalPatients = 0;
    const pendingReviews = Array.isArray(alerts) ? alerts.filter(alert => alert.status === 'pending').length : 0;

    return (
        <DashboardLayout>
            {/* Header */}
            <DashboardHeader
                title="Dashboard"
                subtitle={`Welcome back, Dr. ${user?.username || user?.email}`}
                showSearch={true}
            />

            {/* Dashboard Content */}
            <div className="flex-1 overflow-y-auto p-3 md:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8">
                        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-3 md:p-6">
                            <div className="flex items-center justify-between mb-2 md:mb-4">
                                <div className="p-2 md:p-3 bg-gray-100 rounded-lg">
                                    <Users className="text-gray-900" size={20} />
                                </div>
                                <TrendingUp className="text-green-500" size={16} />
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1">{totalPatients}</h3>
                            <p className="text-xs md:text-sm text-gray-600 dark:text-slate-400">Total Patients</p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-3 md:p-6">
                            <div className="flex items-center justify-between mb-2 md:mb-4">
                                <div className="p-2 md:p-3 bg-gray-100 rounded-lg">
                                    <AlertCircle className="text-gray-900" size={20} />
                                </div>
                                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">{urgentAlerts.length}</span>
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-red-500 mb-1">{urgentAlerts.length}</h3>
                            <p className="text-xs md:text-sm text-gray-600 dark:text-slate-400">Urgent Alerts</p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-3 md:p-6">
                            <div className="flex items-center justify-between mb-2 md:mb-4">
                                <div className="p-2 md:p-3 bg-gray-100 rounded-lg">
                                    <Calendar className="text-gray-900" size={20} />
                                </div>
                                <Activity className="text-gray-500" size={16} />
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1">0</h3>
                            <p className="text-xs md:text-sm text-gray-600 dark:text-slate-400">Today's Appointments</p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-3 md:p-6">
                            <div className="flex items-center justify-between mb-2 md:mb-4">
                                <div className="p-2 md:p-3 bg-gray-100 rounded-lg">
                                    <FileText className="text-gray-900" size={20} />
                                </div>
                                <span className="bg-orange-500 text-white text-xs rounded-full px-2 py-1">{pendingReviews}</span>
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-orange-500 mb-1">{pendingReviews}</h3>
                            <p className="text-xs md:text-sm text-gray-600 dark:text-slate-400">Pending Reviews</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                        <div className="space-y-6">
                            <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl mx-auto lg:mx-0">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-gray-900">Schedule Calendar</h2>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => changeMonth(-1)}
                                            className="p-2 hover:bg-gray-100 rounded-lg"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <span className="text-sm font-medium min-w-[120px] md:min-w-[150px] text-center">
                                            {formatMonthYear(currentMonth)}
                                        </span>
                                        <button
                                            onClick={() => changeMonth(1)}
                                            className="p-2 hover:bg-gray-100 rounded-lg"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                </div>

                                {/* Calendar Grid */}
                                <div className="grid grid-cols-7 gap-1 md:gap-2">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                        <div key={day} className="text-center text-xs md:text-sm font-semibold text-gray-600 py-2">
                                            {day}
                                        </div>
                                    ))}

                                    {Array.from({ length: startingDayOfWeek }).map((_, idx) => (
                                        <div key={`empty-${idx}`} className="aspect-square"></div>
                                    ))}

                                    {Array.from({ length: daysInMonth }).map((_, idx) => {
                                        const day = idx + 1;

                                        return (
                                            <button
                                                key={day}
                                                onClick={() => handleDateClick(day)}
                                                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-colors relative ${isToday(day)
                                                    ? 'bg-gray-900 text-white font-bold'
                                                    : isSelectedDate(day)
                                                        ? 'bg-gray-200 text-gray-900 font-semibold'
                                                        : 'hover:bg-gray-100 text-gray-700'
                                                    }`}
                                            >
                                                {day}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Live Alerts Feed */}
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                                        <Bell className="text-red-500 mr-2" size={24} />
                                        Live Patient Alerts
                                    </h3>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                        <span className="text-sm text-gray-600">Live</span>
                                    </div>
                                </div>

                                {alertsLoading ? (
                                    <div className="space-y-4">
                                        <div className="animate-pulse bg-gray-200 h-20 rounded-xl"></div>
                                        <div className="animate-pulse bg-gray-200 h-20 rounded-xl"></div>
                                    </div>
                                ) : !Array.isArray(alerts) || alerts.length === 0 ? (
                                    <div className="text-center py-8">
                                        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500">No alerts at this time</p>
                                        <p className="text-sm text-gray-400 mt-2">You'll be notified when patients need assistance</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                                        {alerts.slice(0, 10).map((alert) => {
                                            const severityConfig = {
                                                critical: { color: 'border-red-500 bg-red-50', badge: 'bg-red-500 text-white' },
                                                urgent: { color: 'border-red-500 bg-red-50', badge: 'bg-red-500 text-white' },
                                                moderate: { color: 'border-orange-500 bg-orange-50', badge: 'bg-orange-500 text-white' },
                                                low: { color: 'border-green-500 bg-green-50', badge: 'bg-green-500 text-white' }
                                            }[alert.severity] || { color: 'border-gray-200 bg-gray-50', badge: 'bg-gray-500 text-white' };

                                            return (
                                                <div key={alert.id} className={`border-l-4 rounded-lg p-4 ${severityConfig.color}`}>
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center space-x-2 mb-2">
                                                                <span className="font-semibold text-gray-800">
                                                                    {alert.patientName || 'Unknown Patient'}
                                                                </span>
                                                                <span className={`px-2 py-1 text-xs rounded-full uppercase ${severityConfig.badge}`}>
                                                                    {alert.severity}
                                                                </span>
                                                                <span className="text-sm text-gray-500">
                                                                    {new Date(alert.timestamp || alert.createdAt).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <p className="text-gray-700 mb-3">{alert.message}</p>
                                                            <div className="flex items-center space-x-2">
                                                                <button
                                                                    onClick={() => navigate(`/patients/${alert.patientId}`)}
                                                                    className="px-3 py-1 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                                                                >
                                                                    View Patient
                                                                </button>
                                                                {alert.status === 'pending' && (
                                                                    <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                                                                        Acknowledge
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
