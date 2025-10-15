/**
 * ReminderContext.tsx
 *
 * Phase 2E: 実データベース統合
 * モックデータから実Prismaデータベースへ移行
 *
 * 【リマインダーデータ管理Context】
 *
 * リマインダーのCRUD操作、フィルタリング、OutLook連携を管理。
 * 50代ユーザーが使いやすいリマインダーシステムの状態管理を提供。
 *
 * 【主な機能】
 * ✅ リマインダーCRUD操作（実DB統合）
 * ✅ フィルタリング・ソート
 * ✅ 今後N日以内のリマインダー取得
 * ✅ ローディング・エラー状態管理
 * ✅ OutLook連携
 */

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

// Contexts
import { useApp } from './AppContext';

// OutLook API
import {
  createReminderEvent as createEventAPI,
  getOutlookErrorGuidance,
  sendReminderEmail as sendEmailAPI,
} from '../utils/outlookAPI';

// Types
import type {
  CreateReminderInput,
  Reminder,
  ReminderFilters,
  ReminderWithCustomer,
  UpdateReminderInput,
} from '../../types';

// ================================
// ReminderAPI型定義
// ================================

declare global {
  interface Window {
    reminderAPI: {
      fetch: (filters?: ReminderFilters) => Promise<{
        success: boolean;
        data?: ReminderWithCustomer[];
        error?: string;
      }>;
      create: (input: CreateReminderInput) => Promise<{
        success: boolean;
        data?: Reminder;
        error?: string;
      }>;
      update: (input: UpdateReminderInput) => Promise<{
        success: boolean;
        data?: Reminder;
        error?: string;
      }>;
      delete: (reminderId: number) => Promise<{
        success: boolean;
        error?: string;
      }>;
      markAsSent: (reminderId: number) => Promise<{
        success: boolean;
        data?: Reminder;
        error?: string;
      }>;
      cancel: (reminderId: number) => Promise<{
        success: boolean;
        data?: Reminder;
        error?: string;
      }>;
      reschedule: (reminderId: number) => Promise<{
        success: boolean;
        data?: Reminder;
        error?: string;
      }>;
      markAsDrafting: (reminderId: number) => Promise<{
        success: boolean;
        data?: Reminder;
        error?: string;
      }>;
    };
  }
}

// ================================
// Context型定義
// ================================

interface ReminderContextType {
  // State
  reminders: ReminderWithCustomer[];
  loading: boolean;
  error: string | null;

  // CRUD操作
  fetchReminders: (filters?: ReminderFilters) => Promise<void>;
  createReminder: (data: CreateReminderInput) => Promise<Reminder>;
  updateReminder: (data: UpdateReminderInput) => Promise<Reminder>;
  deleteReminder: (reminderId: number) => Promise<void>;

  // ステータス変更
  markAsSent: (reminderId: number) => Promise<void>;
  cancelReminder: (reminderId: number) => Promise<void>;
  rescheduleReminder: (reminderId: number) => Promise<void>;

  // フィルタリング・検索
  filterReminders: (filters: ReminderFilters) => ReminderWithCustomer[];
  getUpcomingReminders: (days: number) => ReminderWithCustomer[];
  getReminderById: (reminderId: number) => ReminderWithCustomer | undefined;

  // OutLook連携
  sendReminderEmail: (reminderId: number) => Promise<void>;
  createOutlookEvent: (reminderId: number) => Promise<void>;
}

// ================================
// Context作成
// ================================

const ReminderContext = createContext<ReminderContextType | undefined>(
  undefined
);

// ================================
// Provider
// ================================

interface ReminderProviderProps {
  children: ReactNode;
}

