import * as fs from "fs/promises";
import * as fsSync from "fs";
import * as os from "os";
import * as path from "path";
import { app, BrowserWindow, Menu, dialog, ipcMain, shell } from "electron";

import { createBackup } from "./backup/createBackup";
import { restoreBackup } from "./backup/restoreBackup";
import { generateCustomersCSV } from "./csv/exportCustomers";
import { generateServiceRecordsCSV } from "./csv/exportServiceRecords";
import {
  createCustomer,
  deleteCustomer,
  disconnectPrismaCustomer,
  fetchCustomers,
  updateCustomer,
} from "./database/customerHandlers";
import {
  cancelReminder,
  createReminder,
  deleteReminder,
  disconnectPrisma,
  fetchReminders,
  markReminderAsDrafting,
  markReminderAsSent,
  rescheduleReminder,
  updateReminder,
} from "./database/reminderHandlers";
import {
  createServiceRecord,
  deleteServiceRecord,
  disconnectPrismaServiceRecord,
  fetchServiceRecords,
  updateServiceRecord,
} from "./database/serviceRecordHandlers";
import {
  createOutlookEvent,
  getFriendlyErrorMessage,
  sendOutlookEmail,
} from "./outlook";

// ================================
// データベースパス設定
// ================================

/**
 * データベースファイルパスを設定する
 * 開発環境: src/database/dev.db
 * 本番環境: userData/dev.db（書き込み可能）
 */
function setupDatabasePath(): void {
  const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

  if (isDev) {
    // 開発環境: プロジェクトルートのsrc/database/dev.dbを使用
    const dbPath = path.join(__dirname, "../../src/database/dev.db");
    process.env.DATABASE_URL = `file:${dbPath}`;
  } else {
    // 本番環境: userDataディレクトリにデータベースを配置
    const userDataPath = app.getPath("userData");
    const dbPath = path.join(userDataPath, "dev.db");
    process.env.DATABASE_URL = `file:${dbPath}`;

    // 初回起動時: データベースファイルをコピー
    if (!fsSync.existsSync(dbPath)) {
      const sourceDbPath = path.join(
        process.resourcesPath,
        "database",
        "dev.db",
      );
      if (fsSync.existsSync(sourceDbPath)) {
        fsSync.copyFileSync(sourceDbPath, dbPath);
      }
    }
  }
}

// アプリ起動時にデータベースパスを設定
setupDatabasePath();

// 開発環境でのセキュリティ警告を抑制
// 本番環境（パッケージ化後）では警告は表示されないため、開発環境のみ抑制
if (process.env.NODE_ENV === "development" || !app.isPackaged) {
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";
}

/**
 * メインウィンドウを作成する
 *
 * @returns {void}
 */
function createWindow(): void {
  const preloadPath = path.join(__dirname, "preload.js");

  const mainWindow = new BrowserWindow({
    height: 800,
    width: 1200,
    minHeight: 600,
    minWidth: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
    },
    titleBarStyle: "default",
    show: true,
    alwaysOnTop: false,
    center: true, // ウィンドウを画面中央に配置
  });

  // 開発環境ではlocalhost、本番環境ではファイルをロード
  const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL("http://localhost:5174"); // Updated to current Vite port
    mainWindow.webContents.openDevTools();

    mainWindow.webContents.on("did-finish-load", () => {
      // ウィンドウを確実に前面に表示
      mainWindow.focus();
      mainWindow.moveTop();
    });

    mainWindow.webContents.on(
      "did-fail-load",
      (_event: any, errorCode: number, errorDescription: string) => {
        console.error("Failed to load content:", errorCode, errorDescription);
      },
    );
  } else {
    // 本番環境: app.asar内のdist/index.htmlをロード
    // __dirname = app.asar/dist/main なので、../index.html が正しい
    const indexPath = path.join(__dirname, "../index.html");
    console.log("Production mode - Loading file:", indexPath);
    console.log("__dirname:", __dirname);
    console.log("File exists:", fsSync.existsSync(indexPath));

    mainWindow.loadFile(indexPath).catch((err: any) => {
      console.error("Failed to load file:", err);
    });
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });
}

