import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { useAuthContext } from '@/context/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MobileMenuToggle from '@/components/ui/navbar/MobileMenuToggle';
import { Bell, ChevronDown, FileText, Download, ArrowLeft } from 'lucide-react';

export const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    `${window.location.origin.replace(':5173', ':5000')}`;

export default function TreatmentFile() {
    const { user } = useAuthContext();
    const { id } = useParams();
    const [, navigate] = useLocation();

    const [treatmentFileUrl, setTreatmentFileUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [patientName, setPatientName] = useState('');

    useEffect(() => {
        const fetchTreatmentFile = async () => {
            if (!id) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Fetch patient details to get treatment file URL
                const res = await apiRequest('GET', `/api/patients/${id}`);

                if (res?.patient) {
                    const fileUrl = res.patient.treatmentFileUrl;

                    if (!fileUrl) {
                        setError('No treatment file available for this patient');
                        return;
                    }

                    // Handle both Cloudinary URLs and relative paths
                    const fullUrl = fileUrl.startsWith('http')
                        ? fileUrl
                        : `${API_BASE_URL}${fileUrl}`;

                    setTreatmentFileUrl(fullUrl);
                    setPatientName(
                        res.patient.username ||
                        res.patient.email?.split('@')[0] ||
                        'Patient'
                    );
                } else {
                    setError('Patient not found');
                }
            } catch (err) {
                console.error('Failed to fetch treatment file:', err);
                setError(err?.message || 'Failed to load treatment file');
            } finally {
                setLoading(false);
            }
        };

        fetchTreatmentFile();
    }, [id]);

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
                    <p className="text-lg text-gray-600 dark:text-gray-400">Loading treatment file...</p>
                </div>
            </div>
        );
    }

    if (error || !treatmentFileUrl) {
        return (
            <DashboardLayout>
                <div className="flex-1 flex flex-col overflow-hidden">
                    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-8 py-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <MobileMenuToggle />
                                <div>
                                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                                        Treatment File
                                    </h1>
                                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">View patient treatment file</p>
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className="flex-1 flex items-center justify-center p-4">
                        <div className="text-center">
                            <FileText className="text-gray-400 mx-auto mb-4" size={64} />
                            <p className="text-lg text-red-600 dark:text-red-400 mb-4">{error || 'Treatment file not found'}</p>
                            <button
                                onClick={() => navigate(`/patients/${id}`)}
                                className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 inline-flex items-center gap-2"
                            >
                                <ArrowLeft size={16} />
                                Back to Patient Profile
                            </button>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
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
                                    Treatment File
                                </h1>
                                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                                    {patientName}'s treatment file
                                </p>
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
                <div className="flex-1 overflow-hidden p-4 md:p-8">
                    <div className="max-w-7xl mx-auto h-full flex flex-col">
                        {/* Action Bar */}
                        <div className="flex justify-between items-center mb-4">
                            <button
                                onClick={() => navigate(`/patients/${id}`)}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 inline-flex items-center gap-2 transition-colors"
                            >
                                <ArrowLeft size={16} />
                                Back to Profile
                            </button>

                            <a
                                href={treatmentFileUrl}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 inline-flex items-center gap-2 transition-colors"
                            >
                                <Download size={16} />
                                Download File
                            </a>
                        </div>

                        {/* File Viewer */}
                        <div className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                            {treatmentFileUrl.toLowerCase().endsWith('.pdf') ? (
                                <iframe
                                    src={treatmentFileUrl}
                                    className="w-full h-full"
                                    title="Treatment File"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center p-4">
                                    <img
                                        src={treatmentFileUrl}
                                        alt="Treatment File"
                                        className="max-w-full max-h-full object-contain"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
