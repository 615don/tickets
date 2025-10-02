import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { CreateTicketForm } from '@/components/CreateTicketForm';
import { CreateTicketForm as FormData, CreateTicketRequest } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { useContacts } from '@/hooks/useContacts';
import { useCreateTicket } from '@/hooks/useTickets';
import { toast } from 'sonner';

const CreateTicketPage = () => {
  const navigate = useNavigate();
  const formResetRef = useRef<(() => void) | null>(null);
  const { data: clients = [], isLoading: isLoadingClients } = useClients();
  const { data: contacts = [], isLoading: isLoadingContacts } = useContacts();
  const createTicket = useCreateTicket();

  const handleCreateTicket = async (formData: FormData) => {
    const request: CreateTicketRequest = {
      clientId: formData.clientId,
      contactId: formData.contactId,
      description: formData.description,
      notes: formData.notes,
      timeEntry: {
        workDate: formData.workDate,
        duration: formData.time,
        billable: formData.billable,
      },
    };

    createTicket.mutate(request, {
      onSuccess: (ticket) => {
        toast.success('Ticket created successfully');
        // Navigate to ticket detail page
        navigate(`/tickets/${ticket.id}`);
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to create ticket');
      },
    });
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
          {isLoadingClients || isLoadingContacts ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <CreateTicketForm
              clients={clients}
              contacts={contacts}
              onSubmit={handleCreateTicket}
              isSubmitting={createTicket.isPending}
              formResetRef={formResetRef}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateTicketPage;
