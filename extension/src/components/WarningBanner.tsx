import React, { useState } from 'react';
import { AlertCircle, X, Info, AlertTriangle, ShieldAlert } from 'lucide-react';

interface WarningBannerProps {
  level: 'info' | 'warning' | 'critical' | 'error';
  title: string;
  message: string;
  details?: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
  }>;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: React.ReactNode;
}

const levelStyles = {
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: <Info className="w-5 h-5 text-blue-600" />,
    closeBtn: 'hover:bg-blue-100 text-blue-600',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
    closeBtn: 'hover:bg-yellow-100 text-yellow-600',
  },
  critical: {
    container: 'bg-red-50 border-red-200 text-red-800',
    icon: <AlertCircle className="w-5 h-5 text-red-600" />,
    closeBtn: 'hover:bg-red-100 text-red-600',
  },
  error: {
    container: 'bg-orange-50 border-orange-200 text-orange-800',
    icon: <ShieldAlert className="w-5 h-5 text-orange-600" />,
    closeBtn: 'hover:bg-orange-100 text-orange-600',
  },
};

const actionButtonStyles = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
};

export const WarningBanner: React.FC<WarningBannerProps> = ({
  level,
  title,
  message,
  details,
  actions,
  dismissible = true,
  onDismiss,
  icon,
}) => {
  const [visible, setVisible] = useState(true);

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  if (!visible) return null;

  const style = levelStyles[level];

  return (
    <div className={`border rounded-lg p-4 space-y-3 ${style.container}`}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 pt-0.5">{icon || style.icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-sm mt-1 opacity-90">{message}</p>

          {/* Details */}
          {details && (
            <details className="mt-2 cursor-pointer">
              <summary className="text-xs font-medium opacity-75 hover:opacity-100">
                View details
              </summary>
              <p className="text-xs mt-2 opacity-75 whitespace-pre-wrap">{details}</p>
            </details>
          )}
        </div>

        {/* Close Button */}
        {dismissible && (
          <button
            onClick={handleDismiss}
            className={`flex-shrink-0 p-1 rounded transition-colors ${style.closeBtn}`}
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Actions */}
      {actions && actions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-current border-opacity-20">
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={action.onClick}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                actionButtonStyles[action.variant || 'secondary']
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Preset warning banners for common scenarios
export const PhishingWarning: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
  <WarningBanner
    level="critical"
    title="⚠️ Potential Phishing Detected"
    message="This email shows signs of phishing. Do not click links or download attachments from untrusted sources."
    details={`Common phishing indicators detected:
• Mismatched sender domain
• Suspicious URL patterns
• Request for sensitive information
• Urgent call-to-action language`}
    actions={[
      { label: 'Report as Phishing', onClick: onAction || (() => {}), variant: 'danger' },
      { label: 'Delete Email', onClick: () => {}, variant: 'secondary' },
    ]}
  />
);

export const MalwareWarning: React.FC<{ filename?: string }> = ({ filename = 'attachment' }) => (
  <WarningBanner
    level="critical"
    title="🔴 Malware Detected"
    message={`The file "${filename}" may contain malware and has been blocked.`}
    actions={[
      { label: 'Quarantine', onClick: () => {}, variant: 'danger' },
      { label: 'Learn More', onClick: () => {}, variant: 'secondary' },
    ]}
  />
);

export const SuspiciousLinkWarning: React.FC<{ url?: string }> = ({ url }) => (
  <WarningBanner
    level="warning"
    title="⚠️ Suspicious Link Detected"
    message={`This link may be dangerous: ${url || '[link]'}`}
    details="This link has been flagged as potentially malicious. Proceed with caution."
    actions={[
      { label: 'Block Site', onClick: () => {}, variant: 'danger' },
      { label: 'Continue Anyway', onClick: () => {}, variant: 'secondary' },
    ]}
  />
);

export const InfoBanner: React.FC<{ message: string }> = ({ message }) => (
  <WarningBanner level="info" title="ℹ️ Information" message={message} dismissible={true} />
);

export default WarningBanner;
