'use client';

import { AuthProvider } from '@/lib/auth';
import { AppShell } from '@/components/app-shell';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShell>
        {children}
      </AppShell>
    </AuthProvider>
  );
}

