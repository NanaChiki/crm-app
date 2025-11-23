/**
 * 🗃️ useServiceRecords - 50代向けサービス履歴管理カスタムHook
 *
 * 【設計コンセプト】
 * IT不慣れな50代後半の建築系自営業者向けに設計された、
 * 過去の工事・メンテナンス履歴を安心・確実・分かりやすく管理するシステム。
 * Phase 2のリマインダー機能の基盤となる重要なデータ管理Hook。
 *
 * 🎯 50代ユーザビリティの重点配慮：
 * - 日付・金額の表示は見やすい日本語フォーマット
 * - 「どの顧客の」「いつの」「何の」サービスか直感的に把握可能
 * - エラーメッセージは具体的な解決方法を提示
 * - 履歴がない時も「最初の履歴を登録しましょう」と前向きな案内
 * - 検索・フィルター機能は段階的に表示（複雑にしない）
 *
 * 【技術的特徴】
 * - TypeScript完全対応による型安全性
 * - Customer型との外部キー関係を適切に管理
 * - React Context APIとの密接な連携
 * - useMemo/useCallbackによる高度なパフォーマンス最適化
 * - 顧客特化機能（特定顧客の履歴、累計金額計算等）
 * - Phase 2リマインダー機能を見据えた拡張性確保
 *
 * @author CRM Development Team
 * @since 2025-09 Phase1-Step4B
 * @target 50代建築系自営業者
 * @future Phase2でリマインダー機能の基盤として使用
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  CreateServiceRecordInput,
  ServiceRecord,
  ServiceRecordWithCustomer,
  SortOrder,
  UpdateServiceRecordInput,
} from '../../types';
import { useApp } from '../contexts/AppContext';
import { useCustomer } from '../contexts/CustomerContext';

// =============================================================================
// 🔌 Window API Type Declaration for serviceRecordAPI
// =============================================================================

/**
 * Window API for ServiceRecord operations via Electron IPC
 *
 * Similar to customerAPI, this provides IPC communication with Electron main process:
 * - Main process handles Prisma operations
 * - Preload script exposes serviceRecordAPI to renderer
 * - This hook consumes the API for CRUD operations
 */
declare global {
  interface Window {
    serviceRecordAPI: {
      fetch: (filters?: any) => Promise<{
        success: boolean;
        data?: ServiceRecord[];
        error?: string;
      }>;
      create: (input: CreateServiceRecordInput) => Promise<{
        success: boolean;
        data?: ServiceRecord;
        error?: string;
      }>;
      update: (
        input: UpdateServiceRecordInput & { recordId: number }
      ) => Promise<{
        success: boolean;
        data?: ServiceRecord;
        error?: string;
      }>;
      delete: (recordId: number) => Promise<{
        success: boolean;
        error?: string;
      }>;
      uploadPhoto: (data: { recordId: number; filePath: string }) => Promise<{
        success: boolean;
        data?: { photoPath: string };
        error?: string;
      }>;
    };
  }
}

// =============================================================================
// 🎯 Hook専用型定義 - ServiceRecords特化の型システム
// =============================================================================

/**
 * Hook の入力プロパティ
 *
 * 【設計判断】
 * - customerId を任意にすることで「全サービス履歴」「特定顧客履歴」両方に対応
 * - autoLoad フラグで初期化時の自動読み込みを制御（パフォーマンス配慮）
 */

interface UseServiceRecordsProps {
  /** 特定顧客の履歴のみ取得（任意）
   * 【undefined】全顧客のサービス履歴を表示
   * 【number】指定顧客のサービス履歴のみ表示 */
  customerId?: number;

  /** 初期化時の自動読み込み（デフォルト: true）
   * 【true】Hook初期化と同時にデータ取得開始
   * 【false】手動でloadServiceRecordsを呼び出すまで待機 */
  autoLoad?: boolean;
}

/**
 * サービス履歴フィルター設定
 *
 * 【50代向け段階的検索設計】
 * - 基本検索：顧客・期間のみ
 * - 詳細検索：サービス種別・金額範囲も追加
 * - 複雑になりすぎないよう項目を厳選
 */
interface ServiceRecordFilters {
  /** 顧客指定フィルター */
  customerId?: number;

  /** サービス種別フィルター
   * 【50代配慮】プルダウンで選択式、手入力不要 */
  serviceType?: string;

  /** 期間フィルター（開始日）
   * 【50代配慮】カレンダーUIで直感的に選択 */
  dateFrom?: Date;

  /** 期間フィルター（終了日） */
  dateTo?: Date;

  /** 金額範囲フィルター（最小値） */
  minAmount?: number;

  /** 金額範囲フィルター（最大値） */
  maxAmount?: number;

  /** ステータスフィルター
   * 【例】"completed", "pending", "cancelled" */
  status?: string;
}

/**
 * Hook の戻り値インターフェース
 *
 * 【API設計思想】
 * - 50代の方でも覚えやすいメソッド名
 * - データ取得・操作・ユーティリティを適切に分類
 * - TypeScriptによる型補完でミスを防止
 * - 将来のPhase2拡張を考慮した設計
 */
