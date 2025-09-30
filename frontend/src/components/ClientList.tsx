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
import { Building2, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Mock data
const mockClients: Client[] = [
  {
    id: 1,
    companyName: 'Acme Corp',
    xeroCustomerId: 'CUST-001',
    maintenanceContractType: 'Monthly Retainer',
    domains: ['acme.com', 'acmecorp.com'],
    contactCount: 5,
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    id: 2,
    companyName: 'Tech Solutions Inc',
    xeroCustomerId: null,
    maintenanceContractType: 'Hourly',
    domains: ['techsolutions.com'],
    contactCount: 3,
    createdAt: '2025-02-01T14:30:00Z',
  },
  {
    id: 3,
    companyName: 'Global Dynamics',
    xeroCustomerId: 'CUST-003',
    maintenanceContractType: 'Project-Based',
    domains: ['globaldynamics.com', 'gdynamics.com', 'gd.com'],
    contactCount: 8,
    createdAt: '2025-01-20T09:15:00Z',
  },
];

export const ClientList = () => {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<DeleteClientData | null>(null);
  const { toast } = useToast();

  const filteredClients = useMemo(() => {
    let filtered = clients.filter((client) =>
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

  const handleDeleteClient = (client: Client) => {
    setClientToDelete({
      clientId: client.id,
      companyName: client.companyName,
      contactCount: client.contactCount,
      ticketCount: Math.floor(Math.random() * 20),
      timeEntryCount: Math.floor(Math.random() * 50),
      hasInvoices: Math.random() > 0.7,
    });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (clientToDelete) {
      setClients(clients.filter((c) => c.id !== clientToDelete.clientId));
      toast({
        title: 'Client deleted',
        description: `${clientToDelete.companyName} has been removed.`,
      });
    }
    setDeleteDialogOpen(false);
    setClientToDelete(null);
  };

  const handleFormSubmit = (data: any) => {
    if (editingClient) {
      setClients(
        clients.map((c) =>
          c.id === editingClient.id
            ? { ...c, ...data, domains: data.domains.map((d: any) => d.value).filter(Boolean) }
            : c
        )
      );
      toast({
        title: 'Client updated',
        description: 'Changes have been saved.',
      });
    } else {
      const newClient: Client = {
        id: Math.max(...clients.map((c) => c.id)) + 1,
        ...data,
        domains: data.domains.map((d: any) => d.value).filter(Boolean),
        contactCount: 0,
        createdAt: new Date().toISOString(),
      };
      setClients([...clients, newClient]);
      toast({
        title: 'Client created',
        description: `${data.companyName} has been added.`,
      });
    }
    setIsFormOpen(false);
  };

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

      {filteredClients.length === 0 && !searchQuery ? (
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
                  <TableHead>Contract Type</TableHead>
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
