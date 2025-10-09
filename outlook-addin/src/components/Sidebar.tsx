import { ReactNode } from "react";

interface SidebarProps {
  children: ReactNode;
}

export const Sidebar = ({ children }: SidebarProps) => {
  return (
    <div className="flex h-screen w-full max-w-sm flex-col bg-background">
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-6">{children}</div>
      </main>
    </div>
  );
};
