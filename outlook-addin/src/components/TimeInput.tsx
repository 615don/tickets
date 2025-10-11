import { useState } from "react";
import { parseTimeEntry } from "@/lib/utils/parseTimeEntry";

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidityChange: (isValid: boolean) => void;
  onParsedValueChange?: (hours: number | null) => void;
}

export const TimeInput = ({
  value,
  onChange,
  onValidityChange,
  onParsedValueChange
}: TimeInputProps) => {
  const [error, setError] = useState<string>("");

  const handleChange = (newValue: string) => {
    onChange(newValue);

    const result = parseTimeEntry(newValue);

    if (result.success) {
      setError("");
      onValidityChange(true);
      onParsedValueChange?.(result.hours);
    } else {
      setError(result.error);
      onValidityChange(false);
      onParsedValueChange?.(null);
    }
  };

  const hasError = Boolean(error);

  return (
    <div className="space-y-1">
      <label htmlFor="time-input" className="block text-sm font-medium text-foreground">
        Time
      </label>
      <input
        id="time-input"
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="e.g., 2m, 0.5h, 30m"
        aria-label="Time entry"
        className={`w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
          hasError
            ? "border-destructive focus:ring-destructive"
            : "border-input focus:ring-ring"
        }`}
      />
      {hasError && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};
