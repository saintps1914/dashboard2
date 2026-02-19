'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSessionWidgets, isAuthenticated } from '@/lib/auth';
import type { WidgetToggles } from '@/lib/userStore';
import Topbar from '@/components/Topbar';
import ManagerTasksWidget from '@/components/ManagerTasksWidget';
import SpecialistTasksWidget from '@/components/SpecialistTasksWidget';
import SalesReportWidget from '@/components/SalesReportWidget';
import CallsByManagerWidget from '@/components/CallsByManagerWidget';

const DEFAULT_WIDGETS: WidgetToggles = {
  managerTasks: true,
  specialistTasks: true,
  salesReport: true,
  callsByManager: true,
};

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [widgets, setWidgets] = useState<WidgetToggles | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }

    const sessionWidgets = getSessionWidgets();
    setWidgets(sessionWidgets ?? DEFAULT_WIDGETS);
    setLoading(false);
  }, [router]);

  if (loading || !widgets) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {widgets.managerTasks && <ManagerTasksWidget />}
          {widgets.specialistTasks && <SpecialistTasksWidget />}
          {widgets.salesReport && <SalesReportWidget />}
          {widgets.callsByManager && <CallsByManagerWidget />}
        </div>
      </main>
    </div>
  );
}
