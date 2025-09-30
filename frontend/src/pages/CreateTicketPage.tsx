import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateTicketForm } from '@/components/CreateTicketForm';
import { Client, Contact, CreateTicketForm as FormData } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

// Mock data (same as Index.tsx)
const mockClients: Client[] = [
  { id: 1, companyName: 'Acme Corp', xeroCustomerId: 'CUST-001', maintenanceContractType: 'Monthly Retainer', domains: ['acme.com'], contactCount: 2, createdAt: '2025-01-15T10:00:00Z' },
  { id: 2, companyName: 'TechStart Inc', xeroCustomerId: null, maintenanceContractType: 'Hourly', domains: ['techstart.com'], contactCount: 2, createdAt: '2025-02-01T14:30:00Z' },
  { id: 3, companyName: 'Global Solutions', xeroCustomerId: 'CUST-003', maintenanceContractType: 'Project-Based', domains: ['global.com'], contactCount: 1, createdAt: '2025-01-20T09:15:00Z' },
  { id: 4, companyName: 'DataFlow Systems', xeroCustomerId: null, maintenanceContractType: 'Hourly', domains: ['dataflow.com'], contactCount: 1, createdAt: '2025-02-10T11:00:00Z' },
  { id: 5, companyName: 'CloudWorks Ltd', xeroCustomerId: 'CUST-005', maintenanceContractType: 'Monthly Retainer', domains: ['cloudworks.com'], contactCount: 1, createdAt: '2025-02-15T08:30:00Z' }
];

const mockContacts: Contact[] = [
  { id: 1, name: 'John Smith', email: 'john@acme.com', clientId: 1, clientName: 'Acme Corp', isSystemContact: false, createdAt: '2025-01-15T10:30:00Z' },
  { id: 2, name: 'Sarah Johnson', email: 'sarah@acme.com', clientId: 1, clientName: 'Acme Corp', isSystemContact: false, createdAt: '2025-01-16T11:00:00Z' },
  { id: 3, name: 'Mike Chen', email: 'mike@techstart.com', clientId: 2, clientName: 'TechStart Inc', isSystemContact: false, createdAt: '2025-02-01T15:00:00Z' },
  { id: 4, name: 'Emily Davis', email: 'emily@techstart.com', clientId: 2, clientName: 'TechStart Inc', isSystemContact: false, createdAt: '2025-02-02T09:30:00Z' },
  { id: 5, name: 'Robert Wilson', email: 'robert@global.com', clientId: 3, clientName: 'Global Solutions', isSystemContact: false, createdAt: '2025-01-20T10:00:00Z' },
  { id: 6, name: 'Lisa Anderson', email: 'lisa@dataflow.com', clientId: 4, clientName: 'DataFlow Systems', isSystemContact: false, createdAt: '2025-02-10T11:30:00Z' },
  { id: 7, name: 'David Brown', email: 'david@cloudworks.com', clientId: 5, clientName: 'CloudWorks Ltd', isSystemContact: false, createdAt: '2025-02-15T09:00:00Z' }
];

const CreateTicketPage = () => {
  const navigate = useNavigate();

  const handleCreateTicket = async (data: FormData) => {
    console.log('Creating ticket:', data);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    // In real implementation, navigate to newly created ticket
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Create New Ticket</h1>
          <p className="text-muted-foreground mt-2">Fill in the details to create a new support ticket</p>
        </div>

        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <CreateTicketForm
            clients={mockClients}
            contacts={mockContacts}
            onSubmit={handleCreateTicket}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateTicketPage;
