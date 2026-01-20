import React, { useState, useEffect } from 'react';
import BackButton from "@/components/BackButton";
import { Calendar, Clock, FileText, ChevronLeft, Bell, ChevronDown, Heart, CheckCircle } from 'lucide-react';
import { useLocation } from "wouter";
import { useAuthContext } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MobileMenuToggle from "@/components/ui/navbar/MobileMenuToggle";
import { sendAppointmentReminder } from "@/utils/notifications";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `${window.location.origin.replace(':5173', ':5000')}`;

export default function AppointmentBooking() {
    const { user } = useAuthContext();
    const [, navigate] = useLocation();
    const [searchParams] = useState(() => new URLSearchParams(window.location.search));
    const doctorId = searchParams.get('doctor');

    const [doctorDetails, setDoctorDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    // Form state
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');

    // Available time slots
    const timeSlots = [
        '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
        '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
    ];

    useEffect(() => {
        async function fetchDoctor() {
            if (!user || !doctorId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const allDoctors = await apiRequest("GET", "/api/doctors");
                const doctor = allDoctors.find((doc) => doc.userId === doctorId || doc.id === doctorId);

                if (doctor) {
                    setDoctorDetails(doctor);
                } else {
                    setError("Doctor not found");
                }
            } catch (err) {
                console.error("Failed to fetch doctor:", err);
                setError(err?.message || "Failed to load doctor details");
            } finally {
                setLoading(false);
            }
        }

        fetchDoctor();
    }, [doctorId, user]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedDate || !selectedTime || !reason) {
            setError("Please fill in all required fields");
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            const appointment = await apiRequest("POST", "/api/appointments", {
                doctorId,
                date: selectedDate,
                time: selectedTime,
                reason,
                notes,
            });

            setSuccess(true);

            // Send appointment reminder notification
            const doctorName = doctorDetails?.firstName && doctorDetails?.lastName
                ? `${doctorDetails.firstName} ${doctorDetails.lastName}`
                : doctorDetails?.username || 'Doctor';

            sendAppointmentReminder({
                appointmentId: appointment.id || appointment._id,
                doctorName,
                date: selectedDate,
                time: selectedTime
            }).catch(err => console.error('Failed to send notification:', err));

            // Redirect after 2 seconds
            setTimeout(() => {
                navigate('/appointments');
            }, 2000);
        } catch (err) {
            console.error("Failed to book appointment:", err);
            setError(err?.message || "Failed to book appointment");
        } finally {
            setSubmitting(false);
        }
    };

    const profilePicSrc = doctorDetails?.profilePicUrl
        ? doctorDetails.profilePicUrl.startsWith("http")
            ? doctorDetails.profilePicUrl
            : `${API_BASE_URL}${doctorDetails.profilePicUrl}`
        : null;

    if (!user) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <p className="text-lg text-gray-600">Please log in to book appointments</p>
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

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center flex-1 h-full">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                        <p className="text-lg text-gray-600">Loading...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error && !doctorDetails) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center flex-1 h-full">
                    <div className="text-center">
                        <p className="text-lg text-gray-900 font-semibold mb-2">Error</p>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button
                            onClick={() => navigate('/doctors')}
                            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                        >
                            Back to Doctors
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const doctorName = doctorDetails?.firstName && doctorDetails?.lastName
        ? `Dr. ${doctorDetails.firstName} ${doctorDetails.lastName}`
        : doctorDetails?.username
            ? `Dr. ${doctorDetails.username}`
            : 'Doctor';

    return (
        <DashboardLayout>
            <div className="flex-1 overflow-auto">
                <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <MobileMenuToggle />
                            <BackButton className="mb-0" />
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Book Appointment</h1>
                                <p className="text-xs md:text-sm text-gray-500 hidden sm:block">Select a time slot for your appointment</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 md:gap-4">
                            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                                <Bell size={20} />
                            </button>
                            <div
                                className="flex items-center gap-3 pl-2 md:pl-4 border-l border-gray-200 cursor-pointer"
                                onClick={() => navigate('/patient-dashboard')}
                            >
                                <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-900 rounded-full flex items-center justify-center text-white font-medium">
                                    {(user.username?.[0] || user.email?.[0] || "P").toUpperCase()}
                                </div>
                                <div className="text-sm hidden md:block">
                                    <div className="font-medium">{user.username || user.email}</div>
                                    <div className="text-gray-500 capitalize">Patient</div>
                                </div>
                                <ChevronDown size={16} className="hidden md:block" />
                            </div>
                        </div>
                    </div>
                </header>

                <div className="max-w-4xl mx-auto p-4 md:p-8">
                    {success ? (
                        <div className="bg-white rounded-lg border border-gray-200 p-8 md:p-12 text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="text-green-600" size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Appointment Booked!</h2>
                            <p className="text-gray-600 mb-6">Your appointment has been successfully scheduled. The doctor will confirm shortly.</p>
                            <button
                                onClick={() => navigate('/appointments')}
                                className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                            >
                                View My Appointments
                            </button>
                        </div >
                    ) : (
                        <>
                            <div className="mb-6">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Book Appointment</h1>
                                <p className="text-gray-600">Schedule a consultation with {doctorName}</p>
                            </div>

                            {/* Doctor Card */}
                            <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 mb-6">
                                <div className="flex items-center gap-4">
                                    {profilePicSrc ? (
                                        <img
                                            src={profilePicSrc}
                                            alt={doctorName}
                                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center text-white text-xl font-bold border-2 border-gray-100">
                                            {(doctorDetails?.firstName?.[0] || doctorDetails?.username?.[0] || 'D').toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-lg md:text-xl font-bold text-gray-900">{doctorName}</h3>
                                        <p className="text-gray-600">{doctorDetails?.specialization || 'General Practitioner'}</p>
                                        {doctorDetails?.experience && (
                                            <p className="text-sm text-gray-500">{doctorDetails.experience} years experience</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Booking Form */}
                            <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
                                {error && (
                                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-red-800 text-sm">{error}</p>
                                    </div>
                                )}

                                {/* Date Selection */}
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                                        <Calendar size={18} className="inline mr-2" />
                                        Select Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                    />
                                </div>

                                {/* Time Selection */}
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                                        <Clock size={18} className="inline mr-2" />
                                        Select Time *
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {timeSlots.map((time) => (
                                            <button
                                                key={time}
                                                type="button"
                                                onClick={() => setSelectedTime(time)}
                                                className={`px-4 py-3 border rounded-lg text-sm font-medium transition-colors ${selectedTime === time
                                                    ? 'border-gray-900 bg-gray-900 text-white'
                                                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                                                    }`}
                                            >
                                                {time}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Reason */}
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                                        <FileText size={18} className="inline mr-2" />
                                        Reason for Visit *
                                    </label>
                                    <select
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                    >
                                        <option value="">Select a reason</option>
                                        <option value="General Consultation">General Consultation</option>
                                        <option value="Follow-up">Follow-up</option>
                                        <option value="Routine Checkup">Routine Checkup</option>
                                        <option value="Urgent Care">Urgent Care</option>
                                        <option value="Second Opinion">Second Opinion</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                {/* Additional Notes */}
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                                        Additional Notes (Optional)
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={4}
                                        placeholder="Please describe your symptoms or concerns..."
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                                    />
                                </div>

                                {/* Notice */}
                                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-blue-900">
                                        <strong>Please note:</strong> Your appointment request will be sent to the doctor for confirmation. You will receive a notification once confirmed.
                                    </p>
                                </div>

                                {/* Submit Button */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/doctor/${doctorId}`)}
                                        className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 order-2 sm:order-1"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                                    >
                                        {submitting ? 'Booking...' : 'Book Appointment'}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div >
        </DashboardLayout>
    );
}
