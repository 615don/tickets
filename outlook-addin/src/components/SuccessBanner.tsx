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
      aria-atomic="true"
      className="animate-slide-down sticky top-0 z-50 flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-800 shadow-lg"
    >
      <div className="flex items-center gap-2">
        <span className="mr-2 text-lg font-bold text-green-600">✓</span>
        <span className="text-sm font-medium">
          Ticket{" "}
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
        className="rounded p-1 text-green-600 transition-colors hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        aria-label="Dismiss success message"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
