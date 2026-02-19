'use client';

import { useState } from 'react';

interface EditableFieldProps {
  value: string | number;
  displayValue?: string;
  onSave: (value: string | number) => Promise<void>;
  canEdit: boolean;
  label?: string;
  type?: 'text' | 'number';
  lastUpdated?: string;
  formatValue?: (v: string | number) => string;
  inputClassName?: string;
}

export default function EditableField({
  value,
  displayValue,
  onSave,
  canEdit,
  label,
  type = 'text',
  lastUpdated,
  formatValue,
  inputClassName = '',
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value ?? ''));
  const [saving, setSaving] = useState(false);

  const display = displayValue ?? (formatValue ? formatValue(value) : String(value ?? '—'));

  const handleSave = async () => {
    if (!canEdit) return;
    setSaving(true);
    try {
      const v = type === 'number' ? (editValue === '' ? 0 : Number(editValue)) : editValue;
      await onSave(v);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    if (!canEdit) return;
    setEditValue(String(value ?? ''));
    setIsEditing(true);
  };

  if (!canEdit) {
    return (
      <div className="group relative">
        {label && <div className="text-sm text-gray-600 mb-1">{label}</div>}
        <div className="text-2xl font-bold text-gray-900">{display}</div>
        {lastUpdated && (
          <div className="text-xs text-gray-400 mt-1">Last updated: {lastUpdated}</div>
        )}
      </div>
    );
  }

  if (isEditing) {
    return (
      <div>
        {label && <div className="text-sm text-gray-600 mb-1">{label}</div>}
        <div className="flex items-center gap-2">
          <input
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className={`px-3 py-1.5 border border-gray-300 rounded text-lg ${inputClassName}`}
            autoFocus
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative cursor-pointer"
      onMouseEnter={() => {}}
      onMouseLeave={() => {}}
    >
      {label && <div className="text-sm text-gray-600 mb-1">{label}</div>}
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-gray-900 select-none">{display}</span>
        <span
          onClick={handleEdit}
          className="opacity-0 group-hover:opacity-100 text-sm cursor-pointer transition"
          title="Edit"
        >
          ✏️ Edit
        </span>
      </div>
      {lastUpdated && (
        <div className="text-xs text-gray-400 mt-1">Last updated: {lastUpdated}</div>
      )}
    </div>
  );
}
