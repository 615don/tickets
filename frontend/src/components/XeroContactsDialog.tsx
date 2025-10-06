/**
 * Xero Contacts Dialog
 * Displays all Xero contacts with their customer IDs for mapping purposes
 */

import { useState, useMemo } from 'react';
import { Copy, Check, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { xeroApi, type XeroContact } from '@/lib/api/xero';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

interface XeroContactsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SortOrder = 'asc' | 'desc' | null;

export function XeroContactsDialog({ open, onOpenChange }: XeroContactsDialogProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);
  const { toast } = useToast();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['xeroContacts'],
    queryFn: () => xeroApi.getContacts(),
    enabled: open, // Only fetch when dialog is open
  });

  const handleCopyId = async (contactID: string) => {
    try {
      await navigator.clipboard.writeText(contactID);
      setCopiedId(contactID);
      toast({
        title: 'Copied!',
        description: 'Customer ID copied to clipboard',
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleSortToggle = () => {
    if (sortOrder === null) {
      setSortOrder('asc');
    } else if (sortOrder === 'asc') {
      setSortOrder('desc');
    } else {
      setSortOrder(null);
    }
  };

  // Filter, search, and sort customers
  const filteredAndSortedCustomers = useMemo(() => {
    let customers = data?.contacts?.filter(c => c.isCustomer) || [];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      customers = customers.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.emailAddress?.toLowerCase().includes(query) ||
        c.contactID.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    if (sortOrder) {
      customers = [...customers].sort((a, b) => {
        const comparison = a.name.localeCompare(b.name);
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    return customers;
  }, [data?.contacts, searchQuery, sortOrder]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Xero Customers</DialogTitle>
          <DialogDescription>
            Copy customer IDs to map them to your clients
          </DialogDescription>
        </DialogHeader>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, email, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading contacts...</p>
            </div>
          )}

          {isError && (
            <div className="flex items-center justify-center py-8">
              <p className="text-destructive">Failed to load contacts. Please try again.</p>
            </div>
          )}

          {!isLoading && !isError && filteredAndSortedCustomers.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">
                {searchQuery ? 'No customers match your search' : 'No customers found in Xero'}
              </p>
            </div>
          )}

          {!isLoading && !isError && filteredAndSortedCustomers.length > 0 && (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-4 px-4 py-2 font-semibold text-sm border-b">
                <div className="col-span-5 flex items-center gap-2">
                  <span>Customer Name</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSortToggle}
                    className="h-6 w-6 p-0"
                    title={sortOrder === 'asc' ? 'Sort descending' : sortOrder === 'desc' ? 'Clear sort' : 'Sort ascending'}
                  >
                    {sortOrder === 'asc' ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : sortOrder === 'desc' ? (
                      <ArrowDown className="h-3 w-3" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <div className="col-span-6">Customer ID</div>
                <div className="col-span-1"></div>
              </div>
              {filteredAndSortedCustomers.map((contact) => (
                <div
                  key={contact.contactID}
                  className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-muted/50 rounded-lg items-center"
                >
                  <div className="col-span-5">
                    <p className="font-medium">{contact.name}</p>
                    {contact.emailAddress && (
                      <p className="text-sm text-muted-foreground">{contact.emailAddress}</p>
                    )}
                  </div>
                  <div className="col-span-6">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {contact.contactID}
                    </code>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyId(contact.contactID)}
                      className="h-8 w-8 p-0"
                    >
                      {copiedId === contact.contactID ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t pt-4 flex justify-between items-center">
          <a
            href="https://go.xero.com/Contacts/Contacts"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            Open Xero Contacts
          </a>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
