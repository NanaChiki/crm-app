/**
 * serviceRecordHandlers.ts
 *
 * 【サービス履歴データベース操作 - Electronメインプロセス】
 *
 * Prismaクライアント経由でサービス履歴のCRUD操作を実行。
 * レンダラープロセスからIPC通信で呼び出される。
 *
 * 【主な機能】
 * ✅ サービス履歴取得（顧客フィルター対応）
 * ✅ サービス履歴作成
 * ✅ サービス履歴更新
 * ✅ サービス履歴削除
 *
 * 【50代配慮】
 * - 親切な日本語エラーメッセージ
 * - データ検証
 * - わかりやすいログ出力
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
    console.log("✅ Prisma Client初期化完了 (serviceRecordHandlers)");
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

interface ServiceRecordFilters {
  customerId?: number;
  serviceType?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

interface CreateServiceRecordInput {
  customerId: number;
  serviceDate: string | Date;
  serviceType?: string;
  serviceDescription?: string;
  amount?: number | string;
  status?: string;
}

interface UpdateServiceRecordInput {
  recordId: number;
  serviceDate?: string | Date;
  serviceType?: string;
  serviceDescription?: string;
  amount?: number | string;
  status?: string;
}

// ================================
// サービス履歴取得
// ================================

/**
 * サービス履歴一覧取得（フィルター対応）
 *
 * @param {ServiceRecordFilters} [filters] - フィルター条件（顧客ID、サービス種別、期間、ステータス）
 * @returns {Promise<DatabaseResult<any[]>>} サービス履歴一覧（顧客情報付き、日付降順）
 * @throws {Error} データベース接続エラー時
 */
export async function fetchServiceRecords(
  filters?: ServiceRecordFilters,
): Promise<DatabaseResult<any[]>> {
  try {
    const prisma = await getPrisma();

    // where条件構築
    const where: any = {};

    if (filters?.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters?.serviceType) {
      where.serviceType = {
        contains: filters.serviceType,
      };
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.serviceDate = {};

      if (filters.startDate) {
        where.serviceDate.gte = new Date(filters.startDate);
      }

      if (filters.endDate) {
        where.serviceDate.lte = new Date(filters.endDate);
      }
    }

    // サービス履歴取得（顧客情報含む）
    const serviceRecords = await prisma.serviceRecord.findMany({
      where,
      include: {
        customer: true,
      },
      orderBy: [
        {
          serviceDate: "desc",
        },
        {
          recordId: "desc",
        },
      ],
    });

    const serializedRecords = serializeForIPC(serviceRecords);
    return {
      success: true,
      data: serializedRecords,
    };
  } catch (error: any) {
    console.error("❌ サービス履歴取得エラー:", error);
    return {
      success: false,
      error: "サービス履歴の取得に失敗しました",
    };
  }
}

// ================================
// サービス履歴作成
// ================================

/**
 * 新規サービス履歴作成
 *
 * @param {CreateServiceRecordInput} input - サービス履歴作成データ（顧客ID、サービス日、種別、内容、金額）
 * @returns {Promise<DatabaseResult<any>>} 作成されたサービス履歴（顧客情報付き）
 * @throws {Error} 顧客が存在しない場合、または金額が不正な場合
 */
export async function createServiceRecord(
  input: CreateServiceRecordInput,
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

    // 金額をDecimalに変換（文字列または数値を受け入れる）
    let amountValue = null;
    if (
      input.amount !== undefined &&
      input.amount !== null &&
      input.amount !== ""
    ) {
      amountValue =
        typeof input.amount === "string"
          ? parseFloat(input.amount)
          : input.amount;

      if (isNaN(amountValue)) {
        return {
          success: false,
          error: "金額は有効な数値を入力してください",
        };
      }
    }

    // サービス履歴作成
    const serviceRecord = await prisma.serviceRecord.create({
      data: {
        customerId: input.customerId,
        serviceDate: new Date(input.serviceDate),
        serviceType: input.serviceType?.trim() || null,
        serviceDescription: input.serviceDescription?.trim() || null,
        amount: amountValue,
        status: input.status || "completed",
      },
      include: {
        customer: true,
      },
    });

    const serializedRecord = serializeForIPC(serviceRecord);
    return {
      success: true,
      data: serializedRecord,
    };
  } catch (error: any) {
    console.error("❌ サービス履歴作成エラー:", error);
    return {
      success: false,
      error: "サービス履歴の登録に失敗しました",
    };
  }
}

