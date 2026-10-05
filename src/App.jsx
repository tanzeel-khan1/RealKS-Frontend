import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useOutletContext } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { wakeBackend } from '@/api/apiClient';

import AppLayout from './components/layout/AppLayout';
import PersonalLayout from './components/personal/PersonalLayout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Properties from './pages/Properties';
import Expenses from './pages/Expenses';
import Invoices from './pages/Invoices';
import Documents from './pages/Documents';
import ActivityLog from './pages/ActivityLog';
import Analytics from './pages/Analytics';
import CreateCompany from './pages/CreateCompany';
import Settings from './pages/Settings';
import Ideas from './pages/Ideas';
import Notepad from './pages/Notepad.jsx';
import Employees from './pages/Employees';
import Chat from './pages/Chat';
import PersonalHome from './pages/PersonalHome';
import Login from './pages/Login';
import BusinessPlan from './pages/BusinessPlan';
import Stepper from './pages/Stepper';
import Contracts from './pages/Contracts';
import AIChat from './components/AIChat.jsx';
import Verifyotp from './pages/Verifyotp.jsx';
import Event from './pages/Event.jsx';
import Hpc from './pages/Hpc';
import { useEffect } from 'react';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isAuthenticated, authChecked } = useAuth();

  if (isLoadingAuth || !authChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-[10px] leading-none tracking-wide">RV</span>
            </div>
            <span className="text-[11px] font-semibold text-foreground/70">Ranvola</span>
          </div>
          <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
              <Route path="/verify-otp" element={<Verifyotp />} />

      <Route element={isAuthenticated ? <AppLayout /> : <Navigate to="/login" />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/activity" element={<ActivityLog />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/ideas" element={<Ideas />} />
        <Route path="/notepad" element={<Notepad />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/business-plan" element={<BusinessPlan />} />
        <Route path="/stepper" element={<Stepper />} />
        <Route path="/contracts" element={<Contracts />} />
        <Route path="/AiChat" element={<AIChat />} />
        <Route path="/Event" element={<Event />} />

        <Route path="/companies/new" element={<Navigate to="/personal/companies/new" replace />} />
        <Route path="/hpc" element={<Hpc />} />
      </Route>
      <Route path="/personal" element={isAuthenticated ? <PersonalHome /> : <Navigate to="/login" />} />
      <Route path="/personal/*" element={isAuthenticated ? <PersonalLayout /> : <Navigate to="/login" />}>
        <Route path="companies/new" element={<CreateCompany />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

function App() {
  useEffect(() => {
    wakeBackend();
  }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <SonnerToaster position="bottom-right" />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
