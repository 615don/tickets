interface ClosedCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * Checkbox component for marking ticket as closed immediately
 *
 * Default state: unchecked (ticket state: "open")
 * When checked: ticket will be created with state: "closed"
 *
 * Story 5.1: Ticket Form UI Components
 */
export function ClosedCheckbox({ checked, onChange }: ClosedCheckboxProps) {
  return (
    <div className="flex items-center space-x-2">
      <input
        type="checkbox"
        id="close-immediately"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label="Mark ticket as closed"
        className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring"
      />
      <label htmlFor="close-immediately" className="text-sm text-foreground">
        Mark as closed immediately
      </label>
    </div>
  );
}
