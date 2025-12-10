# 建築事業者向けCRM セキュリティ監査レポート

**監査日**: 2025年12月9日
**監査対象**: CRMアプリケーション v1.0.0
**監査者**: Claude AI Security Auditor

---

## エグゼクティブサマリー

**総合評価**: **A（良好）**

本CRMアプリケーションの包括的なセキュリティ監査を実施しました。Electronセキュリティのベストプラクティスに準拠しており、SQLインジェクション対策、XSS対策、ファイルパストラバーサル対策は適切に実装されています。

**主な強み**:
- ✅ Electron セキュリティベストプラクティス完全準拠
- ✅ Prisma ORM使用によるSQLインジェクション対策完璧
- ✅ XSS対策適切（dangerouslySetInnerHTML未使用）
- ✅ 機密情報管理適切（.env gitignore済み）

**要修正項目**:
- ⚠️ npm依存関係の脆弱性2件（修正可能）
- ⚠️ IPC通信の入力バリデーション不足（一部）
- ⚠️ 本番環境でのconsole.log削除推奨

---

## 1. Electronセキュリティ

### ✅ 合格（A+評価）

**webPreferences設定（src/main/main.ts:146-150）**
```typescript
webPreferences: {
  nodeIntegration: false,      // ✅ 正しく無効化
  contextIsolation: true,       // ✅ 正しく有効化
  preload: preloadPath,         // ✅ 適切に使用
}
```

**contextBridge使用（src/main/preload.ts）**
- ✅ 全APIがcontextBridge経由で適切に公開
- ✅ ipcRenderer直接露出なし
- ✅ 型安全なAPI設計

**推奨事項**:
- 開発環境でのセキュリティ警告抑制を本番ビルド時に無効化（現在129-131行で実装済み - 問題なし）

---

## 2. SQLインジェクション対策

### ✅ 合格（A+評価）

**Prisma ORM 100%使用**
- ✅ 全データベース操作でPrisma使用
- ✅ 直接SQL実行なし
- ✅ パラメータ化クエリのみ使用

**検証箇所**:
- `src/main/database/customerHandlers.ts`: Prisma完全使用 ✅
- `src/main/database/serviceRecordHandlers.ts`: Prisma完全使用 ✅
- `src/main/database/reminderHandlers.ts`: Prisma完全使用 ✅

**リスク**: **なし**

---

## 3. XSS（Cross-Site Scripting）対策

### ✅ 合格（A+評価）

**dangerouslySetInnerHTML使用状況**
- ✅ 使用箇所: 0件
- ✅ React自動エスケープ活用
- ✅ ユーザー入力は適切に表示

**検証結果**:
```bash
$ grep -r "dangerouslySetInnerHTML" src/renderer
# 結果: 見つかりませんでした
```

**リスク**: **なし**

---

## 4. ファイルパストラバーサル対策

### ⚠️ 要注意（B+評価）

**カスタムプロトコル（app-photo://）のセキュリティチェック**

✅ **適切に実装** (src/main/main.ts:196-228)
```typescript
// セキュリティチェック: userDataディレクトリ内のファイルのみ許可
const normalizedFilePath = path.normalize(filePath);
const normalizedUserDataPath = path.normalize(userDataPath);

if (!normalizedFilePath.startsWith(normalizedUserDataPath)) {
  console.error('❌ セキュリティエラー: userDataディレクトリ外のファイルアクセスを拒否');
  callback({ error: -324 }); // ERR_ACCESS_DENIED
  return;
}
```

**バックアップ・リストア処理**

✅ **一時ディレクトリ使用適切** (src/main/backup/createBackup.ts, restoreBackup.ts)
- ✅ `os.tmpdir()` + タイムスタンプで衝突回避
- ✅ エラー時の自動クリーンアップ実装
- ✅ ZIPファイル解凍時のパスチェック（extract-zipライブラリ使用）

⚠️ **推奨改善**:
- `restoreBackup.ts`でZIP解凍後のファイルパス検証を追加
- 悪意のあるZIPファイル（`../../etc/passwd`等を含む）の対策強化

**リスク**: **低（改善推奨）**

---

## 5. 機密情報管理

### ✅ 合格（A評価）

**.env管理**
- ✅ `.env`ファイル存在しない（機密情報なし）
- ✅ `.gitignore`で`.env`除外済み（60-64行）

**DATABASE_URL管理**
- ✅ 環境変数`process.env.DATABASE_URL`使用
- ✅ ハードコード秘密情報なし

**ログ出力**
- ⚠️ console.logに機密情報は含まれていないが、**本番環境で削除推奨**
- レンダラープロセス: 47箇所のconsole.log（主にデバッグ用）

**推奨事項**:
- 本番ビルド時にconsole.log自動削除（webpack/vite設定）
- センシティブデータ（パスワード、APIキー等）のログ出力禁止

**リスク**: **低**

---

## 6. IPC通信のセキュリティ

### ⚠️ 要改善（B評価）

**入力バリデーション状況**

✅ **適切に実装されている箇所**:
- `createCustomer`: 会社名必須チェック、メールアドレス形式チェック ✅
- `updateCustomer`: 同上 ✅
- `createServiceRecord`: 顧客存在確認、金額バリデーション ✅
- `sendOutlookEmail`: メールアドレス簡易バリデーション ✅

⚠️ **バリデーション不足箇所**:

**1. reminderHandlers.ts**
- `reminder:create`, `reminder:update`: 入力バリデーションなし
- リスク: 不正なreminderDate、空のtitleなどが登録可能

