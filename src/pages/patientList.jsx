import React, { useState, useEffect } from 'react';
import BackButton from "@/components/BackButton";
import { Calendar, Users, BarChart2, MessageSquare, Pill, HelpCircle, Settings, ChevronLeft, Plus, Filter, Search, Bell, ChevronDown, Phone, Mail, MoreVertical, ExternalLink } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuthContext } from '@/context/AuthContext';

import { isUnauthorizedError } from '@/lib/authUtils';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MobileMenuToggle from "@/components/ui/navbar/MobileMenuToggle";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `${window.location.origin.replace(':5173', ':5000')}`;

export default function MedBeaconDashboard() {
    const { user } = useAuthContext();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [, navigate] = useLocation();
    const { logout } = useAuthContext();
    const [, setLocation] = useLocation();
    const [activePage, setActivePage] = useState(1);
    const [activeView, setActiveView] = useState('patients');
    const [voiceAssistantActive, setVoiceAssistantActive] = useState(false);
    const [doctorDetails, setDoctorDetails] = useState(null);
    const [doctorLoading, setDoctorLoading] = useState(true);
    const [showProfileBanner, setShowProfileBanner] = useState(false);
    const ITEMS_PER_PAGE = 10;

    const statusLegend = [
        { label: 'Discharged', color: 'bg-green-600' },
        { label: 'Report Pending', color: 'bg-black' },
        { label: 'ICU', color: 'bg-purple-600' },
        { label: 'In Recovery', color: 'bg-cyan-500' },
        { label: 'Life Support', color: 'bg-red-600' },
    ];

    // Fetch doctor details
    useEffect(() => {
        async function fetchDetails() {
            try {
                const res = await apiRequest("GET", "/api/profile/details");
                setDoctorDetails(res.doctor);
            } catch (err) {
                console.error("Failed to fetch doctor details:", err);
            } finally {
                setDoctorLoading(false);
            }
        }
        if (user) {
            fetchDetails();
        }
    }, [user]);

    const profilePicSrc = doctorDetails?.profilePicUrl
        ? doctorDetails.profilePicUrl.startsWith("http")
            ? doctorDetails.profilePicUrl
            : `${API_BASE_URL}${doctorDetails.profilePicUrl}`
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



    // Fetch alerts for doctor
    const { data: alerts = [], isLoading: alertsLoading } = useQuery({
        queryKey: ['/api/alerts'],
        queryFn: async () => {
            const res = await apiRequest('GET', '/api/alerts');
            return Array.isArray(res) ? res : res.alerts || [];
        },
        enabled: !!user,
    });

    // Fetch patients list
    const { data: patients = [] } = useQuery({
        queryKey: ['/api/patients'],
        enabled: !!user,
    });

    // Update alert status mutation
    const updateAlertMutation = useMutation({
        mutationFn: async ({ alertId, status }) => {
            await apiRequest('PATCH', `/api/alerts/${alertId}/status`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
        },
        onError: (error) => {
            if (isUnauthorizedError(error)) {
                toast({
                    title: "Unauthorized",
                    description: "You are logged out. Logging in again...",
                    variant: "destructive",
                });
                setTimeout(() => {
                    setLocation("/login");
                }, 500);
                return;
            }
            toast({
                title: "Error",
                description: "Failed to update alert status.",
                variant: "destructive",
            });
        },
    });

    const handleAlertAction = (alertId, action) => {
        if (action === 'acknowledge') {
            updateAlertMutation.mutate({ alertId, status: 'acknowledged' });
        } else if (action === 'resolve') {
            updateAlertMutation.mutate({ alertId, status: 'resolved' });
        } else if (action === 'voice') {
            toast({
                title: "Voice Call",
                description: "Initiating voice call to patient...",
            });
        } else if (action === 'message') {
            toast({
                title: "Message",
                description: "Opening message interface...",
            });
        }
    };

    const handleLogout = () => {
        logout();
        setLocation("/login");
    };

    const urgentAlerts = alerts.filter(alert => alert.severity === 'urgent' || alert.severity === 'critical');
    const totalPatients = patients.length;
    const pendingReviews = alerts.filter(alert => alert.status === 'pending').length;

    // Pagination logic
    const totalPages = Math.ceil(totalPatients / ITEMS_PER_PAGE);
    const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentPatients = patients.slice(startIndex, endIndex);

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

    if (!user) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    return (
        <DashboardLayout>
            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <MobileMenuToggle />
                            <BackButton className="mb-0" />
                            <div>
                                <h1 className="text-xl md:text-2xl font-semibold">Dashboard</h1>
                                <p className="text-xs md:text-sm text-gray-500 capitalize">{activeView}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 md:gap-4">
                            <div className="relative hidden md:block">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search"
                                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-64 focus:outline-none focus:border-black"
                                />
                            </div>
                            <button className="md:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-600">
                                <Search size={20} />
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                                <Bell size={20} />
                                {urgentAlerts.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                        {urgentAlerts.length}
                                    </span>
                                )}
                            </button>
                            <div className="flex items-center gap-3 pl-2 md:pl-4 border-l border-gray-200 cursor-pointer" onClick={() => {
                                if (user.role === "doctor") {
                                    navigate("/profile");
                                }
                            }}>
                                {profilePicSrc ? (
                                    <div className="relative">
                                        <img src={profilePicSrc} alt="Doctor profile" className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover" />
                                        {user.profileCompleted === false && (
                                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-600 rounded-full ring-2 ring-white" />
                                        )}
                                    </div>
                                ) : (
                                    <div className="w-8 h-8 md:w-10 md:h-10 bg-black rounded-full flex items-center justify-center text-white font-medium relative">
                                        {(user.username?.[0] || user.email?.[0] || "D").toUpperCase()}
                                        {user.profileCompleted === false && (
                                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-600 rounded-full ring-2 ring-white" />
                                        )}
                                    </div>
                                )}
                                <div className="text-sm hidden md:block">
                                    <div className="font-medium">Dr {user.username || user.email}</div>
                                    <div className="text-gray-500">{user.specialization}</div>
                                </div>
                                <ChevronDown size={16} className="hidden md:block" />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Profile Banner */}
                {user.profileCompleted === false && showProfileBanner && (
                    <div className="px-4 md:px-8 pt-4">
                        <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-3 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-yellow-700 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2L2 21h20L12 2z" />
                                    <path d="M11 10h2v5h-2zM11 16h2v2h-2z" fill="white" />
                                </svg>
                                <p className="text-sm">Your profile is incomplete. Complete it to unlock all features.</p>
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                                <button
                                    onClick={() => setLocation("/profile-setup")}
                                    className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 whitespace-nowrap"
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
                    {/* Patients Table */}
                    <div className="bg-white rounded-lg border border-gray-200 mb-8">
                        <div className="p-4 md:p-6 border-b border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <h2 className="font-semibold text-lg">Patients List</h2>
                                <ExternalLink size={16} className="text-gray-400" />
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                                <div className="flex items-center gap-2 md:gap-4 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-hide">
                                    {statusLegend.map((status, idx) => (
                                        <div key={idx} className="flex items-center gap-2 whitespace-nowrap">
                                            <div className={`w-2 h-2 rounded-full ${status.color}`}></div>
                                            <span className="text-sm text-gray-600">{status.label}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <button className="flex-1 sm:flex-none px-4 py-2 bg-black text-white rounded-lg flex items-center justify-center gap-2 hover:bg-gray-800 whitespace-nowrap">
                                        <Plus size={16} />
                                        Add Patient
                                    </button>
                                    <button className="flex-1 sm:flex-none px-4 py-2 border border-gray-200 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 whitespace-nowrap">
                                        <Filter size={16} />
                                        Filter
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profile</th>
                                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Age</th>
                                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Symptom</th>
                                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Status</th>
                                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {currentPatients.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                                                No patients found
                                            </td>
                                        </tr>
                                    ) : (
                                        currentPatients.map((patient) => (
                                            <tr key={patient.id} className="hover:bg-gray-50">
                                                <td className="px-3 md:px-6 py-4 cursor-pointer" onClick={() => navigate(`/patients/${patient.id}`)}>
                                                    {patient.profilePicUrl ? (
                                                        <img
                                                            src={patient.profilePicUrl.startsWith("http") ? patient.profilePicUrl : `${API_BASE_URL}${patient.profilePicUrl}`}
                                                            alt={patient.username || "Patient"}
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white text-sm font-medium">
                                                            {(patient.firstName?.[0] || patient.username?.[0] || 'P').toUpperCase()}{(patient.lastName?.[0] || '').toUpperCase()}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-3 md:px-6 py-4 text-sm font-medium cursor-pointer hover:text-gray-600" onClick={() => navigate(`/patients/${patient.id}`)}>
                                                    {patient.firstName && patient.lastName
                                                        ? `${patient.firstName} ${patient.lastName}`
                                                        : patient.username || patient.email
                                                    }
                                                </td>
                                                <td className="px-3 md:px-6 py-4 text-sm hidden sm:table-cell">{patient.age || 'N/A'}</td>
                                                <td className="px-3 md:px-6 py-4 text-sm hidden md:table-cell">{patient.symptom || patient.area || 'N/A'}</td>
                                                <td className="px-3 md:px-6 py-4 hidden lg:table-cell">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${patient.statusColor || 'bg-gray-400'}`}></div>
                                                        <span className="text-sm">{patient.status || 'Unknown'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 md:px-6 py-4">
                                                    <button
                                                        onClick={() => navigate(`/chat/${patient.id}`)}
                                                        className="p-1.5 md:p-2 hover:bg-gray-100 rounded"
                                                        title="Message"
                                                    >
                                                        <MessageSquare size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <button
                                onClick={() => handlePageChange(activePage - 1)}
                                disabled={activePage === 1}
                                className={`px-3 py-1 text-sm rounded flex items-center gap-1 ${activePage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
                                    }`}
                            >
                                <ChevronLeft size={16} />
                                Previous
                            </button>
                            <div className="flex items-center gap-1 overflow-x-auto max-w-full">
                                {getPageNumbers().map((page, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => typeof page === 'number' && handlePageChange(page)}
                                        disabled={page === '...'}
                                        className={`px-3 py-1 text-sm rounded ${page === activePage
                                            ? 'bg-black text-white'
                                            : page === '...'
                                                ? 'cursor-default'
                                                : 'hover:bg-gray-100'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                            <div className="items-center gap-2 hidden sm:flex">
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
                                className={`px-3 py-1 text-sm rounded flex items-center gap-1 ${activePage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
                                    }`}
                            >
                                Next
                                <ChevronLeft size={16} className="rotate-180" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

function NavItem({ icon, label, active, badge, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm ${active ? 'bg-gray-100 text-black font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
        >
            {icon}
            <span className="flex-1 text-left">{label}</span>
            {badge && <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">{badge}</span>}
        </button>
    );
}

function TabButton({ label, active, onClick }) {
    return (
        <button onClick={onClick} className={`px-4 py-3 text-sm font-medium ${active ? 'text-black border-b-2 border-black' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {label}
        </button>
    );
}

function StatCard({ title, value, icon, color = 'text-black' }) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    <p className="text-sm text-gray-600 mt-1">{title}</p>
                </div>
                <div className={color}>{icon}</div>
            </div>
        </div>
    );
}
