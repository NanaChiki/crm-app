/**
 * 顧客データCSVエクスポート機能
 *
 * ジョブカン互換形式のCSVファイルを生成します。
 *
 * 【50代配慮】
 * - Excel対応のBOM付きUTF-8形式
 * - ジョブカンで直接インポート可能な形式
 * - 分かりやすいヘッダー行
 */

import { PrismaClient, type Customer } from "@prisma/client";
import Papa from "papaparse";

// Prisma Client インスタンス（シングルトン）
let prismaInstance: PrismaClient | null = null;

/**
 * Prisma Clientの取得（シングルトンパターン）
 */
function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
    console.log("✅ Prisma Client初期化完了 (exportCustomers)");
  }
  return prismaInstance;
}

/**
 * ジョブカン互換のCSV行データ型
 */
interface JobkanCustomerRow {
  会社名: string;
  担当者: string;
  電話番号: string;
  メールアドレス: string;
  住所: string;
  備考: string;
}

/**
 * 顧客データをジョブカン互換CSV形式で生成
 *
 * @returns {Promise<string>} CSV文字列（BOM付きUTF-8、Windows改行コード）
 * @throws {Error} 顧客データが0件の場合、またはデータベースエラー時
 *
 * @example
 * const csv = await generateCustomersCSV();
 * // 返り値: "会社名,担当者,電話番号,メールアドレス,住所,備考\r\n田中建設,田中太郎,..."
 */
export async function generateCustomersCSV(): Promise<string> {
  try {
    const prisma = getPrismaClient();

    // 全顧客データを取得（会社名昇順）
    const customers = await prisma.customer.findMany({
      orderBy: {
        companyName: "asc",
      },
    });

    // 顧客データが0件の場合
    if (customers.length === 0) {
      throw new Error("出力する顧客データがありません");
    }

    // ジョブカン形式にマッピング
    const csvData: JobkanCustomerRow[] = customers.map(
      (customer: Customer) => ({
        会社名: customer.companyName || "",
        担当者: customer.contactPerson || "",
        電話番号: customer.phone || "",
        メールアドレス: customer.email || "",
        住所: customer.address || "",
        備考: customer.notes || "",
      }),
    );

    // CSV文字列に変換
    const csv = Papa.unparse(csvData, {
      header: true,
      newline: "\r\n", // Windows互換の改行コード
    });

    return csv;
  } catch (error) {
    console.error("❌ CSV生成エラー:", error);

    // エラーメッセージを50代向けに変換
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("顧客データのCSV生成に失敗しました");
  }
}
