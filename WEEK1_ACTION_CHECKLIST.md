# ✅ Week 1 実行チェックリスト

## 🎯 Week 1のゴール
1. ✅ 叔父の提案「年ごとの物件リスト」を実装
2. ✅ 叔父から「これにお金を払う」という言葉を引き出す
3. ✅ Twitterアカウント開設 + 最初の3投稿

---

## Day 1（今日 - 2025年11月5日）

### 🌅 朝（30分）

#### □ 叔父に電話・LINE（15分）

**目的:** 「年ごとの物件リスト」の詳細を確認

**質問リスト:**
```
1. 「年ごとの物件リスト」について：
   □ どんな画面・レイアウトをイメージしていますか？
   □ どのタイミングで見たいですか？（毎日？週1？月初？）
   □ これがあると、具体的にどんな作業が楽になりますか？
   □ 印刷して使いたいですか？それともアプリ内で見るだけ？

2. 現状の使い方について：
   □ 今、週に何回アプリを開いていますか？
   □ 一番よく使う機能はどれですか？
   □ 使いにくい・分かりにくい部分はありますか？
   □ 顧客データは何件くらい入力しましたか？

3. お金について（重要！）：
   □ もし「年ごとの物件リスト」機能が完璧に実装されたら、
      このアプリにお金を払いますか？
   □ いくらまでなら払いますか？
      - 買い切り5,000円？
      - 買い切り10,000円？
      - 買い切り30,000円？
      - 月額500円？
      - 月額1,000円？
      - 月額2,000円？
   □ 同業者の友人に勧めますか？
   □ 今すぐ紹介できる人は何人いますか？
```

**行動:**
- □ 叔父に電話・LINE送信
- □ 回答をメモ（このファイルの最後に記録）

---

#### □ 実装計画を立てる（15分）

叔父の回答を基に、実装すべき機能を定義：

**想定される実装:**
```
ページ名: 「年間メンテナンス予定」または「メンテナンスカレンダー」

URL: /maintenance-schedule または /yearly-plan

画面構成:
┌────────────────────────────────────┐
│ 年間メンテナンス予定               │
├────────────────────────────────────┤
│ [年選択] 2025年 ▼                  │
│ [工事種別] 全て ▼                  │
├────────────────────────────────────┤
│                                    │
│ 【2025年のメンテナンス予定: 15件】 │
│                                    │
│ ■ 屋根工事（10年サイクル）- 5件    │
│ ─────────────────────────────────│
│ 1. 〇〇工務店                      │
│    前回: 2015年10月               │
│    次回: 2025年10月（今年！）     │
│    緊急度: 🔴 高                  │
│    [顧客詳細を見る]               │
│                                    │
│ 2. △△商事                        │
│    前回: 2016年3月                │
│    次回: 2026年3月（来年）        │
│    緊急度: 🟡 中                  │
│    [顧客詳細を見る]               │
│                                    │
│ ■ 外壁塗装（10年サイクル）- 7件    │
│ ─────────────────────────────────│
│ （同様に表示）                     │
│                                    │
│ ■ 雨樋（7年サイクル）- 3件         │
│ ─────────────────────────────────│
│ （同様に表示）                     │
│                                    │
│ [CSVダウンロード] [印刷]          │
└────────────────────────────────────┘

必須機能:
✅ 年を選択（2025, 2026, 2027...）
✅ 工事種別でフィルタ（屋根、外壁、雨樋、全て）
✅ 顧客名・前回施工日・次回メンテ時期を表示
✅ 緊急度を色分け（高🔴、中🟡、低🟢）
✅ 顧客クリックで詳細画面へ遷移

あれば良い機能:
⭕ CSV出力
⭕ 印刷機能
⭕ 月別表示

後回し:
❌ カレンダーUIで表示
❌ 通知機能
```

