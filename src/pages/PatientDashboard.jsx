import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronDown, ChevronLeft, ChevronRight, Bell, Search, Heart, Users, CalendarDays, BarChart3, MessageSquare, Settings, HelpCircle, Home, Pill, Phone, AlertCircle, Activity, TrendingUp, Video, FileText, Menu } from 'lucide-react';
import { useLocation } from "wouter";
import { useAuthContext } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { useWebSocket } from '@/hooks/useWebSocket';

export const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || `${window.location.origin.replace(":5173", ":5000")}`;

export default function PatientDashboard() {
    const { user, logout } = useAuthContext();
    const [, navigate] = useLocation();

    const [patientDetails, setPatientDetails] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // ============================================
    // AUTHENTICATION & USER DATA FETCHING
    // ============================================

    useEffect(() => {
        async function fetchDetails() {
            try {
                const res = await apiRequest("GET", "/api/profile/details");
                setPatientDetails(res.patient);
            } catch (err) {
                console.error("Failed to fetch patient details:", err);
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
            queryClient.refetchQueries({ queryKey: ['/api/medications'] });
            queryClient.refetchQueries({ queryKey: ['/api/health-metrics'] });
        };

        // Listen for various update events
        socket.on('appointment_updated', handleDataUpdate);
        socket.on('appointment_created', handleDataUpdate);
        socket.on('medication_updated', handleDataUpdate);
        socket.on('health_metric_added', handleDataUpdate);
        socket.on('receive_message', () => {
            queryClient.refetchQueries({ queryKey: ['/api/chat'] });
        });

        return () => {
            socket.off('appointment_updated', handleDataUpdate);
            socket.off('appointment_created', handleDataUpdate);
            socket.off('medication_updated', handleDataUpdate);
            socket.off('health_metric_added', handleDataUpdate);
            socket.off('receive_message');
        };
    }, [socket, queryClient]);

    // ============================================
    // FETCH APPOINTMENTS
    // ============================================

    const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
        queryKey: ['/api/appointments'],
        queryFn: async () => {
            const res = await apiRequest('GET', '/api/appointments');
            return Array.isArray(res) ? res : res.appointments || [];
        },
        enabled: !!user,
    });

    // ============================================
    // FETCH MEDICATIONS
    // ============================================

    const { data: medications = [], isLoading: medicationsLoading } = useQuery({
        queryKey: ['/api/medications'],
        queryFn: async () => {
            const res = await apiRequest('GET', '/api/medications');
            return Array.isArray(res) ? res : res.medications || [];
        },
        enabled: !!user,
    });

    // ============================================
    // DATE HELPERS
    // ============================================

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

    const profilePicSrc = patientDetails?.profilePicUrl
        ? patientDetails.profilePicUrl.startsWith("http")
            ? patientDetails.profilePicUrl
            : `${API_BASE_URL}${patientDetails.profilePicUrl}`
        : null;

    // ============================================
    // STATS CALCULATIONS
    // ============================================

    const upcomingAppointments = Array.isArray(appointments) ? appointments.filter(apt => new Date(apt.date) >= new Date()).length : 0;
    const activeMedications = Array.isArray(medications) ? medications.filter(med => med.status?.toLowerCase() === 'active').length : 0;
    const todayMedications = Array.isArray(medications) ? medications.filter(med => {
        return med.frequency?.toLowerCase() === 'daily' || med.status?.toLowerCase() === 'active';
    }).length : 0;

    return (
        <DashboardLayout>
            {/* Header */}
            <DashboardHeader
                title="Dashboard"
                subtitle={`Welcome back, ${user?.username || user?.email}`}
                showSearch={true}
                searchPlaceholder="Search medical records..."
            />

            {/* Dashboard Content */}
            <div className="flex-1 overflow-y-auto p-3 md:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8">
                        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-3 md:p-6">
                            <div className="flex items-center justify-between mb-2 md:mb-4">
                                <div className="p-2 md:p-3 bg-gray-100 rounded-lg">
                                    <CalendarDays className="text-gray-900" size={20} />
                                </div>
                                <TrendingUp className="text-green-500" size={16} />
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1">{upcomingAppointments}</h3>
                            <p className="text-xs md:text-sm text-gray-600 dark:text-slate-400">Upcoming Appointments</p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-3 md:p-6">
                            <div className="flex items-center justify-between mb-2 md:mb-4">
                                <div className="p-2 md:p-3 bg-gray-100 rounded-lg">
                                    <Pill className="text-gray-900" size={20} />
                                </div>
                                <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">{activeMedications}</span>
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-blue-500 mb-1">{activeMedications}</h3>
                            <p className="text-xs md:text-sm text-gray-600 dark:text-slate-400">Active Medications</p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-3 md:p-6">
                            <div className="flex items-center justify-between mb-2 md:mb-4">
                                <div className="p-2 md:p-3 bg-gray-100 rounded-lg">
                                    <Clock className="text-gray-900" size={20} />
                                </div>
                                <Activity className="text-gray-500" size={16} />
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">{todayMedications}</h3>
                            <p className="text-xs md:text-sm text-gray-600 dark:text-slate-400">Medications Today</p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-3 md:p-6">
                            <div className="flex items-center justify-between mb-2 md:mb-4">
                                <div className="p-2 md:p-3 bg-gray-100 rounded-lg">
                                    <FileText className="text-gray-900" size={20} />
                                </div>
                                <AlertCircle className="text-orange-500" size={16} />
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-orange-500 mb-1">0</h3>
                            <p className="text-xs md:text-sm text-gray-600 dark:text-slate-400">Pending Reports</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-4 md:p-6 max-w-2xl mx-auto lg:mx-0">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">My Appointments Calendar</h2>
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
                        </div>

                        <div className="space-y-6">

                            {/* Today's Medications */}
                            <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-4 md:p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                                        <Pill className="text-blue-500 mr-2" size={24} />
                                        Today's Medications
                                    </h3>
                                    <button
                                        onClick={() => navigate('/medications')}
                                        className="text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                                    >
                                        View All
                                    </button>
                                </div>

                                {medicationsLoading ? (
                                    <div className="space-y-4">
                                        <div className="animate-pulse bg-gray-200 dark:bg-slate-700 h-20 rounded-xl"></div>
                                        <div className="animate-pulse bg-gray-200 dark:bg-slate-700 h-20 rounded-xl"></div>
                                    </div>
                                ) : !Array.isArray(medications) || medications.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Pill className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                                        <p className="text-gray-500 dark:text-slate-400">No medications prescribed</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 max-h-[300px] overflow-y-auto">
                                        {medications.slice(0, 3).map((medication, index) => (
                                            <div key={index} className="border-l-4 border-blue-500 rounded-lg p-3 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-semibold text-gray-800 dark:text-white text-sm">
                                                            {medication.name || 'Medication'}
                                                        </span>
                                                        <span className="text-xs bg-blue-500 dark:bg-blue-600 text-white px-2 py-0.5 rounded-full">
                                                            {medication.dosage}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center text-xs text-gray-500 dark:text-slate-400">
                                                        <Clock size={12} className="mr-1" />
                                                        {medication.time || 'As prescribed'}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
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
