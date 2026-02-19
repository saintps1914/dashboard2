'use client';

import { useState, useEffect, useCallback } from 'react';
import Widget from './Widget';
import { getSessionRole } from '@/lib/auth';
import { formatTimestamp } from '@/lib/format';

interface ManagerTask {
  userName: string;
  openTasks: number;
  overdue: number;
  dueToday: number;
  oldestOverdue: number;
  completedYesterday: number;
}

export default function ManagerTasksWidget() {
  const [data, setData] = useState<ManagerTask[]>([]);
  const [uploadedAt, setUploadedAt] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const isAdmin = getSessionRole() === 'admin';

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/tasks/data?type=manager');
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to load tasks data');
      }

      setData(result.data || []);
      setUploadedAt(result.uploadedAt || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUploadTasks = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload/tasks', { method: 'POST', body: fd });
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

  const handleUploadContacts = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload/contacts', { method: 'POST', body: fd });
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
    ? `Tasks last updated: ${formatTimestamp(uploadedAt)}`
    : undefined;

  const TableContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-600">Loading tasks...</div>
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
    if (data.length === 0 && !uploadedAt) {
      return (
        <div className="flex flex-col items-center justify-center py-8 gap-4">
          <div className="text-gray-600 text-sm">No tasks file uploaded yet.</div>
          {isAdmin && (
            <div className="flex gap-2">
              <label className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 cursor-pointer">
                {uploading ? 'Uploading...' : 'Upload Tasks XLSX'}
                <input type="file" accept=".xlsx" className="hidden" onChange={handleUploadTasks} disabled={uploading} />
              </label>
              <label className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 cursor-pointer">
                {uploading ? 'Uploading...' : 'Upload Contacts XLSX'}
                <input type="file" accept=".xlsx" className="hidden" onChange={handleUploadContacts} disabled={uploading} />
              </label>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {isAdmin && (
          <div className="flex justify-end gap-2">
            <label className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 cursor-pointer">
              {uploading ? 'Uploading...' : 'Upload Tasks XLSX'}
              <input type="file" accept=".xlsx" className="hidden" onChange={handleUploadTasks} disabled={uploading} />
            </label>
            <label className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 cursor-pointer">
              {uploading ? 'Uploading...' : 'Upload Contacts XLSX'}
              <input type="file" accept=".xlsx" className="hidden" onChange={handleUploadContacts} disabled={uploading} />
            </label>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Open Tasks</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overdue</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Today</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Oldest Overdue (days)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed Yesterday</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((user, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{user.userName}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{user.openTasks}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {user.overdue > 0 ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">{user.overdue}</span>
                    ) : (
                      <span className="text-gray-700">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {user.dueToday > 0 ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">{user.dueToday}</span>
                    ) : (
                      <span className="text-gray-700">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{user.oldestOverdue}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{user.completedYesterday}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <Widget title="Manager Tasks Overview" subtitle={subtitle} expandedContent={<TableContent />}>
      <TableContent />
    </Widget>
  );
}
