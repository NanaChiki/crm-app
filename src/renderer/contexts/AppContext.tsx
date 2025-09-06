/**
 * 🌟 React Context API - アプリケーション グローバル状態管理
 *
 * React Context APIは、コンポーネントツリー全体で状態を共有するための仕組み。
 * propsの受け渡しが複雑になる「Props Drilling」問題を解決。
 *
 * 🎯 Context APIの主要概念：
 * 1. createContext() - コンテキストの作成
 * 2. Provider - 状態を提供するコンポーネント
 * 3. useContext() - 状態を使用するフック
 * 4. カスタムフック - Context使用を簡単にするラッパー
 *
 * 📚 Props Drilling とは？
 * ```
 * App → Header → Navigation → UserMenu → UserName
 *     ↘ user情報を5層下まで渡す必要がある
 * ```
 *
 * 📚 Context API使用時：
 * ```
 * App (Provider) → どのコンポーネントからも直接アクセス可能
 * ```
 *
 * 🔧 50代・低ITリテラシー向け配慮：
 * - 分かりやすいメソッド名（showSnackbar, handleError）
 * - 日本語での親切なエラーメッセージ
 * - 統一されたローディング表示
 * - 明確な成功フィードバック
 */

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';
import { AppError, SnackbarMessage } from '../../types';

// =============================================================================
// 🎯 Context型定義 - TypeScript型安全性の確保
// =============================================================================

/**
 * AppContext で管理される状態とメソッドの型定義
 *
 * 【設計原則】
 * - 状態（state）とアクション（actions）を明確に分離
 * - 50代ユーザーが直感的に理解できるメソッド名
 * - TypeScriptの型推論を最大活用
 */
export interface AppContextType {
  // =============================
  // 📊 グローバル状態
  // =============================

  /** アプリ全体のローディング状態 */
  globalLoading: boolean;

  /** 現在表示中の通知メッセージ（null の場合は非表示）*/
  snackbarMessage: SnackbarMessage | null;

  // =============================
  // 🎬 アクション（状態変更メソッド）
  // =============================

  /**
   * グローバルローディング状態の制御
   *
   * @param loading - true: ローディング表示, false: ローディング非表示
   *
   * 【使用例】
   * ```typescript
   * const { setGlobalLoading } = useApp();
   *
   * // API呼び出し前
   * setGlobalLoading(true);
   *
   * // API呼び出し後
   * setGlobalLoading(false);
   * ```
   */
  setGlobalLoading: (loading: boolean) => void;

  /**
   * 通知メッセージの表示
   *
   * @param message - 表示するメッセージ内容
   * @param severity - メッセージの種類（success/error/warning/info）
   * @param duration - 表示時間（ミリ秒）、デフォルト: 5000ms (5秒)
   *
   * 【50代向け配慮】
   * - 成功: 「保存しました」等の明確なフィードバック
   * - エラー: 「保存できませんでした。もう一度お試しください」等の親切な表現
   * - 警告: 「確認してください」等の注意喚起
   * - 情報: 「○○を読み込んでいます」等の状況説明
   *
   * 【使用例】
   * ```typescript
   * const { showSnackbar } = useApp();
   *
   * // 成功時
   * showSnackbar('顧客情報を保存しました', 'success');
   *
   * // エラー時
   * showSnackbar('保存できませんでした。もう一度お試しください', 'error');
   * ```
   */
  showSnackbar: (
    message: string,
    severity: SnackbarMessage['severity'],
    duration?: number
  ) => void;

  /**
   * 通知メッセージの非表示
   *
   * 【使用場面】
   * - ユーザーが手動で閉じる場合
   * - 別のメッセージを表示する前のクリア
   * - コンポーネントのアンマウント時
   */
  hideSnackbar: () => void;

  /**
   * 統一エラーハンドリング
   *
   * @param error - AppError型のエラーオブジェクト
   * @param fallbackMessage - エラーメッセージが空の場合の代替メッセージ
   *
   * 【50代向けエラー表現の統一】
   * - 技術的な詳細は隠蔽
   * - 次に取るべき行動を明示
   * - 安心感を与える表現を使用
   *
   * 【使用例】
   * ```typescript
   * const { handleError } = useApp();
   *
   * try {
   *   await saveCustomer(customerData);
   * } catch (error) {
   *   handleError(error as AppError, '顧客情報を保存できませんでした');
   * }
   * ```
   */
  handleError: (error: AppError, fallbackMessage?: string) => void;
}

// =============================================================================
// 🎨 Context作成 - createContext()の活用
// =============================================================================

