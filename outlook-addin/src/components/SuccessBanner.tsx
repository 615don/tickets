import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface SuccessBannerProps {
  ticketId: number;
  showLink?: boolean;
  onDismiss: () => void;
}

export const SuccessBanner = ({ ticketId, showLink = false, onDismiss }: SuccessBannerProps) => {
  const dismissButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Focus the dismiss button for accessibility
    dismissButtonRef.current?.focus();

    // Auto-dismiss after 3 seconds
    const timer = setTimeout(() => {
      onDismiss();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className="animate-slide-down sticky top-0 z-50 flex items-center justify-between rounded-md bg-success p-4 text-success-foreground shadow-lg"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          ✓ Ticket{" "}
          {showLink ? (
            <a
              href={`/tickets/${ticketId}`}
              className="underline hover:no-underline"
              onClick={(e) => e.preventDefault()}
            >
              #{ticketId}
            </a>
          ) : (
            <span>#{ticketId}</span>
          )}{" "}
          created successfully
        </span>
      </div>
      <button
        ref={dismissButtonRef}
        onClick={onDismiss}
        className="rounded p-1 transition-colors hover:bg-success-foreground/20 focus:outline-none focus:ring-2 focus:ring-success-foreground"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
