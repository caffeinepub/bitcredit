import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import AppHeader from './AppHeader';
import { Button } from '@/components/ui/button';
import { Home, Send, Download, History, Users, Settings, ArrowDownToLine, ArrowUpFromLine, ShoppingCart, Gift, Puzzle } from 'lucide-react';
import { SiCoffeescript } from 'react-icons/si';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const currentYear = new Date().getFullYear();
  const appIdentifier = encodeURIComponent(window.location.hostname || 'btc-credit-app');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      
      {isAuthenticated && (
        <nav className="border-b bg-card">
          <div className="container mx-auto px-4">
            <div className="flex gap-1 overflow-x-auto py-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: '/dashboard' })}
                className="gap-2 whitespace-nowrap"
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: '/send-btc' })}
                className="gap-2 whitespace-nowrap"
              >
                <Send className="h-4 w-4" />
                Send BTC
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: '/receive-btc' })}
                className="gap-2 whitespace-nowrap"
              >
                <ArrowDownToLine className="h-4 w-4" />
                Receive BTC
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: '/buy-btc' })}
                className="gap-2 whitespace-nowrap"
              >
                <ShoppingCart className="h-4 w-4" />
                Buy BTC
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: '/withdraw' })}
                className="gap-2 whitespace-nowrap"
              >
                <ArrowUpFromLine className="h-4 w-4" />
                Withdraw
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: '/history' })}
                className="gap-2 whitespace-nowrap"
              >
                <History className="h-4 w-4" />
                History
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: '/send-to-peer' })}
                className="gap-2 whitespace-nowrap"
              >
                <Users className="h-4 w-4" />
                Send to Peer
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: '/ai-lottery' })}
                className="gap-2 whitespace-nowrap"
              >
                <Gift className="h-4 w-4" />
                AI Lottery
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: '/admin' })}
                className="gap-2 whitespace-nowrap"
              >
                <Settings className="h-4 w-4" />
                Admin
              </Button>
            </div>
          </div>
        </nav>
      )}

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t bg-card py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p className="flex items-center justify-center gap-2">
            © {currentYear} • Built with <SiCoffeescript className="h-4 w-4 text-amber-600" /> using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appIdentifier}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
