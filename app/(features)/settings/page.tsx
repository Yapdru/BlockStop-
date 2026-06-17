'use client';

import React from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/app/components/layouts/DashboardLayout';
import { Breadcrumbs } from '@/app/components/layouts/Breadcrumbs';
import { ResponsiveGrid, GridItem } from '@/app/components/layouts/ResponsiveGrid';
import {
  User,
  Shield,
  Bell,
  Lock,
  ChevronRight,
  Users,
  CreditCard,
  Database,
} from 'lucide-react';

const SettingCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}> = ({ icon, title, description, href }) => (
  <Link href={href}>
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer group">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/30 transition-colors">
          {icon}
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
    </div>
  </Link>
);

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Breadcrumbs */}
          <Breadcrumbs items={[{ label: 'Settings' }]} />

          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your account and preferences</p>
          </div>

          {/* Account Settings */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Account</h2>
            <ResponsiveGrid columns={{ default: 1, sm: 2 }} gap="md">
              <SettingCard
                icon={<User className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                title="Profile"
                description="Update your personal information"
                href="/settings/account"
              />
              <SettingCard
                icon={<Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                title="Security"
                description="Password, 2FA, and login security"
                href="/settings/security"
              />
            </ResponsiveGrid>
          </div>

          {/* Preferences */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Preferences</h2>
            <ResponsiveGrid columns={{ default: 1, sm: 2 }} gap="md">
              <SettingCard
                icon={<Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                title="Notifications"
                description="Email, push, and SMS alerts"
                href="/settings/notifications"
              />
              <SettingCard
                icon={<Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                title="Privacy"
                description="Data usage and privacy settings"
                href="/settings/privacy"
              />
            </ResponsiveGrid>
          </div>

          {/* Team & Billing */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Organization</h2>
            <ResponsiveGrid columns={{ default: 1, sm: 2 }} gap="md">
              <SettingCard
                icon={<Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                title="Team"
                description="Manage team members and roles"
                href="/team"
              />
              <SettingCard
                icon={<CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                title="Billing"
                description="Payment method and invoices"
                href="/billing"
              />
            </ResponsiveGrid>
          </div>

          {/* Danger Zone */}
          <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg space-y-4">
            <h3 className="text-lg font-bold text-red-900 dark:text-red-200">Danger Zone</h3>
            <p className="text-sm text-red-800 dark:text-red-300">
              These actions cannot be undone. Please be careful.
            </p>
            <div className="flex flex-wrap gap-2">
              <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors">
                Export Data
              </button>
              <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
