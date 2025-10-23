/**
 * 🌟 CustomerContext - 顧客データ専用の状態管理
 *
 * 【専用Contextの設計意図】
 *
 * CustomerContextは、顧客データのCRUD操作に特化した状態管理システム。
 * AppContextとの協調により、以下の責任分担を実現する：
 *
 * 📊 責任分担の設計：
 * - AppContext: グローバル状態（通知、エラー、全体ローディング）
 * - CustomerContext: 顧客データ特化（CRUD、検索、選択状態）
 *
 * 🎯 専用Context のメリット：
 * 1. 関心の分離: 顧客関連のロジックを1箇所に集約
 * 2. パフォーマンス最適化: 顧客データ変更時のみ再レンダリング
 * 3. 型安全性: Customer特化の型定義でミスを防止
 * 4. 保守性向上: 顧客機能の修正が他に影響しない
 * 5. テスト容易性: 顧客機能の独立したテスト
 *
 * 🔧 50代・低ITリテラシー向け配慮：
 * - 直感的なメソッド名（fetchCustomers, createCustomer）
 * - 明示的な検索実行（リアルタイム検索は避ける）
 * - 明確なローディング状態表示
 * - 操作成功時の分かりやすいフィードバック
 */
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// =============================
// 🔧 修正: インポートパスの修正
// =============================

/**
 * 【修正内容】型定義インポートのパス修正
 *
 * 問題: tsconfig.jsonの paths マッピングが "@/types/*": ["./types/*"] となっているため
 *      "@/types" (アスタリスクなし) でのインポートが解決されない
 *
 * 解決策: 相対パスでのインポートに変更
 * - src/renderer/contexts/ から src/types/ への相対パス: "../../../types"
 * - または各型を個別にインポート
 */
import {
  AppError,
  CreateCustomerInput,
  Customer,
  LoadingState,
  UpdateCustomerInput,
} from "../../types"; // ← 相対パスに修正
import { useApp } from "./AppContext";

// =============================================================================
// 🎯 CustomerContext型定義 - 顧客データ特化の型設計
// =============================================================================

/**
 * CustomerContext で管理される状態とメソッドの型定義
 *
 * 【設計原則】
 * - 顧客データのライフサイクル全体をカバー
 * - AppContextとの協調を意識したエラーハンドリング
 * - 50代ユーザーの操作パターンに最適化
 * - TypeScriptの型安全性を最大活用
 */
interface CustomerContextType {
  // =============================
  // 📊 顧客データ状態
  // =============================

  /** 顧客一覧データ（メインデータ） */
  customers: Customer[];

  /** 現在選択中の顧客（詳細表示・編集用） */
  selectedCustomer: Customer | null;

  /** 検索でフィルタリングされた顧客一覧 */
  filteredCustomers: Customer[];

  /** 現在の検索キーワード */
  searchTerm: string;

  /** 顧客操作のローディング状態 */
  loading: LoadingState;

  // =============================
  // 🎬 CRUD操作メソッド
  // =============================

  /**
   * 顧客一覧の取得
   *
   * 【動作】
   * 1. ローディング状態をtrueに設定
   * 2. API呼び出し（現段階はモックデータ）
   * 3. 成功時は customers state を更新
   * 4. エラー時は AppContext の handleError に委譲
   *
   * 【50代向け配慮】
   * - 「顧客一覧を読み込んでいます」等の明確な状況説明
   * - 成功時は「○件の顧客情報を読み込みました」等のフィードバック
   */
  fetchCustomers: () => Promise<void>;

  /**
   * 新規顧客の作成
   *
   * @param input - 顧客作成用の入力データ
   *
   * 【動作フロー】
   * 1. 入力データのバリデーション
   * 2. API呼び出しで顧客作成
   * 3. 成功時は customers 配列に追加
   * 4. 作成された顧客を selectedCustomer に設定
   * 5. AppContext 経由で成功メッセージ表示
   *
   * 【使用例】
   * ```typescript
   * const { createCustomer } = useCustomer();
   *
   * await createCustomer({
   *   companyName: '田中建設',
   *   contactPerson: '田中太郎',
   *   phone: '090-1234-5678',
   *   email: 'tanaka@example.com',
   * });
   * ```
   */
  createCustomer: (input: CreateCustomerInput) => Promise<Customer | null>;

