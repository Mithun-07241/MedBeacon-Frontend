import { useAuthContext } from "../context/AuthContext";

export function useAuth() {
    return useAuthContext();
}

/*
// OLD IMPLEMENTATION
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";

export function useAuth_OLD() {
    const [user, setUser] = useState(null);
    const [isLoading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const data = await apiRequest("GET", "/api/auth/user");
                setUser(data.user);
            } catch (err) {
                // Ignore error if not logged in
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    return {
        user,
        isLoading,
        isAuthenticated: !!user,
    };
}
*/
