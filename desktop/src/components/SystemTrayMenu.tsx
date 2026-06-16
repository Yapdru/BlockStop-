/**
 * System Tray Menu Component
 * Context menu for system tray icon
 */

import { Menu, Tray, app, BrowserWindow } from 'electron';
import path from 'path';

export const createSystemTrayMenu = (
  createMainWindow: () => void,
  createScannerWindow: () => void,
  createSettingsWindow: () => void
): Tray => {
  // Create tray icon
  const trayIconPath = path.join(__dirname, '../assets/tray-icon.png');
  const tray = new Tray(trayIconPath);

  // Create context menu
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'BlockStop',
      enabled: false,
    },
    {
      type: 'separator',
    },
    {
      label: 'Open Application',
      click: createMainWindow,
    },
    {
      label: 'Quick Scan',
      click: createScannerWindow,
    },
    {
      label: 'View Results',
      click: () => {
        // Trigger results window
        const mainWindow = BrowserWindow.getFocusedWindow();
        if (mainWindow) {
          mainWindow.webContents.send('open-results');
        }
      },
    },
    {
      type: 'separator',
    },
    {
      label: 'Pause Protection',
      submenu: [
        {
          label: '15 minutes',
          click: () => {
            // Emit pause event
          },
        },
        {
          label: '1 hour',
          click: () => {
            // Emit pause event
          },
        },
        {
          label: 'Until next restart',
          click: () => {
            // Emit pause event
          },
        },
      ],
    },
    {
      type: 'separator',
    },
    {
      label: 'Settings',
      accelerator: 'CmdOrCtrl+,',
      click: createSettingsWindow,
    },
    {
      label: 'Check for Updates',
      click: () => {
        const { autoUpdater } = require('electron-updater');
        autoUpdater.checkForUpdates();
      },
    },
    {
      type: 'separator',
    },
    {
      label: 'About BlockStop',
      click: () => {
        const { dialog } = require('electron');
        dialog.showMessageBox({
          type: 'info',
          title: 'About BlockStop',
          message: 'BlockStop Desktop',
          detail: `Version ${app.getVersion()}\n\nA comprehensive file security scanner and blocker.`,
          buttons: ['OK'],
        });
      },
    },
    {
      type: 'separator',
    },
    {
      label: 'Exit',
      click: () => {
        app.quit();
      },
    },
  ]);

  // Set context menu
  tray.setContextMenu(contextMenu);

  // Handle tray icon click
  tray.on('click', () => {
    createMainWindow();
  });

  // Set tooltip
  tray.setToolTip('BlockStop - File Security Scanner');

  return tray;
};

export default createSystemTrayMenu;
