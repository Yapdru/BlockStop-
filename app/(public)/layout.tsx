'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-blue-400">
              BlockStop
            </Link>

            <div className="hidden md:flex space-x-8">
              <Link href="/products" className="hover:text-blue-400 transition">Products</Link>
              <Link href="/pricing" className="hover:text-blue-400 transition">Pricing</Link>
              <Link href="/features" className="hover:text-blue-400 transition">Features</Link>
              <Link href="/auth/login" className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 transition">
                Sign In
              </Link>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-400"
            >
              ☰
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-2">
              <Link href="/products" className="block py-2 hover:text-blue-400">Products</Link>
              <Link href="/pricing" className="block py-2 hover:text-blue-400">Pricing</Link>
              <Link href="/features" className="block py-2 hover:text-blue-400">Features</Link>
              <Link href="/auth/login" className="block bg-blue-600 px-4 py-2 rounded hover:bg-blue-700">
                Sign In
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-700 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400">
          <p>&copy; 2024 BlockStop. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
