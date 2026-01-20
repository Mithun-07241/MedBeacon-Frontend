import React from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuthContext } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { ProtectedRoute } from "@/pages/ProtectedRoute";
import Landing from "@/pages/Landing";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignUp";
import ProfileSetup from "@/pages/ProfileSetup";
import VerificationPending from "@/pages/VerificationPending";
import PatientDashboard from "@/pages/PatientDashboard";
import DoctorDashboard from "@/pages/DoctorDashboard";
import PatientsList from "@/pages/patientList";
import DoctorsList from "@/pages/doctorList";
import DoctorProfile from "@/pages/DoctorProfile";
import NotFound from "@/pages/not-found";
import PatientProfile from "@/pages/PatientProfile";
import ChatPage from "@/pages/ChatPage";
import AiChat from "@/pages/AiChat";
import BookAppointment from "@/pages/BookAppointments";
import AllAppointment from "@/pages/AllAppointments";
import DoctorAppointments from "@/pages/DoctorAppointments";
import DProfile from "@/pages/DProfile";
import PtProfile from "@/pages/PtProfile";
import Test from "@/pages/Test";
import VerifyEmail from "@/pages/VerifyEmail";
import Medications from "@/pages/Medications";
import MedicalRecords from "@/pages/MedicalRecords";
import HealthMetrics from "@/pages/HealthMetrics";
import Reports from "@/pages/Reports";
import Help from "@/pages/Help";
import Settings from "@/pages/Settings";
import ActiveCall from "@/pages/ActiveCall";
import BluetoothDevices from "@/pages/BluetoothDevices";
import TreatmentFile from "@/pages/TreatmentFile";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsAndConditions from "@/pages/TermsAndConditions";
import { CallProvider } from "@/context/CallContext";
import { BluetoothProvider } from "@/context/BluetoothContext";
import CallManager from "@/components/CallManager";

const ProfileRouter = () => {
  const { user } = useAuthContext();
  return user?.role === 'doctor' ? <DProfile /> : <PatientProfile />;
};

function Router() {
  const { user, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-medical-gradient dark:bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 8l-4 4h3c0 3.31-2.69 6-6 6-1.01 0-1.97-.25-2.8-.7l-1.46 1.46C8.97 19.54 10.43 20 12 20c4.42 0 8-3.58 8-8h3l-4-4zM6 12c0-3.31 2.69-6 6-6 1.01 0 1.97.25 2.8.7l1.46-1.46C15.03 4.46 13.57 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4H6z" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-slate-400">Loading MedBeacon...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Landing} />
      <Route path="/test" component={Test} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-and-conditions" component={TermsAndConditions} />

      {/* Protected routes */}
      <Route path="/profile-setup">
        <ProtectedRoute>
          <ProfileSetup />
        </ProtectedRoute>
      </Route>

      <Route path="/verification-pending">
        <ProtectedRoute>
          <VerificationPending />
        </ProtectedRoute>
      </Route>

      <Route path="/profile">
        <ProtectedRoute>
          <ProfileRouter />
        </ProtectedRoute>
      </Route>

      <Route path="/chat/:id" component={ChatPage} />

      <Route path="/patients/:id">
        <ProtectedRoute>
          <PtProfile />
        </ProtectedRoute>
      </Route>

      <Route path="/doctors/:id">
        <ProtectedRoute>
          <DoctorProfile />
        </ProtectedRoute>
      </Route>

      <Route path="/treatment-file/:id">
        <ProtectedRoute>
          <TreatmentFile />
        </ProtectedRoute>
      </Route>

      <Route path="/ai">
        <ProtectedRoute>
          <AiChat />
        </ProtectedRoute>
      </Route>

      <Route path="/messages">
        <ProtectedRoute>
          <ChatPage />
        </ProtectedRoute>
      </Route>

      <Route path="/medications">
        <ProtectedRoute requiredRole="patient">
          <Medications />
        </ProtectedRoute>
      </Route>

      <Route path="/medical-records">
        <ProtectedRoute requiredRole="patient">
          <MedicalRecords />
        </ProtectedRoute>
      </Route>

      <Route path="/health-metrics">
        <ProtectedRoute requiredRole="patient">
          <HealthMetrics />
        </ProtectedRoute>
      </Route>

      <Route path="/reports">
        <ProtectedRoute requiredRole="doctor">
          <Reports />
        </ProtectedRoute>
      </Route>

      <Route path="/help">
        <ProtectedRoute>
          <Help />
        </ProtectedRoute>
      </Route>

      <Route path="/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>

      <Route path="/bluetooth-devices">
        <ProtectedRoute>
          <BluetoothDevices />
        </ProtectedRoute>
      </Route>

      <Route path="/patient-dashboard">
        <ProtectedRoute requiredRole="patient">
          <PatientDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/doctor-dashboard">
        <ProtectedRoute requiredRole="doctor">
          <DoctorDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/doctor/appointments">
        <ProtectedRoute requiredRole="doctor">
          <DoctorAppointments />
        </ProtectedRoute>
      </Route>

      <Route path="/patients-list">
        <ProtectedRoute requiredRole="doctor">
          <PatientsList />
        </ProtectedRoute>
      </Route>

      <Route path="/appointments/book">
        <ProtectedRoute requiredRole="patient">
          <BookAppointment />
        </ProtectedRoute>
      </Route>

      <Route path="/appointments">
        <ProtectedRoute requiredRole="patient">
          <AllAppointment />
        </ProtectedRoute>
      </Route>

      <Route path="/call/:id">
        <ProtectedRoute>
          <ActiveCall />
        </ProtectedRoute>
      </Route>

      <Route path="/doctors-list">
        <ProtectedRoute requiredRole="patient">
          <DoctorsList />
        </ProtectedRoute>
      </Route>

      {/* Catch-all */}
      <Route component={NotFound} />
    </Switch >
  );
}

import { useEffect } from "react";
import { Command } from "@tauri-apps/plugin-shell";
import { resolveResource } from "@tauri-apps/api/path";
import { getPlatform, isTauri, isAndroid, isWeb } from "@/utils/platform";

// ... existing imports
// Note: Keeping existing code structure, just wrapping the sidecar logic

function App() {
  useEffect(() => {
    // Log platform detection for debugging
    const platform = getPlatform();
    console.log('🚀 Platform Detection:', {
      platform,
      isTauri: isTauri(),
      isAndroid: isAndroid(),
      isWeb: isWeb(),
      userAgent: navigator.userAgent
    });

    const initSidecar = async () => {
      // Sidecar disabled: Using hosted backend strictly
      /*
      try {
        const remoteApi = import.meta.env.VITE_API_URL;
        
        if (window.__TAURI_INTERNALS__ && !remoteApi) {
          console.log("Initializing Sidecar (Local Backend)...");
          let envPath;
          try {
            envPath = await resolveResource(".env.enc");
          } catch (e) {
            console.warn("Could not resolve .env.enc resource, trying default behavior", e);
          }

          const args = envPath ? [envPath] : [];
          console.log("Spawning sidecar with args:", args);

          const command = Command.sidecar("binaries/backend", args);
          const child = await command.spawn();
          console.log("Backend spawned with PID:", child.pid);

          command.stdout.on('data', line => console.log(`[Backend]: ${line}`));
          command.stderr.on('data', line => console.error(`[Backend Error]: ${line}`));
        }
      } catch (err) {
        console.error("Failed to spawn sidecar:", err);
      }
      */
    };
    initSidecar();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <BluetoothProvider>
                <CallProvider>
                  <Toaster />
                  <CallManager />
                  <Router />
                </CallProvider>
              </BluetoothProvider>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
