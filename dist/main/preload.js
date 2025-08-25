"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
// Renderer プロセスで使用するAPIを定義
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // 今後、ファイル操作やデータベース操作用のAPIを追加
    getVersion: function () { return process.versions.electron; },
});
