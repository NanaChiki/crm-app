/**
 * ReminderContext.tsx
 *
 * 【リマインダーデータ管理Context】
 *
 * リマインダーのCRUD操作、フィルタリング、OutLook連携を管理。
 * 50代ユーザーが使いやすいリマインダーシステムの状態管理を提供。
 *
 * 【主な機能】
 * ✅ リマインダーCRUD操作
 * ✅ フィルタリング・ソート
 * ✅ 今後N日以内のリマインダー取得
 * ✅ ローディング・エラー状態管理
 * ✅ OutLook連携準備（Phase 2Cで実装）
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';

// Contexts
import { useApp } from './AppContext';

// Types
import type {
  Reminder,
  ReminderWithCustomer,
  CreateReminderInput,
  UpdateReminderInput,
  ReminderFilters,
  ReminderStatus,
} from '../../types';

// ================================
// 型定義
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

  // フィルタリング・検索
  filterReminders: (filters: ReminderFilters) => ReminderWithCustomer[];
  getUpcomingReminders: (days: number) => ReminderWithCustomer[];
  getReminderById: (reminderId: number) => ReminderWithCustomer | undefined;

  // OutLook連携（Phase 2Cで実装）
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
  // ================================
  // Hooks
  // ================================

  const { showSnackbar } = useApp();

  // ================================
  // State
  // ================================

  const [reminders, setReminders] = useState<ReminderWithCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ================================
  // CRUD操作
  // ================================

  /**
   * リマインダー一覧取得
   */
  const fetchReminders = useCallback(
    async (filters?: ReminderFilters) => {
      setLoading(true);
      setError(null);

      try {
        // TODO: Prismaクライアント経由でデータ取得
        // 現在はモックデータで実装
        console.log('📅 リマインダー取得開始', filters);

        // モックデータ（Phase 2Bで実際のAPI実装）
        const mockReminders: ReminderWithCustomer[] = [];

        setReminders(mockReminders);
        console.log(`✅ ${mockReminders.length}件のリマインダーを取得しました`);
      } catch (err) {
        const errorMessage = 'リマインダーの取得に失敗しました';
        console.error('❌ リマインダー取得エラー:', err);
        setError(errorMessage);
        showSnackbar(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    },
    [showSnackbar]
  );

  /**
   * リマインダー作成
   */
  const createReminder = useCallback(
    async (data: CreateReminderInput): Promise<Reminder> => {
      setLoading(true);
      setError(null);

      try {
        console.log('📝 リマインダー作成開始', data);

        // TODO: Prismaクライアント経由で作成
        // 現在はモック実装
        const newReminder = {
          reminderId: Date.now(),
          ...data,
          status: 'scheduled' as ReminderStatus,
          sentAt: null,
          outlookEventId: null,
          outlookEmailSent: false,
          createdBy: data.createdBy || 'manual',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Reminder;

        // 一覧を再取得
        await fetchReminders();

        showSnackbar('リマインダーを作成しました', 'success');
        console.log('✅ リマインダー作成成功', newReminder);

        return newReminder;
      } catch (err) {
        const errorMessage = 'リマインダーの作成に失敗しました';
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

  /**
   * リマインダー更新
   */
  const updateReminder = useCallback(
    async (data: UpdateReminderInput): Promise<Reminder> => {
      setLoading(true);
      setError(null);

      try {
        console.log('📝 リマインダー更新開始', data);

        // TODO: Prismaクライアント経由で更新
        const updatedReminder = {
          reminderId: data.reminderId,
          updatedAt: new Date(),
        } as Reminder;

        // 一覧を再取得
        await fetchReminders();

        showSnackbar('リマインダーを更新しました', 'success');
        console.log('✅ リマインダー更新成功');

        return updatedReminder;
      } catch (err) {
        const errorMessage = 'リマインダーの更新に失敗しました';
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

  /**
   * リマインダー削除
   */
  const deleteReminder = useCallback(
    async (reminderId: number): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        console.log('🗑️ リマインダー削除開始', reminderId);

        // TODO: Prismaクライアント経由で削除

        // 一覧を再取得
        await fetchReminders();

        showSnackbar('リマインダーを削除しました', 'success');
        console.log('✅ リマインダー削除成功');
      } catch (err) {
        const errorMessage = 'リマインダーの削除に失敗しました';
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

  /**
   * リマインダーを送信済みに変更
   */
  const markAsSent = useCallback(
    async (reminderId: number): Promise<void> => {
      await updateReminder({
        reminderId,
        status: 'sent',
        sentAt: new Date(),
      });
    },
    [updateReminder]
  );

  /**
   * リマインダーをキャンセル
   */
  const cancelReminder = useCallback(
    async (reminderId: number): Promise<void> => {
      await updateReminder({
        reminderId,
        status: 'cancelled',
        sentAt: null,
      });
    },
    [updateReminder]
  );

  // ================================
  // フィルタリング・検索
  // ================================

  /**
   * リマインダーをフィルタリング
   */
  const filterReminders = useCallback(
    (filters: ReminderFilters): ReminderWithCustomer[] => {
      return reminders.filter((reminder) => {
        // 顧客IDフィルター
        if (filters.customerId && reminder.customerId !== filters.customerId) {
          return false;
        }

        // ステータスフィルター
        if (filters.status && reminder.status !== filters.status) {
          return false;
        }

        // 作成元フィルター
        if (filters.createdBy && reminder.createdBy !== filters.createdBy) {
          return false;
        }

        // 日付範囲フィルター
        const reminderDate = new Date(reminder.reminderDate);
        if (filters.startDate && reminderDate < filters.startDate) {
          return false;
        }
        if (filters.endDate && reminderDate > filters.endDate) {
          return false;
        }

        return true;
      });
    },
    [reminders]
  );

  /**
   * 今後N日以内のリマインダー取得
   */
  const getUpcomingReminders = useCallback(
    (days: number): ReminderWithCustomer[] => {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      return filterReminders({
        status: 'scheduled',
        startDate: now,
        endDate: futureDate,
      }).sort((a, b) => {
        return (
          new Date(a.reminderDate).getTime() -
          new Date(b.reminderDate).getTime()
        );
      });
    },
    [filterReminders]
  );

  /**
   * IDでリマインダーを取得
   */
  const getReminderById = useCallback(
    (reminderId: number): ReminderWithCustomer | undefined => {
      return reminders.find((r) => r.reminderId === reminderId);
    },
    [reminders]
  );

  // ================================
  // OutLook連携（Phase 2Cで実装）
  // ================================

  /**
   * リマインダーメール送信
   * Phase 2Cで実装予定
   */
  const sendReminderEmail = useCallback(
    async (reminderId: number): Promise<void> => {
      console.log('📧 メール送信機能はPhase 2Cで実装予定', reminderId);
      showSnackbar(
        'メール送信機能はPhase 2Cで実装予定です',
        'info'
      );
      // TODO: Phase 2Cで実装
    },
    [showSnackbar]
  );

  /**
   * OutLookカレンダー予定作成
   * Phase 2Cで実装予定
   */
  const createOutlookEvent = useCallback(
    async (reminderId: number): Promise<void> => {
      console.log(
        '📅 カレンダー予定作成機能はPhase 2Cで実装予定',
        reminderId
      );
      showSnackbar(
        'カレンダー予定作成機能はPhase 2Cで実装予定です',
        'info'
      );
      // TODO: Phase 2Cで実装
    },
    [showSnackbar]
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
      filterReminders,
      getUpcomingReminders,
      getReminderById,
      sendReminderEmail,
      createOutlookEvent,
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
      filterReminders,
      getUpcomingReminders,
      getReminderById,
      sendReminderEmail,
      createOutlookEvent,
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

/**
 * useReminder Hook
 *
 * ReminderContextを使用するためのカスタムHook
 * コンポーネントで簡単にリマインダー機能を使用可能
 */
export const useReminder = (): ReminderContextType => {
  const context = useContext(ReminderContext);

  if (context === undefined) {
    throw new Error(
      'useReminder must be used within a ReminderProvider'
    );
  }

  return context;
};

export default ReminderContext;
