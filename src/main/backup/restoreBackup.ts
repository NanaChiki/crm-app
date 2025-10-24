import {
  PrismaClient,
  type Customer,
  type Reminder,
  type ServiceRecord,
} from "@prisma/client";
import extract from "extract-zip";
import fs from "fs/promises";
import path from "path";

// Prisma Client singleton
let prismaInstance: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
    console.log("✅ Prisma Client初期化完了 (restoreBackup)");
  }
  return prismaInstance;
}

interface BackupData {
  customers: Customer[];
  serviceRecords: ServiceRecord[];
  reminders: Reminder[];
}

interface BackupInfo {
  version: string;
  createdAt: string;
  customerCount: number;
  serviceRecordCount: number;
  reminderCount: number;
}

/**
 * バックアップから復元（既存データを削除して、バックアップデータを復元）
 *
 * @param {string} backupFilePath - バックアップZIPファイルのパス
 * @returns {Promise<void>}
 * @throws {Error} ZIPファイルが不正、データベースエラー、またはトランザクション失敗時
 *
 * @example
 * await restoreBackup('/Users/name/Desktop/CRMバックアップ_2024-10-23.zip');
 */
export async function restoreBackup(backupFilePath: string): Promise<void> {
  const tempDir = path.join(
    require("os").tmpdir(),
    "crm-restore-" + Date.now(),
  );

  try {
    // 1. ZIPファイルを解凍
    await extract(backupFilePath, { dir: tempDir });

    // 2. backup-info.json で整合性チェック
    const backupInfoPath = path.join(tempDir, "backup-info.json");
    const backupInfoExists = await fs
      .access(backupInfoPath)
      .then(() => true)
      .catch(() => false);

    if (!backupInfoExists) {
      throw new Error(
        "バックアップファイルが不正です（backup-info.jsonが見つかりません）",
      );
    }

    const backupInfoContent = await fs.readFile(backupInfoPath, "utf-8");
    const backupInfo: BackupInfo = JSON.parse(backupInfoContent);

    // 3. data.json を読み込み
    const dataPath = path.join(tempDir, "data.json");
    const dataExists = await fs
      .access(dataPath)
      .then(() => true)
      .catch(() => false);

    if (!dataExists) {
      throw new Error(
        "バックアップファイルが不正です（data.jsonが見つかりません）",
      );
    }

    const dataContent = await fs.readFile(dataPath, "utf-8");
    const data: BackupData = JSON.parse(dataContent);

    // 4. トランザクションで既存データを削除してバックアップデータを投入
    const prisma = getPrismaClient();

    await prisma.$transaction(async (tx) => {
      // 既存データ削除（リレーションの順序に注意）
      await tx.reminder.deleteMany({});
      await tx.serviceRecord.deleteMany({});
      await tx.customer.deleteMany({});

      // バックアップデータ投入
      if (data.customers && data.customers.length > 0) {
        await tx.customer.createMany({
          data: data.customers,
        });
      }

      if (data.serviceRecords && data.serviceRecords.length > 0) {
        await tx.serviceRecord.createMany({
          data: data.serviceRecords,
        });
      }

      if (data.reminders && data.reminders.length > 0) {
        await tx.reminder.createMany({
          data: data.reminders,
        });
      }
    });

    // 5. 一時ディレクトリを削除
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch (error) {
    console.error("❌ 復元エラー:", error);

    // エラー時は一時ディレクトリをクリーンアップ
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error("❌ クリーンアップエラー:", cleanupError);
    }
    throw error;
  }
}
