import { Sidebar } from "@/components/Sidebar";
import { EmailContext } from "@/components/EmailContext";
import { TicketForm } from "@/components/TicketForm";
import { SuccessBanner } from "@/components/SuccessBanner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Client, Contact, TicketFormData } from "@/types";
import { useState } from "react";

const Index = () => {
  const [selectedClientId, setSelectedClientId] = useState<number>(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successTicketId, setSuccessTicketId] = useState<number>(0);
  const [error, setError] = useState<string>("");

  // Mock data
  const mockClients: Client[] = [
    { id: 1, name: "Acme Corp" },
    { id: 2, name: "Beta Industries" },
    { id: 3, name: "Gamma Solutions" },
  ];

  const mockContacts: Record<number, Contact[]> = {
    1: [
      { id: 1, name: "John Smith", email: "john.smith@acme.com" },
      { id: 2, name: "Jane Doe", email: "jane.doe@acme.com" },
    ],
    2: [
      { id: 3, name: "Bob Johnson", email: "bob@beta.com" },
    ],
    3: [
      { id: 4, name: "Alice Williams", email: "alice@gamma.com" },
      { id: 5, name: "Charlie Brown", email: "charlie@gamma.com" },
    ],
  };

  const handleClientChange = (clientId: number) => {
    setSelectedClientId(clientId);
  };

  const handleContactLoad = async (clientId: number): Promise<Contact[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockContacts[clientId] || [];
  };

  const handleSubmit = async (data: TicketFormData) => {
    setError("");
    
    try {
      // Simulate API call with random success/failure
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() > 0.2) {
            resolve(true);
          } else {
            reject(new Error("Network error: Failed to create ticket"));
          }
        }, 1000);
      });
      
      // Generate mock ticket ID
      const ticketId = Math.floor(Math.random() * 10000) + 1000;
      setSuccessTicketId(ticketId);
      setShowSuccess(true);
      
      console.log("Ticket data:", data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleRetry = () => {
    setError("");
    // Parent component would trigger form resubmission
  };

  return (
    <Sidebar>
      {showSuccess && (
        <SuccessBanner
          ticketId={successTicketId}
          showLink={true}
          onDismiss={() => setShowSuccess(false)}
        />
      )}
      
      <EmailContext
        senderName="John Smith"
        senderEmail="john.smith@example.com"
        matchStatus="matched"
        clientName="Acme Corp"
        contactName="John Smith"
      />
      
      {error && (
        <ErrorMessage
          variant="banner"
          message={error}
          onRetry={handleRetry}
          onDismiss={() => setError("")}
        />
      )}
      
      <TicketForm
        clients={mockClients}
        selectedClientId={selectedClientId}
        hasMatch={true}
        onClientChange={handleClientChange}
        onContactLoad={handleContactLoad}
        onSubmit={handleSubmit}
      />
    </Sidebar>
  );
};

export default Index;
