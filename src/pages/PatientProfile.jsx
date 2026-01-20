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
    Edit2,
    Save,
    X,
    Download,
    Eye,
    Upload,
} from 'lucide-react';
import { useLocation } from "wouter";
import { useAuthContext } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MobileMenuToggle from "@/components/ui/navbar/MobileMenuToggle";

export const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    `${window.location.origin.replace(":5173", ":5000")}`;

export default function PatientOwnProfile() {
    const { user } = useAuthContext();
    const [, navigate] = useLocation();

    const [patientDetails, setPatientDetails] = useState(null);
    const [healthMetrics, setHealthMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [metricsLoading, setMetricsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [activeTab, setActiveTab] = useState('Overview');
    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState({});
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [treatmentFile, setTreatmentFile] = useState(null);

    const startTime = '02:00 PM';
    const endTime = '11:20 PM';

    // ============================================
    // FETCH PATIENT DETAILS
    // ============================================

    const fetchDetails = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Fetch profile details
            const res = await apiRequest("GET", "/api/profile/details");

            if (res?.patient) {
                setPatientDetails(res.patient);
                setEditedData(res.patient);
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
        if (!user) return;

        try {
            setMetricsLoading(true);
            const res = await apiRequest("GET", "/api/metrics");
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

    // ============================================
    // EDIT HANDLERS
    // ============================================

    const handleEditToggle = () => {
        if (isEditing) {
            // Cancel editing - revert changes
            setEditedData(patientDetails);
            setTreatmentFile(null);
        }
        setIsEditing(!isEditing);
    };

    const handleInputChange = (field, value) => {
        setEditedData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setTreatmentFile(file);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            // If there's a treatment file to upload
            if (treatmentFile) {
                const formData = new FormData();
                formData.append('treatmentFile', treatmentFile);

                // Upload the file first
                const uploadRes = await apiRequest("POST", "/api/profile/upload-treatment", formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                // Add the file URL to edited data
                if (uploadRes?.treatmentFileUrl) {
                    editedData.treatmentFileUrl = uploadRes.treatmentFileUrl;
                }
            }

            // Update profile with all changes
            await apiRequest("PATCH", `/api/profile/update`, editedData);

            // Refetch full patient details to get updated data
            await fetchDetails();

            setIsEditing(false);
            setTreatmentFile(null);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            console.error("Failed to save changes:", err);
            alert(err?.message || "Failed to save changes. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        fetchDetails();
        fetchHealthMetrics();
    }, [user]);

    // ============================================
    // HELPER FUNCTIONS
    // ============================================

    const formatDate = (date) =>
        date.toLocaleDateString('en-US', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });

    const changeDate = (days) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + days);
        setSelectedDate(d);
    };

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
        (patientDetails?.username && patientDetails.username !== 'patient'
            ? patientDetails.username.charAt(0).toUpperCase() + patientDetails.username.slice(1)
            : null) ||
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
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
                    <p className="text-lg text-gray-600 dark:text-gray-400">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error || !patientDetails) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-lg text-red-600 mb-4">{error || "Patient profile not found"}</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100"
                    >
                        Go to Dashboard
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
                                    Dashboard
                                </h1>
                                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Patient Profile</p>
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

                {/* Success Message */}
                {saveSuccess && (
                    <div className="mx-4 md:mx-8 mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <p className="text-green-700 dark:text-green-400 font-medium">Profile updated successfully!</p>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Patient Info */}
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
                            <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start justify-between">
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
                                    </div>
                                </div>

                                {/* Edit Button */}
                                <div className="shrink-0">
                                    {!isEditing ? (
                                        <button
                                            onClick={handleEditToggle}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm font-medium"
                                        >
                                            <Edit2 size={16} />
                                            Edit Profile
                                        </button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleSave}
                                                disabled={saving}
                                                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm font-medium"
                                            >
                                                <Save size={16} />
                                                {saving ? 'Saving...' : 'Save'}
                                            </button>
                                            <button
                                                onClick={handleEditToggle}
                                                disabled={saving}
                                                className="flex items-center gap-2 px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50 transition-colors shadow-sm font-medium"
                                            >
                                                <X size={16} />
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Edit Profile Section */}
                        {isEditing && (
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Edit Profile</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Username</label>
                                        <input
                                            type="text"
                                            value={editedData.username || ''}
                                            onChange={(e) => handleInputChange('username', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date of Birth</label>
                                        <input
                                            type="date"
                                            value={editedData.dateOfBirth || ''}
                                            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gender</label>
                                        <select
                                            value={editedData.gender || ''}
                                            onChange={(e) => handleInputChange('gender', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        >
                                            <option value="">Select gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Blood Type</label>
                                        <select
                                            value={editedData.bloodType || ''}
                                            onChange={(e) => handleInputChange('bloodType', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        >
                                            <option value="">Select blood type</option>
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                                        <input
                                            type="tel"
                                            value={editedData.phoneNumber || ''}
                                            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address</label>
                                        <textarea
                                            value={editedData.address || ''}
                                            onChange={(e) => handleInputChange('address', e.target.value)}
                                            rows={2}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Treatment File</label>
                                        <div className="space-y-2">
                                            {patientDetails.treatmentFileUrl && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                    <FileText size={16} />
                                                    <span>Current file: </span>
                                                    <a
                                                        href={patientDetails.treatmentFileUrl.startsWith('http')
                                                            ? patientDetails.treatmentFileUrl
                                                            : `${API_BASE_URL}${patientDetails.treatmentFileUrl}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 dark:text-blue-400 hover:underline"
                                                    >
                                                        View current file
                                                    </a>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="file"
                                                    accept=".pdf,.doc,.docx,.txt"
                                                    onChange={handleFileChange}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-600 dark:file:text-white"
                                                />
                                            </div>
                                            {treatmentFile && (
                                                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                                                    <Upload size={16} />
                                                    <span>New file selected: {treatmentFile.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 flex gap-3 justify-end">
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm font-medium"
                                        >
                                            <Save size={16} />
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                        <button
                                            onClick={handleEditToggle}
                                            disabled={saving}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50 transition-colors shadow-sm font-medium"
                                        >
                                            <X size={16} />
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

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
                                                onClick={() => navigate(`/treatment-file/${patientDetails._id}`)}
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
                                            <button
                                                onClick={() => navigate('/health-metrics')}
                                                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                                            >
                                                Update Vitals →
                                            </button>
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
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No vitals recorded</p>
                                                <button
                                                    onClick={() => navigate('/health-metrics')}
                                                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                                                >
                                                    Record Vitals
                                                </button>
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
                                            No editable medication data
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
