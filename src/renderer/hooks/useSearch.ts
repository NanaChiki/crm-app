/**
 * useSearch.ts
 *
 * 【50代向け統合検索管理カスタムフック】
 *
 * 50代後半の建築系自営業者向けCRMツールの統合検索システム。
 * IT不慣れなユーザーでも迷わず必要な情報を見つけられる、
 * 段階的で直感的な検索機能を提供します。
 *
 * 【主な機能】
 * ✅ 基本検索：キーワード入力のみで全項目検索
 * ✅ 詳細検索：項目別指定検索（会社名、担当者名など）
 * ✅ 期間検索：日付範囲指定での絞り込み
 * ✅ debounce検索：パフォーマンス配慮の自動検索
 * ✅ 検索履歴：過去の検索条件を再利用
 * ✅ Context API連携：顧客・サービス履歴との統合
 * ✅ 50代配慮：分かりやすいメッセージ・段階的UI
 *
 * 【設計思想】
 * - IT不慣れな50代ユーザーにも直感的
 * - 段階的検索：簡単→詳細→期間の3段階
 * - 明示的検索を基本（リアルタイムは補助的）
 * - エラーメッセージは日本語で親切に
 * - 操作結果を明確にフィードバック
 *
 * 【使用例】
 * ```typescript
 * const {
 *   searchResults,
 *   executeSearch,
 *   searchFromHistory,
 *   updateCriteria
 * } = useSearch();
 *
 * // 基本検索
 * await executeSearch({ keyword: '田中建設', mode: 'basic' });
 *
 * // 詳細検索
 * await executeSearch({
 *   mode: 'detailed',
 *   companyName: '田中建設',
 *   serviceType: '外壁塗装'
 * });
 * ```
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Customer, ServiceRecordWithCustomer } from '../../types';
import { useApp } from '../contexts/AppContext';
import { useCustomer } from '../contexts/CustomerContext';
import { useServiceRecords } from './useServiceRecords';

// ================================
// 型定義
// ================================

/**
 * 検索モード
 * 50代ユーザー向けに段階的な検索方式を提供
 */
type SearchMode = 'basic' | 'detailed' | 'period';

/**
 * 検索対象
 * 顧客・サービス履歴・統合検索の選択
 */
type SearchTarget = 'customers' | 'services' | 'all';

/**
 * 検索条件
 * 各検索モードに対応した条件設定
 */
interface SearchCriteria {
  keyword: string; // 基本検索キーワード
  target: SearchTarget; // 検索対象
  mode: SearchMode; // 検索モード

  // 詳細検索用フィールド
  companyName?: string; // 会社名
  contactPerson?: string; // 担当者名
  phone?: string; // 電話番号
  email?: string; // メールアドレス
  serviceType?: string; // サービス種別

  // 期間検索用フィールド
  dateFrom?: Date; // 開始日
  dateTo?: Date; // 終了日

  // 金額用検索フィールド
  amountFrom?: number; // 金額範囲（最小値）
  amountTo?: number; // 金額範囲（最大値）
}

/**
 * 検索結果
 * 顧客・サービス履歴の検索結果を統合管理
 */
interface SearchResults {
  customers: Customer[]; // 顧客検索結果
  services: ServiceRecordWithCustomer[]; // サービス履歴検索結果
  totalCount: number; // 総件数
  hasResults: boolean; // 検索結果有無
  searchSummary: string; // 検索結果サマリー(50代向け)
}

/**
 * 検索履歴
 * 過去の検索条件を保存・再利用
 */
interface SearchHistory {
  id: string; // ユニークID
  criteria: SearchCriteria; // 検索条件
  resultCount: number; // 検索結果件数
  searchedAt: Date; // 検索実行日時
  label: string; // 表示用ラベル(50代向けわかりやすい)
}

/**
 * useSearchフックの戻り値
 * 検索機能の包括的な操作インターフェース
 */
interface UseSearchReturn {
  // 検索状態
  searchCriteria: SearchCriteria;
  searchResults: SearchResults;
  isSearching: boolean;
  searchHistory: SearchHistory[];

