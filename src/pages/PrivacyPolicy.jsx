import { useLocation } from "wouter";
import { Shield, Lock, Eye, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";

export default function PrivacyPolicy() {
    const [, navigate] = useLocation();
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    const [referrer, setReferrer] = useState("/");
    const contentRef = useRef(null);

    // Get referrer from URL params or default to "/"
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const from = params.get("from") || "/";
        setReferrer(from);
    }, []);

    // Track scroll position
    useEffect(() => {
        const handleScroll = () => {
            if (!contentRef.current) return;

            const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
            const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold

            if (scrolledToBottom && !hasScrolledToBottom) {
                setHasScrolledToBottom(true);
            }
        };

        const contentElement = contentRef.current;
        if (contentElement) {
            contentElement.addEventListener("scroll", handleScroll);
            // Check initial state
            handleScroll();
        }

        return () => {
            if (contentElement) {
                contentElement.removeEventListener("scroll", handleScroll);
            }
        };
    }, [hasScrolledToBottom]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-black opacity-5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-black opacity-5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-black opacity-3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="w-full max-w-4xl relative z-10 animate-fadeIn">
                {/* Header */}
                <div className="text-center mb-6 animate-slideDown">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-2xl mb-4 shadow-2xl p-3">
                        <img src="/icon-logo.png" alt="MedBeacon" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Privacy Policy</h1>
                    <p className="text-sm text-gray-600 dark:text-slate-400">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    {!hasScrolledToBottom && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 animate-pulse">
                            Please scroll through the entire document to continue
                        </p>
                    )}
                </div>

                {/* Content Card */}
                <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden animate-slideUp mb-6">
                    <CardContent ref={contentRef} className="p-6 md:p-8 max-h-[60vh] overflow-y-auto space-y-6">
                        {/* Introduction */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Introduction</h2>
                            <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
                                MedBeacon ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our healthcare management platform.
                            </p>
                        </section>

                        {/* Information We Collect */}
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <Eye className="w-5 h-5 text-gray-900 dark:text-white" />
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Information We Collect</h2>
                            </div>

                            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 mt-4">Personal Information</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-slate-300 ml-4">
                                <li>Name, email address, and phone number</li>
                                <li>Date of birth and gender</li>
                                <li>Address and location information</li>
                                <li>Profile pictures and identification documents</li>
                            </ul>

                            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 mt-4">Health Information</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-slate-300 ml-4">
                                <li>Medical history and health records</li>
                                <li>Treatment files and prescriptions</li>
                                <li>Health metrics (blood pressure, heart rate, etc.)</li>
                                <li>Allergies and medications</li>
                            </ul>
                        </section>

                        {/* How We Use Your Information */}
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <FileText className="w-5 h-5 text-gray-900 dark:text-white" />
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">How We Use Your Information</h2>
                            </div>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-slate-300 ml-4">
                                <li>Provide and maintain our healthcare services</li>
                                <li>Facilitate communication between patients and healthcare providers</li>
                                <li>Process appointments and manage health records</li>
                                <li>Send important notifications and updates</li>
                                <li>Improve our platform and user experience</li>
                                <li>Comply with legal and regulatory requirements</li>
                            </ul>
                        </section>

                        {/* Data Security */}
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <Lock className="w-5 h-5 text-gray-900 dark:text-white" />
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Data Security</h2>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed mb-3">
                                We implement industry-standard security measures to protect your personal and health information:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-slate-300 ml-4">
                                <li>End-to-end encryption for sensitive data</li>
                                <li>Secure cloud storage with regular backups</li>
                                <li>HIPAA-compliant data handling practices</li>
                                <li>Regular security audits and updates</li>
                                <li>Access controls and authentication measures</li>
                            </ul>
                        </section>

                        {/* Your Rights */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Your Rights</h2>
                            <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed mb-2">You have the right to:</p>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-slate-300 ml-4">
                                <li>Access and review your personal information</li>
                                <li>Request corrections to inaccurate data</li>
                                <li>Request deletion of your account and data</li>
                                <li>Export your health records and data</li>
                                <li>Opt-out of non-essential communications</li>
                            </ul>
                        </section>

                        {/* Contact Us */}
                        <section className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Contact Us</h2>
                            <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed mb-3">
                                If you have any questions about this Privacy Policy, please contact us:
                            </p>
                            <div className="space-y-1 text-sm text-gray-700 dark:text-slate-300">
                                <p><strong>Email:</strong> privacy@medbeacon.com</p>
                                <p><strong>Address:</strong> MedBeacon Healthcare Systems</p>
                            </div>
                        </section>
                    </CardContent>
                </Card>

                {/* Back Button */}
                <div className="text-center">
                    <Button
                        onClick={() => navigate(referrer)}
                        disabled={!hasScrolledToBottom}
                        className={`rounded-xl font-medium transition-all duration-300 shadow-lg px-6 ${hasScrolledToBottom
                                ? "bg-black hover:bg-gray-800 text-white hover:shadow-xl"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50"
                            }`}
                    >
                        {hasScrolledToBottom ? "Back to Home" : "Scroll to Continue"}
                    </Button>
                </div>

                {/* Footer */}
                <div className="mt-4 text-center text-xs text-gray-500 dark:text-slate-400">
                    <p>© {new Date().getFullYear()} MedBeacon. All rights reserved.</p>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn { animation: fadeIn 0.6s ease-out; }
                .animate-slideDown { animation: slideDown 0.6s ease-out; }
                .animate-slideUp { animation: slideUp 0.6s ease-out 0.2s both; }
            `}</style>
        </div>
    );
}
