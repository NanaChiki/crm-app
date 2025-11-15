/**
 * maintenanceNotification.ts
 *
 * 【自動お知らせ作成機能】
 *
 * メンテナンス時期到来時に自動でReminder作成。
 * status: "notification"で作成し、Dashboardのメンテナンス推奨タブと今週のリマインダータブに自動追加。
 */

import type { ServiceRecordWithCustomer } from '../../types';
import type { CreateReminderInput } from '../../types/reminder';
import { detectMaintenanceNeeded } from './maintenanceDetection';

/**
 * メンテナンス時期到来時に自動お知らせ作成
 *
 * @param serviceRecords サービス履歴リスト
 * @param customerName 顧客名
 * @returns 作成されたお知らせのリスト
 */
export function createMaintenanceNotifications(
  serviceRecords: ServiceRecordWithCustomer[],
  customerName: string
): CreateReminderInput[] {
  const detections = detectMaintenanceNeeded(serviceRecords);

  return detections.map((detection) => {
    // サービス種別に応じたメッセージ生成
    let message = '';
    if (detection.serviceType === '屋根') {
      message = `${customerName}様の屋根工事が${detection.yearsElapsed}年経過しました。そろそろメンテナンス時期です。`;
    } else if (detection.serviceType === '外壁') {
      message = `${customerName}様の外壁工事が${detection.yearsElapsed}年経過しました。そろそろメンテナンス時期です。`;
    } else if (detection.serviceType === '雨樋') {
      message = `${customerName}様の雨樋工事が${detection.yearsElapsed}年経過しました。そろそろメンテナンス時期です。`;
    }

    return {
      customerId: detection.customerId,
      serviceRecordId: detection.recordId,
      title: `${detection.serviceType}メンテナンス推奨`,
      message,
      reminderDate: new Date(), // 即座にお知らせ
      createdBy: 'system',
      notes: `自動生成: ${detection.serviceType}工事が${detection.yearsElapsed}年経過`,
    };
  });
}
