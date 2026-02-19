'use client';

import { useState, useEffect, useCallback } from 'react';
import Widget from './Widget';
import { getSessionRole } from '@/lib/auth';
import { formatTimestamp } from '@/lib/format';

interface ManagerRow {
  managerName: string;
  totalCalls: number;
  answeredCalls: number;
  callsOver30Sec: number;
}

interface MissedRow {
  managerName: string;
  contactName: string;
  dateTime: string;
  status: string;
  calledBack: boolean;
}

type TabId = 'stats' | 'missed';

export default function CallsByManagerWidget() {
  const [data, setData] = useState<ManagerRow[]>([]);
  const [reportDate, setReportDate] = useState<string | null>(null);
  const [uploadedAt, setUploadedAt] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('stats');
  const [missed, setMissed] = useState<MissedRow[]>([]);
  const [missedManagerNames, setMissedManagerNames] = useState<string[]>([]);
  const [missedLoading, setMissedLoading] = useState(false);
  const [managerFilter, setManagerFilter] = useState<string>('');
  const isAdmin = getSessionRole() === 'admin';

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/calls/data');
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed');
      }
      const latest = result.latest;
      if (latest) {
        setData(latest.perManager || []);
        setReportDate(latest.reportDate || null);
        setUploadedAt(latest.uploadedAt || 0);
      } else {
        setData([]);
        setReportDate(null);
        setUploadedAt(0);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchMissed = useCallback(async () => {
    setMissedLoading(true);
    try {
      const url = managerFilter
        ? `/api/calls/missed?manager=${encodeURIComponent(managerFilter)}`
        : '/api/calls/missed';
      const res = await fetch(url);
      const result = await res.json();
      if (res.ok && result.success) {
        setMissed(result.missed ?? []);
        setMissedManagerNames(result.managerNames ?? []);
      }
    } finally {
      setMissedLoading(false);
    }
  }, [managerFilter]);

  useEffect(() => {
    if (activeTab === 'missed') fetchMissed();
  }, [activeTab, fetchMissed]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload/calls', { method: 'POST', body: fd });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Upload failed');
      await fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const subtitle = uploadedAt
    ? `Last updated: ${formatTimestamp(uploadedAt)}`
    : undefined;

  const Content = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-600">Loading...</div>
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-red-600 text-sm">{error}</div>
        </div>
      );
    }
    if (data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 gap-4">
          <div className="text-gray-600 text-sm">No call report uploaded yet.</div>
          {isAdmin && (
            <label className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 cursor-pointer">
              {uploading ? 'Uploading...' : 'Upload CSV'}
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {reportDate && (
          <div className="text-sm text-gray-600">
            Calls for {reportDate}
          </div>
        )}
        {isAdmin && (
          <div className="flex justify-end">
            <label className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 cursor-pointer">
              {uploading ? 'Uploading...' : 'Upload CSV'}
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
          </div>
        )}
        <div className="border-b border-gray-200">
          <nav className="flex gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('stats')}
              className={`py-2 px-1 border-b-2 text-sm font-medium ${
                activeTab === 'stats'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Статистика
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('missed')}
              className={`py-2 px-1 border-b-2 text-sm font-medium ${
                activeTab === 'missed'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Пропущенные звонки
            </button>
          </nav>
        </div>

        {activeTab === 'stats' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manager</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Calls</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Answered</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">&gt;30 sec</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{row.managerName}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{row.totalCalls}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{row.answeredCalls}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{row.callsOver30Sec}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'missed' && (
          <div className="space-y-3">
            {missedManagerNames.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Менеджер:</label>
                <select
                  value={managerFilter}
                  onChange={(e) => setManagerFilter(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value="">Все</option>
                  {missedManagerNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            )}
            {missedLoading ? (
              <div className="py-4 text-center text-gray-600 text-sm">Загрузка...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Менеджер</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Клиент</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата и время</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Перезвонили</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {missed.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{row.managerName}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{row.contactName}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{row.dateTime}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{row.status}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{row.calledBack ? 'Да' : 'Нет'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {missed.length === 0 && !missedLoading && (
                  <div className="py-4 text-center text-gray-500 text-sm">Нет пропущенных звонков</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Widget title="Calls by Manager" subtitle={subtitle} expandedContent={<Content />}>
      <Content />
    </Widget>
  );
}
