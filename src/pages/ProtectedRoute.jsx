import { Redirect } from "wouter";
import { useAuthContext } from "@/context/AuthContext";

export function ProtectedRoute({ requiredRole, children }) {
    const { user, isAuthenticated, isLoading } = useAuthContext();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-medical-gradient">
                <p className="text-gray-600">Checking authentication...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        console.log("Redirecting to login: Not authenticated");
        return <Redirect to="/login" />;
    }

    // Role check
    if (requiredRole && user?.role !== requiredRole) {
        console.log(`Redirecting to /: Role mismatch. Required: ${requiredRole}, Got: ${user?.role}`);
        return <Redirect to="/" />;
    }

    // Optional: Profile completion check
    // if (!user?.profileCompleted && user?.role !== 'admin') { // Example logic
    //      return <Redirect to="/profile-setup" />;
    // }

    return <>{children}</>;
}
