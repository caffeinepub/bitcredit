import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { LogIn, LogOut } from 'lucide-react';
import { adminStatusCache } from '../../utils/adminStatusCache';

export default function LoginButton() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const disabled = loginStatus === 'logging-in';
  const text = loginStatus === 'logging-in' ? 'Signing in...' : isAuthenticated ? 'Sign Out' : 'Sign In';

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      adminStatusCache.clearAll();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <button
      onClick={handleAuth}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium text-sm ${
        isAuthenticated
          ? 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
          : 'bg-primary hover:opacity-90 text-primary-foreground'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isAuthenticated ? <LogOut className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
      <span className="hidden sm:inline">{text}</span>
    </button>
  );
}
