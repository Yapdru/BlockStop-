'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { label: 'Payments', href: '/payments', icon: '💰' },
  { label: 'Users', href: '/users', icon: '👥' },
  { label: 'Servers', href: '/servers', icon: '🖥️' },
  { label: 'Logs', href: '/logs', icon: '📝' },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-admin-bg text-admin-text">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarOpen ? 280 : 80,
        }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-b from-admin-card to-admin-bg border-r border-admin-border flex flex-col"
      >
        {/* Logo */}
        <div className="p-admin flex items-center justify-between h-16 border-b border-admin-border">
          {sidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1 className="text-admin-accent font-bold text-lg">AdminBlock</h1>
            </motion.div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-admin-border rounded-admin transition-colors"
          >
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-admin space-y-2 overflow-y-auto">
          {navItems.map(item => {
            const isActive = pathname.startsWith(item.href) && item.href !== '/dashboard';
            const isDashboard = pathname === '/dashboard' && item.href === '/dashboard';

            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-admin transition-colors ${
                    isActive || isDashboard
                      ? 'bg-admin-accent/20 text-admin-accent border-l-2 border-admin-accent'
                      : 'text-admin-text-muted hover:bg-admin-border/30 hover:text-admin-text'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {sidebarOpen && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-admin border-t border-admin-border text-center text-xs text-admin-text-muted">
          {sidebarOpen && <p>AdminBlock v1.0</p>}
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-admin-card border-b border-admin-border px-admin py-4 flex items-center justify-between">
          <div>
            <p className="text-admin-text-muted text-sm">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-admin-success animate-pulse" />
            <span className="text-xs text-admin-text-muted">System Online</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-admin max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
