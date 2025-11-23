/**
 * 顧客データCSVインポート機能
 *
 * CSVファイルから顧客データを一括インポートします。
 * ジョブカンや他のソフトからエクスポートしたCSVに対応。
 *
 * @example
 * // 対応CSV形式（ヘッダー行必須）
 * // 会社名,担当者,電話番号,メールアドレス,住所,備考
 * // 山田工務店,山田太郎,03-1234-5678,yamada@example.com,東京都...,
 */

import { PrismaClient } from '@prisma/client';
import * as Papa from 'papaparse';
import * as fs from 'fs';

let prismaInstance: PrismaClient | null = null;

/**
 * Prismaクライアントのシングルトン取得
 */
function getPrisma(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
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
 * CSVインポート結果の型定義
 */
export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  message: string;
}

/**
 * CSVの行データ型（パース後）
 */
interface CSVRow {
  [key: string]: string;
}

/**
 * 顧客データ型（正規化後）
 */
interface CustomerData {
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

/**
 * CSVヘッダーのマッピング
 * 様々なCSV形式に対応するため、複数の候補を用意
 */
const HEADER_MAPPINGS: Record<keyof CustomerData, string[]> = {
  companyName: ['会社名', '顧客名', '取引先名', '名前', 'company', 'name'],
  contactPerson: ['担当者', '担当者名', '連絡先担当', 'contact', 'person'],
  phone: ['電話番号', '電話', 'TEL', 'tel', 'phone'],
  email: ['メールアドレス', 'メール', 'email', 'mail', 'Email'],
  address: ['住所', '所在地', 'address'],
  notes: ['備考', 'メモ', 'ノート', 'notes', 'memo'],
};

/**
 * CSVヘッダーを正規化されたフィールド名にマッピング
 */
function mapHeader(header: string): keyof CustomerData | null {
  const normalizedHeader = header.trim().toLowerCase();

  for (const [field, candidates] of Object.entries(HEADER_MAPPINGS)) {
    for (const candidate of candidates) {
      if (candidate.toLowerCase() === normalizedHeader) {
        return field as keyof CustomerData;
      }
    }
  }

  return null;
}

/**
 * CSV行を顧客データに変換
 */
function rowToCustomerData(row: CSVRow, headerMap: Map<string, keyof CustomerData>): CustomerData | null {
  const data: CustomerData = {
    companyName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  };

  for (const [csvHeader, value] of Object.entries(row)) {
    const field = headerMap.get(csvHeader);
    if (field && value) {
      data[field] = value.trim();
    }
  }

  // 会社名は必須
  if (!data.companyName) {
    return null;
  }

  return data;
}

/**
 * CSVファイルから顧客データをインポート
 *
 * @param filePath CSVファイルのパス
 * @returns インポート結果
 */
export async function importCustomersFromCSV(filePath: string): Promise<ImportResult> {
  const prisma = getPrisma();
  const errors: string[] = [];
  let imported = 0;
  let skipped = 0;

  try {
    // ファイル存在確認
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        imported: 0,
        skipped: 0,
        errors: ['ファイルが見つかりません'],
        message: 'ファイルが見つかりません',
      };
    }

    // CSVファイル読み込み（BOM対応）
    let csvContent = fs.readFileSync(filePath, 'utf-8');
    // BOM除去
    if (csvContent.charCodeAt(0) === 0xFEFF) {
      csvContent = csvContent.slice(1);
    }

    // CSVパース
    const parseResult = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
    }) as Papa.ParseResult<CSVRow>;

    if (parseResult.errors.length > 0) {
      const parseErrors = parseResult.errors.map(e => `行${e.row}: ${e.message}`);
      return {
        success: false,
        imported: 0,
        skipped: 0,
        errors: parseErrors,
        message: 'CSVの形式が正しくありません',
      };
    }

    const rows = parseResult.data;
    if (rows.length === 0) {
      return {
        success: false,
        imported: 0,
        skipped: 0,
        errors: ['データが空です'],
        message: 'インポートするデータがありません',
      };
    }

    // ヘッダーマッピング作成
    const headers = Object.keys(rows[0]);
    const headerMap = new Map<string, keyof CustomerData>();

    for (const header of headers) {
      const field = mapHeader(header);
      if (field) {
        headerMap.set(header, field);
      }
    }

    // 会社名のマッピングがあるか確認
    const hasCompanyName = Array.from(headerMap.values()).includes('companyName');
    if (!hasCompanyName) {
      return {
        success: false,
        imported: 0,
        skipped: 0,
        errors: ['会社名の列が見つかりません。「会社名」「顧客名」「取引先名」のいずれかの列が必要です。'],
        message: 'CSVの形式を確認してください',
      };
    }

    // 既存顧客の会社名リスト取得（重複チェック用）
    const existingCustomers = await prisma.customer.findMany({
      select: { companyName: true },
    });
    const existingNames = new Set(existingCustomers.map(c => c.companyName.toLowerCase()));

    // 各行を処理
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // ヘッダー行 + 0-index補正

      try {
        const customerData = rowToCustomerData(row, headerMap);

        if (!customerData) {
          errors.push(`行${rowNumber}: 会社名が空のためスキップしました`);
          skipped++;
          continue;
        }

        // 重複チェック
        if (existingNames.has(customerData.companyName.toLowerCase())) {
          errors.push(`行${rowNumber}: 「${customerData.companyName}」は既に登録されています`);
          skipped++;
          continue;
        }

        // データベースに挿入
        await prisma.customer.create({
          data: {
            companyName: customerData.companyName,
            contactPerson: customerData.contactPerson,
            phone: customerData.phone,
            email: customerData.email,
            address: customerData.address,
            notes: customerData.notes,
          },
        });

        // 重複チェック用リストに追加
        existingNames.add(customerData.companyName.toLowerCase());
        imported++;

      } catch (rowError) {
        const errorMessage = rowError instanceof Error ? rowError.message : '不明なエラー';
        errors.push(`行${rowNumber}: ${errorMessage}`);
        skipped++;
      }
    }

    // 結果メッセージ作成
    let message = `${imported}件の顧客データをインポートしました`;
    if (skipped > 0) {
      message += `（${skipped}件スキップ）`;
    }

    return {
      success: imported > 0,
      imported,
      skipped,
      errors: errors.slice(0, 10), // 最初の10件のエラーのみ返す
      message,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '不明なエラー';
    return {
      success: false,
      imported: 0,
      skipped: 0,
      errors: [errorMessage],
      message: 'インポート中にエラーが発生しました',
    };
  }
}

/**
 * Prismaクライアントの接続を閉じる
 */
export async function disconnectPrisma(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}