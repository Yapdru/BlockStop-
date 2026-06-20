'use client';

import React, { useState, useEffect } from 'react';

interface Command {
  id: string;
  label: string;
  description?: string;
  action: () => void;
  icon?: string;
}

interface CommandPaletteProps {
  commands: Command[];
  isOpen?: boolean;
  onClose?: () => void;
}

export function CommandPalette({ commands, isOpen = false, onClose }: CommandPaletteProps) {
  const [open, setOpen] = useState(isOpen);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const filtered = commands.filter(
    cmd =>
      cmd.label.toLowerCase().includes(search.toLowerCase()) ||
      cmd.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20"
      onClick={() => {
        setOpen(false);
        onClose?.();
      }}
    >
      <div
        className="w-full max-w-xl bg-neutral-0 rounded-lg shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <input
          type="text"
          placeholder="Search commands... (Cmd+K)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
          className="w-full px-4 py-3 border-b border-neutral-200 focus:outline-none text-base"
        />
        <div className="max-h-96 overflow-y-auto">
          {filtered.length > 0 ? (
            filtered.map((cmd) => (
              <button
                key={cmd.id}
                onClick={() => {
                  cmd.action();
                  setOpen(false);
                  onClose?.();
                }}
                className="w-full px-4 py-3 text-left hover:bg-primary-50 border-b border-neutral-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {cmd.icon && <span className="text-lg">{cmd.icon}</span>}
                  <div>
                    <div className="font-medium text-neutral-900">{cmd.label}</div>
                    {cmd.description && (
                      <div className="text-xs text-neutral-600">{cmd.description}</div>
                    )}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="px-4 py-8 text-center text-neutral-600">
              No commands found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
