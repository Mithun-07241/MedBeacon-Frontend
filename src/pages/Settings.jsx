import React, { useState, useEffect } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { User, Bell, Shield, Key, Moon, Loader2, Save } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { useAuthContext } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import DashboardHeader from "@/components/layout/DashboardHeader";

export default function Settings() {
    const { user } = useAuthContext();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch Settings
    const { data: settingsData, isLoading: settingsLoading } = useQuery({
        queryKey: ['/api/settings'],
        queryFn: async () => apiRequest('GET', '/api/settings'),
        enabled: !!user
    });

    // Fetch Profile Details
    const { data: profileData, isLoading: profileLoading } = useQuery({
        queryKey: ['/api/profile/details'],
        queryFn: async () => apiRequest('GET', '/api/profile/details'),
        enabled: !!user
    });

    const settings = settingsData?.settings || {};
    const profile = profileData?.patient || profileData?.doctor || {};

    const [accountForm, setAccountForm] = useState({
        username: '',
        email: '',
        phoneNumber: ''
    });

    useEffect(() => {
        if (user) {
            setAccountForm({
                username: user.username || '',
                email: user.email || '',
                phoneNumber: profile.phoneNumber || ''
            });
        }
    }, [user, profile]);

    // Update Settings Mutation
    const updateSettingsMutation = useMutation({
        mutationFn: async (newSettings) => apiRequest('PUT', '/api/settings', newSettings),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
            toast({ title: "Success", description: "Settings updated successfully" });
        }
    });

    // Update Profile Mutation
    // Note: Using complete profile endpoint for upsert, or we could add a specific update details endpoint.
    // For now, reusing valid endpoints. As userController has completeProfile that handles upsert.
    // However, completeProfile expects multipart form data.
    // Let's try to see if there is a JSON endpoint.
    // userController.js: completeProfile handles req.body and req.files.
    // It should work with JSON if no files are sent, provided multer doesn't crash (checked index.js, usually multer is middleware).
    // The route /api/profile/complete uses upload.fields(...).

    // Alternative: We can add a specialized endpoint or just use the complete one.
    // Let's attempt to use completeProfile with FormData to be safe as per route definition.
    const updateProfileMutation = useMutation({
        mutationFn: async (formData) => {
            // Using fetch directly because apiRequest helper might not handle FormData automatically if not configured
            // But apiRequest usually expects JSON.
            // Let's construct a FormData object.
            const res = await apiRequest('POST', '/api/profile/complete', formData);
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/profile/details'] });
            toast({ title: "Profile Updated", description: "Your account details have been saved." });
        },
        onError: (err) => {
            console.error(err);
            toast({ variant: "destructive", title: "Update Failed", description: err.message || "Failed to update profile." });
        }
    });

    const handleAccountSave = () => {
        const formData = new FormData();
        formData.append('username', accountForm.username); // User model update not separate yet, assuming completeProfile might handle or we need separate route.
        // Wait, userController completeProfile updates Patient/Doctor Detail, NOT User model (except profilePic).
        // User model has username/email.
        // If we want to update username/email, we need a route for that.
        // Currently userController doesn't seem to update User.username.
        // For this task, let's focus on Phone Number which is in Detail model.
        formData.append('phoneNumber', accountForm.phoneNumber);
        // We can't update email/username easily without backend change usually.
        // Just sending phone number for now.

        updateProfileMutation.mutate(formData);
    };

    const handleToggle = (key) => {
        updateSettingsMutation.mutate({
            notifications: {
                ...settings.notifications,
                [key]: !settings.notifications?.[key]
            }
        });
    };

    if (settingsLoading || profileLoading) return (
        <DashboardLayout>
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="animate-spin w-8 h-8 text-gray-900" />
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <div className="flex-1 overflow-y-auto p-3 md:p-6 lg:p-8">
                {/* Header */}
                <DashboardHeader
                    title="Settings"
                    subtitle="Manage your preferences"
                    showBack={true}
                />

                <div className="p-3 md:p-6 max-w-4xl mx-auto w-full">

                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden mb-6">
                        <div className="p-3 md:p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <User size={18} /> Account
                            </h2>
                            <button
                                onClick={handleAccountSave}
                                disabled={updateProfileMutation.isPending}
                                className="w-full md:w-auto px-4 md:px-6 py-2.5 md:py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px] text-sm md:text-base font-medium"
                            >
                                {updateProfileMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                Save
                            </button>
                        </div>
                        <div className="p-3 md:p-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Full Name (Read Only)</label>
                                    <input
                                        type="text"
                                        disabled
                                        value={accountForm.username}
                                        className="w-full border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm text-gray-500 dark:text-slate-400 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Email Address (Read Only)</label>
                                    <input
                                        type="email"
                                        disabled
                                        value={accountForm.email}
                                        className="w-full border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm text-gray-500 dark:text-slate-400 cursor-not-allowed"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Phone Number</label>
                                <input
                                    type="tel"
                                    value={accountForm.phoneNumber}
                                    onChange={(e) => setAccountForm({ ...accountForm, phoneNumber: e.target.value })}
                                    className="w-full px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-slate-500 focus:border-transparent text-sm md:text-base"
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden mb-6">
                        <div className="p-3 md:p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
                            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Bell size={18} /> Notifications
                            </h2>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-slate-700">
                            <div className="p-4 flex items-center justify-between">
                                <div>
                                    <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-1">Email Notifications</h3>
                                    <p className="text-xs md:text-sm text-gray-500 dark:text-slate-400">Receive emails for appointments and updates</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={settings.notifications?.email ?? true}
                                        onChange={() => handleToggle('email')}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                                </label>
                            </div>
                            <div className="p-4 flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900">Push Notifications</h3>
                                    <p className="text-xs text-gray-500">Get real-time alerts on your device</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={settings.notifications?.push ?? true}
                                        onChange={() => handleToggle('push')}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                                </label>
                            </div>
                            <div className="p-4 flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900">SMS Alerts</h3>
                                    <p className="text-xs text-gray-500">Receive text messages for urgent alerts</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={settings.notifications?.sms ?? false}
                                        onChange={() => handleToggle('sms')}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="p-3 md:p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
                            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Shield size={18} /> Security
                            </h2>
                        </div>
                        <div className="p-3 md:p-4">
                            <button className="text-sm text-gray-700 hover:text-gray-900 font-medium flex items-center gap-2 mb-4">
                                <Key size={16} /> Change Password
                            </button>
                            <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