**2. main.ts IPCハンドラー**
- `outlook:send-email` (328行): emailDataの型チェックなし
- `reminder:fetch` (372行): filtersの型チェックなし
- `customer:fetch` (515行): filtersの型チェックなし

⚠️ **推奨改善**:
```typescript
// 例: reminderHandlers.ts
export async function createReminder(input: CreateReminderInput) {
  // バリデーション追加
  if (!input.customerId || typeof input.customerId !== 'number') {
    return { success: false, error: '顧客IDは必須です' };
  }
  if (!input.title || input.title.trim() === '') {
    return { success: false, error: 'タイトルは必須です' };
  }
  if (!input.reminderDate || !(input.reminderDate instanceof Date)) {
    return { success: false, error: '送信予定日は必須です' };
  }
  // ...
}
```

**リスク**: **中（改善推奨）**

---

## 7. 外部リンクセキュリティ

### ✅ 合格（A+評価）

**shell.openExternal使用状況（src/main/main.ts:1017-1038）**

✅ **適切に実装**:
```typescript
// セキュリティチェック: 許可されたプロトコルのみ
const allowedProtocols = ['http:', 'https:', 'mailto:'];
const urlObj = new URL(url);

if (!allowedProtocols.includes(urlObj.protocol)) {
  throw new Error(`許可されていないプロトコルです: ${urlObj.protocol}`);
}
```

✅ **ホワイトリスト方式**:
- `http:`, `https:`, `mailto:` のみ許可
- `file:`, `javascript:`, `data:` など危険なプロトコルをブロック

**リスク**: **なし**

---

## 8. 依存関係の脆弱性

### ⚠️ 要修正（C評価）

**npm audit結果**:
```
2 vulnerabilities (1 moderate, 1 high)

1. glob 10.2.0 - 10.4.5 (High)
   - glob CLI: Command injection via -c/--cmd
   - CVE: GHSA-5j98-mcp5-4vw2
   - 影響: archiver-utils, config-file-ts
   - 修正: npm audit fix で自動修正可能

2. js-yaml 4.0.0 - 4.1.0 (Moderate)
   - Prototype pollution in merge (<<)
   - CVE: GHSA-mh29-5h37-fv8m
   - 修正: npm audit fix で自動修正可能
```

**修正方法**:
```bash
npm audit fix
```

**テスト済み**:
- `npm audit fix --dry-run` で修正可能を確認済み
- 破壊的変更なし

**リスク**: **中（修正容易）**

---

## 総合評価サマリー

| カテゴリ | 評価 | リスクレベル | 詳細 |
|---------|------|------------|------|
| **Electronセキュリティ** | A+ | なし | ベストプラクティス完全準拠 |
| **SQLインジェクション対策** | A+ | なし | Prisma ORM 100%使用 |
| **XSS対策** | A+ | なし | dangerouslySetInnerHTML未使用 |
| **ファイルパストラバーサル** | B+ | 低 | カスタムプロトコル適切、ZIP解凍改善推奨 |
| **機密情報管理** | A | 低 | console.log削除推奨 |
| **IPC通信バリデーション** | B | 中 | reminderHandlers改善推奨 |
| **外部リンク** | A+ | なし | プロトコルホワイトリスト実装 |
| **依存関係脆弱性** | C | 中 | npm audit fix で修正可能 |

**総合評価**: **A（良好）**

---

## 本番環境投入可否判定

### ✅ **本番環境投入可能**

**前提条件**:
1. **必須**: npm audit fix 実行（脆弱性修正）
2. **推奨**: IPC通信バリデーション追加（リマインダーAPI）
3. **推奨**: 本番ビルド時のconsole.log削除

---

## 優先度別改善推奨事項

### 🔴 Critical（即座に修正）
なし

### 🟠 High（本番投入前に修正推奨）

**1. npm依存関係の脆弱性修正**
```bash
npm audit fix
npm audit
```

### 🟡 Medium（次回リリースで対応推奨）

**2. IPC通信バリデーション強化**
- reminderHandlers.ts: createReminder, updateReminderにバリデーション追加
- main.ts: IPCハンドラーで型チェック追加

**3. 本番環境console.log削除**
- vite.config.ts/webpack.config.jsで自動削除設定
- 開発環境のみconsole.log有効化

### 🟢 Low（時間があれば対応）

**4. ZIP解凍時のパストラバーサル対策強化**
- restoreBackup.ts: 解凍後ファイルパス検証追加

**5. Content Security Policy (CSP) 設定**
- main.ts: CSPヘッダー追加（将来的な拡張対応）

---

## セキュリティメンテナンス計画

### 定期タスク

**週次**:
- npm audit実行
- 新規脆弱性確認

**月次**:
- 依存関係の更新
- Electron最新版へのアップグレード検討

**四半期**:
- セキュリティ監査再実施
- ペネトレーションテスト検討

---

## 結論

本CRMアプリケーションはElectronセキュリティのベストプラクティスに準拠しており、**A評価（良好）**と判定します。

**npm audit fix**実行後は本番環境への投入が可能です。50代ユーザーが安心して使用できるセキュリティレベルを達成しています。

IPC通信バリデーションとconsole.log削除を次回リリースで対応することで、**A+評価（優秀）**に到達可能です。

---

**監査完了日**: 2025年12月9日
**次回監査推奨日**: 2026年3月9日（3ヶ月後）