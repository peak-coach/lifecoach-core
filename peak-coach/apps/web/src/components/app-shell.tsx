'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './sidebar';
import { MobileNav } from './mobile-nav';
import { CommandPalette } from './command-palette';
import { useAuth } from '@/lib/auth';
import { useUser } from '@/lib/hooks';
import * as api from '@/lib/api';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AppShellProps {
  children: React.ReactNode;
}

// Pages that don't require authentication
const publicPaths = ['/login'];

export function AppShell({ children }: AppShellProps) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [quickTaskToast, setQuickTaskToast] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { user: dbUser } = useUser();

  const isPublicPath = publicPaths.includes(pathname);

  // Quick-Task erstellen
  const handleCreateQuickTask = useCallback(async (title: string) => {
    if (!dbUser?.id) return;
    
    const today = new Date().toISOString().split('T')[0];
    await api.createTask({
      user_id: dbUser.id,
      title,
      scheduled_date: today,
      priority: 'medium',
    });
    
    setQuickTaskToast(title);
    setTimeout(() => setQuickTaskToast(null), 2500);
  }, [dbUser?.id]);

  // Redirect logic
  useEffect(() => {
    if (!loading) {
      if (!user && !isPublicPath) {
        // Not logged in and trying to access protected route
        router.push('/login');
      } else if (user && isPublicPath) {
        // Logged in but on login page
        router.push('/');
      }
    }
  }, [user, loading, isPublicPath, router]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Cmd+K or Ctrl+K to open command palette
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setCommandPaletteOpen(true);
    }
    
    // Quick navigation shortcuts (only when command palette is closed)
    if (!commandPaletteOpen && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
    }
  }, [commandPaletteOpen]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#D94F3D] mx-auto mb-4" />
          <p className="text-muted-foreground">Laden...</p>
        </div>
      </div>
    );
  }

  // Show login page without sidebar
  if (isPublicPath) {
    return <>{children}</>;
  }

  // Not logged in - will redirect
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D94F3D]" />
      </div>
    );
  }

  // Logged in - show full app
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar onOpenCommandPalette={() => setCommandPaletteOpen(true)} />
      
      {/* Mobile Bottom Nav */}
      <MobileNav />
      
      {/* Main Content - padding for sidebar on desktop, bottom padding for nav on mobile */}
      <main className="lg:pl-[240px] pb-20 lg:pb-0 min-h-screen transition-all duration-200">
        {children}
      </main>

      {/* Command Palette */}
      <CommandPalette 
        isOpen={commandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)}
        onCreateQuickTask={handleCreateQuickTask}
      />

      {/* Quick Task Toast */}
      <AnimatePresence>
        {quickTaskToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-6 left-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-[#141414] border border-[#D9952A]/30 rounded-xl shadow-lg"
          >
            <CheckCircle2 className="w-5 h-5 text-[#D9952A]" />
            <span className="text-sm text-foreground">
              <span className="text-[#D9952A] font-medium">Quick-Task:</span> {quickTaskToast}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
