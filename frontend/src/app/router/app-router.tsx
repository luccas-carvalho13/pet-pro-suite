import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "@/features/landing/pages/Landing";
import AuthPage from "@/features/auth/pages/Auth";
import DashboardPage from "@/features/dashboard/pages/Dashboard";
import ClientsPage from "@/features/clients/pages/Clients";
import AppointmentsPage from "@/features/appointments/pages/Appointments";
import InventoryPage from "@/features/inventory/pages/Inventory";
import ServicesPage from "@/features/services/pages/Services";
import FinancialPage from "@/features/financial/pages/Financial";
import PetsPage from "@/features/pets/pages/Pets";
import ReportsPage from "@/features/reports/pages/Reports";
import SettingsPage from "@/features/settings/pages/Settings";
import SuperAdminPage from "@/features/super-admin/pages/SuperAdmin";
import NotFound from "@/shared/components/NotFound";

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/financial" element={<FinancialPage />} />
        <Route path="/pets" element={<PetsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/super-admin" element={<SuperAdminPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

