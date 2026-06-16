export function Footer() {
  return (
    <footer className="bg-white border-t border-light-border mt-12">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-primary-600 transition">Features</a></li>
              <li><a href="#" className="hover:text-primary-600 transition">Pricing</a></li>
              <li><a href="#" className="hover:text-primary-600 transition">Status</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-primary-600 transition">About</a></li>
              <li><a href="#" className="hover:text-primary-600 transition">Blog</a></li>
              <li><a href="#" className="hover:text-primary-600 transition">Careers</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-primary-600 transition">Documentation</a></li>
              <li><a href="#" className="hover:text-primary-600 transition">Support</a></li>
              <li><a href="#" className="hover:text-primary-600 transition">API</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-primary-600 transition">Privacy</a></li>
              <li><a href="#" className="hover:text-primary-600 transition">Terms</a></li>
              <li><a href="#" className="hover:text-primary-600 transition">Security</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-light-border pt-8">
          <div className="flex justify-between items-center">
            <p className="text-gray-600 text-sm">
              © 2026 BlockStop PRO. All rights reserved.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-600 hover:text-primary-600 text-2xl">𝕏</a>
              <a href="#" className="text-gray-600 hover:text-primary-600 text-2xl">f</a>
              <a href="#" className="text-gray-600 hover:text-primary-600 text-2xl">in</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
