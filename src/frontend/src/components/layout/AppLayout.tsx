import { Link } from '@tanstack/react-router';
import AppHeader from './AppHeader';
import AdminTroubleshootingCard from '../auth/AdminTroubleshootingCard';
import { Heart, Home, Send, Users, ArrowDownRight, History, CheckCircle, Shield, UserPlus, ArrowLeftRight } from 'lucide-react';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useIsCallerAdmin } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { identity } = useInternetIdentity();
  const { data: isAdmin } = useIsCallerAdmin();
  const isAuthenticated = !!identity;

  const appIdentifier = typeof window !== 'undefined' 
    ? encodeURIComponent(window.location.hostname || 'btc-credit-transfer')
    : 'btc-credit-transfer';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      
      {isAuthenticated && (
        <nav className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-2">
            <div className="flex gap-2 overflow-x-auto">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/send-btc">
                <Button variant="ghost" size="sm">
                  <Send className="h-4 w-4 mr-2" />
                  Send BTC
                </Button>
              </Link>
              <Link to="/send-to-peer">
                <Button variant="ghost" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Send to Peer
                </Button>
              </Link>
              <Link to="/withdraw">
                <Button variant="ghost" size="sm">
                  <ArrowDownRight className="h-4 w-4 mr-2" />
                  Withdraw
                </Button>
              </Link>
              <Link to="/history">
                <Button variant="ghost" size="sm">
                  <History className="h-4 w-4 mr-2" />
                  History
                </Button>
              </Link>
              <Link to="/verify-transaction">
                <Button variant="ghost" size="sm">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verify Transaction
                </Button>
              </Link>
              {isAdmin && (
                <>
                  <Link to="/admin">
                    <Button variant="ghost" size="sm">
                      <Shield className="h-4 w-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                  <Link to="/admin/send-to-user">
                    <Button variant="ghost" size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Send to User
                    </Button>
                  </Link>
                  <Link to="/admin/peer-transfers">
                    <Button variant="ghost" size="sm">
                      <ArrowLeftRight className="h-4 w-4 mr-2" />
                      Peer Transfers
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      )}

      <main className="flex-1 container mx-auto px-4 py-8">
        <AdminTroubleshootingCard />
        {children}
      </main>

      <footer className="border-t border-border py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Bitcoin Credit Transfer. Built with{' '}
            <Heart className="inline h-4 w-4 text-red-500 fill-red-500" /> using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appIdentifier}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
