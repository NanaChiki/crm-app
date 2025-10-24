/**
 * reminder.ts
 *
 * リマインダー関連の型定義
 * 50代ユーザーが使いやすいリマインダーシステムの型安全性を提供
 */

// Prismaから生成された型をインポート
import type { Reminder, Customer, ServiceRecord } from "@prisma/client";

// 他の型をインポート
export type { Reminder } from "@prisma/client";

// ================================
// リマインダー状態
// ================================

/**
 * リマインダーのステータス
 *
 * - scheduled: 送信予定（まだ送信していない）
 * - drafting: 下書き作成中（メールアプリで下書き作成中）
 * - sent: 送信済み
 * - cancelled: キャンセル（送信しない）
 */
export type ReminderStatus = "scheduled" | "drafting" | "sent" | "cancelled";

/**
 * リマインダーの作成元
 *
 * - system: システムが自動生成
 * - manual: ユーザーが手動作成
 */
export type ReminderSource = "system" | "manual";

// ================================
// フォーム・入力型
// ================================

/**
 * リマインダーフォームデータ
 * ReminderFormコンポーネントで使用
 */
export interface ReminderFormData {
  customerId: number;
  serviceRecordId?: number | null;
  title: string;
  message: string;
  reminderDate: Date;
  notes?: string;
}

/**
 * リマインダー作成入力
 */
export interface CreateReminderInput extends ReminderFormData {
  createdBy?: ReminderSource;
}

/**
 * リマインダー更新入力
 */
export interface UpdateReminderInput {
  reminderId: number;
  title?: string;
  message?: string;
  reminderDate?: Date;
  status?: ReminderStatus;
  notes?: string;
}

// ================================
// フィルター・検索
// ================================

/**
 * リマインダーフィルター条件
 */
export interface ReminderFilters {
  customerId?: number;
  status?: ReminderStatus;
  startDate?: Date; // reminderDate >= startDate
  endDate?: Date; // reminderDate <= endDate
  createdBy?: ReminderSource;
}

// ================================
// リレーション付き型
// ================================

/**
 * 顧客情報付きリマインダー
 * リマインダー一覧表示で使用
 */
export interface ReminderWithCustomer extends Reminder {
  customer: Customer;
}

/**
 * すべてのリレーション情報付きリマインダー
 * リマインダー詳細表示で使用
 */
export interface ReminderWithRelations extends Reminder {
  customer: Customer;
  serviceRecord?: ServiceRecord | null;
}

// ================================
// OutLook連携
// ================================

/**
 * OutLookメールデータ
 */
export interface OutlookEmailData {
  to: string; // 送信先メールアドレス
  subject: string; // 件名
  body: string; // 本文
  cc?: string; // CC（オプション）
}

/**
 * OutLookカレンダーイベントデータ
 */
export interface OutlookEventData {
  subject: string; // 予定のタイトル
  body: string; // 予定の説明
  start: Date; // 開始日時
  end: Date; // 終了日時
  location?: string; // 場所（オプション）
  reminder?: number; // リマインダー（分前、オプション）
}
