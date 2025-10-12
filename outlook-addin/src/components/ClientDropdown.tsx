import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClients } from '@/hooks/useClients';

interface ClientDropdownProps {
  value: number | null;
  onChange: (client: { id: number; name: string } | null) => void;
  disabled?: boolean;
  error?: string;
}

/**
 * Client selection dropdown component
 * Displays all active clients in alphabetical order
 * Supports loading, empty, and error states
 * Implements WCAG 2.1 Level AA accessibility standards
 *
 * Story 4.4: Manual Client Selection Fallback
 */
export function ClientDropdown({ value, onChange, disabled = false, error: validationError }: ClientDropdownProps) {
  const { clients, isLoading, error } = useClients();

  if (isLoading) {
    return <div aria-label="Loading clients">Loading clients...</div>;
  }

  if (error) {
    return <div role="alert">Failed to load clients. Please try again.</div>;
  }

  if (clients.length === 0) {
    return <div>No clients available</div>;
  }

  const hasError = Boolean(validationError);

  return (
    <div className="space-y-1">
      <Select
        value={value?.toString() || ''}
        onValueChange={(val) => {
          if (val) {
            const selectedClient = clients.find(c => c.id === parseInt(val, 10));
            onChange(selectedClient || null);
          } else {
            onChange(null);
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger
          aria-label="Client selection"
          aria-required="true"
          className={hasError ? "border-red-300" : ""}
        >
          <SelectValue placeholder="Select client..." />
        </SelectTrigger>
        <SelectContent>
          {clients.map((client) => (
            <SelectItem key={client.id} value={client.id.toString()}>
              {client.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasError && (
        <div className="text-red-600 text-sm mt-1" role="alert">
          {validationError}
        </div>
      )}
    </div>
  );
}
