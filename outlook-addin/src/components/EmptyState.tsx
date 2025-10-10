import { Mail } from "lucide-react";

export const EmptyState = () => {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 text-center">
      <div className="rounded-full bg-gray-800 p-6">
        <Mail className="h-12 w-12 text-gray-400" />
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-100">No Email Selected</h2>
        <p className="text-sm text-gray-300">
          Select an email to create a ticket
        </p>
      </div>
    </div>
  );
};