  /**
   * 顧客情報の更新
   *
   * @param customerId - 更新対象の顧客ID
   * @param input - 更新データ
   *
   * 【動作フロー】
   * 1. 顧客IDの存在確認
   * 2. API呼び出しで顧客情報更新
   * 3. 成功時は customers 配列の該当項目を更新
   * 4. selectedCustomer も該当する場合は同期更新
   * 5. 成功メッセージの表示
   */
  updateCustomer: (
    customerId: number,
    input: UpdateCustomerInput,
  ) => Promise<Customer | null>;

  /**
   * 顧客の削除
   *
   * @param customerId - 削除対象の顧客ID
   *
   * 【安全な削除フロー】
   * 1. 削除確認（Modal表示は呼び出し元の責任）
   * 2. API呼び出しで顧客削除
   * 3. 成功時は customers 配列から削除
   * 4. selectedCustomer が該当する場合はnullに設定
   * 5. 削除完了メッセージの表示
   */
  deleteCustomer: (customerId: number) => Promise<boolean>;

  /**
   * 顧客の選択（詳細表示・編集用）
   *
   * @param customer - 選択する顧客（null の場合は選択解除）
   *
   * 【使用場面】
   * - 顧客一覧で項目をクリック
   * - 顧客編集画面への遷移
   * - 顧客詳細モーダルの表示
   */
  selectCustomer: (customer: Customer | null) => void;

  /**
   * 顧客の検索実行
   *
   * @param term - 検索キーワード
   * @returns Customer[] - 検索結果の配列
   *
   * 【修正内容】
   * - 検索結果を戻り値として返すように変更
   * - void → Customer[] に型変更
   * - 呼び出し側で検索結果を直接利用可能
   *
   * 【50代向け検索設計】
   * - リアルタイム検索は避ける（誤操作防止）
   * - 明示的な検索実行（検索ボタンクリック）
   * - 部分一致検索（会社名、担当者名、電話番号）
   * - 検索結果のクリア機能
   */
  searchCustomers: (term: string) => Customer[];

  /**
   * 検索クリア
   *
   * 【動作】
   * - searchTerm を空文字に設定
   * - filteredCustomers を全顧客データに戻す
   */
  clearSearch: () => void;

  /**
   * 顧客データの再読み込み
   *
   * 【使用場面】
   * - データ更新後の最新情報取得
   * - エラー発生時のリトライ
   * - 画面復帰時のデータ同期
   */
  refreshCustomers: () => Promise<void>;
}

// =============================================================================
// 🔌 Phase 2E: Prisma Database Integration
// =============================================================================

/**
 * Window API Type Declaration for customerAPI
 *
 * Phase 2E: CustomerContext now uses real Prisma database via Electron IPC
 * All mock data has been migrated to prisma/mockData.ts for seeding
 *
 * window.customerAPI provides IPC communication with Electron main process:
 * - Main process (src/main/database/customerHandlers.ts) handles Prisma operations
 * - Preload script (src/main/preload.ts) exposes customerAPI to renderer
 * - This context consumes the API for CRUD operations
 */
declare global {
  interface Window {
    customerAPI: {
      fetch: (filters?: any) => Promise<{
        success: boolean;
        data?: Customer[];
        error?: string;
      }>;
      create: (input: CreateCustomerInput) => Promise<{
        success: boolean;
        data?: Customer;
        error?: string;
      }>;
      update: (input: UpdateCustomerInput & { customerId: number }) => Promise<{
        success: boolean;
        data?: Customer;
        error?: string;
      }>;
      delete: (customerId: number) => Promise<{
        success: boolean;
        error?: string;
      }>;
    };
  }
}

