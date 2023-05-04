import { app, BrowserWindow } from 'electron';
import { join } from 'path';
import { URL } from 'url';
import setupEvent from './setupEvent';
import { setupTitlebar, attachTitlebarToWindow } from 'custom-electron-titlebar/main';

setupTitlebar();

async function createWindow() {
  const browserWindow = new BrowserWindow({
    fullscreen: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      sandbox: false,
      webviewTag: true,
      preload: join(app.getAppPath(), 'electron/preload/dist/index.cjs'),
    },
    icon: join(app.getAppPath(), 'src/assets/ico/map16.ico'),
    titleBarStyle: 'hidden',
    frame: false,
    width: 1000,
    height: 750,
    resizable: false,
  });

  attachTitlebarToWindow(browserWindow);

  browserWindow.webContents.setWindowOpenHandler(({}) => {
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        nodeIntegration: true,
        frame: false,
        width: 1600,
        height: 1024,
        minWidth: 1600,
        minHeight: 1024,
        webPreferences: {
          preload: join(app.getAppPath(), 'electron/preload/dist/index.cjs'),
        },
      },
    };
  });

  browserWindow.on('ready-to-show', () => {
    browserWindow?.show();

    if (import.meta.env.DEV) {
      browserWindow?.webContents.openDevTools();
    }
  });

  const pageUrl =
    import.meta.env.DEV && import.meta.env.VITE_DEV_SERVER_URL !== undefined
      ? import.meta.env.VITE_DEV_SERVER_URL
      : new URL('../../dist/index.html', 'file://' + __dirname).toString();

  await browserWindow.loadURL(pageUrl);

  return browserWindow;
}

/**
 * Restore an existing BrowserWindow or Create a new BrowserWindow.
 */
export async function restoreOrCreateWindow() {
  let window = BrowserWindow.getAllWindows().find((w) => !w.isDestroyed());

  if (window === undefined) {
    window = await createWindow();
  }

  if (window.isMinimized()) {
    window.restore();
  }

  window.focus();

  setupEvent(window);

  return window;
}
