import React from 'react';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

export default function LoggedOutSignInPanel() {
  const { login, loginStatus } = useInternetIdentity();

  const disabled = loginStatus === 'logging-in';

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-3xl font-bold">Welcome</h1>
        <p className="text-muted-foreground">
          Please log in to access the application
        </p>
        <Button
          onClick={handleLogin}
          disabled={disabled}
          size="lg"
          className="gap-2 w-full sm:w-auto"
        >
          {loginStatus === 'logging-in' ? (
            <>Signing in...</>
          ) : (
            <>
              <LogIn className="h-5 w-5" />
              Sign in with Internet Identity
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
