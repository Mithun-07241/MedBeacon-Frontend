import React, { useState, useEffect } from 'react';
import {
    Calendar,
    Clock,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Bell,
    Search,
    Heart,
    Pill,
    FileText,
    Activity,
    Wind,
    Thermometer,
    Scale,
    Droplet,
    Eye,
} from 'lucide-react';
import { useParams, useLocation } from "wouter";
import { useAuthContext } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MobileMenuToggle from "@/components/ui/navbar/MobileMenuToggle";

export const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    `${window.location.origin.replace(":5173", ":5000")}`;

export default function PtProfile() {
    const { user } = useAuthContext();
    const { id } = useParams();
    const [, navigate] = useLocation();

    const [patientDetails, setPatientDetails] = useState(null);
    const [healthMetrics, setHealthMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [metricsLoading, setMetricsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('Overview');

    // ============================================
    // FETCH PATIENT DETAILS
    // ============================================

    const fetchDetails = async () => {
        if (!id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Fetch patient details by ID
            const res = await apiRequest("GET", `/api/patients/${id}`);

            if (res?.patient) {
                setPatientDetails(res.patient);
            } else {
                setError("Patient profile not found");
            }
        } catch (err) {
            console.error("Failed to fetch patient details:", err);
            setError(err?.message || "Failed to load patient profile");
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // FETCH HEALTH METRICS
    // ============================================

    const fetchHealthMetrics = async () => {
        if (!id) return;

        try {
            setMetricsLoading(true);
            const res = await apiRequest("GET", `/api/metrics?patientId=${id}`);
            const metrics = Array.isArray(res) ? res : (res.metrics || []);
            // Get the latest metric
            if (metrics.length > 0) {
                setHealthMetrics(metrics[0]);
            }
        } catch (err) {
            console.error("Failed to fetch health metrics:", err);
        } finally {
            setMetricsLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
        fetchHealthMetrics();
    }, [id]);

    // ============================================
    // HELPER FUNCTIONS
    // ============================================

    const calculateAge = (dob) => {
        if (!dob) return 'N/A';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const profilePicSrc = patientDetails?.profilePicUrl
        ? patientDetails.profilePicUrl.startsWith("http")
            ? patientDetails.profilePicUrl
            : `${API_BASE_URL}${patientDetails.profilePicUrl}`
        : null;

    const patientName =
        patientDetails?.username ||
        patientDetails?.email?.split("@")[0] ||
        "Patient";

    // ============================================
    // LOADING & ERROR STATES
    // ============================================

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center text-lg">
                Not logged in. Please log in to continue.
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
                    <p className="text-lg text-gray-600 dark:text-gray-400">Loading patient profile...</p>
                </div>
            </div>
        );
    }

    if (error || !patientDetails) {
        return (
            <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
                <div className="text-center">
                    <p className="text-lg text-red-600 dark:text-red-400 mb-4">{error || "Patient profile not found"}</p>
                    <button
                        onClick={() => navigate('/patients-list')}
                        className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100"
                    >
                        Back to Patients List
                    </button>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout>
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <MobileMenuToggle />
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                                    Patient Profile
                                </h1>
                                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">View patient details</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 md:gap-4">
                            <Bell className="text-gray-600 dark:text-gray-400 hidden sm:block" size={20} />
                            <div className="flex items-center gap-3 pl-2 md:pl-4 border-l border-gray-200 dark:border-gray-700">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center font-semibold text-sm">
                                    {(user?.username?.[0] || 'U').toUpperCase()}
                                </div>
                                <div className="text-sm hidden md:block">
                                    <div className="font-semibold text-gray-900 dark:text-white">
                                        {user?.username || user?.email}
                                    </div>
                                    <div className="text-gray-500 dark:text-gray-400 capitalize">
                                        {user?.role}
                                    </div>
                                </div>
                                <ChevronDown size={16} className="text-gray-400 hidden md:block" />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Patient Info */}
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
                            <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start text-center sm:text-left">
                                {profilePicSrc ? (
                                    <img
                                        src={profilePicSrc}
                                        alt={patientName}
                                        className="w-20 h-20 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-3xl font-bold">
                                        {patientName[0]?.toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{patientName}</h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {patientDetails.gender || 'Not specified'} · Age{" "}
                                        {calculateAge(patientDetails.dateOfBirth)}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {patientDetails.email}
                                    </p>
                                    {patientDetails.phoneNumber && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            {patientDetails.phoneNumber}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-t-lg border-b-0 overflow-x-auto scrollbar-hide">
                            <div className="flex gap-8 px-6 min-w-max">
                                {['Overview', 'Appointments', 'Medical Records', 'Medications'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`py-4 text-sm font-medium whitespace-nowrap ${activeTab === tab
                                            ? 'border-b-2 border-gray-900 dark:border-white text-gray-900 dark:text-white'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-b-lg p-6">
                            {/* Overview Tab */}
                            {activeTab === 'Overview' && (
                                <>
                                    <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Overview</h3>
                                        {patientDetails.treatmentFileUrl && (
                                            <button
                                                onClick={() => navigate(`/treatment-file/${id}`)}
                                                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors shadow-sm font-medium text-sm"
                                            >
                                                <Eye size={16} />
                                                View Treatment File
                                            </button>
                                        )}
                                    </div>

                                    {/* Vitals */}
                                    <div className="mb-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <Heart size={18} className="text-red-500" fill="currentColor" />
                                                <h4 className="font-semibold text-gray-900 dark:text-white">Vitals</h4>
                                            </div>
                                        </div>

                                        {metricsLoading ? (
                                            <div className="text-center py-8">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto mb-2"></div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Loading vitals...</p>
                                            </div>
                                        ) : healthMetrics ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-center border border-gray-100 dark:border-gray-600">
                                                    <div className="font-bold text-gray-900 dark:text-white">{healthMetrics.heartRate || '--'} bpm</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Heart Rate</div>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-center border border-gray-100 dark:border-gray-600">
                                                    <div className="font-bold text-gray-900 dark:text-white">{healthMetrics.weight || '--'} kg</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Weight</div>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-center border border-gray-100 dark:border-gray-600">
                                                    <div className="font-bold text-gray-900 dark:text-white">{healthMetrics.oxygenSaturation || '--'}%</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">O2 Sat</div>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-center border border-gray-100 dark:border-gray-600">
                                                    <div className="font-bold text-gray-900 dark:text-white">{healthMetrics.temperature || '--'} °C</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Temp</div>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-center border border-gray-100 dark:border-gray-600">
                                                    <div className="font-bold text-gray-900 dark:text-white">
                                                        {healthMetrics.bloodPressureSystolic && healthMetrics.bloodPressureDiastolic
                                                            ? `${healthMetrics.bloodPressureSystolic}/${healthMetrics.bloodPressureDiastolic}`
                                                            : '--'}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">BP</div>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-center border border-gray-100 dark:border-gray-600">
                                                    <div className="font-bold text-gray-900 dark:text-white">--</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Blood Sugar</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                                                <Activity className="text-gray-400 mx-auto mb-2" size={32} />
                                                <p className="text-sm text-gray-500 dark:text-gray-400">No vitals recorded</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Medications */}
                                    <div className="mb-6">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Pill size={18} className="text-purple-500" />
                                            <h4 className="font-semibold text-gray-900 dark:text-white">Medications</h4>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-center">
                                            No medication data available
                                        </p>
                                    </div>

                                    {/* Reports */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <FileText size={18} className="text-blue-500" />
                                            <h4 className="font-semibold text-gray-900 dark:text-white">Reports</h4>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-center">
                                            Reports available in records section
                                        </p>
                                    </div>
                                </>
                            )}

                            {/* Appointments Tab */}
                            {activeTab === 'Appointments' && (
                                <div className="text-center py-12">
                                    <Calendar className="text-gray-400 mx-auto mb-4" size={48} />
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Appointments</h3>
                                    <p className="text-gray-500 dark:text-gray-400">This feature is coming soon</p>
                                </div>
                            )}

                            {/* Medical Records Tab */}
                            {activeTab === 'Medical Records' && (
                                <div className="text-center py-12">
                                    <FileText className="text-gray-400 mx-auto mb-4" size={48} />
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Medical Records</h3>
                                    <p className="text-gray-500 dark:text-gray-400">This feature is coming soon</p>
                                </div>
                            )}

                            {/* Medications Tab */}
                            {activeTab === 'Medications' && (
                                <div className="text-center py-12">
                                    <Pill className="text-gray-400 mx-auto mb-4" size={48} />
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Medications</h3>
                                    <p className="text-gray-500 dark:text-gray-400">This feature is coming soon</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
