import { Link, useNavigate } from '@tanstack/react-router';
import { useGetCallerUserProfile, useIsCallerAdmin } from '../../hooks/useQueries';
import LoginButton from '../auth/LoginButton';
import { Menu, X, Shield } from 'lucide-react';
import { useState } from 'react';

export default function AppHeader() {
  const navigate = useNavigate();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: isAdmin, isFetched: adminFetched } = useIsCallerAdmin();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/buy-credits', label: 'Buy Credits' },
    { to: '/send-btc', label: 'Send BTC' },
    { to: '/history', label: 'History' },
  ];

  if (adminFetched && isAdmin) {
    navLinks.push({ to: '/admin', label: 'Admin' });
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img
                src="/assets/generated/btc-credit-logo.dim_512x512.png"
                alt="Bitcoin Credit Transfer"
                className="h-10 w-10"
              />
              <span className="font-bold text-lg hidden sm:inline-block">BTC Credit</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors flex items-center gap-1"
                  activeProps={{ className: 'text-primary font-semibold' }}
                >
                  {link.label === 'Admin' && <Shield className="h-3.5 w-3.5" />}
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {userProfile && (
              <div className="hidden sm:block text-sm text-muted-foreground">
                Welcome, <span className="font-medium text-foreground">{userProfile.name}</span>
              </div>
            )}
            <LoginButton />
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-accent rounded-md"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md transition-colors flex items-center gap-2"
                  activeProps={{ className: 'text-primary bg-accent/50 font-semibold' }}
                >
                  {link.label === 'Admin' && <Shield className="h-4 w-4" />}
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
