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

// Window API型定義はsrc/types/global.d.tsで定義済み

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

  /** 顧客データCSVインポート */
  importCustomersCSV: () => Promise<void>;
}

// 1. Context作成 - 「箱」を作る（中身はまだ空）
const CSVContext = createContext<CSVContextType | null>(null);

// =============================================================================
// CSVProvider - Context Provider実装
// =============================================================================

interface CSVProviderProps {
  children: ReactNode;
}

// 2. Providerでデータを入れる - 「箱」にデータを入れて、子コンポーネント全体を包む
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
      // メインプロセスのCSVエクスポート処理を呼び出し
      const result = await window.csvAPI.exportCustomers();

      // ユーザーがキャンセルした場合
      if (result.canceled) {
        return; // 何も表示しない
      }

      // 成功時
      if (result.success) {
        showSnackbar(
          result.message || '顧客データをCSVファイルに出力しました',
          'success',
          8000 // 保存先を確認できるように長めに表示
        );
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
      // メインプロセスのCSVエクスポート処理を呼び出し
      const result = await window.csvAPI.exportServiceRecords();

      // ユーザーがキャンセルした場合
      if (result.canceled) {
        return; // 何も表示しない
      }

      // 成功時
      if (result.success) {
        showSnackbar(
          result.message || 'サービス履歴をCSVファイルに出力しました',
          'success',
          8000 // 保存先を確認できるように長めに表示
        );
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

  /**
   * 顧客データをCSVインポート
   *
   * 【処理フロー】
   * 1. ローディング開始
   * 2. ファイル選択ダイアログ表示
   * 3. CSVパース・バリデーション
   * 4. データベースに一括登録
   * 5. 結果メッセージ表示
   *
   * 【50代配慮】
   * - インポート件数を明示
   * - スキップ理由を具体的に表示
   * - 成功時に次のアクションを案内
   */
  const importCustomersCSV = useCallback(async (): Promise<void> => {
    setLoading(true);

    try {
      const result = await window.csvAPI.importCustomers();

      // ユーザーがキャンセルした場合
      if (result.canceled) {
        return;
      }

      // 成功時
      if (result.success) {
        let message =
          result.message ||
          `${result.imported}件の顧客データをインポートしました`;

        // スキップがあった場合は詳細を追加
        if (result.skipped && result.skipped > 0) {
          message += `\n\n⚠️ ${result.skipped}件はスキップされました`;
          if (result.errors && result.errors.length > 0) {
            message += `:\n${result.errors.slice(0, 3).join('\n')}`;
            if (result.errors.length > 3) {
              message += `\n...他${result.errors.length - 3}件`;
            }
          }
        }

        showSnackbar(
          message,
          result.skipped && result.skipped > 0 ? 'warning' : 'success',
          10000
        );
      } else {
        // エラー時
        const errorMessage =
          result.message || 'CSVファイルのインポートに失敗しました';
        let detailedMessage = errorMessage;

        if (result.errors && result.errors.length > 0) {
          detailedMessage += `\n\n${result.errors.slice(0, 3).join('\n')}`;
        }

        showSnackbar(detailedMessage, 'error', 10000);
      }
    } catch (error) {
      console.error('❌ CSVインポート例外エラー:', error);
      showSnackbar(
        'CSVファイルのインポート中にエラーが発生しました。\nファイル形式を確認してもう一度お試しください。',
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
    importCustomersCSV,
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
// 3. 子コンポーネントでデータを取り出す - 「箱」からデータを取り出す。
// useContext = Providerが提供したデータを取り出す関数
export function useCSV(): CSVContextType {
  const context = useContext(CSVContext);

  if (!context) {
    throw new Error('useCSV must be used within CSVProvider');
  }

  return context;
}
