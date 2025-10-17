import { useState, useMemo } from 'react';
import { PageHeader } from './PageHeader';
import { SearchBar } from './SearchBar';
import { ActionButtons } from './ActionButtons';
import { EmptyState } from './EmptyState';
import { ClientForm } from './ClientForm';
import { DeleteClientDialog } from './DeleteClientDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Client, DeleteClientData } from '@/types';
import { Building2, ArrowUpDown, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '@/hooks/useClients';
import { ApiError } from '@/lib/api-client';
import { clientsApi } from '@/lib/api/clients';

export const ClientList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<DeleteClientData | null>(null);
  const { toast } = useToast();

  // Fetch clients from API
  const { data: clients = [], isLoading, error } = useClients();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const filteredClients = useMemo(() => {
    const filtered = clients.filter((client) =>
      client.companyName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filtered.sort((a, b) => {
      const comparison = a.companyName.localeCompare(b.companyName);
      return sortAsc ? comparison : -comparison;
    });

    return filtered;
  }, [clients, searchQuery, sortAsc]);

  const handleAddClient = () => {
    setEditingClient(null);
    setIsFormOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsFormOpen(true);
  };

  const handleDeleteClient = async (client: Client) => {
    try {
      // Fetch actual deletion impact counts from backend
      const impact = await clientsApi.getDeletionImpact(client.id);

      setClientToDelete({
        clientId: client.id,
        companyName: client.companyName,
        contactCount: impact.counts.contacts,
        ticketCount: impact.counts.tickets,
        timeEntryCount: impact.counts.timeEntries,
        hasInvoices: false,
      });
      setDeleteDialogOpen(true);
    } catch (error: unknown) {
      // Handle locked invoices error
      const apiError = error as { data?: { hasLockedInvoices?: boolean }; message?: string };
      if (apiError.data?.hasLockedInvoices) {
        toast({
          title: "Cannot Delete Client",
          description: apiError.message || "This client has locked invoices and cannot be deleted.",
          variant: "destructive",
        });
      } else {
        console.error('Delete client error:', error);
        toast({
          title: "Error",
          description: apiError.message || "Failed to fetch deletion information. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;

    try {
      await deleteClient.mutateAsync(clientToDelete.clientId);
      toast({
        title: 'Client deleted',
        description: `${clientToDelete.companyName} has been removed.`,
      });
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    } catch (error) {
      const apiError = error as ApiError;
      toast({
        title: 'Delete failed',
        description: apiError.message || 'Could not delete client',
        variant: 'destructive',
      });
    }
  };

  const handleFormSubmit = async (data: { companyName: string; xeroCustomerId?: string; maintenanceContractType: string; domains: Array<{ value: string }>; notionUrl?: string }) => {
    // Extract, filter, and deduplicate domains
    const domains = data.domains
      .map((d) => d.value)
      .filter((v: string) => v.trim() !== '');
    const uniqueDomains = Array.from(new Set(domains));

    const clientData = {
      companyName: data.companyName,
      xeroCustomerId: data.xeroCustomerId,
      maintenanceContractType: data.maintenanceContractType,
      domains: uniqueDomains,
      notionUrl: data.notionUrl && data.notionUrl.trim() !== '' ? data.notionUrl : undefined,
    };

    try {
      if (editingClient) {
        await updateClient.mutateAsync({ id: editingClient.id, data: clientData });
        toast({
          title: 'Client updated',
          description: 'Changes have been saved.',
        });
      } else {
        await createClient.mutateAsync(clientData);
        toast({
          title: 'Client created',
          description: `${data.companyName} has been added.`,
        });
      }
      setIsFormOpen(false);
      setEditingClient(null);
    } catch (error) {
      const apiError = error as ApiError;
      toast({
        title: editingClient ? 'Update failed' : 'Create failed',
        description: apiError.message || 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <PageHeader title="Clients" />
        <EmptyState
          icon={Building2}
          message={`Failed to load clients: ${(error as ApiError).message}`}
          actionLabel="Retry"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <PageHeader
        title="Clients"
        count={clients.length}
        primaryAction={{
          label: 'Add Client',
          onClick: handleAddClient,
        }}
      />

      <div className="mb-6">
        <SearchBar
          placeholder="Search by company name..."
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />
        {searchQuery && (
          <p className="text-sm text-muted-foreground mt-2">
            Showing {filteredClients.length} of {clients.length} clients
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredClients.length === 0 && !searchQuery ? (
        <EmptyState
          icon={Building2}
          message="No clients yet. Add your first client to get started."
          actionLabel="Add Client"
          onAction={handleAddClient}
        />
      ) : filteredClients.length === 0 ? (
        <EmptyState
          icon={Building2}
          message="No clients match your search."
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => setSortAsc(!sortAsc)}
                      className="flex items-center gap-1"
                    >
                      Company Name
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Domains</TableHead>
                  <TableHead>Xero ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Docs</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.companyName}</TableCell>
                    <TableCell>
                      {client.domains.length === 0 ? (
                        <span className="text-muted-foreground">No domains</span>
                      ) : client.domains.length <= 2 ? (
                        client.domains.join(', ')
                      ) : (
                        <>
                          {client.domains.slice(0, 2).join(', ')}
                          <Badge variant="secondary" className="ml-2">
                            +{client.domains.length - 2} more
                          </Badge>
                        </>
                      )}
                    </TableCell>
                    <TableCell>
                      {client.xeroCustomerId || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{client.maintenanceContractType}</Badge>
                    </TableCell>
                    <TableCell>
                      {client.notionUrl && (
                        <a
                          href={client.notionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-muted-foreground hover:text-blue-600 transition-colors"
                          title="View Notion Docs"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <ActionButtons
                        onEdit={() => handleEditClient(client)}
                        onDelete={() => handleDeleteClient(client)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredClients.map((client) => (
              <Card key={client.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{client.companyName}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {client.domains.length} {client.domains.length === 1 ? 'domain' : 'domains'}
                    </p>
                  </div>
                  <ActionButtons
                    onEdit={() => handleEditClient(client)}
                    onDelete={() => handleDeleteClient(client)}
                  />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contract:</span>
                    <Badge variant="outline">{client.maintenanceContractType}</Badge>
                  </div>
                  {client.xeroCustomerId && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Xero ID:</span>
                      <span className="font-medium">{client.xeroCustomerId}</span>
                    </div>
                  )}
                  {client.notionUrl && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Docs:</span>
                      <a
                        href={client.notionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
                      >
                        View Notion <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Edit Client' : 'Add Client'}</DialogTitle>
            <DialogDescription>
              {editingClient
                ? 'Update client information and email domains.'
                : 'Add a new client with their company details and email domains.'}
            </DialogDescription>
          </DialogHeader>
          <ClientForm
            client={editingClient || undefined}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <DeleteClientDialog
        isOpen={deleteDialogOpen}
        clientData={clientToDelete}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </div>
  );
};