**技術的な実装メモ:**
```typescript
// データ取得ロジック
1. 全顧客のサービス履歴を取得
2. 各サービスの次回メンテナンス時期を計算
   - 屋根: 施工日 + 10年
   - 外壁: 施工日 + 10年
   - 雨樋: 施工日 + 7年
3. 選択された年でフィルタ
4. 工事種別でグループ化
5. 緊急度で並び替え

// 緊急度の判定ロジック
- 高🔴: 今年中にメンテナンス時期
- 中🟡: 来年メンテナンス時期
- 低🟢: 2年以降
```

**行動:**
- □ 実装計画をメモ（上記を参考に）
- □ 必要なファイル・コンポーネントをリストアップ

---

### 🌞 昼（2-3時間）

#### □ 実装開始

**実装する場所:**
- □ 新しいページコンポーネント作成: `src/renderer/pages/MaintenanceSchedulePage.tsx`
- □ ナビゲーションメニューに追加: `src/renderer/components/Sidebar.tsx`
- □ データ取得・計算ロジック: `src/types/maintenanceSchedule.ts`

**Step 1: データ型定義（15分）**

`src/types/maintenanceSchedule.ts`:
```typescript
export interface MaintenanceScheduleItem {
  customerId: string;
  customerName: string;
  serviceType: string; // '屋根工事', '外壁塗装', '雨樋'
  lastServiceDate: Date;
  nextMaintenanceDate: Date;
  urgency: 'high' | 'medium' | 'low'; // 緊急度
  cycleYears: number; // 10 or 7
}

export interface MaintenanceScheduleByType {
  serviceType: string;
  items: MaintenanceScheduleItem[];
}
```

**Step 2: データ取得・計算ロジック（45分）**

`src/main/services/maintenanceScheduleService.ts`:
```typescript
import { ipcMain } from 'electron';
import { prisma } from '../database';

// メンテナンススケジュールを取得
ipcMain.handle('get-maintenance-schedule', async (event, year: number) => {
  // 1. 全顧客のサービス履歴を取得
  const customers = await prisma.customer.findMany({
    include: {
      serviceRecords: true,
    },
  });

  // 2. 各サービスの次回メンテナンス時期を計算
  const scheduleItems: MaintenanceScheduleItem[] = [];

  customers.forEach(customer => {
    customer.serviceRecords.forEach(record => {
      const cycleYears = getMaintenanceCycle(record.serviceType);
      const lastDate = new Date(record.serviceDate);
      const nextDate = new Date(lastDate);
      nextDate.setFullYear(lastDate.getFullYear() + cycleYears);

      // 選択された年でフィルタ
      if (nextDate.getFullYear() === year) {
        scheduleItems.push({
          customerId: customer.id,
          customerName: customer.companyName || customer.contactPerson,
          serviceType: record.serviceType,
          lastServiceDate: lastDate,
          nextMaintenanceDate: nextDate,
          urgency: calculateUrgency(nextDate),
          cycleYears,
        });
      }
    });
  });

  // 3. 工事種別でグループ化
  const groupedByType: { [key: string]: MaintenanceScheduleItem[] } = {};
  scheduleItems.forEach(item => {
    if (!groupedByType[item.serviceType]) {
      groupedByType[item.serviceType] = [];
    }
    groupedByType[item.serviceType].push(item);
  });

  return groupedByType;
});

// メンテナンスサイクルを取得
function getMaintenanceCycle(serviceType: string): number {
  const cycles: { [key: string]: number } = {
    '屋根工事': 10,
    '外壁塗装': 10,
    '雨樋': 7,
    '防水工事': 10,
    // ... 他の工事種別
  };
  return cycles[serviceType] || 10; // デフォルト10年
}

// 緊急度を計算
function calculateUrgency(nextDate: Date): 'high' | 'medium' | 'low' {
  const now = new Date();
  const monthsUntil = (nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);

  if (monthsUntil <= 12) return 'high'; // 1年以内
  if (monthsUntil <= 24) return 'medium'; // 2年以内
  return 'low'; // 2年以上先
}
```

**Step 3: UIコンポーネント作成（90分）**