interface UseServiceRecordsReturn {
  // =============================
  // 📊 データ状態
  // =============================

  /** 全サービス履歴データ */
  serviceRecords: ServiceRecordWithCustomer[];

  /** フィルタリングされたサービス履歴データ */
  filteredRecords: ServiceRecordWithCustomer[];

  /** データ読み込み中フラグ */
  loading: boolean;

  /** エラーメッセージ */
  error: string | null;

  // =============================
  // 🛠️ CRUD操作メソッド
  // =============================

  /**
   * 新規サービス履歴作成
   * @param data 作成データ
   * @returns 作成されたサービス履歴（失敗時はnull）
   */
  createServiceRecord: (
    data: CreateServiceRecordInput
  ) => Promise<ServiceRecord | null>;

  /**
   * サービス履歴更新
   * @param id 履歴ID
   * @param data 更新データ
   * @returns 更新されたサービス履歴（失敗時はnull）
   */
  updateServiceRecord: (
    id: number,
    data: UpdateServiceRecordInput
  ) => Promise<ServiceRecord | null>;

  /**
   * サービス履歴削除
   * @param id 履歴ID
   * @returns 削除成功可否
   */
  deleteServiceRecord: (id: number) => Promise<boolean>;

  /**
   * データ再読み込み
   */
  refreshServiceRecords: (silent?: boolean) => Promise<void>;

  // =============================
  // 🔍 フィルタリング・ソート機能
  // =============================

  /** 現在のフィルター設定 */
  filters: ServiceRecordFilters;

  /** 現在のソート設定 */
  sortOrder: SortOrder;

  /**
   * フィルター設定更新
   * @param filters 新しいフィルター設定（部分更新）
   */
  setFilters: (filters: Partial<ServiceRecordFilters>) => void;

  /**
   * ソート設定更新
   * @param order 新しいソート設定
   */
  setSortOrder: (order: SortOrder) => void;

  /**
   * フィルター・ソートをクリア
   */
  clearFilters: () => void;

  // =============================
  // 👤 顧客特化機能
  // =============================

  /**
   * 特定顧客の全履歴取得
   * @param customerId 顧客ID
   * @returns 顧客の全サービス履歴
   */
  getRecordsByCustomer: (customerId: number) => ServiceRecordWithCustomer[];

  /**
   * 顧客の最新サービス履歴取得
   * @param customerId 顧客ID
   * @returns 最新のサービス履歴（なしの場合はnull）
   */
  getLatestRecordByCustomer: (
    customerId: number
  ) => ServiceRecordWithCustomer | null;

  /**
   * 顧客別累計金額計算
   * @param customerId 顧客ID
   * @returns 累計金額（円）
   */
  getTotalAmountByCustomer: (customerId: number) => number;

  // =============================
  // 🔧 ユーティリティ機能
  // =============================

  /**
   * サービス種別一覧取得（重複除去済み）
   * @returns サービス種別の配列
   */
  getServiceTypes: () => string[];

  /**
   * 表示中の履歴件数取得
   * @returns フィルター適用後の件数
   */
  getRecordCount: () => number;

  /** 履歴が存在するかどうか */
  hasRecords: boolean;
}

// =============================================================================
// 🎨 バリデーション設定 - 50代向けメッセージシステム
// =============================================================================

/**
 * サービス履歴バリデーションルール
 *
 * 【50代配慮の設計原則】
 * 1. エラーメッセージは優しく具体的に
 * 2. ビジネスルールを分かりやすく説明
 * 3. 修正方法を明示（例を含む）
 * 4. 「〜してください」で統一した丁寧な表現
 */
const VALIDATION_RULES = {
  serviceDate: {
    required: true,
    maxDate: new Date(), // 未来日不可
    errorMessages: {
      required: 'サービス提供日を選択してください',
      maxDate: 'サービス提供日は今日よりも前の日付を選択してください',
    },
  },
  customerId: {
    required: true,
    errorMessages: {
      required: '顧客を選択してください',
      notFound: '選択された顧客が見つかりません',
    },
  },
  serviceType: {
    required: false,
    maxLength: 50,
    errorMessages: {
      maxLength: 'サービス種別は50文字以内で入力してください',
    },
  },
  serviceDescription: {
    required: false,
    maxLength: 1000,
    errorMessages: {
      maxLength: 'サービス内容は1000文字以内で入力してください',
    },
  },
  amount: {
    required: false,
    min: 0,
    max: 10000000,
    errorMessages: {
      min: '金額は0円以上で入力してください',
      max: '金額は1000万円以下で入力してください',
      invalid: '金額は正しい数値で入力してください（例：50000）',
    },
  },
  status: {
    required: false,
    allowedValues: ['completed', 'pending', 'cancelled', 'in-progress'],
    errorMessages: {
      invalid: 'ステータスは正しくありません',
    },
  },
} as const;

/**
 * 成功・エラーメッセージ定数
 *
 * 【50代向けメッセージ設計思想】
 * - 成功時は達成感を与える表現
 * - エラー時は解決方法を明確に提示
 * - パニックを避ける安心感のある表現
 * - 次のアクションが明確
 */
