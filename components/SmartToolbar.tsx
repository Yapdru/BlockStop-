'use client';

import React from 'react';

export interface ToolbarAction {
  id: string;
  label: string;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
}

interface SmartToolbarProps {
  actions: ToolbarAction[];
  context?: string;
}

export function SmartToolbar({ actions, context }: SmartToolbarProps) {
  return (
    <div className="fixed bottom-24 right-6 flex flex-col gap-2 animate-slideUp z-40">
      {context && (
        <div className="text-xs text-neutral-600 text-right mb-2 px-2">
          {context}
        </div>
      )}
      <div className="bg-white border border-neutral-200 rounded-lg shadow-lg p-1 flex gap-1 flex-col">
        {actions.map(action => (
          <button
            key={action.id}
            onClick={action.onClick}
            disabled={action.disabled}
            title={action.label}
            className={`p-3 rounded transition-colors text-xl ${
              action.disabled
                ? 'text-neutral-300 cursor-not-allowed'
                : 'text-neutral-700 hover:bg-primary-50 hover:text-primary-600'
            }`}
          >
            {action.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
