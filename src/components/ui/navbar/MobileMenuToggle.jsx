import React from 'react';
import { Menu } from 'lucide-react';
import { useSidebar } from "@/context/SidebarContext";

export default function MobileMenuToggle({ className = "" }) {
    const { setMobileOpen } = useSidebar();
    return (
        <button
            onClick={() => setMobileOpen(true)}
            className={`p-2 -ml-2 hover:bg-gray-100 rounded-lg md:hidden text-gray-600 ${className}`}
        >
            <Menu size={24} />
        </button>
    );
}
