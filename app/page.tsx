'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        try {
          if (isAuthenticated()) {
            router.replace('/dashboard');
          } else {
            router.replace('/login');
          }
        } catch (err) {
          console.error('Auth error:', err);
          router.replace('/login');
        }
      }
    };
    
    // Small delay to ensure everything is ready
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-gray-600">Loading...</div>
    </div>
  );
}

