/**
 * global.d.ts
 *
 * グローバル型定義ファイル
 * Electron IPC APIの型定義を提供
 */

/**
 * Outlook連携用メールデータ
 */
export interface OutlookEmailData {
  to: string;
  subject: string;
  body: string;
  cc?: string;
}

/**
 * Outlook連携用カレンダーイベントデータ
 */
export interface OutlookEventData {
  subject: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  body?: string;
  reminderMinutes?: number;
}

/**
 * APIレスポンス共通型
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * バックアップ結果
 */
export interface BackupResult {
  success: boolean;
  path?: string;
  error?: string;
}

/**
 * リストア結果
 */
export interface RestoreResult {
  success: boolean;
  error?: string;
}

/**
 * アプリバージョン情報
 */
export interface AppVersions {
  app: string;
  electron: string;
  node: string;
  chrome: string;
}

/**
 * Window オブジェクトの拡張
 * Electron IPC API を型安全に使用するための定義
 */
declare global {
  interface Window {
    /**
     * Electron基本API
     */
    electronAPI: {
      getVersion: () => string;
    };

    /**
     * Outlook連携API
     */
    outlookAPI: {
      sendEmail: (emailData: OutlookEmailData) => Promise<ApiResponse>;
      createEvent: (eventData: OutlookEventData) => Promise<ApiResponse>;
    };

    /**
     * リマインダーAPI
     */
    reminderAPI: {
      fetch: (filters?: any) => Promise<ApiResponse>;
      create: (input: any) => Promise<ApiResponse>;
      update: (input: any) => Promise<ApiResponse>;
      delete: (reminderId: number) => Promise<ApiResponse>;
      markAsSent: (reminderId: number) => Promise<ApiResponse>;
      cancel: (reminderId: number) => Promise<ApiResponse>;
      reschedule: (reminderId: number) => Promise<ApiResponse>;
      markAsDrafting: (reminderId: number) => Promise<ApiResponse>;
    };

    /**
     * 顧客API
     */
    customerAPI: {
      fetch: (filters?: any) => Promise<ApiResponse>;
      create: (input: any) => Promise<ApiResponse>;
      update: (input: any) => Promise<ApiResponse>;
      delete: (customerId: number) => Promise<ApiResponse>;
    };

    /**
     * サービス履歴API
     */
    serviceRecordAPI: {
      fetch: (filters?: any) => Promise<ApiResponse>;
      create: (input: any) => Promise<ApiResponse>;
      update: (input: any) => Promise<ApiResponse>;
      delete: (recordId: number) => Promise<ApiResponse>;
      uploadPhoto: (data: {
        recordId: number;
        filePath: string;
      }) => Promise<ApiResponse<{ photoPath: string }>>;
    };

    /**
     * ダイアログAPI
     */
    dialogAPI: {
      selectImageFile: () => Promise<
        ApiResponse<{ filePath: string }> & { canceled?: boolean }
      >;
    };

    /**
     * CSV API
     */
    csvAPI: {
      exportCustomers: () => Promise<ApiResponse<{ path: string }>>;
      exportServiceRecords: () => Promise<ApiResponse<{ path: string }>>;
    };

    /**
     * バックアップAPI
     */
    backupAPI: {
      createBackup: () => Promise<BackupResult>;
      restoreBackup: () => Promise<RestoreResult>;
    };

    /**
     * アプリ情報API
     */
    appAPI: {
      getVersions: () => Promise<AppVersions>;
      openExternal: (url: string) => Promise<ApiResponse>;
      getUserDataPath: () => Promise<ApiResponse<{ path: string }>>;
    };
  }
}

export {};
