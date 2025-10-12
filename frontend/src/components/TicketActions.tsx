import { Button } from '@/components/ui/button';
import { ConfirmDialog } from './ConfirmDialog';
import { useState } from 'react';
import { TicketDetail } from '@/types';
import { Trash2 } from 'lucide-react';

interface TicketActionsProps {
  ticket: TicketDetail;
  onCloseTicket: () => void;
  onReopenTicket: () => void;
  onDeleteTicket: () => void;
}

export const TicketActions = ({ ticket, onCloseTicket, onReopenTicket, onDeleteTicket }: TicketActionsProps) => {
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showReopenDialog, setShowReopenDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleCloseConfirm = () => {
    onCloseTicket();
    setShowCloseDialog(false);
  };

  const handleReopenConfirm = () => {
    onReopenTicket();
    setShowReopenDialog(false);
  };

  const handleDeleteConfirm = () => {
    onDeleteTicket();
    setShowDeleteDialog(false);
  };

  const hasLockedTimeEntries = ticket.timeEntries.some(entry => entry.isLocked);

  if (ticket.state === 'open') {
    return (
      <>
        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={hasLockedTimeEntries}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Ticket
          </Button>
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
        <ConfirmDialog
          isOpen={showDeleteDialog}
          title="Delete this ticket?"
          message={`This will permanently delete ticket #${ticket.id} and all ${ticket.timeEntries.length} time ${ticket.timeEntries.length === 1 ? 'entry' : 'entries'}. This action cannot be undone.`}
          confirmLabel="Delete Ticket"
          confirmStyle="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteDialog(false)}
        />
      </>
    );
  }

  if (ticket.state === 'closed' && ticket.canReopen) {
    return (
      <>
        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={hasLockedTimeEntries}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Ticket
          </Button>
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
        <ConfirmDialog
          isOpen={showDeleteDialog}
          title="Delete this ticket?"
          message={`This will permanently delete ticket #${ticket.id} and all ${ticket.timeEntries.length} time ${ticket.timeEntries.length === 1 ? 'entry' : 'entries'}. This action cannot be undone.`}
          confirmLabel="Delete Ticket"
          confirmStyle="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteDialog(false)}
        />
      </>
    );
  }

  if (ticket.state === 'closed' && !ticket.canReopen) {
    return (
      <>
        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={hasLockedTimeEntries}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Ticket
          </Button>
          <p className="text-sm text-muted-foreground self-center">
            Ticket closed more than 7 days ago
          </p>
        </div>
        <ConfirmDialog
          isOpen={showDeleteDialog}
          title="Delete this ticket?"
          message={`This will permanently delete ticket #${ticket.id} and all ${ticket.timeEntries.length} time ${ticket.timeEntries.length === 1 ? 'entry' : 'entries'}. This action cannot be undone.`}
          confirmLabel="Delete Ticket"
          confirmStyle="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteDialog(false)}
        />
      </>
    );
  }

  return null;
};
