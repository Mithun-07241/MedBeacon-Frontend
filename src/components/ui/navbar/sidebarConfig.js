import {
    Home,
    CalendarDays,
    Pill,
    FileText,
    Activity,
    MessageSquare,
    Users,
    Bluetooth,
} from "lucide-react";

// Helper to check if running in Tauri (more reliable)
const isTauri = () => {
    return typeof window !== 'undefined' && window.__TAURI_INTERNALS__ !== undefined;
};

// Base menu items
const basePatientMenu = [
    { label: "Overview", icon: Home, path: "/patient-dashboard" },
    { label: "My Appointments", icon: CalendarDays, path: "/appointments" },
    { label: "Medications", icon: Pill, path: "/medications" },
    { label: "Medical Records", icon: FileText, path: "/medical-records" },
    { label: "Health Metrics", icon: Activity, path: "/health-metrics" },
];

// Platform-specific menu items (only for Android/Desktop)
const tauriOnlyPatientMenu = [
    { label: "Bluetooth Devices", icon: Bluetooth, path: "/bluetooth-devices" },
];

// Common menu items
const commonPatientMenu = [
    { label: "Messages", icon: MessageSquare, path: "/messages" },
    { label: "Doctors", icon: Users, path: "/doctors-list" },
];

export const sidebarConfig = {
    patient: [
        ...basePatientMenu,
        ...(isTauri() ? tauriOnlyPatientMenu : []),
        ...commonPatientMenu,
    ],

    doctor: [
        { label: "Dashboard", icon: Home, path: "/doctor-dashboard" },
        { label: "Appointments", icon: CalendarDays, path: "/doctor/appointments" },
        { label: "Patients", icon: Users, path: "/patients-list" },
        { label: "Reports", icon: FileText, path: "/reports" },
        { label: "Messages", icon: MessageSquare, path: "/messages" },
    ],
};
