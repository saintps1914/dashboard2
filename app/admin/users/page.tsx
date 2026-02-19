'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSessionRole, getSessionUser } from '@/lib/auth';
import type { PublicUser, WidgetToggles, VisibilitySettings } from '@/lib/userStore';

interface UserWithId extends PublicUser {
  id: string;
}

type VisibilityOptions = {
  managerTasks: string[];
  specialistTasks: string[];
  salesReport: string[];
  callsByManager: string[];
};

export default function UserSettingsPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserWithId[]>([]);
  const [originalUsers, setOriginalUsers] = useState<UserWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [addSaving, setAddSaving] = useState(false);
  const [editingUserIds, setEditingUserIds] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [visibilityOptions, setVisibilityOptions] = useState<VisibilityOptions>({
    managerTasks: [],
    specialistTasks: [],
    salesReport: [],
    callsByManager: [],
  });

  const currentUserId = getSessionUser()?.id;

  useEffect(() => {
    if (getSessionRole() !== 'admin') {
      router.replace('/dashboard');
      return;
    }

    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load users');
        const loaded = data.users || [];
        setUsers(loaded);
        setOriginalUsers(JSON.parse(JSON.stringify(loaded)));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [router]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await fetch('/api/users/visibility-options');
        const data = await res.json();
        if (data.success) {
          setVisibilityOptions({
            managerTasks: data.managerTasks ?? [],
            specialistTasks: data.specialistTasks ?? [],
            salesReport: data.salesReport ?? [],
            callsByManager: data.callsByManager ?? [],
          });
        }
      } catch {
        // ignore
      }
    };
    if (getSessionRole() === 'admin') fetchOptions();
  }, []);

  const hasUnsavedChanges = (userId: string) => {
    const u = users.find((x) => x.id === userId);
    const o = originalUsers.find((x) => x.id === userId);
    if (!u || !o) return false;
    return (
      JSON.stringify(u.widgets) !== JSON.stringify(o.widgets) ||
      JSON.stringify(u.visibility_settings ?? {}) !== JSON.stringify(o.visibility_settings ?? {})
    );
  };

  const handleToggleChange = (userId: string, field: keyof WidgetToggles, value: boolean) => {
    setError(null);
    setMessage(null);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, widgets: { ...u.widgets, [field]: value } } : u
      )
    );
  };

  const handleVisibilityChange = (userId: string, widgetId: keyof VisibilitySettings, names: string[]) => {
    setError(null);
    setMessage(null);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, visibility_settings: { ...(u.visibility_settings ?? {}), [widgetId]: names } }
          : u
      )
    );
  };

  const handleSaveUser = async (userId: string) => {
    const u = users.find((x) => x.id === userId);
    if (!u || !hasUnsavedChanges(userId)) return;

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          widgets: u.widgets,
          visibility_settings: u.visibility_settings ?? {},
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed');
      setOriginalUsers((prev) => prev.map((x) => (x.id === userId ? { ...u } : x)));
      setEditingUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      setMessage(`Saved ${u.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (userId: string) => {
    setEditingUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.firstName.trim() || !addForm.lastName.trim() || !addForm.email.trim()) return;

    setAddSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          firstName: addForm.firstName.trim(),
          lastName: addForm.lastName.trim(),
          email: addForm.email.trim().toLowerCase(),
          password: addForm.password.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed');

      const newUsers = await fetch('/api/users').then((r) => r.json());
      if (newUsers.users) {
        setUsers(newUsers.users);
        setOriginalUsers(JSON.parse(JSON.stringify(newUsers.users)));
      }
      setAddModalOpen(false);
      setAddForm({ firstName: '', lastName: '', email: '', password: '' });
      setMessage(`User ${data.user?.name} added. Password: ${data.generatedPassword || '(as entered)'}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setAddSaving(false);
    }
  };

  const handleGeneratePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let pwd = '';
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setAddForm((prev) => ({ ...prev, password: pwd }));
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUserId) {
      setError('Cannot delete yourself');
      setDeleteConfirm(null);
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/users?id=${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed');

      const newUsers = await fetch('/api/users').then((r) => r.json());
      if (newUsers.users) {
        setUsers(newUsers.users);
        setOriginalUsers(JSON.parse(JSON.stringify(newUsers.users)));
      }
      setDeleteConfirm(null);
      setMessage('User deleted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">User Settings</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => setAddModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              Add User
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            {message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manager Tasks</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specialist Tasks</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales Report</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Calls by Manager</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => {
                const isEditing = editingUserIds.has(user.id);
                const canEditToggles = isEditing;
                const isSelf = user.id === currentUserId;
                const adminCount = users.filter((u) => u.role === 'admin').length;
                const canDelete = !isSelf && (user.role !== 'admin' || adminCount > 1);

                return (
                  <>
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{user.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{user.email}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={
                          user.role === 'admin'
                            ? 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800'
                            : 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800'
                        }
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <input
                        type="checkbox"
                        checked={user.widgets.managerTasks}
                        onChange={(e) => handleToggleChange(user.id, 'managerTasks', e.target.checked)}
                        disabled={!canEditToggles}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <input
                        type="checkbox"
                        checked={user.widgets.specialistTasks}
                        onChange={(e) => handleToggleChange(user.id, 'specialistTasks', e.target.checked)}
                        disabled={!canEditToggles}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <input
                        type="checkbox"
                        checked={user.widgets.salesReport}
                        onChange={(e) => handleToggleChange(user.id, 'salesReport', e.target.checked)}
                        disabled={!canEditToggles}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <input
                        type="checkbox"
                        checked={user.widgets.callsByManager}
                        onChange={(e) => handleToggleChange(user.id, 'callsByManager', e.target.checked)}
                        disabled={!canEditToggles}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        {!isEditing ? (
                          <button
                            onClick={() => handleEditClick(user.id)}
                            className="text-blue-600 hover:underline text-xs"
                          >
                            ✏️ Edit
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleSaveUser(user.id)}
                              disabled={saving}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setUsers((prev) =>
                                  prev.map((x) =>
                                    x.id === user.id ? { ...originalUsers.find((o) => o.id === user.id)! } : x
                                  )
                                );
                                handleEditClick(user.id);
                              }}
                              className="text-gray-500 text-xs"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setDeleteConfirm(user.id)}
                            className="text-red-600 hover:underline text-xs"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isEditing && (
                    <tr className="bg-gray-50">
                      <td colSpan={8} className="px-4 py-3">
                        <div className="text-xs font-medium text-gray-600 mb-2">Видимость по виджетам (кого видит пользователь):</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <div className="text-xs font-medium text-gray-700 mb-1">Manager Tasks</div>
                            <div className="max-h-32 overflow-y-auto border rounded p-2 bg-white">
                              {visibilityOptions.managerTasks.map((name) => {
                                const list = (user.visibility_settings?.managerTasks ?? []) as string[];
                                const checked = list.some((n) => n.toLowerCase() === name.toLowerCase());
                                return (
                                  <label key={name} className="flex items-center gap-1 text-xs">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={(e) => {
                                        const next = e.target.checked
                                          ? [...list.filter((n) => n.toLowerCase() !== name.toLowerCase()), name]
                                          : list.filter((n) => n.toLowerCase() !== name.toLowerCase());
                                        handleVisibilityChange(user.id, 'managerTasks', next);
                                      }}
                                    />
                                    {name}
                                  </label>
                                );
                              })}
                              {visibilityOptions.managerTasks.length === 0 && <span className="text-gray-400">—</span>}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-700 mb-1">Specialist Tasks</div>
                            <div className="max-h-32 overflow-y-auto border rounded p-2 bg-white">
                              {visibilityOptions.specialistTasks.map((name) => {
                                const list = (user.visibility_settings?.specialistTasks ?? []) as string[];
                                const checked = list.some((n) => n.toLowerCase() === name.toLowerCase());
                                return (
                                  <label key={name} className="flex items-center gap-1 text-xs">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={(e) => {
                                        const next = e.target.checked
                                          ? [...list.filter((n) => n.toLowerCase() !== name.toLowerCase()), name]
                                          : list.filter((n) => n.toLowerCase() !== name.toLowerCase());
                                        handleVisibilityChange(user.id, 'specialistTasks', next);
                                      }}
                                    />
                                    {name}
                                  </label>
                                );
                              })}
                              {visibilityOptions.specialistTasks.length === 0 && <span className="text-gray-400">—</span>}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-700 mb-1">Sales Report</div>
                            <div className="max-h-32 overflow-y-auto border rounded p-2 bg-white">
                              {visibilityOptions.salesReport.map((name) => {
                                const list = (user.visibility_settings?.salesReport ?? []) as string[];
                                const checked = list.some((n) => n.toLowerCase() === name.toLowerCase());
                                return (
                                  <label key={name} className="flex items-center gap-1 text-xs">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={(e) => {
                                        const next = e.target.checked
                                          ? [...list.filter((n) => n.toLowerCase() !== name.toLowerCase()), name]
                                          : list.filter((n) => n.toLowerCase() !== name.toLowerCase());
                                        handleVisibilityChange(user.id, 'salesReport', next);
                                      }}
                                    />
                                    {name}
                                  </label>
                                );
                              })}
                              {visibilityOptions.salesReport.length === 0 && <span className="text-gray-400">—</span>}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-700 mb-1">Calls by Manager</div>
                            <div className="max-h-32 overflow-y-auto border rounded p-2 bg-white">
                              {visibilityOptions.callsByManager.map((name) => {
                                const list = (user.visibility_settings?.callsByManager ?? []) as string[];
                                const checked = list.some((n) => n.toLowerCase() === name.toLowerCase());
                                return (
                                  <label key={name} className="flex items-center gap-1 text-xs">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={(e) => {
                                        const next = e.target.checked
                                          ? [...list.filter((n) => n.toLowerCase() !== name.toLowerCase()), name]
                                          : list.filter((n) => n.toLowerCase() !== name.toLowerCase());
                                        handleVisibilityChange(user.id, 'callsByManager', next);
                                      }}
                                    />
                                    {name}
                                  </label>
                                );
                              })}
                              {visibilityOptions.callsByManager.length === 0 && <span className="text-gray-400">Загрузите CSV звонков</span>}
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Пустой список = видит всех. Отмеченные = видит только выбранных.</p>
                      </td>
                    </tr>
                  )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <p className="text-gray-800 mb-4">Are you sure you want to delete this user?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDeleteUser(deleteConfirm)}
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {saving ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {addModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-lg font-semibold mb-4">Add User</h2>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={addForm.firstName}
                    onChange={(e) => setAddForm((p) => ({ ...p, firstName: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={addForm.lastName}
                    onChange={(e) => setAddForm((p) => ({ ...p, lastName: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={addForm.password}
                      onChange={(e) => setAddForm((p) => ({ ...p, password: e.target.value }))}
                      placeholder="Leave empty to generate"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded"
                    />
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                    >
                      Generate
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={addSaving}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {addSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
