import { useState } from "react";

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidityChange: (isValid: boolean) => void;
}

export const TimeInput = ({ value, onChange, onValidityChange }: TimeInputProps) => {
  const [error, setError] = useState<string>("");
  const [touched, setTouched] = useState(false);

  const validateTimeFormat = (input: string): boolean => {
    if (!input.trim()) {
      return false;
    }

    // Valid formats: 2h, 30m, 1.5h, 1h30m, 90m
    const patterns = [
      /^\d+\.?\d*h$/i,           // 2h, 1.5h
      /^\d+m$/i,                 // 30m, 90m
      /^\d+h\d+m$/i,             // 1h30m
    ];

    return patterns.some(pattern => pattern.test(input.trim()));
  };

  const handleBlur = () => {
    setTouched(true);
    const isValid = validateTimeFormat(value);
    
    if (!isValid && value.trim()) {
      setError("Invalid time format. Use: 2h, 30m, or 1.5h");
    } else {
      setError("");
    }
    
    onValidityChange(isValid || !value.trim());
  };

  const handleChange = (newValue: string) => {
    onChange(newValue);
    if (touched) {
      const isValid = validateTimeFormat(newValue);
      if (isValid || !newValue.trim()) {
        setError("");
        onValidityChange(true);
      }
    }
  };

  const hasError = touched && error;

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
        onBlur={handleBlur}
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
