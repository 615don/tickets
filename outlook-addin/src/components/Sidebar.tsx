import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface SidebarProps {
  children: ReactNode;
  isLoading?: boolean;
}

export const Sidebar = ({ children, isLoading = false }: SidebarProps) => {
  return (
    <div className="flex h-screen w-full flex-col bg-gray-900">
      {/* Main Content Section */}
      <main className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-3 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            <p className="text-sm text-gray-300">Loading...</p>
          </div>
        ) : (
          <div className="space-y-6">{children}</div>
        )}
      </main>
    </div>
  );
};
