/**
 * Notifications Window Component
 * Floating notifications panel for alerts and updates
 */

import React, { useState, useCallback, useEffect } from 'react';

interface Notification {
  id: string;
  type: 'threat' | 'update' | 'info' | 'warning' | 'success';
  title: string;
  message: string;
  timestamp: number;
  actionLabel?: string;
  onAction?: () => void;
  dismissible: boolean;
}

const NotificationsWindow: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    // Load initial notifications
    loadNotifications();

    // Listen for new notifications
    const ipcRenderer = window.electron?.ipcRenderer;
    if (!ipcRenderer) return;

    const handleNewNotification = (event: any, notification: Notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 50));

      // Auto-dismiss after 5 seconds for non-critical notifications
      if (notification.type !== 'threat' && notification.type !== 'warning') {
        setTimeout(() => {
          dismissNotification(notification.id);
        }, 5000);
      }
    };

    ipcRenderer.on('notification:new', handleNewNotification);

    return () => {
      ipcRenderer.removeAllListeners('notification:new');
    };
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const stored = localStorage.getItem('notifications');
      if (stored) {
        setNotifications(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const handleAction = useCallback((notification: Notification) => {
    if (notification.onAction) {
      notification.onAction();
    }
    dismissNotification(notification.id);
  }, []);

  const handleClearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const getNotificationIcon = (type: string): string => {
    const icons: Record<string, string> = {
      threat: '⚠️',
      update: '📦',
      info: 'ℹ️',
      warning: '⚡',
      success: '✓',
    };
    return icons[type] || 'ℹ️';
  };

  const getNotificationColor = (type: string): string => {
    const colors: Record<string, string> = {
      threat: '#d32f2f',
      update: '#1976d2',
      info: '#0288d1',
      warning: '#f57c00',
      success: '#7cb342',
    };
    return colors[type] || '#666';
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') {
      return Date.now() - n.timestamp < 300000; // Less than 5 minutes old
    }
    return true;
  });

  const unreadCount = notifications.filter(
    (n) => Date.now() - n.timestamp < 300000
  ).length;

  return (
    <div className="notifications-window">
      <div className="window-content">
        <header className="notifications-header">
          <h1>Notifications</h1>
          {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
        </header>

        {/* Controls */}
        <div className="notifications-controls">
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({notifications.length})
            </button>
            <button
              className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </button>
          </div>

          <div className="control-buttons">
            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
              />
              <span>Auto-scroll</span>
            </label>

            {notifications.length > 0 && (
              <button className="btn-text" onClick={handleClearAll}>
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔔</div>
            <h2>No notifications</h2>
            <p>
              {filter === 'unread'
                ? 'All notifications have been read'
                : 'You will receive notifications here'}
            </p>
          </div>
        ) : (
          <div className="notifications-list">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className="notification-item"
                style={{
                  borderLeftColor: getNotificationColor(notification.type),
                  backgroundColor:
                    Date.now() - notification.timestamp < 300000
                      ? 'rgba(0, 0, 0, 0.02)'
                      : 'transparent',
                }}
              >
                <div className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="notification-content">
                  <div className="notification-header">
                    <h3 className="notification-title">{notification.title}</h3>
                    <span className="notification-time">
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="notification-message">{notification.message}</p>

                  <div className="notification-footer">
                    {notification.actionLabel && (
                      <button
                        className="btn-small"
                        onClick={() => handleAction(notification)}
                        style={{ color: getNotificationColor(notification.type) }}
                      >
                        {notification.actionLabel}
                      </button>
                    )}
                  </div>
                </div>

                {notification.dismissible && (
                  <button
                    className="notification-close"
                    onClick={() => dismissNotification(notification.id)}
                    title="Dismiss"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsWindow;
