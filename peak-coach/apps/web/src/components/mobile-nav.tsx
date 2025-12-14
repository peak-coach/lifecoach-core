'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  CheckSquare,
  Repeat,
  Target,
  Settings,
} from 'lucide-react';

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Home' },
  { href: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { href: '/habits', icon: Repeat, label: 'Habits' },
  { href: '/goals', icon: Target, label: 'Ziele' },
  { href: '/settings', icon: Settings, label: 'Mehr' },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Gradient fade */}
      <div className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
      
      {/* Nav bar */}
      <div className="bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-[#1a1a1a] px-2 pb-safe">
        <ul className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            
            return (
              <li key={item.href} className="relative">
                <Link
                  href={item.href}
                  className={`flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all ${
                    isActive 
                      ? 'text-[#D94F3D]' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-indicator"
                      className="absolute inset-0 bg-[#D94F3D]/10 rounded-2xl"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  
                  <item.icon className={`w-5 h-5 relative z-10 ${isActive ? 'text-[#D94F3D]' : ''}`} />
                  <span className={`text-[10px] mt-1 font-medium relative z-10 ${isActive ? 'text-[#D94F3D]' : ''}`}>
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

