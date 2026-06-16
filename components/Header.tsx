import Link from "next/link";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export function Header() {
  const navItems: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: "📊" },
    { label: "Email Checker", href: "/email-checker", icon: "📧" },
    { label: "File Scanner", href: "/file-scanner", icon: "📁" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-light-border">
      <nav className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent hover:opacity-80 transition">
          🛡️ BlockStop PRO
        </Link>

        <div className="flex items-center gap-8">
          <ul className="flex items-center gap-6">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-2 text-gray-700 hover:text-primary-600 transition font-medium"
                >
                  <span>{item.icon}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>

          <button className="px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:shadow-lg transition">
            Sign In
          </button>
        </div>
      </nav>
    </header>
  );
}
