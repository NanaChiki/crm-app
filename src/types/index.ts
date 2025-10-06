import { ApiResponse, FormState } from './common';
import { CreateCustomerInput, Customer, UpdateCustomerInput } from './customer';
import {
  CreateServiceRecordInput,
  ServiceRecord,
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
export type CustomerCreateForm = FormState<CreateCustomerInput>;
export type CustomerUpdateForm = FormState<UpdateCustomerInput>;
export type CustomerListApiResponse = ApiResponse<Customer[]>;
export type CustomerApiResponse = ApiResponse<Customer>;

// サービス履歴管理でよく使われる組み合わせ
export type ServiceCreateForm = FormState<CreateServiceRecordInput>;
export type ServiceUpdateForm = FormState<UpdateServiceRecordInput>;
export type ServiceRecordListApiResponse = ApiResponse<ServiceRecord[]>;
export type ServiceApiResponse = ApiResponse<ServiceRecord>;
export type ServiceRecordWithCustomerListApiResponse = ApiResponse<
  ServiceRecordWithCustomer[]
>;

// =============================================================================
// 🔮 将来の拡張に備えた型定義の準備
// =============================================================================

/**
 * 将来の機能追加に備えた型システムの拡張性確保（仮）
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
 *   CustomerCreateForm,        // ← エイリアスで簡潔に！
 *   CustomerApiResponse // ← エイリアスで分かりやすく！
 * } from '@/types';
 *
 * // 短くて覚えやすい型名
 * const customerForm: CustomerCreateForm = { ... };
 * const customerAPI: CustomerApiResponse = { ... };
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
 *   CustomerCreateForm,
 *
 *   // サービス関連
 *   ServiceRecord,
 *   ServiceCreateForm,
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
 *   Customer, LoadingState, ServiceCreateForm, SnackbarMessage
 * } from '@/types';
 * ```
 */
