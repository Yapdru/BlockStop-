/**
 * IPC Event Handlers
 * Manages communication between renderer and main process
 */

import { ipcMain, BrowserWindow, dialog, clipboard, app } from 'electron';
import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';

const execAsync = promisify(exec);

interface IpcHandlerContext {
  createScannerWindow: () => void;
  createResultsWindow: () => void;
  createSettingsWindow: () => void;
  createNotificationsWindow: () => void;
  createUpdateWindow: () => void;
  getMainWindow: () => BrowserWindow | null;
}

interface ScanFile {
  path: string;
  name: string;
  size: number;
  hash?: string;
}

interface ScanResult {
  file: string;
  threat: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  details: string;
  timestamp: number;
  quarantined: boolean;
}

export const registerIpcHandlers = (context: IpcHandlerContext): void => {
  // File Operations
  ipcMain.handle('file:open-dialog', async (event, options) => {
    const mainWindow = context.getMainWindow();
    if (!mainWindow) throw new Error('Main window not available');

    const result = await dialog.showOpenDialog(mainWindow, options);
    return result;
  });

  ipcMain.handle('file:save-dialog', async (event, options) => {
    const mainWindow = context.getMainWindow();
    if (!mainWindow) throw new Error('Main window not available');

    const result = await dialog.showSaveDialog(mainWindow, options);
    return result;
  });

  ipcMain.handle('file:read', async (event, filePath: string) => {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return { success: true, content };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('file:write', async (event, filePath: string, content: string) => {
    try {
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, content, 'utf-8');
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('file:delete', async (event, filePath: string) => {
    try {
      await fs.remove(filePath);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('file:exists', async (event, filePath: string) => {
    try {
      const exists = await fs.pathExists(filePath);
      return exists;
    } catch {
      return false;
    }
  });

  ipcMain.handle('file:stats', async (event, filePath: string) => {
    try {
      const stats = await fs.stat(filePath);
      return {
        success: true,
        stats: {
          size: stats.size,
          created: stats.birthtime.getTime(),
          modified: stats.mtime.getTime(),
          accessed: stats.atime.getTime(),
          isDirectory: stats.isDirectory(),
          isFile: stats.isFile(),
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Scanning Operations
  ipcMain.handle('scan:start', async (event, filePaths: string[], options: any) => {
    const results: ScanResult[] = [];

    for (const filePath of filePaths) {
      try {
        const stats = await fs.stat(filePath);
        const hash = await calculateFileHash(filePath);

        const scanResult: ScanResult = {
          file: filePath,
          threat: 'Unknown',
          severity: 'info',
          details: `Scanned file: ${path.basename(filePath)} (${stats.size} bytes)`,
          timestamp: Date.now(),
          quarantined: false,
        };

        // Simulate threat detection
        if (isExecutable(filePath) && !isTrusted(hash)) {
          scanResult.threat = 'Potentially Unwanted Program';
          scanResult.severity = 'medium';
          scanResult.details = 'Unsigned executable detected';
        }

        if (isScript(filePath)) {
          scanResult.threat = 'Script File';
          scanResult.severity = 'low';
          scanResult.details = 'Script file detected. Manual review recommended.';
        }

        results.push(scanResult);

        // Send progress update
        event.sender.send('scan:progress', {
          current: results.length,
          total: filePaths.length,
          currentFile: path.basename(filePath),
        });
      } catch (error) {
        results.push({
          file: filePath,
          threat: 'Error',
          severity: 'info',
          details: `Failed to scan: ${(error as Error).message}`,
          timestamp: Date.now(),
          quarantined: false,
        });
      }
    }

    return { success: true, results };
  });

  ipcMain.handle('scan:cancel', async (event) => {
    return { success: true, message: 'Scan cancelled' };
  });

  ipcMain.handle('scan:quarantine', async (event, filePath: string) => {
    try {
      const quarantineDir = path.join(app.getPath('userData'), 'BlockStop', 'quarantine');
      await fs.ensureDir(quarantineDir);

      const quarantinePath = path.join(
        quarantineDir,
        `${Date.now()}_${path.basename(filePath)}`
      );

      await fs.move(filePath, quarantinePath, { overwrite: true });
      return { success: true, quarantinePath };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('scan:restore-quarantine', async (event, quarantinePath: string, targetPath: string) => {
    try {
      await fs.ensureDir(path.dirname(targetPath));
      await fs.move(quarantinePath, targetPath, { overwrite: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // System Integration
  ipcMain.handle('system:get-info', async (event) => {
    return {
      platform: process.platform,
      arch: process.arch,
      appVersion: app.getVersion(),
      userDataPath: app.getPath('userData'),
      tempPath: app.getPath('temp'),
    };
  });

  ipcMain.handle('system:open-path', async (event, filePath: string) => {
    try {
      const { shell } = require('electron');
      shell.showItemInFolder(filePath);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('system:execute-command', async (event, command: string, args: string[]) => {
    try {
      const { stdout, stderr } = await execAsync(`${command} ${args.join(' ')}`);
      return { success: true, stdout, stderr };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Clipboard Operations
  ipcMain.handle('clipboard:read', async (event) => {
    try {
      const text = clipboard.readText();
      return { success: true, text };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('clipboard:write', async (event, text: string) => {
    try {
      clipboard.writeText(text);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Settings Operations
  ipcMain.handle('settings:save', async (event, settings: any) => {
    try {
      const configPath = path.join(app.getPath('userData'), 'BlockStop', 'settings.json');
      await fs.ensureDir(path.dirname(configPath));
      await fs.writeJson(configPath, settings, { spaces: 2 });
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('settings:load', async (event) => {
    try {
      const configPath = path.join(app.getPath('userData'), 'BlockStop', 'settings.json');
      const exists = await fs.pathExists(configPath);
      if (!exists) {
        return { success: true, settings: {} };
      }
      const settings = await fs.readJson(configPath);
      return { success: true, settings };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Window Control
  ipcMain.handle('window:open-scanner', async (event) => {
    context.createScannerWindow();
    return { success: true };
  });

  ipcMain.handle('window:open-results', async (event) => {
    context.createResultsWindow();
    return { success: true };
  });

  ipcMain.handle('window:open-settings', async (event) => {
    context.createSettingsWindow();
    return { success: true };
  });

  ipcMain.handle('window:open-notifications', async (event) => {
    context.createNotificationsWindow();
    return { success: true };
  });

  // Notification Operations
  ipcMain.on('notification:show', (event, options: any) => {
    const { Notification } = require('electron');
    new Notification(options);
  });

  // Drag and Drop
  ipcMain.on('files:drop', (event, files: string[]) => {
    event.sender.send('files-dropped', files);
  });
};

// Helper functions
const calculateFileHash = async (filePath: string): Promise<string> => {
  const hash = crypto.createHash('sha256');
  const stream = fs.createReadStream(filePath);

  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
};

const isExecutable = (filePath: string): boolean => {
  return /\.(exe|dll|sys|drv|scr|com)$/i.test(filePath);
};

const isScript = (filePath: string): boolean => {
  return /\.(bat|cmd|ps1|vbs|js|py|sh|bash)$/i.test(filePath);
};

const isTrusted = (hash: string): boolean => {
  // This would typically check against a database of trusted file hashes
  return false;
};
