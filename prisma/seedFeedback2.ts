/**
 * seedFeedback2.ts
 *
 * 【Feedback2用ダミーデータ生成スクリプト】
 *
 * 本番環境を想定したダミーデータ生成:
 * - 2021-2025年、各年10件ずつ顧客データを生成（計50件）
 * - 同じ顧客名の場合は既存のcustomerIdを使用（異なる年度でも同じ顧客として扱う）
 * - 年度ごとに同じ顧客や新しい顧客がランダムに割り振られる
 * - 各顧客にサービス履歴を追加（屋根・外壁・雨樋の各種類）
 * - メンテナンス時期を迎えたサービス履歴も含める
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
      '塗装',
      '板金',
      '防水',
      '外構',
      '内装',
      '電気',
      '水道',
      '空調',
      'ガス',
      '清掃',
    ];

    // 顧客名 → customerId のマッピング（既存顧客の再利用用）
    const customerNameToIdMap = new Map<string, number>();

    // 年度別顧客データ生成（2021-2025年、各年20-30件）
    // 本番を想定: 240件以上の顧客が毎月追加される想定
    const years = [2021, 2022, 2023, 2024, 2025];
    let totalCustomers = 0;
    let totalServiceRecords = 0;

    for (const year of years) {
      // 各年度で20-30件の顧客を生成（本番環境を想定）
      const customersPerYear = Math.floor(Math.random() * 11) + 20; // 20-30件
      console.log(
        `📅 ${year}年の顧客データを生成中... (${customersPerYear}件)`
      );

      // 本番を想定: 既存顧客（40-60%）と新規顧客（40-60%）がランダムに混在
      const existingCustomerRatio = 0.4 + Math.random() * 0.2; // 40-60%
      const existingCustomerCount = Math.floor(
        customersPerYear * existingCustomerRatio
      );
      const newCustomerCount = customersPerYear - existingCustomerCount;

      // 既存顧客の再利用
      const existingCustomerNames = Array.from(customerNameToIdMap.keys());
      if (existingCustomerNames.length > 0 && existingCustomerCount > 0) {
        // 既存顧客からランダムに選択
        const shuffledExisting = [...existingCustomerNames].sort(
          () => Math.random() - 0.5
        );
        const selectedExisting = shuffledExisting.slice(
          0,
          existingCustomerCount
        );

        for (const companyName of selectedExisting) {
          const customerId = customerNameToIdMap.get(companyName)!;
          console.log(
            `  ✅ 既存顧客を再利用: ${companyName} (customerId: ${customerId})`
          );

          // 既存顧客の情報を更新（最新の年度の情報に更新）
          await prisma.customer.update({
            where: { customerId },
            data: {
              updatedAt: new Date(
                year,
                Math.floor(Math.random() * 12),
                Math.floor(Math.random() * 28) + 1
              ),
            },
          });

          // サービス履歴追加（既存顧客にも新しいサービス履歴を追加）
          const serviceCount = Math.floor(Math.random() * 3) + 2; // 2-4件
          for (let j = 0; j < serviceCount; j++) {
            const baseDate = new Date(
              year,
              Math.floor(Math.random() * 12),
              Math.floor(Math.random() * 28) + 1
            );
            const yearsAgo = Math.floor(Math.random() * 5); // 0-4年前
            const serviceDate = new Date(baseDate);
            serviceDate.setFullYear(serviceDate.getFullYear() - yearsAgo);

            const serviceType =
              serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
            const amount = Math.floor(Math.random() * 900000) + 100000;

            await prisma.serviceRecord.create({
              data: {
                customerId,
                serviceDate,
                serviceType,
                serviceDescription: `${serviceType}の施工を行いました`,
                amount,
                status: 'completed',
                photoPath: null,
              },
            });

            totalServiceRecords++;
          }
        }
      }

      // 新規顧客の作成
      for (let idx = 0; idx < newCustomerCount; idx++) {
        // ランダムな顧客名を生成
        let companyName: string;
        let retryCount = 0;
        do {
          const companyNameIndex = Math.floor(
            Math.random() * companyNames.length
          );
          const customerNumber = Math.floor(Math.random() * 100) + 1; // 1-100
          companyName = `${companyNames[companyNameIndex]}${customerNumber}号店`;
          retryCount++;
          if (retryCount > 100) {
            // 無限ループ防止
            companyName = `${companyNames[0]}${totalCustomers + idx + 1}号店`;
            break;
          }
        } while (customerNameToIdMap.has(companyName));

        // 新規顧客を作成
        const customer = await prisma.customer.create({
          data: {
            companyName,
            contactPerson: `担当者${idx + 1}`,
            phone: `090-${String(year).slice(-2)}${String(idx + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
            email: `customer${year}${idx + 1}@example.com`,
            address: `東京都${Math.floor(Math.random() * 23) + 1}区${idx + 1}丁目${idx + 1}-${idx + 1}`,
            notes: `${year}年に登録されたテスト顧客${idx + 1}`,
            createdAt: new Date(
              year,
              Math.floor(Math.random() * 12),
              Math.floor(Math.random() * 28) + 1
            ),
          },
        });

        const customerId = customer.customerId;
        customerNameToIdMap.set(companyName, customerId);
        totalCustomers++;
        console.log(
          `  🆕 新規顧客を作成: ${companyName} (customerId: ${customerId})`
        );

        // サービス履歴追加（各顧客に3-5件のサービス履歴を追加）
        // 本番を想定: 同じ月に複数のサービスが発生する可能性がある
        const serviceCount = Math.floor(Math.random() * 3) + 3; // 3-5件

        for (let j = 0; j < serviceCount; j++) {
          // サービス日は顧客登録日からランダムに設定（過去15年以内）
          // メンテナンス時期を迎えたサービス履歴も生成するため、過去の日付も含める
          const baseDate = new Date(
            year,
            Math.floor(Math.random() * 12),
            Math.floor(Math.random() * 28) + 1
          );
          const yearsAgo = Math.floor(Math.random() * 15); // 0-14年前
          const serviceDate = new Date(baseDate);
          serviceDate.setFullYear(serviceDate.getFullYear() - yearsAgo);

          // サービス種別をランダムに選択
          const serviceType =
            serviceTypes[Math.floor(Math.random() * serviceTypes.length)];

          // 金額をランダムに設定（10万円〜100万円）
          const amount = Math.floor(Math.random() * 900000) + 100000;

          await prisma.serviceRecord.create({
            data: {
              customerId,
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
    console.log(`   - 顧客数: ${totalCustomers}件（既存顧客の再利用を含む）`);
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
