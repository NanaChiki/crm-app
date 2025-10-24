/**
 * 🔧 サービス履歴管理システム - ServiceRecord型定義
 *
 * このファイルでは、サービス履歴データを扱うための型定義を作成します。
 * 顧客（Customer）との関連性を意識し、外部キー関係や金額・日付フィールドの
 * 適切な型定義を行います。
 */

// =============================================================================
// 📋 基本のServiceRecord型（Prismaスキーマと完全一致）
// =============================================================================

/**
 * ServiceRecord型 - データベースから取得されるサービス履歴データの完全な型定義
 *
 * 【設計意図】
 * - Prismaスキーマの ServiceRecord model と完全に一致
 * - Customer型との関連性を意識した設計
 * - データベースから取得したデータをそのまま扱える
 *
 * 【重要なフィールド解説】
 * - recordId: サービス履歴の一意識別子（自動生成）
 * - customerId: 顧客IDの外部キー（Customer.customerIdを参照）
 * - serviceDate: サービス実施日（DateTime → Date型）
 * - amount: 金額（Prisma Decimal → TypeScript number型）
 * - status: サービス状況（completed、pending等）
 *
 * 【型変換の説明】
 * - Prisma DateTime → TypeScript Date
 * - Prisma Decimal → TypeScript number（金額計算用）
 * - Prisma String? → TypeScript string | null（null許可）
 */
export interface ServiceRecord {
  /** サービス履歴ID（自動生成・主キー） */
  recordId: number;

  /** 顧客ID（外部キー）
   * 【重要】Customer.customerIdを参照する関連フィールド
   * 【必須にする理由】サービス履歴は必ず特定の顧客に紐づく */
  customerId: number;

  /** サービス実施日
   * 【DateTime → Date変換】Prismaから取得時に自動変換される
   * 【必須にする理由】いつサービスを行ったかは重要な情報 */
  serviceDate: Date;

  /** サービス種別（任意項目）
   * 【nullを許可する理由】詳細な分類が不要な場合もある
   * 【例】「点検」「修理」「メンテナンス」等 */
  serviceType: string | null;

  /** サービス内容説明（任意項目）
   * 【nullを許可する理由】簡潔な履歴の場合は詳細説明が不要
   * 【50代向け配慮】自由記述で分かりやすく記録可能 */
  serviceDescription: string | null;

  /** 金額（任意項目）
   * 【Decimal → number変換】Prismaから取得時にnumberに変換
   * 【nullを許可する理由】無償サービスや見積もり段階では金額未確定
   * 【計算処理】JavaScriptのnumber型で金額計算が可能 */
  amount: number | null;

  /** サービス状況（必須項目）
   * 【デフォルト値】Prismaで"completed"が自動設定
   * 【必須にする理由】サービスの進行状況は必須情報 */
  status: string;

  /** 作成日時（自動設定） */
  createdAt: Date;

  /** 更新日時（自動更新） */
  updatedAt: Date;
}

// =============================================================================
// 📝 新規サービス履歴作成用の型定義
// =============================================================================

/**
 * CreateServiceRecordInput型 - 新規サービス履歴登録時に必要なデータの型定義
 *
 * 【設計意図】
 * - 新規作成時はID・タイムスタンプは不要（自動生成されるため）
 * - 顧客ID（customerId）とサービス日（serviceDate）のみ必須
 * - 50代向けの段階的入力をサポート
 *
 * 【必須フィールドの選定理由】
 * - customerId: どの顧客のサービスか識別するため必須
 * - serviceDate: いつのサービスかは記録上重要
 * - その他は後から追加可能（段階的入力）
 *
 * 【外部キー関係】
 * - customerIdは必ずCustomer.customerIdに存在する値である必要がある
 * - データベース制約により存在しない顧客IDは登録不可
 */

export interface CreateServiceRecordInput {
  /** 顧客ID（必須）
   * 【外部キー制約】Customer.customerIdに存在する値のみ有効
   * 【必須にする理由】サービス履歴は必ず顧客に紐づく必要がある */
  customerId: number;

  /** サービス実施日（必須）
   * 【必須にする理由】履歴として日付は重要な情報
   * 【Date型】フロントエンドのDatePickerと互換性良好 */
  serviceDate: Date;

  /** サービス種別（任意）
   * 【任意にする理由】後から分類可能、最初は履歴だけでも価値がある */
  serviceType?: string;

  /** サービス内容説明（任意）
   * 【任意にする理由】簡潔な履歴として最低限の記録をサポート */
  serviceDescription?: string;

  /** 金額（任意）
   * 【任意にする理由】無償サービスや金額未確定の段階でも記録可能
   * 【number型】計算処理に適した型 */
  amount?: number;

  /** サービス状況（任意）
   * 【任意にする理由】Prismaでデフォルト"completed"が設定される
   * 【カスタム値】"pending", "in-progress"等も設定可能 */
  status?: string;
}

// =============================================================================
// ✏️ サービス履歴更新用の型定義
// =============================================================================

/**
 * UpdateServiceRecordInput型 - 既存サービス履歴更新時のデータ型定義
 *
 * 【設計意図】
 * - 更新時は全てのフィールドが任意（部分更新をサポート）
 * - customerIdも更新可能（サービスの顧客変更に対応）
 * - Partial<T>を使って既存型から「全て任意」の型を生成
 *
 * 【Partial<T>を使う理由】
 * - CreateServiceRecordInputの全フィールドを任意にする
 * - 一部のフィールドだけ更新する場合に対応
 * - 型の重複を避けてメンテナンス性向上
 *
 * 【更新の柔軟性】
 * - 金額だけ追加（amount のみ更新）
 * - 状況だけ変更（status のみ更新）
 * - 説明だけ追記（serviceDescription のみ更新）
 */

