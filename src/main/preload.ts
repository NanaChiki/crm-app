import { contextBridge, ContextBridge, ipcRenderer } from 'electron';

// Renderer プロセスで使用するAPIを定義
contextBridge.exposeInMainWorld('electronAPI', {
  // 今後、ファイル操作やデータベース操作用のAPIを追加
  getVersion: () => process.versions.electron,
});
