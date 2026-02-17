import { createRouter, createRoute, createRootRoute, RouterProvider, Outlet, useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useIsCallerAdmin, useAssignInitialAdminCredits } from './hooks/useQueries';
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
import AdminAccessDeniedScreen from './components/auth/AdminAccessDeniedScreen';
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
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched } = useGetCallerUserProfile();
  const { data: isAdmin, isFetched: adminFetched } = useIsCallerAdmin();
  const assignInitialCredits = useAssignInitialAdminCredits();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const hasRedirectedRef = useRef(false);
  const lastPrincipalRef = useRef<string | null>(null);
  const hasRefreshedDataRef = useRef(false);
  const hasAssignedCreditsRef = useRef(false);

  const principalString = identity?.getPrincipal().toString();

  // Track principal changes and reset redirect flag when principal changes
  useEffect(() => {
    if (identity) {
      const currentPrincipal = identity.getPrincipal().toString();
      if (lastPrincipalRef.current !== currentPrincipal) {
        // Principal changed (new login or different user)
        if (import.meta.env.DEV) {
          console.log(`[App] Principal changed to: ${currentPrincipal}`);
        }
        hasRedirectedRef.current = false;
        hasRefreshedDataRef.current = false;
        hasAssignedCreditsRef.current = false;
        lastPrincipalRef.current = currentPrincipal;
      }
    } else {
      // User logged out
      lastPrincipalRef.current = null;
      hasRedirectedRef.current = false;
      hasRefreshedDataRef.current = false;
      hasAssignedCreditsRef.current = false;
    }
  }, [identity]);

  // Assign initial admin credits automatically when admin is verified
  useEffect(() => {
    if (identity && adminFetched && isAdmin && !hasAssignedCreditsRef.current && !assignInitialCredits.isPending) {
      if (import.meta.env.DEV) {
        console.log(`[App] Admin verified, assigning initial 500 credits`);
      }
      hasAssignedCreditsRef.current = true;
      assignInitialCredits.mutate();
    }
  }, [identity, isAdmin, adminFetched, assignInitialCredits]);

  // Admin auto-redirect: redirect admins to /admin once admin status is verified
  useEffect(() => {
    if (identity && adminFetched && !hasRedirectedRef.current && isAdmin) {
      if (import.meta.env.DEV) {
        console.log(`[App] Admin verified, redirecting to /admin`);
      }
      hasRedirectedRef.current = true;
      navigate({ to: '/admin', replace: true });
    }
  }, [identity, isAdmin, adminFetched, navigate]);

  // Refresh balance and transaction history after admin verification to show automatic initial grant
  useEffect(() => {
    if (identity && adminFetched && isAdmin && !hasRefreshedDataRef.current) {
      if (import.meta.env.DEV) {
        console.log(`[App] Refreshing balance and history for admin after verification`);
      }
      hasRefreshedDataRef.current = true;
      // Delay refresh slightly to allow the mutation to complete
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['balance'] });
        queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
      }, 500);
    }
  }, [identity, isAdmin, adminFetched, queryClient]);

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
  const { data: isAdmin, isFetched, isLoading, retryAdminCheck } = useIsCallerAdmin();
  const { identity, clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const principalString = identity?.getPrincipal().toString();

  // Development-only: Log final gating decision
  useEffect(() => {
    if (import.meta.env.DEV && isFetched && principalString) {
      console.log(`[AdminGuard] Final gating decision for ${principalString}: ${isAdmin ? 'ALLOWED' : 'DENIED'}`);
    }
  }, [isFetched, isAdmin, principalString]);

  const handleRetry = async () => {
    if (import.meta.env.DEV) {
      console.log('[AdminGuard] Retry admin check requested');
    }
    await retryAdminCheck();
  };

  const handleSignOut = async () => {
    if (import.meta.env.DEV) {
      console.log('[AdminGuard] Sign out requested from admin screen');
    }
    await clear();
    queryClient.clear();
    adminStatusCache.clearAll();
    navigate({ to: '/', replace: true });
  };

  // Show loading screen while checking admin status
  if (isLoading || !isFetched) {
    return (
      <AdminAccessLoadingScreen
        principal={principalString}
        onRetry={handleRetry}
        onSignOut={handleSignOut}
      />
    );
  }

  // Show access denied screen if not admin (no redirect)
  if (!isAdmin) {
    return (
      <AdminAccessDeniedScreen
        principal={principalString}
        onRetry={handleRetry}
        onSignOut={handleSignOut}
      />
    );
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

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: () => (
    <AdminGuard>
      <AdminPage />
    </AdminGuard>
  ),
});

const adminCredentialsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/credentials',
  component: () => (
    <AdminGuard>
      <AdminCredentialsPage />
    </AdminGuard>
  ),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  buyCreditsRoute,
  sendBtcRoute,
  historyRoute,
  adminRoute,
  adminCredentialsRoute,
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
