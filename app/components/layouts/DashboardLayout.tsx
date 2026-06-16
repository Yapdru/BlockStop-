'use client';

import React, { ReactNode, useState } from 'react';
import { SidebarNav } from './SidebarNav';
import { TopNav } from './TopNav';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <SidebarNav isOpen={sidebarOpen} onToggle={toggleSidebar} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation */}
        <TopNav onMenuClick={toggleSidebar} />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="flex flex-col h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
