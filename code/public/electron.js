const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_START_URL;
  const devURL = process.env.ELECTRON_START_URL || 'http://localhost:3000';
  const prodURL = `http://localhost:3000`;

  if (isDev) {
    console.log('Electron loading DEV URL:', devURL);
    win.loadURL(devURL);
    // win.webContents.openDevTools(); // Do not open DevTools by default
  } else {
    console.log('Electron loading PROD URL:', prodURL);
    win.loadURL(prodURL);
  }

  win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', validatedURL, errorDescription);
    dialog.showErrorBox('Load Failed', `Failed to load: ${validatedURL}\n${errorDescription}`);
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
}); 