import { useAuthContext } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function VerificationPending() {
    const { user } = useAuthContext();

    const handleLogout = () => {
        window.location.href = '/api/logout';
    };

    const handleCheckStatus = () => {
        window.location.reload();
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-sky-50 to-indigo-50">
            <Card className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl p-8 max-w-md w-full shadow-xl shadow-blue-900/5">
                <CardContent className="pt-6">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <svg className="w-8 h-8 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Verification Pending</h1>
                        <p className="text-gray-600 mb-6">
                            Hello Dr. {user?.username || user?.email}! Your account is currently under review.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                            <div className="flex items-start">
                                <svg className="w-5 h-5 text-warning mt-0.5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                </svg>
                                <div>
                                    <h4 className="text-sm font-semibold text-orange-800 mb-2">Your Profile Status</h4>
                                    <ul className="text-sm text-orange-700 space-y-1">
                                        <li>✓ Basic information submitted</li>
                                        <li>✓ Medical credentials provided</li>
                                        <li>✓ Identity document uploaded</li>
                                        <li className="text-warning font-medium">⏳ Verification in progress</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <div className="flex items-start">
                                <svg className="w-5 h-5 text-primary mt-0.5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                </svg>
                                <div>
                                    <h4 className="text-sm font-semibold text-blue-800 mb-1">What's Next?</h4>
                                    <p className="text-sm text-blue-700">
                                        Our verification team is reviewing your medical credentials and identity documents.
                                        This process typically takes 24-48 hours.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                            <div className="flex items-start">
                                <svg className="w-5 h-5 text-accent mt-0.5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4V8h16v10zm-8-7l4 3-4 3V9z" />
                                </svg>
                                <div>
                                    <h4 className="text-sm font-semibold text-green-800 mb-1">We'll Keep You Updated</h4>
                                    <p className="text-sm text-green-700">
                                        You'll receive an email notification once your verification is complete.
                                        After approval, you'll have full access to the doctor dashboard.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex space-x-3">
                            <Button
                                onClick={handleCheckStatus}
                                className="flex-1 bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary-dark transition-colors"
                            >
                                Check Status
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleLogout}
                                className="flex-1 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                            >
                                Logout
                            </Button>
                        </div>

                        <div className="text-center">
                            <p className="text-xs text-gray-500 mb-2">Need help with verification?</p>
                            <a href="mailto:support@aura.com" className="text-sm text-primary hover:underline">
                                Contact Support
                            </a>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