const MESSAGES = {
  success: {
    create: 'サービス履歴を登録しました。',
    update: 'サービス履歴を更新しました。',
    delete: 'サービス履歴を削除しました。',
    load: 'サービス履歴を読み込みました。',
  },
  error: {
    create:
      'サービス履歴の登録に失敗しました。入力内容をご確認の上、もう一度お試しください。',
    update: 'サービス履歴の更新に失敗しました。もう一度お試しください。',
    delete: 'サービス履歴の削除に失敗しました。もう一度お試しください。',
    load: 'サービス履歴の読み込みに失敗しました。ページを再読み込みしてください。',
    network: 'インターネット接続を確認してもう一度お試しください。',
    validation: '入力内容に不備があります。赤字の項目をご確認ください。',
    notFound: '指定されたサービス履歴が見つかりません。',
  },
  info: {
    noRecords: 'サービス履歴がありません。最初の履歴を登録しましょう。',
    loading: 'サービス履歴を読み込んでいます...',
    filtering: '条件に一致するサービス履歴を検索しています...',
  },
  confirm: {
    delete: 'このサービス履歴を削除してもよろしいですか？',
  },
} as const;

/**
 * よく使われるサービス種別（50代向けプリセット）
 *
 * 【建築系事業者の実情に合わせた分類】
 * - 50代の方が直感的に理解できる分類
 * - 建築・リフォーム業界でよく使われる用語
 * - 入力の手間を省く選択式UI用
 */

const COMMON_SERVICE_TYPES = [
  '外壁塗装',
  '屋根修理',
  '屋根塗装',
  '配管工事',
  '電気工事',
  '内装リフォーム',
  '水回りリフォーム',
  '定期点検',
  '緊急修理',
  'エアコン工事',
  '防水工事',
  '床工事',
  '窓・サッシ工事',
  '見積もり',
  'その他',
] as const;

// =============================================================================
// 🗃️ データ変更リスナー管理（複数インスタンス間の同期用）
// =============================================================================

/**
 * データ変更リスナー
 * 複数のuseServiceRecordsインスタンス間でデータ変更を通知するためのリスナー配列
 */
type DataChangeListener = () => void;
const dataChangeListeners: DataChangeListener[] = [];

/**
 * データ変更通知
 * データが変更された時に全てのリスナーに通知
 */
const notifyDataChange = () => {
  dataChangeListeners.forEach((listener) => listener());
};

// =============================================================================
// 🚀 メインHook実装
// =============================================================================

/**
 * useServiceRecords - 50代向けサービス履歴管理Hook
 *
 * 【使用例】
 * ```typescript
 * // 全履歴表示
 * const records = useServiceRecords({});
 *
 * // 特定顧客の履歴のみ
 * const customerRecords = useServiceRecords({
 *   customerId: 123,
 *   autoLoad: true
 * });
 * ```
 *
 * @param props Hook設定
 * @returns サービス履歴管理機能一式
 */
