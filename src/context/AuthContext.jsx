import { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { getItem, setItem, removeItem, getItemSync } from "@/utils/storage";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
    // const queryClient = useQueryClient();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(getItemSync("token"));

    // Check token on mount/token change
    useEffect(() => {
        const fetchUser = async () => {
            // For Tauri, load token asynchronously
            let currentToken = token;
            if (!currentToken && window.__TAURI_INTERNALS__) {
                currentToken = await getItem("token");
                if (currentToken) {
                    setToken(currentToken);
                }
            }

            if (!currentToken) {
                console.log("AuthContext: No token found in state");
                setUser(null);
                setLoading(false);
                return;
            }

            try {
                console.log("AuthContext: Fetching user with token...");
                const data = await apiRequest("GET", "/api/me");
                console.log("AuthContext: User fetched successfully", data.user);
                setUser(data.user);
            } catch (error) {
                console.error("Auth Fetch Error:", error);

                // If 401, clear token
                if (error.message.includes("401")) {
                    await removeItem("token");
                    setToken(null);
                    setUser(null);
                } else {
                    setUser(null);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [token]);

    const login = async (email, password) => {
        const data = await apiRequest("POST", "/api/login", { email, password });

        await setItem("token", data.token);
        setToken(data.token);
        setUser(data.user);
        return data.user;
    };

    const register = async (userData) => {
        const data = await apiRequest("POST", "/api/signup", userData);

        // OTP Flow: Registration successful, but no token yet.
        // Do NOT set token or user here. 
        // Component will redirect to verify page.

        return data.user;
    };

    const logout = async () => {
        await removeItem("token");
        setToken(null);
        setUser(null);
        // queryClient.clear();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading: loading,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext() {
    const context = useContext(AuthContext);
    if (!context)
        throw new Error("useAuthContext must be used within AuthProvider");
    return context;
}

// ==========================================
// OLD IMPLEMENTATION - COMMENTED OUT
// ==========================================
/*
export function AuthProvider_OLD({ children }) {
    const queryClient = useQueryClient();

    const [authToken, setAuthToken] = useState(
        typeof window !== "undefined" ? localStorage.getItem("token") : null
    );

    const { data: user, isPending: queryLoading, isError, error } = useQuery({
        queryKey: ["/api/me", authToken],
        queryFn: async () => {
            if (!authToken) return null;

            const res = await fetch("/api/me", {
                headers: {
                    Authorization: `Bearer ${authToken}`.trim(),
                    "Cache-Control": "no-cache",
                    "Pragma": "no-cache"
                },
            });

            if (!res.ok) {
                if (res.status === 401) {
                    // localStorage.removeItem("token"); // Optional: auto-logout
                    return null;
                }
                throw new Error("Failed to fetch user");
            }

            const data = await res.json();
            return data.user;
        },
        enabled: !!authToken,
        retry: false,
    });

    // Robust loading state: 
    // If we have a token, we are loading until query finishes (user is resolved) or error.
    const isLoading = !!authToken && queryLoading;

    if (isError) {
        console.error("Auth Query Error:", error);
    }

    const login = async (email, password) => {
        const res = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        if (!res.ok) throw new Error("Invalid credentials");

        const data = await res.json();
        localStorage.setItem("token", data.token);
        setAuthToken(data.token);

        // Fetch current user
        const meRes = await fetch("/api/me", {
            headers: { Authorization: `Bearer ${data.token}` },
        });

        if (!meRes.ok) throw new Error("Failed to fetch user after login");

        const meData = await meRes.json();
        const loggedInUser = meData.user;

        queryClient.setQueryData(["/api/me", data.token], loggedInUser);

        return loggedInUser;
    };

    const logout = () => {
        localStorage.removeItem("token");
        setAuthToken(null);
        queryClient.clear();
    };

    return (
        <AuthContext.Provider
            value={{
                user: user || null,
                isAuthenticated: !!user,
                isLoading,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
*/
