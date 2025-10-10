import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface SidebarProps {
  children: ReactNode;
  isLoading?: boolean;
}

export const Sidebar = ({ children, isLoading = false }: SidebarProps) => {
  return (
    <div className="flex h-screen w-full max-w-sm flex-col bg-gray-900">
      {/* Main Content Section */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-3 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            <p className="text-sm text-gray-300">Loading...</p>
          </div>
        ) : (
          <div className="space-y-6">{children}</div>
        )}
      </main>

      {/* Footer Section (Optional) */}
      <footer className="border-t border-gray-700 bg-gray-800 px-6 py-3">
        <p className="text-xs text-gray-400">Need help? Contact support</p>
      </footer>
    </div>
  );
};
