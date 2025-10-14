/**
 * reminderHandlers.ts
 *
 * 【リマインダーデータベース操作 - Electronメインプロセス】
 *
 * Prismaクライアント経由でリマインダーのCRUD操作を実行。
 * レンダラープロセスからIPC通信で呼び出される。
 *
 * 【主な機能】
 * ✅ リマインダー取得（フィルター対応）
 * ✅ リマインダー作成
 * ✅ リマインダー更新
 * ✅ リマインダー削除
 * ✅ ステータス変更（drafting, sent, cancelled）
 *
 * 【50代配慮】
 * - 親切な日本語エラーメッセージ
 * - データ検証
 * - トランザクション処理
 */

import type { PrismaClient } from '@prisma/client';

// Prisma Clientインスタンスをキャッシュ
let prismaInstance: PrismaClient | null = null;

/**
 * Prisma Clientインスタンスを取得（遅延ロード）
 */
async function getPrisma(): Promise<PrismaClient> {
  if (!prismaInstance) {
    const { PrismaClient: PrismaClientClass } = await import('@prisma/client');
    prismaInstance = new PrismaClientClass();
    console.log('✅ Prisma Client初期化完了');
  }
  return prismaInstance;
}

// ================================
// 型定義
// ================================

interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface ReminderFilters {
  customerId?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}

interface CreateReminderInput {
  customerId: number;
  serviceRecordId?: number;
  title: string;
  message: string;
  reminderDate: string | Date;
  createdBy?: string;
  notes?: string;
}

interface UpdateReminderInput {
  reminderId: number;
  title?: string;
  message?: string;
  reminderDate?: string | Date;
  status?: string;
  sentAt?: string | Date | null;
  notes?: string;
}

// ================================
// リマインダー取得
// ================================

/**
 * リマインダー一覧取得（フィルター対応）
 *
 * @param filters - フィルター条件
 * @returns リマインダー一覧（顧客情報付き）
 */
export async function fetchReminders(
  filters?: ReminderFilters
): Promise<DatabaseResult<any[]>> {
  try {
    const prisma = await getPrisma();
    console.log('📋 DB: リマインダー取得開始', filters);

    // where条件構築
    const where: any = {};

    if (filters?.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.reminderDate = {};

      if (filters.startDate) {
        where.reminderDate.gte = new Date(filters.startDate);
      }

      if (filters.endDate) {
        where.reminderDate.lte = new Date(filters.endDate);
      }
    }

    // リマインダー取得（顧客情報・サービス履歴含む）
    const reminders = await prisma.reminder.findMany({
      where,
      include: {
        customer: true,
        serviceRecord: true,
      },
      orderBy: {
        reminderDate: 'asc', // 送信予定日の近い順
      },
    });

    console.log(`✅ DB: ${reminders.length}件のリマインダーを取得`);

    return {
      success: true,
      data: reminders,
    };
  } catch (error: any) {
    console.error('❌ DB: リマインダー取得エラー:', error);

    return {
      success: false,
      error: `リマインダーの取得に失敗しました: ${error.message}`,
    };
  }
}

// ================================
// リマインダー作成
// ================================

/**
 * 新規リマインダー作成
 *
 * @param input - リマインダー作成データ
 * @returns 作成されたリマインダー
 */
export async function createReminder(
  input: CreateReminderInput
): Promise<DatabaseResult<any>> {
  try {
    const prisma = await getPrisma();
    console.log('📝 DB: リマインダー作成開始', input);

    // 顧客存在確認
    const customer = await prisma.customer.findUnique({
      where: { customerId: input.customerId },
    });

    if (!customer) {
      return {
        success: false,
        error: '指定された顧客が見つかりません',
      };
    }

    // サービス履歴存在確認（指定されている場合）
    if (input.serviceRecordId) {
      const serviceRecord = await prisma.serviceRecord.findUnique({
        where: { recordId: input.serviceRecordId },
      });

      if (!serviceRecord) {
        return {
          success: false,
          error: '指定されたサービス履歴が見つかりません',
        };
      }
    }

    // リマインダー作成
    const reminder = await prisma.reminder.create({
      data: {
        customerId: input.customerId,
        serviceRecordId: input.serviceRecordId || null,
        title: input.title,
        message: input.message,
        reminderDate: new Date(input.reminderDate),
        status: 'scheduled',
        createdBy: input.createdBy || 'manual',
        notes: input.notes || null,
      },
    });

    console.log('✅ DB: リマインダー作成成功', reminder.reminderId);

    return {
      success: true,
      data: reminder,
    };
  } catch (error: any) {
    console.error('❌ DB: リマインダー作成エラー:', error);

    return {
      success: false,
      error: `リマインダーの作成に失敗しました: ${error.message}`,
    };
  }
}

