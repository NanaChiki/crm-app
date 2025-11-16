/**
 * seedFeedback2.ts
 *
 * 【Feedback2用ダミーデータ生成スクリプト】
 *
 * 2021-2025年、各年10件ずつ顧客データを生成（計50件）。
 * 各顧客にサービス履歴を追加（屋根・外壁・雨樋の各種類）。
 * メンテナンス時期を迎えたサービス履歴も含める。
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * ダミーデータ生成
 */
async function seedFeedback2() {
  console.log('🌱 Feedback2用ダミーデータ生成を開始します...');

  try {
    // 既存データを削除（リレーションの順序に注意）
    console.log('🧹 既存データを削除中...');
    await prisma.reminder.deleteMany();
    await prisma.serviceRecord.deleteMany();
    await prisma.customer.deleteMany();
    console.log('✅ 既存データの削除が完了しました');
    // 年度別顧客データ生成（2021-2025年、各年10件）
    const years = [2021, 2022, 2023, 2024, 2025];
    // メンテナンス検出用に「屋根」「外壁」「雨樋」を含む種別を追加
    const serviceTypes = [
      '屋根工事',
      '屋根塗装',
      '屋根修理',
      '外壁補修',
      '外壁塗装',
      '雨樋交換',
      '雨樋修理',
      '雨樋工事',
    ];
    const companyNames = [
      '工務店',
      '建設',
      '工業',
      '建材',
      '建築',
      '住宅',
      '不動産',
      '設計',
      'リフォーム',
      '設備',
    ];

    let totalCustomers = 0;
    let totalServiceRecords = 0;

    for (const year of years) {
      console.log(`📅 ${year}年の顧客データを生成中...`);

      for (let i = 0; i < 10; i++) {
        // 顧客作成
        const customer = await prisma.customer.create({
          data: {
            companyName: `${companyNames[i]}${i + 1}号店`,
            contactPerson: `担当者${i + 1}`,
            phone: `090-${String(year).slice(-2)}${String(i + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
            email: `customer${year}${i + 1}@example.com`,
            address: `東京都${i + 1}区${i + 1}丁目${i + 1}-${i + 1}`,
            notes: `${year}年に登録されたテスト顧客${i + 1}`,
            createdAt: new Date(
              year,
              Math.floor(Math.random() * 12),
              Math.floor(Math.random() * 28) + 1
            ),
          },
        });

        totalCustomers++;

        // サービス履歴追加（各顧客に3-5件のサービス履歴を追加）
        const serviceCount = Math.floor(Math.random() * 3) + 3; // 3-5件

        for (let j = 0; j < serviceCount; j++) {
          // サービス日は顧客登録日からランダムに設定（過去15年以内）
          // メンテナンス時期を迎えたサービス履歴も生成するため、過去の日付も含める
          const serviceDate = new Date(customer.createdAt);
          const yearsAgo = Math.floor(Math.random() * 15); // 0-14年前
          serviceDate.setFullYear(serviceDate.getFullYear() - yearsAgo);
          serviceDate.setMonth(Math.floor(Math.random() * 12));
          serviceDate.setDate(Math.floor(Math.random() * 28) + 1);

          // サービス種別をランダムに選択
          const serviceType =
            serviceTypes[Math.floor(Math.random() * serviceTypes.length)];

          // 金額をランダムに設定（10万円〜100万円）
          const amount = Math.floor(Math.random() * 900000) + 100000;

          await prisma.serviceRecord.create({
            data: {
              customerId: customer.customerId,
              serviceDate,
              serviceType,
              serviceDescription: `${serviceType}の施工を行いました`,
              amount,
              status: 'completed',
              photoPath: null, // 写真は後で追加可能
            },
          });

          totalServiceRecords++;
        }
      }
    }

    console.log(`✅ ダミーデータ生成完了:`);
    console.log(`   - 顧客数: ${totalCustomers}件`);
    console.log(`   - サービス履歴数: ${totalServiceRecords}件`);
  } catch (error) {
    console.error('❌ ダミーデータ生成エラー:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプト実行
seedFeedback2()
  .then(() => {
    console.log('🎉 ダミーデータ生成が正常に完了しました');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ ダミーデータ生成に失敗しました:', error);
    process.exit(1);
  });
