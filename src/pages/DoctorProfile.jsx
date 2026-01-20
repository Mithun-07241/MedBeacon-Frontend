import React, { useState, useEffect } from 'react';
import BackButton from "@/components/BackButton";
import { Calendar, Users, MessageSquare, HelpCircle, Settings, ChevronLeft, Bell, ChevronDown, Phone, Mail, MapPin, Heart, Home, FileText, Activity, CalendarDays, Pill, Star, Clock, Award, Briefcase, GraduationCap, Video, Share2 } from 'lucide-react';
import { useParams, useLocation } from "wouter";
import { useAuthContext } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MobileMenuToggle from "@/components/ui/navbar/MobileMenuToggle";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `${window.location.origin.replace(':5173', ':5000')}`;

export default function DoctorProfile() {
    const { user } = useAuthContext();
    const { id } = useParams();
    const [, navigate] = useLocation();

    const [doctorDetails, setDoctorDetails] = useState(null);
    const [patientDetails, setPatientDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('About');

    // ============================================
    // FETCH DOCTOR AND PATIENT DETAILS
    // ============================================

    useEffect(() => {
        async function fetchDetails() {
            if (!user || !id) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Fetch patient details for sidebar
                try {
                    const patientRes = await apiRequest("GET", "/api/profile/details");
                    setPatientDetails(patientRes.patient);
                } catch (patientErr) {
                    console.error("Failed to fetch patient details:", patientErr);
                }

                // Fetch all doctors and find the specific one by userId
                const allDoctors = await apiRequest("GET", "/api/doctors");

                const doctor = allDoctors.find((doc) => doc.userId === id || doc.id === id);

                if (doctor) {
                    setDoctorDetails(doctor);
                } else {
                    setError("Doctor not found");
                }
            } catch (err) {
                console.error("Failed to fetch doctor details:", err);
                setError(err?.message || "Failed to load doctor profile");
            } finally {
                setLoading(false);
            }
        }

        fetchDetails();
    }, [id, user]);

    // ============================================
    // PROFILE PICTURE HANDLING
    // ============================================

    const profilePicSrc = doctorDetails?.profilePicUrl
        ? doctorDetails.profilePicUrl.startsWith("http")
            ? doctorDetails.profilePicUrl
            : `${API_BASE_URL}${doctorDetails.profilePicUrl}`
        : null;

    const patientPicSrc = patientDetails?.profilePicUrl
        ? patientDetails.profilePicUrl.startsWith("http")
            ? patientDetails.profilePicUrl
            : `${API_BASE_URL}${patientDetails.profilePicUrl}`
        : null;


    // ============================================
    // LOADING & ERROR STATES
    // ============================================

    if (!user) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <p className="text-lg text-gray-600">Please log in to view doctor profiles</p>
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
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-600">Loading doctor profile...</p>
                </div>
            </div>
        );
    }

    if (error || !doctorDetails) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <HelpCircle className="text-red-600" size={32} />
                    </div>
                    <p className="text-lg text-gray-900 font-semibold mb-2">Doctor Not Found</p>
                    <p className="text-gray-600 mb-1">{error || "Unable to load doctor profile"}</p>
                    <p className="text-sm text-gray-500 mb-6">Doctor ID: {id || "Not provided"}</p>
                    <button
                        onClick={() => navigate('/doctors-list')}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                    >
                        Back to Doctors List
                    </button>
                </div>
            </div>
        );
    }

    const doctorName = doctorDetails.firstName && doctorDetails.lastName
        ? `Dr. ${doctorDetails.firstName} ${doctorDetails.lastName}`
        : doctorDetails.username
            ? `Dr. ${doctorDetails.username}`
            : 'Doctor';

    const specializations = [
        { label: 'Cardiology', color: 'bg-red-600' },
        { label: 'Neurology', color: 'bg-purple-600' },
        { label: 'Orthopedics', color: 'bg-blue-600' },
        { label: 'Pediatrics', color: 'bg-green-600' },
        { label: 'General', color: 'bg-gray-600' },
    ];

    const specializationColor = specializations.find(
        s => s.label.toLowerCase() === (doctorDetails.specialization || '').toLowerCase()
    )?.color || 'bg-gray-600';

    return (
        <DashboardLayout>
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <MobileMenuToggle />
                            <BackButton className="mb-0" />
                            <div>
                                <h1 className="text-xl md:text-2xl font-semibold">Doctor Profile</h1>
                                <p className="text-xs md:text-sm text-gray-500 hidden sm:block">View doctor information and book appointment</p>
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
                                {patientPicSrc ? (
                                    <img src={patientPicSrc} alt="Patient" className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover" />
                                ) : (
                                    <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-900 rounded-full flex items-center justify-center text-white font-medium">
                                        {(user.username?.[0] || user.email?.[0] || "P").toUpperCase()}
                                    </div>
                                )}
                                <div className="text-sm hidden md:block">
                                    <div className="font-medium">{user.username || user.email}</div>
                                    <div className="text-gray-500 capitalize">Patient</div>
                                </div>
                                <ChevronDown size={16} className="hidden md:block" />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Doctor Header Card */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-8 mb-6">
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                                {/* Profile Picture */}
                                <div className="shrink-0">
                                    {profilePicSrc ? (
                                        <img
                                            src={profilePicSrc}
                                            alt={doctorName}
                                            className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-gray-100"
                                        />
                                    ) : (
                                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-900 flex items-center justify-center text-white text-3xl md:text-4xl font-bold border-4 border-gray-100">
                                            {(doctorDetails.firstName?.[0] || doctorDetails.username?.[0] || 'D').toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                {/* Doctor Info */}
                                <div className="flex-1 w-full text-center md:text-left">
                                    <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-4">
                                        <div>
                                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{doctorName}</h2>
                                            <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-3 h-3 rounded-full ${specializationColor}`}></div>
                                                    <span className="text-base md:text-lg text-gray-700">{doctorDetails.specialization || 'General Practitioner'}</span>
                                                </div>
                                                {doctorDetails.experience && (
                                                    <span className="text-gray-500">•</span>
                                                )}
                                                {doctorDetails.experience && (
                                                    <span className="text-gray-600">{doctorDetails.experience} years experience</span>
                                                )}
                                            </div>
                                            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-sm text-gray-600">
                                                {doctorDetails.phoneNumber && (
                                                    <div className="flex items-center gap-2">
                                                        <Phone size={16} />
                                                        <span>{doctorDetails.phoneNumber}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <Mail size={16} />
                                                    <span>{doctorDetails.email}</span>
                                                </div>
                                                {doctorDetails.address && (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin size={16} />
                                                        <span>{doctorDetails.address}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-center gap-2 md:self-start w-full md:w-auto">
                                            <button
                                                onClick={() => navigate(`/appointments/book?doctor=${id}`)}
                                                className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 flex items-center justify-center gap-2 w-full sm:w-auto"
                                            >
                                                <Calendar size={20} />
                                                Book Appointment
                                            </button>
                                            <button
                                                onClick={() => navigate(`/chat/${id}`)}
                                                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 w-full sm:w-auto"
                                            >
                                                <MessageSquare size={20} />
                                                Message
                                            </button>
                                            <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 hidden sm:block">
                                                <Share2 size={20} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                                            <div className="text-xl md:text-2xl font-bold text-gray-900">500+</div>
                                            <div className="text-sm text-gray-600">Patients Treated</div>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                                            <div className="flex items-center justify-center gap-1 text-xl md:text-2xl font-bold text-gray-900">
                                                4.8 <Star size={20} className="text-yellow-500" fill="currentColor" />
                                            </div>
                                            <div className="text-sm text-gray-600">Rating</div>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                                            <div className="text-xl md:text-2xl font-bold text-gray-900">{doctorDetails.experience || 10}+</div>
                                            <div className="text-sm text-gray-600">Years Experience</div>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                                            <span className={`px-3 py-1 text-sm rounded-full inline-block ${doctorDetails.availability === 'available'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {doctorDetails.availability || 'Available'}
                                            </span>
                                            <div className="text-sm text-gray-600 mt-1">Status</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="bg-white rounded-t-lg border border-gray-200 border-b-0 overflow-x-auto scrollbar-hide">
                            <div className="flex gap-8 px-6 min-w-max">
                                {['About', 'Experience', 'Reviews', 'Availability'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                                            ? 'border-gray-900 text-gray-900'
                                            : 'border-transparent text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="bg-white rounded-b-lg border border-gray-200 p-6 md:p-8">
                            {activeTab === 'About' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">About Dr. {doctorDetails.lastName || doctorDetails.username}</h3>
                                        <p className="text-gray-700 leading-relaxed">
                                            {doctorDetails.bio || `Dr. ${doctorName} is a highly experienced ${doctorDetails.specialization || 'medical'} specialist with over ${doctorDetails.experience || 10} years of practice. Committed to providing exceptional patient care and utilizing the latest medical advances in treatment.`}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="p-2 bg-gray-900 rounded-lg">
                                                    <GraduationCap className="text-white" size={20} />
                                                </div>
                                                <h4 className="font-semibold text-gray-900">Education</h4>
                                            </div>
                                            <p className="text-gray-700">{doctorDetails.education || 'Medical Degree, Top University'}</p>
                                            <p className="text-sm text-gray-600 mt-1">{doctorDetails.graduationYear || '2010'}</p>
                                        </div>

                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="p-2 bg-gray-900 rounded-lg">
                                                    <Award className="text-white" size={20} />
                                                </div>
                                                <h4 className="font-semibold text-gray-900">Certifications</h4>
                                            </div>
                                            <p className="text-gray-700">{doctorDetails.certifications || 'Board Certified Specialist'}</p>
                                            <p className="text-sm text-gray-600 mt-1">Multiple specialization certificates</p>
                                        </div>

                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="p-2 bg-gray-900 rounded-lg">
                                                    <Briefcase className="text-white" size={20} />
                                                </div>
                                                <h4 className="font-semibold text-gray-900">Hospital Affiliations</h4>
                                            </div>
                                            <p className="text-gray-700">{doctorDetails.hospital || 'City Medical Center'}</p>
                                            <p className="text-sm text-gray-600 mt-1">Primary practice location</p>
                                        </div>

                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="p-2 bg-gray-900 rounded-lg">
                                                    <Users className="text-white" size={20} />
                                                </div>
                                                <h4 className="font-semibold text-gray-900">Languages</h4>
                                            </div>
                                            <p className="text-gray-700">{doctorDetails.languages || 'English, Spanish'}</p>
                                            <p className="text-sm text-gray-600 mt-1">Fluent in multiple languages</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-3">Specializations & Expertise</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {(doctorDetails.expertise || ['General Consultation', 'Preventive Care', 'Chronic Disease Management', 'Health Screenings']).map((exp, idx) => (
                                                <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                                                    {exp}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'Experience' && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Experience</h3>
                                    <div className="space-y-4">
                                        <div className="border-l-4 border-gray-900 pl-4 py-2">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">Senior Consultant</h4>
                                                    <p className="text-gray-600">{doctorDetails.hospital || 'City Medical Center'}</p>
                                                </div>
                                                <span className="text-sm text-gray-500">2018 - Present</span>
                                            </div>
                                            <p className="text-sm text-gray-700">Leading specialist in {doctorDetails.specialization || 'general medicine'} with focus on patient-centered care and innovative treatment approaches.</p>
                                        </div>
                                        <div className="border-l-4 border-gray-300 pl-4 py-2">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">Associate Doctor</h4>
                                                    <p className="text-gray-600">Regional Hospital</p>
                                                </div>
                                                <span className="text-sm text-gray-500">2013 - 2018</span>
                                            </div>
                                            <p className="text-sm text-gray-700">Provided comprehensive medical care and built expertise in various medical procedures.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'Reviews' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">Patient Reviews</h3>
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="flex items-center">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star key={star} size={20} className="text-yellow-500" fill="currentColor" />
                                                    ))}
                                                </div>
                                                <span className="text-gray-600">4.8 out of 5 (124 reviews)</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {[
                                            { name: 'Sarah Johnson', rating: 5, date: '2 days ago', comment: 'Excellent doctor! Very thorough and takes time to explain everything. Highly recommend.' },
                                            { name: 'Michael Chen', rating: 5, date: '1 week ago', comment: 'Professional and caring. Made me feel comfortable throughout my treatment.' },
                                            { name: 'Emily Davis', rating: 4, date: '2 weeks ago', comment: 'Great experience overall. Wait time was reasonable and staff was friendly.' }
                                        ].map((review, idx) => (
                                            <div key={idx} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white font-semibold">
                                                            {review.name[0]}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-900">{review.name}</div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex">
                                                                    {[...Array(review.rating)].map((_, i) => (
                                                                        <Star key={i} size={14} className="text-yellow-500" fill="currentColor" />
                                                                    ))}
                                                                </div>
                                                                <span className="text-sm text-gray-500">{review.date}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-gray-700 text-sm">{review.comment}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'Availability' && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Time Slots</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                                            <div key={day} className={`border rounded-lg p-4 ${idx < 5 ? 'border-gray-900 bg-gray-50' : 'border-gray-200 bg-white'}`}>
                                                <div className="text-center">
                                                    <div className="font-semibold text-gray-900 mb-2">{day}</div>
                                                    {idx < 5 ? (
                                                        <div className="text-sm text-gray-600">
                                                            <div>9:00 AM</div>
                                                            <div className="text-gray-400 my-1">to</div>
                                                            <div>5:00 PM</div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-gray-400">Closed</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                                        <Clock className="text-blue-600 mt-0.5 shrink-0" size={20} />
                                        <div>
                                            <p className="font-medium text-blue-900">Booking Notice</p>
                                            <p className="text-sm text-blue-700 mt-1">Please book appointments at least 24 hours in advance. Emergency consultations available via phone.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
