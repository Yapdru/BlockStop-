'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

interface BottomNavProps {
  items: NavItem[];
  userTier?: 'free' | 'neo' | 'pro' | 'office' | 'health' | 'max';
}

export function BottomNav({ items, userTier = 'free' }: BottomNavProps) {
  const pathname = usePathname();

  // NEO tier doesn't get bottom nav
  if (userTier === 'neo') return null;

  const defaultItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: '📊' },
    { label: 'Analyze', href: '/analyze', icon: '🔍' },
    { label: 'BetterBot', href: '/betterbot', icon: '🤖', badge: 0 },
    { label: 'Billing', href: '/billing', icon: '💳' },
    { label: 'Settings', href: '/settings', icon: '⚙️' },
  ];

  const navItems = items.length > 0 ? items : defaultItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-neutral-0 border-t border-neutral-200 z-40 md:hidden">
      <div className="flex justify-around items-center h-20">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors relative ${
                isActive
                  ? 'text-primary-500 border-t-2 border-primary-500'
                  : 'text-neutral-600 hover:text-primary-400'
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="absolute top-1 right-2 bg-danger text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
