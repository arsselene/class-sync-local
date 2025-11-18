import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import Index from "./pages/Index";
import Classrooms from "./pages/Classrooms";
import Professors from "./pages/Professors";
import Schedule from "./pages/Schedule";
import DoorControl from "./pages/DoorControl";
import Access from "./pages/Access";
import NotFound from "./pages/NotFound";
import { useQRScheduler } from "./hooks/useQRScheduler";

const queryClient = new QueryClient();

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-screen bg-background">
    <Sidebar />
    <main className="flex-1 overflow-y-auto p-8">{children}</main>
  </div>
);

function AppContent() {
  useQRScheduler();
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><Index /></Layout>} />
        <Route path="/classrooms" element={<Layout><Classrooms /></Layout>} />
        <Route path="/professors" element={<Layout><Professors /></Layout>} />
        <Route path="/schedule" element={<Layout><Schedule /></Layout>} />
        <Route path="/door-control" element={<Layout><DoorControl /></Layout>} />
        <Route path="/access" element={<Layout><Access /></Layout>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
