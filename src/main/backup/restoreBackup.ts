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
    prismaInstance = new PrismaClient();
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
 * バックアップから復元
 * @param backupFilePath バックアップZIPファイルのパス
 */
export async function restoreBackup(backupFilePath: string): Promise<void> {
  const tempDir = path.join(
    require("os").tmpdir(),
    "crm-restore-" + Date.now(),
  );

  try {
    console.log("🔄 バックアップ復元開始");
    console.log("バックアップファイル:", backupFilePath);
    console.log("一時ディレクトリ:", tempDir);

    // 1. ZIPファイルを解凍
    console.log("📂 ZIPファイル解凍中...");
    await extract(backupFilePath, { dir: tempDir });
    console.log("✅ 解凍完了");

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
    console.log("📋 バックアップ情報:", backupInfo);

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

    console.log(`顧客データ: ${data.customers?.length || 0}件`);
    console.log(`サービス履歴: ${data.serviceRecords?.length || 0}件`);
    console.log(`リマインダー: ${data.reminders?.length || 0}件`);

    // 4. トランザクションで既存データを削除してバックアップデータを投入
    console.log("💾 データベース復元中...");
    const prisma = getPrismaClient();

    await prisma.$transaction(async (tx) => {
      // 既存データ削除（リレーションの順序に注意）
      console.log("🗑️ 既存データ削除中...");
      await tx.reminder.deleteMany({});
      await tx.serviceRecord.deleteMany({});
      await tx.customer.deleteMany({});
      console.log("✅ 既存データ削除完了");

      // バックアップデータ投入
      console.log("📥 バックアップデータ投入中...");

      if (data.customers && data.customers.length > 0) {
        await tx.customer.createMany({
          data: data.customers,
        });
        console.log(`✅ 顧客データ ${data.customers.length}件 復元完了`);
      }

      if (data.serviceRecords && data.serviceRecords.length > 0) {
        await tx.serviceRecord.createMany({
          data: data.serviceRecords,
        });
        console.log(`✅ サービス履歴 ${data.serviceRecords.length}件 復元完了`);
      }

      if (data.reminders && data.reminders.length > 0) {
        await tx.reminder.createMany({
          data: data.reminders,
        });
        console.log(`✅ リマインダー ${data.reminders.length}件 復元完了`);
      }
    });

    console.log("✅ データベース復元完了");

    // 5. 一時ディレクトリを削除
    await fs.rm(tempDir, { recursive: true, force: true });
    console.log("✅ 一時ディレクトリ削除完了");
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
