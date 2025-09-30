import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { TicketInvoiceRow } from './TicketInvoiceRow';
import { ClientInvoiceGroup as ClientInvoiceGroupType } from '@/types/invoice';

interface ClientInvoiceGroupProps {
  client: ClientInvoiceGroupType;
  onDescriptionUpdate: (ticketId: number, description: string) => Promise<void>;
  isLocked: boolean;
  billableRate: number;
}

export const ClientInvoiceGroup = ({ client, onDescriptionUpdate, isLocked, billableRate }: ClientInvoiceGroupProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const hasMissingDescriptions = client.tickets.some(t => t.hasMissingDescription);

  return (
    <Card className="mb-4 transition-shadow hover:shadow-md">
      <CardHeader
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold text-foreground">{client.clientName}</h3>
              {hasMissingDescriptions && (
                <div className="flex items-center space-x-1 text-warning">
                  <AlertTriangle size={16} />
                  <span className="text-xs font-medium">Missing descriptions</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4 mt-2">
              <Badge variant="outline" className="font-normal">
                {client.billableHours.toFixed(1)} hours
              </Badge>
              <span className="text-lg font-semibold text-foreground">
                ${client.estimatedAmount.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="text-muted-foreground">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {/* Desktop Table */}
          <div className="hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-4 text-sm font-medium text-muted-foreground">Ticket ID</th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-muted-foreground">Description</th>
                  <th className="text-right py-2 px-4 text-sm font-medium text-muted-foreground">Hours</th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-muted-foreground">Type</th>
                  <th className="text-right py-2 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody>
                {client.tickets.map((ticket) => (
                  <TicketInvoiceRow
                    key={ticket.id}
                    ticket={ticket}
                    onDescriptionUpdate={onDescriptionUpdate}
                    isLocked={isLocked}
                    billableRate={billableRate}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden">
            {client.tickets.map((ticket) => (
              <TicketInvoiceRow
                key={ticket.id}
                ticket={ticket}
                onDescriptionUpdate={onDescriptionUpdate}
                isLocked={isLocked}
                billableRate={billableRate}
              />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
