interface NotesTextareaProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Notes textarea component for ticket form
 * Multiline text input for detailed internal notes
 *
 * Optional field - not required for form submission
 * Story 5.1: Ticket Form UI Components
 */
export function NotesTextarea({ value, onChange }: NotesTextareaProps) {
  return (
    <div className="space-y-1">
      <label htmlFor="notes" className="block text-sm font-medium text-foreground">
        Notes <span className="text-muted-foreground">(optional)</span>
      </label>
      <textarea
        id="notes"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Detailed notes (optional)"
        rows={4}
        aria-label="Ticket notes"
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors resize-y focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}
