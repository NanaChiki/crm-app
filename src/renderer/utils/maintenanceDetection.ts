/**
 * maintenanceDetection.ts
 *
 * 【メンテナンス時期検出ロジック】
 *
 * サービス履歴からメンテナンス時期を迎えた現場を検出。
 * 屋根・外壁: 10年経過検出
 * 雨樋: 5年経過検出
 */

import type { ServiceRecordWithCustomer } from '../../types';
import {
  MAINTENANCE_CYCLES,
  type MaintenanceServiceType,
} from '../../types/siteList';

export interface MaintenanceDetectionResult {
  recordId: number;
  customerId: number;
  serviceType: MaintenanceServiceType;
  yearsElapsed: number;
  isMaintenanceNeeded: boolean;
  urgencyLevel: 'low' | 'medium' | 'high' | 'overdue';
}

/**
 * メンテナンス時期検出
 *
 * @param serviceRecords サービス履歴リスト
 * @returns メンテナンス時期を迎えた現場のリスト
 */
export function detectMaintenanceNeeded(
  serviceRecords: ServiceRecordWithCustomer[]
): MaintenanceDetectionResult[] {
  const targetTypes: MaintenanceServiceType[] = ['屋根', '外壁', '雨樋'];
  const now = new Date();

  return serviceRecords
    .filter((record) => {
      // サービス種別が屋根・外壁・雨樋のいずれかに含まれるか
      return targetTypes.some((type) => record.serviceType?.includes(type));
    })
    .map((record) => {
      // サービス種別判定
      let serviceType: MaintenanceServiceType = '屋根';
      if (record.serviceType?.includes('外壁')) {
        serviceType = '外壁';
      } else if (record.serviceType?.includes('雨樋')) {
        serviceType = '雨樋';
      }

      // メンテナンス周期取得
      const cycle = MAINTENANCE_CYCLES[serviceType];

      // 経過年数計算
      const serviceDate =
        typeof record.serviceDate === 'string'
          ? new Date(record.serviceDate)
          : record.serviceDate;
      const diffMs = now.getTime() - serviceDate.getTime();
      const yearsElapsed =
        Math.floor((diffMs / (1000 * 60 * 60 * 24 * 365.25)) * 10) / 10;

      // 緊急度判定
      let urgencyLevel: 'low' | 'medium' | 'high' | 'overdue' = 'low';
      if (yearsElapsed >= cycle.late) {
        urgencyLevel = 'overdue';
      } else if (yearsElapsed >= cycle.standard) {
        urgencyLevel = 'high';
      } else if (yearsElapsed >= cycle.early) {
        urgencyLevel = 'medium';
      }

      // メンテナンス時期到来判定（早期メンテナンス推奨以上）
      const isMaintenanceNeeded = yearsElapsed >= cycle.early;

      return {
        recordId: record.recordId,
        customerId: record.customerId,
        serviceType,
        yearsElapsed,
        isMaintenanceNeeded,
        urgencyLevel,
      };
    })
    .filter((result) => result.isMaintenanceNeeded); // メンテナンス時期到来のみ
}
