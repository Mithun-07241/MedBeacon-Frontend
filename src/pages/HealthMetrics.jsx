import React, { useState } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { Activity, Heart, Scale, Thermometer, Plus, X, TrendingUp, Wind, Bluetooth } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { useAuthContext } from "@/context/AuthContext";
import { useBluetoothContext } from "@/context/BluetoothContext";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from 'wouter';
import { sendAlertNotification } from "@/utils/notifications";

export default function HealthMetrics() {
    const { user } = useAuthContext();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [, navigate] = useLocation();
    const { isBluetoothSupported, connectedDevices, pairedDevices, healthData, getAllHealthData } = useBluetoothContext();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Fetch Metrics
    const { data: metricsData = {}, isLoading } = useQuery({
        queryKey: ['/api/metrics'],
        queryFn: async () => apiRequest('GET', '/api/metrics'),
        enabled: !!user
    });

    const metrics = Array.isArray(metricsData) ? metricsData : (metricsData.metrics || []);
    const latestMetric = metrics.length > 0 ? metrics[0] : {};

    // Add Metric Mutation
    const addMutation = useMutation({
        mutationFn: async (newMetric) => apiRequest('POST', '/api/metrics', newMetric),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/metrics'] });
            setIsAddModalOpen(false);
            toast({ title: "Success", description: "Vitals recorded successfully" });
        },
        onError: (err) => {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    });

    const [formData, setFormData] = useState({
        heartRate: '',
        bloodPressureSystolic: '',
        bloodPressureDiastolic: '',
        weight: '',
        temperature: '',
        oxygenSaturation: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        // Check for abnormal vitals and send alerts
        const checkVitals = () => {
            const alerts = [];

            // Heart Rate: Normal range 60-100 bpm
            if (formData.heartRate) {
                const hr = parseInt(formData.heartRate);
                if (hr < 60) {
                    alerts.push({ type: 'warning', message: `Low heart rate detected: ${hr} bpm` });
                } else if (hr > 100) {
                    alerts.push({ type: 'critical', message: `High heart rate detected: ${hr} bpm` });
                }
            }

            // Blood Pressure: Normal systolic <120, diastolic <80
            if (formData.bloodPressureSystolic && formData.bloodPressureDiastolic) {
                const sys = parseInt(formData.bloodPressureSystolic);
                const dia = parseInt(formData.bloodPressureDiastolic);
                if (sys >= 140 || dia >= 90) {
                    alerts.push({ type: 'critical', message: `High blood pressure detected: ${sys}/${dia} mmHg` });
                } else if (sys < 90 || dia < 60) {
                    alerts.push({ type: 'warning', message: `Low blood pressure detected: ${sys}/${dia} mmHg` });
                }
            }

            // Oxygen Saturation: Normal >95%
            if (formData.oxygenSaturation) {
                const o2 = parseInt(formData.oxygenSaturation);
                if (o2 < 90) {
                    alerts.push({ type: 'critical', message: `Low oxygen saturation: ${o2}%` });
                } else if (o2 < 95) {
                    alerts.push({ type: 'warning', message: `Below normal oxygen saturation: ${o2}%` });
                }
            }

            // Temperature: Normal 36.5-37.5°C
            if (formData.temperature) {
                const temp = parseFloat(formData.temperature);
                if (temp >= 38) {
                    alerts.push({ type: 'warning', message: `Fever detected: ${temp}°C` });
                } else if (temp < 36) {
                    alerts.push({ type: 'warning', message: `Low body temperature: ${temp}°C` });
                }
            }

            return alerts;
        };

        const alerts = checkVitals();

        // Send notifications for each alert
        alerts.forEach(alert => {
            sendAlertNotification({
                title: alert.type === 'critical' ? 'Critical Health Alert' : 'Health Warning',
                message: alert.message,
                severity: alert.type
            }).catch(err => console.error('Failed to send alert notification:', err));
        });

        addMutation.mutate({
            ...formData,
            patientId: user.id
        });
    };

    return (
        <DashboardLayout>
            <div className="flex-1 flex flex-col overflow-hidden">
                <DashboardHeader
                    title="Health Metrics"
                    subtitle="Track and monitor your vital signs"
                    showSearch={false}
                    rightContent={
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 flex items-center gap-2 transition-colors text-sm font-medium"
                        >
                            <Plus size={18} />
                            <span className="hidden sm:inline">Record Vitals</span>
                        </button>
                    }
                />

                <div className="flex-1 overflow-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto">

                        {/* Bluetooth Devices Status */}
                        {isBluetoothSupported && pairedDevices.length > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Bluetooth className="w-5 h-5 text-blue-600" />
                                        <div>
                                            <p className="font-medium text-blue-900">
                                                {connectedDevices.length} of {pairedDevices.length} device(s) connected
                                            </p>
                                            <p className="text-sm text-blue-700">
                                                Auto-syncing health data from connected devices
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate('/bluetooth-devices')}
                                        className="text-sm text-blue-600 font-medium hover:text-blue-700 underline"
                                    >
                                        Manage Devices
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Latest Vitals Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-8">
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-red-100 rounded-lg text-red-600">
                                        <Heart size={24} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-500">Heart Rate</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-3xl font-bold text-gray-900">{latestMetric.heartRate || '--'}</h3>
                                    <span className="text-sm text-gray-500">bpm</span>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                                        <Activity size={24} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-500">Blood Pressure</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-3xl font-bold text-gray-900">
                                        {latestMetric.bloodPressureSystolic}/{latestMetric.bloodPressureDiastolic || '--'}
                                    </h3>
                                    <span className="text-sm text-gray-500">mmHg</span>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-purple-100 rounded-lg text-purple-600">
                                        <Wind size={24} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-500">Oxygen</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-3xl font-bold text-gray-900">{latestMetric.oxygenSaturation || '--'}</h3>
                                    <span className="text-sm text-gray-500">%</span>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-green-100 rounded-lg text-green-600">
                                        <Scale size={24} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-500">Weight</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-3xl font-bold text-gray-900">{latestMetric.weight || '--'}</h3>
                                    <span className="text-sm text-gray-500">kg</span>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-orange-100 rounded-lg text-orange-600">
                                        <Thermometer size={24} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-500">Temperature</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-3xl font-bold text-gray-900">{latestMetric.temperature || '--'}</h3>
                                    <span className="text-sm text-gray-500">°C</span>
                                </div>
                            </div>
                        </div>

                        {/* History Table */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">History</h3>
                                <button onClick={() => navigate('/bluetooth-devices')} className="text-sm text-blue-600 font-medium hover:text-blue-700">View All</button>
                            </div>

                            {isLoading ? (
                                <div className="p-8 text-center">
                                    <div className="animate-spin w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
                                    <p className="text-gray-500">Loading history...</p>
                                </div>
                            ) : metrics.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Activity className="text-gray-400" size={32} />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">No metrics recorded</h3>
                                    <p className="text-gray-500">Start tracking your health vitals today</p>
                                </div>
                            ) : (
                                <>
                                    {/* Desktop Table */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase font-medium border-b border-gray-100">
                                                <tr>
                                                    <th className="px-6 py-4">Date</th>
                                                    <th className="px-6 py-4">Heart Rate</th>
                                                    <th className="px-6 py-4">Blood Pressure</th>
                                                    <th className="px-6 py-4">Oxygen</th>
                                                    <th className="px-6 py-4">Weight</th>
                                                    <th className="px-6 py-4">Temperature</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {metrics.map((metric) => (
                                                    <tr key={metric.id || metric._id} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-6 py-4 text-gray-900 font-medium">
                                                            {new Date(metric.date || metric.createdAt).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-600">
                                                            {metric.heartRate} bpm
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-600">
                                                            {metric.bloodPressureSystolic}/{metric.bloodPressureDiastolic} mmHg
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-600">
                                                            {metric.oxygenSaturation}%
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-600">
                                                            {metric.weight} kg
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-600">
                                                            {metric.temperature} °C
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Cards View */}
                                    <div className="md:hidden divide-y divide-gray-100">
                                        {metrics.map((metric) => (
                                            <div key={metric.id || metric._id} className="p-4 space-y-3">
                                                <div className="flex items-center justify-between text-sm mb-2">
                                                    <span className="font-semibold text-gray-900">{new Date(metric.date || metric.createdAt).toLocaleDateString()}</span>
                                                    <span className="text-xs text-gray-500">{new Date(metric.date || metric.createdAt).toLocaleTimeString()}</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-gray-500 text-xs block">Heart Rate</span>
                                                        <span className="font-medium">{metric.heartRate} bpm</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 text-xs block">BP</span>
                                                        <span className="font-medium">{metric.bloodPressureSystolic}/{metric.bloodPressureDiastolic}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 text-xs block">SpO2</span>
                                                        <span className="font-medium">{metric.oxygenSaturation}%</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 text-xs block">Weight</span>
                                                        <span className="font-medium">{metric.weight} kg</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 text-xs block">Temp</span>
                                                        <span className="font-medium">{metric.temperature} °C</span>
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

                {/* Add Vitals Modal */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                                <h3 className="font-semibold text-gray-900">Record Vitals</h3>
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-500 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Heart Rate (bpm)</label>
                                        <input
                                            type="number"
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 transition-shadow"
                                            value={formData.heartRate}
                                            onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°C)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 transition-shadow"
                                            value={formData.temperature}
                                            onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure (mmHg)</label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="number"
                                            placeholder="Systolic"
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 transition-shadow"
                                            value={formData.bloodPressureSystolic}
                                            onChange={(e) => setFormData({ ...formData, bloodPressureSystolic: e.target.value })}
                                        />
                                        <span className="text-gray-400">/</span>
                                        <input
                                            type="number"
                                            placeholder="Diastolic"
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 transition-shadow"
                                            value={formData.bloodPressureDiastolic}
                                            onChange={(e) => setFormData({ ...formData, bloodPressureDiastolic: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Oxygen Saturation (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 transition-shadow"
                                        value={formData.oxygenSaturation}
                                        onChange={(e) => setFormData({ ...formData, oxygenSaturation: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 transition-shadow"
                                        value={formData.weight}
                                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                    />
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
                                        {addMutation.isPending ? 'Saving...' : 'Save Vitals'}
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
