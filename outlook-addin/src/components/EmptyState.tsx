import { Mail } from "lucide-react";

export const EmptyState = () => {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 text-center">
      <div className="rounded-full bg-muted p-6">
        <Mail className="h-12 w-12 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">No Email Selected</h2>
        <p className="text-sm text-muted-foreground">
          Select an email to create a ticket
        </p>
      </div>
    </div>
  );
};
