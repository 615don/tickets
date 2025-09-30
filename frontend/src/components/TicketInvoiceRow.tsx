import { Link } from 'react-router-dom';
import { Badge } from './ui/badge';
import { InlineDescriptionEditor } from './InlineDescriptionEditor';
import { TicketInvoiceItem } from '@/types/invoice';

interface TicketInvoiceRowProps {
  ticket: TicketInvoiceItem;
  onDescriptionUpdate: (ticketId: number, description: string) => Promise<void>;
  isLocked: boolean;
  billableRate: number;
}

export const TicketInvoiceRow = ({ ticket, onDescriptionUpdate, isLocked, billableRate }: TicketInvoiceRowProps) => {
  const amount = ticket.billable ? ticket.billableHours * billableRate : 0;

  return (
    <>
      {/* Desktop View - Table Row */}
      <tr className="hidden md:table-row border-b border-border hover:bg-muted/50 transition-colors">
        <td className="py-3 px-4">
          <Link
            to={`/tickets/${ticket.id}`}
            className="text-primary hover:underline font-medium"
          >
            #{ticket.id}
          </Link>
        </td>
        <td className="py-3 px-4">
          <InlineDescriptionEditor
            ticketId={ticket.id}
            currentDescription={ticket.description}
            onSave={onDescriptionUpdate}
            isLocked={isLocked}
          />
        </td>
        <td className="py-3 px-4 text-right">
          <span className="font-medium">{ticket.totalHours.toFixed(1)}</span>
        </td>
        <td className="py-3 px-4">
          <Badge variant={ticket.billable ? 'default' : 'secondary'}>
            {ticket.billable ? 'Billable' : 'Non-billable'}
          </Badge>
        </td>
        <td className="py-3 px-4 text-right">
          <span className="font-semibold">
            {ticket.billable ? `$${amount.toFixed(2)}` : '$0.00'}
          </span>
        </td>
      </tr>

      {/* Mobile View - Card */}
      <div className="md:hidden border border-border rounded-lg p-4 mb-3 bg-card">
        <div className="flex items-start justify-between mb-3">
          <Link
            to={`/tickets/${ticket.id}`}
            className="text-primary hover:underline font-medium"
          >
            Ticket #{ticket.id}
          </Link>
          <Badge variant={ticket.billable ? 'default' : 'secondary'}>
            {ticket.billable ? 'Billable' : 'Non-billable'}
          </Badge>
        </div>
        
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Description</p>
            <InlineDescriptionEditor
              ticketId={ticket.id}
              currentDescription={ticket.description}
              onSave={onDescriptionUpdate}
              isLocked={isLocked}
            />
          </div>
          
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground">Hours</p>
              <p className="font-medium">{ticket.totalHours.toFixed(1)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="font-semibold text-lg">
                {ticket.billable ? `$${amount.toFixed(2)}` : '$0.00'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
