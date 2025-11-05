/**
 * useSiteList - 物件リスト管理Hook
 *
 * 【目的】
 * メンテナンス時期を迎えた現場（物件）を一覧表示するためのデータ管理
 *
 * 【設計コンセプト】
 * 1. useServiceRecords() で全サービス履歴を取得
 * 2. MaintenancePredictionロジックで各履歴にメンテナンス情報を付与
 * 3. 年度・サービス種別でフィルタリング
 * 4. 50代向けの分かりやすいサマリー情報提供
 *
 * 【ビジネス価値】
 * - 「屋根工事がそろそろ10年を迎えますよ」と自信を持ってアプローチ
 * - 年度別・サービス種別別の営業リスト作成
 * - 印刷して持ち歩ける営業資料の基盤
 */

import { useMemo, useState, useCallback } from 'react';
import { useServiceRecords } from './useServiceRecords';
import { useCustomer } from '../contexts/CustomerContext';
import {
  SiteListItem,
  SiteListFilters,
  YearSummary,
  MAINTENANCE_CYCLES,
  MaintenanceServiceType,
} from '../../types/siteList';

interface UseSiteListReturn {
  // データ
  allSites: SiteListItem[]; // 全現場（フィルター前）
  filteredSites: SiteListItem[]; // フィルター後の現場
  yearSummaries: YearSummary[]; // 年度別サマリー（10年分）

  // フィルター状態
  filters: SiteListFilters;
  setFilters: (filters: Partial<SiteListFilters>) => void;
  clearFilters: () => void;

  // ユーティリティ
  getSitesByYear: (year: number) => SiteListItem[];
  getSitesByType: (type: MaintenanceServiceType) => SiteListItem[];
  getTotalMaintenanceNeeded: () => number; // メンテナンス時期到来の総数

  // 状態
  loading: boolean;
  error: string | null;
}

/**
 * 物件リスト管理Hook
 *
 * @example
 * ```typescript
 * const {
 *   filteredSites,
 *   yearSummaries,
 *   setFilters,
 *   getTotalMaintenanceNeeded,
 * } = useSiteList();
 *
 * // 2025年の屋根工事現場を取得
 * setFilters({ year: 2025, serviceType: '屋根' });
 *
 * // メンテナンス推奨現場の総数
 * const total = getTotalMaintenanceNeeded(); // 例: 45件
 * ```
 */
