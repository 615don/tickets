import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Building2, User, Mail, Plus, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { StateBadge } from './StateBadge';
import { EditableTextField } from './EditableTextField';
import { TimeEntryRow } from './TimeEntryRow';
import { TimeEntryForm } from './TimeEntryForm';
import { TicketActions } from './TicketActions';
import { ConfirmDialog } from './ConfirmDialog';
import { TicketDetail as TicketDetailType, TimeEntryFormData, TimeEntryRequest } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useUpdateTicket, useCloseTicket, useReopenTicket, useDeleteTicket } from '@/hooks/useTickets';
import { useCreateTimeEntry, useUpdateTimeEntry, useDeleteTimeEntry } from '@/hooks/useTimeEntries';

interface TicketDetailProps {
  ticket: TicketDetailType;
}

export const TicketDetail = ({ ticket }: TicketDetailProps) => {
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [deleteDialogEntry, setDeleteDialogEntry] = useState<number | null>(null);
  const { toast } = useToast();

  const updateTicket = useUpdateTicket();
  const closeTicket = useCloseTicket();
  const reopenTicket = useReopenTicket();
  const deleteTicket = useDeleteTicket();
  const createTimeEntry = useCreateTimeEntry(ticket.id);
  const updateTimeEntry = useUpdateTimeEntry(ticket.id);
  const deleteTimeEntry = useDeleteTimeEntry(ticket.id);

  const handleBack = () => {
    navigate('/');
  };

  const handleSaveDescription = (value: string) => {
    updateTicket.mutate(
      { id: ticket.id, data: { description: value } },
      {
        onSuccess: () => toast({ title: 'Description updated' }),
        onError: (error) => toast({
          title: 'Error updating description',
          description: error.message,
          variant: 'destructive'
        }),
      }
    );
  };

  const handleSaveNotes = (value: string) => {
    updateTicket.mutate(
      { id: ticket.id, data: { notes: value } },
      {
        onSuccess: () => toast({ title: 'Notes updated' }),
        onError: (error) => toast({
          title: 'Error updating notes',
          description: error.message,
          variant: 'destructive'
        }),
      }
    );
  };

  const handleAddTimeEntry = (data: TimeEntryFormData) => {
    const request: TimeEntryRequest = {
      workDate: data.workDate,
      duration: data.time,
      billable: data.billable,
    };

    createTimeEntry.mutate(request, {
      onSuccess: () => {
        setShowAddForm(false);
        toast({ title: 'Time entry added' });
      },
      onError: (error) => toast({
        title: 'Error adding time entry',
        description: error.message,
        variant: 'destructive'
      }),
    });
  };

  const handleEditTimeEntry = (data: TimeEntryFormData) => {
    if (!editingEntryId) return;

    const request: TimeEntryRequest = {
      workDate: data.workDate,
      duration: data.time,
      billable: data.billable,
    };

    updateTimeEntry.mutate(
      { id: editingEntryId, data: request },
      {
        onSuccess: () => {
          setEditingEntryId(null);
          toast({ title: 'Time entry updated' });
        },
        onError: (error) => toast({
          title: 'Error updating time entry',
          description: error.message,
          variant: 'destructive'
        }),
      }
    );
  };

  const handleDeleteTimeEntry = () => {
    if (!deleteDialogEntry) return;

    deleteTimeEntry.mutate(deleteDialogEntry, {
      onSuccess: () => {
        setDeleteDialogEntry(null);
        toast({ title: 'Time entry deleted' });
      },
      onError: (error) => toast({
        title: 'Error deleting time entry',
        description: error.message,
        variant: 'destructive'
      }),
    });
  };

  const handleCloseTicket = () => {
    closeTicket.mutate(ticket.id, {
      onSuccess: () => toast({ title: 'Ticket closed' }),
      onError: (error) => toast({
        title: 'Error closing ticket',
        description: error.message,
        variant: 'destructive'
      }),
    });
  };

  const handleReopenTicket = () => {
    reopenTicket.mutate(ticket.id, {
      onSuccess: () => toast({ title: 'Ticket re-opened' }),
      onError: (error) => toast({
        title: 'Error re-opening ticket',
        description: error.message,
        variant: 'destructive'
      }),
    });
  };

  const handleDeleteTicket = () => {
    deleteTicket.mutate(ticket.id, {
      onSuccess: () => {
        toast({ title: 'Ticket deleted' });
        // Use setTimeout to ensure toast is shown before navigation
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 100);
      },
      onError: (error) => toast({
        title: 'Error deleting ticket',
        description: error.message,
        variant: 'destructive'
      }),
    });
  };

  const formatDuration = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    if (minutes === 0) return `${wholeHours} hours`;
    if (wholeHours === 0) return `${minutes} minutes`;
    return `${wholeHours}h ${minutes}m`;
  };

  const billableHours = ticket.timeEntries
    .filter(e => e.billable)
    .reduce((sum, e) => sum + e.durationHours, 0);

  const editingEntry = ticket.timeEntries.find(e => e.id === editingEntryId);
  const deleteEntry = ticket.timeEntries.find(e => e.id === deleteDialogEntry);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Button>
            <StateBadge state={ticket.state} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Title Section */}
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Ticket #{ticket.id}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {ticket.state === 'open'
              ? `Created ${formatDistanceToNow(new Date(ticket.createdAt))} ago`
              : `Closed on ${format(new Date(ticket.closedAt!), 'MMM dd, yyyy')}`}
          </p>
        </div>

        {/* Core Info Section */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Ticket Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>Client</span>
              </div>
              <p className="font-medium">{ticket.clientName}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Contact</span>
              </div>
              <p className="font-medium">{ticket.contactName}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>Email</span>
              </div>
              <p className="font-medium">{ticket.contactEmail}</p>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Created</div>
              <p className="font-medium">{format(new Date(ticket.createdAt), 'MMMM dd, yyyy')}</p>
            </div>
          </div>
        </Card>

        {/* Description & Notes */}
        <Card className="p-6 space-y-6">
          <EditableTextField
            value={ticket.description}
            onSave={handleSaveDescription}
            label="Description"
            placeholder="Add a description..."
            required
            multiline
          />
          <EditableTextField
            value={ticket.notes}
            onSave={handleSaveNotes}
            label="Notes"
            placeholder="Add notes..."
            multiline
          />
        </Card>

        {/* Time Entries Section */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">Time Entries</h2>
              <Badge variant="secondary" className="text-sm">
                {formatDuration(ticket.totalHours)}
              </Badge>
            </div>
            {!showAddForm && !editingEntryId && (
              <Button onClick={() => setShowAddForm(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Time
              </Button>
            )}
          </div>

          {billableHours > 0 && billableHours !== ticket.totalHours && (
            <p className="text-sm text-muted-foreground mb-4">
              {formatDuration(billableHours)} billable
            </p>
          )}

          {/* Add Form */}
          {showAddForm && (
            <div className="mb-4">
              <TimeEntryForm
                onSubmit={handleAddTimeEntry}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          )}

          {/* Time Entries List */}
          {ticket.timeEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No time entries yet. Add one to get started.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-sm text-muted-foreground">
                      <th className="text-left px-4 py-2 font-medium">Date</th>
                      <th className="text-left px-4 py-2 font-medium">Duration</th>
                      <th className="text-left px-4 py-2 font-medium">Type</th>
                      <th className="text-left px-4 py-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ticket.timeEntries.map((entry) =>
                      editingEntryId === entry.id ? (
                        <tr key={entry.id}>
                          <td colSpan={4} className="p-4">
                            <TimeEntryForm
                              onSubmit={handleEditTimeEntry}
                              onCancel={() => setEditingEntryId(null)}
                              defaultValues={{
                                workDate: entry.workDate,
                                time: `${entry.durationHours}h`,
                                billable: entry.billable,
                              }}
                              isEdit
                            />
                          </td>
                        </tr>
                      ) : (
                        <TimeEntryRow
                          key={entry.id}
                          timeEntry={entry}
                          onEdit={setEditingEntryId}
                          onDelete={setDeleteDialogEntry}
                          isLocked={entry.isLocked}
                        />
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {ticket.timeEntries.map((entry) =>
                  editingEntryId === entry.id ? (
                    <TimeEntryForm
                      key={entry.id}
                      onSubmit={handleEditTimeEntry}
                      onCancel={() => setEditingEntryId(null)}
                      defaultValues={{
                        workDate: entry.workDate,
                        time: `${entry.durationHours}h`,
                        billable: entry.billable,
                      }}
                      isEdit
                    />
                  ) : (
                    <TimeEntryRow
                      key={entry.id}
                      timeEntry={entry}
                      onEdit={setEditingEntryId}
                      onDelete={setDeleteDialogEntry}
                      isLocked={entry.isLocked}
                    />
                  )
                )}
              </div>
            </>
          )}

          {/* Locked entries warning */}
          {ticket.timeEntries.some(e => e.isLocked) && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
              <Lock className="h-4 w-4" />
              <span>Some time entries are locked because their month has been invoiced</span>
            </div>
          )}
        </Card>

        {/* Actions */}
        <TicketActions
          ticket={ticket}
          onCloseTicket={handleCloseTicket}
          onReopenTicket={handleReopenTicket}
          onDeleteTicket={handleDeleteTicket}
        />
      </main>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogEntry !== null}
        title="Delete Time Entry?"
        message={
          deleteEntry
            ? `This time entry (${formatDuration(deleteEntry.durationHours)} on ${format(
                new Date(deleteEntry.workDate),
                'MMM dd'
              )}) will be permanently removed.`
            : ''
        }
        confirmLabel="Delete"
        confirmStyle="danger"
        onConfirm={handleDeleteTimeEntry}
        onCancel={() => setDeleteDialogEntry(null)}
      />
    </div>
  );
};
