import React, { useState, useEffect } from 'react';
import { Calendar, Users, MessageSquare, HelpCircle, Settings, ChevronLeft, Bell, ChevronDown, Phone, Mail, MapPin, Heart, Home, FileText, Activity, CalendarDays, Pill, Clock, X, Check, AlertCircle } from 'lucide-react';
import { useLocation } from "wouter";
import { useAuthContext } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `${window.location.origin.replace(':5173', ':5000')}`;

export default function DoctorAppointments() {
    const { user } = useAuthContext();
    const [, navigate] = useLocation();

    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        async function fetchAppointments() {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const data = await apiRequest("GET", "/api/appointments");
                setAppointments(data);
            } catch (err) {
                console.error("Failed to fetch appointments:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchAppointments();
    }, [user]);

    // ... existing functions ...
    const handleUpdateStatus = async (appointmentId, newStatus) => {
        try {
            await apiRequest("PATCH", `/api/appointments/${appointmentId}`, {
                status: newStatus
            });

            // Update local state
            setAppointments(prev =>
                prev.map(apt =>
                    apt._id === appointmentId
                        ? { ...apt, status: newStatus }
                        : apt
                )
            );
        } catch (err) {
            console.error(`Failed to update appointment to ${newStatus}:`, err);
            alert('Failed to update appointment. Please try again.');
        }
    };

    const filteredAppointments = appointments.filter(apt => {
        if (filter === 'all') return true;
        return apt.status === filter;
    });

    const getStatusBadge = (status) => {
        const badges = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
            confirmed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Confirmed' },
            completed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Completed' },
            cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
            rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
        };
        const badge = badges[status] || badges.pending;
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
                {badge.label}
            </span>
        );
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    };

    const getProfileSrc = (u) => {
        if (!u?.profilePicUrl) return null;
        return u.profilePicUrl.startsWith("http")
            ? u.profilePicUrl
            : `${API_BASE_URL}${u.profilePicUrl}`;
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <p className="text-lg text-gray-600">Please log in to view appointments</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout>
            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <DashboardHeader
                    title="Appointments"
                    subtitle="Manage your patient appointments"
                    showBack={true}
                />

                {/* Content */}
                <div className="flex-1 overflow-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Filters */}
                        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                                {['all', 'pending', 'confirmed', 'completed', 'cancelled', 'rejected'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setFilter(status)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filter === status
                                            ? 'bg-gray-900 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Appointments List */}
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-center">
                                    <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-gray-600">Loading appointments...</p>
                                </div>
                            </div>
                        ) : filteredAppointments.length === 0 ? (
                            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                                <CalendarDays size={48} className="mx-auto mb-4 text-gray-400" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
                                <p className="text-gray-500 mb-6">
                                    {filter === 'all'
                                        ? "You don't have any appointments scheduled yet."
                                        : `You have no ${filter} appointments.`}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredAppointments.map((appointment) => (
                                    <div key={appointment._id} className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 hover:shadow-md transition-shadow">
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                                                        {getProfileSrc(appointment.patient) ? (
                                                            <img src={getProfileSrc(appointment.patient)} alt={appointment.patient?.username} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Users size={28} className="text-gray-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            {appointment.patient?.username || 'Patient'}
                                                        </h3>
                                                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                                            <span>{appointment.patient?.gender || 'N/A'}</span>
                                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                            <span>{appointment.patient?.age ? `${appointment.patient.age} years` : 'Age N/A'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                                    <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                                                        <Calendar size={16} className="text-gray-500" />
                                                        <span className="font-medium">{formatDate(appointment.date)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                                                        <Clock size={16} className="text-gray-500" />
                                                        <span className="font-medium">{appointment.time}</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    {appointment.reason && (
                                                        <div className="flex gap-2">
                                                            <AlertCircle size={16} className="text-gray-400 mt-0.5 shrink-0" />
                                                            <p className="text-sm text-gray-600">
                                                                <span className="font-medium text-gray-900">Reason:</span> {appointment.reason}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {appointment.notes && (
                                                        <div className="flex gap-2">
                                                            <FileText size={16} className="text-gray-400 mt-0.5 shrink-0" />
                                                            <p className="text-sm text-gray-600">
                                                                <span className="font-medium text-gray-900">Notes:</span> {appointment.notes}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-center sm:items-end gap-3 shrink-0 border-t sm:border-t-0 pt-4 sm:pt-0 mt-4 sm:mt-0">
                                                {getStatusBadge(appointment.status)}

                                                <div className="flex flex-col gap-2 w-full sm:w-auto mt-2">
                                                    {appointment.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleUpdateStatus(appointment._id, 'confirmed')}
                                                                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors shadow-sm"
                                                            >
                                                                <Check size={16} />
                                                                Confirm
                                                            </button>
                                                            <button
                                                                onClick={() => handleUpdateStatus(appointment._id, 'rejected')}
                                                                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded-lg transition-colors shadow-sm"
                                                            >
                                                                <X size={16} />
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}

                                                    {appointment.status === 'confirmed' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(appointment._id, 'completed')}
                                                            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                                                        >
                                                            <Check size={16} />
                                                            Mark Complete
                                                        </button>
                                                    )}

                                                    {appointment.status === 'confirmed' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(appointment._id, 'cancelled')}
                                                            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