// =============================================================================
// 🎨 Context作成 - 顧客データ専用
// =============================================================================

const CustomerContext = createContext<CustomerContextType | null>(null);

// =============================================================================
// 💡 CustomerProvider - 顧客データ状態管理の実装
// =============================================================================

/**
 * CustomerProviderコンポーネント - 顧客データの状態管理
 *
 * 【設計パターン】
 * - 複数のuseState()で関連状態を管理
 * - useEffect()でライフサイクルイベントを処理
 * - useMemo()で計算値をメモ化
 * - AppContextとの連携でユーザーフィードバック統一
 */
interface CustomerProviderProps {
  children: ReactNode;
}

export function CustomerProvider({ children }: CustomerProviderProps) {
  // AppContext との連携取得
  const { showSnackbar, handleError, setGlobalLoading } = useApp();

  // =============================
  // 📊 状態定義 - 顧客データ管理
  // =============================
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [loading, setLoading] = useState<LoadingState>({
    isLoading: false,
    error: null,
  });
  const [searchTerm, setSearchTerm] = useState<string>("");

  // =============================
  // 🧮 検索ロジックの共通化
  // =============================

  /**
   * 顧客検索フィルタリング共通関数
   *
   * 【新規追加】検索ロジックの重複を解決
   * - searchCustomers() と filteredCustomers で同じロジックを共有
   * - 保守性向上：検索条件変更時の修正箇所を1箇所に集約
   * - テスト容易性：検索ロジックを独立してテスト可能
   */
  const filterCustomersByTerm = useCallback(
    (customerList: Customer[], term: string): Customer[] => {
      if (!term.trim()) {
        return customerList;
      }

      const lowerSearchTerm = term.toLowerCase();

      return customerList.filter(
        (customer) =>
          customer.companyName.toLowerCase().includes(lowerSearchTerm) ||
          customer.contactPerson?.toLowerCase().includes(lowerSearchTerm) ||
          customer.phone?.toLowerCase().includes(lowerSearchTerm) ||
          customer.email?.toLowerCase().includes(lowerSearchTerm),
      );
    },
    [],
  );

  // =============================
  // 🧮 計算値 - useMemo()でパフォーマンス最適化
  // =============================

  /**
   * 検索フィルタリングされた顧客一覧
   *
   * 【検索ロジック】
   * - 会社名、担当者名、電話番号、メールアドレスで部分一致検索
   * - 大文字小文字を区別しない検索
   * - 空の検索語の場合は全件表示
   *
   * 【50代向け配慮】
   * - 複雑な検索条件は避ける
   * - 直感的な部分一致検索
   * - 検索結果の件数表示でわかりやすさを向上
   */
  const filteredCustomers = useMemo(() => {
    return filterCustomersByTerm(customers, searchTerm);
  }, [customers, searchTerm, filterCustomersByTerm]);

  // =============================
  // 🎬 CRUD操作の実装
  // =============================

  /**
   * 顧客一覧取得の実装
   *
   * 【useCallback()の活用】
   *
   * useCallback()は、関数の再作成を防ぐReactフック。
   * 依存配列が変更されない限り、同じ関数インスタンスを返す。
   *
   * 🎯 useCallback使用の理由：
   * 1. 子コンポーネントへのprops最適化
   * 2. useEffect の依存配列での無限ループ防止
   * 3. メモリ使用量の最小化
   * 4. React.memo() との相性向上
   */
  const fetchCustomers = useCallback(
    async (filters?: any) => {
      try {
        // ローディング開始
        setLoading({ isLoading: true, error: null });

        // Phase 2E: Real Prisma database via window.customerAPI
        const result = await window.customerAPI.fetch(filters);

        if (result.success && result.data) {
          setCustomers(result.data);

          // 成功メッセージの表示 (50代向け：件数を明示)
          showSnackbar(
            `${result.data.length}件の顧客情報を読み込みました`,
            "success",
            4000,
          );

          // ローディング終了
          setLoading({ isLoading: false, error: null });
        } else {
          throw new Error(result.error || "顧客データの取得に失敗しました");
        }
      } catch (error) {
        console.error("❌ 顧客取得エラー:", error);

        // エラーハンドリング（AppContextに委譲）
        const errorMessage =
          error instanceof Error
            ? error.message
            : "顧客データの取得に失敗しました";
        const appError: AppError = {
          type: "SERVER_ERROR",
          message: errorMessage,
          suggestion: "もう一度お試しください",
          technical: error instanceof Error ? error.message : "不明なエラー",
        };

        setLoading({ isLoading: false, error: appError.message });

        // AppContextのエラーハンドリングに委譲
        handleError(
          appError,
          "顧客一覧を読み込めませんでした。もう一度お試しください。",
        );
      }
    },
    [showSnackbar, handleError],
  );

  /**
   * 新規顧客作成の実装
   *
   * 【非同期処理とエラーハンドリング】
   *
   * async/await を使用した非同期処理で、以下の流れを実装：
   * 1. 事前バリデーション
   * 2. API呼び出し
   * 3. 成功時の状態更新
   * 4. エラー時の適切な処理
   * 5. ローディング状態の管理
   */
  const createCustomer = useCallback(
    async (input: CreateCustomerInput): Promise<Customer | null> => {
      try {
        // ローディング開始
        setLoading({ isLoading: true, error: null });

        // 入力データのバリデーション（基本チェック）
        if (!input.companyName.trim()) {
          const validationError: AppError = {
            type: "VALIDATION_ERROR",
            message: "会社名は必須項目です",
            suggestion: "会社名を入力してください",
            technical: "companyName is empty or whitespace only",
          };

          setLoading({ isLoading: false, error: validationError.message });
          handleError(validationError);
          return null;
        }

        // Phase 2E: Real Prisma database via window.customerAPI
        const result = await window.customerAPI.create(input);

        if (result.success && result.data) {
          const newCustomer = result.data;

          // Re-fetch to update list from database
          await fetchCustomers();

          // 新規作成した顧客を選択状態に
          setSelectedCustomer(newCustomer);

          // ローディング完了
          setLoading({ isLoading: false, error: null });

          // 成功メッセージの表示 (50代向け：具体的でわかりやすく)
          showSnackbar(
            `「${newCustomer.companyName}」を顧客として登録しました`,
            "success",
          );

          return newCustomer;
        } else {
          throw new Error(result.error || "顧客の作成に失敗しました");
        }
      } catch (error) {
        console.error("❌ 顧客作成エラー:", error);

        // エラーハンドリング（AppContextに委譲）
        const errorMessage =
          error instanceof Error ? error.message : "顧客の作成に失敗しました";
        const appError: AppError = {
          type: "SERVER_ERROR",
          message: errorMessage,
          suggestion: "もう一度お試しください",
          technical: error instanceof Error ? error.message : "不明なエラー",
        };

        setLoading({ isLoading: false, error: appError.message });
        handleError(
          appError,
          "顧客情報を保存できませんでした。入力内容を確認してもう一度お試しください。",
        );

        return null;
      }
    },
    [showSnackbar, handleError, fetchCustomers],
  );

  /**
   * 顧客情報更新の実装
   */
  const updateCustomer = useCallback(
    async (
      customerId: number,
      input: UpdateCustomerInput,
    ): Promise<Customer | null> => {
      try {
        // ローディング開始
        setLoading({ isLoading: true, error: null });

        // Phase 2E: Real Prisma database via window.customerAPI
        const result = await window.customerAPI.update({
          customerId,
          ...input,
        });

        if (result.success && result.data) {
          const updatedCustomer = result.data;

          // Re-fetch to update list from database
          await fetchCustomers();

          // selectedCustomer の同期更新
          if (selectedCustomer?.customerId === customerId) {
            setSelectedCustomer(updatedCustomer);
          }

          // ローディング完了
          setLoading({ isLoading: false, error: null });

          // 成功メッセージの表示 (50代向け：具体的でわかりやすく)
          showSnackbar(
            `「${updatedCustomer.companyName}」の情報を更新しました`,
            "success",
          );

          return updatedCustomer;
        } else {
          throw new Error(result.error || "顧客情報の更新に失敗しました");
        }
      } catch (error) {
        console.error("❌ 顧客更新エラー:", error);

        const errorMessage =
          error instanceof Error
            ? error.message
            : "顧客情報の更新に失敗しました";
        const appError: AppError = {
          type: "SERVER_ERROR",
          message: errorMessage,
          suggestion: "顧客IDを確認してください",
          technical: error instanceof Error ? error.message : "不明なエラー",
        };

        setLoading({ isLoading: false, error: appError.message });
        handleError(
          appError,
          "顧客情報を更新できませんでした。入力内容を確認してもう一度お試しください。",
        );

        return null;
      }
    },
    [selectedCustomer, showSnackbar, handleError, fetchCustomers],
  );

  /**
   * 顧客削除の実装
   */
  const deleteCustomer = useCallback(
    async (customerId: number): Promise<boolean> => {
      try {
        // ローディング開始
        setLoading({ isLoading: true, error: null });

        // Get customer name for success message (before deletion)
        const existingCustomer = customers.find(
          (customer) => customer.customerId === customerId,
        );
        const customerName = existingCustomer?.companyName || "顧客";

        // Phase 2E: Real Prisma database via window.customerAPI
        const result = await window.customerAPI.delete(customerId);

        if (result.success) {
          // Re-fetch to update list from database
          await fetchCustomers();

          // selectedCustomer が削除対象の場合は選択解除
          if (selectedCustomer?.customerId === customerId) {
            setSelectedCustomer(null);
          }

          setLoading({ isLoading: false, error: null });

          showSnackbar(`「${customerName}」を削除しました`, "success");

          return true;
        } else {
          throw new Error(result.error || "顧客の削除に失敗しました");
        }
      } catch (error) {
        console.error("❌ 顧客削除エラー:", error);

        const errorMessage =
          error instanceof Error ? error.message : "顧客の削除に失敗しました";
        const appError: AppError = {
          type: "SERVER_ERROR",
          message: errorMessage,
          suggestion: "顧客IDを確認してください",
          technical: error instanceof Error ? error.message : "不明なエラー",
        };

        setLoading({ isLoading: false, error: appError.message });
        handleError(
          appError,
          "顧客情報を削除できませんでした。入力内容を確認してもう一度お試しください。",
        );

        return false;
      }
    },
    [customers, selectedCustomer, showSnackbar, handleError, fetchCustomers],
  );

  /**
   * 顧客選択の実装
   *
   * 【シンプルな状態更新】
   * - 非同期処理不要
   * - 即座に選択状態を変更
   * - ローディング状態も不要
   */
  const selectCustomer = useCallback((customer: Customer | null) => {
    setSelectedCustomer(customer);
  }, []);

  /**
   * 顧客検索の実装
   *
   * 【50代向け検索設計の理由】
   *
   * リアルタイム検索を避ける理由：
   * 1. 意図しない検索結果による混乱防止
   * 2. 入力中の一時的な検索結果による不安解消
   * 3. 明示的な検索実行で操作の意図を明確化
   * 4. 検索負荷の軽減（サーバー負荷対策）
   *
   */
  const searchCustomers = useCallback(
    (term: string): Customer[] => {
      // 検索語の状態更新
      setSearchTerm(term);

      // 共通の検索ロジックを使用して結果を計算
      const searchResults = filterCustomersByTerm(customers, term);

      // 検索実行のフィードバック（50代向け）
      if (term.trim()) {
        showSnackbar(
          `「${term}」で検索しました。${searchResults.length}件見つかりました。`,
          "info",
          3000,
        );
      } else {
        // 空の検索語の場合
        showSnackbar("検索条件をクリアしました", "info", 2000);
      }

      // 🎯 修正: 検索結果を戻り値として返す
      return searchResults;
    },
    [customers, showSnackbar, filterCustomersByTerm],
  );

  /**
   * 検索クリアの実装
   */
  const clearSearch = useCallback(() => {
    setSearchTerm("");

    showSnackbar("検索条件をクリアしました", "info", 2000);
  }, [showSnackbar]);

  /**
   * 顧客データ再読み込みの実装
   */
  const refreshCustomers = useCallback(async () => {
    await fetchCustomers();
  }, [fetchCustomers]);

  // =============================
  // ⚡ 副作用管理 - useEffect()の活用
  // =============================

  /**
   * 【 useEffect()によるライフサイクル管理】
   *
   * useEffect()は、コンポーネントのライフサイクルイベントを処理するフックです。
   *
   * 🎯 useEffect の主要用途：
   * 1. コンポーネントマウント時の初期化
   * 2. 外部データの取得
   * 3. イベントリスナーの登録・解除
   * 4. タイマーやサブスクリプションの管理
   *
   * 📚 依存配列の理解：
   * - [] (空配列): マウント時のみ実行
   * - [dep1, dep2]: 依存値変更時に実行
   * - 配列なし: 毎回実行（通常は避ける）
   */

  // 初回マウント時の顧客データ取得
  useEffect(() => {
    fetchCustomers();
  }, []); // 空の依存配列 → マウント時のみ実行

  // =============================
  // 📦 Context値の構築
  // =============================

  /**
   * Context に提供する値をメモ化
   *
   * 【パフォーマンス最適化の重要性】
   *
   * useMemo()を使用する理由：
   * 1. オブジェクトの再作成防止 → 不要な再レンダリング削減
   * 2. 子コンポーネントのReact.memo()効果を最大化
   * 3. 大量の顧客データ処理時のパフォーマンス向上
   * 4. メモリ使用量の効率化
   */
  const contextValue: CustomerContextType = useMemo(
    () => ({
      // 📊 状態データ
      customers,
      selectedCustomer,
      filteredCustomers,
      searchTerm,
      loading,

      // 🎬 CRUD操作
      fetchCustomers,
      createCustomer,
      updateCustomer,
      deleteCustomer,

      // 🔍 検索・選択操作
      selectCustomer,
      searchCustomers,
      clearSearch,
      refreshCustomers,
    }),
    [
      // 状態の依存関係
      customers,
      selectedCustomer,
      filteredCustomers,
      searchTerm,
      loading,

      // CRUD操作の依存関係
      fetchCustomers,
      createCustomer,
      updateCustomer,
      deleteCustomer,

      // 検索・選択操作の依存関係
      selectCustomer,
      searchCustomers,
      clearSearch,
      refreshCustomers,
    ],
  );

  return (
    <CustomerContext.Provider value={contextValue}>
      {children}
    </CustomerContext.Provider>
  );
}

