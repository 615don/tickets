import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';

interface ActionButtonsProps {
  onEdit: () => void;
  onDelete?: () => void;
  showDelete?: boolean;
}

export const ActionButtons = ({ onEdit, onDelete, showDelete = true }: ActionButtonsProps) => {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={onEdit}
        className="h-8 w-8 p-0 text-primary hover:text-primary"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      {showDelete && onDelete && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
