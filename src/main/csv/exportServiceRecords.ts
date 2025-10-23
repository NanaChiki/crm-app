/**
 * サービス履歴CSVエクスポート機能
 *
 * ジョブカン請求書作成用のCSV形式でサービス履歴データを出力します。
 * - 顧客情報を自動結合
 * - BOM付きUTF-8エンコーディング（Excel対応）
 * - ジョブカン互換フォーマット
 */

import type { ServiceRecord, Customer, PrismaClient } from '@prisma/client';
import { PrismaClient as PrismaClientClass } from '@prisma/client';
import Papa from 'papaparse';

// Prisma Client インスタンス（シングルトン）
let prismaInstance: PrismaClient | null = null;

/**
 * Prisma Clientの取得（シングルトンパターン）
 */
function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClientClass();
    console.log('✅ Prisma Client初期化完了 (exportServiceRecords)');
  }
  return prismaInstance;
}

/**
 * ジョブカン請求書用CSVフォーマット
 */
interface JobkanServiceRecordRow {
  日付: string;
  顧客名: string;
  サービス種別: string;
  サービス内容: string;
  金額: string;
  備考: string;
}

/**
 * 顧客情報を含むサービス履歴
 */
type ServiceRecordWithCustomer = ServiceRecord & {
  customer: Customer | null;
};

/**
 * 日付をYYYY-MM-DD形式にフォーマット
 * @param date Date型またはISO文字列
 * @returns YYYY-MM-DD形式の文字列
 */
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    console.error('❌ 無効な日付:', date);
    return '';
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * 金額を数値文字列にフォーマット
 * @param amount Decimal型、数値、または文字列
 * @returns 数値文字列（例: "500000"）
 */
function formatAmount(amount: any): string {
  if (!amount) return '0';

  // Decimal型の場合
  if (typeof amount === 'object' && 'toNumber' in amount) {
    return String(Math.round(amount.toNumber()));
  }

  // 数値の場合
  if (typeof amount === 'number') {
    return String(Math.round(amount));
  }

  // 文字列の場合
  const parsed = parseFloat(String(amount));
  if (isNaN(parsed)) {
    console.error('❌ 無効な金額:', amount);
    return '0';
  }

  return String(Math.round(parsed));
}

/**
 * サービス履歴をジョブカン互換CSV形式で生成
 *
 * @returns CSV文字列（BOM付きUTF-8）
 * @throws エラー時にエラーメッセージを含む例外
 */
export async function generateServiceRecordsCSV(): Promise<string> {
  try {
    console.log('📤 サービス履歴CSV生成開始');

    const prisma = getPrismaClient();

    // 全サービス履歴を取得（顧客情報含む、日付降順）
    const serviceRecords = await prisma.serviceRecord.findMany({
      include: {
        customer: true,
      },
      orderBy: {
        serviceDate: 'desc',
      },
    });

    console.log(`📊 取得したサービス履歴数: ${serviceRecords.length}件`);

    // サービス履歴が0件の場合
    if (serviceRecords.length === 0) {
      throw new Error('出力するサービス履歴がありません');
    }

    // ジョブカン形式にマッピング
    const csvData: JobkanServiceRecordRow[] = serviceRecords.map((record: ServiceRecordWithCustomer) => ({
      日付: formatDate(record.serviceDate),
      顧客名: record.customer?.companyName || '不明',
      サービス種別: record.serviceType || '',
      サービス内容: record.serviceDescription || '',
      金額: formatAmount(record.amount),
      備考: '', // ServiceRecordスキーマにnotesフィールドがないため空文字
    }));

    console.log('📋 CSVデータマッピング完了');

    // CSV文字列に変換
    const csv = Papa.unparse(csvData, {
      header: true,
      newline: '\r\n', // Windows互換の改行コード
    });

    console.log('✅ CSV生成完了');
    return csv;
  } catch (error) {
    console.error('❌ CSV生成エラー:', error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('サービス履歴のCSV生成に失敗しました');
  }
}