  // 検索実行機能
  executeSearch: (criteria?: Partial<SearchCriteria>) => Promise<void>;
  clearSearch: () => void;
  resetSearch: () => void;

  // 検索条件操作
  updateCriteria: (updates: Partial<SearchCriteria>) => void;
  setSearchMode: (mode: SearchMode) => void;
  setSearchTarget: (target: SearchTarget) => void;

  // 履歴管理機能
  searchFromHistory: (historyItem: SearchHistory) => Promise<void>;
  clearHistory: () => void;
  removeFromHistory: (id: string) => void;

  // ユーティリティ機能
  getRecentSearches: (count?: number) => SearchHistory[];
  getSuggestedKeywords: () => string[];
  isValidCriteria: (criteria: SearchCriteria) => boolean;

  // debounce検索機能
  debouncedSearch: (keyword: string) => void;
  cancelSearch: () => void;
}

// ================================
// 定数定義
// ================================

/**
 * 検索モードの日本語ラベル
 * 50代ユーザーが理解しやすい表現
 */
const MODE_LABELS = {
  basic: '基本検索',
  detailed: '詳細検索',
  period: '期間検索',
} as const;

/**
 * 検索対象の日本語ラベル
 */
const TARGET_LABELS = {
  customers: '顧客',
  services: 'サービス履歴',
  all: 'すべて',
} as const;

/**
 * 検索関連メッセージ
 */
const SEARCH_MESSAGES = {
  error: {
    noKeyword: '検索キーワードを入力してください',
    invalidDate: '正しい日付を選択してください',
    invalidAmount: '金額は正しい数値で入力してください（例：50000）',
    searchFailed: '検索に失敗しました。もう一度お試しください',
    noResults: '検索条件に一致する結果が見つかりませんでした',
    tooManyResults:
      '検索結果が多すぎます。条件を絞り込んでください（100件以上）',
    invalidCriteria: '検索条件を確認してください',
  },
  success: {
    searchComplete: '検索が完了しました',
    historyCleared: '検索履歴をクリアしました',
    historyRemoved: '検索項目を削除しました',
  },
  info: {
    searching: '検索しています...',
    emptyHistory: '検索履歴がありません',
    suggestions: '以下のキーワードをお試しください',
    modeChanged: (mode: string) => `検索モードを「${mode}」に変更しました`,
    targetChanged: (target: string) => `検索対象を「${target}」に変更しました`,
  },
} as const;

/**
 * デフォルト検索条件
 * 初期状態の設定
 */
const DEFAULT_CRITERIA: SearchCriteria = {
  keyword: '',
  target: 'all',
  mode: 'basic',
};

/**
 * 空の検索結果
 */
const EMPTY_RESULTS: SearchResults = {
  customers: [],
  services: [],
  totalCount: 0,
  hasResults: false,
  searchSummary: '検索を実行してください',
};

// ================================
// メインフック実装
// ================================

/**
 * useSearch - 統合検索管理フック
 *
 * @param options オプション設定
 * @returns 検索機能の操作インターフェース
 */
