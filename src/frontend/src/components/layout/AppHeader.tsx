import { Link, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Coins, Send, History, Gift, ArrowDownToLine, Sparkles } from 'lucide-react';
import LoginButton from '../auth/LoginButton';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useQuery } from '@tanstack/react-query';
import { useActor } from '../../hooks/useActor';
import { useState } from 'react';

export default function AppHeader() {
  const { identity } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const principalId = identity?.getPrincipal().toString();

  const { data: isAdmin, isFetching: adminFetching, isFetched: adminFetched } = useQuery<boolean>({
    queryKey: ['isAdmin', principalId],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching && !!principalId,
    retry: false,
  });

  const { data: userProfile } = useQuery({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });

  const isAuthenticated = !!identity;
  const showAdminLink = adminFetched && isAdmin === true;
  const showCheckingIndicator = isAuthenticated && !adminFetched && adminFetching;

  const navLinks = [
    { to: '/buy-credits', label: 'Buy Credits', icon: Coins },
    { to: '/send-btc', label: 'Send BTC', icon: Send },
    { to: '/history', label: 'History', icon: History },
    { to: '/puzzle-rewards', label: 'Puzzle Rewards', icon: Gift },
    { to: '/withdraw', label: 'Withdraw', icon: ArrowDownToLine },
    { to: '/ai-lottery', label: 'AI Lottery', icon: Sparkles },
  ];

  const handleNavClick = (to: string) => {
    setMobileMenuOpen(false);
    navigate({ to });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/assets/generated/btc-credit-logo.dim_512x512.png" alt="BTC Credits" className="h-8 w-8" />
            <span className="font-bold text-xl">BTC Credits</span>
          </Link>

          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Button key={link.to} variant="ghost" size="sm" asChild>
                  <Link to={link.to} className="gap-2">
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                </Button>
              ))}
              {showAdminLink && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/admin">Admin</Link>
                </Button>
              )}
              {showCheckingIndicator && (
                <span className="text-xs text-muted-foreground ml-2">Checking access...</span>
              )}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated && userProfile && (
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Welcome,</span>
              <span className="font-semibold">{userProfile.name}</span>
            </div>
          )}
          <LoginButton />

          {isAuthenticated && (
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <nav className="flex flex-col gap-4 mt-8">
                  {navLinks.map((link) => (
                    <Button
                      key={link.to}
                      variant="ghost"
                      className="justify-start gap-2"
                      onClick={() => handleNavClick(link.to)}
                    >
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </Button>
                  ))}
                  {showAdminLink && (
                    <Button variant="ghost" className="justify-start" onClick={() => handleNavClick('/admin')}>
                      Admin
                    </Button>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  );
}
