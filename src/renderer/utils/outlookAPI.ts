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
import type { OutlookEmailData, OutlookEventData } from '../../types';

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
 * リマインダーメール送信
 *
 * 既定のメールアプリを起動し、リマインダー内容を事前入力します。
 * ユーザーは内容を確認・編集してから送信できます。
 *
 * @param to - 送信先メールアドレス
 * @param subject - 件名
 * @param body - 本文
 * @returns 送信結果
 */
export async function sendReminderEmail(
  to: string,
  subject: string,
  body: string
): Promise<OutlookAPIResult> {
  try {
    console.log('📧 リマインダーメール送信:', { to, subject });

    // window.outlookAPIの存在確認（デバッグ用）
    if (!window.outlookAPI) {
      console.error('❌ window.outlookAPIが未定義です。preload.jsが正しく読み込まれていません。');
      return {
        success: false,
        message: 'メール送信機能の初期化に失敗しました。\nアプリを再起動してください。',
        error: 'OUTLOOK_API_NOT_FOUND',
      };
    }

    // メールアドレスの簡易バリデーション
    if (!to || !to.includes('@')) {
      return {
        success: false,
        message: 'メールアドレスが登録されていません。\n顧客情報を確認してください。',
        error: 'INVALID_EMAIL',
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
    console.error('❌ メール送信エラー:', error);

    return {
      success: false,
      message: 'メール送信に失敗しました',
      error: error.message,
    };
  }
}

/**
 * OutLookカレンダー予定作成
 *
 * @param eventData - カレンダー予定データ
 * @returns 作成結果
 */
export async function createReminderEvent(
  eventData: OutlookEventData
): Promise<OutlookAPIResult> {
  try {
    console.log('📅 カレンダー予定作成:', eventData);

    const result = await window.outlookAPI.createEvent(eventData);

    return result;
  } catch (error: any) {
    console.error('❌ カレンダー予定作成エラー:', error);

    return {
      success: false,
      message: 'カレンダー予定の作成に失敗しました',
      error: error.message,
    };
  }
}

/**
 * エラーメッセージを50代向けに変換
 */
export function getOutlookErrorGuidance(error: string): string {
  if (error.includes('INVALID_EMAIL')) {
    return `メールアドレスが登録されていません。

顧客情報を確認して、メールアドレスを登録してください。`;
  }

  if (error.includes('openExternal')) {
    return `メールアプリの起動に失敗しました。

以下を確認してください：
1. メールアプリがインストールされているか
2. 既定のメールアプリが設定されているか`;
  }

  return `メール送信に失敗しました。

インターネット接続とメールアプリの設定を確認してください。`;
}
