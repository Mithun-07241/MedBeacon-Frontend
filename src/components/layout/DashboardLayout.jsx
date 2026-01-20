import React from 'react';
import Sidebar from "@/components/ui/navbar/sidebar";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { useAuthContext } from '@/context/AuthContext';
import { useWebSocket } from '@/hooks/useWebSocket';

function DashboardLayoutContent({ children }) {
    const { mobileOpen, setMobileOpen } = useSidebar();
    const { user } = useAuthContext();
    useWebSocket(user?.id, user?.role);

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-slate-900 overflow-hidden">
            <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
            <div className="flex-1 flex flex-col overflow-hidden relative w-full">
                {children}
            </div>
        </div>
    );
}

export default function DashboardLayout({ children }) {
    return (
        <SidebarProvider>
            <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </SidebarProvider>
    );
}