`src/renderer/pages/MaintenanceSchedulePage.tsx`:
```typescript
import React, { useEffect, useState } from 'react';
import { Box, Typography, Select, MenuItem, Card, Chip } from '@mui/material';

export const MaintenanceSchedulePage: React.FC = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [schedule, setSchedule] = useState<any>({});

  useEffect(() => {
    loadSchedule();
  }, [year]);

  const loadSchedule = async () => {
    const data = await window.electron.invoke('get-maintenance-schedule', year);
    setSchedule(data);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        年間メンテナンス予定
      </Typography>

      {/* 年選択 */}
      <Select value={year} onChange={(e) => setYear(e.target.value as number)}>
        <MenuItem value={2024}>2024年</MenuItem>
        <MenuItem value={2025}>2025年</MenuItem>
        <MenuItem value={2026}>2026年</MenuItem>
        <MenuItem value={2027}>2027年</MenuItem>
      </Select>

      {/* メンテナンススケジュール表示 */}
      {Object.keys(schedule).map(serviceType => (
        <Box key={serviceType} sx={{ mt: 3 }}>
          <Typography variant="h6">
            ■ {serviceType} ({schedule[serviceType].length}件)
          </Typography>

          {schedule[serviceType].map((item: any, index: number) => (
            <Card key={index} sx={{ p: 2, mt: 2 }}>
              <Typography variant="h6">{item.customerName}</Typography>
              <Typography>
                前回: {new Date(item.lastServiceDate).toLocaleDateString('ja-JP')}
              </Typography>
              <Typography>
                次回: {new Date(item.nextMaintenanceDate).toLocaleDateString('ja-JP')}
              </Typography>
              <Chip
                label={item.urgency === 'high' ? '🔴 高' : item.urgency === 'medium' ? '🟡 中' : '🟢 低'}
                color={item.urgency === 'high' ? 'error' : item.urgency === 'medium' ? 'warning' : 'success'}
              />
            </Card>
          ))}
        </Box>
      ))}
    </Box>
  );
};
```

**Step 4: ナビゲーションメニューに追加（15分）**

`src/renderer/components/Sidebar.tsx`:
```typescript
// メニューアイテムに追加
<ListItem button onClick={() => navigate('/maintenance-schedule')}>
  <ListItemIcon>
    <CalendarIcon />
  </ListItemIcon>
  <ListItemText primary="年間メンテナンス予定" />
</ListItem>
```

**行動:**
- □ 上記のコードを実装
- □ ローカルで動作確認
- □ バグがあれば修正

---

### 🌙 夜（30分）

#### □ Twitterアカウント開設（30分）

**Step 1: アカウント作成（10分）**
- □ Twitter.com にアクセス
- □ アカウント作成
  - ユーザー名: `@MainteMate_CRM` または `@メンテメイト`
  - メールアドレス: crm.tool.construction@gmail.com
  - パスワード設定

**Step 2: プロフィール設定（15分）**
- □ プロフィール名: `メンテメイト | 建築業向け顧客管理アプリ`
- □ プロフィール文:
```
建築業専門の顧客管理アプリ「メンテメイト」開発者🛠
メンテナンス時期を自動予測して、年間通じた安定収入を実現📊
50代の経営者でも使いやすいシンプル設計💻
個人開発 | フィードバック募集中 | #建築業 #CRM
```
- □ プロフィール画像: アプリのロゴ or アイコン
- □ ヘッダー画像: アプリのスクリーンショット（メインダッシュボード）
- □ リンク: https://github.com/NanaChiki/crm-app

**Step 3: 最初のツイート（5分）**

**ツイート1: 自己紹介**
```
はじめまして！建築業向けの顧客管理アプリ「メンテメイト」を開発しています。

建築業の経営者の方々の悩み：
「既存顧客のメンテナンス時期を把握できない」
「季節変動で収入が不安定」

これを解決するアプリを作りました。
現在、フィードバックを募集中です🙏

#建築業 #CRM #個人開発
```

- □ ツイート投稿完了

---

## Day 2（2025年11月6日）

### 🌅 朝（30分）

#### □ Twitterルーティン（30分）
- □ ツイート2を投稿（問題提起）
```
建築業経営者の方に質問です。

「5年前に屋根工事をしたお客様」
すぐに思い出せますか？

メンテナンス時期を逃すと、
・お客様は他社に依頼
・機会損失が発生

過去の顧客情報、眠らせていませんか？

#建築業 #工務店 #リフォーム
```

