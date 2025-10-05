/**
 * Invoice client group component
 * Groups tickets by client with collapsible section
 */

import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { ClientInvoiceGroup } from '@/types/invoice';
import { InvoiceTicketItem } from './InvoiceTicketItem';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface InvoiceClientGroupProps {
  client: ClientInvoiceGroup;
  month: string;
  isLocked: boolean;
}

export function InvoiceClientGroup({ client, month, isLocked }: InvoiceClientGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card className="mb-4">
      <CardHeader className="p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            <h3 className="text-lg font-semibold">{client.clientName}</h3>
          </div>
          <div className="text-sm font-medium text-gray-600">
            {client.subtotalHours.toFixed(2)} billable hours
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-4 pt-0 space-y-3">
          {client.tickets.map((ticket) => (
            <InvoiceTicketItem
              key={ticket.ticketId}
              ticket={ticket}
              month={month}
              isLocked={isLocked}
            />
          ))}
        </CardContent>
      )}
    </Card>
  );
}
