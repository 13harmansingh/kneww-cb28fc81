import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Article from "./pages/Article";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Bookmarks from "./pages/Bookmarks";
import Compare from "./pages/Compare";
import ProfileSettings from "./pages/ProfileSettings";
import Explore from "./pages/Explore";
import Discover from "./pages/Discover";
import Telemetry from "./pages/Telemetry";
import AdminUsers from "./pages/AdminUsers";
import ControlCenter from "./pages/admin/ControlCenter";
import Events from "./pages/admin/Events";
import Banned from "./pages/Banned";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { GlobalAPIStatus } from "./components/GlobalAPIStatus";
import { OfflineBanner } from "./components/OfflineBanner";
import { SafeModeWrapper } from "./components/system/SafeModeWrapper";
import { MaintenanceScreen } from "./components/system/MaintenanceScreen";
import { GlobalBanner } from "./components/system/GlobalBanner";
import { RateLimitWidget } from "./components/system/RateLimitWidget";
import { RecoveryFlyout } from "./components/system/RecoveryFlyout";
import { useSystemEvents } from "./hooks/system/useSystemEvents";

const queryClient = new QueryClient();

const App = () => {
  // Initialize system events listener
  useSystemEvents();
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <GlobalAPIStatus />
        <OfflineBanner />
        
        {/* System Widgets */}
        <RateLimitWidget />
        <RecoveryFlyout />
        
        {/* Wrap everything with maintenance and safe mode */}
        <MaintenanceScreen>
          <SafeModeWrapper>
            <GlobalBanner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/article/:id" element={<Article />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/bookmarks" element={<Bookmarks />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/profile" element={<ProfileSettings />} />
              <Route path="/settings" element={<ProfileSettings />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/banned" element={<Banned />} />
              
              {/* Admin Routes */}
              <Route
                path="/admin/telemetry"
                element={
                  <ProtectedRoute requireAdmin>
                    <Telemetry />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/control-center"
                element={
                  <ProtectedRoute requireAdmin>
                    <ControlCenter />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/events"
                element={
                  <ProtectedRoute requireAdmin>
                    <Events />
                  </ProtectedRoute>
                }
              />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SafeModeWrapper>
        </MaintenanceScreen>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