/**
 * 【createContext()の初期値設定】
 *
 * 🎓 初期値設定の戦略：
 * 1. null設定 → Provider外使用時のエラー検知が容易
 * 2. デフォルト値設定 → 初期状態が明確、テストが簡単
 * 3. undefined設定 → TypeScriptの厳密チェックを活用
 *
 * 今回はnullを選択し、カスタムフックでエラーハンドリングを行う。
 */
const AppContext = createContext<AppContextType | null>(null);

// =============================================================================
// 💡 AppProvider - 状態管理の実装
// =============================================================================

/**
 * AppProviderコンポーネント - アプリケーション全体の状態を管理
 *
 * 【設計パターン】
 * - useState()で各状態を個別管理
 * - useCallback()でメソッドのパフォーマンス最適化
 * - 50代ユーザー向けの配慮をメソッド内に組み込み
 */
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  // =============================
  // 📊 状態定義
  // =============================

  const [globalLoading, setGlobalLoadingState] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] =
    useState<SnackbarMessage | null>(null);

  // =============================
  // 🎬 アクション実装
  // =============================

  /**
   * グローバルローディング状態の制御
   *
   * 【実装詳細】
   * - useState()で状態を直接更新
   * - useCallback()でレンダリング最適化
   * - ローディング中の他操作を防止する設計
   *
   * */
  const setGlobalLoading = useCallback((loading: boolean) => {
    setGlobalLoadingState(loading);

    // 50代向け配慮：ローディング開始時の安心メッセージ
    if (loading) {
      console.log('🔄 処理中です。しばらくお待ちください...');
    } else {
      console.log('🔄 処理が完了しました。');
    }
  }, []);

  /**
   * 通知メッセージの表示実装
   *
   * 【50代向けの工夫】
   * - デフォルト表示時間を5秒に設定（読みやすい速度）
   * - メッセージ内容の検証とフォールバック
   * - 自動非表示タイマーの設定
   */
  const showSnackbar = useCallback(
    (
      message: string,
      severity: SnackbarMessage['severity'],
      duration: number = 5000
    ) => {
      // メッセージ内容の検証
      const displayMessage = message.trim() || '操作が完了しました';

      const newMessage: SnackbarMessage = {
        message: displayMessage,
        severity,
        duration,
      };

      setSnackbarMessage(newMessage);

      // 自動非表示タイマー（50代向け: 十分な時間を確保）
      if (duration > 0) {
        setTimeout(() => {
          setSnackbarMessage(null);
        }, duration);
      }

      // デバッグログ（開発時の確認用）
      console.log(`📢 [${severity.toUpperCase()}] ${displayMessage}`);
    },
    []
  );

  /**
   * 通知メッセージの手動非表示
   */
  const hideSnackbar = useCallback(() => {
    setSnackbarMessage(null);
  }, []);

  /**
   * 統一エラーハンドリングの実装
   *
   * 【50代向けエラーメッセージの変換】
   * - 技術的なエラーを分かりやすい日本語に変換
   * - 具体的な解決策を提示
   * - 不安を与えない表現を使用
   */
  const handleError = useCallback(
    (error: AppError, fallbackMessage?: string) => {
      let userFriendlyMessage: string;

      // エラータイプ別の50代向けメッセージ変換 (Union型を使用)
      switch (error.type) {
        case 'NETWORK_ERROR':
          userFriendlyMessage =
            'インターネット接続を確認してください。少し時間をおいてからもう一度お試しください。';
          break;

        case 'VALIDATION_ERROR':
          userFriendlyMessage =
            '入力内容を確認してください。必要な項目が不足している可能性があります。';
          break;

        case 'NOT_FOUND':
          userFriendlyMessage =
            '情報が見つかりませんでした。すでに削除されている可能性があります。';
          break;

        case 'PERMISSION_DENIED':
          userFriendlyMessage =
            'この操作を実行する権限がありません。管理者にお問い合わせください。';
          break;

        case 'SERVER_ERROR':
          userFriendlyMessage =
            'サーバーでエラーが発生しました。しばらく時間をおいてからもう一度お試しください。';
          break;

        default:
          // フォールバックメッセージまたはデフォルト
          userFriendlyMessage =
            fallbackMessage || 'エラーが発生しました。もう一度お試しください。';
      }

      // エラー情報をスナックバーに表示
      showSnackbar(userFriendlyMessage, 'error', 8000); // エラーは8秒表示（通常より長め）

      // デバッグ情報（本番環境では非表示）
      if (process.env.NODE_ENV === 'development') {
        console.error('🚨 AppError Details:', {
          type: error.type,
          message: error.message,
          details: error.technical,
          userMessage: userFriendlyMessage,
        });
      }
    },
    [showSnackbar]
  );

  // =============================
  // 📦 Context値の構築
  // =============================

  /**
   * Context に提供する値をメモ化
   *
   * 【パフォーマンス最適化】
   * - useMemo()でオブジェクト再作成を防止
   * - 不要な再レンダリングを最小化
   * - メモリ使用量の効率化
   */
  const contextValue: AppContextType = React.useMemo(
    () => ({
      // 📊 状態
      globalLoading,
      snackbarMessage,

      // 🎬 アクション
      setGlobalLoading,
      showSnackbar,
      hideSnackbar,
      handleError,
    }),
    [
      globalLoading,
      snackbarMessage,
      setGlobalLoading,
      showSnackbar,
      hideSnackbar,
      handleError,
    ]
  );

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}

