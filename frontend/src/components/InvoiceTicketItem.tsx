/**
 * Invoice ticket line item component
 * Displays ticket details with inline description editing capability
 */

import { useState, useRef, useEffect } from 'react';
import { Pencil, AlertCircle } from 'lucide-react';
import { TicketInvoiceItem } from '@/types/invoice';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUpdateTicketDescription } from '@/hooks/useInvoicePreview';

interface InvoiceTicketItemProps {
  ticket: TicketInvoiceItem;
  month: string;
  isLocked: boolean;
}

export function InvoiceTicketItem({ ticket, month, isLocked }: InvoiceTicketItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(ticket.description || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const updateMutation = useUpdateTicketDescription(month);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleEdit = () => {
    if (isLocked) return;
    setIsEditing(true);
    setEditValue(ticket.description || '');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(ticket.description || '');
  };

  const handleSave = async () => {
    const trimmedValue = editValue.trim();

    // Validate input
    if (!trimmedValue) {
      toast({
        title: 'Validation Error',
        description: 'Description cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    if (trimmedValue.length > 500) {
      toast({
        title: 'Validation Error',
        description: 'Description must be 500 characters or less',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateMutation.mutateAsync({
        ticketId: ticket.ticketId,
        description: trimmedValue,
      });

      setIsEditing(false);
      toast({
        title: 'Description updated',
        description: `Ticket #${ticket.ticketId} updated successfully`,
      });
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update description',
        variant: 'destructive',
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
    // Allow Ctrl/Cmd+Enter to save
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
  };

  const getBillableStatusBadge = () => {
    if (!ticket.billable) {
      return (
        <Badge variant="secondary" className="ml-2">
          Non-Billable ($0)
        </Badge>
      );
    }

    if (ticket.nonBillableHours > 0) {
      return (
        <Badge variant="outline" className="ml-2">
          {ticket.billableHours.toFixed(2)} billable / {ticket.nonBillableHours.toFixed(2)}{' '}
          non-billable
        </Badge>
      );
    }

    return (
      <Badge variant="default" className="ml-2 bg-green-600">
        Billable
      </Badge>
    );
  };

  return (
    <div
      className={`border rounded-lg p-4 ${
        ticket.missingDescription ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-sm text-gray-700">Ticket #{ticket.ticketId}</span>
            {getBillableStatusBadge()}
            {ticket.missingDescription && (
              <div className="flex items-center gap-1 text-yellow-700" role="alert">
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs font-medium">Description required</span>
              </div>
            )}
          </div>

          <div className="text-sm text-gray-600 mb-2">
            Requested by: <span className="font-medium">{ticket.contactName}</span>
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                ref={textareaRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter ticket description"
                className="min-h-[80px]"
                maxLength={500}
                aria-label={`Edit description for ticket #${ticket.ticketId}`}
              />
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <span className="text-xs text-gray-500">
                  {editValue.length}/500 characters
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <p className="flex-1 text-sm">
                {ticket.description || (
                  <span className="text-gray-400 italic">No description provided</span>
                )}
              </p>
              {!isLocked && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleEdit}
                  aria-label={`Edit description for ticket #${ticket.ticketId}`}
                  className="h-8 w-8 p-0"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          <div className="mt-2 text-sm font-medium text-gray-700">
            Total Hours: {ticket.totalHours.toFixed(2)}
            {ticket.billableHours !== ticket.totalHours && (
              <span className="text-gray-500 ml-2">
                ({ticket.billableHours.toFixed(2)} billable)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
