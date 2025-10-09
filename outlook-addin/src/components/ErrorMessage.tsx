import { AlertCircle, X } from "lucide-react";

interface ErrorMessageProps {
  variant: "inline" | "banner";
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const ErrorMessage = ({ variant, message, onRetry, onDismiss }: ErrorMessageProps) => {
  if (variant === "inline") {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="mt-1 flex animate-fade-in items-center gap-1 text-xs text-destructive"
      >
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <span>{message}</span>
      </div>
    );
  }

  // Banner variant
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="animate-fade-in flex items-center justify-between rounded-md bg-destructive p-4 text-destructive-foreground shadow-lg"
    >
      <div className="flex flex-1 items-center gap-2">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <div className="flex flex-1 items-center gap-2 text-sm">
          <span>{message}</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="cursor-pointer underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-destructive-foreground"
            >
              Retry
            </button>
          )}
        </div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-2 rounded p-1 transition-colors hover:bg-destructive-foreground/20 focus:outline-none focus:ring-2 focus:ring-destructive-foreground"
          aria-label="Dismiss error"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
