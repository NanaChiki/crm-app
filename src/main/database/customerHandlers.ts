/**
 * customerHandlers.ts
 *
 * 【顧客データベース操作 - Electronメインプロセス】
 *
 * Prismaクライアント経由で顧客のCRUD操作を実行。
 * レンダラープロセスからIPC通信で呼び出される。
 *
 * 【主な機能】
 * ✅ 顧客取得（検索・フィルター対応）
 * ✅ 顧客作成
 * ✅ 顧客更新
 * ✅ 顧客削除
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
    prismaInstance = new PrismaClientClass({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
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

interface CustomerFilters {
  companyName?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
}

interface CreateCustomerInput {
  companyName: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

interface UpdateCustomerInput {
  customerId: number;
  companyName?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

// ================================
// 顧客取得
// ================================

/**
 * 顧客一覧取得（検索・フィルター対応）
 *
 * @param {CustomerFilters} [filters] - フィルター条件（会社名、担当者名、電話番号、メールアドレス）
 * @returns {Promise<DatabaseResult<any[]>>} 顧客一覧データ（サービス履歴・リマインダー含む）
 * @throws {Error} データベース接続エラー時
 */
export async function fetchCustomers(
  filters?: CustomerFilters,
): Promise<DatabaseResult<any[]>> {
  try {
    const prisma = await getPrisma();

    // where条件構築
    const where: any = {};

    if (filters?.companyName) {
      where.companyName = {
        contains: filters.companyName,
      };
    }

    if (filters?.contactPerson) {
      where.contactPerson = {
        contains: filters.contactPerson,
      };
    }

    if (filters?.phone) {
      where.phone = {
        contains: filters.phone,
      };
    }

    if (filters?.email) {
      where.email = {
        contains: filters.email,
      };
    }

    // 顧客取得（サービス履歴・リマインダー含む）
    const customers = await prisma.customer.findMany({
      where,
      include: {
        serviceRecords: true,
        reminders: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // IPC送信用にシリアライズ
    const serializedCustomers = serializeForIPC(customers);

    return {
      success: true,
      data: serializedCustomers,
    };
  } catch (error: any) {
    console.error("❌ 顧客取得エラー:", error);
    return {
      success: false,
      error: "顧客情報の取得に失敗しました",
    };
  }
}

// ================================
// 顧客作成
// ================================

/**
 * 新規顧客作成
 *
 * @param {CreateCustomerInput} input - 顧客作成データ（会社名、担当者名、連絡先等）
 * @returns {Promise<DatabaseResult<any>>} 作成された顧客データ
 * @throws {Error} 会社名が空の場合、またはメールアドレス形式が不正な場合
 */
export async function createCustomer(
  input: CreateCustomerInput,
): Promise<DatabaseResult<any>> {
  try {
    const prisma = await getPrisma();

    // バリデーション
    if (!input.companyName || input.companyName.trim() === "") {
      return {
        success: false,
        error: "会社名は必須です",
      };
    }

    // メールアドレス形式チェック（入力がある場合のみ）
    if (input.email && input.email.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.email)) {
        return {
          success: false,
          error: "正しいメールアドレスを入力してください",
        };
      }
    }

    // 顧客作成
    const customer = await prisma.customer.create({
      data: {
        companyName: input.companyName.trim(),
        contactPerson: input.contactPerson?.trim() || null,
        phone: input.phone?.trim() || null,
        email: input.email?.trim() || null,
        address: input.address?.trim() || null,
        notes: input.notes?.trim() || null,
      },
      include: {
        serviceRecords: true,
        reminders: true,
      },
    });

    // IPC送信用にシリアライズ
    const serializedCustomer = serializeForIPC(customer);

    return {
      success: true,
      data: serializedCustomer,
    };
  } catch (error: any) {
    console.error("❌ 顧客作成エラー:", error);
    return {
      success: false,
      error: "顧客情報の登録に失敗しました",
    };
  }
}

// ================================
// 顧客更新
// ================================

/**
 * 顧客情報更新
 *
 * @param {UpdateCustomerInput} input - 更新データ（顧客ID、会社名、連絡先等）
 * @returns {Promise<DatabaseResult<any>>} 更新された顧客データ
 * @throws {Error} 顧客が存在しない場合、または会社名が空の場合
 */
export async function updateCustomer(
  input: UpdateCustomerInput,
): Promise<DatabaseResult<any>> {
  try {
    const prisma = await getPrisma();

    // 顧客存在確認
    const existingCustomer = await prisma.customer.findUnique({
      where: { customerId: input.customerId },
    });

    if (!existingCustomer) {
      return {
        success: false,
        error: "指定された顧客が見つかりません",
      };
    }

    // バリデーション
    if (input.companyName !== undefined && input.companyName.trim() === "") {
      return {
        success: false,
        error: "会社名は必須です",
      };
    }

    // メールアドレス形式チェック（更新がある場合のみ）
    if (input.email !== undefined && input.email.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.email)) {
        return {
          success: false,
          error: "正しいメールアドレスを入力してください",
        };
      }
    }

    // 更新データ構築
    const updateData: any = {};

    if (input.companyName !== undefined) {
      updateData.companyName = input.companyName.trim();
    }
    if (input.contactPerson !== undefined) {
      updateData.contactPerson = input.contactPerson.trim() || null;
    }
    if (input.phone !== undefined) {
      updateData.phone = input.phone.trim() || null;
    }
    if (input.email !== undefined) {
      updateData.email = input.email.trim() || null;
    }
    if (input.address !== undefined) {
      updateData.address = input.address.trim() || null;
    }
    if (input.notes !== undefined) {
      updateData.notes = input.notes.trim() || null;
    }

    // 顧客更新
    const customer = await prisma.customer.update({
      where: { customerId: input.customerId },
      data: updateData,
      include: {
        serviceRecords: true,
        reminders: true,
      },
    });

    // IPC送信用にシリアライズ
    const serializedCustomer = serializeForIPC(customer);

    return {
      success: true,
      data: serializedCustomer,
    };
  } catch (error: any) {
    console.error("❌ 顧客更新エラー:", error);
    return {
      success: false,
      error: "顧客情報の更新に失敗しました",
    };
  }
}

// ================================
// 顧客削���
// ================================

/**
 * 顧客削除（関連するサービス履歴・リマインダーも自動削除）
 *
 * @param {number} customerId - 顧客ID
 * @returns {Promise<DatabaseResult<void>>} 削除結果
 * @throws {Error} 顧客が存在しない場合、またはデータベースエラー時
 */
export async function deleteCustomer(
  customerId: number,
): Promise<DatabaseResult<void>> {
  try {
    const prisma = await getPrisma();

    // 顧客存在確認
    const existingCustomer = await prisma.customer.findUnique({
      where: { customerId },
      include: {
        serviceRecords: true,
        reminders: true,
      },
    });

    if (!existingCustomer) {
      return {
        success: false,
        error: "指定された顧客が見つかりません",
      };
    }

    // Cascadeで関連データも削除される（schema.prismaでonDelete: Cascade設定済み）
    await prisma.customer.delete({
      where: { customerId },
    });

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("❌ 顧客削除エラー:", error);
    return {
      success: false,
      error: "顧客情報の削除に失敗しました",
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
export async function disconnectPrismaCustomer(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
    console.log("✅ Prismaクライアント切断完了 (customerHandlers)");
  }
}
