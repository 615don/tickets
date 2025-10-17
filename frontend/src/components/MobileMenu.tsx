import { Link, useLocation } from 'react-router-dom';
import { X, Users, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  primaryNavItems: NavItem[];
  manageNavItems: NavItem[];
  userEmail: string;
  onLogout: () => void;
}

export const MobileMenu = ({ isOpen, onClose, primaryNavItems, manageNavItems, userEmail, onLogout }: MobileMenuProps) => {
  const location = useLocation();
  const [isManageExpanded, setIsManageExpanded] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Close menu on route change
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] md:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div className={`fixed top-0 right-0 bottom-0 w-64 bg-card shadow-xl z-[70] md:hidden transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <span className="text-lg font-bold text-foreground">Menu</span>
            <button
              onClick={onClose}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto py-4">
            {/* Primary Navigation Items */}
            {primaryNavItems.map((item) => (
              item.disabled ? (
                <div
                  key={item.path}
                  className="flex items-center space-x-3 px-6 py-3 text-muted-foreground cursor-not-allowed opacity-50"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              ) : (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-6 py-3 transition-colors ${
                    isActive(item.path)
                      ? 'bg-accent text-primary font-medium border-l-4 border-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              )
            ))}

            {/* Manage Section - Expandable */}
            <button
              onClick={() => setIsManageExpanded(!isManageExpanded)}
              className="flex items-center space-x-3 px-6 py-3 w-full text-left transition-colors text-muted-foreground hover:text-foreground hover:bg-accent/50"
            >
              <Users size={18} />
              <span className="flex-1">Manage</span>
              {isManageExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>

            {/* Manage Sub-items - Shown when expanded */}
            {isManageExpanded && manageNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 pl-10 pr-6 py-3 transition-colors ${
                  isActive(item.path)
                    ? 'bg-accent text-primary font-medium border-l-4 border-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* User Section */}
          <div className="border-t border-border p-4 space-y-3">
            <div className="text-sm text-muted-foreground truncate">{userEmail}</div>
            <Button variant="outline" size="sm" onClick={onLogout} className="w-full">
              Logout
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
