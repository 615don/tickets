import { format } from 'date-fns';
import { TimeEntry } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeEntryRowProps {
  timeEntry: TimeEntry;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  isLocked: boolean;
}

export const TimeEntryRow = ({ timeEntry, onEdit, onDelete, isLocked }: TimeEntryRowProps) => {
  const formatDuration = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    if (minutes === 0) return `${wholeHours}h`;
    if (wholeHours === 0) return `${minutes}m`;
    return `${wholeHours}h ${minutes}m`;
  };

  return (
    <>
      {/* Desktop Table Row */}
      <tr className="hidden md:table-row border-b border-border hover:bg-muted/50">
        <td className="px-4 py-3 text-sm">
          {format(new Date(timeEntry.workDate), 'MMM dd, yyyy')}
        </td>
        <td className="px-4 py-3 text-sm font-medium">
          {formatDuration(timeEntry.durationHours)}
        </td>
        <td className="px-4 py-3">
          <Badge
            variant={timeEntry.billable ? 'default' : 'secondary'}
            className={cn(
              timeEntry.billable &&
                'bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400'
            )}
          >
            {timeEntry.billable ? 'Billable' : 'Non-billable'}
          </Badge>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {isLocked ? (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                <span>Locked</span>
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(timeEntry.id)}
                  className="h-8 w-8 p-0"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(timeEntry.id)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </td>
      </tr>

      {/* Mobile Card */}
      <div className="md:hidden bg-card border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="text-sm font-medium">
              {format(new Date(timeEntry.workDate), 'MMM dd, yyyy')}
            </div>
            <div className="text-lg font-semibold text-foreground">
              {formatDuration(timeEntry.durationHours)}
            </div>
          </div>
          <Badge
            variant={timeEntry.billable ? 'default' : 'secondary'}
            className={cn(
              timeEntry.billable &&
                'bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400'
            )}
          >
            {timeEntry.billable ? 'Billable' : 'Non-billable'}
          </Badge>
        </div>
        {isLocked ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
            <Lock className="h-4 w-4" />
            <span>Cannot edit - month has been invoiced</span>
          </div>
        ) : (
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(timeEntry.id)}
              className="flex-1"
            >
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(timeEntry.id)}
              className="flex-1 text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        )}
      </div>
    </>
  );
};