// =============================================================================
// 🪝 カスタムフック - useCustomer()
// =============================================================================

/**
 * 【専用カスタムフックの設計パターン】
 *
 * useCustomer() は、CustomerContextを使用するための専用フックです。
 * AppContextのuseApp()と同様のパターンで一貫性を保ちます。
 *
 * 🎯 専用フックの利点：
 * 1. Context名の隠蔽 → 実装詳細を知る必要なし
 * 2. エラーハンドリングの自動化
 * 3. TypeScript型推論の最大活用
 * 4. 開発者体験の統一（useApp との一貫性）
 *
 * 📚 Context階層の管理：
 * ```
 * App
 * ├── AppProvider     (アプリ全体状態)
 * │   └── CustomerProvider (顧客特化状態)
 * │       └── MyComponent
 * │           ├── useApp()      (グローバル状態取得)
 * │           └── useCustomer() (顧客状態取得)
 * ```
 */

export function useCustomer(): CustomerContextType {
  const context = useContext(CustomerContext);

  /**
   * Context外使用時のエラーハンドリング
   *
   * 【一貫したエラーメッセージ】
   * AppContextのuseApp()と同様の形式で統一
   */
  if (context === null) {
    throw new Error(
      "🚨 useCustomer() はCustomerProvider内でのみ使用できます。\n\n" +
        "解決方法:\n" +
        "1. コンポーネントがCustomerProviderでラップされているか確認してください\n" +
        "2. AppContextとCustomerContextの階層順序を確認してください\n" +
        "3. App.tsxでの設定順序: AppProvider > CustomerProvider > Component\n\n" +
        "詳細はドキュメントを参照してください。",
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
 * 【顧客一覧コンポーネントでの使用例】
 * ```typescript
 * import { useCustomer } from '@/contexts/CustomerContext';
 * import { useApp } from '@/contexts/AppContext';
 *
 * function CustomerList() {
 *   const {
 *     filteredCustomers,
 *     loading,
 *     searchTerm,
 *     searchCustomers,
 *     selectCustomer,
 *     deleteCustomer
 *   } = useCustomer();
 *
 *   const { showSnackbar } = useApp();
 *
 *   const handleSearch = (term: string) => {
 *     searchCustomers(term);
 *   };
 *
 *   const handleDelete = async (customer: Customer) => {
 *     const confirmed = window.confirm(`「${customer.companyName}」を削除しますか？`);
 *     if (confirmed) {
 *       await deleteCustomer(customer.customerId);
 *     }
 *   };
 *
 *   if (loading.isLoading) {
 *     return <div>読み込み中...</div>;
 *   }
 *
 *   return (
 *     <div>
 *       <input
 *         value={searchTerm}
 *         onChange={(e) => handleSearch(e.target.value)}
 *         placeholder="会社名・担当者名で検索"
 *       />
 *
 *       {filteredCustomers.map(customer => (
 *         <div key={customer.customerId}>
 *           <h3>{customer.companyName}</h3>
 *           <button onClick={() => selectCustomer(customer)}>選択</button>
 *           <button onClick={() => handleDelete(customer)}>削除</button>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 *
 * 【顧客作成フォームでの使用例】
 * ```typescript
 * function CustomerCreateForm() {
 *   const { createCustomer, loading } = useCustomer();
 *   const [formData, setFormData] = useState<CreateCustomerInput>({
 *     companyName: '',
 *     contactPerson: '',
 *     phone: '',
 *     email: '',
 *     address: '',
 *     notes: '',
 *   });
 *
 *   const handleSubmit = async (e: FormEvent) => {
 *     e.preventDefault();
 *     const newCustomer = await createCustomer(formData);
 *
 *     if (newCustomer) {
 *       // 成功時の処理（フォームクリアなど）
 *       setFormData({ companyName: '', ... });
 *     }
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <input
 *         value={formData.companyName}
 *         onChange={(e) => setFormData(prev => ({
 *           ...prev,
 *           companyName: e.target.value
 *         }))}
 *         placeholder="会社名（必須）"
 *         required
 *       />
 *       <!-- その他のフィールド -->
 *
 *       <button
 *         type="submit"
 *         disabled={loading.isLoading}
 *       >
 *         {loading.isLoading ? '保存中...' : '顧客を登録'}
 *       </button>
 *     </form>
 *   );
 * }
 * ```
 */

/**
 * 🔧 App.tsx での Provider階層設定例
 *
 * 【重要】Context の階層順序
 * AppProvider が最上位、その内部にCustomerProviderを配置
 *
 * ```typescript
 * import { AppProvider } from '@/contexts/AppContext';
 * import { CustomerProvider } from '@/contexts/CustomerContext';
 * import { MainLayout } from '@/components/layout/MainLayout';
 * import { AppRouter } from '@/routes/AppRouter';
 *
 * function App() {
 *   return (
 *     <AppProvider>                    {// ← グローバル状態（最上位） }
 *       <CustomerProvider>             {// ← 顧客特化状態 }
 *         <MainLayout>
 *           <AppRouter />
 *         </MainLayout>
 *       </CustomerProvider>
 *     </AppProvider>
 *   );
 * }
 * ```
 */
