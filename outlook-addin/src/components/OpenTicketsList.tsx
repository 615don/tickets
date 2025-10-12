import { useOpenTickets } from '../hooks/useOpenTickets';
import { OpenTicket } from '../lib/api/tickets';

interface OpenTicketsListProps {
  contactId: number | null;
  onTicketSelect: (ticket: OpenTicket) => void;
  selectedTicketId: number | null;
}

export function OpenTicketsList({
  contactId,
  onTicketSelect,
  selectedTicketId,
}: OpenTicketsListProps) {
  const { openTickets, isLoading } = useOpenTickets(contactId);

  // Don't render if no contactId
  if (!contactId) {
    return null;
  }

  // Don't render during loading
  if (isLoading) {
    return null;
  }

  // Don't render if no open tickets
  if (openTickets.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        Open Tickets
      </label>
      <div className="space-y-1">
        {openTickets.map((ticket) => {
          const isSelected = selectedTicketId === ticket.id;
          return (
            <button
              key={ticket.id}
              type="button"
              onClick={() => onTicketSelect(ticket)}
              className={`
                w-full text-left px-3 py-2 rounded truncate transition-colors text-sm
                hover:bg-accent
                ${
                  isSelected
                    ? 'bg-primary/10 border-l-4 border-primary font-medium'
                    : 'border-l-4 border-transparent'
                }
              `}
              aria-pressed={isSelected}
            >
              #{ticket.id} - {ticket.description}
            </button>
          );
        })}
      </div>
    </div>
  );
}
