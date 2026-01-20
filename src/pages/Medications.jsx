import React, { useState } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { Pill, Clock, AlertCircle, Plus, Calendar, X, Check, Filter, Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { useAuthContext } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { sendMedicationReminder } from "@/utils/notifications";

export default function Medications() {
    const { user } = useAuthContext();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Fetch Medications
    const { data: medicationsData = {}, isLoading } = useQuery({
        queryKey: ['/api/medications'],
        queryFn: async () => apiRequest('GET', '/api/medications'),
        enabled: !!user
    });

    const medications = Array.isArray(medicationsData) ? medicationsData : (medicationsData.medications || []);

    // Add Medication Mutation
    const addMutation = useMutation({
        mutationFn: async (newMed) => apiRequest('POST', '/api/medications', newMed),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['/api/medications'] });
            setIsAddModalOpen(false);
            toast({ title: "Success", description: "Medication added successfully" });

            // Send medication reminder notification if time is set
            if (formData.time) {
                sendMedicationReminder({
                    medicationId: data.id || data._id,
                    name: formData.name,
                    dosage: formData.dosage,
                    time: formData.time
                }).catch(err => console.error('Failed to send notification:', err));
            }
        },
        onError: (err) => {
            toast({ title: "Error", description: err.message || "Failed to add medication", variant: "destructive" });
        }
    });

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        dosage: '',
        frequency: 'Daily',
        time: '',
        status: 'Active',
        remaining: 30
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        addMutation.mutate(formData);
    };

    return (
        <DashboardLayout>
            <div className="flex-1 flex flex-col overflow-hidden">
                <DashboardHeader
                    title="Medications"
                    subtitle="Manage your prescriptions and schedule"
                    showSearch={true}
                    searchPlaceholder="Search medications..."
                    rightContent={
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 flex items-center gap-2 transition-colors text-sm font-medium"
                        >
                            <Plus size={18} />
                            <span className="hidden sm:inline">Add Medication</span>
                        </button>
                    }
                />

                <div className="flex-1 overflow-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto">

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                        <Pill size={20} />
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-500">Active Prescriptions</h3>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {medications.filter(m => m.status === 'Active').length}
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                        <Clock size={20} />
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-500">Upcoming Refills</h3>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {medications.filter(m => m.remaining < 7).length}
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                        <Check size={20} />
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-500">Adherence Rate</h3>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">98%</p>
                            </div>
                        </div>

                        {/* Medications List */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            {isLoading ? (
                                <div className="p-8 text-center">
                                    <div className="animate-spin w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
                                    <p className="text-gray-500">Loading medications...</p>
                                </div>
                            ) : medications.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Pill className="text-gray-400" size={32} />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">No medications found</h3>
                                    <p className="text-gray-500 mb-4">Add your prescriptions to track them here</p>
                                    <button
                                        onClick={() => setIsAddModalOpen(true)}
                                        className="text-blue-600 font-medium hover:underline"
                                    >
                                        Add your first medication
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Desktop Table */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase font-medium border-b border-gray-100">
                                                <tr>
                                                    <th className="px-6 py-4">Medication</th>
                                                    <th className="px-6 py-4">Instructions</th>
                                                    <th className="px-6 py-4">Status</th>
                                                    <th className="px-6 py-4">Refills</th>
                                                    <th className="px-6 py-4 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {medications.map((med) => (
                                                    <tr key={med.id || med._id} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                                                    <Pill size={20} />
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium text-gray-900">{med.name}</div>
                                                                    <div className="text-xs text-gray-500">{med.dosage}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm text-gray-700 font-medium">{med.frequency}</div>
                                                            <div className="text-xs text-gray-500">{med.time || 'As needed'}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize
                                                                ${med.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                                {med.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full ${med.remaining < 7 ? 'bg-red-500' : 'bg-blue-500'}`}
                                                                        style={{ width: `${Math.min((med.remaining / 30) * 100, 100)}%` }}
                                                                    ></div>
                                                                </div>
                                                                <span className="text-xs text-gray-600">{med.remaining} left</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button className="text-gray-400 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-full">
                                                                <Filter size={18} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Cards View */}
                                    <div className="md:hidden divide-y divide-gray-100">
                                        {medications.map((med) => (
                                            <div key={med.id || med._id} className="p-4 space-y-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                                            <Pill size={20} />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900">{med.name}</div>
                                                            <div className="text-xs text-gray-500">{med.dosage}</div>
                                                        </div>
                                                    </div>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize
                                                        ${med.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {med.status}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-sm pl-[52px]">
                                                    <div>
                                                        <span className="text-gray-500 text-xs block">Frequency</span>
                                                        <span className="font-medium text-gray-900">{med.frequency}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 text-xs block">Time</span>
                                                        <span className="font-medium text-gray-900">{med.time || 'N/A'}</span>
                                                    </div>
                                                </div>

                                                <div className="pl-[52px]">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${med.remaining < 7 ? 'bg-red-500' : 'bg-blue-500'}`}
                                                                style={{ width: `${Math.min((med.remaining / 30) * 100, 100)}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-xs text-gray-600 font-medium">{med.remaining} left</span>
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

                {/* Add Medication Modal */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                                <h3 className="font-semibold text-gray-900">Add New Medication</h3>
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-500 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Medication Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 transition-shadow"
                                        placeholder="e.g. Amoxicillin"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 transition-shadow"
                                            placeholder="e.g. 500mg"
                                            value={formData.dosage}
                                            onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 transition-shadow bg-white"
                                            value={formData.frequency}
                                            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                        >
                                            <option>Daily</option>
                                            <option>Twice Daily</option>
                                            <option>Weekly</option>
                                            <option>As needed</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                        <input
                                            type="time"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 transition-shadow"
                                            value={formData.time}
                                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Days Supply</label>
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 transition-shadow"
                                            placeholder="e.g. 30"
                                            value={formData.remaining}
                                            onChange={(e) => setFormData({ ...formData, remaining: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-colors"
                                        disabled={addMutation.isPending}
                                    >
                                        {addMutation.isPending ? 'Adding...' : 'Add Medication'}
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
