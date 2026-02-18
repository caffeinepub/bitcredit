import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet, redirect } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useActor } from './hooks/useActor';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import BuyCreditsPage from './pages/BuyCreditsPage';
import SendBtcPage from './pages/SendBtcPage';
import HistoryPage from './pages/HistoryPage';
import AdminPage from './pages/AdminPage';
import AdminCredentialsPage from './pages/AdminCredentialsPage';
import PuzzleRewardsPage from './pages/PuzzleRewardsPage';
import WithdrawPage from './pages/WithdrawPage';
import TransferTroubleshootingPage from './pages/TransferTroubleshootingPage';
import AiLotteryPage from './pages/AiLotteryPage';
import ProfileSetupModal from './components/auth/ProfileSetupModal';
import AdminAccessLoadingScreen from './components/auth/AdminAccessLoadingScreen';
import AdminAccessDeniedScreen from './components/auth/AdminAccessDeniedScreen';
import LoggedOutSignInPanel from './components/auth/LoggedOutSignInPanel';
import { adminStatusCache } from './utils/adminStatusCache';
import { getSecretParameter } from './utils/urlParams';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const { identity, isInitializing } = useInternetIdentity();

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return <LoggedOutSignInPanel />;
  }

  return <>{children}</>;
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { identity } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const [isVerifying, setIsVerifying] = useState(true);

  const principalId = identity?.getPrincipal().toString();
  const cachedStatus = principalId ? adminStatusCache.get(principalId) : null;

  const { data: isAdmin, isFetching, isFetched } = useQuery<boolean>({
    queryKey: ['isAdmin', principalId],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.isCallerAdmin();
      if (principalId) {
        adminStatusCache.set(principalId, result);
      }
      return result;
    },
    enabled: !!actor && !actorFetching && !!principalId,
    retry: 1,
    staleTime: 0,
    initialData: cachedStatus !== null ? cachedStatus : undefined,
  });

  useEffect(() => {
    if (isFetched && !isFetching) {
      setIsVerifying(false);
    }
  }, [isFetched, isFetching]);

  if (actorFetching || isFetching || isVerifying) {
    return <AdminAccessLoadingScreen principal={principalId} />;
  }

  if (!isAdmin) {
    const tokenDetected = !!getSecretParameter('caffeineAdminToken');
    return <AdminAccessDeniedScreen tokenDetected={tokenDetected} />;
  }

  return <>{children}</>;
}

function AppContent() {
  const { identity } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);

  const principalId = identity?.getPrincipal().toString();

  const { data: isAdmin, isFetched: adminFetched } = useQuery<boolean>({
    queryKey: ['isAdmin', principalId],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching && !!principalId,
    retry: false,
  });

  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched } = useQuery({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });

  useEffect(() => {
    if (adminFetched) {
      setAdminCheckComplete(true);
    }
  }, [adminFetched]);

  const showProfileSetup = identity && !profileLoading && profileFetched && userProfile === null && !isAdmin;

  return (
    <>
      <Outlet />
      {showProfileSetup && <ProfileSetupModal />}
    </>
  );
}

const rootRoute = createRootRoute({
  component: () => (
    <AuthGate>
      <AppLayout>
        <AppContent />
      </AppLayout>
    </AuthGate>
  ),
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

const puzzleRewardsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/puzzle-rewards',
  component: PuzzleRewardsPage,
});

const withdrawRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/withdraw',
  component: WithdrawPage,
});

const aiLotteryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/ai-lottery',
  component: AiLotteryPage,
});

const troubleshootingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/transfer/$requestId/troubleshoot',
  component: TransferTroubleshootingPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: () => (
    <AdminGuard>
      <AdminPage />
    </AdminGuard>
  ),
  beforeLoad: async () => {
    const hasToken = !!getSecretParameter('caffeineAdminToken');
    if (!hasToken) {
      throw redirect({ to: '/' });
    }
  },
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
  puzzleRewardsRoute,
  withdrawRoute,
  aiLotteryRoute,
  troubleshootingRoute,
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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <RouterProvider router={router} />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
