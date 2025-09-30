import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Pencil } from 'lucide-react';

interface EditableTextFieldProps {
  value: string | null;
  onSave: (value: string) => void;
  label: string;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
}

export const EditableTextField = ({
  value,
  onSave,
  label,
  placeholder = '',
  required = false,
  multiline = false,
}: EditableTextFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">{label}</label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-8 px-2"
          >
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
        <div className="min-h-[60px] rounded-md bg-muted/50 px-3 py-2 text-sm">
          {value || (
            <span className="text-muted-foreground italic">{placeholder || 'Not set'}</span>
          )}
        </div>
        {required && !value && (
          <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-500">
            <span className="font-semibold">⚠️ Required for invoicing</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {multiline ? (
        <Textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          placeholder={placeholder}
          className="min-h-[100px]"
          autoFocus
        />
      ) : (
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          placeholder={placeholder}
          autoFocus
        />
      )}
      <div className="flex gap-2">
        <Button onClick={handleSave} size="sm">
          Save
        </Button>
        <Button onClick={handleCancel} variant="outline" size="sm">
          Cancel
        </Button>
      </div>
    </div>
  );
};
