'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  CheckSquare,
  Target,
  Repeat,
  BarChart3,
  Settings,
  LogOut,
  Command,
  ChevronLeft,
  Flame,
  Sparkles,
  User,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase';

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard', shortcut: 'D' },
  { href: '/tasks', icon: CheckSquare, label: 'Tasks', shortcut: 'T' },
  { href: '/habits', icon: Repeat, label: 'Habits', shortcut: 'H' },
  { href: '/goals', icon: Target, label: 'Ziele', shortcut: 'G' },
  { href: '/akademie', icon: GraduationCap, label: 'Akademie', shortcut: 'L' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics', shortcut: 'A' },
];

const bottomItems = [
  { href: '/settings', icon: Settings, label: 'Settings', shortcut: 'S' },
];

interface SidebarProps {
  onOpenCommandPalette: () => void;
}

export function Sidebar({ onOpenCommandPalette }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user, signOut } = useAuth();
  const [streak, setStreak] = useState({ current: 0, best: 0 });
  
  // Get user name from metadata or email
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  // Fetch streak data
  useEffect(() => {
    async function fetchStreak() {
      if (!user?.email) return;
      
      const supabase = createClient();
      
      // First get the user ID from users table
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();
      
      if (!userData?.id) return;
      
      // Then get the best streak from habits
      const { data: habitData } = await supabase
        .from('habits')
        .select('current_streak, best_streak')
        .eq('user_id', userData.id)
        .eq('is_active', true)
        .order('current_streak', { ascending: false })
        .limit(1)
        .single();
      
      if (habitData) {
        setStreak({
          current: habitData.current_streak || 0,
          best: habitData.best_streak || 0,
        });
      }
    }
    
    fetchStreak();
  }, [user?.email]);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="h-screen bg-[#0a0a0a] border-r border-[#1a1a1a] flex-col fixed left-0 top-0 z-40 hidden lg:flex"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-[#1a1a1a]">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D94F3D] to-[#D9952A] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-foreground">Peak Coach</span>
            </motion.div>
          )}
        </AnimatePresence>
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D94F3D] to-[#D9952A] flex items-center justify-center mx-auto">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-[#1a1a1a] text-muted-foreground hover:text-foreground transition-colors"
        >
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }}>
            <ChevronLeft className="w-4 h-4" />
          </motion.div>
        </button>
      </div>

      {/* Command Palette Trigger */}
      <div className="px-3 py-4">
        <button
          onClick={onOpenCommandPalette}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#141414] border border-[#1f1f1f] hover:border-[#2a2a2a] transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <Command className="w-4 h-4 text-muted-foreground" />
          {!collapsed && (
            <>
              <span className="text-sm text-muted-foreground flex-1 text-left">Suchen...</span>
              <kbd className="text-[10px] text-muted-foreground bg-[#1a1a1a] px-1.5 py-0.5 rounded">
                Cmd+K
              </kbd>
            </>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    collapsed ? 'justify-center' : ''
                  } ${
                    isActive
                      ? 'bg-[#D94F3D]/10 text-[#D94F3D]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-[#141414]'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-[#D94F3D]' : ''}`} />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-sm font-medium">{item.label}</span>
                      <kbd className="text-[10px] text-muted-foreground/50">{item.shortcut}</kbd>
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Streak Widget */}
      {!collapsed && (
        <div className="px-3 py-4 mx-3 mb-2 rounded-xl bg-gradient-to-br from-[#D94F3D]/10 to-[#D9952A]/5 border border-[#D94F3D]/10">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-[#D94F3D]" />
            <span className="text-xs font-medium text-[#D94F3D]">Streak</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{streak.current} Tage</p>
          <p className="text-xs text-muted-foreground">Bester: {streak.best} Tage</p>
        </div>
      )}

      {/* User Profile */}
      {!collapsed && (
        <div className="px-3 py-3 mx-3 mb-2 rounded-xl bg-[#141414] border border-[#1f1f1f]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D94F3D] to-[#D9952A] flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="px-3 py-4 border-t border-[#1a1a1a]">
        <ul className="space-y-1">
          {bottomItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    collapsed ? 'justify-center' : ''
                  } ${
                    isActive
                      ? 'bg-[#D94F3D]/10 text-[#D94F3D]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-[#141414]'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              onClick={signOut}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-400/5 transition-all ${
                collapsed ? 'justify-center' : ''
              }`}
            >
              <LogOut className="w-5 h-5" />
              {!collapsed && <span className="text-sm font-medium">Logout</span>}
            </button>
          </li>
        </ul>
      </div>
    </motion.aside>
  );
}
