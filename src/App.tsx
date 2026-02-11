import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { useTheme } from "next-themes";
import { getAppearanceSettings } from "@/lib/api";
import { applyBrandPalette, resolveBrandPalette } from "@/lib/appearance";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Appointments from "./pages/Appointments";
import Inventory from "./pages/Inventory";
import Services from "./pages/Services";
import Financial from "./pages/Financial";
import Pets from "./pages/Pets";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import SuperAdmin from "./pages/SuperAdmin";
import Invite from "./pages/Invite";
import NotFound from "./pages/NotFound";
import Logs from "./pages/Logs";
import MedicalRecords from "./pages/MedicalRecords";
import Reminders from "./pages/Reminders";
import CashRegister from "./pages/CashRegister";

const queryClient = new QueryClient();

const AppearanceSync = () => {
  const { setTheme } = useTheme();
  const hasToken = typeof window !== "undefined" && !!localStorage.getItem("petpro_token");
  const { data: appearance } = useQuery({
    queryKey: ["appearance-settings"],
    queryFn: getAppearanceSettings,
    enabled: hasToken,
    retry: false,
  });

  useEffect(() => {
    if (!appearance) return;
    setTheme(appearance.theme ?? "light");
    applyBrandPalette(resolveBrandPalette(appearance.primary_color));
  }, [appearance, setTheme]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem storageKey="petpro-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppearanceSync />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth" element={<Navigate to="/login" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/services" element={<Services />} />
            <Route path="/financial" element={<Financial />} />
            <Route path="/pets" element={<Pets />} />
            <Route path="/medical-records" element={<MedicalRecords />} />
            <Route path="/reminders" element={<Reminders />} />
            <Route path="/cash-register" element={<CashRegister />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/invite" element={<Invite />} />
            <Route path="/super-admin" element={<SuperAdmin />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
