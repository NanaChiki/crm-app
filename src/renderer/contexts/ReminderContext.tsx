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
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

// Contexts
import { useApp } from './AppContext';
import { useCustomer } from './CustomerContext';

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
// モックデータストレージ
// ================================
let mockReminderStorage: Reminder[] = [];

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
  rescheduleReminder: (reminderId: number) => Promise<void>;

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
  const { customers } = useCustomer();

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
        console.log('📦 モックストレージ総数:', mockReminderStorage.length);
        console.log(
          '📦 モックストレージ内容:',
          mockReminderStorage.map((r) => ({
            id: r.reminderId,
            customerId: r.customerId,
            title: r.title,
            status: r.status,
          }))
        );

        // モックストレージから取得
        let filteredReminders = mockReminderStorage;

        // フィルタリング適用
        if (filters) {
          console.log('🔍 フィルター適用:', filters);
          filteredReminders = filteredReminders.filter((reminder) => {
            if (
              filters.customerId &&
              reminder.customerId !== filters.customerId
            ) {
              console.log(
                `❌ customerId不一致: ${reminder.customerId} !== ${filters.customerId}`
              );
              return false;
            }
            if (filters.status && reminder.status !== filters.status) {
              return false;
            }
            if (filters.createdBy && reminder.createdBy !== filters.createdBy) {
              return false;
            }
            if (filters.startDate) {
              const reminderDate = new Date(reminder.reminderDate);
              if (reminderDate < filters.startDate) {
                return false;
              }
            }
            if (filters.endDate) {
              const reminderDate = new Date(reminder.reminderDate);
              if (reminderDate > filters.endDate) {
                return false;
              }
            }
            return true;
          });
          console.log(`🔍 フィルター後: ${filteredReminders.length}件`);
        }

        // 顧客情報を付加
        const remindersWithCustomer: ReminderWithCustomer[] = filteredReminders
          .map((reminder) => {
            const customer = customers.find(
              (c) => c.customerId === reminder.customerId
            );
            return {
              ...reminder,
              customer: customer!,
            };
          })
          .filter((r) => r.customer); // 顧客が見つからないものは除外

        setReminders(remindersWithCustomer);
        console.log(
          `✅ ${remindersWithCustomer.length}件のリマインダーを取得しました`
        );
        console.log(
          '✅ リマインダー詳細:',
          remindersWithCustomer.map((r) => ({
            id: r.reminderId,
            customer: r.customer.companyName,
            status: r.status,
          }))
        );
      } catch (err) {
        const errorMessage = 'リマインダーの取得に失敗しました';
        console.error('❌ リマインダー取得エラー:', err);
        setError(errorMessage);
        showSnackbar(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    },
    [showSnackbar, customers]
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
        const newReminder: Reminder = {
          reminderId: Date.now(),
          customerId: data.customerId,
          serviceRecordId: data.serviceRecordId || null,
          title: data.title,
          message: data.message,
          reminderDate: data.reminderDate,
          status: 'scheduled',
          sentAt: null,
          outlookEventId: null,
          outlookEmailSent: false,
          createdBy: data.createdBy || 'manual',
          notes: data.notes || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // モックストレージに追加
        mockReminderStorage.push(newReminder);

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
        const index = mockReminderStorage.findIndex(
          (r) => r.reminderId === data.reminderId
        );

        if (index === -1) {
          throw new Error('リマインダーが見つかりません');
        }

        // 更新データをマージ
        const updatedReminder: Reminder = {
          ...mockReminderStorage[index],
          ...data,
          updatedAt: new Date(),
        };

        mockReminderStorage[index] = updatedReminder;

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
        mockReminderStorage = mockReminderStorage.filter(
          (r) => r.reminderId !== reminderId
        );

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
      try {
        const index = mockReminderStorage.findIndex(
          (r) => r.reminderId === reminderId
        );

        if (index !== -1) {
          mockReminderStorage[index] = {
            ...mockReminderStorage[index],
            status: 'sent',
            sentAt: new Date(),
            updatedAt: new Date(),
          };
        }

        await fetchReminders();
      } catch (err) {
        console.error('❌ ステータス更新エラー:', err);
        throw err;
      }
    },
    [fetchReminders]
  );

  /**
   * リマインダーをキャンセル
   */
  const cancelReminder = useCallback(
    async (reminderId: number): Promise<void> => {
      try {
        const index = mockReminderStorage.findIndex(
          (r) => r.reminderId === reminderId
        );

        if (index !== -1) {
          mockReminderStorage[index] = {
            ...mockReminderStorage[index],
            status: 'cancelled',
            updatedAt: new Date(),
          };
        }

        await fetchReminders();
      } catch (err) {
        console.error('❌ ステータス更新エラー:', err);
        throw err;
      }
    },
    [fetchReminders]
  );

  /**
   * リマインダーを再スケジュール（キャンセル→スケジュール済みに戻す）
   */
  const rescheduleReminder = useCallback(
    async (reminderId: number): Promise<void> => {
      try {
        const index = mockReminderStorage.findIndex(
          (r) => r.reminderId === reminderId
        );

        if (index !== -1) {
          mockReminderStorage[index] = {
            ...mockReminderStorage[index],
            status: 'scheduled',
            updatedAt: new Date(),
          };
        }

        await fetchReminders();
        showSnackbar('リマインダーを再スケジュールしました', 'success');
      } catch (err) {
        console.error('❌ ステータス更新エラー:', err);
        showSnackbar('再スケジュールに失敗しました', 'error');
        throw err;
      }
    },
    [fetchReminders, showSnackbar]
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
        if (filters.startDate) {
          const startDate = new Date(filters.startDate);
          if (reminderDate < startDate) {
            return false;
          }
        }
        if (filters.endDate) {
          const endDate = new Date(filters.endDate);
          if (reminderDate > endDate) {
            return false;
          }
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
      // 今日の開始時刻（00:00:00）
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      // N日後の終了時刻（23:59:59）
      const futureDate = new Date(now);
      futureDate.setDate(futureDate.getDate() + days);
      futureDate.setHours(23, 59, 59, 999);

      console.log(`📅 今後${days}日以内のリマインダーを検索中...`);
      console.log(
        `📅 検索範囲: ${now.toLocaleDateString()} 〜 ${futureDate.toLocaleDateString()}`
      );
      console.log(`総リマインダー数: ${reminders.length}`);

      // reminderDate を基準にフィルタリング
      const filtered = reminders.filter((reminder) => {
        // ステータスがscheduled または drafting のものだけ
        if (reminder.status !== 'scheduled' && reminder.status !== 'drafting') {
          console.log(
            `❌ ステータス不一致: ${reminder.title} (status: ${reminder.status})`
          );
          return false;
        }

        const reminderDate = new Date(reminder.reminderDate);

        console.log(`🔍 チェック中: ${reminder.title}`);
        console.log(`   reminderDate: ${reminderDate.toLocaleString()}`);
        console.log(
          `   範囲: ${now.toLocaleString()} 〜 ${futureDate.toLocaleString()}`
        );
        console.log(
          `   結果: ${reminderDate >= now && reminderDate <= futureDate}`
        );

        // 今日から指定日数以内
        return reminderDate >= now && reminderDate <= futureDate;
      });

      console.log(`✅ ${filtered.length}件の予定リマインダーが見つかりました`);

      // 送信予定日の近い順にソート
      return filtered.sort((a, b) => {
        return (
          new Date(a.reminderDate).getTime() -
          new Date(b.reminderDate).getTime()
        );
      });
    },
    [reminders]
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
   */
  const sendReminderEmail = useCallback(
    async (reminderId: number): Promise<void> => {
      const reminder = getReminderById(reminderId);
      if (!reminder) {
        showSnackbar('リマインダーが見つかりません', 'error');
        return;
      }

      try {
        console.log('📧 リマインダーメール送信開始', reminderId);

        // 顧客メールアドレス確認
        if (!reminder.customer.email) {
          showSnackbar(
            '顧客のメールアドレスが登録されていません。\n顧客情報を確認してください。',
            'error'
          );
          return;
        }

        // メール下書き作成
        const result = await sendEmailAPI(
          reminder.customer.email,
          reminder.title,
          reminder.message
        );

        if (result.success) {
          // 下書き作成成功時は「下書き作成中」ステータスに変更
          // ユーザーがメールクライアントで送信ボタンを押すまで待機
          await updateReminder({ reminderId, status: 'drafting' });
          showSnackbar(
            'メールアプリで下書きを確認してください。\n送信後、手動で「送信済み」に変更できます。',
            'info'
          );
        } else {
          // 送信失敗
          const guidance = getOutlookErrorGuidance(result.error || '');
          showSnackbar(guidance, 'error');
        }
      } catch (error) {
        console.error('❌ メール送信エラー:', error);
        showSnackbar('メール送信に失敗しました', 'error');
      }
    },
    [getReminderById, updateReminder, showSnackbar]
  );

  /**
   * OutLookカレンダー予定作成
   */
  const createOutlookEvent = useCallback(
    async (reminderId: number): Promise<void> => {
      const reminder = getReminderById(reminderId);
      if (!reminder) {
        showSnackbar('リマインダーが見つかりません', 'error');
        return;
      }

      try {
        console.log('📅 カレンダー予定作成開始', reminderId);

        // カレンダー予定データ作成
        const eventData = {
          subject: reminder.title,
          body: reminder.message,
          start: new Date(reminder.reminderDate),
          end: new Date(
            new Date(reminder.reminderDate).getTime() + 60 * 60 * 1000
          ), // 1時間後
          location: reminder.customer.address || '',
          reminder: 60, // 1時間前にリマインダー
        };

        // カレンダー予定作成
        const result = await createEventAPI(eventData);

        if (result.success) {
          showSnackbar(result.message, 'success');
        } else {
          const guidance = getOutlookErrorGuidance(result.error || '');
          showSnackbar(guidance, 'error');
        }
      } catch (error) {
        console.error('❌ カレンダー予定作成エラー:', error);
        showSnackbar('カレンダー予定の作成に失敗しました', 'error');
      }
    },
    [getReminderById, showSnackbar]
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
      rescheduleReminder,
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
    throw new Error('useReminder must be used within a ReminderProvider');
  }

  return context;
};

export default ReminderContext;
