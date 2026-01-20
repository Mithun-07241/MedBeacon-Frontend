import { useLocation } from "wouter";
import { FileText, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";

export default function TermsAndConditions() {
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
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Terms and Conditions</h1>
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
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Agreement to Terms</h2>
                            <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
                                By accessing and using MedBeacon ("Platform," "Service," "we," "us," or "our"), you agree to be bound by these Terms and Conditions. If you disagree with any part of these terms, you may not access the service.
                            </p>
                        </section>

                        {/* User Accounts */}
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <CheckCircle className="w-5 h-5 text-gray-900 dark:text-white" />
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">User Accounts</h2>
                            </div>

                            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 mt-4">Account Creation</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-slate-300 ml-4">
                                <li>You must provide accurate and complete information</li>
                                <li>You must be at least 18 years old to create an account</li>
                                <li>You are responsible for maintaining account security</li>
                                <li>You must not share your account credentials</li>
                            </ul>

                            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 mt-4">Account Responsibilities</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-slate-300 ml-4">
                                <li>Keep your password secure and confidential</li>
                                <li>Notify us immediately of any unauthorized access</li>
                                <li>Update your information to keep it current and accurate</li>
                                <li>You are responsible for all activities under your account</li>
                            </ul>
                        </section>

                        {/* Healthcare Services */}
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <AlertCircle className="w-5 h-5 text-gray-900 dark:text-white" />
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Healthcare Services</h2>
                            </div>

                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-3 mb-3">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                                    <strong>Important:</strong> MedBeacon is a platform that facilitates communication between patients and healthcare providers. We do not provide medical advice, diagnosis, or treatment.
                                </p>
                            </div>

                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-slate-300 ml-4">
                                <li>The Platform connects patients with licensed healthcare providers</li>
                                <li>Healthcare providers are independent professionals</li>
                                <li>We do not guarantee the accuracy of medical advice provided</li>
                                <li>Always seek emergency medical care when needed</li>
                            </ul>
                        </section>

                        {/* Prohibited Activities */}
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <XCircle className="w-5 h-5 text-gray-900 dark:text-white" />
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Prohibited Activities</h2>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed mb-2">You agree not to:</p>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-slate-300 ml-4">
                                <li>Violate any laws or regulations</li>
                                <li>Impersonate another person or entity</li>
                                <li>Share false or misleading information</li>
                                <li>Harass, abuse, or harm other users</li>
                                <li>Attempt to gain unauthorized access to the Platform</li>
                                <li>Upload viruses or malicious code</li>
                            </ul>
                        </section>

                        {/* Privacy and Data Protection */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Privacy and Data Protection</h2>
                            <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed mb-3">
                                Your privacy is important to us. Our collection and use of personal information is described in our{" "}
                                <button
                                    onClick={() => navigate(`/privacy-policy?from=${referrer}`)}
                                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                >
                                    Privacy Policy
                                </button>
                                . By using the Platform, you agree to our privacy practices.
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-slate-300 ml-4">
                                <li>We comply with HIPAA and other healthcare privacy regulations</li>
                                <li>Your health information is encrypted and secure</li>
                                <li>We do not sell your personal information</li>
                            </ul>
                        </section>

                        {/* Disclaimers */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Disclaimers</h2>
                            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-3 mb-3">
                                <p className="text-sm text-red-800 dark:text-red-200">
                                    THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE UNINTERRUPTED OR ERROR-FREE SERVICE.
                                </p>
                            </div>
                        </section>

                        {/* Contact Information */}
                        <section className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Contact Us</h2>
                            <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed mb-3">
                                If you have questions about these Terms and Conditions, please contact us:
                            </p>
                            <div className="space-y-1 text-sm text-gray-700 dark:text-slate-300">
                                <p><strong>Email:</strong> legal@medbeacon.com</p>
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
