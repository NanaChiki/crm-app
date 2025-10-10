"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Renderer プロセスで使用するAPIを定義
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // 今後、ファイル操作やデータベース操作用のAPIを追加
    getVersion: () => process.versions.electron,
});
// ================================
// OutLook API公開
// ================================
electron_1.contextBridge.exposeInMainWorld('outlookAPI', {
    /**
     * メール送信
     */
    sendEmail: (emailData) => electron_1.ipcRenderer.invoke('outlook:send-email', emailData),
    /**
     * カレンダー予定作成
     */
    createEvent: (eventData) => electron_1.ipcRenderer.invoke('outlook:create-event', eventData),
});
console.log('✅ OutLook API公開完了');