// ================================
// リマインダー更新
// ================================

/**
 * リマインダー更新
 *
 * @param input - リマインダー更新データ
 * @returns 更新されたリマインダー
 */
export async function updateReminder(
  input: UpdateReminderInput
): Promise<DatabaseResult<any>> {
  try {
    const prisma = await getPrisma();
    console.log('📝 DB: リマインダー更新開始', input.reminderId);

    // リマインダー存在確認
    const existingReminder = await prisma.reminder.findUnique({
      where: { reminderId: input.reminderId },
    });

    if (!existingReminder) {
      return {
        success: false,
        error: '指定されたリマインダーが見つかりません',
      };
    }

    // 更新データ構築
    const updateData: any = {};

    if (input.title !== undefined) updateData.title = input.title;
    if (input.message !== undefined) updateData.message = input.message;
    if (input.reminderDate !== undefined) {
      updateData.reminderDate = new Date(input.reminderDate);
    }
    if (input.status !== undefined) updateData.status = input.status;
    if (input.sentAt !== undefined) {
      updateData.sentAt = input.sentAt ? new Date(input.sentAt) : null;
    }
    if (input.notes !== undefined) updateData.notes = input.notes;

    // リマインダー更新
    const reminder = await prisma.reminder.update({
      where: { reminderId: input.reminderId },
      data: updateData,
    });

    console.log('✅ DB: リマインダー更新成功', reminder.reminderId);

    return {
      success: true,
      data: reminder,
    };
  } catch (error: any) {
    console.error('❌ DB: リマインダー更新エラー:', error);

    return {
      success: false,
      error: `リマインダーの更新に失敗しました: ${error.message}`,
    };
  }
}

// ================================
// リマインダー削除
// ================================

/**
 * リマインダー削除
 *
 * @param reminderId - リマインダーID
 * @returns 削除結果
 */
export async function deleteReminder(
  reminderId: number
): Promise<DatabaseResult<void>> {
  try {
    const prisma = await getPrisma();
    console.log('🗑️ DB: リマインダー削除開始', reminderId);

    // リマインダー存在確認
    const existingReminder = await prisma.reminder.findUnique({
      where: { reminderId },
    });

    if (!existingReminder) {
      return {
        success: false,
        error: '指定されたリマインダーが見つかりません',
      };
    }

    // リマインダー削除
    await prisma.reminder.delete({
      where: { reminderId },
    });

    console.log('✅ DB: ��マインダー削除成功', reminderId);

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('❌ DB: リマインダー削除エラー:', error);

    return {
      success: false,
      error: `リマインダーの削除に失敗しました: ${error.message}`,
    };
  }
}

// ================================
// ステータス変更ヘルパー
// ================================

/**
 * リマインダーを送信済みにする
 *
 * @param reminderId - リマインダーID
 * @returns 更新されたリマインダー
 */
export async function markReminderAsSent(
  reminderId: number
): Promise<DatabaseResult<any>> {
  return updateReminder({
    reminderId,
    status: 'sent',
    sentAt: new Date(),
  });
}

/**
 * リマインダーをキャンセルする
 *
 * @param reminderId - リマインダーID
 * @returns 更新されたリマインダー
 */
export async function cancelReminder(
  reminderId: number
): Promise<DatabaseResult<any>> {
  return updateReminder({
    reminderId,
    status: 'cancelled',
  });
}

/**
 * リマインダーを再スケジュールする（キャンセル→予定）
 *
 * @param reminderId - リマインダーID
 * @returns 更新されたリマインダー
 */
export async function rescheduleReminder(
  reminderId: number
): Promise<DatabaseResult<any>> {
  return updateReminder({
    reminderId,
    status: 'scheduled',
    sentAt: null,
  });
}

/**
 * リマインダーを下書き中にする
 *
 * @param reminderId - リマインダーID
 * @returns 更新されたリマインダー
 */
export async function markReminderAsDrafting(
  reminderId: number
): Promise<DatabaseResult<any>> {
  return updateReminder({
    reminderId,
    status: 'drafting',
  });
}

// ================================
// クリーンアップ
// ================================

/**
 * Prismaクライアントを適切に終了
 */
export async function disconnectPrisma(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
    console.log('✅ Prismaクライアント切断完了');
  }
}