// =============================================================================
// 🪝 カスタムフック - useApp()
// =============================================================================

/**
 * 【カスタムフックの作成意図】
 *
 * カスタムフックは、React Context の使用を簡潔にし、
 * エラーハンドリングを自動化するためのパターン。
 *
 * 🎯 useApp() カスタムフックの利点：
 * 1. Context外使用時の自動エラー検知
 * 2. useContext()の繰り返し記述を削減
 * 3. TypeScriptの型推論を最大活用
 * 4. 開発者エクスペリエンスの向上
 *
 * 📚 Context外使用エラーとは？
 * AppProvider でラップされていないコンポーネントから
 * useContext(AppContext) を呼び出した場合に発生します。
 *
 * ❌ エラーが発生するケース：
 * ```jsx
 * function MyComponent() {
 *   const { showSnackbar } = useApp(); // ← AppProvider外で使用
 *   return <div>Error!</div>;
 * }
 *
 * // AppProvider でラップされていない
 * <MyComponent />
 * ```
 *
 * ✅ 正しい使用方法：
 * ```jsx
 * <AppProvider>
 *   <MyComponent /> // ← AppProvider内で使用
 * </AppProvider>
 * ```
 */
export function useApp(): AppContextType {
  const context = useContext(AppContext);

  /**
   * Context外使用時のエラーハンドリング
   *
   * 【50代向けエラーメッセージ】
   * - 技術的な詳細は避ける
   * - 解決方法を具体的に示す
   * - 安心感を与える表現を使用
   */
  if (context === null) {
    throw new Error(
      '🚨 useApp() はAppProvider内でのみ使用できます。\n\n' +
        '解決方法:\n' +
        '1. コンポーネントがAppProviderでラップされているか確認してください\n' +
        '2. App.tsxでAppProviderが正しく設定されているか確認してください\n\n' +
        '詳細はドキュメントを参照してください。'
    );
  }
  return context;
}

// =============================================================================
// 📖 使用例とベストプラクティス
// =============================================================================

/**
 * 🎯 実際のコンポーネントでの使用例
 *
 * 【顧客登録フォームでの使用例】
 * ```typescript
 * import { useApp } from '@/contexts/AppContext';
 * import { CustomerCreateForm } from '@/types';
 *
 * function CustomerRegistrationForm() {
 *   const { showSnackbar, handleError, setGlobalLoading } = useApp();
 *
 *   const handleSubmit = async (customerData: CustomerCreateForm['data']) => {
 *     try {
 *       setGlobalLoading(true);
 *
 *       await api.createCustomer(customerData);
 *
 *       showSnackbar('顧客情報を保存しました', 'success');
 *
 *     } catch (error) {
 *       handleError(error as AppError, '顧客情報を保存できませんでした');
 *
 *     } finally {
 *       setGlobalLoading(false);
 *     }
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <!-- フォーム内容 -->
 *     </form>
 *   );
 * }
 * ```
 *
 * 【一覧画面での使用例】
 * ```typescript
 * function CustomerList() {
 *   const { showSnackbar, setGlobalLoading } = useApp();
 *
 *   const handleDelete = async (customerId: string) => {
 *     try {
 *       setGlobalLoading(true);
 *
 *       await api.deleteCustomer(customerId);
 *
 *       showSnackbar('顧客情報を削除しました', 'success');
 *
 *       // 一覧を再読み込み
 *       await refetchCustomers();
 *
 *     } catch (error) {
 *       handleError(error as AppError);
 *     } finally {
 *       setGlobalLoading(false);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <!-- 顧客一覧の表示 -->
 *     </div>
 *   );
 * }
 * ```
 */

/**
 * 🔧 App.tsx での Provider 設定例
 *
 * ```typescript
 * import { AppProvider } from '@/contexts/AppContext';
 * import { MainLayout } from '@/components/layout/MainLayout';
 * import { AppRouter } from '@/routes/AppRouter';
 *
 * function App() {
 *   return (
 *     <AppProvider>  /← 最上位でProviderを設定 /
 *       <MainLayout>
 *         <AppRouter />
 *       </MainLayout>
 *     </AppProvider>
 *   );
 * }
 * ```
 */
