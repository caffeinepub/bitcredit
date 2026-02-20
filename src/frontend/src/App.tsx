import { StrictMode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import BuyCreditsPage from './pages/BuyCreditsPage';
import SendBtcPage from './pages/SendBtcPage';
import HistoryPage from './pages/HistoryPage';
import AdminPage from './pages/AdminPage';
import AdminCredentialsPage from './pages/AdminCredentialsPage';
import PuzzleRewardsPage from './pages/PuzzleRewardsPage';
import WithdrawPage from './pages/WithdrawPage';
import AdminRoute from './components/auth/AdminRoute';
import SendToPeerPage from './pages/SendToPeerPage';
import IncomingRequestsPage from './pages/IncomingRequestsPage';
import OutgoingRequestsPage from './pages/OutgoingRequestsPage';
import AdminManualVerificationPage from './pages/AdminManualVerificationPage';
import AdminSendCreditsPage from './pages/AdminSendCreditsPage';
import AdminSendToUserPage from './pages/AdminSendToUserPage';
import AdminPeerTransfersPage from './pages/AdminPeerTransfersPage';
import BuyBitcoinPage from './pages/BuyBitcoinPage';
import ReceiveBtcPage from './pages/ReceiveBtcPage';
import AdminAddressManagementPage from './pages/AdminAddressManagementPage';
import AiLotteryPage from './pages/AiLotteryPage';
import WalletKeysPage from './pages/WalletKeysPage';
import SelfCustodyWalletsPage from './pages/SelfCustodyWalletsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

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

const buyBitcoinRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/buy-bitcoin',
  component: BuyBitcoinPage,
});

const receiveBtcRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/receive-btc',
  component: ReceiveBtcPage,
});

const adminAddressesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/addresses',
  component: () => (
    <AdminRoute>
      <AdminAddressManagementPage />
    </AdminRoute>
  ),
});

const aiLotteryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/ai-lottery',
  component: AiLotteryPage,
});

const walletKeysRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/wallet/keys',
  component: WalletKeysPage,
});

const selfCustodyWalletsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/self-custody-wallets',
  component: SelfCustodyWalletsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  buyCreditsRoute,
  sendBtcRoute,
  historyRoute,
  adminRoute,
  adminCredentialsRoute,
  puzzleRewardsRoute,
  withdrawRoute,
  sendToPeerRoute,
  incomingRequestsRoute,
  outgoingRequestsRoute,
  adminManualVerificationRoute,
  adminSendCreditsRoute,
  adminSendToUserRoute,
  adminPeerTransfersRoute,
  buyBitcoinRoute,
  receiveBtcRoute,
  adminAddressesRoute,
  aiLotteryRoute,
  walletKeysRoute,
  selfCustodyWalletsRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <StrictMode>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <Toaster />
        </QueryClientProvider>
      </ThemeProvider>
    </StrictMode>
  );
}