export const useSearch = (): UseSearchReturn => {
  // =============================
  // 状態管理
  // =============================

  /** 検索条件 */
  const [searchCriteria, setSearchCriteria] =
    useState<SearchCriteria>(DEFAULT_CRITERIA);
  /** 検索結果 */
  const [searchResults, setSearchResults] =
    useState<SearchResults>(EMPTY_RESULTS);
  /** 検索中フラグ */
  const [isSearching, setIsSearching] = useState(false);
  /** 検索履歴 */
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);

  // debounce用のタイマーRef
  const debounceTimeoutRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ================================
  // Context API連携
  // ================================

  const { showSnackbar, handleError } = useApp();
  const { customers, selectedCustomer } = useCustomer();

  // サービス履歴データ（実装時にuseServiceRecordsから取得）
  const { serviceRecords } = useServiceRecords();

  // ================================
  // 検索ロジック実装
  // ================================

  /**
   * 基本検索の実装
   * キーワードによる部分一致検索
   */
  const performBasicSearch = useCallback(
    (
      keyword: string,
      targetData: {
        customers: Customer[];
        services: ServiceRecordWithCustomer[];
      }
    ) => {
      const normalizedKeyword = keyword.toLowerCase().trim();

      if (!normalizedKeyword) {
        return { customers: [], services: [] };
      }

      // 顧客検索
      const matchedCustomers = targetData.customers.filter((customer) => {
        if (customer.companyName?.toLowerCase().includes(normalizedKeyword)) {
          return true;
        }
        if (customer.contactPerson?.toLowerCase().includes(normalizedKeyword)) {
          return true;
        }
        if (customer.phone && customer.phone.includes(normalizedKeyword)) {
          return true;
        }
        if (
          customer.email &&
          customer.email.toLowerCase().includes(normalizedKeyword)
        ) {
          return true;
        }

        return false;
      });

      // サービス履歴検索
      const matchedServices = targetData.services.filter((service) => {
        const serviceType = service.serviceType?.toLowerCase();
        const serviceDescription = service.serviceDescription?.toLowerCase();
        const customerCompany = service.customer?.companyName?.toLowerCase();
        const customerContact = service.customer?.contactPerson?.toLowerCase();

        return (
          (serviceType && serviceType.includes(normalizedKeyword)) ||
          (serviceDescription &&
            serviceDescription.includes(normalizedKeyword)) ||
          (customerCompany && customerCompany.includes(normalizedKeyword)) ||
          (customerContact && customerContact.includes(normalizedKeyword))
        );
      });

      console.log(
        `基本検索実行: キーワード="${keyword}", 顧客${matchedCustomers.length}件,  サービス${matchedServices.length}件`
      );

      return { customers: matchedCustomers, services: matchedServices };
    },
    []
  );

  /**
   * 詳細検索の実装
   * 項目別指定検索
   */
  const performDetailedSearch = useCallback(
    (
      criteria: SearchCriteria,
      targetData: {
        customers: Customer[];
        services: ServiceRecordWithCustomer[];
      }
    ) => {
      let matchedCustomers = [...targetData.customers];
      let matchedServices = [...targetData.services];

      // 顧客の詳細検索
      if (criteria.companyName) {
        const term = criteria.companyName.toLowerCase().trim();
        matchedCustomers = matchedCustomers.filter(
          (customer) => customer.companyName?.toLowerCase().includes(term)
        );
      }

      if (criteria.contactPerson) {
        const term = criteria.contactPerson.toLowerCase().trim();
        matchedCustomers = matchedCustomers.filter(
          (customer) => customer.contactPerson?.toLowerCase().includes(term)
        );
      }

      if (criteria.phone) {
        const term = criteria.phone.trim();
        matchedCustomers = matchedCustomers.filter(
          (customer) => customer.phone && customer.phone.includes(term)
        );
      }

      if (criteria.email) {
        const term = criteria.email.toLowerCase().trim();
        matchedCustomers = matchedCustomers.filter(
          (customer) =>
            customer.email && customer.email.toLowerCase().includes(term)
        );
      }

      // サービス履歴の詳細検索
      if (criteria.serviceType) {
        const term = criteria.serviceType.toLowerCase().trim();
        matchedServices = matchedServices.filter(
          (service) => service.serviceType?.toLowerCase().includes(term)
        );
      }

      console.log(
        `詳細検索実行: 顧客${matchedCustomers.length}件, サービス${matchedServices.length}件`
      );

      return { customers: matchedCustomers, services: matchedServices };
    },
    []
  );

  /**
   * 期間検索の実装
   * 日付範囲での絞り込み
   */
  const performPeriodSearch = useCallback(
    (
      criteria: SearchCriteria,
      targetData: {
        customers: Customer[];
        services: ServiceRecordWithCustomer[];
      }
    ) => {
      let matchedCustomers = [...targetData.customers];
      let matchedServices = [...targetData.services];

      // 基本条件（キーワードがあれば適用）
      if (criteria.keyword?.trim()) {
        const basicResult = performBasicSearch(criteria.keyword, targetData);
        matchedCustomers = basicResult.customers;
        matchedServices = basicResult.services;
      }

      // 期間フィルタ（主にサービス履歴対象）
      if (criteria.dateFrom || criteria.dateTo) {
        matchedServices = matchedServices.filter((service) => {
          const serviceDate = new Date(service.serviceDate);
          if (criteria.dateFrom && serviceDate < criteria.dateFrom) {
            return false;
          }

          if (criteria.dateTo && serviceDate > criteria.dateTo) {
            return false;
          }
          return true;
        });

        // 期間に該当するサービスがある顧客のみを抽出
        const serviceCustomerIds = new Set(
          matchedServices.map((s) => s.customerId)
        );
        matchedCustomers = matchedCustomers.filter((customer) =>
          serviceCustomerIds.has(customer.customerId)
        );
      }

      // 金額フィルタ
      if (
        criteria.amountFrom !== undefined ||
        criteria.amountTo !== undefined
      ) {
        matchedServices = matchedServices.filter((service) => {
          if (!service.amount) {
            return false;
          }
          const amount = Number(service.amount);

          if (
            criteria.amountFrom !== undefined &&
            amount < criteria.amountFrom
          ) {
            return false;
          }
          if (criteria.amountTo !== undefined && amount > criteria.amountTo) {
            return false;
          }
          return true;
        });

        // 金額に該当するサービスがある顧客のみを抽出
        const serviceCustomerIds = new Set(
          matchedServices.map((s) => s.customerId)
        );
        matchedCustomers = matchedCustomers.filter((customer) =>
          serviceCustomerIds.has(customer.customerId)
        );
      }

      console.log(
        `期間検索実行: 顧客${matchedCustomers.length}件, サービス${matchedServices.length}件`
      );

      return { customers: matchedCustomers, services: matchedServices };
    },
    [performBasicSearch]
  );

  /**
   * 検索実行の統合メソッド
   */
  const performSearch = useCallback(
    (criteria: SearchCriteria): SearchResults => {
      const targetData = { customers, services: serviceRecords };
      let result: {
        customers: Customer[];
        services: ServiceRecordWithCustomer[];
      } = { customers: [], services: [] };

      // 検索対象フィルタ
      const filteredData = { ...targetData };
      if (criteria.target === 'customers') {
        filteredData.services = [];
      } else if (criteria.target === 'services') {
        filteredData.customers = [];
      }

      // 検索モード別処理
      switch (criteria.mode) {
        case 'basic':
          result = performBasicSearch(criteria.keyword, filteredData);
          break;
        case 'detailed':
          result = performDetailedSearch(criteria, filteredData);
          break;
        case 'period':
          result = performPeriodSearch(criteria, filteredData);
          break;
        default:
          console.warn('未対応の検索モード:', criteria.mode);
          result = { customers: [], services: [] };
      }

      const totalCount = result.customers.length + result.services.length;

      return {
        customers: result.customers,
        services: result.services,
        totalCount,
        hasResults: totalCount > 0,
        searchSummary: generateSearchSummary(
          result.customers.length,
          result.services.length,
          totalCount
        ),
      };
    },
    [
      customers,
      serviceRecords,
      performBasicSearch,
      performDetailedSearch,
      performPeriodSearch,
    ]
  );

  /**
   * 検索結果サマリーの生成
   * 50代ユーザー向けの分かりやすい表示
   */
  const generateSearchSummary = useCallback(
    (
      customerCount: number,
      serviceCount: number,
      totalCount: number
    ): string => {
      if (totalCount === 0) {
        return '該当する結果がありません';
      }

      const parts: string[] = [];

      if (customerCount > 0) {
        parts.push(`顧客${customerCount}件`);
      }

      if (serviceCount > 0) {
        parts.push(`サービス履歴${serviceCount}件`);
      }

      const summary = parts.length > 0 ? parts.join('、') : '';
      return `${summary}の合計${totalCount}件が見つかりました`;
    },
    []
  );

  // ================================
  // 検索履歴管理
  // ================================

  /**
   * 検索履歴用ラベルの自動生成
   * 50代ユーザーが理解しやすい表現
   */
  const generateSearchLabel = useCallback(
    (criteria: SearchCriteria): string => {
      const parts: string[] = [];

      if (criteria.keyword?.trim()) {
        parts.push(`"${criteria.keyword.trim()}"`);
      }

      if (criteria.companyName?.trim()) {
        parts.push(`会社：${criteria.companyName.trim()}`);
      }

      if (criteria.contactPerson?.trim()) {
        parts.push(`担当者：${criteria.contactPerson.trim()}`);
      }

      if (criteria.serviceType?.trim()) {
        parts.push(`サービス：${criteria.serviceType.trim()}`);
      }

      if (criteria.dateFrom || criteria.dateTo) {
        const from = criteria.dateFrom
          ? formatDateForDisplay(criteria.dateFrom)
          : '';
        const to = criteria.dateTo ? formatDateForDisplay(criteria.dateTo) : '';

        if (from && to) {
          parts.push(`期間：${from}〜${to}`);
        } else if (from) {
          parts.push(`${from}以降`);
        } else if (to) {
          parts.push(`${to}以前`);
        }
      }

      if (
        criteria.amountFrom !== undefined ||
        criteria.amountTo !== undefined
      ) {
        const from = criteria.amountFrom
          ? formatAmountForDisplay(criteria.amountFrom)
          : '';
        const to = criteria.amountTo
          ? formatAmountForDisplay(criteria.amountTo)
          : '';

        if (from && to) {
          parts.push(`金額：${from}〜${to}`);
        } else if (from) {
          parts.push(`${from}以上`);
        } else if (to) {
          parts.push(`${to}以下`);
        }
      }

      if (parts.length === 0) {
        return `全件検索 (${MODE_LABELS[criteria.mode]})`;
      }

      return parts.join(' ');
    },
    []
  );

  /**
   * 日付の表示用フォーマット
   */
  const formatDateForDisplay = useCallback((date: Date): string => {
    return new Intl.DateTimeFormat('ja-JP-u-ca-japanese', {
      era: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    }).format(date);
  }, []);

  /**
   * 金額の表示用フォーマット
   */
  const formatAmountForDisplay = useCallback((amount: number): string => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(amount);
  }, []);

  /**
   * 検索履歴の保存
   * 重複防止・上限管理付き
   */
  const saveSearchHistory = useCallback(
    (criteria: SearchCriteria, resultCount: number) => {
      const label = generateSearchLabel(criteria);

      // 空のキーワードでの全体検索は履歴に保存しない
      if (
        !criteria.keyword?.trim() &&
        !criteria.companyName?.trim() &&
        !criteria.contactPerson?.trim() &&
        !criteria.serviceType?.trim() &&
        !criteria.dateFrom &&
        !criteria.dateTo &&
        criteria.amountFrom === undefined &&
        criteria.amountTo === undefined
      ) {
        return;
      }

      const newHistory: SearchHistory = {
        id: Date.now().toString(),
        criteria: { ...criteria },
        resultCount,
        searchedAt: new Date(),
        label,
      };

      setSearchHistory((prev) => {
        // 重複チェック（同じラベルの履歴は更新）
        const filtered = prev.filter((h) => h.label !== newHistory.label);

        // 最新を先頭に追加、10件制限
        const updated = [newHistory, ...filtered].slice(0, 10);

        console.log(`検索履歴保存: ${label} (${resultCount}件)`);
        return updated;
      });
    },
    [generateSearchLabel]
  );

  // ================================
  // バリデーション
  // ================================

  /**
   * 検索条件のバリデーション
   * 50代ユーザー向けの親切なエラーチェック
   */
  const isValidCriteria = useCallback(
    (criteria: SearchCriteria): boolean => {
      // 基本検索：キーワード必須
      if (criteria.mode === 'basic') {
        if (!criteria.keyword?.trim()) {
          handleError({
            type: 'VALIDATION_ERROR',
            message: SEARCH_MESSAGES.error.noKeyword,
          });
          return false;
        }
      }

      // 期間検索：日付の妥当性チェック
      if (criteria.mode === 'period') {
        if (criteria.dateFrom && criteria.dateTo) {
          if (criteria.dateFrom > criteria.dateTo) {
            handleError({
              type: 'VALIDATION_ERROR',
              message: '開始日は終了日より前の日付を選択してください',
            });
            return false;
          }
        }
      }

      // 金額の妥当性チェック
      if (
        criteria.amountFrom !== undefined &&
        criteria.amountTo !== undefined
      ) {
        if (criteria.amountFrom > criteria.amountTo) {
          handleError({
            type: 'VALIDATION_ERROR',
            message: '最小金額は最大金額より小さい値を入力してください',
          });
          return false;
        }
      }

      if (criteria.amountFrom !== undefined && criteria.amountFrom < 0) {
        handleError({
          type: 'VALIDATION_ERROR',
          message: SEARCH_MESSAGES.error.invalidAmount,
        });
        return false;
      }

      if (criteria.amountTo !== undefined && criteria.amountTo < 0) {
        handleError({
          type: 'VALIDATION_ERROR',
          message: SEARCH_MESSAGES.error.invalidAmount,
        });
        return false;
      }

      return true;
    },
    [handleError]
  );

  // ================================
  // 公開メソッド実装
  // ================================

  /**
   * 検索実行
   * メインの検索処理エントリーポイント
   */
  const executeSearch = useCallback(
    async (updates: Partial<SearchCriteria> = {}) => {
      const newCriteria = { ...searchCriteria, ...updates };

      // バリデーション
      if (!isValidCriteria(newCriteria)) {
        return;
      }

      setIsSearching(true);

      try {
        // 検索実行前の通知（50代向け安心メッセージ）
        showSnackbar(SEARCH_MESSAGES.info.searching, 'info');

        // 検索実行をわずかに遅延（UIフィードバックのため）
        await new Promise((resolve) => setTimeout(resolve, 100));

        console.log('検索実行開始:', newCriteria);

        // 検索結果の取得
        const searchResults = performSearch(newCriteria);

        // 結果が多すぎる場合の警告（50代配慮）
        if (searchResults.totalCount > 100) {
          showSnackbar(SEARCH_MESSAGES.error.tooManyResults, 'warning');
        }

        // 結果の設定
        setSearchResults(searchResults);
        setSearchCriteria(newCriteria);

        // 検索履歴に保存
        saveSearchHistory(newCriteria, searchResults.totalCount);

        // 成功通知
        if (searchResults.hasResults) {
          showSnackbar(
            `${SEARCH_MESSAGES.success.searchComplete} - ${searchResults.searchSummary}`,
            'success'
          );
        } else {
          showSnackbar(SEARCH_MESSAGES.error.noResults, 'info');
        }

        console.log('検索完了:', searchResults);
      } catch (error) {
        console.error('検索エラー:', error);
        handleError({
          type: 'NETWORK_ERROR',
          message: SEARCH_MESSAGES.error.searchFailed,
        });

        // エラー時は空の結果を設定
        setSearchResults(EMPTY_RESULTS);
      } finally {
        setIsSearching(false);
      }
    },
    [
      searchCriteria,
      isValidCriteria,
      performSearch,
      showSnackbar,
      handleError,
      saveSearchHistory,
    ]
  );

  /**
   * 検索条件の更新
   */
  const updateCriteria = useCallback((updates: Partial<SearchCriteria>) => {
    setSearchCriteria((prev) => {
      const newCriteria = { ...prev, ...updates };
      console.log('検索条件更新:', updates);
      return newCriteria;
    });
  }, []);

  /**
   * 検索モードの変更
   * 50代向けの分かりやすいモード切り替え
   */
  const setSearchMode = useCallback(
    (mode: SearchMode) => {
      setSearchCriteria((prev) => {
        const newCriteria = {
          ...prev,
          mode,
          // モード変更時は関連しない条件をクリア（混乱防止）
          keyword: mode === 'basic' ? prev.keyword : '',
          companyName: mode === 'detailed' ? prev.companyName : undefined,
          contactPerson: mode === 'detailed' ? prev.contactPerson : undefined,
          phone: mode === 'detailed' ? prev.phone : undefined,
          email: mode === 'detailed' ? prev.email : undefined,
          serviceType: mode === 'detailed' ? prev.serviceType : undefined,
          dateFrom: mode === 'period' ? prev.dateFrom : undefined,
          dateTo: mode === 'period' ? prev.dateTo : undefined,
          amountFrom: mode === 'period' ? prev.amountFrom : undefined,
          amountTo: mode === 'period' ? prev.amountTo : undefined,
        };

        console.log(`検索モード変更: ${MODE_LABELS[mode]}`);
        showSnackbar(
          SEARCH_MESSAGES.info.modeChanged(MODE_LABELS[mode]),
          'info'
        );

        return newCriteria;
      });
    },
    [showSnackbar]
  );

  /**
   * 検索対象の変更
   */
  const setSearchTarget = useCallback(
    (target: SearchTarget) => {
      setSearchCriteria((prev) => ({
        ...prev,
        target,
      }));

      console.log(`検索対象変更: ${TARGET_LABELS[target]}`);
      showSnackbar(
        SEARCH_MESSAGES.info.targetChanged(TARGET_LABELS[target]),
        'info'
      );
    },
    [showSnackbar]
  );

  /**
   * 検索のクリア
   * 結果のみクリア、条件は保持
   */
  const clearSearch = useCallback(() => {
    setSearchResults(EMPTY_RESULTS);
    console.log('検索結果クリア');
  }, []);

  /**
   * 検索のリセット
   * 条件・結果すべてクリア
   */
  const resetSearch = useCallback(() => {
    setSearchCriteria(DEFAULT_CRITERIA);
    setSearchResults(EMPTY_RESULTS);
    console.log('検索条件・結果リセット');
  }, []);

  /**
   * 検索履歴からの検索
   * 過去の検索条件を再利用
   */
  const searchFromHistory = useCallback(
    async (historyItem: SearchHistory) => {
      console.log('履歴から検索実行:', historyItem.label);
      await executeSearch(historyItem.criteria);
    },
    [executeSearch]
  );

  /**
   * 検索履歴のクリア
   */
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    showSnackbar(SEARCH_MESSAGES.success.historyCleared, 'success');
    console.log('検索履歴クリア');
  }, [showSnackbar]);

  /**
   * 履歴項目の削除
   */
  const removeFromHistory = useCallback(
    (id: string) => {
      setSearchHistory((prev) => prev.filter((item) => item.id !== id));
      showSnackbar(SEARCH_MESSAGES.success.historyRemoved, 'success');
      console.log(`履歴項目削除: ${id}`);
    },
    [showSnackbar]
  );

  // ================================
  // ユーティリティメソッド
  // ================================

  /**
   * 最近の検索履歴取得
   */
  const getRecentSearches = useCallback(
    (count: number = 5): SearchHistory[] => {
      return searchHistory.slice(0, count);
    },
    [searchHistory]
  );

  /**
   * 検索候補キーワードの取得
   * 既存データから自動生成
   */
  const getSuggestedKeywords = useMemo(() => {
    return (): string[] => {
      const keywords = new Set<string>();

      // 顧客データから候補抽出
      customers.forEach((customer) => {
        if (customer.companyName && customer.companyName.length > 1) {
          keywords.add(customer.companyName);
        }

        if (customer.contactPerson && customer.contactPerson.length > 1) {
          keywords.add(customer.contactPerson);
        }
      });

      // サービス履歴から候補抽出
      serviceRecords.forEach((service) => {
        if (service.serviceType && service.serviceType.length > 1) {
          keywords.add(service.serviceType);
        }
      });

      // よく使われるサービス種別を追加
      const commonServiceTypes = [
        '外壁塗装',
        '屋根修理',
        '配管工事',
        '電気工事',
        '内装リフォーム',
        '定期点検',
        '緊急修理',
      ];
      commonServiceTypes.forEach((type) => keywords.add(type));

      return Array.from(keywords).slice(0, 10);
    };
  }, [customers, serviceRecords]);

  // ================================
  // debounce検索実装
  // ================================

  /**
   * debounce検索
   * パフォーマンス配慮の自動検索
   */
  const debouncedSearch = useCallback(
    (keyword: string) => {
      // 既存のタイマーをクリア
      if (debounceTimeoutRef.current) {
        window.clearTimeout(debounceTimeoutRef.current);
      }

      // 新しいタイマーを設定（300ms後に実行）
      debounceTimeoutRef.current = window.setTimeout(() => {
        if (keyword.trim() !== searchCriteria.keyword) {
          console.log('debounce検索実行:', keyword);
          executeSearch({ keyword: keyword.trim() });
        }
      }, 300);
    },
    [searchCriteria.keyword, executeSearch]
  );

  /**
   * 検索のキャンセル
   */
  const cancelSearch = useCallback(() => {
    // debounceタイマーをクリア
    if (debounceTimeoutRef.current) {
      window.clearTimeout(debounceTimeoutRef.current);
    }

    // 進行中の検索をキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsSearching(false);
    console.log('検索キャンセル');
  }, []);

  // ================================
  // 副作用・初期化処理
  // ================================

  /**
   * 選択中顧客の自動検索条件設定
   * CustomerContextとの連携
   */
  useEffect(() => {
    if (selectedCustomer && searchCriteria.mode === 'basic') {
      const newKeyword = selectedCustomer.companyName || '';

      if (newKeyword !== searchCriteria.keyword) {
        console.log('選択中顧客で検索条件更新:', newKeyword);
        updateCriteria({
          keyword: newKeyword,
          target: 'all',
        });
      }
    }
  }, [
    selectedCustomer,
    searchCriteria.mode,
    searchCriteria.keyword,
    updateCriteria,
  ]);

  /**
   * クリーンアップ処理
   */
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        window.clearTimeout(debounceTimeoutRef.current);
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ================================
  // フック戻り値
  // ================================
  return {
    // 検索状態
    searchCriteria,
    isSearching,
    searchResults,
    searchHistory,

    // 検索実行機能
    executeSearch,
    clearSearch,
    resetSearch,

    // 検索条件操作
    updateCriteria,
    setSearchMode,
    setSearchTarget,

    // 履歴管理機能
    searchFromHistory,
    clearHistory,
    removeFromHistory,

    // ユーティリティ機能
    getRecentSearches,
    getSuggestedKeywords,
    isValidCriteria,

    // debounce検索機能
    debouncedSearch,
    cancelSearch,
  };
};

// ================================
// デフォルトエクスポート
// ================================

export default useSearch;

/**
 * 【50代ユーザー向け設計のポイント】
 *
 * 1. 段階的検索設計
 *    - 基本検索：キーワードのみの簡単検索
 *    - 詳細検索：項目別の詳細指定
 *    - 期間検索：日付・金額での絞り込み
 *
 * 2. 分かりやすいフィードバック
 *    - 検索実行中の「検索しています...」メッセージ
 *    - 結果サマリーの日本語表示
 *    - エラーメッセージは技術用語を避けた親切な表現
 *
 * 3. 操作の安心感
 *    - 明示的な検索実行（検索ボタンクリック）
 *    - debounce検索は補助的な位置づけ
 *    - 操作結果の明確な通知
 *
 * 4. 履歴機能による効率化
 *    - 過去の検索条件を再利用
 *    - 分かりやすいラベル自動生成
 *    - 重複防止・件数制限による管理
 *
 * 5. パフォーマンス配慮
 *    - useMemo/useCallbackによる最適化
 *    - debounce機能による負荷軽減
 *    - 大量結果時の警告メッセージ
 *
 * このHookにより、50代の建築系自営業者でも迷わず
 * 顧客・サービス情報を検索できる環境を実現します。
 */
