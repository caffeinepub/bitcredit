import { Link, useNavigate } from '@tanstack/react-router';
import { Menu, X, Coins } from 'lucide-react';
import { useState } from 'react';
import LoginButton from '../auth/LoginButton';
import { useGetCallerUserProfile, useIsCallerAdmin } from '../../hooks/useQueries';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';

export default function AppHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: isAdmin, isFetched: adminFetched, isLoading: adminLoading } = useIsCallerAdmin();
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();

  const isAuthenticated = !!identity;

  const navLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/buy-credits', label: 'Buy Credits' },
    { to: '/send-btc', label: 'Send BTC' },
    { to: '/history', label: 'History' },
  ];

  // Only show Admin link when admin status is fetched and confirmed
  const showAdminLink = isAuthenticated && adminFetched && isAdmin;

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => navigate({ to: '/' })}
            className="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity"
          >
            <Coins className="h-6 w-6 text-primary" />
            <span className="hidden sm:inline">BTC Credit Transfer</span>
            <span className="sm:hidden">BTC</span>
          </button>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  activeProps={{
                    className: 'text-foreground',
                  }}
                >
                  {link.label}
                </Link>
              ))}
              {showAdminLink && (
                <Link
                  to="/admin"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  activeProps={{
                    className: 'text-foreground',
                  }}
                >
                  Admin
                </Link>
              )}
              {!adminFetched && adminLoading && (
                <span className="text-xs text-muted-foreground italic">
                  Checking access...
                </span>
              )}
            </nav>
          )}

          {/* User Profile & Login */}
          <div className="flex items-center gap-4">
            {isAuthenticated && userProfile && (
              <div className="hidden sm:block text-sm text-muted-foreground">
                {userProfile.name}
              </div>
            )}
            <LoginButton />

            {/* Mobile Menu Button */}
            {isAuthenticated && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-accent rounded-lg transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isAuthenticated && mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                  activeProps={{
                    className: 'text-foreground bg-accent',
                  }}
                >
                  {link.label}
                </Link>
              ))}
              {showAdminLink && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                  activeProps={{
                    className: 'text-foreground bg-accent',
                  }}
                >
                  Admin
                </Link>
              )}
              {!adminFetched && adminLoading && (
                <div className="px-4 py-2 text-xs text-muted-foreground italic">
                  Checking admin access...
                </div>
              )}
              {userProfile && (
                <div className="px-4 py-2 text-sm text-muted-foreground border-t border-border mt-2">
                  Signed in as {userProfile.name}
                </div>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