export const ReminderProvider: React.FC<ReminderProviderProps> = ({
  children,
}) => {
  const { showSnackbar } = useApp();

  const [reminders, setReminders] = useState<ReminderWithCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ================================
  // リマインダー取得
  // ================================

  const fetchReminders = useCallback(
    async (filters?: ReminderFilters) => {
      setLoading(true);
      setError(null);

      try {
        console.log('📅 リマインダー取得開始', filters);

        const result = await window.reminderAPI.fetch(filters);

        if (result.success && result.data) {
          setReminders(result.data);
          console.log(`✅ ${result.data.length}件のリマインダーを取得しました`);
        } else {
          throw new Error(result.error || 'リマインダーの取得に失敗しました');
        }
      } catch (err: any) {
        const errorMessage = err.message || 'リマインダーの取得に失敗しました';
        console.error('❌ リマインダー取得エラー:', err);
        setError(errorMessage);
        showSnackbar(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    },
    [showSnackbar]
  );

  // ================================
  // リマインダー作成
  // ================================

  const createReminder = useCallback(
    async (data: CreateReminderInput): Promise<Reminder> => {
      setLoading(true);
      setError(null);

      try {
        console.log('📝 リマインダー作成開始', data);

        const result = await window.reminderAPI.create(data);

        if (result.success && result.data) {
          // 一覧を再取得
          await fetchReminders();

          showSnackbar('リマインダーを作成しました', 'success');
          console.log('✅ リマインダー作成成功', result.data.reminderId);

          return result.data;
        } else {
          throw new Error(result.error || 'リマインダーの作成に失敗しました');
        }
      } catch (err: any) {
        const errorMessage = err.message || 'リマインダーの作成に失敗しました';
        console.error('❌ リマインダー作成エラー:', err);
        setError(errorMessage);
        showSnackbar(errorMessage, 'error');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchReminders, showSnackbar]
  );

  // ================================
  // リマインダー更新
  // ================================

  const updateReminder = useCallback(
    async (data: UpdateReminderInput): Promise<Reminder> => {
      setLoading(true);
      setError(null);

      try {
        console.log('📝 リマインダー更新開始', data.reminderId);

        const result = await window.reminderAPI.update(data);

        if (result.success && result.data) {
          // 一覧を再取得
          await fetchReminders();

          showSnackbar('リマインダーを更新しました', 'success');
          console.log('✅ リマインダー更新成功', result.data.reminderId);

          return result.data;
        } else {
          throw new Error(result.error || 'リマインダーの更新に失敗しました');
        }
      } catch (err: any) {
        const errorMessage = err.message || 'リマインダーの更新に失敗しました';
        console.error('❌ リマインダー更新エラー:', err);
        setError(errorMessage);
        showSnackbar(errorMessage, 'error');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchReminders, showSnackbar]
  );

  // ================================
  // リマインダー削除
  // ================================

  const deleteReminder = useCallback(
    async (reminderId: number): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        console.log('🗑️ リマインダー削除開始', reminderId);

        const result = await window.reminderAPI.delete(reminderId);

        if (result.success) {
          // 一覧を再取得
          await fetchReminders();

          showSnackbar('リマインダーを削除しました', 'success');
          console.log('✅ リマインダー削除成功', reminderId);
        } else {
          throw new Error(result.error || 'リマインダーの削除に失敗しました');
        }
      } catch (err: any) {
        const errorMessage = err.message || 'リマインダーの削除に失敗しました';
        console.error('❌ リマインダー削除エラー:', err);
        setError(errorMessage);
        showSnackbar(errorMessage, 'error');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchReminders, showSnackbar]
  );

  // ================================
  // ステータス変更
  // ================================

  const markAsSent = useCallback(
    async (reminderId: number): Promise<void> => {
      try {
        console.log('✉️ リマインダーを送信済みに変更', reminderId);

        const result = await window.reminderAPI.markAsSent(reminderId);

        if (result.success) {
          await fetchReminders();
          showSnackbar('リマインダーを送信済みにしました', 'success');
        } else {
          throw new Error(result.error || '送信済み変更に失敗しました');
        }
      } catch (err: any) {
        console.error('❌ 送信済み変更エラー:', err);
        showSnackbar(err.message, 'error');
        throw err;
      }
    },
    [fetchReminders, showSnackbar]
  );

  const cancelReminder = useCallback(
    async (reminderId: number): Promise<void> => {
      try {
        console.log('❌ リマインダーをキャンセル', reminderId);

        const result = await window.reminderAPI.cancel(reminderId);

        if (result.success) {
          await fetchReminders();
          showSnackbar('リマインダーをキャンセルしました', 'success');
        } else {
          throw new Error(result.error || 'キャンセルに失敗しました');
        }
      } catch (err: any) {
        console.error('❌ キャンセルエラー:', err);
        showSnackbar(err.message, 'error');
        throw err;
      }
    },
    [fetchReminders, showSnackbar]
  );

  const rescheduleReminder = useCallback(
    async (reminderId: number): Promise<void> => {
      try {
        console.log('🔄 リマインダーを再スケジュール', reminderId);

        const result = await window.reminderAPI.reschedule(reminderId);

        if (result.success) {
          await fetchReminders();
          showSnackbar('リマインダーを再スケジュールしました', 'success');
        } else {
          throw new Error(result.error || '再スケジュールに失敗しました');
        }
      } catch (err: any) {
        console.error('❌ 再スケジュールエラー:', err);
        showSnackbar(err.message, 'error');
        throw err;
      }
    },
    [fetchReminders, showSnackbar]
  );

  // ================================
  // OutLook連携
  // ================================

  const sendReminderEmail = useCallback(
    async (reminderId: number): Promise<void> => {
      const reminder = reminders.find((r) => r.reminderId === reminderId);
      if (!reminder) {
        showSnackbar('リマインダーが見つかりません', 'error');
        return;
      }

      try {
        console.log('📧 リマインダーメール送信開始', reminderId);

        if (!reminder.customer.email) {
          showSnackbar(
            '顧客のメールアドレスが登録されていません。\n顧客情報を確認してください。',
            'error'
          );
          return;
        }

        // メール送信
        const result = await sendEmailAPI(
          reminder.customer.email,
          reminder.title,
          reminder.message
        );

        if (result.success) {
          // 下書き中ステータスに変更
          await window.reminderAPI.markAsDrafting(reminderId);
          await fetchReminders();

          showSnackbar(
            'メールアプリで下書きを確認してください。\n送信後、手動で「送信済み」に変更できます。',
            'info'
          );
        } else {
          const guidance = getOutlookErrorGuidance(result.error || '');
          showSnackbar(guidance, 'error');
        }
      } catch (error: any) {
        console.error('❌ メール送信エラー:', error);
        showSnackbar('メール送信に失敗しました', 'error');
      }
    },
    [reminders, fetchReminders, showSnackbar]
  );

  const createOutlookEvent = useCallback(
    async (reminderId: number): Promise<void> => {
      const reminder = reminders.find((r) => r.reminderId === reminderId);
      if (!reminder) {
        showSnackbar('リマインダーが見つかりません', 'error');
        return;
      }

      try {
        console.log('📅 カレンダー予定作成開始', reminderId);

        const eventData = {
          subject: reminder.title,
          body: reminder.message,
          start: new Date(reminder.reminderDate),
          end: new Date(
            new Date(reminder.reminderDate).getTime() + 60 * 60 * 1000
          ),
          location: reminder.customer.address || '',
          reminderMinutes: 60,
        };

        const result = await createEventAPI(eventData);

        if (result.success) {
          showSnackbar('カレンダーに予定を追加しました', 'success');
        } else {
          const guidance = getOutlookErrorGuidance(result.error || '');
          showSnackbar(guidance, 'error');
        }
      } catch (error: any) {
        console.error('❌ カレンダー予定作成エラー:', error);
        showSnackbar('カレンダー予定の作成に失敗しました', 'error');
      }
    },
    [reminders, showSnackbar]
  );

  // ================================
  // ヘルパー関数
  // ================================

  const getReminderById = useCallback(
    (reminderId: number): ReminderWithCustomer | undefined => {
      return reminders.find((r) => r.reminderId === reminderId);
    },
    [reminders]
  );

  const getUpcomingReminders = useCallback(
    (days: number): ReminderWithCustomer[] => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      futureDate.setHours(23, 59, 59, 999);

      return reminders
        .filter((reminder) => {
          if (
            reminder.status !== 'scheduled' &&
            reminder.status !== 'drafting'
          ) {
            return false;
          }

          const reminderDate = new Date(reminder.reminderDate);
          return reminderDate >= now && reminderDate <= futureDate;
        })
        .sort(
          (a, b) =>
            new Date(a.reminderDate).getTime() -
            new Date(b.reminderDate).getTime()
        );
    },
    [reminders]
  );

  const filterReminders = useCallback(
    (filters: ReminderFilters): ReminderWithCustomer[] => {
      return reminders.filter((reminder) => {
        if (filters.customerId && reminder.customerId !== filters.customerId) {
          return false;
        }

        if (filters.status && reminder.status !== filters.status) {
          return false;
        }

        if (filters.startDate) {
          const startDate = new Date(filters.startDate);
          if (new Date(reminder.reminderDate) < startDate) {
            return false;
          }
        }

        if (filters.endDate) {
          const endDate = new Date(filters.endDate);
          if (new Date(reminder.reminderDate) > endDate) {
            return false;
          }
        }

        return true;
      });
    },
    [reminders]
  );

  // ================================
  // Context Value
  // ================================

  const value = useMemo(
    () => ({
      reminders,
      loading,
      error,
      fetchReminders,
      createReminder,
      updateReminder,
      deleteReminder,
      markAsSent,
      cancelReminder,
      rescheduleReminder,
      sendReminderEmail,
      createOutlookEvent,
      getReminderById,
      getUpcomingReminders,
      filterReminders,
    }),
    [
      reminders,
      loading,
      error,
      fetchReminders,
      createReminder,
      updateReminder,
      deleteReminder,
      markAsSent,
      cancelReminder,
      rescheduleReminder,
      sendReminderEmail,
      createOutlookEvent,
      getReminderById,
      getUpcomingReminders,
      filterReminders,
    ]
  );

  return (
    <ReminderContext.Provider value={value}>
      {children}
    </ReminderContext.Provider>
  );
};

// ================================
// Custom Hook
// ================================

export const useReminder = (): ReminderContextType => {
  const context = useContext(ReminderContext);
  if (!context) {
    throw new Error('useReminder must be used within ReminderProvider');
  }
  return context;
};
