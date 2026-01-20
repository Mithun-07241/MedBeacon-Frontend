import { useEffect } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function ProtectedRoute({ children, requiredRole }) {
    const { user, isAuthenticated, isLoading } = useAuthContext();
    const { toast } = useToast();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            toast({
                title: "Authentication Required",
                description: "Please login to access this page.",
                variant: "destructive",
            });
            setTimeout(() => {
                window.location.href = "/api/login";
            }, 500);
            return;
        }

        if (!isLoading && isAuthenticated && requiredRole) {
            if (user?.role !== requiredRole) {
                toast({
                    title: "Access Denied",
                    description: `This page requires ${requiredRole} access.`,
                    variant: "destructive",
                });
                setTimeout(() => {
                    window.location.href = "/";
                }, 500);
                return;
            }

            // Check verification status
            if (user?.verificationStatus !== 'verified') {
                toast({
                    title: "Verification Required",
                    description: "Your account verification is still pending.",
                    variant: "destructive",
                });
                setTimeout(() => {
                    window.location.href = "/";
                }, 500);
                return;
            }
        }
    }, [isAuthenticated, isLoading, user, requiredRole, toast]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-medical-gradient">
                <div className="text-center">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 8l-4 4h3c0 3.31-2.69 6-6 6-1.01 0-1.97-.25-2.8-.7l-1.46 1.46C8.97 19.54 10.43 20 12 20c4.42 0 8-3.58 8-8h3l-4-4zM6 12c0-3.31 2.69-6 6-6 1.01 0 1.97.25 2.8.7l1.46-1.46C15.03 4.46 13.57 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4H6z" />
                        </svg>
                    </div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return <>{children}</>;
}
