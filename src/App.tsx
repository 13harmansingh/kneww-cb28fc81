import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Article from "./pages/Article";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Bookmarks from "./pages/Bookmarks";
import Compare from "./pages/Compare";
import Profile from "./pages/Profile";
import Explore from "./pages/Explore";
import Telemetry from "./pages/Telemetry";
import AdminUsers from "./pages/AdminUsers";
import Settings from "./pages/Settings";
import Banned from "./pages/Banned";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/article/:id" element={<Article />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/banned" element={<Banned />} />
          <Route path="/admin/telemetry" element={<Telemetry />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