// Electronの初期化完了後にウィンドウを作成
app.whenReady().then(createWindow);

// 全ウィンドウが閉じられた時の処理
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// アプリ終了時のクリーンアップ
app.on("before-quit", async () => {
  try {
    await disconnectPrisma();
  } catch (error) {
    console.error("❌ リマインダーPrisma切断エラー:", error);
  }

  try {
    await disconnectPrismaCustomer();
  } catch (error) {
    console.error("❌ 顧客Prisma切断エラー:", error);
  }

  try {
    await disconnectPrismaServiceRecord();
  } catch (error) {
    console.error("❌ サービス履歴Prisma切断エラー:", error);
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// メニューバーの設定（50代ユーザー向けにシンプルに）
Menu.setApplicationMenu(
  Menu.buildFromTemplate([
    {
      label: "ファイル",
      submenu: [{ role: "quit", label: "終了" }],
    },
    {
      label: "表示",
      submenu: [
        {
          label: "再読み込み",
          accelerator: "CmdOrCtrl+R",
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              focusedWindow.reload();
            }
          },
        },
        {
          label: "開発者ツール",
          accelerator: "CmdOrCtrl+Shift+I",
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              focusedWindow.webContents.toggleDevTools();
            }
          },
        },
        { type: "separator" },
        { role: "resetZoom", label: "実際のサイズ" },
        { role: "zoomIn", label: "拡大" },
        { role: "zoomOut", label: "縮小" },
      ],
    },
    {
      label: "ヘルプ",
      submenu: [
        {
          label: "このアプリについて",
          click: () => {
            // アプリ情報を表示
          },
        },
      ],
    },
  ]),
);

// ================================
// OutLook連携IPCハンドラー
// ================================

/**
 * OutLookメール送信
 */
ipcMain.handle("outlook:send-email", async (_event: any, emailData: any) => {
  try {
    const result = await sendOutlookEmail(emailData);

    return result;
  } catch (error: any) {
    console.error("❌ IPC: メール送信エラー:", error);

    return {
      success: false,
      message: getFriendlyErrorMessage(error.message),
      error: error.message,
    };
  }
});

/**
 * OutLookカレンダー予定作成
 */
ipcMain.handle("outlook:create-event", async (_event: any, eventData: any) => {
  try {
    const result = await createOutlookEvent(eventData);

    return result;
  } catch (error: any) {
    console.error("❌ IPC: カレンダー予定作成エラー:", error);

    return {
      success: false,
      message: getFriendlyErrorMessage(error.message),
      error: error.message,
    };
  }
});

console.log("✅ OutLook IPC ハンドラー登録完了");

// ================================
// リマインダーIPCハンドラー
// ================================

/**
 * リマインダー取得
 */
