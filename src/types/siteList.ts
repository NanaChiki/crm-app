/**
 * 物件リスト専用型定義
 *
 * 【目的】
 * メンテナンス時期を迎えた現場（物件）を一覧表示するための型システム
 *
 * 【ビジネス要件】
 * - 年度選択（2025, 2026...）
 * - サービス種別選択（屋根・外壁・雨樋）
 * - メンテナンス周期：屋根・外壁10年、雨樋5〜7年
 * - 「〇〇件の現場が10年を迎えました」の分かりやすい表示
 */

/**
 * メンテナンス周期定義
 *
 * 【建築業界標準】
 * - 屋根：10年（早期8年、遅延12年）
 * - 外壁：10年（早期8年、遅延12年）
 * - 雨樋：7年（早期5年、遅延9年）※おじさん要望：5〜7年
 */
export const MAINTENANCE_CYCLES = {
  屋根: { standard: 10, early: 8, late: 12 },
  外壁: { standard: 10, early: 8, late: 12 },
  雨樋: { standard: 7, early: 5, late: 9 }, // 5〜7年の標準を7年に設定
} as const;

/**
 * メンテナンス対象のサービス種別
 */
export type MaintenanceServiceType = keyof typeof MAINTENANCE_CYCLES;

/**
 * 物件リスト項目
 *
 * 【概念】
 * 1現場 = 1サービス履歴（過去に施工した現場のメンテナンス状況）
 */
export interface SiteListItem {
  // サービス履歴情報（元データ）
  recordId: number;
  serviceDate: Date;
  serviceType: MaintenanceServiceType;
  serviceDescription: string | null;
  amount: number | null;

  // 顧客情報（結合データ）
  customerId: number;
  companyName: string;
  address: string | null;
  contactPerson: string | null;
  phone: string | null;

  // メンテナンス予測情報（計算結果）
  yearsElapsed: number; // 経過年数（例: 10.2年）
  nextRecommendedDate: Date; // 次回推奨日（施工日 + 標準周期）
  urgencyLevel: 'low' | 'medium' | 'high' | 'overdue'; // 緊急度
  isMaintenanceNeeded: boolean; // メンテナンス時期到来フラグ（early以上）
}

/**
 * 物件リストフィルター設定
 *
 * 【使用例】
 * - 「2025年までにメンテナンス時期を迎える屋根工事」
 * - 「2026年の雨樋メンテナンス」
 */
export interface SiteListFilters {
  year?: number; // メンテナンス時期到来年（次回推奨日の年度）
  serviceType?: MaintenanceServiceType; // 屋根・外壁・雨樋
  urgencyLevel?: 'low' | 'medium' | 'high' | 'overdue'; // 緊急度フィルター
  showOnlyMaintenanceNeeded?: boolean; // メンテナンス時期到来のみ表示（デフォルト: true）
}

/**
 * 年度別サマリー
 *
 * 【目的】
 * 「2025年は屋根15件、外壁8件、雨樋22件のメンテナンス時期」のような集計
 */
export interface YearSummary {
  year: number;
  totalSites: number; // 全現場数
  roof: number; // 屋根メンテナンス時期到来数
  wall: number; // 外壁メンテナンス時期到来数
  gutter: number; // 雨樋メンテナンス時期到来数
}
