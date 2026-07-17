import { BrowserWindow, dialog, ipcMain, shell } from 'electron';
import path from 'path';
import sharp from 'sharp';
import fs from 'fs';
import os from 'os';

function createHiddenPrintWindow(imagePath, onSuccess, onError) {
  const printWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  });

  printWindow.loadFile(path.join(__dirname, '../../electron/print-template.html'));

  const readyHandler = () => {
    onSuccess(printWindow);
    ipcMain.removeListener('print-ready', readyHandler);
    ipcMain.removeListener('print-error', errorHandler);
  };

  const errorHandler = () => {
    onError(new Error('Failed to load image for printing'));
    ipcMain.removeListener('print-ready', readyHandler);
    ipcMain.removeListener('print-error', errorHandler);
    printWindow.close();
  };

  ipcMain.on('print-ready', readyHandler);
  ipcMain.on('print-error', errorHandler);

  printWindow.webContents.on('did-finish-load', () => {
    printWindow.webContents.send('print-init', { imagePath });
  });

  return printWindow;
}

/**
 * Convert an RGB image (base64 data URL) to CMYK-adjusted PNG.
 * Uses sharp to convert to CMYK colour space and back to sRGB,
 * which applies gamut mapping so printed colours are more accurate.
 */
export async function convertToCmyk(dataUrl) {
  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  const inputBuffer = Buffer.from(base64Data, 'base64');

  const cmykBuffer = await sharp(inputBuffer)
    .toColourspace('cmyk')
    .png()
    .toBuffer();

  return `data:image/png;base64,${cmykBuffer.toString('base64')}`;
}

export async function printImage({ imagePath, copies = 1, silent = false, deviceName = '' }) {
  // Mock printing if Dummy Printer (Test) is selected
  if (deviceName === 'Dummy Printer (Test)') {
    console.log(`[Printer Mock] Printing ${copies} copies silently to Dummy Printer (Test)`);
    try {
      const base64Data = imagePath.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const tempPath = path.join(os.tmpdir(), `ibooth-dummy-print-${Date.now()}.png`);
      fs.writeFileSync(tempPath, buffer);
      shell.openPath(tempPath);
    } catch (e) {
      console.error('[Printer Mock] Failed to write and open mock print file:', e);
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 1000);
    });
  }

  // Convert to CMYK colour space in the background
  const cmykImagePath = await convertToCmyk(imagePath);

  return new Promise((resolve, reject) => {
    createHiddenPrintWindow(cmykImagePath, (printWindow) => {
      const printOptions = {
        silent,
        printBackground: true,
        color: true,
        copies,
      };
      if (deviceName) {
        printOptions.deviceName = deviceName;
      }
      printWindow.webContents.print(printOptions, (success, failureReason) => {
        printWindow.close();
        if (!success) {
          reject(new Error(`Print failed: ${failureReason}`));
        } else {
          resolve(true);
        }
      });
    }, reject);
  });
}