// ================================
// サービス履歴更新
// ================================

/**
 * サービス履歴更新
 *
 * @param {UpdateServiceRecordInput} input - 更新データ（レコードID、サービス日、種別、内容、金額）
 * @returns {Promise<DatabaseResult<any>>} 更新されたサービス履歴（顧客情報付き）
 * @throws {Error} サービス履歴が存在しない場合、または金額が不正な場合
 */
export async function updateServiceRecord(
  input: UpdateServiceRecordInput,
): Promise<DatabaseResult<any>> {
  try {
    const prisma = await getPrisma();

    // サービス履歴存在確認
    const existingRecord = await prisma.serviceRecord.findUnique({
      where: { recordId: input.recordId },
    });

    if (!existingRecord) {
      return {
        success: false,
        error: "指定されたサービス履歴が見つかりません",
      };
    }

    // 更新データ構築
    const updateData: any = {};

    if (input.serviceDate !== undefined) {
      updateData.serviceDate = new Date(input.serviceDate);
    }

    if (input.serviceType !== undefined) {
      updateData.serviceType = input.serviceType.trim() || null;
    }

    if (input.serviceDescription !== undefined) {
      updateData.serviceDescription = input.serviceDescription.trim() || null;
    }

    if (
      input.amount !== undefined &&
      input.amount !== null &&
      input.amount !== ""
    ) {
      const amountValue =
        typeof input.amount === "string"
          ? parseFloat(input.amount)
          : input.amount;

      if (isNaN(amountValue)) {
        return {
          success: false,
          error: "金額は有効な数値を入力してください",
        };
      }

      updateData.amount = amountValue;
    }

    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    // サービス履歴更新
    const serviceRecord = await prisma.serviceRecord.update({
      where: { recordId: input.recordId },
      data: updateData,
      include: {
        customer: true,
      },
    });

    const serializedRecord = serializeForIPC(serviceRecord);
    return {
      success: true,
      data: serializedRecord,
    };
  } catch (error: any) {
    console.error("❌ サービス履歴更新エラー:", error);
    return {
      success: false,
      error: "サービス履歴の更新に失敗しました",
    };
  }
}

// ================================
// サービス履歴削除
// ================================

/**
 * サービス履歴削除（関連リマインダーのserviceRecordIdをnullに設定）
 *
 * @param {number} recordId - レコードID
 * @returns {Promise<DatabaseResult<void>>} 削除結果
 * @throws {Error} サービス履歴が存在しない場合、またはデータベースエラー時
 */
export async function deleteServiceRecord(
  recordId: number,
): Promise<DatabaseResult<void>> {
  try {
    const prisma = await getPrisma();

    // サービス履歴存在確認
    const existingRecord = await prisma.serviceRecord.findUnique({
      where: { recordId },
      include: {
        customer: true,
        reminders: true,
      },
    });

    if (!existingRecord) {
      return {
        success: false,
        error: "指定されたサービス履歴が見つかりません",
      };
    }

    // 関連リマインダーのserviceRecordIdをnullに設定してから削除
    // （schema.prismaでonDelete: SetNull設定済み）
    await prisma.serviceRecord.delete({
      where: { recordId },
    });

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("❌ サービス履歴削除エラー:", error);
    return {
      success: false,
      error: "サービス履歴の削除に失敗しました",
    };
  }
}

// ================================
// クリーンアップ
// ================================

/**
 * Prismaクライアントを適切に終了
 *
 * @returns {Promise<void>}
 */
export async function disconnectPrismaServiceRecord(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
    console.log("✅ Prismaクライアント切断完了 (serviceRecordHandlers)");
  }
}
