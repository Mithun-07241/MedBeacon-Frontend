import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useAuthContext } from "@/context/AuthContext";
import { User, Mail, Lock, Eye, EyeOff, UserCircle, Stethoscope, ArrowRight, CheckCircle } from "lucide-react";

export default function SignupPage() {
    const [, setLocation] = useLocation();
    const { register } = useAuthContext();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [role, setRole] = useState("patient");
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState({
        username: "",
        email: "",
        password: ""
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSignup = async () => {
        setLoading(true);
        setError(null);

        try {
            await register({
                username: form.username,
                email: form.email,
                password: form.password,
                role,
                profileCompleted: false,
                verificationStatus: "pending", // ALWAYS pending now
            });

            // Success -> Store email and Redirect to Verify
            localStorage.setItem("signupEmail", form.email);
            setLocation("/verify-email");

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-gray-50 via-gray-100 to-gray-200 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-black opacity-5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-black opacity-5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-black opacity-3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="w-full max-w-md relative z-10 animate-fadeIn">
                {/* Logo and Brand */}
                <div className="text-center mb-8 animate-slideDown">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-2xl mb-4 shadow-2xl transform hover:scale-110 transition-transform duration-300 p-3">
                        <img src="/icon-logo.png" alt="MedBeacon" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">MedBeacon</h1>
                    <p className="text-gray-600">Create your account</p>
                </div>

                {/* Signup Card */}
                <Card className="bg-white/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden animate-slideUp">
                    <CardContent className="p-8">
                        <div className="space-y-5">
                            {/* Username Field */}
                            <div className="space-y-2">
                                <Label className="text-gray-700 font-medium">Full Name</Label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-black" />
                                    <Input
                                        id="username"
                                        name="username"
                                        value={form.username}
                                        onChange={handleChange}
                                        placeholder=""
                                        className="pl-11 h-12 bg-gray-50 border-gray-200 rounded-xl focus:bg-white focus:border-black transition-all duration-300"
                                    />
                                </div>
                            </div>

                            {/* Email Field */}
                            <div className="space-y-2">
                                <Label className="text-gray-700 font-medium">Email Address</Label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-black" />
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder=""
                                        className="pl-11 h-12 bg-gray-50 border-gray-200 rounded-xl focus:bg-white focus:border-black transition-all duration-300"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <Label className="text-gray-700 font-medium">Password</Label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-black" />
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        value={form.password}
                                        onChange={handleChange}
                                        placeholder=""
                                        className="pl-11 pr-11 h-12 bg-gray-50 border-gray-200 rounded-xl focus:bg-white focus:border-black transition-all duration-300"
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

                            {/* Role Selection */}
                            <div className="space-y-3">
                                <Label className="text-gray-700 font-medium">I am a:</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setRole("patient")}
                                        className={`relative flex flex-col items-center p-4 border-2 rounded-xl transition-all duration-300 transform hover:scale-105 ${role === "patient"
                                            ? "border-black bg-gray-900 text-white shadow-lg"
                                            : "border-gray-200 hover:border-gray-300 bg-white"
                                            }`}
                                    >
                                        {role === "patient" && (
                                            <CheckCircle className="absolute top-2 right-2 w-5 h-5 text-white" />
                                        )}
                                        <UserCircle className={`w-8 h-8 mb-2 ${role === "patient" ? "text-white" : "text-gray-600"}`} />
                                        <span className={`text-sm font-medium ${role === "patient" ? "text-white" : "text-gray-700"}`}>
                                            Patient
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setRole("doctor")}
                                        className={`relative flex flex-col items-center p-4 border-2 rounded-xl transition-all duration-300 transform hover:scale-105 ${role === "doctor"
                                            ? "border-black bg-gray-900 text-white shadow-lg"
                                            : "border-gray-200 hover:border-gray-300 bg-white"
                                            }`}
                                    >
                                        {role === "doctor" && (
                                            <CheckCircle className="absolute top-2 right-2 w-5 h-5 text-white" />
                                        )}
                                        <Stethoscope className={`w-8 h-8 mb-2 ${role === "doctor" ? "text-white" : "text-gray-600"}`} />
                                        <span className={`text-sm font-medium ${role === "doctor" ? "text-white" : "text-gray-700"}`}>
                                            Doctor
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-shake">
                                    {error}
                                </div>
                            )}

                            {/* Signup Button */}
                            <Button
                                onClick={handleSignup}
                                disabled={loading}
                                className="w-full h-12 bg-black hover:bg-gray-800 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl group"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Creating Account...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        <span>Create Account</span>
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                )}
                            </Button>
                        </div>

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-500">or</span>
                            </div>
                        </div>

                        {/* Sign In Link */}
                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                Already have an account?{" "}
                                <a href="/login" className="font-medium text-black hover:underline transition-all">
                                    Sign in
                                </a>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="mt-6 text-center text-xs text-gray-500 space-y-3">
                    <p>
                        By signing up, you agree to our{" "}
                        <button
                            onClick={() => setLocation("/terms-and-conditions?from=/signup")}
                            className="text-black hover:underline font-medium"
                        >
                            Terms of Service
                        </button>
                        {" "}and{" "}
                        <button
                            onClick={() => setLocation("/privacy-policy?from=/signup")}
                            className="text-black hover:underline font-medium"
                        >
                            Privacy Policy
                        </button>
                    </p>
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
