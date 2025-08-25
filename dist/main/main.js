"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var path = require("path");
function createWindow() {
    var mainWindow = new electron_1.BrowserWindow({
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
    var isDev = process.env.NODE_ENV === 'development' || !electron_1.app.isPackaged;
    if (isDev) {
        console.log('Loading development URL: http://localhost:5174');
        mainWindow.loadURL('http://localhost:5174'); // Updated to current Vite port
        mainWindow.webContents.openDevTools();
        // 詳細なログ追加
        mainWindow.webContents.on('did-start-loading', function () {
            console.log('Started loading content...');
        });
        mainWindow.webContents.on('did-finish-load', function () {
            console.log('Finished loading content successfully!');
            // ウィンドウを確実に前面に表示
            mainWindow.focus();
            mainWindow.moveTop();
        });
        mainWindow.webContents.on('did-fail-load', function (event, errorCode, errorDescription) {
            console.error('Failed to load content:', errorCode, errorDescription);
        });
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }
    mainWindow.once('ready-to-show', function () {
        mainWindow.show();
    });
}
// Electronの初期化完了後にウィンドウを作成
electron_1.app.whenReady().then(createWindow);
// 全ウィンドウが閉じられた時の処理
electron_1.app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', function () {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
// メニューバーの設定（50代ユーザー向けにシンプルに）
electron_1.Menu.setApplicationMenu(electron_1.Menu.buildFromTemplate([
    {
        label: 'ファイル',
        submenu: [{ role: 'quit', label: '終了' }],
    },
    {
        label: 'ヘルプ',
        submenu: [
            {
                label: 'このアプリについて',
                click: function () {
                    // アプリ情報を表示
                },
            },
        ],
    },
]));
