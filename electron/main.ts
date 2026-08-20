import { config as loadEnv } from 'dotenv';
import path from 'path';
loadEnv({ path: path.join(__dirname, '..', '.env') });

import { app, BrowserWindow, ipcMain } from 'electron';
import { initDatabase, getAssignments, upsertAssignment, updateAssignment, deleteAssignment, getAllSettings, setSetting } from './services/database';
import { login, logout, getAuthStatus, migrateFromSingleAccount, toggleAccount } from './services/auth';
import { scanEmails, refreshEmails, startAutoRefresh, stopAutoRefresh } from './services/gmail';
import { scanTasks, refreshTasks } from './services/tasks';

let mainWindow: BrowserWindow | null = null;

const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset',
    show: false,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function registerIpcHandlers(): void {
  // Auth
  ipcMain.handle('auth:login', async () => {
    try {
      return await login();
    } catch (err) {
      console.error('auth:login failed:', err);
      throw err;
    }
  });

  ipcMain.handle('auth:logout', async (_event, email: string) => {
    stopAutoRefresh();
    return logout(email);
  });

  ipcMain.handle('auth:getStatus', async () => {
    try {
      return await getAuthStatus();
    } catch (err) {
      console.error('auth:getStatus failed:', err);
      throw err;
    }
  });

  ipcMain.handle('auth:toggleAccount', async (_event, email: string, enabled: boolean) => {
    toggleAccount(email, enabled);
  });

  // Gmail
  ipcMain.handle('gmail:scan', async (_event, startDate?: string) => {
    const results = await scanEmails(startDate);
    startAutoRefresh(30);
    return results;
  });

  ipcMain.handle('gmail:refresh', async () => {
    return refreshEmails();
  });

  // Google Tasks
  ipcMain.handle('tasks:scan', async () => {
    return scanTasks();
  });

  ipcMain.handle('tasks:refresh', async () => {
    return refreshTasks();
  });

  // Database
  ipcMain.handle('db:getAssignments', async () => {
    return getAssignments();
  });

  ipcMain.handle('db:upsertAssignment', async (_event, assignment: Record<string, unknown>) => {
    return upsertAssignment(assignment);
  });

  ipcMain.handle('db:updateAssignment', async (_event, id: string, updates: Record<string, unknown>) => {
    return updateAssignment(id, updates);
  });

  ipcMain.handle('db:deleteAssignment', async (_event, id: string) => {
    return deleteAssignment(id);
  });

  // Settings
  ipcMain.handle('settings:get', async () => {
    return getAllSettings();
  });

  ipcMain.handle('settings:set', async (_event, settings: Record<string, string>) => {
    for (const [key, value] of Object.entries(settings)) {
      setSetting(key, value);
    }
  });
}

app.whenReady().then(async () => {
  initDatabase();
  await migrateFromSingleAccount();
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopAutoRefresh();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
