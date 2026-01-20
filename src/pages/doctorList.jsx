import React, { useState, useEffect } from 'react';
import BackButton from "@/components/BackButton";
import { Calendar, Users, BarChart2, MessageSquare, Pill, HelpCircle, Settings, ChevronLeft, Plus, Filter, Search, Bell, ChevronDown, Phone, Mail, MoreVertical, ExternalLink, Heart, Home, FileText, Activity, CalendarDays, Video, Stethoscope } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuthContext } from '@/context/AuthContext';
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MobileMenuToggle from "@/components/ui/navbar/MobileMenuToggle";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `${window.location.origin.replace(':5173', ':5000')}`;

export default function DoctorsList() {
    const { user, logout } = useAuthContext();
    const [, navigate] = useLocation();
    const [activePage, setActivePage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [patientDetails, setPatientDetails] = useState(null);
    const [showProfileBanner, setShowProfileBanner] = useState(false);
    const ITEMS_PER_PAGE = 10;

    const specializations = [
        { label: 'Cardiology', color: 'bg-red-600' },
        { label: 'Neurology', color: 'bg-purple-600' },
        { label: 'Orthopedics', color: 'bg-blue-600' },
        { label: 'Pediatrics', color: 'bg-green-600' },
        { label: 'General', color: 'bg-gray-600' },
    ];

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

    // ============================================
    // PROFILE PICTURE HANDLING
    // ============================================

    const profilePicSrc = patientDetails?.profilePicUrl
        ? patientDetails.profilePicUrl.startsWith("http")
            ? patientDetails.profilePicUrl
            : `${API_BASE_URL}${patientDetails.profilePicUrl}`
        : null;

    // Initialize banner visibility
    useEffect(() => {
        if (!user) {
            setShowProfileBanner(false);
            return;
        }
        const key = `profileBannerDismissed:${user.id}`;
        const dismissed = typeof window !== 'undefined' && localStorage.getItem(key) === '1';
        setShowProfileBanner(user.profileCompleted === false && !dismissed);
    }, [user?.id, user?.profileCompleted]);

    const dismissProfileBanner = () => {
        if (!user) return;
        const key = `profileBannerDismissed:${user.id}`;
        try {
            localStorage.setItem(key, '1');
        } catch {
            // ignore storage errors
        }
        setShowProfileBanner(false);
    };

    // ============================================
    // FETCH DOCTORS LIST - CORRECT API ENDPOINT
    // ============================================

    const { data: doctors = [], isLoading: doctorsLoading } = useQuery({
        queryKey: ['/api/doctors'],
        enabled: !!user,
    });

    // Filter doctors based on search query
    const filteredDoctors = doctors.filter(doctor => {
        const searchLower = searchQuery.toLowerCase();
        const name = `${doctor.firstName || ''} ${doctor.lastName || ''} ${doctor.username || ''}`.toLowerCase();
        const specialization = (doctor.specialization || '').toLowerCase();
        return name.includes(searchLower) || specialization.includes(searchLower);
    });

    // ============================================
    // PAGINATION LOGIC
    // ============================================

    const totalDoctors = filteredDoctors.length;
    const totalPages = Math.ceil(totalDoctors / ITEMS_PER_PAGE);
    const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentDoctors = filteredDoctors.slice(startIndex, endIndex);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setActivePage(page);
        }
    };

    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (activePage <= 3) {
                pages.push(1, 2, 3, 4, '...', totalPages);
            } else if (activePage >= totalPages - 2) {
                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', activePage - 1, activePage, activePage + 1, '...', totalPages);
            }
        }
        return pages;
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    // ============================================
    // LOADING STATE CHECK
    // ============================================

    if (!user) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

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
                                <h1 className="text-xl md:text-2xl font-semibold text-gray-900">My Doctors</h1>
                                <p className="text-xs md:text-sm text-gray-500 hidden sm:block">Find and connect with healthcare providers</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 md:gap-4">
                            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                                <Bell size={20} />
                            </button>
                            <div
                                className="flex items-center gap-3 pl-2 md:pl-4 border-l border-gray-200 cursor-pointer"
                                onClick={() => navigate('/profile')}
                            >
                                {profilePicSrc ? (
                                    <div className="relative">
                                        <img src={profilePicSrc} alt="Patient profile" className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover" />
                                        {user.profileCompleted === false && (
                                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-600 rounded-full ring-2 ring-white" />
                                        )}
                                    </div>
                                ) : (
                                    <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-900 rounded-full flex items-center justify-center text-white font-medium relative">
                                        {(user.username?.[0] || user.email?.[0] || "P").toUpperCase()}
                                        {user.profileCompleted === false && (
                                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-600 rounded-full ring-2 ring-white" />
                                        )}
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

                {/* Profile Banner */}
                {user.profileCompleted === false && showProfileBanner && (
                    <div className="px-4 md:px-8 pt-4">
                        <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-3 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-yellow-700 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2L2 21h20L12 2z" />
                                    <path d="M11 10h2v5h-2zM11 16h2v2h-2z" fill="white" />
                                </svg>
                                <p className="text-sm">Your profile is incomplete. Complete it to unlock all features.</p>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
                                <button
                                    onClick={() => navigate("/profile-setup")}
                                    className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800"
                                >
                                    Complete Now
                                </button>
                                <button onClick={dismissProfileBanner} className="text-yellow-700 hover:text-yellow-900">
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-auto p-3 md:p-6 lg:p-8">
                    {/* Doctors Table */}
                    <div className="bg-white rounded-lg border border-gray-200">
                        <div className="p-4 md:p-6 border-b border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <h2 className="font-semibold text-lg">Available Doctors</h2>
                                <ExternalLink size={16} className="text-gray-400" />
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                                <div className="flex items-center gap-4 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-hide">
                                    {specializations.map((spec, idx) => (
                                        <div key={idx} className="flex items-center gap-2 shrink-0">
                                            <div className={`w-2 h-2 rounded-full ${spec.color}`}></div>
                                            <span className="text-sm text-gray-600">{spec.label}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="relative w-full sm:w-auto">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search doctors..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full sm:w-64 focus:outline-none focus:border-gray-900"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profile</th>
                                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor Name</th>
                                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Specialization</th>
                                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Experience</th>
                                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Contact</th>
                                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Availability</th>
                                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {doctorsLoading ? (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-8 text-center">
                                                <div className="flex justify-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : currentDoctors.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                                {searchQuery ? 'No doctors found matching your search' : 'No doctors available'}
                                            </td>
                                        </tr>
                                    ) : (
                                        currentDoctors.map((doctor) => {
                                            const doctorPicSrc = doctor.profilePicUrl
                                                ? doctor.profilePicUrl.startsWith("http")
                                                    ? doctor.profilePicUrl
                                                    : `${API_BASE_URL}${doctor.profilePicUrl}`
                                                : null;

                                            const doctorName = doctor.firstName && doctor.lastName
                                                ? `Dr. ${doctor.firstName} ${doctor.lastName}`
                                                : doctor.username
                                                    ? `Dr. ${doctor.username}`
                                                    : doctor.email;

                                            const specializationColor = specializations.find(
                                                s => s.label.toLowerCase() === (doctor.specialization || '').toLowerCase()
                                            )?.color || 'bg-gray-600';

                                            return (
                                                <tr key={doctor.id} className="hover:bg-gray-50">
                                                    <td className="px-3 md:px-6 py-4 cursor-pointer" onClick={() => navigate(`/doctors/${doctor.id}`)}>
                                                        {doctorPicSrc ? (
                                                            <img
                                                                src={doctorPicSrc}
                                                                alt={doctorName}
                                                                className="w-10 h-10 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                                                {(doctor.firstName?.[0] || doctor.username?.[0] || 'D').toUpperCase()}{doctor.lastName?.[0]?.toUpperCase() || ''}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-3 md:px-6 py-4 cursor-pointer hover:text-gray-600" onClick={() => navigate(`/doctors/${doctor.id}`)}>
                                                        <div className="text-sm font-medium">{doctorName}</div>
                                                        <div className="text-xs text-gray-500">{doctor.email}</div>
                                                    </td>
                                                    <td className="px-3 md:px-6 py-4 hidden sm:table-cell">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${specializationColor}`}></div>
                                                            <span className="text-sm">{doctor.specialization || 'General'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 md:px-6 py-4 text-sm hidden md:table-cell">{doctor.experience || 'N/A'} years</td>
                                                    <td className="px-3 md:px-6 py-4 hidden lg:table-cell">
                                                        <div className="flex flex-col gap-1">
                                                            {doctor.phoneNumber && (
                                                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                                                    <Phone size={12} />
                                                                    <span>{doctor.phoneNumber}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                                <Mail size={12} />
                                                                <span>{doctor.email}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 md:px-6 py-4 hidden lg:table-cell">
                                                        <span className={`px-2 py-1 text-xs rounded-full ${doctor.availability === 'available'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-gray-100 text-gray-700'
                                                            }`}>
                                                            {doctor.availability || 'Available'}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 md:px-6 py-4">
                                                        <button
                                                            onClick={() => navigate(`/chat/${doctor.id}`)}
                                                            className="p-1.5 md:p-2 hover:bg-gray-100 rounded border border-gray-300"
                                                            title="Message"
                                                        >
                                                            <MessageSquare size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-4 md:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                                    <button
                                        onClick={() => handlePageChange(activePage - 1)}
                                        disabled={activePage === 1}
                                        className={`px-3 py-1 text-sm rounded flex items-center gap-1 ${activePage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
                                            }`}
                                    >
                                        <ChevronLeft size={16} />
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => handlePageChange(activePage + 1)}
                                        disabled={activePage === totalPages}
                                        className={`px-3 py-1 text-sm rounded flex items-center gap-1 sm:hidden ${activePage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
                                            }`}
                                    >
                                        Next
                                        <ChevronLeft size={16} className="rotate-180" />
                                    </button>
                                </div>

                                <div className="flex items-center gap-1 overflow-x-auto max-w-full">
                                    {getPageNumbers().map((page, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => typeof page === 'number' && handlePageChange(page)}
                                            disabled={page === '...'}
                                            className={`px-3 py-1 text-sm rounded shrink-0 ${page === activePage
                                                ? 'bg-gray-900 text-white'
                                                : page === '...'
                                                    ? 'cursor-default'
                                                    : 'hover:bg-gray-100'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>

                                <div className="hidden sm:flex items-center gap-2">
                                    <span className="text-sm text-gray-600">Page</span>
                                    <select
                                        value={activePage}
                                        onChange={(e) => handlePageChange(parseInt(e.target.value))}
                                        className="px-2 py-1 border border-gray-200 rounded text-sm"
                                    >
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                            <option key={page} value={page}>{page}</option>
                                        ))}
                                    </select>
                                    <span className="text-sm text-gray-600">of {totalPages}</span>
                                </div>

                                <button
                                    onClick={() => handlePageChange(activePage + 1)}
                                    disabled={activePage === totalPages}
                                    className={`px-3 py-1 text-sm rounded items-center gap-1 hidden sm:flex ${activePage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
                                        }`}
                                >
                                    Next
                                    <ChevronLeft size={16} className="rotate-180" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
