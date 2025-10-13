import { StatusBadge, BadgeVariant } from "./StatusBadge";
import { Edit2 } from "lucide-react";

export interface EmailContextProps {
  senderName: string;
  senderEmail: string;
  matchStatus: BadgeVariant;
  clientName?: string;
  contactName?: string;
  onNameChange?: (newName: string) => void;
  nameError?: string;
  emailError?: string;
}

export const EmailContext = ({
  senderName,
  senderEmail,
  matchStatus,
  clientName,
  contactName,
  onNameChange,
  nameError,
  emailError,
}: EmailContextProps) => {
  const isEditable = matchStatus !== "matched" && matchStatus !== "loading" && matchStatus !== "ai-loading";
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
      case "ai-loading":
        return "Generating AI summary...";
    }
  };

  const getTooltipText = () => {
    switch (matchStatus) {
      case "loading":
        return "Searching for matching contact and client...";
      case "ai-loading":
        return "Generating AI-powered summary and notes...";
      case "matched":
        return "Contact and client found in database";
      case "warning":
        return "Client found, but contact will be created when ticket is submitted";
      case "neutral":
        return "No match found. Please select client and contact manually.";
    }
  };

  const hasNameError = Boolean(nameError);
  const hasEmailError = Boolean(emailError);

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
              className={`w-full rounded-md border bg-background px-3 py-2 pr-8 text-base font-semibold text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                hasNameError ? "border-red-300" : "border-input"
              }`}
              placeholder="Enter sender name"
            />
            <Edit2 className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        ) : (
          <h2 className="text-base font-semibold text-white">{senderName}</h2>
        )}
        {hasNameError && (
          <div className="text-red-600 text-sm mt-1" role="alert">
            {nameError}
          </div>
        )}
        <p className={`text-sm text-muted-foreground ${hasEmailError ? "border-red-300 border-l-2 pl-2" : ""}`}>
          {senderEmail}
        </p>
        {hasEmailError && (
          <div className="text-red-600 text-sm mt-1" role="alert">
            {emailError}
          </div>
        )}
      </div>
      <StatusBadge variant={matchStatus} text={getStatusText()} tooltip={getTooltipText()} />
    </div>
  );
};
