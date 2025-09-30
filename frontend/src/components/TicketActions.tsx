import { Button } from '@/components/ui/button';
import { ConfirmDialog } from './ConfirmDialog';
import { useState } from 'react';
import { TicketDetail } from '@/types';

interface TicketActionsProps {
  ticket: TicketDetail;
  onCloseTicket: () => void;
  onReopenTicket: () => void;
}

export const TicketActions = ({ ticket, onCloseTicket, onReopenTicket }: TicketActionsProps) => {
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showReopenDialog, setShowReopenDialog] = useState(false);

  const handleCloseConfirm = () => {
    onCloseTicket();
    setShowCloseDialog(false);
  };

  const handleReopenConfirm = () => {
    onReopenTicket();
    setShowReopenDialog(false);
  };

  if (ticket.state === 'open') {
    return (
      <>
        <div className="flex justify-end pt-6 border-t">
          <Button variant="secondary" onClick={() => setShowCloseDialog(true)}>
            Close Ticket
          </Button>
        </div>
        <ConfirmDialog
          isOpen={showCloseDialog}
          title="Close this ticket?"
          message="You can re-open it within 7 days if needed."
          confirmLabel="Close Ticket"
          confirmStyle="primary"
          onConfirm={handleCloseConfirm}
          onCancel={() => setShowCloseDialog(false)}
        />
      </>
    );
  }

  if (ticket.state === 'closed' && ticket.canReopen) {
    return (
      <>
        <div className="flex justify-end pt-6 border-t">
          <Button onClick={() => setShowReopenDialog(true)}>
            Re-open Ticket
          </Button>
        </div>
        <ConfirmDialog
          isOpen={showReopenDialog}
          title="Re-open this ticket?"
          message="It will appear in your open tickets list."
          confirmLabel="Re-open Ticket"
          confirmStyle="primary"
          onConfirm={handleReopenConfirm}
          onCancel={() => setShowReopenDialog(false)}
        />
      </>
    );
  }

  if (ticket.state === 'closed' && !ticket.canReopen) {
    return (
      <div className="pt-6 border-t">
        <p className="text-sm text-muted-foreground text-center">
          Ticket closed more than 7 days ago
        </p>
      </div>
    );
  }

  return null;
};
