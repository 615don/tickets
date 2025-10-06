import { useState, useMemo } from 'react';
import { PageHeader } from './PageHeader';
import { SearchBar } from './SearchBar';
import { ActionButtons } from './ActionButtons';
import { EmptyState } from './EmptyState';
import { ContactForm } from './ContactForm';
import { DeleteContactDialog } from './DeleteContactDialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Contact, Client } from '@/types';
import { Users, ArrowUpDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useContacts, useCreateContact, useUpdateContact, useDeleteContact } from '@/hooks/useContacts';
import { useClients } from '@/hooks/useClients';
import { ApiError } from '@/lib/api-client';

export const ContactList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [sortAsc, setSortAsc] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const { toast } = useToast();

  // Fetch data from API
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { data: contacts = [], isLoading: contactsLoading, error } = useContacts();
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();

  const isLoading = clientsLoading || contactsLoading;

  const filteredContacts = useMemo(() => {
    const filtered = contacts.filter((contact) => {
      const matchesSearch =
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClient =
        clientFilter === 'all' || contact.clientId === parseInt(clientFilter);
      return matchesSearch && matchesClient;
    });

    filtered.sort((a, b) => {
      const comparison = a.name.localeCompare(b.name);
      return sortAsc ? comparison : -comparison;
    });

    return filtered;
  }, [contacts, searchQuery, clientFilter, sortAsc]);

  const handleAddContact = () => {
    setEditingContact(null);
    setIsFormOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setIsFormOpen(true);
  };

  const handleDeleteContact = async (contact: Contact) => {
    setContactToDelete(contact);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!contactToDelete) return;

    try {
      const result = await deleteContact.mutateAsync(contactToDelete.id);
      const ticketsReassigned = result?.ticketsReassigned || 0;
      toast({
        title: 'Contact deleted',
        description: ticketsReassigned > 0
          ? `${contactToDelete.name} has been removed. ${ticketsReassigned} ticket${ticketsReassigned === 1 ? '' : 's'} reassigned to "Deleted Contact".`
          : `${contactToDelete.name} has been removed.`,
      });
      setDeleteDialogOpen(false);
      setContactToDelete(null);
    } catch (error) {
      const apiError = error as ApiError;
      toast({
        title: 'Delete failed',
        description: apiError.message || 'Could not delete contact',
        variant: 'destructive',
      });
    }
  };

  const handleFormSubmit = async (data: { name: string; email: string; clientId: number }) => {
    const contactData = {
      name: data.name,
      email: data.email,
      clientId: data.clientId,
    };

    try {
      if (editingContact) {
        await updateContact.mutateAsync({ id: editingContact.id, data: contactData });
        toast({
          title: 'Contact updated',
          description: 'Changes have been saved.',
        });
      } else {
        await createContact.mutateAsync(contactData);
        toast({
          title: 'Contact created',
          description: `${data.name} has been added.`,
        });
      }
      setIsFormOpen(false);
      setEditingContact(null);
    } catch (error) {
      const apiError = error as ApiError;
      toast({
        title: editingContact ? 'Update failed' : 'Create failed',
        description: apiError.message || 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setClientFilter('all');
  };

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <PageHeader title="Contacts" />
        <EmptyState
          icon={Users}
          message={`Failed to load contacts: ${(error as ApiError).message}`}
          actionLabel="Retry"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <PageHeader
        title="Contacts"
        count={contacts.length}
        primaryAction={{
          label: 'Add Contact',
          onClick: handleAddContact,
        }}
      />

      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <SearchBar
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
          />
          <div className="w-full sm:w-64">
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {(searchQuery || clientFilter !== 'all') && (
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredContacts.length} of {contacts.length} contacts
            </p>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredContacts.length === 0 && !searchQuery && clientFilter === 'all' ? (
        <EmptyState
          icon={Users}
          message="No contacts yet. Add contacts for your clients."
          actionLabel="Add Contact"
          onAction={handleAddContact}
        />
      ) : filteredContacts.length === 0 ? (
        <EmptyState icon={Users} message="No contacts match your filters." />
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
                      Name
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow
                    key={contact.id}
                    className={cn(contact.isSystemContact && 'opacity-60')}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {contact.name}
                        {contact.isSystemContact && (
                          <Badge variant="secondary" className="text-xs">
                            System
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{contact.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {contact.clientName}
                    </TableCell>
                    <TableCell className="text-right">
                      <ActionButtons
                        onEdit={() => handleEditContact(contact)}
                        onDelete={
                          contact.isSystemContact
                            ? undefined
                            : () => handleDeleteContact(contact)
                        }
                        showDelete={!contact.isSystemContact}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredContacts.map((contact) => (
              <Card
                key={contact.id}
                className={cn('p-4', contact.isSystemContact && 'opacity-60')}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{contact.name}</h3>
                      {contact.isSystemContact && (
                        <Badge variant="secondary" className="text-xs">
                          System
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {contact.email}
                    </p>
                  </div>
                  <ActionButtons
                    onEdit={() => handleEditContact(contact)}
                    onDelete={
                      contact.isSystemContact
                        ? undefined
                        : () => handleDeleteContact(contact)
                    }
                    showDelete={!contact.isSystemContact}
                  />
                </div>
                <p className="text-sm text-muted-foreground">{contact.clientName}</p>
              </Card>
            ))}
          </div>
        </>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingContact ? 'Edit Contact' : 'Add Contact'}
            </DialogTitle>
            <DialogDescription>
              {editingContact
                ? 'Update contact information and client association.'
                : 'Add a new contact and associate them with a client.'}
            </DialogDescription>
          </DialogHeader>
          <ContactForm
            contact={editingContact || undefined}
            clients={clients}
            existingEmails={contacts.map((c) => c.email)}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {contactToDelete && (
        <DeleteContactDialog
          isOpen={deleteDialogOpen}
          contactName={contactToDelete.name}
          contactEmail={contactToDelete.email}
          ticketCount={0}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteDialogOpen(false)}
        />
      )}
    </div>
  );
};
