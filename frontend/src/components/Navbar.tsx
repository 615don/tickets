import { useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Plus, Users, User, FileText, Settings, Menu, Ticket } from 'lucide-react';
import { MobileMenu } from './MobileMenu';
import { Button } from './ui/button';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: <Home size={18} /> },
  { path: '/tickets', label: 'Open Tickets', icon: <Ticket size={18} /> },
  { path: '/tickets/create', label: 'Create Ticket', icon: <Plus size={18} /> },
  { path: '/clients', label: 'Clients', icon: <Users size={18} /> },
  { path: '/contacts', label: 'Contacts', icon: <User size={18} /> },
  { path: '/invoices', label: 'Invoices', icon: <FileText size={18} /> },
  { path: '/settings', label: 'Settings', icon: <Settings size={18} /> },
];

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
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
            {/* Logo/Brand */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">ZO</span>
              </div>
              <span className="text-xl font-bold text-foreground hidden sm:block">Dashboard</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
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
        navItems={navItems}
        userEmail={user?.email || 'Loading...'}
        onLogout={handleLogout}
      />
    </>
  );
};
