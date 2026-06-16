import { Suspense } from 'react';
import { LoginContent } from './login-content';

function LoginFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-light-bg via-primary-50 to-primary-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}
