import { app, BrowserWindow, shell, ipcMain, Menu, nativeTheme } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { autoUpdater } from 'electron-updater';
import { initStorage, listTemplates, saveTemplate, deleteTemplate, importFrame } from '../services/fileStorage.js';
import { printImage, convertToCmyk } from '../services/printer.js';
import { getSyncState, saveSyncState } from '../services/sync.js';

import icon from '../../build/icon.png?asset';
import logoDark from '../../src/assets/ibootlogo-cw.png?asset';
import logoLight from '../../src/assets/ibootlogo-cb.png?asset';

function createWindow() {
  const iconPath = icon;

  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    title: 'iBooth',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 12, y: 12 },
    backgroundColor: '#0a0a0a',
    icon: iconPath,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false // allow file:// loading for local images
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  // Open external links in the default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Load the renderer
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
  
  return mainWindow;
}

app.setName('iBooth');

app.whenReady().then(() => {
  // Set app user model id for Windows
  electronApp.setAppUserModelId('com.ibooth.app');

  if (process.platform === 'darwin') {
    app.dock.setIcon(icon);
  }

  // Default open or close DevTools by F12 in dev, ignore in production
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  function updateAboutPanel() {
    const isDark = nativeTheme.shouldUseDarkColors;
    app.setAboutPanelOptions({
      applicationName: 'iBooth',
      applicationVersion: app.getVersion(),
      version: 'Beta',
      copyright: '© 2026 iBooth Inc.\nPart of arwndoprtma.space',
      authors: ['iBooth Team'],
      website: 'https://arwndoprtma.space',
      iconPath: isDark ? logoDark : logoLight,
      credits: 'Created by the iBooth Open Source Community'
    });
  }

  nativeTheme.on('updated', updateAboutPanel);
  updateAboutPanel();

  initStorage();

  const mainWindow = createWindow();

  // Auto Updater configuration
  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('update-available', info);
  });
  autoUpdater.on('update-downloaded', (info) => {
    mainWindow.webContents.send('update-downloaded', info);
  });
  autoUpdater.on('error', (err) => {
    mainWindow.webContents.send('update-error', err.message);
  });
  ipcMain.handle('updater:install', () => {
    autoUpdater.quitAndInstall(false, true);
  });

  if (is.dev) {
    autoUpdater.autoDownload = false;
  } else {
    autoUpdater.checkForUpdatesAndNotify();
  }

  // IPC Handlers
  ipcMain.handle('templates:list', () => listTemplates());
  ipcMain.handle('templates:save', (_, template) => saveTemplate(template));
  ipcMain.handle('templates:delete', (_, id) => deleteTemplate(id));
  ipcMain.handle('templates:importFrame', () => importFrame(mainWindow));
  
  ipcMain.handle('print', (_, options) => printImage(options));
  ipcMain.handle('print:getPrinters', async () => {
    const printers = await mainWindow.webContents.getPrintersAsync();
    const list = printers.map(p => ({ name: p.name, isDefault: p.isDefault }));
    list.push({ name: 'Dummy Printer (Test)', isDefault: false });
    return list;
  });
  ipcMain.handle('image:convertToCmyk', (_, dataUrl) => convertToCmyk(dataUrl));

  ipcMain.handle('sync:getState', () => getSyncState());
  ipcMain.handle('sync:saveState', (_, state) => saveSyncState(state));

  ipcMain.handle('editor:setMenu', (_, isEditor) => {
    if (process.platform !== 'darwin') return;

    if (isEditor) {
      const template = [
        {
          label: app.name,
          submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'services' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideOthers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' }
          ]
        },
        {
          label: 'File',
          submenu: [
            {
              label: 'New Template',
              click: () => mainWindow.webContents.send('editor:action', 'new-template')
            },
            { type: 'separator' },
            {
              label: 'Save Template',
              accelerator: 'CmdOrCtrl+S',
              click: () => mainWindow.webContents.send('editor:action', 'save-template')
            },
            {
              label: 'Import from JSON...',
              click: () => mainWindow.webContents.send('editor:action', 'import-json')
            },
            {
              label: 'Export to JSON...',
              click: () => mainWindow.webContents.send('editor:action', 'export-json')
            },
            { type: 'separator' },
            {
              label: 'Upload Frame...',
              click: () => mainWindow.webContents.send('editor:action', 'upload-frame')
            }
          ]
        },
        {
          label: 'Edit',
          submenu: [
            {
              label: 'Undo',
              accelerator: 'CmdOrCtrl+Z',
              click: () => mainWindow.webContents.send('editor:action', 'undo')
            },
            {
              label: 'Redo',
              accelerator: 'Shift+CmdOrCtrl+Z',
              click: () => mainWindow.webContents.send('editor:action', 'redo')
            },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            { role: 'selectAll' }
          ]
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
            { role: 'togglefullscreen' }
          ]
        },
        {
          label: 'Window',
          submenu: [
            { role: 'minimize' },
            { role: 'zoom' },
            { type: 'separator' },
            { role: 'front' },
            { type: 'separator' },
            { role: 'window' }
          ]
        },
        {
          role: 'help',
          submenu: [
            {
              label: 'About iBooth',
              click: () => mainWindow.webContents.send('editor:action', 'about')
            }
          ]
        }
      ];
      const menu = Menu.buildFromTemplate(template);
      Menu.setApplicationMenu(menu);
    } else {
      // Revert to a basic menu when not in editor
      const template = [
        {
          label: app.name,
          submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'services' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideOthers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' }
          ]
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
            { role: 'selectAll' }
          ]
        },
        {
          label: 'View',
          submenu: [
            { role: 'reload' },
            { role: 'forceReload' },
            { role: 'toggleDevTools' },
            { type: 'separator' },
            { role: 'togglefullscreen' }
          ]
        },
        {
          label: 'Window',
          submenu: [
            { role: 'minimize' },
            { role: 'zoom' },
            { type: 'separator' },
            { role: 'front' },
            { type: 'separator' },
            { role: 'window' }
          ]
        },
        {
          role: 'help',
          submenu: [
            {
              label: 'About iBooth',
              click: () => mainWindow.webContents.send('editor:action', 'about')
            }
          ]
        }
      ];
      const menu = Menu.buildFromTemplate(template);
      Menu.setApplicationMenu(menu);
    }
  });

  app.on('activate', () => {
    // macOS: re-create window when dock icon is clicked and no windows are open
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
