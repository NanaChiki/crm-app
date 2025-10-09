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
    sendEmail: (emailData) => ipcRenderer.invoke('outlook:send-email', emailData),
    /**
     * カレンダー予定作成
     */
    createEvent: (eventData) => ipcRenderer.invoke('outlook:create-event', eventData),
});
console.log('✅ OutLook API公開完了');
