import { useState } from 'react';
import { Pencil, Save, X, Lock } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface InlineDescriptionEditorProps {
  ticketId: number;
  currentDescription: string | null;
  onSave: (ticketId: number, description: string) => Promise<void>;
  isLocked: boolean;
}

export const InlineDescriptionEditor = ({
  ticketId,
  currentDescription,
  onSave,
  isLocked
}: InlineDescriptionEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(currentDescription || '');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (description.trim().length < 10) {
      toast({
        title: 'Description too short',
        description: 'Please provide at least 10 characters.',
        variant: 'destructive',
      });
      return;
    }

    if (description.trim().length > 500) {
      toast({
        title: 'Description too long',
        description: 'Please keep description under 500 characters.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave(ticketId, description.trim());
      setIsEditing(false);
      toast({
        title: 'Saved',
        description: 'Description updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save description. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDescription(currentDescription || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isLocked) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-muted-foreground">
          {currentDescription || 'No description'}
        </span>
        <Lock size={14} className="text-muted-foreground" />
      </div>
    );
  }

  if (!isEditing) {
    return (
      <div className="flex items-start justify-between space-x-2 group">
        {currentDescription ? (
          <span className="text-sm flex-1">{currentDescription}</span>
        ) : (
          <span className="text-sm text-warning font-medium flex items-center space-x-1">
            <span>⚠️</span>
            <span>Description required</span>
          </span>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(true)}
          className="opacity-0 group-hover:opacity-100 transition-opacity h-7 px-2"
        >
          <Pencil size={14} />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter ticket description (min 10 characters)..."
        className="min-h-[60px] resize-y"
        autoFocus
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {description.length}/500 characters
          {description.length > 0 && description.length < 10 && (
            <span className="text-warning ml-2">Need {10 - description.length} more</span>
          )}
        </span>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isSaving}
          >
            <X size={14} className="mr-1" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || description.trim().length < 10}
          >
            <Save size={14} className="mr-1" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
};
