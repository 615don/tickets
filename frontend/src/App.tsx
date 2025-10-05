import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";
import OpenTicketsPage from "./pages/OpenTicketsPage";
import TicketDetailPage from "./pages/TicketDetailPage";
import CreateTicketPage from "./pages/CreateTicketPage";
import ClientsPage from "./pages/ClientsPage";
import ContactsPage from "./pages/ContactsPage";
import { InvoiceReview } from "./components/InvoiceReview";
import { InvoicePreview } from "./pages/InvoicePreview";
import { Settings } from "./components/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public route - Login */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes - All require authentication */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-background">
                  <Navbar />
                  <main className="pt-16">
                    <Index />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tickets"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-background">
                  <Navbar />
                  <main className="pt-16">
                    <OpenTicketsPage />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tickets/create"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-background">
                  <Navbar />
                  <main className="pt-16">
                    <CreateTicketPage />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tickets/:id"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-background">
                  <Navbar />
                  <main className="pt-16">
                    <TicketDetailPage />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-background">
                  <Navbar />
                  <main className="pt-16">
                    <ClientsPage />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/contacts"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-background">
                  <Navbar />
                  <main className="pt-16">
                    <ContactsPage />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoices"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-background">
                  <Navbar />
                  <main className="pt-16">
                    <InvoiceReview />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoices/preview"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-background">
                  <Navbar />
                  <main className="pt-16">
                    <InvoicePreview />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-background">
                  <Navbar />
                  <main className="pt-16">
                    <Settings />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
