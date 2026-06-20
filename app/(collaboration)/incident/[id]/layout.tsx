import Link from "next/link";

export default function IncidentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const navItems = [
    { href: `/incident/${params.id}/investigation`, label: "🔍 Investigation" },
    { href: `/incident/${params.id}/chat`, label: "💬 Chat" },
    { href: `/incident/${params.id}/timeline`, label: "📅 Timeline" },
    { href: `/incident/${params.id}/evidence`, label: "📄 Evidence" },
    { href: `/incident/${params.id}/assignments`, label: "✓ Assignments" },
  ];

  return (
    <div className="min-h-screen">
      <nav className="bg-white border-b border-light-border sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between overflow-x-auto">
          <Link
            href="/incidents"
            className="text-primary-600 hover:text-primary-700 font-semibold text-sm flex-shrink-0 whitespace-nowrap mr-6"
          >
            ← Incidents
          </Link>

          <div className="flex items-center gap-4 overflow-x-auto pb-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-semibold text-sm rounded-lg hover:bg-light-surface transition whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {children}
    </div>
  );
}
