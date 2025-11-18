/**
 * cleanupDuplicateNotifications.ts
 *
 * 重複した通知（status: "notification"）を削除するスクリプト
 * 同じserviceRecordIdを持つ通知のうち、最新の1件のみを残す
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDuplicateNotifications() {
  console.log('🧹 重複通知の削除を開始します...');

  try {
    // status: "notification"の通知を全て取得
    const notifications = await prisma.reminder.findMany({
      where: {
        status: 'notification',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`📊 通知総数: ${notifications.length}件`);

    // serviceRecordIdごとにグループ化
    const groupedByServiceRecordId = new Map<
      number | null,
      typeof notifications
    >();

    for (const notification of notifications) {
      const serviceRecordId = notification.serviceRecordId;
      if (!groupedByServiceRecordId.has(serviceRecordId)) {
        groupedByServiceRecordId.set(serviceRecordId, []);
      }
      groupedByServiceRecordId.get(serviceRecordId)!.push(notification);
    }

    // 重複があるグループを特定
    const duplicates: number[] = [];
    let totalDuplicates = 0;

    for (const [serviceRecordId, group] of groupedByServiceRecordId.entries()) {
      if (group.length > 1) {
        // 最新の1件を残して、残りを削除対象に追加
        const sortedByCreatedAt = group.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );
        const toKeep = sortedByCreatedAt[0];
        const toDelete = sortedByCreatedAt.slice(1);

        console.log(
          `  🔍 serviceRecordId: ${serviceRecordId || 'null'}, 重複数: ${toDelete.length}件（最新の1件を保持）`
        );

        for (const notification of toDelete) {
          duplicates.push(notification.reminderId);
          totalDuplicates++;
        }
      }
    }

    console.log(`📊 削除対象: ${totalDuplicates}件`);

    if (duplicates.length > 0) {
      // 重複通知を削除
      const deleteResult = await prisma.reminder.deleteMany({
        where: {
          reminderId: {
            in: duplicates,
          },
        },
      });

      console.log(`✅ ${deleteResult.count}件の重複通知を削除しました`);
    } else {
      console.log('✅ 重複通知はありませんでした');
    }

    // 最終的な通知数を確認
    const finalCount = await prisma.reminder.count({
      where: {
        status: 'notification',
      },
    });

    console.log(`📊 最終的な通知数: ${finalCount}件`);
  } catch (error) {
    console.error('❌ 重複通知削除エラー:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプト実行
cleanupDuplicateNotifications()
  .then(() => {
    console.log('✅ 重複通知削除が完了しました');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  });