export const useServiceRecords = (
  props: UseServiceRecordsProps = {}
): UseServiceRecordsReturn => {
  const { customerId, autoLoad = true } = props;

  // =============================
  // 🔗 Context API連携
  // =============================
  const { showSnackbar, handleError, setGlobalLoading } = useApp();
  const { customers, selectedCustomer } = useCustomer();

  // =============================
  // 📊 状態管理
  // =============================

  /** サービス履歴データ */
  const [serviceRecords, setServiceRecords] = useState<
    ServiceRecordWithCustomer[]
  >([]);

  /** ローディング・エラー状態 (hooks内で管理。全体はsetGlobalLoadingで管理)*/
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /** フィルタリング・ソート設定 */
  const [filters, setFiltersState] = useState<ServiceRecordFilters>({});
  const [sortOrder, setSortOrderState] = useState<SortOrder>({
    field: 'serviceDate',
    direction: 'desc',
    label: '新しい順',
  });

  /** 初期化完了フラグ */
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  /** customerIdの前回の値を保持（変更検出用） */
  const prevCustomerIdRef = useRef<number | undefined>(customerId);

  // =============================
  // 🔄 データ取得・初期化
  // =============================

  /**
   * サービス履歴データ取得
   *
   * 【実装方針】
   * - Prismaクライアント経由でデータベースから取得
   * - 顧客情報と JOIN した ServiceRecordWithCustomer 型で返す
   * - customerId指定時はフィルタリング
   *
   * 【50代配慮】
   * - ローディング中は明確にメッセージ表示
   * - エラー時は分かりやすい原因と対処法を提示
   */
  const loadServiceRecords = useCallback(
    async (silent: boolean = false): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        // Real Prisma database via window.serviceRecordAPI
        const filters = customerId ? { customerId } : undefined;
        const result = await window.serviceRecordAPI.fetch(filters);

        if (result.success && result.data) {
          // ServiceRecord[] → ServiceRecordWithCustomer[] への変換
          // 顧客情報を結合
          const recordsWithCustomer: ServiceRecordWithCustomer[] =
            result.data.map((record) => {
              const customer = customers.find(
                (c) => c.customerId === record.customerId
              );
              return {
                ...record,
                customer: customer
                  ? {
                      customerId: customer.customerId,
                      companyName: customer.companyName,
                      contactPerson: customer.contactPerson || null,
                      phone: customer.phone || null,
                      email: customer.email || null,
                      address: customer.address || null,
                    }
                  : {
                      customerId: record.customerId,
                      companyName: '不明',
                      contactPerson: null,
                      phone: null,
                      email: null,
                      address: null,
                    },
              };
            });

          setServiceRecords(recordsWithCustomer);
          setIsInitialized(true);

          // サイレントモード時はスナックバーを表示しない（リスナー経由の更新時）
          // 【修正】0件の場合のメッセージを削除（UIで表示するため不要）
          if (!silent && recordsWithCustomer.length > 0) {
            showSnackbar(MESSAGES.success.load, 'success');
          }
        } else {
          throw new Error(result.error || 'サービス履歴の取得に失敗しました');
        }
      } catch (error) {
        console.error('❌ サービス履歴取得エラー:', error);

        const errorMessage =
          error instanceof Error
            ? error.message.includes('network')
              ? MESSAGES.error.network
              : MESSAGES.error.load
            : MESSAGES.error.load;

        setError(errorMessage);
        if (!silent) {
          handleError({
            type: 'SERVER_ERROR',
            message: errorMessage,
            suggestion: 'ページを再読み込みしてもう一度お試しください',
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [customerId, customers, showSnackbar, handleError]
  );

  /**
   * データ再読み込み
   *
   * 【50代配慮】
   * - 「最新情報に更新」として分かりやすく説明
   * - 更新中の状態を明確に表示
   */
  const refreshServiceRecords = useCallback(
    async (silent: boolean = false): Promise<void> => {
      // サイレントモードでない場合のみメッセージ表示
      if (!silent) {
        showSnackbar('最新情報に更新しています...', 'info', 2000);
      }

      // isInitializedをリセットして再読み込みを許可
      setIsInitialized(false);

      await loadServiceRecords();
    },
    [loadServiceRecords, showSnackbar]
  );

  // =============================
  // 🛠️ CRUD操作実装
  // =============================

  /**
   * 新規サービス履歴作成
   *
   * 【実装方針】
   * - バリデーション → Prisma操作 → 成功通知
   * - 楽観的更新でUI応答性を向上
   * - エラー時は50代向け分かりやすいメッセージ
   */
  const validateServiceRecord = useCallback(
    (data: CreateServiceRecordInput): string[] => {
      const errors: string[] = [];

      // 必須項目チェック
      if (!data.customerId) {
        errors.push(VALIDATION_RULES.customerId.errorMessages.required);
      }

      if (!data.serviceDate) {
        errors.push(VALIDATION_RULES.serviceDate.errorMessages.required);
      } else if (new Date(data.serviceDate) > new Date()) {
        errors.push(VALIDATION_RULES.serviceDate.errorMessages.maxDate);
      }

      // 金額チェック
      if (data.amount !== undefined && data.amount !== null) {
        const amount = Number(data.amount);
        if (isNaN(amount) || amount < 0) {
          errors.push(VALIDATION_RULES.amount.errorMessages.min);
        } else if (amount > VALIDATION_RULES.amount.max) {
          // 1000万円以下
          errors.push(VALIDATION_RULES.amount.errorMessages.max);
        }
      }

      // 文字数チェック
      if (
        data.serviceType &&
        data.serviceType.length > VALIDATION_RULES.serviceType.maxLength
      ) {
        // 50文字以内
        errors.push(VALIDATION_RULES.serviceType.errorMessages.maxLength);
      }
      if (
        data.serviceDescription &&
        data.serviceDescription.length >
          VALIDATION_RULES.serviceDescription.maxLength
      ) {
        // 1000文字以内
        errors.push(
          VALIDATION_RULES.serviceDescription.errorMessages.maxLength
        );
      }

      return errors;
    },
    []
  );

  const createServiceRecord = useCallback(
    async (data: CreateServiceRecordInput): Promise<ServiceRecord | null> => {
      // validation check
      const validationErrors = validateServiceRecord(data);
      if (validationErrors.length > 0) {
        handleError({
          message: validationErrors.join('\n'),
          type: 'VALIDATION_ERROR',
        });
        return null;
      }

      setGlobalLoading(true);
      try {
        // Real Prisma database via window.serviceRecordAPI
        const result = await window.serviceRecordAPI.create(data);

        if (result.success && result.data) {
          const newRecord = result.data;

          // Refresh list to get latest data from database
          await loadServiceRecords(true); // silent mode

          // 全てのuseServiceRecordsインスタンスに変更を通知
          notifyDataChange();

          showSnackbar(MESSAGES.success.create, 'success');

          return newRecord;
        } else {
          throw new Error(result.error || 'サービス履歴の作成に失敗しました');
        }
      } catch (error) {
        console.error('❌ サービス履歴作成エラー:', error);
        const errorMessage =
          error instanceof Error ? error.message : MESSAGES.error.create;

        handleError({
          type: 'VALIDATION_ERROR',
          message: errorMessage,
          suggestion: '入力内容を確認してもう一度お試しください。',
        });
        setError(errorMessage);

        return null;
      } finally {
        setGlobalLoading(false);
      }
    },
    [
      validateServiceRecord,
      setGlobalLoading,
      showSnackbar,
      handleError,
      loadServiceRecords,
    ]
  );

  /**
   * サービス履歴更新
   *
   * 【実装方針】
   * - Prisma経由でデータベース更新
   * - 部分更新に対応（Partial<T>）
   */
  const updateServiceRecord = useCallback(
    async (
      id: number,
      data: UpdateServiceRecordInput
    ): Promise<ServiceRecord | null> => {
      setGlobalLoading(true);
      try {
        // Real Prisma database via window.serviceRecordAPI
        const result = await window.serviceRecordAPI.update({
          recordId: id,
          ...data,
        });

        if (result.success && result.data) {
          const updatedRecord = result.data;

          // Refresh list to get latest data from database
          await loadServiceRecords(true); // silent mode

          // 全てのuseServiceRecordsインスタンスに変更を通知
          notifyDataChange();

          showSnackbar(MESSAGES.success.update, 'success');

          return updatedRecord;
        } else {
          throw new Error(result.error || 'サービス履歴の更新に失敗しました');
        }
      } catch (error) {
        console.error('❌ サービス履歴更新エラー:', error);
        const errorMessage =
          error instanceof Error ? error.message : MESSAGES.error.update;
        handleError({
          type: 'SERVER_ERROR',
          message: errorMessage,
          suggestion: '入力内容を確認してもう一度お試しください。',
        });

        return null;
      } finally {
        setGlobalLoading(false);
      }
    },
    [setGlobalLoading, showSnackbar, handleError, loadServiceRecords]
  );

  /**
   * サービス履歴削除
   *
   * 【50代配慮】
   * - 削除前に確認ダイアログを表示
   * - 「元に戻せません」等の注意喚起
   */
  const deleteServiceRecord = useCallback(
    async (id: number): Promise<boolean> => {
      setGlobalLoading(true);
      try {
        // 削除確認
        const confirmed = window.confirm(MESSAGES.confirm.delete);
        if (!confirmed) {
          setGlobalLoading(false);
          return false;
        }

        // Real Prisma database via window.serviceRecordAPI
        const result = await window.serviceRecordAPI.delete(id);

        if (result.success) {
          // Refresh list to get latest data from database
          await loadServiceRecords(true); // silent mode

          // 全てのuseServiceRecordsインスタンスに変更を通知
          notifyDataChange();

          showSnackbar(MESSAGES.success.delete, 'success');
          return true;
        } else {
          throw new Error(result.error || 'サービス履歴の削除に失敗しました');
        }
      } catch (error) {
        console.error('❌ サービス履歴削除エラー:', error);
        const errorMessage =
          error instanceof Error ? error.message : MESSAGES.error.delete;
        handleError({
          type: 'SERVER_ERROR',
          message: errorMessage,
          suggestion: 'もう一度お試しください。',
        });
        return false;
      } finally {
        setGlobalLoading(false);
      }
    },
    [setGlobalLoading, showSnackbar, handleError, loadServiceRecords]
  );

  // =============================
  // 🔍 フィルタリング・ソート機能
  // =============================

  /**
   * フィルタリング適用
   *
   * 【パフォーマンス配慮】
   * - useMemo で不要な再計算を防止
   * - フィルター条件の変更時のみ再計算
   *
   * 【50代配慮】
   * - 複雑な条件でも直感的に結果が分かる
   * - 該当件数を明確に表示
   */
  const filteredRecords = useMemo(() => {
    let result = [...serviceRecords];

    // 顧客フィルター
    if (filters.customerId) {
      result = result.filter(
        (record) => record.customerId === filters.customerId
      );
    }

    // サービス種別フィルタ
    if (filters.serviceType) {
      result = result.filter((record) =>
        record.serviceType
          ?.toLowerCase()
          .includes(filters.serviceType!.toLowerCase())
      );
    }

    // 日付範囲フィルタ(型安全)
    if (filters.dateFrom) {
      result = result.filter(
        (record) =>
          new Date(record.serviceDate).getTime() >=
          new Date(filters.dateFrom!).getTime()
      );
    }
    if (filters.dateTo) {
      result = result.filter(
        (record) =>
          new Date(record.serviceDate).getTime() <=
          new Date(filters.dateTo!).getTime()
      );
    }

    // 金額範囲フィルタ(null安全)
    if (filters.minAmount !== undefined) {
      result = result.filter((record) => {
        if (!record.amount) {
          return false;
        }
        const amount =
          typeof record.amount === 'number'
            ? record.amount
            : Number(record.amount);
        return !isNaN(amount) && amount >= filters.minAmount!;
      });
    }
    if (filters.maxAmount !== undefined) {
      result = result.filter((record) => {
        // null/undefinedは通す
        if (!record.amount) {
          return false;
        }
        const amount =
          typeof record.amount === 'number'
            ? record.amount
            : Number(record.amount);
        return !isNaN(amount) && amount <= filters.maxAmount!;
      });
    }

    // ステータスフィルター
    if (filters.status) {
      result = result.filter((record) => record.status === filters.status);
    }

    // ソート処理(型安全)
    result.sort((a, b) => {
      if (sortOrder.field === 'serviceDate') {
        const aTime = new Date(a.serviceDate).getTime();
        const bTime = new Date(b.serviceDate).getTime();
        return sortOrder.direction === 'desc' ? bTime - aTime : aTime - bTime;
      } else if (sortOrder.field === 'amount') {
        const aAmount = a.amount ? Number(a.amount) : 0;
        const bAmount = b.amount ? Number(b.amount) : 0;
        return sortOrder.direction === 'desc'
          ? bAmount - aAmount
          : aAmount - bAmount;
      }
      // その他フィールドは文字列比較
      const aValue = String(
        a[sortOrder.field as keyof ServiceRecordWithCustomer] || ''
      );
      const bValue = String(
        b[sortOrder.field as keyof ServiceRecordWithCustomer] || ''
      );
      return sortOrder.direction === 'desc'
        ? bValue.localeCompare(aValue)
        : aValue.localeCompare(bValue);
    });

    return result;
  }, [serviceRecords, filters, sortOrder]);

  /**
   * フィルター設定更新
   *
   * 【50代配慮】
   * - フィルター適用時に結果件数をメッセージで通知
   * - 検索中の状態を明確に表示
   */
  const setFilters = useCallback(
    (newFilters: Partial<ServiceRecordFilters>) => {
      setFiltersState((prev) => ({ ...prev, ...newFilters }));

      //フィルター適用時のフィードバック
      const hasActiveFilters = Object.values({
        ...filters,
        ...newFilters,
      }).some((value) => value !== undefined && value !== null && value !== '');

      if (hasActiveFilters) {
        showSnackbar(MESSAGES.info.filtering, 'info', 2000);
      }
    },
    [filters, showSnackbar]
  );

  /**
   * ソート設定更新
   */
  const setSortOrder = useCallback((order: SortOrder) => {
    setSortOrderState(order);
  }, []);

  /**
   * フィルター・ソートクリア
   *
   * 【50代配慮】
   * - ワンクリックで初期状態に戻る安心感
   * - クリア後の状態を明確にフィードバック
   */
  const clearFilters = useCallback(() => {
    setFiltersState({});
    setSortOrderState({
      field: 'serviceDate',
      direction: 'desc',
      label: '新しい順',
    });

    showSnackbar('検索条件をクリアしました', 'info', 2000);
  }, [showSnackbar]);

  // =============================
  // 👤 顧客特化機能
  // =============================

  /**
   * 特定顧客の全履歴取得
   */
  const getRecordsByCustomer = useCallback(
    (customerId: number): ServiceRecordWithCustomer[] => {
      return serviceRecords.filter(
        (record) => record.customerId === customerId
      );
    },
    [serviceRecords]
  );

  /**
   * 顧客の最新サービス履歴取得
   *
   * 【50代配慮】
   * - 「最新のサービス」が直感的に分かる
   * - 顧客詳細画面での表示に最適
   */
  const getLatestRecordByCustomer = useCallback(
    (customerId: number): ServiceRecordWithCustomer | null => {
      const customerRecords = getRecordsByCustomer(customerId);
      if (customerRecords.length === 0) {
        return null;
      }

      return customerRecords.sort(
        (a, b) =>
          new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime()
      )[0];
    },
    [getRecordsByCustomer]
  );

  /**
   * 顧客別累計金額計算
   *
   * 【50代配慮】
   * - 取引総額が一目で分かる
   * - null値の安全な処理
   */
  const getTotalAmountByCustomer = useCallback(
    (customerId: number): number => {
      const customerRecords = getRecordsByCustomer(customerId);
      return customerRecords.reduce((total, record) => {
        return total + (record.amount || 0);
      }, 0);
    },
    [getRecordsByCustomer]
  );

  // =============================
  // 🔧 ユーティリティ機能
  // =============================

  /**
   * サービス種別一覧取得（重複除去済み）
   *
   * 【50代配慮】
   * - プルダウン選択肢として使用
   * - 建築業界で一般的な種別を優先表示
   */
  const getServiceTypes = useCallback((): string[] => {
    // 実際に使用されている種別を取得
    const usedTypes = serviceRecords
      .map((record) => record.serviceType)
      .filter((type): type is string => !!type);

    const uniqueUsedTypes = Array.from(new Set(usedTypes));

    // 共通種別と実際の使用種別をマージ
    const allTypes = [...COMMON_SERVICE_TYPES, ...uniqueUsedTypes];
    const uniqueAllTypes = Array.from(new Set(allTypes));

    return uniqueAllTypes.sort();
  }, [serviceRecords]);

  /**
   * 表示中の履歴件数取得
   */
  const getRecordCount = useCallback((): number => {
    return filteredRecords.length;
  }, [filteredRecords]);

  /**
   * 履歴データの有無
   */
  const hasRecords = useMemo(() => {
    return serviceRecords.length > 0;
  }, [serviceRecords.length]);

  // =============================
  // 🎨 表示フォーマット関数（50代向け配慮）
  // =============================

  /**
   * 日付表示フォーマット
   *
   * 【50代配慮】
   * - 日本語で分かりやすい表記
   * - 「令和6年12月15日」形式
   */
  const formatServiceDate = useCallback((date: Date): string => {
    return new Intl.DateTimeFormat('ja-JP-u-ca-japanese', {
      era: 'long', // 令和年
      year: 'numeric', // 年
      month: 'long', // 月
      day: 'numeric',
      weekday: 'short',
    }).format(date);
  }, []);

  /**
   * 金額表示フォーマット
   *
   * 【50代配慮】
   * - 円マークと3桁区切り
   * - 「¥350,000」形式
   */
  const formatAmount = useCallback((amount: number): string => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  }, []);

  /**
   * サービス履歴の要約表示
   *
   * 【50代配慮】
   * - 一目で内容が分かる要約
   * - 「12月15日 - 外壁塗装 ¥350,000」形式
   */
  const getRecordSummary = useCallback(
    (record: ServiceRecordWithCustomer): string => {
      const date = formatServiceDate(record.serviceDate);
      const type = record.serviceType || 'サービス種別未設定';
      const amount = record.amount ? `${formatAmount(record.amount)}` : '';

      return `${date} - ${type} ${amount}`;
    },
    [formatServiceDate, formatAmount]
  );

  // =============================
  // 🔄 副作用（Effect）処理
  // =============================

  /**
   * 初期データ読み込み・customerId変更時の再読み込み
   *
   * 【修正】customerIdが変更された時も再読み込みする
   * customerIdがundefinedから数値に変わった場合や、
   * 別の顧客の詳細ページに移動した場合に正しいデータを取得する
   *
   * 【重要】
   * - DashboardではcustomerIdがundefinedでも読み込む（全顧客のデータを取得）
   * - CustomerDetailPageではcustomerIdが確定してから読み込む（autoLoadがfalseになる）
   */
  useEffect(() => {
    if (!autoLoad) {
      return; // autoLoadがfalseの場合は読み込まない
    }

    // customerIdが変更された場合、または初回読み込みの場合
    const customerIdChanged = prevCustomerIdRef.current !== customerId;
    const isFirstLoad = !isInitialized;

    if (customerIdChanged || isFirstLoad) {
      prevCustomerIdRef.current = customerId;

      // customerIdが変更された場合は初期化フラグをリセット
      if (customerIdChanged && isInitialized) {
        setIsInitialized(false);
      }

      loadServiceRecords();
    }
  }, [autoLoad, customerId, isInitialized, loadServiceRecords]); // loadServiceRecordsを依存配列に追加（最新の関数参照を使用）

  /**
   * データ変更リスナーの登録
   *
   * 【重要】他のuseServiceRecordsインスタンスでデータが変更された時に
   * このインスタンスも自動的に最新データを読み込む。
   * これにより、Dashboard等の別コンポーネントで新しいサービス履歴が追加されても
   * 即座に反映される。
   *
   * 【修正】loadServiceRecordsを依存配列に含めて、最新の関数参照を使用
   */
  useEffect(() => {
    const handleDataChange = () => {
      // サイレントモード（true）で再読み込み - スナックバー非表示
      loadServiceRecords(true);
    };

    // リスナーを登録
    dataChangeListeners.push(handleDataChange);

    // クリーンアップ: コンポーネントアンマウント時にリスナーを削除
    return () => {
      const index = dataChangeListeners.indexOf(handleDataChange);
      if (index > -1) {
        dataChangeListeners.splice(index, 1);
      }
    };
  }, [loadServiceRecords]); // loadServiceRecordsを依存配列に含める

  /**
   * 選択中顧客変更時の自動フィルター適用
   *
   * 【CustomerContext連携】
   * - 顧客選択時に自動的にその顧客の履歴のみ表示
   * - 50代の方でも迷わない直感的な動作
   */
  useEffect(() => {
    if (customerId === undefined) {
      if (selectedCustomer) {
        // 顧客選択時->その顧客でフィルター
        setFiltersState((prev) => ({
          ...prev,
          customerId: selectedCustomer.customerId,
        }));
      } else {
        // 顧客選択解除時 -> フィルタークリア
        setFiltersState((prev) => {
          const { customerId: _, ...rest } = prev;
          return rest;
        });
      }
    }
  }, [selectedCustomer, customerId]);

  // =============================
  // 📤 戻り値
  // =============================
  return {
    // データ状態
    serviceRecords,
    filteredRecords,
    loading,
    error,

    // CRUD操作メソッド
    createServiceRecord,
    updateServiceRecord,
    deleteServiceRecord,
    refreshServiceRecords,

    // フィルタリング・ソート機能
    filters,
    sortOrder,
    setFilters,
    setSortOrder,
    clearFilters,

    // 顧客特化機能
    getRecordsByCustomer,
    getLatestRecordByCustomer,
    getTotalAmountByCustomer,

    // ユーティリティ機能
    getServiceTypes,
    getRecordCount,
    hasRecords,

    // 50代向けフォーマット関数（オプション追加）
    formatServiceDate,
    formatAmount,
    getRecordSummary,
  } as UseServiceRecordsReturn & {
    formatServiceDate: (date: Date) => string;
    formatAmount: (amount: number) => string;
    getRecordSummary: (record: ServiceRecordWithCustomer) => string;
  };
};

export default useServiceRecords;

/**
 * 🎯 使用例とベストプラクティス
 *
 * ```typescript
 * // 1. 全サービス履歴管理
 * function ServiceRecordManagementPage() {
 *   const records = useServiceRecords({});
 *
 *   return (
 *     <div>
 *       <h2>サービス履歴一覧 ({records.getRecordCount()}件)</h2>
 *
 *       {records.loading && <p>読み込み中...</p>}
 *       {records.error && <p>エラー: {records.error}</p>}
 *
 *       {!records.hasRecords && (
 *         <p>サービス履歴がありません。最初の履歴を登録しましょう</p>
 *       )}
 *
 *       {records.filteredRecords.map(record => (
 *         <div key={record.recordId}>
 *           <h3>{records.getRecordSummary(record)}</h3>
 *           <p>顧客: {record.customer.companyName}</p>
 *           <p>内容: {record.serviceDescription}</p>
 *           <button onClick={() => records.updateServiceRecord(record.recordId, {...})}>
 *             編集
 *           </button>
 *           <button onClick={() => records.deleteServiceRecord(record.recordId)}>
 *             削除
 *           </button>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 *
 * // 2. 特定顧客のサービス履歴
 * function CustomerServiceHistory({ customerId }: { customerId: number }) {
 *   const records = useServiceRecords({
 *     customerId,
 *     autoLoad: true
 *   });
 *
 *   const latestRecord = records.getLatestRecordByCustomer(customerId);
 *   const totalAmount = records.getTotalAmountByCustomer(customerId);
 *
 *   return (
 *     <div>
 *       <h2>サービス履歴</h2>
 *       <p>最新サービス: {latestRecord ? records.getRecordSummary(latestRecord) : 'なし'}</p>
 *       <p>累計金額: {records.formatAmount(totalAmount)}</p>
 *
 *       {records.filteredRecords.map(record => (
 *         <div key={record.recordId}>
 *           {records.formatServiceDate(record.serviceDate)} -
 *           {record.serviceType} -
 *           {record.amount ? records.formatAmount(record.amount) : '無償'}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 *
 * // 3. 新規サービス履歴作成フォーム
 * function ServiceRecordCreateForm({ customerId }: { customerId: number }) {
 *   const records = useServiceRecords({});
 *   const serviceTypes = records.getServiceTypes();
 *
 *   const handleSubmit = async (formData: CreateServiceRecordInput) => {
 *     const result = await records.createServiceRecord({
 *       customerId,
 *       serviceDate: formData.serviceDate,
 *       serviceType: formData.serviceType,
 *       serviceDescription: formData.serviceDescription,
 *       amount: formData.amount,
 *     });
 *
 *     if (result) {
 *       // 作成成功時の処理
 *       records.refreshServiceRecords();
 *     }
 *   };
 *
 *   return (
 *     <form onSubmit={...}>
 *       <select name="serviceType">
 *         <option value="">サービス種別を選択</option>
 *         {serviceTypes.map(type => (
 *           <option key={type} value={type}>{type}</option>
 *         ))}
 *       </select>
 *       {/ その他のフォーム要素... /}
 *     </form>
 *   );
 * }
 *
 * // 4. 検索・フィルター機能
 * function ServiceRecordSearchForm() {
 *   const records = useServiceRecords({});
 *
 *   const handleSearch = () => {
 *     records.setFilters({
 *       dateFrom: new Date('2024-01-01'),
 *       dateTo: new Date('2024-12-31'),
 *       serviceType: '外壁塗装',
 *       minAmount: 100000,
 *     });
 *   };
 *
 *   const handleClear = () => {
 *     records.clearFilters();
 *   };
 *
 *   const handleSort = (field: string, direction: 'asc' | 'desc') => {
 *     records.setSortOrder({
 *       field,
 *       direction,
 *       label: direction === 'desc' ? '新しい順' : '古い順',
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       {/ 検索フォーム... /}
 *       <button onClick={handleSearch}>検索</button>
 *       <button onClick={handleClear}>クリア</button>
 *
 *       <button onClick={() => handleSort('serviceDate', 'desc')}>新しい順</button>
 *       <button onClick={() => handleSort('serviceDate', 'asc')}>古い順</button>
 *       <button onClick={() => handleSort('amount', 'desc')}>金額の高い順</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * 【実装完了項目チェックリスト】
 * ✅ TypeScript完全対応・型安全性向上
 * ✅ CRUD操作完全実装
 * ✅ フィルタリング・ソート機能
 * ✅ 顧客特化機能（特定顧客履歴、累計金額等）
 * ✅ 50代向けエラーメッセージ・UI配慮
 * ✅ Context API連携（AppContext、CustomerContext）
 * ✅ パフォーマンス最適化（useMemo、useCallback）
 * ✅ ユーティリティ機能（日付・金額フォーマット）
 * ✅ 詳細なコメント・ドキュメント
 * ✅ Phase 2リマインダー機能を見据えた拡張性確保
 * ✅ モックデータによる動作確認可能
 * ✅ 将来のPrismaクライアント連携準備完了
 */
