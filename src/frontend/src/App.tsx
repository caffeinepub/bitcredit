import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import BuyCreditsPage from './pages/BuyCreditsPage';
import SendBtcPage from './pages/SendBtcPage';
import HistoryPage from './pages/HistoryPage';
import AdminPage from './pages/AdminPage';
import AdminCredentialsPage from './pages/AdminCredentialsPage';
import WithdrawPage from './pages/WithdrawPage';
import AdminWithdrawalStatusDashboard from './components/withdrawals/AdminWithdrawalStatusDashboard';
import PuzzleRewardsPage from './pages/PuzzleRewardsPage';
import TransferTroubleshootingPage from './pages/TransferTroubleshootingPage';
import AiLotteryPage from './pages/AiLotteryPage';
import SendToPeerPage from './pages/SendToPeerPage';
import IncomingRequestsPage from './pages/IncomingRequestsPage';
import OutgoingRequestsPage from './pages/OutgoingRequestsPage';
import AdminManualVerificationPage from './pages/AdminManualVerificationPage';
import AdminSendCreditsPage from './pages/AdminSendCreditsPage';
import AdminSendToUserPage from './pages/AdminSendToUserPage';
import AdminPeerTransfersPage from './pages/AdminPeerTransfersPage';
import BuyBitcoinPage from './pages/BuyBitcoinPage';
import ProfileSetupModal from './components/auth/ProfileSetupModal';
import AdminRoute from './components/auth/AdminRoute';
import LoggedOutSignInPanel from './components/auth/LoggedOutSignInPanel';
import { useInternetIdentity } from './hooks/useInternetIdentity';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

function IndexPageWrapper() {
  const { identity } = useInternetIdentity();
  return identity ? <DashboardPage /> : <LoggedOutSignInPanel />;
}

const rootRoute = createRootRoute({
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexPageWrapper,
});

const buyCreditsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/buy-credits',
  component: BuyCreditsPage,
});

const buyBtcRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/buy-btc',
  component: BuyBitcoinPage,
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
    <AdminRoute>
      <AdminPage />
    </AdminRoute>
  ),
});

const adminCredentialsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/credentials',
  component: () => (
    <AdminRoute>
      <AdminCredentialsPage />
    </AdminRoute>
  ),
});

const withdrawRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/withdraw',
  component: WithdrawPage,
});

const adminWithdrawalsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/withdrawals',
  component: () => (
    <AdminRoute>
      <AdminWithdrawalStatusDashboard />
    </AdminRoute>
  ),
});

const puzzleRewardsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/puzzle-rewards',
  component: PuzzleRewardsPage,
});

const transferTroubleshootingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/transfer-troubleshooting',
  component: TransferTroubleshootingPage,
});

const aiLotteryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/ai-lottery',
  component: AiLotteryPage,
});

const sendToPeerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/send-to-peer',
  component: SendToPeerPage,
});

const incomingRequestsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/incoming-requests',
  component: IncomingRequestsPage,
});

const outgoingRequestsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/outgoing-requests',
  component: OutgoingRequestsPage,
});

const adminManualVerificationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/manual-verification',
  component: () => (
    <AdminRoute>
      <AdminManualVerificationPage />
    </AdminRoute>
  ),
});

const adminSendCreditsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/send-credits',
  component: () => (
    <AdminRoute>
      <AdminSendCreditsPage />
    </AdminRoute>
  ),
});

const adminSendToUserRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/send-to-user',
  component: () => (
    <AdminRoute>
      <AdminSendToUserPage />
    </AdminRoute>
  ),
});

const adminPeerTransfersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/peer-transfers',
  component: () => (
    <AdminRoute>
      <AdminPeerTransfersPage />
    </AdminRoute>
  ),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  buyCreditsRoute,
  buyBtcRoute,
  sendBtcRoute,
  historyRoute,
  adminRoute,
  adminCredentialsRoute,
  withdrawRoute,
  adminWithdrawalsRoute,
  puzzleRewardsRoute,
  transferTroubleshootingRoute,
  aiLotteryRoute,
  sendToPeerRoute,
  incomingRequestsRoute,
  outgoingRequestsRoute,
  adminManualVerificationRoute,
  adminSendCreditsRoute,
  adminSendToUserRoute,
  adminPeerTransfersRoute,
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
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <ProfileSetupModal />
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
