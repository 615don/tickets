interface DescriptionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * Description textarea component for ticket form
 * Multiline text input for brief description that appears on invoices
 *
 * Optional field - not required for form submission
 * Story 5.1: Ticket Form UI Components
 * Story 6.3: Added disabled prop for update mode (Epic 6)
 */
export function DescriptionTextarea({ value, onChange, disabled = false }: DescriptionTextareaProps) {
  return (
    <div className="space-y-1">
      <label htmlFor="description" className="block text-sm font-medium text-foreground">
        Description <span className="text-muted-foreground">(optional)</span>
      </label>
      <textarea
        id="description"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Brief description for invoice"
        rows={3}
        disabled={disabled}
        aria-label="Ticket description"
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors resize-y focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}
