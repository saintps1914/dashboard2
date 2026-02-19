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

export default function CallsByManagerWidget() {
  const [data, setData] = useState<ManagerRow[]>([]);
  const [reportDate, setReportDate] = useState<string | null>(null);
  const [uploadedAt, setUploadedAt] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
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
      </div>
    );
  };

  return (
    <Widget title="Calls by Manager" subtitle={subtitle} expandedContent={<Content />}>
      <Content />
    </Widget>
  );
}
