import {
  ApiResponse,
  AppError,
  FormState,
  LoadingState,
  PaginationState,
  SearchFilters,
  SnackbarMessage,
  SortOrder,
  ValidationError,
} from './common';
import {
  CreateCustomerInput,
  Customer,
  CustomerListItem,
  CustomerSearchParams,
  UpdateCustomerInput,
} from './customer';
import {
  CreateServiceRecordInput,
  ServiceRecord,
  ServiceRecordListItem,
  ServiceRecordSearchParams,
  ServiceRecordWithCustomer,
  UpdateServiceRecordInput,
} from './service';

// =============================================================================
// 👤 Customer（顧客）関連の型定義
// =============================================================================

/**
 * 顧客管理システムで使用する全ての型をエクスポート
 *
 * 【分類理由】
 * - 顧客データの基本操作（CRUD）に必要な型群
 * - Customer エンティティを中心とした関連型
 * - フォーム入力、検索、表示用の特化型
 */
export type {
  // CRUD 操作用の型 (1)
  CreateCustomerInput,
  // Basic entity type
  Customer,
  // 一覧表示・UI用型
  CustomerListItem,
  // 検索・フィルタリング用型
  CustomerSearchParams,
  // CRUD 操作用の型 (2)
  UpdateCustomerInput,
} from './customer';

// =============================================================================
// 📋 ServiceRecord（サービス履歴）関連の型定義
// =============================================================================

/**
 * サービス履歴管理システムで使用する全ての型をエクスポート
 *
 * 【分類理由】
 * - サービス履歴データの基本操作（CRUD）に必要な型群
 * - ServiceRecord エンティティを中心とした関連型
 * - Customer との関連性を表現した拡張型
 */
export type {
  // CRUD 操作用の型 (1)
  CreateServiceRecordInput,
  // Basic entity type
  ServiceRecord,
  // 一覧表示・UI用型
  ServiceRecordListItem,
  // 検索・フィルタリング用型
  ServiceRecordSearchParams,
  // Customer との関連性を表現した拡張型
  ServiceRecordWithCustomer,
  // CRUD 操作用の型 (2)
  UpdateServiceRecordInput,
} from './service';

// =============================================================================
// 🌐 Common（共通）システム型定義
// =============================================================================

/**
 * アプリケーション全体で共通使用される型をエクスポート
 *
 * 【分類理由】
 * - UI状態管理（ローディング、エラー、成功）
 * - API通信の標準化
 * - フォーム処理の統一
 * - ユーザーインターフェース機能（検索、ページング、通知）
 */
export type {
  // API通信型
  ApiResponse,
  // エラーハンドリング型
  AppError,
  // フォーム管理型
  FormState,
  // 状態管理型
  LoadingState,
  // UI機能型
  PaginationState,
  // 検索フィルタリング型
  SearchFilters,
  // 通知メッセージ型
  SnackbarMessage,
  // ソート順型
  SortOrder,
  // バリデーションエラー型
  ValidationError,
} from './common';

// =============================================================================
// 🚀 型エイリアス - よく使う組み合わせの短縮形
// =============================================================================

/**
 * 頻繁に使用される型の組み合わせを事前定義
 *
 * 【50代向け配慮】
 * - 長い型名の記述を避けることで入力負担を軽減
 * - 一般的な操作パターンを型として表現
 * - 型エラーの発生を最小化
 */

// 顧客管理でよく使われる組み合わせ
export type CustomerForm = FormState<CreateCustomerInput>;
export type CustomerUpdateForm = FormState<UpdateCustomerInput>;
export type CustomersApiResponse = ApiResponse<Customer[]>;
export type CustomerApiResponse = ApiResponse<Customer>;

// サービス履歴管理でよく使われる組み合わせ
export type ServiceForm = FormState<CreateServiceRecordInput>;
export type ServiceUpdateForm = FormState<UpdateServiceRecordInput>;
export type ServicesApiResponse = ApiResponse<ServiceRecord[]>;
export type ServiceApiResponse = ApiResponse<ServiceRecord>;
export type ServicesWithCustomerApiResponse = ApiResponse<
  ServiceRecordWithCustomer[]
>;

// 一覧画面でよく使われる状態の組み合わせ
export type CustomerListState = {
  /** 顧客一覧データ */
  items: CustomerListItem[];
  /** ローディング・エラー状態 */
  loading: LoadingState;
  /** ページネーション状態 */
  pagination: PaginationState;
  /** 検索フィルタ */
  filters: CustomerSearchParams;
  /**ソート順序 */
  sort: SortOrder;
};

// 一覧画面でよく使われる状態の組み合わせ
export type ServiceListState = {
  /** 顧客一覧データ */
  items: ServiceRecordListItem[];
  /** ローディング・エラー状態 */
  loading: LoadingState;
  /** ページネーション状態 */
  pagination: PaginationState;
  /** 検索フィルタ */
  filters: ServiceRecordSearchParams;
  /**ソート順序 */
  sort: SortOrder;
};

