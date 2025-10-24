/**
 * outlookAPI.ts
 *
 * 【OutLook連携APIラッパー】
 *
 * レンダラープロセスからOutLook機能を簡単に呼び出すためのAPI。
 * Electronのpreloadスクリプト経由でメインプロセスと通信。
 *
 * 【主な機能】
 * ✅ リマインダーメール送信
 * ✅ カレンダー予定作成
 * ✅ エラーハンドリング
 *
 * 【50代配慮】
 * - 分かりやすいエラーメッセージ
 * - メールアプリが自動起動
 * - 送信前に内容確認可能
 */

// Types
import type { OutlookEmailData, OutlookEventData } from "../../types";

// ================================
// 型定義
// ================================

interface OutlookAPIResult {
  success: boolean;
  message: string;
  error?: string;
}

// ================================
// OutLook API宣言
// ================================

declare global {
  interface Window {
    outlookAPI: {
      sendEmail: (emailData: OutlookEmailData) => Promise<OutlookAPIResult>;
      createEvent: (eventData: OutlookEventData) => Promise<OutlookAPIResult>;
    };
  }
}

// ================================
// OutLook連携関数
// ================================

/**
 * リマインダーメール送信（既定のメールアプリを起動）
 *
 * 既定のメールアプリを起動し、リマインダー内容を事前入力します。
 * ユーザーは内容を確認・編集してから送信できます。
 *
 * @param {string} to - 送信先メールアドレス
 * @param {string} subject - 件名
 * @param {string} body - 本文
 * @returns {Promise<OutlookAPIResult>} 送信結果（success, message, error）
 *
 * @example
 * const result = await sendReminderEmail(
 *   'customer@example.com',
 *   'メンテナンスのご案内',
 *   'そろそろ外壁塗装のメンテナンス時期です...'
 * );
 */
export async function sendReminderEmail(
  to: string,
  subject: string,
  body: string,
): Promise<OutlookAPIResult> {
  try {
    // window.outlookAPIの存在確認
    if (!window.outlookAPI) {
      console.error(
        "❌ window.outlookAPIが未定義です。preload.jsが正しく読み込まれていません。",
      );
      return {
        success: false,
        message:
          "メール送信機能の初期化に失敗しました。\nアプリを再起動してください。",
        error: "OUTLOOK_API_NOT_FOUND",
      };
    }

    // メールアドレスの簡易バリデーション
    if (!to || !to.includes("@")) {
      return {
        success: false,
        message:
          "メールアドレスが登録されていません。\n顧客情報を確認してください。",
        error: "INVALID_EMAIL",
      };
    }

    const emailData: OutlookEmailData = {
      to,
      subject,
      body,
    };

    // メール送信実行
    const result = await window.outlookAPI.sendEmail(emailData);

    return result;
  } catch (error: any) {
    console.error("❌ メール送信エラー:", error);

    return {
      success: false,
      message: "メール送信に失敗しました",
      error: error.message,
    };
  }
}

/**
 * OutLookカレンダー予定作成（ICS形式でダウンロード）
 *
 * @param {OutlookEventData} eventData - カレンダー予定データ（件名、本文、開始日時、終了日時、場所）
 * @returns {Promise<OutlookAPIResult>} 作成結果（success, message, error）
 *
 * @example
 * const result = await createReminderEvent({
 *   subject: '田中建設様 外壁塗装',
 *   body: 'メンテナンス予定',
 *   start: new Date('2024-11-01T10:00:00'),
 *   end: new Date('2024-11-01T11:00:00'),
 *   location: '東京都〇〇区'
 * });
 */
export async function createReminderEvent(
  eventData: OutlookEventData,
): Promise<OutlookAPIResult> {
  try {
    const result = await window.outlookAPI.createEvent(eventData);

    return result;
  } catch (error: any) {
    console.error("❌ カレンダー予定作成エラー:", error);

    return {
      success: false,
      message: "カレンダー予定の作成に失敗しました",
      error: error.message,
    };
  }
}

/**
 * エラーメッセージを50代向けに変換（具体的な解決方法を提示）
 *
 * @param {string} error - エラーメッセージ
 * @returns {string} 50代向けの分かりやすいエラーメッセージ
 */
export function getOutlookErrorGuidance(error: string): string {
  if (error.includes("INVALID_EMAIL")) {
    return `メールアドレスが登録されていません。

顧客情報を確認して、メールアドレスを登録してください。`;
  }

  if (error.includes("openExternal")) {
    return `メールアプリの起動に失敗しました。

以下を確認してください：
1. メールアプリがインストールされているか
2. 既定のメールアプリが設定されているか`;
  }

  return `メール送信に失敗しました。

インターネット接続とメールアプリの設定を確認してください。`;
}
