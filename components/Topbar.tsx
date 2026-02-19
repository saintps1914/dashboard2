'use client';

import { useRouter } from 'next/navigation';
import { logout, getSessionRole } from '@/lib/auth';
import Image from 'next/image';

export default function Topbar() {
  const router = useRouter();
  const role = getSessionRole();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleUserSettings = () => {
    router.push('/admin/users');
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-800">Custom Dashboard</h1>
          </div>

          <div className="flex items-center justify-center">
            <Image
              src="/logo1.png"
              alt="logo1"
              width={180}
              height={60}
              className="object-contain"
              priority
            />
          </div>

          <div className="flex items-center space-x-3">
            {role === 'admin' && (
              <button
                onClick={handleUserSettings}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
              >
                User Settings
              </button>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