- □ 建築業関連のアカウントを10-20人フォロー
  - プロフィールに「工務店」「建築業」「塗装業」がある人
- □ #建築業 #工務店 のツイートにリプライ（3-5件）

---

### 🌞 昼（2-3時間）

#### □ 実装継続
- □ Day 1の実装の続き
- □ バグ修正
- □ スタイリング調整
- □ 叔父のフィードバックを反映

---

### 🌙 夜（30分）

#### □ Twitterルーティン（30分）
- □ ツイート3を投稿（製品紹介）
```
【メンテメイト】でできること：

✅ 顧客情報を一元管理
✅ 施工履歴を記録
✅ メンテナンス時期を自動予測
  （屋根10年、外壁10年、雨樋7年）
✅ 「今年声をかけるべき顧客」が一目瞭然

現在、無料モニター募集中です。
ご興味ある方はDMください📩

#建築業CRM #顧客管理
```

- □ 建築業関連のアカウントを10-20人フォロー
- □ 関連ツイートにリプライ（3-5件）

---

## Day 3（2025年11月7日）

### 🌅 朝（30分）

#### □ Twitterルーティン（30分）
- □ 今日のツイートを投稿（開発状況共有）
```
【開発日記 Day 3】

ユーザーさんからの要望で
「年ごとの物件リスト」機能を実装中。

「今年メンテナンス時期を迎える顧客」が
一目でわかるようになります📊

実装前 vs 実装後の画面👇
[スクリーンショット添付]

#個人開発 #建築業CRM
```

- □ フォロー・リプライ活動（20分）

---

### 🌞 昼（1-2時間）

#### □ 実装完成 + テスト
- □ 最終的なバグ修正
- □ 叔父のデータで動作確認
- □ スクリーンショット撮影（Twitterで使う用）

---

### 🌙 夜（30分）

#### □ Twitterルーティン（30分）

---

## Day 4（2025年11月8日）

### 🌅 朝（1時間）

#### □ 叔父にデモ（45分）

**デモの流れ:**
1. □ 新機能「年間メンテナンス予定」を実際に見せる
2. □ 叔父の顧客データで動作確認
3. □ 「これであなたがイメージしていたものに近いですか？」

**デモ中に確認すること:**
- □ 画面のレイアウトは想定通りか？
- □ 表示される情報は十分か？
- □ 使いやすいか？
- □ 何か足りないものはないか？

#### □ 重要な質問（15分）

**絶対に聞くべき3つの質問:**

```
質問1: 価格について
□ 「この機能が完璧に動いたら、このアプリにお金を払いますか？」
□ 「いくらまでなら払いますか？」
  - 買い切り: 5,000円？10,000円？30,000円？
  - 月額: 500円？1,000円？2,000円？

質問2: 推薦について
□ 「同業者の友人にこのアプリを勧めますか？」
□ 「今すぐ紹介できる人は何人いますか？」
□ 「具体的に誰に紹介できそうですか？」

質問3: 不満について
□ 「今、何が一番不満ですか？使いにくい部分は？」
□ 「次に欲しい機能は何ですか？」
□ 「週に何回使っていますか？」
```

**行動:**
- □ 叔父に電話・対面でデモ
- □ 上記の質問をして、回答を記録（このファイルの最後に）

---

### 🌞 昼（30分）

#### □ 叔父の回答を分析（30分）

**判断1: お金を払うか？**
- 回答: ___________________
- 判断:
  - □ YES → 次は価格設定と有料化準備へ（Week 2のタスク）
  - □ NO/迷う → まだPMF未達成、さらなる改善が必要

**判断2: 推薦するか？**
- 回答: ___________________
- 判断:
  - □ YES → 紹介してもらう（Day 5のタスク）
  - □ NO → まだ「これがないと困る」レベルに達していない

**判断3: 次に何を作るべきか？**
- 回答: ___________________
- 判断: ___________________

**行動:**
- □ 上記の判断を記録
- □ 次のアクションを決定

