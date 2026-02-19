import { ReactNode } from 'react';
import { useIsCallerAdmin } from '../../hooks/useQueries';
import AdminAccessDeniedScreen from './AdminAccessDeniedScreen';
import AdminAccessLoadingScreen from './AdminAccessLoadingScreen';

interface AdminRouteProps {
  children: ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { data: isAdmin, isLoading } = useIsCallerAdmin();

  if (isLoading) {
    return <AdminAccessLoadingScreen />;
  }

  if (!isAdmin) {
    return <AdminAccessDeniedScreen />;
  }

  return <>{children}</>;
}
