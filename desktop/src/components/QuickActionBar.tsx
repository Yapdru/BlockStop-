/**
 * Quick Action Bar Component
 * Floating action toolbar for frequently used actions
 */

import React, { useState, useCallback } from 'react';

interface QuickActionBarProps {
  onOpenScanner: () => void;
  onOpenSettings: () => void;
}

const QuickActionBar: React.FC<QuickActionBarProps> = ({
  onOpenScanner,
  onOpenSettings,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  const handleQuickScan = useCallback(() => {
    onOpenScanner();
    setIsExpanded(false);
  }, [onOpenScanner]);

  const handleExportReport = useCallback(async () => {
    try {
      const ipcRenderer = window.electron?.ipcRenderer;
      if (!ipcRenderer) return;

      const result = await ipcRenderer.invoke('file:save-dialog', {
        filters: [
          { name: 'PDF', extensions: ['pdf'] },
          { name: 'JSON', extensions: ['json'] },
        ],
      });

      if (!result.canceled) {
        // Trigger export
        window.dispatchEvent(new CustomEvent('export-report', { detail: result.filePath }));
      }
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  }, []);

  const handleOpenNotifications = useCallback(() => {
    const ipcRenderer = window.electron?.ipcRenderer;
    if (!ipcRenderer) return;

    ipcRenderer.invoke('window:open-notifications');
    setIsExpanded(false);
  }, []);

  const togglePin = useCallback(() => {
    setIsPinned(!isPinned);
  }, [isPinned]);

  const actions = [
    {
      id: 'scan',
      label: 'Quick Scan',
      icon: '🔍',
      onClick: handleQuickScan,
      shortcut: 'Ctrl+Shift+S',
    },
    {
      id: 'export',
      label: 'Export Report',
      icon: '💾',
      onClick: handleExportReport,
      shortcut: 'Ctrl+E',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: '🔔',
      onClick: handleOpenNotifications,
      shortcut: 'Ctrl+N',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      onClick: onOpenSettings,
      shortcut: 'Ctrl+,',
    },
  ];

  return (
    <div className={`quick-action-bar ${isExpanded ? 'expanded' : 'collapsed'} ${isPinned ? 'pinned' : ''}`}>
      {/* Expanded Menu */}
      {isExpanded && (
        <div className="action-menu">
          {actions.map((action) => (
            <button
              key={action.id}
              className="action-item"
              onClick={action.onClick}
              title={`${action.label} (${action.shortcut})`}
            >
              <div className="action-icon">{action.icon}</div>
              <div className="action-label">{action.label}</div>
            </button>
          ))}
        </div>
      )}

      {/* Main Toggle Button */}
      <button
        className={`action-toggle ${isExpanded ? 'expanded' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
        title="Quick Actions"
      >
        <span className="action-icon">⚡</span>
      </button>

      {/* Pin Button */}
      <button
        className={`action-pin ${isPinned ? 'pinned' : ''}`}
        onClick={togglePin}
        title={isPinned ? 'Unpin' : 'Pin'}
      >
        {isPinned ? '📌' : '📍'}
      </button>
    </div>
  );
};

export default QuickActionBar;
