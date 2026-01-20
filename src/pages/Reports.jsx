import React, { useState } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/layout/DashboardHeader"; // Import DashboardHeader
import { FileText, Download, Filter, DownloadCloud, AlertCircle } from 'lucide-react'; // Added icons
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { useAuthContext } from "@/context/AuthContext";

export default function Reports() {
    const { user } = useAuthContext();
    const [filterStatus, setFilterStatus] = useState('all');

    // Fetch Reports
    const { data: reportsData = {}, isLoading } = useQuery({
        queryKey: ['/api/reports'],
        queryFn: async () => apiRequest('GET', '/api/reports'),
        enabled: !!user // Allow both doctor and patient to see reports if applicable, or restricted by backend
    });

    const reports = Array.isArray(reportsData) ? reportsData : (reportsData.reports || []);

    const filteredReports = reports.filter(report => {
        if (filterStatus === 'all') return true;
        return report.status?.toLowerCase() === filterStatus.toLowerCase();
    });

    return (
        <DashboardLayout>
            <div className="flex-1 flex flex-col overflow-hidden">
                <DashboardHeader
                    title="Reports"
                    subtitle="View and generate medical and administrative reports"
                    showSearch={true}
                    searchPlaceholder="Search reports..."
                />

                <div className="flex-1 overflow-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto">

                        {/* Filters & Actions */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto scrollbar-hide">
                                {['All', 'Ready', 'Pending', 'Archived'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setFilterStatus(status.toLowerCase())}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filterStatus === status.toLowerCase()
                                                ? 'bg-gray-900 text-white'
                                                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>

                            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium w-full sm:w-auto justify-center">
                                <Filter size={18} />
                                <span>Filter</span>
                            </button>
                        </div>

                        {/* Reports List */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            {isLoading ? (
                                <div className="p-8 text-center">
                                    <div className="animate-spin w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
                                    <p className="text-gray-500">Loading reports...</p>
                                </div>
                            ) : filteredReports.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FileText className="text-gray-400" size={32} />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">No reports found</h3>
                                    <p className="text-gray-500">Try adjusting your filters or search query</p>
                                </div>
                            ) : (
                                <>
                                    {/* Desktop Table */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase font-medium border-b border-gray-100">
                                                <tr>
                                                    <th className="px-6 py-4">Report Title</th>
                                                    <th className="px-6 py-4">Date</th>
                                                    <th className="px-6 py-4">Type</th>
                                                    <th className="px-6 py-4">Status</th>
                                                    <th className="px-6 py-4 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {filteredReports.map((report) => (
                                                    <tr key={report.id || report._id} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                                                    <FileText size={20} />
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium text-gray-900">{report.title}</div>
                                                                    <div className="text-xs text-gray-500">{report.id || report._id}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-600 text-sm">
                                                            {new Date(report.date || report.createdAt).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="inline-block px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-md">
                                                                {report.type}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize
                                                                ${(report.status || 'pending').toLowerCase() === 'ready' ? 'bg-green-100 text-green-800' :
                                                                    (report.status || 'pending').toLowerCase() === 'pending' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}`}>
                                                                {report.status || 'Pending'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button className="text-gray-400 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-full">
                                                                <DownloadCloud size={18} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Cards View */}
                                    <div className="md:hidden divide-y divide-gray-100">
                                        {filteredReports.map((report) => (
                                            <div key={report.id || report._id} className="p-4 space-y-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                                            <FileText size={20} />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900 line-clamp-1">{report.title}</div>
                                                            <div className="text-xs text-gray-500">{new Date(report.date || report.createdAt).toLocaleDateString()}</div>
                                                        </div>
                                                    </div>
                                                    <button className="text-gray-400 hover:text-gray-900 p-2">
                                                        <DownloadCloud size={20} />
                                                    </button>
                                                </div>

                                                <div className="flex items-center justify-between text-sm pl-[52px]">
                                                    <span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded text-xs">{report.type}</span>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize
                                                        ${(report.status || 'pending').toLowerCase() === 'ready' ? 'bg-green-100 text-green-800' :
                                                            (report.status || 'pending').toLowerCase() === 'pending' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {report.status || 'Pending'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
