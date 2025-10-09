import { StatusBadge, BadgeVariant } from "./StatusBadge";
import { Edit2 } from "lucide-react";

export interface EmailContextProps {
  senderName: string;
  senderEmail: string;
  matchStatus: BadgeVariant;
  clientName?: string;
  contactName?: string;
  onNameChange?: (newName: string) => void;
}

export const EmailContext = ({
  senderName,
  senderEmail,
  matchStatus,
  clientName,
  contactName,
  onNameChange,
}: EmailContextProps) => {
  const isEditable = matchStatus !== "matched" && matchStatus !== "loading";
  const getStatusText = () => {
    switch (matchStatus) {
      case "matched":
        return `✓ Matched: ${clientName} - ${contactName}`;
      case "warning":
        return `⚠ New contact at ${clientName}`;
      case "neutral":
        return "? No match found";
      case "loading":
        return "Matching contact and client...";
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="sender-name" className="block text-xs font-medium text-muted-foreground">
          Contact
        </label>
        {isEditable ? (
          <div className="relative">
            <input
              id="sender-name"
              type="text"
              value={senderName}
              onChange={(e) => onNameChange?.(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 pr-8 text-base font-semibold text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter sender name"
            />
            <Edit2 className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        ) : (
          <h2 className="text-base font-semibold text-foreground">{senderName}</h2>
        )}
        <p className="text-sm text-muted-foreground">{senderEmail}</p>
      </div>
      <StatusBadge variant={matchStatus} text={getStatusText()} />
    </div>
  );
};
