import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import AppLayout from './components/layout/AppLayout';
import SendBtcPage from './pages/SendBtcPage';
import HistoryPage from './pages/HistoryPage';
import TransferTroubleshootingPage from './pages/TransferTroubleshootingPage';
import AiLotteryPage from './pages/AiLotteryPage';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useIsCallerAdmin } from './hooks/useQueries';
import ProfileSetupModal from './components/auth/ProfileSetupModal';
import { useGetCallerUserProfile } from './hooks/useQueries';
import AdminAccessDeniedScreen from './components/auth/AdminAccessDeniedScreen';
import LoggedOutSignInPanel from './components/auth/LoggedOutSignInPanel';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Layout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

function AuthenticatedRoute({ children }: { children: React.ReactNode }) {
  const { identity, isInitializing } = useInternetIdentity();

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!identity) {
    return <LoggedOutSignInPanel />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: isAdmin, isLoading: isAdminLoading, isFetched } = useIsCallerAdmin();

  if (isInitializing || isAdminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Verifying admin access...</div>
      </div>
    );
  }

  if (!identity) {
    return <LoggedOutSignInPanel />;
  }

  if (isFetched && !isAdmin) {
    return <AdminAccessDeniedScreen />;
  }

  return <>{children}</>;
}

const rootRoute = createRootRoute({
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <AuthenticatedRoute>
      <SendBtcPage />
    </AuthenticatedRoute>
  ),
});

const sendBtcRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/send-btc',
  component: () => (
    <AuthenticatedRoute>
      <SendBtcPage />
    </AuthenticatedRoute>
  ),
});

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/history',
  component: () => (
    <AuthenticatedRoute>
      <HistoryPage />
    </AuthenticatedRoute>
  ),
});

const aiLotteryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/ai-lottery',
  component: () => (
    <AuthenticatedRoute>
      <AiLotteryPage />
    </AuthenticatedRoute>
  ),
});

const transferTroubleshootingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/transfer-troubleshooting/$requestId',
  component: () => (
    <AuthenticatedRoute>
      <TransferTroubleshootingPage />
    </AuthenticatedRoute>
  ),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  sendBtcRoute,
  historyRoute,
  aiLotteryRoute,
  transferTroubleshootingRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function AppContent() {
  const { identity } = useInternetIdentity();
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null && !isAdmin;

  return (
    <>
      <RouterProvider router={router} />
      {showProfileSetup && <ProfileSetupModal />}
      <Toaster />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
