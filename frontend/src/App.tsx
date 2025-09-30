import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import TicketDetailPage from "./pages/TicketDetailPage";
import CreateTicketPage from "./pages/CreateTicketPage";
import ClientsPage from "./pages/ClientsPage";
import ContactsPage from "./pages/ContactsPage";
import { InvoiceReview } from "./components/InvoiceReview";
import { Settings } from "./components/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="pt-16">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/tickets/create" element={<CreateTicketPage />} />
              <Route path="/tickets/:id" element={<TicketDetailPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/contacts" element={<ContactsPage />} />
              <Route path="/invoices" element={<InvoiceReview />} />
              <Route path="/settings" element={<Settings />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