// =============================================================================
// 🎨 コンポーネント Props型の統一（React使用時）
// =============================================================================

/**
 * Reactコンポーネントで共通使用されるProps型を事前定義
 *
 * 【設計意図】
 * - コンポーネント間での一貫したProps設計
 * - エラーハンドリングや成功処理の統一
 * - 50代向けの操作フィードバック機能を標準化
 */

// 基本的なコンポーネントProps
export type BaseComponentProps = {
  /** ローディング状態 (任意) */
  loading?: LoadingState;
  /** エラー時のコールバック */
  onError?: (error: AppError) => void;
  /** 成功時のコールバック */
  onSuccess?: (message: string) => void;
};

// 一覧表示コンポーネント用Props
export type ListComponentProps<T> = BaseComponentProps & {
  /** 表示するアイテム一覧 */
  items: T[];
  /** ページネーション状態 */
  pagination: PaginationState;
  /** ページ変更時のコールバック */
  onPageChange: (page: number) => void;
  /** ソート変更時のコールバック */
  onSort: (sort: SortOrder) => void;
};

// フォームコンポーネント用Props
export type FormComponentProps<T> = BaseComponentProps & {
  /** フォーム状態 */
  formState: FormState<T>;
  /** フォーム送信時のコールバック */
  onSubmit: (data: T) => void;
  /** フォーム値変更時のコールバック */
  onFieldChange: (field: keyof T, value: any) => void;
};
// =============================================================================
// 🔮 将来の拡張に備えた型定義の準備
// =============================================================================

/**
 * 将来の機能追加に備えた型システムの拡張性確保
 *
 * 【Phase 2 対応予定】
 * - Reminder（リマインダー）機能の型定義
 * - Calendar（カレンダー）機能の型定義
 * - Report（レポート）機能の型定義
 *
 * 【Phase 3 対応予定】
 * - Electron固有の型定義
 * - ファイル操作関連の型定義
 * - 印刷機能関連の型定義
 *
 * 【拡張方法】
 * 1. 新しい機能の型定義ファイルを作成（例：reminder.ts）
 * 2. このindex.tsに新しいエクスポートセクションを追加
 * 3. 既存の型エイリアスとの組み合わせ型を定義
 *
 * 【10個以上の型定義ファイルへの準備】
 * - カテゴリ別のコメントセクション維持
 * - アルファベット順序でのファイル整理
 * - 依存関係を考慮したインポート順序
 */

// 将来追加される型定義ファイルのプレースホルダー
// export type { ... } from './reminder';    // Phase 2: リマインダー機能
// export type { ... } from './calendar';    // Phase 2: カレンダー機能
// export type { ... } from './report';      // Phase 2: レポート機能
// export type { ... } from './electron';    // Phase 3: Electron固有型
// export type { ... } from './file';        // Phase 3: ファイル操作型
// export type { ... } from './print';       // Phase 3: 印刷機能型

// =============================================================================
// 📖 使用例とベストプラクティス
// =============================================================================

/**
 * 🎯 このindex.tsを使用した場合の比較例
 *
 * ❌ index.ts がない場合（煩雑で覚えにくい）：
 * ```typescript
 * import { Customer, CreateCustomerInput, UpdateCustomerInput } from '@/types/customer';
 * import { ServiceRecord, CreateServiceRecordInput } from '@/types/service';
 * import { LoadingState, ApiResponse, FormState } from '@/types/common';
 *
 * // 型名が長くて複雑
 * const customerForm: FormState<CreateCustomerInput> = { ... };
 * const customerAPI: ApiResponse<Customer[]> = { ... };
 * ```
 *
 * ✅ index.ts がある場合（簡潔で理解しやすい）：
 * ```typescript
 * import {
 *   Customer,
 *   CreateCustomerInput,
 *   ServiceRecord,
 *   LoadingState,
 *   CustomerForm,        // ← エイリアスで簡潔に！
 *   CustomersApiResponse // ← エイリアスで分かりやすく！
 * } from '@/types';
 *
 * // 短くて覚えやすい型名
 * const customerForm: CustomerForm = { ... };
 * const customerAPI: CustomersApiResponse = { ... };
 * ```
 *
 * 🎓 効果：
 * - import文の記述量が50%以上削減
 * - 型名が直感的で覚えやすい
 * - ファイル構成の変更に強い
 * - チーム開発での型の使い方が統一される
 */

/**
 * 💡 推奨されるimportパターン（50代・低ITリテラシー向け）
 *
 * ✅ Good（カテゴリ別にグループ化）：
 * ```typescript
 * import {
 *   // 顧客関連
 *   Customer,
 *   CustomerForm,
 *
 *   // サービス関連
 *   ServiceRecord,
 *   ServiceForm,
 *
 *   // UI関連
 *   LoadingState,
 *   SnackbarMessage,
 * } from '@/types';
 * ```
 *
 * ❌ Avoid（無秩序な羅列）：
 * ```typescript
 * import {
 *   Customer, LoadingState, ServiceForm, SnackbarMessage
 * } from '@/types';
 * ```
 */
