import { StatusBadge, BadgeVariant } from "./StatusBadge";
import { Edit2, Mail } from "lucide-react";

export interface EmailContextProps {
  senderName: string;
  senderEmail: string;
  matchStatus: BadgeVariant;
  clientName?: string;
  contactName?: string;
  onNameChange?: (newName: string) => void;
  onEmailChange?: (newEmail: string) => void;
}

export const EmailContext = ({
  senderName,
  senderEmail,
  matchStatus,
  clientName,
  contactName,
  onNameChange,
  onEmailChange,
}: EmailContextProps) => {
  const isEditable = matchStatus !== "matched" && matchStatus !== "loading";
  const getStatusText = () => {
    switch (matchStatus) {
      case "matched":
        return `✓ Matched: ${clientName} - ${contactName}`;
      case "warning":
        return `⚠ New contact at ${clientName}`;
      case "neutral":
        return "? No match found - manual selection required";
      case "loading":
        return "Matching contact and client...";
    }
  };

  const getTooltipText = () => {
    switch (matchStatus) {
      case "loading":
        return "Searching for matching contact and client...";
      case "matched":
        return "Contact and client found in database";
      case "warning":
        return "Client found, but contact will be created when ticket is submitted";
      case "neutral":
        return "No match found. Please select client and contact manually.";
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
          <h2 className="text-base font-semibold text-white">{senderName}</h2>
        )}
      </div>
      <div className="space-y-2">
        <label htmlFor="sender-email" className="block text-xs font-medium text-muted-foreground">
          Email
        </label>
        {isEditable ? (
          <div className="relative">
            <input
              id="sender-email"
              type="email"
              value={senderEmail}
              onChange={(e) => onEmailChange?.(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter sender email"
            />
            <Mail className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{senderEmail}</p>
        )}
      </div>
      <StatusBadge variant={matchStatus} text={getStatusText()} tooltip={getTooltipText()} />
    </div>
  );
};