---

### 🌙 夜（30分）

#### □ Twitterルーティン（30分）
- □ 今日のツイート投稿
```
【機能完成🎉】

「年間メンテナンス予定」機能、実装完了！

ユーザーさんに実際に使ってもらいました。
「これは便利！今年声をかける顧客が一目でわかる」
と好評でした✨

次はどんな機能を追加しようか🤔
ご意見募集中です！

#個人開発 #建築業CRM
```

- □ フォロー・リプライ活動

---

## Day 5-7（2025年11月9-11日）

### 毎日のルーティン

#### □ 朝（30分）
- □ Twitter投稿（1回）
- □ フォロー活動（10-20人）
- □ リプライ活動（5-10件）

#### □ 昼（1-2時間）
- Day 5: □ 叔父に紹介を依頼（もし判断2がYESなら）
- Day 6-7: □ 次の機能を実装 or ユーザー獲得活動

#### □ 夜（30分）
- □ Twitter活動（投稿・フォロー・リプライ）

---

## Week 1 終了時のチェックリスト

### 達成すべき指標

```
✅ 製品:
□ 「年ごとの物件リスト」機能を実装完了
□ 叔父に実際に使ってもらった
□ バグがない状態

✅ ユーザー:
□ 叔父から「お金を払う」という意思を確認
  （または「お金を払わない」理由を明確化）
□ 叔父が同業者に紹介すると言った
  （または紹介しない理由を明確化）

✅ Twitter:
□ アカウント開設完了
□ プロフィール設定完了
□ 7投稿完了
□ フォロワー 20-50人
□ 建築業関連アカウントと接点を作った
```

### 判断基準

```
【成功】
✅ 叔父が「お金を払う」と言った
✅ 叔父が「友人に勧める」と言った
✅ Twitter開設 + 最初の投稿完了
→ Week 2へ進む（叔父の紹介 + オンライン露出拡大）

【部分的成功】
⚠️ 叔父が「お金を払うかわからない」
⚠️ 叔父が「もう少し機能が欲しい」
→ Week 2でも製品改善継続 + 並行してユーザー獲得

【失敗】
❌ 叔父が「お金は払わない」
❌ 叔父が「友人に勧めない」
❌ 叔父が1週間以上使っていない
→ 根本的な製品改善が必要
→ または、ターゲット変更を検討
```

---

## 📝 記録エリア

### Day 1: 叔父へのインタビュー記録

**日時:** ___ 年 ___ 月 ___ 日 ___ 時 ___ 分

**質問1: 「年ごとの物件リスト」について**
- 回答: ___________________________________
- 回答: ___________________________________
- 回答: ___________________________________

**質問2: 現状の使い方について**
- 回答: ___________________________________
- 回答: ___________________________________
- 回答: ___________________________________

**質問3: お金について**
- 回答: ___________________________________
- 回答: ___________________________________
- 回答: ___________________________________

---

### Day 4: デモ後のインタビュー記録

**日時:** ___ 年 ___ 月 ___ 日 ___ 時 ___ 分

**新機能について:**
- 想定通りか: ___________________________________
- 改善点: ___________________________________

**質問1: 価格について**
- お金を払うか: ___________________________________
- いくらまで: ___________________________________

**質問2: 推薦について**
- 友人に勧めるか: ___________________________________
- 紹介できる人数: ___________________________________
- 具体的な名前: ___________________________________

**質問3: 不満について**
- 不満な点: ___________________________________
- 次に欲しい機能: ___________________________________
- 使用頻度: ___________________________________

---

### Week 1 振り返り

**日時:** ___ 年 ___ 月 ___ 日

**達成できたこと:**
- □ ___________________________________
- □ ___________________________________
- □ ___________________________________

**達成できなかったこと:**
- □ ___________________________________
- □ ___________________________________

**学んだこと:**
- ___________________________________
- ___________________________________

**Next Week（Week 2）でやること:**
1. ___________________________________
2. ___________________________________
3. ___________________________________

---

**頑張ってください！Week 1を完走すれば、$1K MRRへの道が見えてきます🚀**
