import { QueryClient } from "@tanstack/react-query";
import { getItem } from "@/utils/storage";

async function throwIfResNotOk(res) {
    if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
    }
}

// Hosted Backend URL
const BASE_URL = "https://my-backend-ii5m.onrender.com";

export async function apiRequest(method, url, data) {
    const token = await getItem("token"); // ✅ JWT token from storage
    const isFormData = data instanceof FormData;

    // Normalize URL for Tauri/Sidecar
    const fullUrl = url.startsWith("http") ? url : `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;

    const res = await fetch(fullUrl, {
        method,
        headers: {
            ...(isFormData ? {} : { "Content-Type": "application/json" }), // ✅ don't override FormData
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: data
            ? isFormData
                ? data // ✅ send FormData directly
                : JSON.stringify(data)
            : undefined,
        credentials: "include", // in case cookies are also used
    });

    await throwIfResNotOk(res);

    // ✅ Safely handle no-content responses (204)
    if (res.status === 204) {
        return {};
    }

    // Try to parse JSON, fallback to text if not JSON
    try {
        return await res.json();
    } catch {
        return await res.text();
    }
}

export const getQueryFn =
    ({ on401: unauthorizedBehavior }) =>
        async ({ queryKey }) => {
            const token = await getItem("token");

            const path = queryKey.join("/");
            const fullUrl = path.startsWith("http") ? path : `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;

            const res = await fetch(fullUrl, {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                credentials: "include",
            });

            if (unauthorizedBehavior === "returnNull" && res.status === 401) {
                return null;
            }

            await throwIfResNotOk(res);

            if (res.status === 204) {
                return {};
            }

            return await res.json();
        };

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            queryFn: getQueryFn({ on401: "throw" }),
            refetchInterval: false,
            refetchOnWindowFocus: false,
            staleTime: Infinity,
            retry: false,
        },
        mutations: {
            retry: false,
        },
    },
});
