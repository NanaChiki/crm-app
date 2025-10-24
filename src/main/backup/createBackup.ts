import archiver from "archiver";
import fs from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";

// Prisma Client singleton
let prismaInstance: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
    console.log("✅ Prisma Client初期化完了 (createBackup)");
  }
  return prismaInstance;
}

/**
 * バックアップを作成（全データをJSON形式とデータベースファイルでZIP圧縮）
 *
 * @param {string} outputPath - 出力先パス（ZIPファイルの保存先）
 * @returns {Promise<void>}
 * @throws {Error} データベース接続エラー、またはファイル書き込みエラー時
 *
 * @example
 * await createBackup('/Users/name/Desktop/CRMバックアップ_2024-10-23.zip');
 */
export async function createBackup(outputPath: string): Promise<void> {
  const tempDir = path.join(require("os").tmpdir(), "crm-backup-" + Date.now());

  try {
    // 一時ディレクトリ作成
    await fs.mkdir(tempDir, { recursive: true });

    const prisma = getPrismaClient();

    // 1. 全データを取得
    const customers = await prisma.customer.findMany();
    const serviceRecords = await prisma.serviceRecord.findMany();
    const reminders = await prisma.reminder.findMany();

    // 2. JSON形式で保存
    const data = {
      customers,
      serviceRecords,
      reminders,
    };

    await fs.writeFile(
      path.join(tempDir, "data.json"),
      JSON.stringify(data, null, 2),
      "utf-8",
    );

    // 3. データベースファイルをコピー
    const dbPath = path.join(process.cwd(), "src", "database", "dev.db");
    const dbExists = await fs
      .access(dbPath)
      .then(() => true)
      .catch(() => false);

    if (dbExists) {
      await fs.copyFile(dbPath, path.join(tempDir, "database.db"));
    }

    // 4. バックアップ情報を作成
    const backupInfo = {
      version: "1.0.0",
      createdAt: new Date().toISOString(),
      customerCount: customers.length,
      serviceRecordCount: serviceRecords.length,
      reminderCount: reminders.length,
    };

    await fs.writeFile(
      path.join(tempDir, "backup-info.json"),
      JSON.stringify(backupInfo, null, 2),
      "utf-8",
    );

    // 5. ZIPファイルに圧縮
    await createZipFile(tempDir, outputPath);

    // 6. 一時ディレクトリを削除
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch (error) {
    console.error("❌ バックアップ作成エラー:", error);

    // エラー時は一時ディレクトリをクリーンアップ
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error("❌ クリーンアップエラー:", cleanupError);
    }
    throw error;
  }
}

/**
 * ZIPファイルを作成（最高圧縮レベル9）
 *
 * @param {string} sourceDir - 圧縮元ディレクトリ
 * @param {string} outputPath - 出力先パス
 * @returns {Promise<void>}
 * @throws {Error} ZIP作成エラー時
 */
async function createZipFile(
  sourceDir: string,
  outputPath: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = require("fs").createWriteStream(outputPath);
    const archive = archiver("zip", {
      zlib: { level: 9 }, // 最高圧縮
    });

    output.on("close", () => {
      resolve();
    });

    archive.on("error", (err) => {
      console.error("❌ ZIP作成エラー:", err);
      reject(err);
    });

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}
