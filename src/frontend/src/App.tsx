import { createRouter, createRoute, createRootRoute, RouterProvider, Outlet, useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useIsCallerAdmin } from './hooks/useQueries';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import BuyCreditsPage from './pages/BuyCreditsPage';
import SendBtcPage from './pages/SendBtcPage';
import HistoryPage from './pages/HistoryPage';
import AdminPage from './pages/AdminPage';
import AdminCredentialsPage from './pages/AdminCredentialsPage';
import ProfileSetupModal from './components/auth/ProfileSetupModal';
import AdminAccessLoadingScreen from './components/auth/AdminAccessLoadingScreen';
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { adminStatusCache } from './utils/adminStatusCache';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { identity, login, isLoggingIn } = useInternetIdentity();

  if (!identity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6 max-w-md px-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Welcome to Bitcoin Credit Transfer</h1>
            <p className="text-muted-foreground">
              Sign in to manage your credits and send Bitcoin to any mainnet wallet
            </p>
          </div>
          <button
            onClick={login}
            disabled={isLoggingIn}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoggingIn ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function RootLayout() {
  const { identity, clear } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched } = useGetCallerUserProfile();
  const { data: isAdmin, isLoading: adminLoading, isFetched: adminFetched, retryAdminCheck } = useIsCallerAdmin();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const hasRedirectedRef = useRef(false);
  const lastPrincipalRef = useRef<string | null>(null);
  const hasRefreshedDataRef = useRef(false);

  const principalString = identity?.getPrincipal().toString();

  // Track principal changes and reset redirect flag when principal changes
  useEffect(() => {
    if (identity) {
      const currentPrincipal = identity.getPrincipal().toString();
      if (lastPrincipalRef.current !== currentPrincipal) {
        // Principal changed (new login or different user)
        console.log(`[App] Principal changed to: ${currentPrincipal}`);
        hasRedirectedRef.current = false;
        hasRefreshedDataRef.current = false;
        lastPrincipalRef.current = currentPrincipal;
      }
    } else {
      // User logged out
      lastPrincipalRef.current = null;
      hasRedirectedRef.current = false;
      hasRefreshedDataRef.current = false;
    }
  }, [identity]);

  // Admin auto-redirect: redirect admins to /admin-credentials once admin status is resolved
  useEffect(() => {
    if (identity && adminFetched && !hasRedirectedRef.current && isAdmin) {
      console.log(`[App] Admin verified, redirecting to /admin-credentials`);
      hasRedirectedRef.current = true;
      navigate({ to: '/admin-credentials', replace: true });
    }
  }, [identity, isAdmin, adminFetched, navigate]);

  // Refresh balance and transaction history after admin verification to show automatic initial grant
  useEffect(() => {
    if (identity && adminFetched && isAdmin && !hasRefreshedDataRef.current) {
      console.log(`[App] Refreshing balance and history for admin after verification`);
      hasRefreshedDataRef.current = true;
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
    }
  }, [identity, isAdmin, adminFetched, queryClient]);

  // Handle sign out from loading screen
  const handleSignOut = async () => {
    await clear();
    adminStatusCache.clearAll();
    queryClient.clear();
  };

  // Handle retry from loading screen
  const handleRetry = () => {
    if (retryAdminCheck) {
      console.log(`[App] User requested admin check retry`);
      retryAdminCheck();
    }
  };

  // Show loading screen while checking admin status after login
  if (identity && adminLoading) {
    return (
      <AdminAccessLoadingScreen 
        principal={principalString}
        onRetry={handleRetry}
        onSignOut={handleSignOut}
      />
    );
  }

  // Only show profile setup modal for non-admins with no profile
  const showProfileSetup = !!identity && !profileLoading && profileFetched && userProfile === null && adminFetched && !isAdmin;

  return (
    <AuthGate>
      <AppLayout>
        <Outlet />
      </AppLayout>
      {showProfileSetup && <ProfileSetupModal />}
    </AuthGate>
  );
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data: isAdmin, isLoading, isFetched } = useIsCallerAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (isFetched && !isAdmin) {
      navigate({ to: '/' });
    }
  }, [isAdmin, isFetched, navigate]);

  if (isLoading || !isFetched) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
});

const buyCreditsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/buy-credits',
  component: BuyCreditsPage,
});

const sendBtcRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/send-btc',
  component: SendBtcPage,
});

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/history',
  component: HistoryPage,
});

const adminCredentialsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin-credentials',
  component: () => (
    <AdminGuard>
      <AdminCredentialsPage />
    </AdminGuard>
  ),
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: () => (
    <AdminGuard>
      <AdminPage />
    </AdminGuard>
  ),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  buyCreditsRoute,
  sendBtcRoute,
  historyRoute,
  adminCredentialsRoute,
  adminRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  );
}
