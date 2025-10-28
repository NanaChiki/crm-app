import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  getVersion: () => process.versions.electron,
});

contextBridge.exposeInMainWorld("outlookAPI", {
  /**
   * メール送信
   */
  sendEmail: (emailData: any) =>
    ipcRenderer.invoke("outlook:send-email", emailData),

  /**
   * カレンダー予定作成
   */
  createEvent: (eventData: any) =>
    ipcRenderer.invoke("outlook:create-event", eventData),
});

// ================================
// リマインダーAPI公開
// ================================

contextBridge.exposeInMainWorld("reminderAPI", {
  /**
   * リマインダー取得
   */
  fetch: (filters?: any) => ipcRenderer.invoke("reminder:fetch", filters),

  /**
   * リマインダー作成
   */
  create: (input: any) => ipcRenderer.invoke("reminder:create", input),

  /**
   * リマインダー更新
   */
  update: (input: any) => ipcRenderer.invoke("reminder:update", input),

  /**
   * リマインダー削除
   */
  delete: (reminderId: number) =>
    ipcRenderer.invoke("reminder:delete", reminderId),

  /**
   * リマインダーを送信済みにする
   */
  markAsSent: (reminderId: number) =>
    ipcRenderer.invoke("reminder:mark-sent", reminderId),

  /**
   * リマインダーをキャンセルする
   */
  cancel: (reminderId: number) =>
    ipcRenderer.invoke("reminder:cancel", reminderId),

  /**
   * リマインダーを再スケジュールする
   */
  reschedule: (reminderId: number) =>
    ipcRenderer.invoke("reminder:reschedule", reminderId),

  /**
   * リマインダーを下書き中にする
   */
  markAsDrafting: (reminderId: number) =>
    ipcRenderer.invoke("reminder:mark-drafting", reminderId),
});

// ================================
// 顧客API公開
// ================================

contextBridge.exposeInMainWorld("customerAPI", {
  /**
   * 顧客取得
   */
  fetch: (filters?: any) => ipcRenderer.invoke("customer:fetch", filters),

  /**
   * 顧客作成
   */
  create: (input: any) => ipcRenderer.invoke("customer:create", input),

  /**
   * 顧客更新
   */
  update: (input: any) => ipcRenderer.invoke("customer:update", input),

  /**
   * 顧客削除
   */
  delete: (customerId: number) =>
    ipcRenderer.invoke("customer:delete", customerId),
});

// ================================
// サービス履歴API公開
// ================================

contextBridge.exposeInMainWorld("serviceRecordAPI", {
  /**
   * サービス履歴取得
   */
  fetch: (filters?: any) => ipcRenderer.invoke("service:fetch", filters),

  /**
   * サービス履歴作成
   */
  create: (input: any) => ipcRenderer.invoke("service:create", input),

  /**
   * サービス履歴更新
   */
  update: (input: any) => ipcRenderer.invoke("service:update", input),

  /**
   * サービス履歴削除
   */
  delete: (recordId: number) => ipcRenderer.invoke("service:delete", recordId),
});

// ================================
// CSV API公開
// ================================

contextBridge.exposeInMainWorld("csvAPI", {
  /**
   * 顧客データCSVエクスポート
   */
  exportCustomers: () => ipcRenderer.invoke("csv:export-customers"),

  /**
   * サービス履歴CSVエクスポート（ジョブカン請求書用）
   */
  exportServiceRecords: () => ipcRenderer.invoke("csv:export-service-records"),
});

// ================================
// バックアップAPI公開
// ================================

contextBridge.exposeInMainWorld("backupAPI", {
  /**
   * バックアップ作成
   */
  createBackup: () => ipcRenderer.invoke("backup:create"),

  /**
   * バックアップから復元
   */
  restoreBackup: () => ipcRenderer.invoke("backup:restore"),
});

// ================================
// アプリ情報API公開
// ================================

contextBridge.exposeInMainWorld("appAPI", {
  /**
   * アプリバージョン情報取得
   */
  getVersions: () => ipcRenderer.invoke("app:get-versions"),

  /**
   * 外部URLをシステムデフォルトブラウザで開く
   */
  openExternal: (url: string) => ipcRenderer.invoke("app:open-external", url),
});