export type UpdateServiceRecordInput = Partial<CreateServiceRecordInput>;

// =============================================================================
// 🔍 サービス履歴検索・フィルタリング用の型定義
// =============================================================================

/**
 * ServiceRecordSearchParams型 - サービス履歴検索時のパラメータ型定義
 *
 * 【設計意図】
 * - 顧客別、期間別、金額範囲等の柔軟な検索をサポート
 * - 50代の方でも使いやすい検索条件を提供
 * - Customer型との連携を意識した検索機能
 */

export interface ServiceRecordSearchParams {
  /** 顧客ID指定検索
   * 【任意にする理由】全サービス履歴表示も可能にする
   * 【Customer関連】特定顧客のサービス履歴のみ抽出 */
  customerId?: number;

  /** サービス種別での検索（部分一致）
   * 【任意にする理由】種別を問わない検索も重要 */
  serviceType?: string;

  /** サービス内容での検索（部分一致）
   * 【任意にする理由】キーワード検索として活用 */
  serviceDescription?: string;

  /** サービス実施日での絞り込み（以降）
   * 【任意にする理由】期間指定は高度な検索機能 */
  serviceDateFrom?: Date;

  /** サービス実施日での絞り込み（以前）
   * 【任意にする理由】期間指定は高度な検索機能 */
  serviceDateTo?: Date;

  /** 金額での絞り込み（以上）
   * 【任意にする理由】金額範囲検索は特殊なケース */
  amountFrom?: number;

  /** 金額での絞り込み（以下）
   * 【任意にする理由】金額範囲検索は特殊なケース */
  amountTo?: number;

  /** ステータスでの絞り込み
   * 【任意にする理由】全ステータス表示がデフォルト */
  status?: string;
}

// =============================================================================
// 📊 サービス履歴一覧表示用の型定義
// =============================================================================

/**
 * ServiceRecordListItem型 - サービス履歴一覧画面での表示用データ型定義
 *
 * 【設計意図】
 * - 一覧表示に必要な最小限の情報のみ
 * - 画面表示パフォーマンスを向上
 * - 50代の方でも見やすい情報量に調整
 *
 * 【Pick<T, K>を使う理由】
 * - ServiceRecord型から必要なフィールドのみを選択
 * - 型の一貫性を保ちながらデータ量を削減
 * - 将来ServiceRecord型が変更されても自動で追従
 *
 * 【選択フィールドの理由】
 * - recordId: 一意識別・詳細画面遷移用
 * - customerId: 顧客との関連表示用
 * - serviceDate: 履歴の時系列表示用
 * - serviceType: サービス内容の概要表示用
 * - amount: 金額情報の概要表示用
 * - status: 現在の状況確認用
 */

export type ServiceRecordListItem = Pick<
  ServiceRecord,
  | "recordId"
  | "customerId"
  | "serviceDate"
  | "serviceType"
  | "amount"
  | "status"
>;

// =============================================================================
// 🔗 Customer型との関連性を表現する型定義
// =============================================================================

/**
 * ServiceRecordWithCustomer型 - 顧客情報付きサービス履歴の型定義
 *
 * 【設計意図】
 * - JOIN結果など、顧客情報と一緒に取得したデータ用
 * - 詳細画面での表示に最適
 * - Customer型とServiceRecord型の関連性を明示
 *
 * 【使用ケース】
 * - サービス履歴詳細画面
 * - 顧客名付きのサービス履歴一覧
 * - レポート生成時のデータ型
 */

export interface ServiceRecordWithCustomer extends ServiceRecord {
  /** 関連する顧客情報
   * 【外部キー解決】customerIdから取得した完全な顧客データ
   * 【表示用】顧客名等をサービス履歴と一緒に表示可能 */
  customer: {
    customerId: number;
    companyName: string;
    contactPerson: string | null;
  };
}

// =============================================================================
// 🎯 型定義の使用例とベストプラクティス
// =============================================================================

/**
 * 【使用例1: API関数での型活用】
 *
 * // 新規サービス履歴作成
 * async function createServiceRecord(
 *   input: CreateServiceRecordInput
 * ): Promise<ServiceRecord> {
 *   // customerId、serviceDateは必須チェック済み
 *   return await api.post('/service-records', input);
 * }
 *
 * // サービス履歴更新
 * async function updateServiceRecord(
 *   id: number,
 *   input: UpdateServiceRecordInput
 * ): Promise<ServiceRecord> {
 *   // inputは全フィールドが任意（部分更新）
 *   return await api.patch(`/service-records/${id}`, input);
 * }
 *
 * // 顧客別サービス履歴検索
 * async function getCustomerServiceRecords(
 *   customerId: number
 * ): Promise<ServiceRecordListItem[]> {
 *   const params: ServiceRecordSearchParams = { customerId };
 *   return await api.get('/service-records', { params });
 * }
 */

/**
 * 【使用例2: React コンポーネントでの型活用】
 *
 * // サービス履歴作成フォーム
 * function ServiceRecordCreateForm({ customerId }: { customerId: number }) {
 *   const [formData, setFormData] = useState<CreateServiceRecordInput>({
 *     customerId, // 顧客が決まっている場合の初期値
 *     serviceDate: new Date(), // 今日の日付を初期値
 *   });
 * }
 *
 * // サービス履歴一覧表示
 * function ServiceRecordList({
 *   records
 * }: {
 *   records: ServiceRecordListItem[]
 * }) {
 *   // 最小限のデータで高速表示
 * }
 *
 * // 詳細画面（顧客情報付き）
 * function ServiceRecordDetail({
 *   record
 * }: {
 *   record: ServiceRecordWithCustomer
 * }) {
 *   // 顧客名とサービス履歴を一緒に表示
 * }
 */
