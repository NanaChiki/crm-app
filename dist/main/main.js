import { app, BrowserWindow, Menu } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
// ES modules用の__dirnameの代替
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
function createWindow() {
    const mainWindow = new BrowserWindow({
        height: 800,
        width: 1200,
        minHeight: 600,
        minWidth: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
        titleBarStyle: 'default',
        show: true,
        alwaysOnTop: false,
        center: true, // ウィンドウを画面中央に配置
    });
    // 開発環境ではlocalhost、本番環境ではファイルをロード
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
    if (isDev) {
        console.log('Loading development URL: http://localhost:5174');
        mainWindow.loadURL('http://localhost:5174'); // Updated to current Vite port
        mainWindow.webContents.openDevTools();
        // 詳細なログ追加
        mainWindow.webContents.on('did-start-loading', () => {
            console.log('Started loading content...');
        });
        mainWindow.webContents.on('did-finish-load', () => {
            console.log('Finished loading content successfully!');
            // ウィンドウを確実に前面に表示
            mainWindow.focus();
            mainWindow.moveTop();
        });
        mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
            console.error('Failed to load content:', errorCode, errorDescription);
        });
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });
}
// Electronの初期化完了後にウィンドウを作成
app.whenReady().then(createWindow);
// 全ウィンドウが閉じられた時の処理
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
// メニューバーの設定（50代ユーザー向けにシンプルに）
Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
        label: 'ファイル',
        submenu: [{ role: 'quit', label: '終了' }],
    },
    {
        label: 'ヘルプ',
        submenu: [
            {
                label: 'このアプリについて',
                click: () => {
                    // アプリ情報を表示
                },
            },
        ],
    },
]));
