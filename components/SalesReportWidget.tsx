'use client';

import { useState, useEffect, useCallback } from 'react';
import Widget from './Widget';
import EditableField from './EditableField';
import { getSessionUser } from '@/lib/auth';
import { formatTimestamp } from '@/lib/format';

const MARYNA_NAME = 'Maryna Shuliatytska';

type PeriodType = 'today' | 'last7' | 'last30';

export default function SalesReportWidget() {
  const [activePeriod, setActivePeriod] = useState<PeriodType>('today');
  const [activity, setActivity] = useState({
    calls: 0,
    answered: 0,
    conversations: 0,
    reportDate: null as string | null,
    uploadedAt: 0,
  });
  const [last7, setLast7] = useState({
    calls: 0,
    answered: 0,
    conversations: 0,
    coveredDays: 0,
    windowSize: 7,
  });
  const [last30, setLast30] = useState({
    calls: 0,
    answered: 0,
    conversations: 0,
    coveredDays: 0,
    windowSize: 30,
  });
  const [manualByDate, setManualByDate] = useState<Record<string, Record<string, { value: string | number; updatedAt: number; updatedBy: string }>>>({});
  const [loading, setLoading] = useState(true);
  const sessionUser = getSessionUser();
  const canEditManual = sessionUser?.name === MARYNA_NAME;

  const fetchActivity = useCallback(async () => {
    try {
      const [todayRes, last7Res, last30Res, manualRes] = await Promise.all([
        fetch('/api/calls/sales-activity?period=today'),
        fetch('/api/calls/sales-activity?period=last7'),
        fetch('/api/calls/sales-activity?period=last30'),
        fetch('/api/sales-manual'),
      ]);

      const todayData = await todayRes.json();
      const last7Data = await last7Res.json();
      const last30Data = await last30Res.json();
      const manualData = await manualRes.json();

      if (todayData.success && todayData.today) {
        setActivity({
          calls: todayData.today.calls,
          answered: todayData.today.answered,
          conversations: todayData.today.conversations,
          reportDate: todayData.reportDate,
          uploadedAt: todayData.today.uploadedAt,
        });
      } else {
        setActivity({ calls: 0, answered: 0, conversations: 0, reportDate: null, uploadedAt: 0 });
      }

      if (last7Data.success) {
        setLast7({
          calls: last7Data.calls ?? 0,
          answered: last7Data.answered ?? 0,
          conversations: last7Data.conversations ?? 0,
          coveredDays: last7Data.coveredDays ?? 0,
          windowSize: 7,
        });
      }

      if (last30Data.success) {
        setLast30({
          calls: last30Data.calls ?? 0,
          answered: last30Data.answered ?? 0,
          conversations: last30Data.conversations ?? 0,
          coveredDays: last30Data.coveredDays ?? 0,
          windowSize: 30,
        });
      }

      if (manualData.success && manualData.manualByDate) {
        setManualByDate(manualData.manualByDate);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const reportDate = activity.reportDate ?? new Date().toISOString().slice(0, 10);
  const manualToday = manualByDate[reportDate] ?? {};

  const handleSaveManual = async (
    field: 'interestedClients' | 'dealsClosed' | 'totalContractAmount' | 'firstPaymentAmount',
    value: string | number
  ) => {
    const res = await fetch('/api/sales-manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportDate, field, value }),
    });
    const result = await res.json();
    if (result.success) {
      setManualByDate(result.manualByDate ?? manualByDate);
    }
  };

  const formatCurrency = (v: string | number) => {
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    if (isNaN(n)) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
  };

  const activityLastUpdated = activity.uploadedAt ? formatTimestamp(activity.uploadedAt) : undefined;

  const Content = () => {
    if (loading) {
      return <div className="py-8 text-center text-gray-600">Loading...</div>;
    }

    return (
      <div className="space-y-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4">
            {[
              { id: 'today' as const, label: 'Today' },
              { id: 'last7' as const, label: 'Last 7 Days' },
              { id: 'last30' as const, label: 'Last 30 Days' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePeriod(p.id)}
                className={`py-2 px-4 text-sm font-medium border-b-2 transition ${
                  activePeriod === p.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </nav>
        </div>

        <div>
          <h4 className="text-base font-semibold text-gray-800 mb-3">1️⃣ Activity</h4>
          {activePeriod === 'today' && !activity.reportDate && (
            <p className="text-sm text-gray-500 mb-3">No call report uploaded yet.</p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="text-sm text-blue-600 mb-1">Calls</div>
              <div className="text-2xl font-bold text-blue-900">
                {activePeriod === 'today' ? activity.calls : activePeriod === 'last7' ? last7.calls : last30.calls}
              </div>
              {activePeriod === 'today' && activityLastUpdated && (
                <div className="text-xs text-gray-500 mt-1">Last updated: {activityLastUpdated}</div>
              )}
              {activePeriod === 'last7' && (
                <div className="text-xs text-gray-500 mt-1">Covered days: {last7.coveredDays} of 7</div>
              )}
              {activePeriod === 'last30' && (
                <div className="text-xs text-gray-500 mt-1">Covered days: {last30.coveredDays} of 30</div>
              )}
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <div className="text-sm text-green-600 mb-1">Answered</div>
              <div className="text-2xl font-bold text-green-900">
                {activePeriod === 'today' ? activity.answered : activePeriod === 'last7' ? last7.answered : last30.answered}
              </div>
              {activePeriod === 'today' && activityLastUpdated && (
                <div className="text-xs text-gray-500 mt-1">Last updated: {activityLastUpdated}</div>
              )}
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
              <div className="text-sm text-purple-600 mb-1">Conversations</div>
              <div className="text-2xl font-bold text-purple-900">
                {activePeriod === 'today' ? activity.conversations : activePeriod === 'last7' ? last7.conversations : last30.conversations}
              </div>
              {activePeriod === 'today' && activityLastUpdated && (
                <div className="text-xs text-gray-500 mt-1">Last updated: {activityLastUpdated}</div>
              )}
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
              <div className="text-sm text-orange-600 mb-1">Interested Clients</div>
              {activePeriod === 'today' ? (
                <EditableField
                  value={manualToday.interestedClients?.value ?? ''}
                  onSave={(v) => handleSaveManual('interestedClients', v)}
                  canEdit={canEditManual}
                  lastUpdated={manualToday.interestedClients?.updatedAt ? formatTimestamp(manualToday.interestedClients.updatedAt) : undefined}
                />
              ) : (
                <div className="text-2xl font-bold text-orange-900">—</div>
              )}
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-base font-semibold text-gray-800 mb-3">2️⃣ Sales</h4>
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
              <div className="text-sm text-indigo-600 mb-1">Deals Closed</div>
              {activePeriod === 'today' ? (
                <EditableField
                  value={manualToday.dealsClosed?.value ?? ''}
                  onSave={(v) => handleSaveManual('dealsClosed', v)}
                  canEdit={canEditManual}
                  lastUpdated={manualToday.dealsClosed?.updatedAt ? formatTimestamp(manualToday.dealsClosed.updatedAt) : undefined}
                />
              ) : (
                <div className="text-2xl font-bold text-indigo-900">—</div>
              )}
            </div>
            <div className="bg-teal-50 rounded-lg p-4 border border-teal-100">
              <div className="text-sm text-teal-600 mb-1">Total Contract Amount</div>
              {activePeriod === 'today' ? (
                <EditableField
                  value={manualToday.totalContractAmount?.value ?? ''}
                  displayValue={manualToday.totalContractAmount ? formatCurrency(manualToday.totalContractAmount.value) : '—'}
                  onSave={(v) => handleSaveManual('totalContractAmount', v)}
                  canEdit={canEditManual}
                  formatValue={formatCurrency}
                  lastUpdated={manualToday.totalContractAmount?.updatedAt ? formatTimestamp(manualToday.totalContractAmount.updatedAt) : undefined}
                />
              ) : (
                <div className="text-2xl font-bold text-teal-900">—</div>
              )}
            </div>
            <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-100">
              <div className="text-sm text-cyan-600 mb-1">First Payment Amount</div>
              {activePeriod === 'today' ? (
                <EditableField
                  value={manualToday.firstPaymentAmount?.value ?? ''}
                  displayValue={manualToday.firstPaymentAmount ? formatCurrency(manualToday.firstPaymentAmount.value) : '—'}
                  onSave={(v) => handleSaveManual('firstPaymentAmount', v)}
                  canEdit={canEditManual}
                  formatValue={formatCurrency}
                  lastUpdated={manualToday.firstPaymentAmount?.updatedAt ? formatTimestamp(manualToday.firstPaymentAmount.updatedAt) : undefined}
                />
              ) : (
                <div className="text-2xl font-bold text-cyan-900">—</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Widget title="Sales Daily Report" expandedContent={<Content />}>
      <Content />
    </Widget>
  );
}
