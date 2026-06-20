'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface SidebarItem {
  label: string;
  href: string;
  icon?: string;
  badge?: number;
}

interface SidebarProps {
  items: SidebarItem[];
  title?: string;
  collapsed?: boolean;
}

export function Sidebar({ items, title = 'BlockStop', collapsed: initialCollapsed = false }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const pathname = usePathname();

  return (
    <div
      className={`${
        collapsed ? 'w-20' : 'w-64'
      } bg-neutral-0 border-r border-neutral-200 transition-all duration-300 flex flex-col h-screen sticky top-0 hidden md:flex`}
    >
      <div className="p-4 border-b border-neutral-200">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-between gap-2 hover:bg-primary-50 rounded px-2 py-1"
        >
          {!collapsed && (
            <span className="font-bold text-primary-600 truncate">{title}</span>
          )}
          <span className="text-lg">☰</span>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {items.map(item => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors relative group ${
                isActive
                  ? 'bg-primary-100 text-primary-600 font-semibold'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
              title={collapsed ? item.label : ''}
            >
              {item.icon && <span className="text-lg flex-shrink-0">{item.icon}</span>}
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="text-xs bg-danger text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </>
              )}
              {collapsed && item.badge && item.badge > 0 && (
                <span className="absolute right-1 top-1 text-xs bg-danger text-white rounded-full w-4 h-4 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
