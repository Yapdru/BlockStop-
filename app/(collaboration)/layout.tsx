import Link from "next/link";

export default function CollaborationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <nav className="bg-white border-b border-light-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-8 overflow-x-auto pb-2">
            <Link
              href="/"
              className="text-primary-600 hover:text-primary-700 font-semibold text-sm flex-shrink-0"
            >
              ← Home
            </Link>

            <div className="flex items-center gap-6 flex-shrink-0">
              <Link
                href="/knowledge-base"
                className="text-gray-700 hover:text-gray-900 font-semibold text-sm whitespace-nowrap"
              >
                📚 Knowledge Base
              </Link>
              <Link
                href="/playbooks"
                className="text-gray-700 hover:text-gray-900 font-semibold text-sm whitespace-nowrap"
              >
                📋 Playbooks
              </Link>
              <Link
                href="/runbooks"
                className="text-gray-700 hover:text-gray-900 font-semibold text-sm whitespace-nowrap"
              >
                ⚙️ Runbooks
              </Link>
              <Link
                href="/procedures"
                className="text-gray-700 hover:text-gray-900 font-semibold text-sm whitespace-nowrap"
              >
                📖 Procedures
              </Link>
              <Link
                href="/lessons-learned"
                className="text-gray-700 hover:text-gray-900 font-semibold text-sm whitespace-nowrap"
              >
                💡 Lessons Learned
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {children}
    </div>
  );
}
