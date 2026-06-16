/**
 * Application-wide configuration and constants
 */

interface WindowConfig {
  url: string;
  title: string;
  icon?: string;
}

interface AppConfig {
  app: {
    name: string;
    version: string;
    vendor: string;
  };
  windows: {
    main: WindowConfig;
    scanner: WindowConfig;
    results: WindowConfig;
    settings: WindowConfig;
    notifications: WindowConfig;
    update: WindowConfig;
  };
  scanner: {
    maxThreads: number;
    debounceMs: number;
    chunkSize: number;
    timeoutMs: number;
  };
  theme: {
    colorScheme: 'light' | 'dark' | 'system';
    accentColor: string;
    fontFamily: string;
  };
  storage: {
    dataDir: string;
    cacheDir: string;
    logDir: string;
  };
  security: {
    enableSandbox: boolean;
    enableNodeIntegration: boolean;
    enableRemoteModule: boolean;
  };
}

const appConfig: AppConfig = {
  app: {
    name: 'BlockStop',
    version: '1.0.0',
    vendor: 'Digital Conversation',
  },
  windows: {
    main: {
      url: '/',
      title: 'BlockStop - File Security Scanner',
    },
    scanner: {
      url: '/scanner',
      title: 'Scanner',
    },
    results: {
      url: '/results',
      title: 'Scan Results',
    },
    settings: {
      url: '/settings',
      title: 'Settings',
    },
    notifications: {
      url: '/notifications',
      title: 'Notifications',
    },
    update: {
      url: '/update',
      title: 'Update Available',
    },
  },
  scanner: {
    maxThreads: 4,
    debounceMs: 300,
    chunkSize: 1024 * 1024, // 1MB
    timeoutMs: 30000, // 30 seconds
  },
  theme: {
    colorScheme: 'system',
    accentColor: '#0078D4', // Windows blue
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
  },
  storage: {
    dataDir: '${userData}/BlockStop/data',
    cacheDir: '${userData}/BlockStop/cache',
    logDir: '${userData}/BlockStop/logs',
  },
  security: {
    enableSandbox: true,
    enableNodeIntegration: false,
    enableRemoteModule: false,
  },
};

// File type associations for the scanner
export const FILE_TYPE_PATTERNS = {
  executable: /\.(exe|dll|sys|drv|scr|com)$/i,
  script: /\.(bat|cmd|ps1|vbs|js|py|sh|bash)$/i,
  document: /\.(doc|docx|xls|xlsx|ppt|pptx|pdf|txt)$/i,
  archive: /\.(zip|rar|7z|tar|gz|iso)$/i,
  media: /\.(mp3|mp4|avi|mov|wav|flac|mkv)$/i,
  image: /\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i,
};

// Security threat levels
export const THREAT_LEVELS = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  INFO: 'info',
};

// Scan patterns
export const SCAN_PATTERNS = {
  DEFAULT: 'default',
  QUICK: 'quick',
  DEEP: 'deep',
  CUSTOM: 'custom',
};

// Quarantine settings
export const QUARANTINE_CONFIG = {
  enabled: true,
  location: '${userData}/BlockStop/quarantine',
  maxSize: 1024 * 1024 * 500, // 500MB
  autoCleanDays: 30,
};

export default appConfig;
