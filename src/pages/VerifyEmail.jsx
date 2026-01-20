import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuthContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Mail, ArrowRight, Sparkles } from "lucide-react";

export default function VerifyEmail() {
    const [, setLocation] = useLocation();
    const { login, user } = useAuthContext();
    const { toast } = useToast();
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (user?.email) {
            setEmail(user.email);
            return;
        }

        const storedEmail = localStorage.getItem("signupEmail");
        if (storedEmail) {
            setEmail(storedEmail);
        }
    }, [user, setLocation]);

    const handleOtpChange = (index, value) => {
        // Only allow numbers
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        // Handle backspace
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").slice(0, 6);
        if (!/^\d+$/.test(pastedData)) return;

        const newOtp = [...otp];
        for (let i = 0; i < pastedData.length; i++) {
            newOtp[i] = pastedData[i];
        }
        setOtp(newOtp);

        // Focus the last filled input or the next empty one
        const nextEmptyIndex = newOtp.findIndex(val => !val);
        const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
        const input = document.getElementById(`otp-${focusIndex}`);
        if (input) input.focus();
    };

    const handleVerify = async () => {
        const otpString = otp.join("");
        if (otpString.length !== 6) {
            setError("Please enter a valid 6-digit code");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const data = await apiRequest("POST", "/api/verify-otp", { email, otp: otpString });

            toast({
                title: "Success",
                description: "Email verified successfully!",
            });

            localStorage.removeItem("signupEmail");

            if (data.token) {
                localStorage.setItem("token", data.token);
                window.location.href = "/profile-setup";
            } else {
                setLocation("/login");
            }

        } catch (err) {
            console.error(err);
            setError(err.message || "Invalid OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const maskEmail = (email) => {
        if (!email) return "";
        const [username, domain] = email.split("@");
        const maskedUsername = username.slice(0, 2) + "***" + username.slice(-1);
        return `${maskedUsername}@${domain}`;
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-white">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-black p-12 flex-col justify-between relative overflow-hidden">
                {/* Animated background elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-white opacity-5 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                </div>

                <div className="relative z-10">
                    <img src="/logo-dark.png" alt="MedBeacon Logo" className="h-12 mb-8" />
                    <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
                        Secure Your<br />Healthcare Journey
                    </h1>
                    <p className="text-gray-300 text-lg max-w-md">
                        We've sent a verification code to your email. Enter it to complete your registration and access your personalized healthcare dashboard.
                    </p>
                </div>

                <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-3 text-gray-400 text-sm">
                        <Sparkles className="w-5 h-5" />
                        <span>Trusted by thousands of healthcare professionals</span>
                    </div>
                    {/* Developer Watermark */}
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-700">
                        <img src="/developer-watermark.png" alt="Developer" className="h-8 opacity-60 hover:opacity-100 transition-opacity" />
                    </div>
                </div>
            </div>

            {/* Right Side - OTP Form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden mb-8 text-center">
                        <img src="/logo-light.png" alt="MedBeacon Logo" className="h-10 mx-auto mb-4" />
                    </div>

                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl mb-6 shadow-xl">
                            <Mail className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">Verify Your Email</h2>
                        <p className="text-gray-600">
                            We sent a code to <span className="font-semibold text-gray-900">{maskEmail(email)}</span>
                        </p>
                    </div>

                    {/* OTP Input */}
                    <div className="mb-8">
                        <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                            Enter 6-digit verification code
                        </label>
                        <div className="flex gap-3 justify-center" onPaste={handlePaste}>
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    id={`otp-${index}`}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-14 h-16 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-gray-900 focus:ring-4 focus:ring-gray-100 outline-none transition-all duration-200 bg-white hover:border-gray-400"
                                    autoFocus={index === 0}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg text-sm">
                            <p className="font-medium">{error}</p>
                        </div>
                    )}

                    {/* Verify Button */}
                    <Button
                        onClick={handleVerify}
                        disabled={loading || otp.some(digit => !digit)}
                        className="w-full h-14 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Verifying...</span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2">
                                <span>Verify Account</span>
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        )}
                    </Button>

                    {/* Resend Code */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-600 text-sm">
                            Didn't receive the code?{" "}
                            <button
                                onClick={() => {
                                    toast({
                                        title: "Code Resent",
                                        description: "A new verification code has been sent to your email.",
                                    });
                                }}
                                className="text-gray-900 font-semibold hover:underline"
                            >
                                Resend Code
                            </button>
                        </p>
                    </div>

                    {/* Back to Login */}
                    <div className="mt-8 text-center">
                        <button
                            onClick={() => setLocation("/login")}
                            className="text-gray-600 text-sm hover:text-gray-900 transition-colors"
                        >
                            ← Back to Login
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 0.05; }
                    50% { opacity: 0.1; }
                }
                .animate-pulse {
                    animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </div>
    );
}
