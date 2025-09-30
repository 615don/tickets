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
import { TicketDetail as TicketDetailType, TimeEntryFormData } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Mock data for demonstration
const mockTicket: TicketDetailType = {
  id: 42,
  clientName: 'Acme Corp',
  contactName: 'John Smith',
  contactEmail: 'john@acme.com',
  description: 'Email migration support',
  notes: 'Migrated 50 mailboxes from Exchange to Microsoft 365',
  state: 'open',
  createdAt: '2025-09-27T10:30:00Z',
  closedAt: null,
  timeEntries: [
    {
      id: 101,
      workDate: '2025-09-27',
      durationHours: 2.5,
      billable: true,
      isLocked: false,
      createdAt: '2025-09-27T10:30:00Z',
    },
    {
      id: 102,
      workDate: '2025-09-28',
      durationHours: 3.0,
      billable: true,
      isLocked: false,
      createdAt: '2025-09-28T14:15:00Z',
    },
  ],
  totalHours: 5.5,
  billableHours: 5.5,
  canReopen: true,
};

export const TicketDetail = () => {
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<TicketDetailType>(mockTicket);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [deleteDialogEntry, setDeleteDialogEntry] = useState<number | null>(null);
  const { toast } = useToast();

  const handleBack = () => {
    navigate('/');
  };

  const handleSaveDescription = (value: string) => {
    setTicket({ ...ticket, description: value });
    toast({ title: 'Description updated' });
  };

  const handleSaveNotes = (value: string) => {
    setTicket({ ...ticket, notes: value });
    toast({ title: 'Notes updated' });
  };

  const handleAddTimeEntry = (data: TimeEntryFormData) => {
    // Parse time format
    const hours = parseTimeToHours(data.time);
    
    const newEntry = {
      id: Date.now(),
      workDate: data.workDate,
      durationHours: hours,
      billable: data.billable,
      isLocked: false,
      createdAt: new Date().toISOString(),
    };

    const newEntries = [...ticket.timeEntries, newEntry];
    const newTotal = newEntries.reduce((sum, e) => sum + e.durationHours, 0);
    const newBillable = newEntries.filter(e => e.billable).reduce((sum, e) => sum + e.durationHours, 0);

    setTicket({
      ...ticket,
      timeEntries: newEntries,
      totalHours: newTotal,
      billableHours: newBillable,
    });

    setShowAddForm(false);
    toast({ title: 'Time entry added' });
  };

  const handleEditTimeEntry = (data: TimeEntryFormData) => {
    const hours = parseTimeToHours(data.time);
    
    const updatedEntries = ticket.timeEntries.map(entry =>
      entry.id === editingEntryId
        ? { ...entry, workDate: data.workDate, durationHours: hours, billable: data.billable }
        : entry
    );

    const newTotal = updatedEntries.reduce((sum, e) => sum + e.durationHours, 0);
    const newBillable = updatedEntries.filter(e => e.billable).reduce((sum, e) => sum + e.durationHours, 0);

    setTicket({
      ...ticket,
      timeEntries: updatedEntries,
      totalHours: newTotal,
      billableHours: newBillable,
    });

    setEditingEntryId(null);
    toast({ title: 'Time entry updated' });
  };

  const handleDeleteTimeEntry = () => {
    if (!deleteDialogEntry) return;

    const updatedEntries = ticket.timeEntries.filter(e => e.id !== deleteDialogEntry);
    const newTotal = updatedEntries.reduce((sum, e) => sum + e.durationHours, 0);
    const newBillable = updatedEntries.filter(e => e.billable).reduce((sum, e) => sum + e.durationHours, 0);

    setTicket({
      ...ticket,
      timeEntries: updatedEntries,
      totalHours: newTotal,
      billableHours: newBillable,
    });

    setDeleteDialogEntry(null);
    toast({ title: 'Time entry deleted' });
  };

  const handleCloseTicket = () => {
    setTicket({
      ...ticket,
      state: 'closed',
      closedAt: new Date().toISOString(),
    });
    toast({ title: 'Ticket closed' });
  };

  const handleReopenTicket = () => {
    setTicket({
      ...ticket,
      state: 'open',
      closedAt: null,
    });
    toast({ title: 'Ticket re-opened' });
  };

  const parseTimeToHours = (timeStr: string): number => {
    const hourMatch = timeStr.match(/(\d+(?:\.\d+)?)\s*h/);
    const minMatch = timeStr.match(/(\d+)\s*m/);
    
    let hours = hourMatch ? parseFloat(hourMatch[1]) : 0;
    const minutes = minMatch ? parseInt(minMatch[1]) : 0;
    
    hours += minutes / 60;
    return Math.round(hours * 100) / 100;
  };

  const formatDuration = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    if (minutes === 0) return `${wholeHours} hours`;
    if (wholeHours === 0) return `${minutes} minutes`;
    return `${wholeHours}h ${minutes}m`;
  };

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

          {ticket.billableHours > 0 && ticket.billableHours !== ticket.totalHours && (
            <p className="text-sm text-muted-foreground mb-4">
              {formatDuration(ticket.billableHours)} billable
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
