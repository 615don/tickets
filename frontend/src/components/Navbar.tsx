import { useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Plus, Users, User, FileText, Settings, Menu, Ticket, Monitor, ChevronDown } from 'lucide-react';
import { MobileMenu } from './MobileMenu';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
}

// Primary navigation items shown at top level (Epic 15.9: Navigation refactoring)
const primaryNavItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: <Home size={18} /> },
  { path: '/tickets', label: 'Tickets', icon: <Ticket size={18} /> },
  { path: '/tickets/create', label: 'Create Ticket', icon: <Plus size={18} /> },
  { path: '/invoices', label: 'Invoices', icon: <FileText size={18} /> },
];

// Management navigation items grouped under "Manage" dropdown (Epic 15.9: Reduces navbar crowding)
// Desktop: Shown in dropdown menu | Mobile: Shown as expandable section
const manageNavItems: NavItem[] = [
  { path: '/clients', label: 'Clients', icon: <Users size={18} /> },
  { path: '/contacts', label: 'Contacts', icon: <User size={18} /> },
  { path: '/assets', label: 'Assets', icon: <Monitor size={18} /> },
  { path: '/settings', label: 'Settings', icon: <Settings size={18} /> },
];

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    // Exact match first
    if (location.pathname === path) return true;
    // Prevent parent routes from matching child routes
    // e.g., /tickets should not match /tickets/create
    // e.g., /invoices should not match /invoices/preview
    return false;
  };

  // Helper function to check if current route matches any managed item
  // Used to highlight "Manage" dropdown when user is on Clients/Contacts/Assets/Settings pages
  const isManageRouteActive = () => {
    return manageNavItems.some(item => isActive(item.path));
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleCloseMobileMenu = useCallback(() => {
    console.log('Closing mobile menu');
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <>
      <nav className="fixed top-0 w-full bg-card border-b border-border shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Empty spacer for layout */}
            <div></div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {/* Primary Navigation Items */}
              {primaryNavItems.map((item) => (
                item.disabled ? (
                  <span
                    key={item.path}
                    className="flex items-center space-x-2 px-2 lg:px-3 py-2 rounded-md text-muted-foreground cursor-not-allowed opacity-50"
                    title={item.label}
                  >
                    {item.icon}
                    <span className="text-sm hidden lg:inline">{item.label}</span>
                  </span>
                ) : (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-2 lg:px-3 py-2 rounded-md transition-colors text-sm ${
                      isActive(item.path)
                        ? 'text-primary font-medium border-b-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                    title={item.label}
                  >
                    {item.icon}
                    <span className="hidden lg:inline">{item.label}</span>
                  </Link>
                )
              ))}

              {/* Manage Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`flex items-center space-x-2 px-2 lg:px-3 py-2 rounded-md transition-colors text-sm ${
                      isManageRouteActive()
                        ? 'text-primary font-medium border-b-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                    title="Manage"
                  >
                    <Users size={18} />
                    <span className="hidden lg:inline">Manage</span>
                    <ChevronDown size={14} className="hidden lg:inline" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {manageNavItems.map((item) => (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link to={item.path} className="flex items-center space-x-2">
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* User Section - Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">{user?.email || 'Loading...'}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => {
                console.log('Hamburger clicked, opening menu');
                setIsMobileMenuOpen(true);
              }}
              className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={handleCloseMobileMenu}
        primaryNavItems={primaryNavItems}
        manageNavItems={manageNavItems}
        userEmail={user?.email || 'Loading...'}
        onLogout={handleLogout}
      />
    </>
  );
};
