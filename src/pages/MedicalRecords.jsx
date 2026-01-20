import React, { useState } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { FileText, Download, Eye, Upload, Filter, Calendar, X, Trash2, Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { useAuthContext } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function MedicalRecords() {
    const { user } = useAuthContext();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    // Fetch Records
    const { data: recordsData = {}, isLoading } = useQuery({
        queryKey: ['/api/records'],
        queryFn: async () => apiRequest('GET', '/api/records'),
        enabled: !!user
    });

    const records = Array.isArray(recordsData) ? recordsData : (recordsData.records || []);

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id) => apiRequest('DELETE', `/api/records/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/records'] });
            toast({ title: "Success", description: "Record deleted successfully" });
        },
        onError: (err) => {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    });

    // Mock Upload Mutation
    const uploadMutation = useMutation({
        mutationFn: async (newRecord) => apiRequest('POST', '/api/records', newRecord),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/records'] });
            setIsUploadModalOpen(false);
            toast({ title: "Success", description: "Record uploaded successfully" });
        },
        onError: (err) => {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    });

    const [uploadForm, setUploadForm] = useState({
        name: '',
        type: 'Lab Result',
        date: new Date().toISOString().split('T')[0],
        doctor: ''
    });

    const handleUpload = (e) => {
        e.preventDefault();
        uploadMutation.mutate(uploadForm);
    };

    return (
        <DashboardLayout>
            <div className="flex-1 flex flex-col overflow-hidden">
                <DashboardHeader
                    title="Medical Records"
                    subtitle="Access and manage your health documents"
                    showSearch={true}
                    searchPlaceholder="Search records..."
                    rightContent={
                        <button
                            onClick={() => setIsUploadModalOpen(true)}
                            className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 flex items-center gap-2 transition-colors text-sm font-medium"
                        >
                            <Upload size={18} />
                            <span className="hidden sm:inline">Upload Record</span>
                        </button>
                    }
                />

                <div className="flex-1 overflow-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto">

                        {/* Filters & Actions */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                                {['All Records', 'Lab Results', 'Prescriptions', 'Imaging'].map((tab) => (
                                    <button
                                        key={tab}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${tab === 'All Records'
                                                ? 'bg-gray-900 text-white'
                                                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium w-full sm:w-auto justify-center">
                                <Filter size={18} />
                                <span>Filter</span>
                            </button>
                        </div>

                        {/* Recent Uploads Section (Optional, if we had it separately) */}

                        {/* Records List */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            {isLoading ? (
                                <div className="p-8 text-center">
                                    <div className="animate-spin w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
                                    <p className="text-gray-500">Loading records...</p>
                                </div>
                            ) : records.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FileText className="text-gray-400" size={32} />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">No records found</h3>
                                    <p className="text-gray-500 mb-4">Upload your medical documents to keep them safe</p>
                                    <button
                                        onClick={() => setIsUploadModalOpen(true)}
                                        className="text-blue-600 font-medium hover:underline"
                                    >
                                        Upload your first record
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Desktop Table */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase font-medium border-b border-gray-100">
                                                <tr>
                                                    <th className="px-6 py-4">Record Name</th>
                                                    <th className="px-6 py-4">Date</th>
                                                    <th className="px-6 py-4">Type</th>
                                                    <th className="px-6 py-4">Doctor/Facility</th>
                                                    <th className="px-6 py-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {records.map((record) => (
                                                    <tr key={record.id || record._id} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                                                    <FileText size={20} />
                                                                </div>
                                                                <span className="font-medium text-gray-900">{record.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-600 text-sm">
                                                            {new Date(record.date).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="inline-block px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-md capitalize">
                                                                {record.type}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-600 text-sm">
                                                            {record.doctor || 'Unknown'}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                                    <Eye size={18} />
                                                                </button>
                                                                <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                                                                    <Download size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={() => deleteMutation.mutate(record.id || record._id)}
                                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Cards View */}
                                    <div className="md:hidden divide-y divide-gray-100">
                                        {records.map((record) => (
                                            <div key={record.id || record._id} className="p-4 space-y-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                                            <FileText size={20} />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900 line-clamp-1">{record.name}</div>
                                                            <div className="text-xs text-gray-500">{new Date(record.date).toLocaleDateString()}</div>
                                                        </div>
                                                    </div>
                                                    <span className="inline-block px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-md capitalize">
                                                        {record.type}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between pl-[52px]">
                                                    <span className="text-sm text-gray-600">{record.doctor || 'Unknown'}</span>
                                                    <div className="flex items-center gap-1">
                                                        <button className="p-2 text-gray-400 hover:text-blue-600">
                                                            <Eye size={18} />
                                                        </button>
                                                        <button className="p-2 text-gray-400 hover:text-green-600">
                                                            <Download size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteMutation.mutate(record.id || record._id)}
                                                            className="p-2 text-gray-400 hover:text-red-600"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Upload Modal */}
                {isUploadModalOpen && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                                <h3 className="font-semibold text-gray-900">Upload Record</h3>
                                <button
                                    onClick={() => setIsUploadModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-500 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleUpload} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Record Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 transition-shadow"
                                        placeholder="e.g. Blood Test Results"
                                        value={uploadForm.name}
                                        onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 transition-shadow bg-white"
                                            value={uploadForm.type}
                                            onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
                                        >
                                            <option>Lab Result</option>
                                            <option>Prescription</option>
                                            <option>Imaging</option>
                                            <option>Doctor Note</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 transition-shadow"
                                            value={uploadForm.date}
                                            onChange={(e) => setUploadForm({ ...uploadForm, date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Doctor/Facility</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 transition-shadow"
                                        placeholder="e.g. Dr. Smith / City Hospital"
                                        value={uploadForm.doctor}
                                        onChange={(e) => setUploadForm({ ...uploadForm, doctor: e.target.value })}
                                    />
                                </div>

                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer">
                                    <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                                    <p className="text-sm text-gray-600 font-medium">Click to upload file</p>
                                    <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG up to 10MB</p>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsUploadModalOpen(false)}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-colors"
                                        disabled={uploadMutation.isPending}
                                    >
                                        {uploadMutation.isPending ? 'Uploading...' : 'Upload Record'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
