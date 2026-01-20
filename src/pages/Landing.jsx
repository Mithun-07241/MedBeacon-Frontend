import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation, Redirect } from "wouter";
import { ArrowRight, Shield, Activity, Users } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";

export default function Landing() {
    const [, setLocation] = useLocation();
    const { user, isAuthenticated, isLoading } = useAuthContext();

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                <div className="text-center">
                    <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse p-3">
                        <img src="/icon-logo.png" alt="MedBeacon" className="w-full h-full object-contain" />
                    </div>
                    <p className="text-gray-600 dark:text-slate-400">Loading MedBeacon...</p>
                </div>
            </div>
        );
    }

    // Auto-redirect authenticated users to their dashboard
    if (isAuthenticated && user) {
        const dashboardPath = user.role === 'doctor'
            ? '/doctor-dashboard'
            : '/patient-dashboard';
        console.log(`🔄 Auto-redirecting authenticated user to ${dashboardPath}`);
        return <Redirect to={dashboardPath} />;
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-black opacity-5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-black opacity-5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-black opacity-3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="w-full max-w-2xl relative z-10 animate-fadeIn">
                {/* Hero Content */}
                <div className="text-center mb-6 animate-slideDown">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-3xl mb-4 shadow-2xl transform hover:scale-110 hover:rotate-3 transition-all duration-500 p-4">
                        <img src="/icon-logo.png" alt="MedBeacon" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
                        MedBeacon
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-slate-400 mb-3">Healthcare Management System</p>
                    <p className="text-sm text-gray-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                        Your intelligent healthcare companion for better health monitoring and seamless communication with medical professionals.
                    </p>
                </div>

                {/* Main Card */}
                <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden animate-slideUp mb-6">
                    <CardContent className="p-6">
                        {/* Features Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="text-center p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all duration-300 transform hover:scale-105">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-black rounded-xl mb-3">
                                    <Shield className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Secure</h3>
                                <p className="text-xs text-gray-600 dark:text-slate-400">End-to-end encrypted</p>
                            </div>

                            <div className="text-center p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all duration-300 transform hover:scale-105" style={{ animationDelay: '0.1s' }}>
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-black rounded-xl mb-3">
                                    <Activity className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Real-time</h3>
                                <p className="text-xs text-gray-600 dark:text-slate-400">Live health monitoring</p>
                            </div>

                            <div className="text-center p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all duration-300 transform hover:scale-105" style={{ animationDelay: '0.2s' }}>
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-black rounded-xl mb-3">
                                    <Users className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Connected</h3>
                                <p className="text-xs text-gray-600 dark:text-slate-400">Direct doctor access</p>
                            </div>
                        </div>

                        {/* CTA Button */}
                        <Button
                            onClick={() => setLocation("/login")}
                            className="w-full h-14 bg-black hover:bg-gray-800 text-white rounded-xl font-medium text-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl group"
                        >
                            <span className="flex items-center justify-center gap-3">
                                <span>Get Started</span>
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </Button>

                        <div className="mt-4 text-center">
                            <p className="text-sm text-gray-600 dark:text-slate-400">
                                Already have an account?{" "}
                                <button
                                    onClick={() => setLocation("/login")}
                                    className="font-medium text-black hover:underline transition-all"
                                >
                                    Sign in
                                </button>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Trust Indicators */}
                <div className="flex flex-wrap justify-center items-center gap-4 text-xs text-gray-500 animate-fadeIn" style={{ animationDelay: '0.6s' }}>
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        <span>HIPAA Compliant</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        <span>24/7 Monitoring</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>Trusted by early medical users</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 text-center text-xs text-gray-500 dark:text-slate-400 animate-fadeIn space-y-3" style={{ animationDelay: '0.8s' }}>
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => setLocation("/privacy-policy?from=/")}
                            className="hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            Privacy Policy
                        </button>
                        <span>•</span>
                        <button
                            onClick={() => setLocation("/terms-and-conditions?from=/")}
                            className="hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            Terms & Conditions
                        </button>
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="text-xs">© {new Date().getFullYear()} MedBeacon. All rights reserved.</p>
                        <div className="flex flex-col items-center">
                            <p className="text-xs mb-1">Developed by</p>
                            <img src="/developer-watermark.png" alt="Developer" className="h-12 opacity-60 hover:opacity-100 transition-opacity mix-blend-multiply dark:mix-blend-screen" />
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }

        .animate-slideDown {
          animation: slideDown 0.8s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.8s ease-out 0.3s both;
        }
      `}</style>
        </div>
    );
}
