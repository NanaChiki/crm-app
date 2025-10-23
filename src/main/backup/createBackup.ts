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
 * バックアップを作成
 * @param outputPath 出力先パス
 */
export async function createBackup(outputPath: string): Promise<void> {
  const tempDir = path.join(require("os").tmpdir(), "crm-backup-" + Date.now());

  try {
    console.log("📤 バックアップ作成開始");
    console.log("一時ディレクトリ:", tempDir);

    // 一時ディレクトリ作成
    await fs.mkdir(tempDir, { recursive: true });

    const prisma = getPrismaClient();

    // 1. 全データを取得
    console.log("📊 データベースからデータ取得中...");
    const customers = await prisma.customer.findMany();
    const serviceRecords = await prisma.serviceRecord.findMany();
    const reminders = await prisma.reminder.findMany();

    console.log(`顧客: ${customers.length}件`);
    console.log(`サービス履歴: ${serviceRecords.length}件`);
    console.log(`リマインダー: ${reminders.length}件`);

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
    console.log("✅ data.json作成完了");

    // 3. データベースファイルをコピー
    const dbPath = path.join(process.cwd(), "src", "database", "dev.db");
    const dbExists = await fs
      .access(dbPath)
      .then(() => true)
      .catch(() => false);

    if (dbExists) {
      await fs.copyFile(dbPath, path.join(tempDir, "database.db"));
      console.log("✅ database.db コピー完了");
    } else {
      console.log("⚠️ database.db が見つかりません:", dbPath);
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
    console.log("✅ backup-info.json作成完了");

    // 5. ZIPファイルに圧縮
    console.log("🗜️ ZIPファイル作成中...");
    await createZipFile(tempDir, outputPath);
    console.log("✅ ZIPファイル作成完了:", outputPath);

    // 6. 一時ディレクトリを削除
    await fs.rm(tempDir, { recursive: true, force: true });
    console.log("✅ 一時ディレクトリ削除完了");
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
 * ZIPファイルを作成
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
      console.log(`📦 バックアップサイズ: ${archive.pointer()} bytes`);
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
