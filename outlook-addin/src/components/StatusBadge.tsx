import { CheckCircle, AlertCircle, HelpCircle } from "lucide-react";

export type BadgeVariant = "matched" | "warning" | "neutral" | "loading";

interface StatusBadgeProps {
  variant: BadgeVariant;
  text: string;
  tooltip?: string;
}

export const StatusBadge = ({ variant, text, tooltip }: StatusBadgeProps) => {
  const variantStyles = {
    matched: "bg-success text-success-foreground",
    warning: "bg-warning text-warning-foreground",
    neutral: "bg-muted text-muted-foreground",
    loading: "bg-primary text-primary-foreground",
  };

  const Icon = {
    matched: CheckCircle,
    warning: AlertCircle,
    neutral: HelpCircle,
    loading: null,
  }[variant];

  return (
    <div
      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${variantStyles[variant]}`}
      title={tooltip}
    >
      {variant === "loading" ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : Icon ? (
        <Icon className="h-4 w-4" />
      ) : null}
      <span>{text}</span>
    </div>
  );
};
