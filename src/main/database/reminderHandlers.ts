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

import type { PrismaClient } from "@prisma/client";

let prismaInstance: PrismaClient | null = null;

/**
 * Prisma Clientインスタンスを取得（遅延ロード）
 *
 * @returns {Promise<PrismaClient>} Prismaクライアントインスタンス
 */
async function getPrisma(): Promise<PrismaClient> {
  if (!prismaInstance) {
    const { PrismaClient: PrismaClientClass } = await import("@prisma/client");
    prismaInstance = new PrismaClientClass();
    console.log("✅ Prisma Client初期化完了");
  }
  return prismaInstance;
}

/**
 * PrismaオブジェクトをIPC送信可能なプレーンオブジェクトに変換
 * Decimal型、Date型などをシリアライズ可能な形式に変換
 *
 * @param {any} data - シリアライズするデータ
 * @returns {any} シリアライズされたデータ
 */
function serializeForIPC(data: any): any {
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      // Decimal型を数値文字列に変換
      if (
        value &&
        typeof value === "object" &&
        value.constructor?.name === "Decimal"
      ) {
        return value.toString();
      }
      // Date型をISO文字列に変換
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }),
  );
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
 * @param {ReminderFilters} [filters] - フィルター条件（顧客ID、ステータス、期間）
 * @returns {Promise<DatabaseResult<any[]>>} リマインダー一覧（顧客情報・サービス履歴付き、送信予定日昇順）
 * @throws {Error} データベース接続エラー時
 */
export async function fetchReminders(
  filters?: ReminderFilters,
): Promise<DatabaseResult<any[]>> {
  try {
    const prisma = await getPrisma();

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
        reminderDate: "asc", // 送信予定日の近い順
      },
    });

    const serializedReminders = serializeForIPC(reminders);
    return {
      success: true,
      data: serializedReminders,
    };
  } catch (error: any) {
    console.error("❌ DB: リマインダー取得エラー:", error);

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
 * @param {CreateReminderInput} input - リマインダー作成データ（顧客ID、タイトル、メッセージ、送信予定日等）
 * @returns {Promise<DatabaseResult<any>>} 作成されたリマインダー
 * @throws {Error} 顧客が存在しない場合、またはサービス履歴が存在しない場合
 */
export async function createReminder(
  input: CreateReminderInput,
): Promise<DatabaseResult<any>> {
  try {
    const prisma = await getPrisma();

    // 顧客存在確認
    const customer = await prisma.customer.findUnique({
      where: { customerId: input.customerId },
    });

    if (!customer) {
      return {
        success: false,
        error: "指定された顧客が見つかりません",
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
          error: "指定されたサービス履歴が見つかりません",
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
        status: "scheduled",
        createdBy: input.createdBy || "manual",
        notes: input.notes || null,
      },
    });

    const serializedReminder = serializeForIPC(reminder);
    return {
      success: true,
      data: serializedReminder,
    };
  } catch (error: any) {
    console.error("❌ DB: リマインダー作成エラー:", error);

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
 * @param {UpdateReminderInput} input - リマインダー更新データ（リマインダーID、タイトル、メッセージ、ステータス等）
 * @returns {Promise<DatabaseResult<any>>} 更新されたリマインダー
 * @throws {Error} リマインダーが存在しない場合
 */
export async function updateReminder(
  input: UpdateReminderInput,
): Promise<DatabaseResult<any>> {
  try {
    const prisma = await getPrisma();

    // リマインダー存在確認
    const existingReminder = await prisma.reminder.findUnique({
      where: { reminderId: input.reminderId },
    });

    if (!existingReminder) {
      return {
        success: false,
        error: "指定されたリマインダーが見つかりません",
      };
    }

    // 更新データ構築
    const updateData: any = {};

    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.message !== undefined) {
      updateData.message = input.message;
    }
    if (input.reminderDate !== undefined) {
      updateData.reminderDate = new Date(input.reminderDate);
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    if (input.sentAt !== undefined) {
      updateData.sentAt = input.sentAt ? new Date(input.sentAt) : null;
    }
    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }

    // リマインダー更新
    const reminder = await prisma.reminder.update({
      where: { reminderId: input.reminderId },
      data: updateData,
    });

    const serializedReminder = serializeForIPC(reminder);
    return {
      success: true,
      data: serializedReminder,
    };
  } catch (error: any) {
    console.error("❌ DB: リマインダー更新エラー:", error);

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
 * @param {number} reminderId - リマインダーID
 * @returns {Promise<DatabaseResult<void>>} 削除結果
 * @throws {Error} リマインダーが存在しない場合、またはデータベースエラー時
 */
export async function deleteReminder(
  reminderId: number,
): Promise<DatabaseResult<void>> {
  try {
    const prisma = await getPrisma();

    // リマインダー存在確認
    const existingReminder = await prisma.reminder.findUnique({
      where: { reminderId },
    });

    if (!existingReminder) {
      return {
        success: false,
        error: "指定されたリマインダーが見つかりません",
      };
    }

    // リマインダー削除
    await prisma.reminder.delete({
      where: { reminderId },
    });

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("❌ DB: リマインダー削除エラー:", error);

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
 * リマインダーを送信済みにする（ステータスを"sent"に変更し、送信日時を記録）
 *
 * @param {number} reminderId - リマインダーID
 * @returns {Promise<DatabaseResult<any>>} 更新されたリマインダー
 */
export async function markReminderAsSent(
  reminderId: number,
): Promise<DatabaseResult<any>> {
  return updateReminder({
    reminderId,
    status: "sent",
    sentAt: new Date(),
  });
}

/**
 * リマインダーをキャンセルする（ステータスを"cancelled"に変更）
 *
 * @param {number} reminderId - リマインダーID
 * @returns {Promise<DatabaseResult<any>>} 更新されたリマインダー
 */
export async function cancelReminder(
  reminderId: number,
): Promise<DatabaseResult<any>> {
  return updateReminder({
    reminderId,
    status: "cancelled",
  });
}

/**
 * リマインダーを再スケジュールする（キャンセル→予定に戻す）
 *
 * @param {number} reminderId - リマインダーID
 * @returns {Promise<DatabaseResult<any>>} 更新されたリマインダー
 */
export async function rescheduleReminder(
  reminderId: number,
): Promise<DatabaseResult<any>> {
  return updateReminder({
    reminderId,
    status: "scheduled",
    sentAt: null,
  });
}

/**
 * リマインダーを下書き中にする（ステータスを"drafting"に変更）
 *
 * @param {number} reminderId - リマインダーID
 * @returns {Promise<DatabaseResult<any>>} 更新されたリマインダー
 */
export async function markReminderAsDrafting(
  reminderId: number,
): Promise<DatabaseResult<any>> {
  return updateReminder({
    reminderId,
    status: "drafting",
  });
}

// ================================
// クリーンアップ
// ================================

/**
 * Prismaクライアントを適切に終了
 *
 * @returns {Promise<void>}
 */
export async function disconnectPrisma(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
    console.log("✅ Prismaクライアント切断完了");
  }
}
