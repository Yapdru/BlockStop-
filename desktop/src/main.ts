import { app, BrowserWindow, Menu, ipcMain, dialog, clipboard } from 'electron';
import { autoUpdater } from 'electron-updater';
import isDev from 'electron-is-dev';
import path from 'path';
import { registerIpcHandlers } from './ipc/handlers';
import { createSystemTrayMenu } from './components/SystemTrayMenu';
import appConfig from './utils/app-config';

let mainWindow: BrowserWindow | null = null;
let scannerWindow: BrowserWindow | null = null;
let resultsWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;
let notificationsWindow: BrowserWindow | null = null;
let updateWindow: BrowserWindow | null = null;

const createWindow = (
  url: string,
  options: Electron.BrowserWindowConstructorOptions = {},
  windowType: 'main' | 'secondary' = 'main'
): BrowserWindow => {
  const window = new BrowserWindow({
    width: options.width || (windowType === 'main' ? 1200 : 800),
    height: options.height || (windowType === 'main' ? 800 : 600),
    minWidth: 600,
    minHeight: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true,
      ...options.webPreferences,
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    show: false,
    ...options,
  });

  if (isDev) {
    window.webContents.openDevTools();
  }

  if (isDev) {
    window.loadURL(url);
  } else {
    window.loadFile(path.join(__dirname, '../build/index.html'), {
      hash: url.replace('/', ''),
    });
  }

  window.once('ready-to-show', () => {
    window.show();
  });

  return window;
};

const createMainWindow = (): void => {
  mainWindow = createWindow(appConfig.windows.main.url, {
    width: 1200,
    height: 800,
    center: true,
  }, 'main');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    // Keyboard shortcuts
    if (input.control && input.key.toLowerCase() === 's') {
      event.preventDefault();
      mainWindow?.webContents.send('save-scan-results');
    }
    if (input.control && input.key.toLowerCase() === 'q') {
      event.preventDefault();
      app.quit();
    }
  });
};

const createScannerWindow = (): void => {
  if (scannerWindow) {
    scannerWindow.focus();
    return;
  }

  scannerWindow = createWindow(appConfig.windows.scanner.url, {
    width: 900,
    height: 600,
    parent: mainWindow || undefined,
    modal: true,
  }, 'secondary');

  scannerWindow.on('closed', () => {
    scannerWindow = null;
  });
};

const createResultsWindow = (): void => {
  if (resultsWindow) {
    resultsWindow.focus();
    return;
  }

  resultsWindow = createWindow(appConfig.windows.results.url, {
    width: 1000,
    height: 700,
    parent: mainWindow || undefined,
  }, 'secondary');

  resultsWindow.on('closed', () => {
    resultsWindow = null;
  });
};

const createSettingsWindow = (): void => {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = createWindow(appConfig.windows.settings.url, {
    width: 700,
    height: 600,
    parent: mainWindow || undefined,
    modal: true,
  }, 'secondary');

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
};

const createNotificationsWindow = (): void => {
  if (notificationsWindow) {
    notificationsWindow.focus();
    return;
  }

  notificationsWindow = createWindow(appConfig.windows.notifications.url, {
    width: 400,
    height: 500,
    parent: mainWindow || undefined,
    alwaysOnTop: true,
    skipTaskbar: true,
  }, 'secondary');

  notificationsWindow.on('closed', () => {
    notificationsWindow = null;
  });
};

const createUpdateWindow = (): void => {
  if (updateWindow) {
    updateWindow.focus();
    return;
  }

  updateWindow = createWindow(appConfig.windows.update.url, {
    width: 500,
    height: 300,
    parent: mainWindow || undefined,
    modal: true,
    resizable: false,
  }, 'secondary');

  updateWindow.on('closed', () => {
    updateWindow = null;
  });
};

const createApplicationMenu = (): void => {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open File',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow!, {
              properties: ['openFile', 'multiSelections'],
              filters: [{ name: 'All Files', extensions: ['*'] }],
            });
            if (!result.canceled) {
              mainWindow?.webContents.send('files-selected', result.filePaths);
            }
          },
        },
        {
          label: 'Open Folder',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow!, {
              properties: ['openDirectory'],
            });
            if (!result.canceled) {
              mainWindow?.webContents.send('folder-selected', result.filePaths[0]);
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Tools',
      submenu: [
        {
          label: 'Scanner',
          click: createScannerWindow,
        },
        {
          label: 'Results',
          click: createResultsWindow,
        },
        {
          label: 'Notifications',
          click: createNotificationsWindow,
        },
        { type: 'separator' },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: createSettingsWindow,
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About BlockStop',
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: 'About BlockStop',
              message: 'BlockStop Desktop',
              detail: `Version ${app.getVersion()}\nA comprehensive file security scanner and blocker.`,
            });
          },
        },
        {
          label: 'Check for Updates',
          click: () => {
            autoUpdater.checkForUpdates();
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

app.on('ready', () => {
  createMainWindow();
  createApplicationMenu();

  // Setup system tray
  const trayMenu = createSystemTrayMenu(
    createMainWindow,
    createScannerWindow,
    createSettingsWindow
  );

  // Initialize IPC handlers
  registerIpcHandlers({
    createScannerWindow,
    createResultsWindow,
    createSettingsWindow,
    createNotificationsWindow,
    createUpdateWindow,
    getMainWindow: () => mainWindow,
  });

  // Setup auto-updater
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }

  autoUpdater.on('update-downloaded', () => {
    createUpdateWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createMainWindow();
  }
});

// Handle any uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  dialog.showErrorBox('Error', 'An unexpected error occurred');
});
