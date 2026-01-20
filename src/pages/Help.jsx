import React, { useState } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { HelpCircle, Mail, Phone, MessageSquare, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Help() {
    const { toast } = useToast();
    const [ticketForm, setTicketForm] = useState({ subject: '', description: '' });

    const ticketMutation = useMutation({
        mutationFn: async (data) => apiRequest('POST', '/api/tickets', data),
        onSuccess: () => {
            toast({ title: "Ticket Submitted", description: "Attributes will get back to you shortly." });
            setTicketForm({ subject: '', description: '' });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to submit ticket.", variant: "destructive" });
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        ticketMutation.mutate(ticketForm);
    };

    return (
        <DashboardLayout>
            <div className="flex-1 flex flex-col overflow-hidden">
                <DashboardHeader
                    title="Help & Support"
                    subtitle="Search our knowledge base or contact support"
                    showSearch={true}
                    searchPlaceholder="Search help articles..."
                />

                <div className="flex-1 overflow-auto p-4 md:p-8">
                    <div className="max-w-4xl mx-auto space-y-8">

                        {/* Contact Options */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center hover:shadow-md transition-shadow cursor-pointer">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <MessageSquare size={24} />
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-1">Live Chat</h3>
                                <p className="text-sm text-gray-500">Chat with our support team</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center hover:shadow-md transition-shadow cursor-pointer">
                                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Mail size={24} />
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-1">Email Support</h3>
                                <p className="text-sm text-gray-500">Get a response within 24h</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center hover:shadow-md transition-shadow cursor-pointer">
                                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Phone size={24} />
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-1">Phone Support</h3>
                                <p className="text-sm text-gray-500">Mon-Fri from 8am to 5pm</p>
                            </div>
                        </div>

                        {/* FAQs */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900">Frequently Asked Questions</h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {[
                                    { q: "How do I schedule an appointment?", a: "You can schedule an appointment by navigating to the 'Appointments' tab and clicking 'Book New'." },
                                    { q: "Where can I find my medical records?", a: "Your medical records are available under the 'Documents' or 'Medical Records' section of your dashboard." },
                                    { q: "How do I update my profile?", a: "Go to Settings > Profile to update your personal information and preferences." }
                                ].map((faq, idx) => (
                                    <div key={idx} className="p-6">
                                        <h4 className="flex items-center justify-between font-medium text-gray-900 mb-2">
                                            {faq.q}
                                            <ChevronDown size={16} className="text-gray-400" />
                                        </h4>
                                        <p className="text-gray-600 text-sm">{faq.a}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900">Send us a message</h3>
                                <p className="text-sm text-gray-500">We'll get back to you via email</p>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 transition-shadow"
                                        placeholder="Brief summary of your issue"
                                        value={ticketForm.subject}
                                        onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        required
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 transition-shadow"
                                        placeholder="Detailed description of your problem..."
                                        value={ticketForm.description}
                                        onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={ticketMutation.isPending}
                                        className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 font-medium"
                                    >
                                        <Send size={18} />
                                        {ticketMutation.isPending ? 'Sending...' : 'Send Message'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