export const useSiteList = (): UseSiteListReturn => {
  // 既存Hooks活用
  const { serviceRecords, loading, error } = useServiceRecords({ autoLoad: true });
  const { customers } = useCustomer();

  // フィルター状態
  const [filters, setFiltersState] = useState<SiteListFilters>({
    showOnlyMaintenanceNeeded: true, // デフォルトでメンテナンス時期到来のみ表示
  });

  /**
   * 全サービス履歴 → SiteListItem[] 変換
   *
   * 【重要ロジック】
   * 1. serviceRecordsから屋根・外壁・雨樋のみ抽出
   * 2. 各履歴に対して経過年数・メンテナンス予測情報を付与
   * 3. 顧客情報を結合
   * 4. 緊急度順・経過年数順でソート
   */
  const allSites = useMemo((): SiteListItem[] => {
    const targetTypes: MaintenanceServiceType[] = ['屋根', '外壁', '雨樋'];

    return serviceRecords
      .filter((record) => {
        // サービス種別が屋根・外壁・雨樋のいずれかに含まれるか
        return targetTypes.some((type) => record.serviceType?.includes(type));
      })
      .map((record) => {
        // 顧客情報取得
        const customer = customers.find((c) => c.customerId === record.customerId);

        // サービス種別判定（文字列から MaintenanceServiceType へ変換）
        let serviceType: MaintenanceServiceType = '屋根'; // デフォルト
        if (record.serviceType?.includes('外壁')) {
          serviceType = '外壁';
        } else if (record.serviceType?.includes('雨樋')) {
          serviceType = '雨樋';
        }

        // メンテナンス周期取得
        const cycle = MAINTENANCE_CYCLES[serviceType];

        // 経過年数計算（MaintenancePredictionロジックを移植）
        const now = new Date();
        const serviceDate =
          typeof record.serviceDate === 'string'
            ? new Date(record.serviceDate)
            : record.serviceDate;
        const diffMs = now.getTime() - serviceDate.getTime();
        const yearsElapsed = Math.floor((diffMs / (1000 * 60 * 60 * 24 * 365.25)) * 10) / 10;

        // 緊急度判定（4段階）
        let urgencyLevel: 'low' | 'medium' | 'high' | 'overdue' = 'low';
        if (yearsElapsed >= cycle.late) {
          urgencyLevel = 'overdue'; // 遅延期限超過（12年以上 or 9年以上）
        } else if (yearsElapsed >= cycle.standard) {
          urgencyLevel = 'high'; // 標準期限到達（10年以上 or 7年以上）
        } else if (yearsElapsed >= cycle.early) {
          urgencyLevel = 'medium'; // 早期メンテナンス推奨（8年以上 or 5年以上）
        }

        // 次回推奨日計算（施工日 + 標準周期）
        const nextRecommendedDate = new Date(serviceDate);
        nextRecommendedDate.setFullYear(nextRecommendedDate.getFullYear() + cycle.standard);

        // メンテナンス時期到来判定（標準周期の早期到達以上）
        const isMaintenanceNeeded = yearsElapsed >= cycle.early;

        return {
          // サービス履歴情報
          recordId: record.recordId,
          serviceDate: serviceDate,
          serviceType,
          serviceDescription: record.serviceDescription,
          amount: record.amount,

          // 顧客情報
          customerId: record.customerId,
          companyName: customer?.companyName || '不明',
          address: customer?.address || null,
          contactPerson: customer?.contactPerson || null,
          phone: customer?.phone || null,

          // メンテナンス予測情報
          yearsElapsed,
          nextRecommendedDate,
          urgencyLevel,
          isMaintenanceNeeded,
        };
      })
      .sort((a, b) => {
        // 緊急度順 → 経過年数順
        const urgencyOrder = { overdue: 4, high: 3, medium: 2, low: 1 };
        if (urgencyOrder[a.urgencyLevel] !== urgencyOrder[b.urgencyLevel]) {
          return urgencyOrder[b.urgencyLevel] - urgencyOrder[a.urgencyLevel];
        }
        return b.yearsElapsed - a.yearsElapsed;
      });
  }, [serviceRecords, customers]);

  /**
   * フィルタリング処理
   *
   * 【フィルター条件】
   * - メンテナンス時期到来のみ表示（デフォルト）
   * - 年度フィルター（次回推奨日の年度）
   * - サービス種別フィルター（屋根・外壁・雨樋）
   * - 緊急度フィルター（low/medium/high/overdue）
   */
  const filteredSites = useMemo((): SiteListItem[] => {
    let result = [...allSites];

    // メンテナンス時期到来のみ表示
    if (filters.showOnlyMaintenanceNeeded) {
      result = result.filter((site) => site.isMaintenanceNeeded);
    }

    // 年度フィルター（次回推奨日の年度以下）
    if (filters.year) {
      result = result.filter((site) => site.nextRecommendedDate.getFullYear() <= filters.year!);
    }

    // サービス種別フィルター
    if (filters.serviceType) {
      result = result.filter((site) => site.serviceType === filters.serviceType);
    }

    // 緊急度フィルター
    if (filters.urgencyLevel) {
      result = result.filter((site) => site.urgencyLevel === filters.urgencyLevel);
    }

    return result;
  }, [allSites, filters]);

  /**
   * 年度別サマリー生成
   *
   * 【目的】
   * 「2025年は屋根15件、外壁8件、雨樋22件」のような集計表示
   *
   * 【重要】
   * 現在年から10年分を自動生成（2025〜2035年等）
   */
  const yearSummaries = useMemo((): YearSummary[] => {
    const currentYear = new Date().getFullYear();
    const summaries: YearSummary[] = [];

    for (let year = currentYear; year <= currentYear + 10; year++) {
      const sitesForYear = allSites.filter(
        (site) =>
          site.isMaintenanceNeeded && site.nextRecommendedDate.getFullYear() <= year
      );

      summaries.push({
        year,
        totalSites: sitesForYear.length,
        roof: sitesForYear.filter((s) => s.serviceType === '屋根').length,
        wall: sitesForYear.filter((s) => s.serviceType === '外壁').length,
        gutter: sitesForYear.filter((s) => s.serviceType === '雨樋').length,
      });
    }

    return summaries;
  }, [allSites]);

  /**
   * フィルター操作
   */
  const setFilters = useCallback((newFilters: Partial<SiteListFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState({ showOnlyMaintenanceNeeded: true });
  }, []);

  /**
   * ユーティリティ関数
   */
  const getSitesByYear = useCallback(
    (year: number): SiteListItem[] => {
      return allSites.filter(
        (site) =>
          site.isMaintenanceNeeded && site.nextRecommendedDate.getFullYear() <= year
      );
    },
    [allSites]
  );

  const getSitesByType = useCallback(
    (type: MaintenanceServiceType): SiteListItem[] => {
      return allSites.filter((site) => site.serviceType === type && site.isMaintenanceNeeded);
    },
    [allSites]
  );

  const getTotalMaintenanceNeeded = useCallback((): number => {
    return allSites.filter((site) => site.isMaintenanceNeeded).length;
  }, [allSites]);

  return {
    allSites,
    filteredSites,
    yearSummaries,
    filters,
    setFilters,
    clearFilters,
    getSitesByYear,
    getSitesByType,
    getTotalMaintenanceNeeded,
    loading,
    error,
  };
};
