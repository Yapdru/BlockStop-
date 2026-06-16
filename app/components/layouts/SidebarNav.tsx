'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Mail,
  FileText,
  Settings,
  Users,
  CreditCard,
  Search,
  Activity,
  Shield,
  AlertCircle,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  submenu?: NavItem[];
}

interface SidebarNavProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: 'Email Scanner',
    href: '/email-checker',
    icon: <Mail className="w-5 h-5" />,
  },
  {
    label: 'File Scanner',
    href: '/file-scanner',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    label: 'Threat Hunting',
    href: '/threat-hunting',
    icon: <Search className="w-5 h-5" />,
  },
  {
    label: 'Behavioral Analytics',
    href: '/behavioral-analytics',
    icon: <Activity className="w-5 h-5" />,
  },
  {
    label: 'Forensics',
    href: '/forensics',
    icon: <Shield className="w-5 h-5" />,
  },
  {
    label: 'Incident Response',
    href: '/incident-response',
    icon: <AlertCircle className="w-5 h-5" />,
  },
  {
    label: 'Team',
    href: '/team',
    icon: <Users className="w-5 h-5" />,
  },
  {
    label: 'Billing',
    href: '/billing',
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: <Settings className="w-5 h-5" />,
    submenu: [
      { label: 'Account', href: '/settings/account', icon: null },
      { label: 'Security', href: '/settings/security', icon: null },
      { label: 'Notifications', href: '/settings/notifications', icon: null },
      { label: 'Privacy', href: '/settings/privacy', icon: null },
    ],
  },
];

const NavLink: React.FC<{
  item: NavItem;
  isActive: boolean;
  hasSubmenu?: boolean;
}> = ({ item, isActive, hasSubmenu = false }) => {
  const [submenuOpen, setSubmenuOpen] = React.useState(false);

  return (
    <div>
      <Link
        href={item.href}
        className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
          isActive
            ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        onClick={(e) => {
          if (hasSubmenu) {
            e.preventDefault();
            setSubmenuOpen(!submenuOpen);
          }
        }}
      >
        <span className="flex items-center gap-3">
          {item.icon}
          <span className="font-medium">{item.label}</span>
        </span>
        <div className="flex items-center gap-2">
          {item.badge && (
            <span className="px-2 py-1 text-xs font-semibold bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-full">
              {item.badge}
            </span>
          )}
          {hasSubmenu && (
            <ChevronDown
              className={`w-4 h-4 transition-transform ${submenuOpen ? 'rotate-180' : ''}`}
            />
          )}
        </div>
      </Link>

      {/* Submenu */}
      {hasSubmenu && submenuOpen && item.submenu && (
        <div className="mt-2 ml-4 space-y-1 border-l-2 border-gray-200 dark:border-gray-700">
          {item.submenu.map((subitem) => (
            <Link
              key={subitem.href}
              href={subitem.href}
              className="block px-4 py-2 text-sm rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {subitem.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export const SidebarNav: React.FC<SidebarNavProps> = ({ isOpen, onToggle }) => {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-40"
          onClick={onToggle}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static top-0 left-0 z-50 h-screen w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 lg:translate-x-0 overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo Area */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">BS</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">BlockStop</h1>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
              hasSubmenu={!!item.submenu}
            />
          ))}
        </nav>
      </aside>

      {/* Mobile Menu Toggle - visible only when sidebar is closed */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="lg:hidden fixed bottom-8 right-8 z-40 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}
    </>
  );
};
