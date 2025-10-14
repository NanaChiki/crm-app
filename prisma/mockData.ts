/**
 * mockData.ts
 *
 * Phase 1のモックデータを保存
 * データベースシードに使用
 */

export const mockCustomersData = [
  {
    customerId: 1,
    companyName: '佐藤リフォーム',
    contactPerson: '佐藤次郎',
    phone: '080-9999-8888',
    email: 'sato@sato-reform.jp',
    address: '東京都練馬区石神井公園3-7-9',
    notes: 'リフォーム専門。お客様の要望を丁寧にヒアリングしてくれる。',
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-08-22'),
  },
  {
    customerId: 2,
    companyName: '田中建設株式会社',
    contactPerson: '田中太郎',
    phone: '090-1234-5678',
    email: 'tanaka@tanaka-kensetsu.co.jp',
    address: '東京都世田谷区桜丘1-2-3',
    notes: '定期メンテナンス契約あり。年2回の点検実施。',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-08-20'),
  },
  {
    customerId: 3,
    companyName: '山田工務店',
    contactPerson: '山田花子',
    phone: '03-5555-1234',
    email: 'info@yamada-koumuten.com',
    address: '東京都杉並区高円寺南2-4-5',
    notes: '新築工事専門。品質重視のお客様。',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-08-18'),
  },
];

// サービス履歴のモックデータ（useServiceRecords.tsから移行予定）
export const mockServiceRecordsData = [
  {
    recordId: 1,
    customerId: 2, // 田中建設
    serviceDate: new Date('2024-03-10'),
    serviceType: '水回りリフォーム',
    serviceDescription: 'キッチン・�ービス台改修工事',
    amount: 350000,
    status: 'completed',
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-03-10'),
  },
  {
    recordId: 2,
    customerId: 2, // 田中建設
    serviceDate: new Date('2024-08-20'),
    serviceType: '外壁塗装',
    serviceDescription: '外壁全面塗装・防水工事',
    amount: 1200000,
    status: 'completed',
    createdAt: new Date('2024-08-20'),
    updatedAt: new Date('2024-08-20'),
  },
  {
    recordId: 3,
    customerId: 1, // 佐藤リフォーム
    serviceDate: new Date('2024-06-15'),
    serviceType: '屋根修理',
    serviceDescription: '瓦の交換・雨漏り補修',
    amount: 450000,
    status: 'completed',
    createdAt: new Date('2024-06-15'),
    updatedAt: new Date('2024-06-15'),
  },
];
