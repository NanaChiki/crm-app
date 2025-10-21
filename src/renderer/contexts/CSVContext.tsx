/**
 * CSVContext - CSV インポート/エクスポート機能管理
 *
 * ジョブカン連携のためのCSV操作を提供します。
 *
 * 【50代配慮】
 * - 分かりやすいエラーメッセージ
 * - ローディング状態の明示
 * - 成功時の具体的なフィードバック
 */

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';
import { useApp } from './AppContext';

/**
 * Window API型定義（preload.tsで公開されたAPI）
 */
declare global {
  interface Window {
    csvAPI: {
      exportCustomers: () => Promise<{
        success: boolean;
        filePath?: string;
        message?: string;
        error?: string;
        canceled?: boolean;
      }>;
      exportServiceRecords: () => Promise<{
        success: boolean;
        filePath?: string;
        message?: string;
        error?: string;
        canceled?: boolean;
      }>;
    };
  }
}

// =============================================================================
// Context型定義
// =============================================================================

interface CSVContextType {
  /** ローディング状態 */
  loading: boolean;

  /** 顧客データCSVエクスポート */
  exportCustomersCSV: () => Promise<void>;

  /** サービス履歴CSVエクスポート（ジョブカン請求書用） */
  exportServiceRecordsCSV: () => Promise<void>;
}

const CSVContext = createContext<CSVContextType | null>(null);

// =============================================================================
// CSVProvider - Context Provider実装
// =============================================================================

interface CSVProviderProps {
  children: ReactNode;
}

export function CSVProvider({ children }: CSVProviderProps) {
  const { showSnackbar } = useApp();
  const [loading, setLoading] = useState(false);

  /**
   * 顧客データをCSVエクスポート
   *
   * 【処理フロー】
   * 1. ローディング開始
   * 2. メインプロセスのcsvAPI.exportCustomers()を呼び出し
   * 3. ファイル保存ダイアログ表示（メインプロセス側）
   * 4. 成功/エラーメッセージ表示
   * 5. ローディング終了
   *
   * 【50代配慮】
   * - キャンセル時は何も表示しない
   * - 成功時は保存先を表示
   * - エラー時は具体的な解決方法を提示
   */
  const exportCustomersCSV = useCallback(async (): Promise<void> => {
    setLoading(true);

    try {
      console.log('📤 顧客CSVエクスポート開始');

      // メインプロセスのCSVエクスポート処理を呼び出し
      const result = await window.csvAPI.exportCustomers();

      // ユーザーがキャンセルした場合
      if (result.canceled) {
        console.log('ℹ️ CSVエクスポートがキャンセルされました');
        return; // 何も表示しない
      }

      // 成功時
      if (result.success) {
        showSnackbar(
          result.message || '顧客データをCSVファイルに出力しました',
          'success',
          8000 // 保存先を確認できるように長めに表示
        );
        console.log('✅ CSVエクスポート成功');
      } else {
        // エラー時（50代向けに親切なメッセージ）
        const errorMessage =
          result.error ||
          'CSVファイルの保存に失敗しました。もう一度お試しください。';
        showSnackbar(errorMessage, 'error');
        console.error('❌ CSVエクスポート失敗:', result.error);
      }
    } catch (error) {
      console.error('❌ CSVエクスポート例外エラー:', error);

      // 予期しないエラーの場合
      showSnackbar(
        'CSVファイルの保存中にエラーが発生しました。\nアプリを再起動してもう一度お試しください。',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  /**
   * サービス履歴をCSVエクスポート（ジョブカン請求書用）
   *
   * 【処理フロー】
   * 1. メインプロセスのCSVエクスポート処理を呼び出し
   * 2. ファイル保存ダイアログ表示（デスクトップに保存推奨）
   * 3. 成功時に8秒間メッセージ表示（ファイルパス確認用）
   * 4. エラー時に親切なメッセージ表示
   * 5. キャンセル時は何も表示しない
   *
   * 【50代配慮】
   * - 成功メッセージに保存先パスを表示（どこに保存されたか明確）
   * - エラーメッセージは分かりやすい日本語
   * - 解決方法を含む具体的なガイダンス
   */
  const exportServiceRecordsCSV = useCallback(async (): Promise<void> => {
    setLoading(true);

    try {
      console.log('📤 サービス履歴CSVエクスポート開始');

      // メインプロセスのCSVエクスポート処理を呼び出し
      const result = await window.csvAPI.exportServiceRecords();

      // ユーザーがキャンセルした場合
      if (result.canceled) {
        console.log('ℹ️ サービス履歴CSVエクスポートがキャンセルされました');
        return; // 何も表示しない
      }

      // 成功時
      if (result.success) {
        showSnackbar(
          result.message || 'サービス履歴をCSVファイルに出力しました',
          'success',
          8000 // 保存先を確認できるように長めに表示
        );
        console.log('✅ サービス履歴CSVエクスポート成功');
      } else {
        // エラー時（50代向けに親切なメッセージ）
        const errorMessage =
          result.error ||
          'CSVファイルの保存に失敗しました。もう一度お試しください。';
        showSnackbar(errorMessage, 'error');
        console.error('❌ サービス履歴CSVエクスポート失敗:', result.error);
      }
    } catch (error) {
      console.error('❌ サービス履歴CSVエクスポート例外エラー:', error);

      // 予期しないエラーの場合
      showSnackbar(
        'CSVファイルの保存中にエラーが発生しました。\nアプリを再起動してもう一度お試しください。',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  // Context値を提供
  const value: CSVContextType = {
    loading,
    exportCustomersCSV,
    exportServiceRecordsCSV,
  };

  return <CSVContext.Provider value={value}>{children}</CSVContext.Provider>;
}

// =============================================================================
// カスタムHook - useCSV
// =============================================================================

/**
 * CSVContextを使用するカスタムHook
 *
 * 【使用例】
 * ```typescript
 * const { loading, exportCustomersCSV } = useCSV();
 *
 * const handleExport = async () => {
 *   await exportCustomersCSV();
 * };
 * ```
 *
 * @throws CSVProvider外で使用した場合にエラー
 */
export function useCSV(): CSVContextType {
  const context = useContext(CSVContext);

  if (!context) {
    throw new Error('useCSV must be used within CSVProvider');
  }

  return context;
}
