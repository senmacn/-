import { BrowserWindow, app } from 'electron';
import { ipcMain, shell } from 'electron';
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readdirSync,
  statSync,
  readFileSync,
  rmSync,
  renameSync,
} from 'fs';
import * as path from 'path';
import { join } from 'path';
import { attachTitlebarToWindow } from 'custom-electron-titlebar/main';

const DATA_DIR = 'data';
const SAVES_DIR = 'data/saves';

const userConfig = {
  exportLocation: '',
  downloadLocation: '',
  autoSaveTime: 5,
} as UserConfig;

export default function setupEvent(mainWindow: BrowserWindow) {
  // 初始化
  try {
    if (!existsSync('data/config.json')) {
      mkdirSync(DATA_DIR);
      mkdirSync(SAVES_DIR);
      writeFileSync('data/config.json', JSON.stringify(userConfig));
    } else {
      const config = JSON.parse(readFileSync('data/config.json', 'utf8'));
      Object.assign(userConfig, config);
    }
  } catch (e) {}

  // 设置事件
  ipcMain.handle('set-user-config', (_evt, config: UserConfig) => {
    Object.assign(userConfig, config);
    return writeFileSync(path.join(DATA_DIR, 'config.json'), JSON.stringify(config), {
      encoding: 'utf8',
    });
  });

  ipcMain.handle('get-user-config', (): UserConfig => {
    return userConfig;
  });

  ipcMain.handle('get-local-history-list', () => {
    return readdirSync(SAVES_DIR)
      .filter((fileName) => fileName.endsWith('.json'))
      .map((fileName) => {
        const filePath = path.join(SAVES_DIR, fileName);
        const stat = statSync(filePath);
        // @ts-ignore
        stat.fileName = fileName;
        return stat;
      })
      .sort((a, b) => (a.mtime < b.mtime ? 1 : -1))
      .map((data) => ({
        // @ts-ignore
        title: data.fileName,
        description: data.mtime.toLocaleDateString(),
      }));
  });

  ipcMain.handle('get-local-file-content', (_evt, fileName: string) => {
    return readFileSync(path.join(SAVES_DIR, fileName), 'utf8');
  });

  ipcMain.handle(
    'rename-local-file',
    (_evt, fileName: string, newname: string): LocalResult<null> => {
      try {
        renameSync(path.join(SAVES_DIR, fileName), path.join(SAVES_DIR, newname));
        return null;
      } catch (err: any) {
        err.showMessage = '重命名失败！';
        return err as LocalError;
      }
    },
  );

  ipcMain.handle('delete-local-file', (_evt, fileName: string) => {
    try {
      rmSync(path.join(SAVES_DIR, fileName));
      return;
    } catch (err) {
      return err as LocalError;
    }
  });

  ipcMain.handle(
    'save-local-file',
    (
      _evt,
      fileName: string,
      data: string | Buffer,
      folder: string = SAVES_DIR,
    ): undefined | Error => {
      try {
        if (typeof data === 'string') {
          writeFileSync(path.join(folder || SAVES_DIR, fileName), data, {
            encoding: 'utf8',
          });
        } else {
          writeFileSync(path.join(folder || SAVES_DIR, fileName), new Uint8Array(data));
        }

        return;
      } catch (err) {
        (err as LocalError).showMessage =
          'Error saving local file because of error: ' + (err as LocalError).message;
        return err as LocalError;
      }
    },
  );

  ipcMain.handle('new-window', (_evt, url: string, browser: boolean): LocalResult<null> => {
    try {
      if (browser) {
        shell.openExternal(url);
        return null;
      }
      const win = new BrowserWindow({
        frame: true,
        width: 1600,
        height: 1024,
        minWidth: 1600,
        minHeight: 1024,
        icon: join(app.getAppPath(), 'src/assets/ico/map32.ico'),
        titleBarStyle: 'hidden',
        webPreferences: {
          webSecurity: false,
          nodeIntegration: true,
          preload: join(app.getAppPath(), 'electron/preload/dist/index.cjs'),
        },
      });
      attachTitlebarToWindow(win);
      win.on('ready-to-show', () => {
        win.maximize();
        win?.show();
        if (import.meta.env.DEV) {
          win?.webContents.openDevTools();
        }
      });

      win.loadURL(url);
      return null;
    } catch (err) {
      return err as LocalError;
    }
  });

  ipcMain.handle('maximize-window', () => {
    mainWindow.maximize();
  })
}
