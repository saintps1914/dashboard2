'use client';

import { ReactNode, useState } from 'react';

interface WidgetProps {
  title: string;
  children: ReactNode;
  expandedContent?: ReactNode;
  subtitle?: string;
}

export default function Widget({ title, children, expandedContent, subtitle }: WidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleExpand = () => {
    setIsExpanded(true);
  };

  const handleClose = () => {
    setIsExpanded(false);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 flex flex-col h-[360px]">
        {/* Widget Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            <button
              onClick={handleExpand}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
            >
              Expand
            </button>
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>

        {/* Widget Content with Scroll */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>
      </div>

      {/* Expanded Modal Overlay */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={handleClose}
        >
          <div
            className="bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col max-w-6xl w-full max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Expanded Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Close
              </button>
            </div>

            {/* Expanded Content with Scroll */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {expandedContent || children}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

