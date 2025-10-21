import { contextBridge, ipcRenderer } from 'electron';

// Renderer プロセスで使用するAPIを定義
contextBridge.exposeInMainWorld('electronAPI', {
  // 今後、ファイル操作やデータベース操作用のAPIを追加
  getVersion: () => process.versions.electron,
});

// ================================
// OutLook API公開
// ================================

contextBridge.exposeInMainWorld('outlookAPI', {
  /**
   * メール送信
   */
  sendEmail: (emailData: any) =>
    ipcRenderer.invoke('outlook:send-email', emailData),

  /**
   * カレンダー予定作成
   */
  createEvent: (eventData: any) =>
    ipcRenderer.invoke('outlook:create-event', eventData),
});

console.log('✅ OutLook API公開完了');

// ================================
// リマインダーAPI公開
// ================================

contextBridge.exposeInMainWorld('reminderAPI', {
  /**
   * リマインダー取得
   */
  fetch: (filters?: any) => ipcRenderer.invoke('reminder:fetch', filters),

  /**
   * リマインダー作成
   */
  create: (input: any) => ipcRenderer.invoke('reminder:create', input),

  /**
   * リマインダー更新
   */
  update: (input: any) => ipcRenderer.invoke('reminder:update', input),

  /**
   * リマインダー削除
   */
  delete: (reminderId: number) =>
    ipcRenderer.invoke('reminder:delete', reminderId),

  /**
   * リマインダーを送信済みにする
   */
  markAsSent: (reminderId: number) =>
    ipcRenderer.invoke('reminder:mark-sent', reminderId),

  /**
   * リマインダーをキャンセルする
   */
  cancel: (reminderId: number) =>
    ipcRenderer.invoke('reminder:cancel', reminderId),

  /**
   * リマインダーを再スケジュールする
   */
  reschedule: (reminderId: number) =>
    ipcRenderer.invoke('reminder:reschedule', reminderId),

  /**
   * リマインダーを下書き中にする
   */
  markAsDrafting: (reminderId: number) =>
    ipcRenderer.invoke('reminder:mark-drafting', reminderId),
});

console.log('✅ リマインダーAPI公開完了');

// ================================
// 顧客API公開
// ================================

contextBridge.exposeInMainWorld('customerAPI', {
  /**
   * 顧客取得
   */
  fetch: (filters?: any) => ipcRenderer.invoke('customer:fetch', filters),

  /**
   * 顧客作成
   */
  create: (input: any) => ipcRenderer.invoke('customer:create', input),

  /**
   * 顧客更新
   */
  update: (input: any) => ipcRenderer.invoke('customer:update', input),

  /**
   * 顧客削除
   */
  delete: (customerId: number) =>
    ipcRenderer.invoke('customer:delete', customerId),
});

console.log('✅ 顧客API公開完了');

// ================================
// サービス履歴API公開
// ================================

contextBridge.exposeInMainWorld('serviceRecordAPI', {
  /**
   * サービス履歴取得
   */
  fetch: (filters?: any) => ipcRenderer.invoke('service:fetch', filters),

  /**
   * サービス履歴作成
   */
  create: (input: any) => ipcRenderer.invoke('service:create', input),

  /**
   * サービス履歴更新
   */
  update: (input: any) => ipcRenderer.invoke('service:update', input),

  /**
   * サービス履歴削除
   */
  delete: (recordId: number) =>
    ipcRenderer.invoke('service:delete', recordId),
});

console.log('✅ サービス履歴API公開完了');

// ================================
// CSV API公開
// ================================

contextBridge.exposeInMainWorld('csvAPI', {
  /**
   * 顧客データCSVエクスポート
   */
  exportCustomers: () => ipcRenderer.invoke('csv:export-customers'),

  /**
   * サービス履歴CSVエクスポート（ジョブカン請求書用）
   */
  exportServiceRecords: () => ipcRenderer.invoke('csv:export-service-records'),
});

console.log('✅ CSV API公開完了');