ipcMain.handle("reminder:fetch", async (_event: any, filters: any) => {
  try {
    const result = await fetchReminders(filters);
    return result;
  } catch (error: any) {
    console.error("❌ IPC: リマインダー取得エラー:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

/**
 * リマインダー作成
 */
ipcMain.handle("reminder:create", async (_event: any, input: any) => {
  try {
    const result = await createReminder(input);
    return result;
  } catch (error: any) {
    console.error("❌ IPC: リマインダー作成エラー:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

/**
 * リマインダー更新
 */
ipcMain.handle("reminder:update", async (_event: any, input: any) => {
  try {
    const result = await updateReminder(input);
    return result;
  } catch (error: any) {
    console.error("❌ IPC: リマインダー更新エラー:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

/**
 * リマインダー削除
 */
ipcMain.handle("reminder:delete", async (_event: any, reminderId: number) => {
  try {
    const result = await deleteReminder(reminderId);
    return result;
  } catch (error: any) {
    console.error("❌ IPC: リマインダー削除エラー:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

/**
 * リマインダーを送信済みにする
 */
ipcMain.handle(
  "reminder:mark-sent",
  async (_event: any, reminderId: number) => {
    try {
      const result = await markReminderAsSent(reminderId);
      return result;
    } catch (error: any) {
      console.error("❌ IPC: リマインダー送信済み変更エラー:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
);

/**
 * リマインダーをキャンセルする
 */
ipcMain.handle("reminder:cancel", async (_event: any, reminderId: number) => {
  try {
    const result = await cancelReminder(reminderId);
    return result;
  } catch (error: any) {
    console.error("❌ IPC: リマインダーキャンセルエラー:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

/**
 * リマインダーを再スケジュールする
 */
ipcMain.handle(
  "reminder:reschedule",
  async (_event: any, reminderId: number) => {
    try {
      const result = await rescheduleReminder(reminderId);
      return result;
    } catch (error: any) {
      console.error("❌ IPC: リマインダー再スケジュールエラー:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
);

/**
 * リマインダーを下書き中にする
 */
ipcMain.handle(
  "reminder:mark-drafting",
  async (_event: any, reminderId: number) => {
    try {
      const result = await markReminderAsDrafting(reminderId);
      return result;
    } catch (error: any) {
      console.error("❌ IPC: リマインダー下書き変更エラー:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
);

console.log("✅ リマインダーIPC ハンドラー登録完了");

// ================================
// 顧客IPC ハンドラー
// ================================

/**
 * 顧客取得IPCハンドラー
 */
ipcMain.handle("customer:fetch", async (_event: any, filters: any) => {
  try {
    const result = await fetchCustomers(filters);
    return result;
  } catch (error: any) {
    console.error("❌ IPC: 顧客取得エラー:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

/**
 * 顧客作成IPCハンドラー
 */
ipcMain.handle("customer:create", async (_event: any, input: any) => {
  try {
    const result = await createCustomer(input);
    return result;
  } catch (error: any) {
    console.error("❌ IPC: 顧客作成エラー:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

/**
 * 顧客更新IPCハンドラー
 */
ipcMain.handle("customer:update", async (_event: any, input: any) => {
  try {
    const result = await updateCustomer(input);
    return result;
  } catch (error: any) {
    console.error("❌ IPC: 顧客更新エラー:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

/**
 * 顧客削除IPCハンドラー
 */
ipcMain.handle("customer:delete", async (_event: any, customerId: number) => {
  try {
    const result = await deleteCustomer(customerId);
    return result;
  } catch (error: any) {
    console.error("❌ IPC: 顧客削除エラー:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

console.log("✅ 顧客IPC ハンドラー登録完了");

// ================================
// サービス履歴IPC ハンドラー
// ================================

/**
 * サービス履歴取得IPCハンドラー
 */
ipcMain.handle("service:fetch", async (_event: any, filters: any) => {
  try {
    const result = await fetchServiceRecords(filters);
    return result;
  } catch (error: any) {
    console.error("❌ IPC: サービス履歴取得エラー:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

/**
 * サービス履歴作成IPCハンドラー
 */
ipcMain.handle("service:create", async (_event: any, input: any) => {
  try {
    const result = await createServiceRecord(input);
    return result;
  } catch (error: any) {
    console.error("❌ IPC: サービス履歴作成エラー:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

/**
 * サービス履歴更新IPCハンドラー
 */
ipcMain.handle("service:update", async (_event: any, input: any) => {
  try {
    const result = await updateServiceRecord(input);
    return result;
  } catch (error: any) {
    console.error("❌ IPC: サービス履歴更新エラー:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

/**
 * サービス履歴削除IPCハンドラー
 */
ipcMain.handle("service:delete", async (_event: any, recordId: number) => {
  try {
    const result = await deleteServiceRecord(recordId);
    return result;
  } catch (error: any) {
    console.error("❌ IPC: サービス履歴削除エラー:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

console.log("✅ サービス履歴IPC ハンドラー登録完了");

// =============================
// CSV エクスポート IPC ハンドラー
// =============================

/**
 * 顧客データCSVエクスポート
 *
 * 【50代配慮】
 * - デスクトップをデフォルト保存先に
 * - 日付入りのファイル名で分かりやすく
 * - BOM付きUTF-8でExcel対応
 * - 保存先パスを成功メッセージに含める
 */
ipcMain.handle("csv:export-customers", async () => {
  try {
    // CSV文字列を生成
    const csvContent = await generateCustomersCSV();

    // 現在の日付を取得してファイル名に使用
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;
    const defaultFileName = `顧客データ_${dateStr}.csv`;

    // ファイル保存ダイアログ表示
    const result = await dialog.showSaveDialog({
      title: "顧客データをCSVファイルに保存",
      defaultPath: path.join(os.homedir(), "Desktop", defaultFileName),
      filters: [
        { name: "CSVファイル", extensions: ["csv"] },
        { name: "すべてのファイル", extensions: ["*"] },
      ],
    });

    // キャンセルされた場合
    if (result.canceled || !result.filePath) {
      return {
        success: false,
        canceled: true,
      };
    }

    // BOM付きUTF-8で保存（Excelで文字化けしない）
    const bom = "\uFEFF";
    await fs.writeFile(result.filePath, bom + csvContent, "utf-8");

    return {
      success: true,
      filePath: result.filePath,
      message: `顧客データを保存しました:\n${result.filePath}`,
    };
  } catch (error: any) {
    console.error("❌ CSV エクスポートエラー:", error);
    return {
      success: false,
      error: error.message || "ファイルの保存に失敗しました",
    };
  }
});

/**
 * サービス履歴CSVエクスポート（ジョブカン請求書用）
 */
ipcMain.handle("csv:export-service-records", async () => {
  try {
    // CSV文字列を生成
    const csvContent = await generateServiceRecordsCSV();

    // 現在の日付を取得してファイル名に使用
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;
    const defaultFileName = `サービス履歴_${dateStr}.csv`;

    // ファイル保存ダイアログ表示
    const result = await dialog.showSaveDialog({
      title: "サービス履歴をCSVファイルに保存",
      defaultPath: path.join(os.homedir(), "Desktop", defaultFileName),
      filters: [
        { name: "CSVファイル", extensions: ["csv"] },
        { name: "すべてのファイル", extensions: ["*"] },
      ],
    });

    // キャンセルされた場合
    if (result.canceled || !result.filePath) {
      return {
        success: false,
        canceled: true,
      };
    }

    // BOM付きUTF-8で保存（Excelで文字化けしない）
    const bom = "\uFEFF";
    await fs.writeFile(result.filePath, bom + csvContent, "utf-8");

    return {
      success: true,
      filePath: result.filePath,
      message: `サービス履歴を保存しました:\n${result.filePath}`,
    };
  } catch (error: any) {
    console.error("❌ サービス履歴CSVエクスポートエラー:", error);
    return {
      success: false,
      error: error.message || "ファイルの保存に失敗しました",
    };
  }
});

console.log("✅ CSV エクスポート IPC ハンドラー登録完了");

// =============================
// バックアップ・リストア IPC ハンドラー
// =============================

/**
 * バックアップ作成
 *
 * 【50代配慮】
 * - デスクトップをデフォルト保存先に
 * - 日時入りのファイル名で分かりやすく
 * - 保存先パスを成功メッセージに含める
 * - 自動で復元前バックアップ作成
 */
ipcMain.handle("backup:create", async () => {
  try {
    // 現在の日時を取得してファイル名に使用
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
    const defaultFileName = `CRMバックアップ_${dateStr}.zip`;

    // ファイル保存ダイアログ表示
    const result = await dialog.showSaveDialog({
      title: "バックアップを保存",
      defaultPath: path.join(os.homedir(), "Desktop", defaultFileName),
      filters: [{ name: "ZIPファイル", extensions: ["zip"] }],
    });

    // キャンセルされた場合
    if (result.canceled || !result.filePath) {
      return {
        success: false,
        canceled: true,
      };
    }

    // バックアップ作成
    await createBackup(result.filePath);

    return {
      success: true,
      filePath: result.filePath,
      message: `バックアップを作成しました:\n${result.filePath}`,
    };
  } catch (error: any) {
    console.error("❌ バックアップ作成エラー:", error);
    return {
      success: false,
      error: error.message || "バックアップの作成に失敗しました",
    };
  }
});

/**
 * アプリバージョン情報取得
 *
 * 【機能】
 * - アプリケーションバージョン（package.json）
 * - Electronバージョン
 * - Node.jsバージョン
 * - Chromiumバージョン
 *
 * 【用途】
 * - 設定画面のアプリ情報表示
 * - デバッグ情報提供
 */
ipcMain.handle("app:get-versions", () => {
  return {
    app: app.getVersion(), // package.jsonのversion
    electron: process.versions.electron,
    node: process.versions.node,
    chrome: process.versions.chrome,
  };
});

/**
 * 外部URLをシステムデフォルトブラウザで開く
 *
 * 【機能】
 * - shell.openExternalでシステムブラウザ起動
 * - GitHub、ウェブサイト、メールリンク等に対応
 *
 * 【セキュリティ】
 * - httpまたはhttps、mailto:のみ許可
 * - 悪意のあるプロトコル（file:、javascript:等）はブロック
 */
ipcMain.handle("app:open-external", async (_event: any, url: string) => {
  try {
    // セキュリティチェック: 許可されたプロトコルのみ
    const allowedProtocols = ["http:", "https:", "mailto:"];
    const urlObj = new URL(url);

    if (!allowedProtocols.includes(urlObj.protocol)) {
      throw new Error(`許可されていないプロトコルです: ${urlObj.protocol}`);
    }

    // システムデフォルトブラウザで開く
    await shell.openExternal(url);

    return { success: true };
  } catch (error: any) {
    console.error("外部URLを開けませんでした:", error);
    return {
      success: false,
      error: error.message || "URLを開けませんでした",
    };
  }
});

/**
 * バックアップから復元
 *
 * 【50代配慮】
 * - 復元前に自動バックアップ作成
 * - 分かりやすい成功メッセージ
 * - 丁寧なエラーメッセージ
 */
ipcMain.handle("backup:restore", async () => {
  try {
    // ファイル選択ダイアログ表示
    const result = await dialog.showOpenDialog({
      title: "バックアップファイルを選択",
      defaultPath: path.join(os.homedir(), "Desktop"),
      filters: [{ name: "ZIPファイル", extensions: ["zip"] }],
      properties: ["openFile"],
    });

    // キャンセルされた場合
    if (result.canceled || result.filePaths.length === 0) {
      return {
        success: false,
        canceled: true,
      };
    }

    const backupFilePath = result.filePaths[0];

    // 復元前に自動バックアップを作成
    const autoBackupDir = path.join(os.homedir(), "Desktop");
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
    const autoBackupPath = path.join(
      autoBackupDir,
      `自動バックアップ_復元前_${dateStr}.zip`,
    );

    await createBackup(autoBackupPath);

    // バックアップから復元
    await restoreBackup(backupFilePath);

    return {
      success: true,
      message: "バックアップから復元しました。\n\nアプリを再起動してください。",
    };
  } catch (error: any) {
    console.error("❌ バックアップ復元エラー:", error);
    return {
      success: false,
      error: error.message || "復元に失敗しました",
    };
  }
});

console.log("✅ バックアップ・リストア IPC ハンドラー登録完了");
