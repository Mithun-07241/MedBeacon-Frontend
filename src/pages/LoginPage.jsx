import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthContext } from "@/context/AuthContext";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [, setLocation] = useLocation();
    const { login, logout, user } = useAuthContext();
    const { toast } = useToast(); // Add this line

    useEffect(() => {
        logout();
    }, []);

    const handleLogin = async () => {
        setError("");
        setLoading(true);

        try {
            await login(email, password);
        } catch (err) {
            // Check if error contains the verification message (ignoring headers/status codes)
            if (err.message.includes("Email not verified")) {
                // Initial login failed due to verification.
                // Trigger resend and redirect.
                setError("Email not verified. Resending OTP...");

                // Store email for the verify page
                localStorage.setItem("signupEmail", email);

                try {
                    await apiRequest("POST", "/api/resend-otp", { email });
                    toast({ title: "OTP Resent", description: "Please check your email." });
                    setLocation("/verify-email");
                } catch (resendErr) {
                    // Even if resend fails (e.g. already resent), redirect user to enter OTP
                    console.error("Resend failed", resendErr);
                    setLocation("/verify-email");
                }
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return;

        // 1. Check for OTP verification needed
        if (user.verificationStatus === "pending") {
            // Store email for verify page just in case, though VerifyEmail uses AuthContext too
            if (user.email) localStorage.setItem("signupEmail", user.email);
            setLocation("/verify-email");
            return;
        }

        // 2. Check for Under Review (Doctors after OTP)
        if (user.verificationStatus === "under_review") {
            setLocation("/verification-pending");
            return;
        }

        // 3. Check for Profile Completion
        if (user.profileCompleted === false || user.profileCompleted === "false") {
            setLocation("/profile-setup");
            return;
        }

        // 4. Role based dashboard
        if (user.role === "doctor") {
            setLocation("/doctor-dashboard");
        } else if (user.role === "patient") {
            setLocation("/patient-dashboard");
        } else {
            setLocation("/");
        }
    }, [user, setLocation]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-black opacity-5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-black opacity-5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-black opacity-3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="w-full max-w-md relative z-10 animate-fadeIn">
                {/* Logo and Brand */}
                <div className="text-center mb-6 animate-slideDown">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-black rounded-2xl mb-3 shadow-2xl transform hover:scale-110 transition-transform duration-300 p-3">
                        <img src="/icon-logo.png" alt="MedBeacon" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1 tracking-tight">MedBeacon</h1>
                    <p className="text-sm text-gray-600 dark:text-slate-400">Healthcare Management System</p>
                </div>

                <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden animate-slideUp">
                    <CardContent className="p-6">
                        <div className="mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Welcome back</h2>
                            <p className="text-gray-600 dark:text-slate-400 text-sm">Sign in to your account to continue</p>
                        </div>

                        <div className="space-y-4">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <Label className="text-gray-700 dark:text-slate-300 font-medium">Email Address</Label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-black" />
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                                        placeholder=""
                                        className="pl-11 h-12 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 dark:text-white rounded-xl focus:bg-white dark:focus:bg-slate-700 focus:border-black dark:focus:border-slate-500 transition-all duration-300"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <Label className="text-gray-700 dark:text-slate-300 font-medium">Password</Label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-black" />
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                                        placeholder=""
                                        className="pl-11 pr-11 h-12 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 dark:text-white rounded-xl focus:bg-white dark:focus:bg-slate-700 focus:border-black dark:focus:border-slate-500 transition-all duration-300"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-shake">
                                    {error}
                                </div>
                            )}

                            {/* Forgot Password */}
                            <div className="flex justify-end">
                                <a href="/forgot-password" className="text-sm text-gray-600 hover:text-black transition-colors">
                                    Forgot password?
                                </a>
                            </div>

                            {/* Login Button */}
                            <Button
                                onClick={handleLogin}
                                disabled={loading}
                                className="w-full h-12 bg-black hover:bg-gray-800 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl group"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Signing In...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        <span>Sign In</span>
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                )}
                            </Button>
                        </div>

                        {/* Divider */}
                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white dark:bg-slate-900 text-gray-500 dark:text-slate-400">or</span>
                            </div>
                        </div>

                        {/* Sign Up Link */}
                        <div className="text-center">
                            <p className="text-sm text-gray-600 dark:text-slate-400">
                                Don't have an account?{" "}
                                <a href="/signup" className="font-medium text-black hover:underline transition-all">
                                    Sign up
                                </a>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="mt-4 text-center text-xs text-gray-500 dark:text-slate-400 space-y-3">
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => setLocation("/privacy-policy?from=/login")}
                            className="hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            Privacy Policy
                        </button>
                        <span>•</span>
                        <button
                            onClick={() => setLocation("/terms-and-conditions?from=/login")}
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
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }

        .animate-slideDown {
          animation: slideDown 0.6s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.6s ease-out 0.2s both;
        }

        .animate-shake {
          animation: shake 0.4s ease-out;
        }
      `}</style>
        </div>
    );
}
