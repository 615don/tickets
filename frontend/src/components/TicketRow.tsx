import { Ticket } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface TicketRowProps {
  ticket: Ticket;
  onClick: () => void;
  showCloseButton?: boolean;
  onReopen?: (id: number) => void;
}

export const TicketRow = ({ ticket, onClick, showCloseButton, onReopen }: TicketRowProps) => {
  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  return (
    <>
      {/* Desktop View */}
      <tr className="hidden md:table-row border-b border-border hover:bg-muted/50 cursor-pointer transition-colors">
        <td className="py-3 px-4 text-sm font-medium text-foreground" onClick={onClick}>
          #{ticket.id}
        </td>
        <td className="py-3 px-4 text-sm text-foreground" onClick={onClick}>
          {ticket.clientName}
        </td>
        <td className="py-3 px-4 text-sm text-muted-foreground" onClick={onClick}>
          {ticket.contactName}
        </td>
        <td className="py-3 px-4 text-sm text-muted-foreground" onClick={onClick}>
          {ticket.description || '—'}
        </td>
        <td className="py-3 px-4 text-sm font-medium text-foreground" onClick={onClick}>
          {ticket.totalHours}h
        </td>
        <td className="py-3 px-4 text-sm text-muted-foreground" onClick={onClick}>
          {ticket.state === 'closed' && ticket.closedAt 
            ? formatDate(ticket.closedAt)
            : formatDate(ticket.updatedAt)}
        </td>
        {showCloseButton && onReopen && (
          <td className="py-3 px-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReopen(ticket.id);
              }}
              className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
            >
              Re-open
            </button>
          </td>
        )}
      </tr>

      {/* Mobile View */}
      <div 
        className="md:hidden bg-card border border-border rounded-lg p-4 mb-3 cursor-pointer hover:border-primary/50 transition-colors"
        onClick={onClick}
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-sm font-medium text-foreground">#{ticket.id}</p>
            <p className="text-xs text-muted-foreground">{ticket.clientName}</p>
          </div>
          <span className="text-sm font-medium text-foreground">{ticket.totalHours}h</span>
        </div>
        <p className="text-sm text-muted-foreground mb-2">{ticket.contactName}</p>
        {ticket.description && (
          <p className="text-sm text-foreground mb-2 line-clamp-1">{ticket.description}</p>
        )}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {ticket.state === 'closed' && ticket.closedAt 
              ? formatDate(ticket.closedAt)
              : formatDate(ticket.updatedAt)}
          </p>
          {showCloseButton && onReopen && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReopen(ticket.id);
              }}
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              Re-open
            </button>
          )}
        </div>
      </div>
    </>
  );
};
