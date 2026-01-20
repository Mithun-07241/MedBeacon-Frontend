import React, { useState, useEffect } from 'react';

import { Calendar, Users, MessageSquare, HelpCircle, Settings, ChevronLeft, Bell, ChevronDown, Phone, Mail, MapPin, Heart, Home, FileText, Activity, CalendarDays, Pill, Clock, X, Check } from 'lucide-react';
import { useLocation } from "wouter";
import { useAuthContext } from "@/context/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `${window.location.origin.replace(':5173', ':5000')}`;

export default function Appointments() {
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

    const handleCancelAppointment = async (appointmentId) => {
        if (!confirm('Are you sure you want to cancel this appointment?')) {
            return;
        }

        try {
            await apiRequest("PATCH", `/api/appointments/${appointmentId}`, {
                status: 'cancelled'
            });

            // Update local state
            setAppointments(prev =>
                prev.map(apt =>
                    apt._id === appointmentId
                        ? { ...apt, status: 'cancelled' }
                        : apt
                )
            );
        } catch (err) {
            console.error("Failed to cancel appointment:", err);
            alert('Failed to cancel appointment. Please try again.');
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
                    title="My Appointments"
                    subtitle="View and manage your appointments"
                    showBack={true}
                />

                {/* Content */}
                <div className="flex-1 overflow-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Filters */}
                        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                                    {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
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
                                <button
                                    onClick={() => navigate('/doctors-list')}
                                    className="w-full md:w-auto px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium whitespace-nowrap"
                                >
                                    Book New Appointment
                                </button>
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
                                        ? "You haven't booked any appointments yet."
                                        : `You have no ${filter} appointments.`}
                                </p>
                                <button
                                    onClick={() => navigate('/doctors-list')}
                                    className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                                >
                                    Book Your First Appointment
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredAppointments.map((appointment) => (
                                    <div key={appointment._id} className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 hover:shadow-md transition-shadow">
                                        <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                                            <div className="flex-1 w-full">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                                                        {getProfileSrc(appointment.doctor) ? (
                                                            <img
                                                                src={getProfileSrc(appointment.doctor)}
                                                                alt={appointment.doctor.username}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <Users size={24} className="text-gray-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            {appointment.doctor?.username || 'Doctor'}
                                                        </h3>
                                                        <p className="text-sm text-gray-500">
                                                            {appointment.doctor?.specialization || 'General Physician'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4 mb-4">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Calendar size={16} className="shrink-0" />
                                                        <span>{formatDate(appointment.date)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Clock size={16} className="shrink-0" />
                                                        <span>{appointment.time}</span>
                                                    </div>
                                                </div>

                                                {appointment.reason && (
                                                    <div className="mb-4">
                                                        <p className="text-sm text-gray-600">
                                                            <span className="font-medium">Reason:</span> {appointment.reason}
                                                        </p>
                                                    </div>
                                                )}

                                                {appointment.notes && (
                                                    <div className="mb-4">
                                                        <p className="text-sm text-gray-600">
                                                            <span className="font-medium">Notes:</span> {appointment.notes}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3">
                                                {getStatusBadge(appointment.status)}

                                                {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                                                    <button
                                                        onClick={() => handleCancelAppointment(appointment._id)}
                                                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <X size={16} />
                                                        Cancel
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {appointment.status === 'confirmed' && (
                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin size={16} className="shrink-0" />
                                                        <span>{appointment.doctor?.address || 'Doctor Address'}</span>
                                                    </div>
                                                    {appointment.doctor?.phoneNumber && (
                                                        <div className="flex items-center gap-2">
                                                            <Phone size={16} className="shrink-0" />
                                                            <span>{appointment.doctor.phoneNumber}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
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
