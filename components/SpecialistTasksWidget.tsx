'use client';

import { useState, useEffect, useCallback } from 'react';
import Widget from './Widget';
import { getSessionRole } from '@/lib/auth';
import { formatTimestamp } from '@/lib/format';

const CONTACT_BASE_URL = 'https://app.prosbuddy.com/v2/location/XTqqycBohnAAVy4uneZR/contacts/detail/';

type TabType = 'totals' | 'all' | 'overdue' | 'dueToday';

interface Task {
  clientName: string;
  contactId: string;
  taskTitle: string;
  dueDate: string;
}

interface Totals {
  openTasks: number;
  overdue: number;
  dueToday: number;
  oldestOverdue: number;
  completedYesterday: number;
}

export default function SpecialistTasksWidget() {
  const [activeTab, setActiveTab] = useState<TabType>('totals');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [totals, setTotals] = useState<Totals>({
    openTasks: 0,
    overdue: 0,
    dueToday: 0,
    oldestOverdue: 0,
    completedYesterday: 0,
  });
  const [uploadedAt, setUploadedAt] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const isAdmin = getSessionRole() === 'admin';

  const fetchData = useCallback(async (tab: TabType) => {
    try {
      setLoading(true);
      setError(null);

      if (tab === 'totals') {
        const res = await fetch('/api/tasks/data?type=specialist&filter=totals');
        const result = await res.json();
        if (!res.ok || !result.success) {
          if (result.error === 'No tasks mapping for this user') {
            setError('No tasks mapping for this user');
            setTotals({ openTasks: 0, overdue: 0, dueToday: 0, oldestOverdue: 0, completedYesterday: 0 });
            return;
          }
          throw new Error(result.error || 'Failed');
        }
        setTotals(result.data || totals);
        setUploadedAt(result.uploadedAt ?? 0);
      } else {
        const res = await fetch(`/api/tasks/data?type=specialist&filter=${tab}`);
        const result = await res.json();
        if (!res.ok || !result.success) {
          if (result.error === 'No tasks mapping for this user') {
            setError('No tasks mapping for this user');
            setTasks([]);
            return;
          }
          throw new Error(result.error || 'Failed');
        }
        setTasks(result.data || []);
        setUploadedAt(result.uploadedAt ?? 0);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab, fetchData]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      await fetchData(activeTab);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const subtitle = uploadedAt
    ? `Tasks last updated: ${formatTimestamp(uploadedAt)}`
    : error === 'No tasks mapping for this user'
      ? undefined
      : 'No tasks file uploaded yet.';

  const tabs: { id: TabType; label: string }[] = [
    { id: 'totals', label: 'Totals' },
    { id: 'all', label: 'All Tasks' },
    { id: 'overdue', label: 'Overdue' },
    { id: 'dueToday', label: 'Due Today' },
  ];

  const TotalsContent = () => {
    if (loading) return <div className="py-8 text-center text-gray-600">Loading...</div>;
    if (error) return <div className="py-8 text-center text-red-600 text-sm">{error}</div>;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Open Tasks</div>
            <div className="text-2xl font-bold text-gray-900">{totals.openTasks}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Overdue</div>
            <div className="text-2xl font-bold text-red-600">{totals.overdue}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Due Today</div>
            <div className="text-2xl font-bold text-yellow-600">{totals.dueToday}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Oldest Overdue</div>
            <div className="text-2xl font-bold text-gray-900">{totals.oldestOverdue} days</div>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Completed Yesterday</div>
          <div className="text-2xl font-bold text-green-600">{totals.completedYesterday}</div>
        </div>
      </div>
    );
  };

  const TasksTable = () => {
    if (loading) return <div className="py-8 text-center text-gray-600">Loading tasks...</div>;
    if (error) return <div className="py-8 text-center text-red-600 text-sm">{error}</div>;
    if (tasks.length === 0) return <div className="py-8 text-center text-gray-600 text-sm">No tasks found</div>;

    return (
      <div className="space-y-4">
        {isAdmin && !uploadedAt && (
          <label className="inline-block px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 cursor-pointer">
            {uploading ? 'Uploading...' : 'Upload Tasks XLSX'}
            <input type="file" accept=".xlsx" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.map((task, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    <a
                      href={`${CONTACT_BASE_URL}${task.contactId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {task.clientName}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{task.taskTitle}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{task.dueDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const Content = () => (
    <div className="space-y-4">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-4 text-sm font-medium border-b-2 transition ${
                activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div>{activeTab === 'totals' ? <TotalsContent /> : <TasksTable />}</div>
    </div>
  );

  return (
    <Widget title="Specialist Tasks" subtitle={subtitle} expandedContent={<Content />}>
      <Content />
    </Widget>
  );
}
