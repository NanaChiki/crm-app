/**
 * ReminderListPage.tsx
 *
 * 【50代向けリマインダー管理ページ】
 *
 * リマインダーの一覧表示・管理を行うメインページ。
 * 送信予定のリマインダーを確認し、編集・削除・送信を実行できます。
 *
 * 【主な機能】
 * ✅ リマインダー一覧表示（Card形式）
 * ✅ ステータスフィルター（予定・送信済み・キャンセル）
 * ✅ 新規リマインダー作成ボタン
 * ✅ 各リマインダーの編集・削除
 * ✅ 今すぐ送信ボタン（Phase 2Cで実装）
 *
 * 【50代配慮】
 * - 大きなカード表示
 * - ステータスを色分け
 * - 送信予定日を大きく表示
 * - アクションボタンを明確に
 */

import {
  Add as AddIcon,
  Build as BuildIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Drafts as DraftsIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Notifications as NotificationsIcon,
  Schedule as ScheduleIcon,
  Send as SendIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Chip,
  Container,
  Fab,
  IconButton,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';

import { PageHeader } from '../components/layout/PageHeader';
import { ReminderForm } from '../components/reminder/ReminderForm';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { useApp } from '../contexts/AppContext';
import { useCustomer } from '../contexts/CustomerContext';
import { useReminder } from '../contexts/ReminderContext';
import { useServiceRecords } from '../hooks/useServiceRecords';
import { detectMaintenanceNeeded } from '../utils/maintenanceDetection';

// Design System
import {
  BUTTON_SIZE,
  FONT_SIZES,
  ICON_SIZE,
  SPACING,
} from '../constants/uiDesignSystem';

// Types
import type { ReminderStatus, ReminderWithCustomer } from '../../types';

// ================================
// 定数定義
// ================================

type TabValue =
  | 'scheduled'
  | 'drafting'
  | 'sent'
  | 'cancelled'
  | 'notification';

const STATUS_CONFIG = {
  scheduled: {
    label: '送信予定',
    color: 'primary' as const,
    icon: <ScheduleIcon />,
  },
  drafting: {
    label: '下書き作成中',
    color: 'warning' as const,
    icon: <DraftsIcon />,
  },
  sent: {
    label: '送信済み',
    color: 'success' as const,
    icon: <CheckCircleIcon />,
  },
  cancelled: {
    label: 'キャンセル',
    color: 'default' as const,
    icon: <CancelIcon />,
  },
  notification: {
    label: 'お知らせ',
    color: 'info' as const,
    icon: <NotificationsIcon />,
  },
};

const MESSAGES = {
  pageTitle: 'リマインダー管理',
  pageSubtitle: 'メンテナンス推奨のリマインダーを管理します',
  noReminders: 'リマインダーがありません',
  deleteConfirm: 'このリマインダーを削除してもよろしいですか？',
  sendConfirm: 'このリマインダーを今すぐ送信しますか？',
};

// ================================
// メインコンポーネント
// ================================

export const ReminderListPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { showSnackbar } = useApp();

  const {
    reminders,
    loading,
    fetchReminders,
    deleteReminder,
    markAsSent,
    cancelReminder,
    rescheduleReminder,
    sendReminderEmail,
    getNotifications,
    createReminder,
    createNotification,
  } = useReminder();

  // 全サービス履歴取得（お知らせの緊急度計算用）
  const { serviceRecords: allServiceRecords, loading: serviceRecordsLoading } =
    useServiceRecords({
      autoLoad: true,
    });

  // 顧客データ取得（通知作成時に顧客名を取得するため）
  const { customers } = useCustomer();

  // ================================
  // State
  // ================================

  const [selectedTab, setSelectedTab] = useState<TabValue>('scheduled');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReminder, setEditingReminder] =
    useState<ReminderWithCustomer | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reminderToDelete, setReminderToDelete] = useState<number | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(
    new Set()
  );
  // リマインダーフォームのデフォルトデータを管理するためのstate
  const [defaultFormData, setDefaultFormData] = useState<{
    customerId?: number;
    title?: string;
    message?: string;
    reminderDate?: Date;
  }>({});

  // 既存サービス履歴の通知作成処理が実行済みかどうかを追跡
  const hasCheckedExistingRecordsRef = useRef<boolean>(false);
  // 処理済みのserviceRecordIdを追跡（重複防止）
  const processedServiceRecordIdsRef = useRef<Set<number>>(new Set());

  // ================================
  // Effects
  // ================================

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  /**
   * 既存のサービス履歴をチェックして通知を作成
   * アプリ起動時やサービス履歴が読み込まれた時に1回だけ実行
   */
  useEffect(() => {
    // サービス履歴が読み込まれていない場合はスキップ
    if (serviceRecordsLoading || allServiceRecords.length === 0) {
      return;
    }

    // 既に処理済みの場合はスキップ（無限ループ防止）
    if (hasCheckedExistingRecordsRef.current) {
      return;
    }

    // 既存の通知を取得（getNotifications()の代わりに直接remindersをフィルタリング）
    // これにより、getNotificationsが依存配列に含まれなくなり、無限ループを防止
    const existingNotifications = reminders.filter(
      (r) => r.status === 'notification'
    );
    const existingServiceRecordIds = new Set(
      existingNotifications
        .map((n) => n.serviceRecordId)
        .filter((id): id is number => id !== null && id !== undefined)
    );

    // メンテナンス時期を迎えたサービス履歴を検出
    const detections = detectMaintenanceNeeded(allServiceRecords);

    // 既に通知が存在しないものだけ通知を作成
    const createNotificationsForExistingRecords = async () => {
      // 処理開始フラグを立てる（無限ループ防止）
      hasCheckedExistingRecordsRef.current = true;

      for (const detection of detections) {
        // 既に通知が存在する場合はスキップ
        if (existingServiceRecordIds.has(detection.recordId)) {
          processedServiceRecordIdsRef.current.add(detection.recordId);
          continue;
        }

        // 既に処理済みの場合はスキップ
        if (processedServiceRecordIdsRef.current.has(detection.recordId)) {
          continue;
        }

        // サービス履歴を取得
        const serviceRecord = allServiceRecords.find(
          (r) => r.recordId === detection.recordId
        );
        if (!serviceRecord) {
          continue;
        }

        // 顧客情報を取得
        const customer = customers.find(
          (c) => c.customerId === detection.customerId
        );
        if (!customer) {
          continue;
        }

        // サービス種別ラベルを生成
        const serviceTypeLabel =
          detection.serviceType === '屋根'
            ? '屋根工事'
            : detection.serviceType === '外壁'
              ? '外壁工事'
              : '雨樋工事';

        // 現場名を生成（サービス説明があれば使用、なければサービス種別）
        const siteName = serviceRecord.serviceDescription || serviceTypeLabel;

        // タイトル: 「{顧客名}・{現場名}のメンテナンス時期です」
        const title = `${customer.companyName}・${siteName}のメンテナンス時期です`;

        // メッセージ: 「{サービス種別}の施工から{経過年数}年が経過しました。そろそろメンテナンスのご案内はいかがでしょうか？」
        const message = `${serviceTypeLabel}の施工から **${detection.yearsElapsed}年** が経過しました。\nそろそろメンテナンスのご案内はいかがでしょうか？`;

        try {
          await createNotification({
            customerId: detection.customerId,
            serviceRecordId: detection.recordId,
            title,
            message,
            reminderDate: new Date(),
            createdBy: 'system',
            notes: `自動生成: ${detection.serviceType}工事が${detection.yearsElapsed}年経過`,
          });

          // 処理済みとしてマーク
          processedServiceRecordIdsRef.current.add(detection.recordId);
        } catch (error) {
          // エラーはログのみ（ユーザーには通知しない）
          console.error('既存サービス履歴の通知作成エラー:', error);
        }
      }
    };

    createNotificationsForExistingRecords();
  }, [
    serviceRecordsLoading,
    allServiceRecords,
    customers,
    reminders, // getNotificationsの代わりにremindersを直接使用
    createNotification,
  ]);

  // ================================
  // フィルタリング
  // ================================

  /**
   * お知らせ一覧取得（createdAt降順）
   */
  const notifications = useMemo(() => {
    if (selectedTab !== 'notification') {
      return [];
    }
    return getNotifications().sort((a, b) => {
      // createdAt降順（新しい順）
      const dateA =
        typeof a.createdAt === 'string' ? new Date(a.createdAt) : a.createdAt;
      const dateB =
        typeof b.createdAt === 'string' ? new Date(b.createdAt) : b.createdAt;
      return dateB.getTime() - dateA.getTime();
    });
  }, [selectedTab, getNotifications]);

  const filteredReminders = useMemo(() => {
    if (selectedTab === 'notification') {
      return []; // お知らせは別途notificationsで処理
    }
    return reminders
      .filter((reminder) => reminder.status === selectedTab)
      .sort((a, b) => {
        // 送信予定日の近い順
        return (
          new Date(a.reminderDate).getTime() -
          new Date(b.reminderDate).getTime()
        );
      });
  }, [reminders, selectedTab]);

  // ================================
  // イベントハンドラー
  // ================================

  const handleTabChange = useCallback(
    (event: React.SyntheticEvent, newValue: TabValue) => {
      setSelectedTab(newValue);
    },
    []
  );

  const handleCreateNew = useCallback(() => {
    setEditingReminder(null);
    setIsFormOpen(true);
  }, []);

  const handleEdit = useCallback((reminder: ReminderWithCustomer) => {
    setEditingReminder(reminder);
    setIsFormOpen(true);
  }, []);

  const handleFormClose = useCallback(() => {
    setIsFormOpen(false);
    setEditingReminder(null);
    setDefaultFormData({}); // デフォルトデータもクリア
  }, []);

  const handleDeleteClick = useCallback((reminderId: number) => {
    setReminderToDelete(reminderId);
    setDeleteConfirmOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (reminderToDelete) {
      try {
        await deleteReminder(reminderToDelete);
        showSnackbar('リマインダーを削除しました', 'success');
      } catch (error) {
        showSnackbar('削除に失敗しました', 'error');
      }
    }
    setDeleteConfirmOpen(false);
    setReminderToDelete(null);
  }, [reminderToDelete, deleteReminder, showSnackbar]);

  // 下書き作成: メールアプリを開いてステータスを「下書き作成中」に変更
  const handleCreateDraft = useCallback(
    async (reminderId: number) => {
      const confirmed = window.confirm('メールアプリで下書きを作成しますか？');
      if (!confirmed) {
        return;
      }

      try {
        await sendReminderEmail(reminderId);
        // sendReminderEmail内でステータスが'drafting'に変更される
      } catch (error) {
        showSnackbar('下書き作成に失敗しました', 'error');
      }
    },
    [sendReminderEmail, showSnackbar]
  );

  // 今すぐ送信: draftingステータスから送信済みに変更
  const handleSendNow = useCallback(
    async (reminderId: number) => {
      const confirmed = window.confirm(
        'メールを送信しましたか？\n「送信済み」ステータスに変更します。'
      );
      if (!confirmed) {
        return;
      }

      try {
        await markAsSent(reminderId);
        showSnackbar('リマインダーを送信済みにしました', 'success');
      } catch (error) {
        showSnackbar('ステータス更新に失敗しました', 'error');
      }
    },
    [markAsSent, showSnackbar]
  );

  const handleCustomerClick = useCallback(
    (customerId: number) => {
      navigate(`/customers/${customerId}`);
    },
    [navigate]
  );

  const handleCancelReminder = useCallback(
    async (reminderId: number) => {
      const confirmed = window.confirm(
        'このリマインダーをキャンセルしてもよろしいですか？'
      );
      if (!confirmed) {
        return;
      }

      try {
        await cancelReminder(reminderId);
        showSnackbar('リマインダーをキャンセルしました', 'success');
      } catch (error) {
        showSnackbar('キャンセルに失敗しました', 'error');
      }
    },
    [cancelReminder, showSnackbar]
  );

  const handleReschedule = useCallback(
    async (reminderId: number) => {
      try {
        await rescheduleReminder(reminderId);
      } catch (error) {
        // エラーハンドリングはrescheduleReminder内で実施済み
      }
    },
    [rescheduleReminder]
  );

  const handleToggleMessage = useCallback((reminderId: number) => {
    setExpandedMessages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(reminderId)) {
        newSet.delete(reminderId);
      } else {
        newSet.add(reminderId);
      }
      return newSet;
    });
  }, []);

  /**
   * お知らせから詳細を見る（顧客詳細ページのメンテナンス現場表タブへ）
   */
  const handleViewDetails = useCallback(
    (customerId: number) => {
      navigate(`/customers/${customerId}#sites`);
    },
    [navigate]
  );

  /**
   * お知らせからリマインダーを作成
   * お知らせ（notification）からリマインダーを作成する場合は、新規作成として扱う
   */
  const handleCreateReminderFromNotification = useCallback(
    (notification: ReminderWithCustomer) => {
      // お知らせからリマインダーを作成する場合は、reminderをnullにして新規作成として扱う
      // ReminderFormのdefault propsを使用して初期値を設定
      setEditingReminder(null);
      setDefaultFormData({
        customerId: notification.customerId,
        title: notification.title,
        message: notification.message.replace(/\*\*/g, ''), // マークダウンを削除
        reminderDate: new Date(), // 今日をデフォルトに
      });
      setIsFormOpen(true);
    },
    []
  );

  // ================================
  // レンダリング: お知らせカード
  // ================================

  /**
   * お知らせカードのレンダリング
   * 要件に沿ったシンプルなカード形式
   */
  const renderNotificationCard = useCallback(
    (notification: ReminderWithCustomer) => {
      // サービス履歴を取得（緊急度計算用）
      const serviceRecord = notification.serviceRecordId
        ? allServiceRecords.find(
            (r) => r.recordId === notification.serviceRecordId
          )
        : null;

      // 緊急度を計算
      let urgencyLevel: 'overdue' | 'high' | 'medium' | 'low' = 'low';
      let urgencyLabel = '検討時期';
      let urgencyColor: 'error' | 'warning' | 'info' | 'default' = 'info';
      let serviceDate: Date | null = null;
      let yearsElapsed: number | null = null;

      if (serviceRecord) {
        const detections = detectMaintenanceNeeded([serviceRecord]);
        if (detections.length > 0) {
          const detection = detections[0];
          urgencyLevel = detection.urgencyLevel;
          serviceDate =
            typeof serviceRecord.serviceDate === 'string'
              ? new Date(serviceRecord.serviceDate)
              : serviceRecord.serviceDate;
          yearsElapsed = detection.yearsElapsed;

          // 緊急度に応じたラベルと色
          if (urgencyLevel === 'overdue') {
            urgencyLabel = '要対応';
            urgencyColor = 'error';
          } else if (urgencyLevel === 'high') {
            urgencyLabel = '推奨時期';
            urgencyColor = 'warning';
          } else {
            urgencyLabel = '検討時期';
            urgencyColor = 'info';
          }
        }
      }

      // 作成日をフォーマット
      const createdAt =
        typeof notification.createdAt === 'string'
          ? new Date(notification.createdAt)
          : notification.createdAt;
      const createdAtFormatted = createdAt.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      });

      // メッセージから**マークダウンを削除して表示
      const messageText = notification.message.replace(/\*\*/g, '');

      return (
        <Card key={notification.reminderId}>
          <Box sx={{ p: SPACING.card.desktop }}>
            {/* ヘッダー行: 緊急度Chip + 作成日 */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: SPACING.gap.medium,
              }}>
              <Chip
                label={urgencyLabel}
                color={urgencyColor}
                size="small"
                sx={{
                  fontSize: FONT_SIZES.label.desktop,
                  fontWeight: 'bold',
                  minHeight: 32,
                }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: FONT_SIZES.label.desktop }}>
                {createdAtFormatted}
              </Typography>
            </Box>

            {/* タイトル（太字1行） */}
            <Typography
              variant="h6"
              sx={{
                mb: SPACING.gap.small,
                fontWeight: 'bold',
                fontSize: {
                  xs: FONT_SIZES.cardTitle.mobile,
                  md: FONT_SIZES.cardTitle.desktop,
                },
              }}>
              {notification.title}
            </Typography>

            {/* 本文（2行程度） */}
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: SPACING.gap.medium,
                fontSize: FONT_SIZES.body.desktop,
                lineHeight: 1.6,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
              {messageText}
            </Typography>

            {/* フッター: 施工日・経過年数 + ボタン */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: SPACING.gap.small,
              }}>
              {/* 施工日・経過年数 */}
              {serviceDate && yearsElapsed !== null && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: FONT_SIZES.label.desktop }}>
                  施工日: {serviceDate.toLocaleDateString('ja-JP')} ・ 経過:{' '}
                  {yearsElapsed}年
                </Typography>
              )}

              {/* ボタン */}
              <Box sx={{ display: 'flex', gap: SPACING.gap.small }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<VisibilityIcon />}
                  onClick={() => handleViewDetails(notification.customerId)}
                  sx={{
                    minHeight: BUTTON_SIZE.minHeight.desktop,
                    fontSize: FONT_SIZES.body.desktop,
                  }}>
                  詳細を見る
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<BuildIcon />}
                  onClick={() =>
                    handleCreateReminderFromNotification(notification)
                  }
                  sx={{
                    minHeight: BUTTON_SIZE.minHeight.desktop,
                    fontSize: FONT_SIZES.body.desktop,
                  }}>
                  リマインダーを作成
                </Button>
              </Box>
            </Box>
          </Box>
        </Card>
      );
    },
    [allServiceRecords, handleViewDetails, handleCreateReminderFromNotification]
  );

  // ================================
  // レンダリング: リマインダーカード
  // ================================

  const renderReminderCard = (reminder: ReminderWithCustomer) => {
    const statusConfig = STATUS_CONFIG[reminder.status as ReminderStatus];
    const isScheduled = reminder.status === 'scheduled';
    const isDrafting = reminder.status === 'drafting';
    const isCancelled = reminder.status === 'cancelled';
    const daysUntil = Math.ceil(
      (new Date(reminder.reminderDate).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
    );
    const isExpanded = expandedMessages.has(reminder.reminderId);
    const messageLines = reminder.message.split('\n').length;
    const isLongMessage = messageLines > 3 || reminder.message.length > 100;

    return (
      <Card key={reminder.reminderId}>
        <Box sx={{ p: SPACING.card.desktop }}>
          {/* ヘッダー部分 */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: SPACING.gap.medium,
            }}>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  mb: 1,
                  fontSize: {
                    xs: FONT_SIZES.cardTitle.mobile,
                    md: FONT_SIZES.cardTitle.desktop,
                  },
                }}>
                {reminder.title}
              </Typography>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' },
                }}
                onClick={() => handleCustomerClick(reminder.customerId)}>
                <Typography
                  variant="body1"
                  color="primary"
                  sx={{ fontWeight: 'bold' }}>
                  {reminder.customer.companyName}
                </Typography>
              </Box>
            </Box>

            <Chip
              icon={statusConfig.icon}
              label={statusConfig.label}
              color={statusConfig.color}
              sx={{ fontSize: FONT_SIZES.label.desktop, fontWeight: 'bold' }}
            />
          </Box>

          {/* メッセージ（折りたたみ対応） */}
          <Box sx={{ mb: SPACING.gap.medium }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                whiteSpace: 'pre-wrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: isExpanded ? 'unset' : 3,
                WebkitBoxOrient: 'vertical',
              }}>
              {reminder.message}
            </Typography>
            {isLongMessage && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mt: SPACING.gap.small,
                }}>
                <IconButton
                  size="small"
                  onClick={() => handleToggleMessage(reminder.reminderId)}
                  sx={{
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s',
                  }}>
                  <ExpandMoreIcon />
                </IconButton>
                <Typography
                  variant="caption"
                  color="primary"
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                  onClick={() => handleToggleMessage(reminder.reminderId)}>
                  {isExpanded ? '折りたたむ' : 'もっと見る'}
                </Typography>
              </Box>
            )}
          </Box>

          {/* 送信予定日 */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.gap.small,
              mb: SPACING.gap.medium,
            }}>
            <ScheduleIcon fontSize="small" color="action" />
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              送信予定日:{' '}
              {new Date(reminder.reminderDate).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'short',
              })}
            </Typography>
            {isScheduled && daysUntil >= 0 && (
              <Chip
                label={daysUntil === 0 ? '今日' : `${daysUntil}日後`}
                size="small"
                color={daysUntil <= 3 ? 'warning' : 'default'}
              />
            )}
          </Box>

          {/* 作成元 */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: SPACING.gap.medium, display: 'block' }}>
            {reminder.createdBy === 'system' ? '🤖 自動生成' : '✍️ 手動作成'}
          </Typography>

          {/* アクションボタン */}
          <Box
            sx={{ display: 'flex', gap: SPACING.gap.small, flexWrap: 'wrap' }}>
            {/* 送信予定: 下書き作成ボタン */}
            {isScheduled && (
              <Button
                variant="contained"
                size="small"
                color="warning"
                startIcon={<DraftsIcon />}
                onClick={() => handleCreateDraft(reminder.reminderId)}
                sx={{ minWidth: BUTTON_SIZE.minWidth.desktop }}>
                下書き作成
              </Button>
            )}

            {isScheduled && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditIcon />}
                onClick={() => handleEdit(reminder)}
                sx={{ minWidth: BUTTON_SIZE.minWidth.mobile }}>
                編集
              </Button>
            )}

            {isScheduled && (
              <Button
                variant="outlined"
                size="small"
                color="warning"
                startIcon={<CancelIcon />}
                onClick={() => handleCancelReminder(reminder.reminderId)}
                sx={{ minWidth: BUTTON_SIZE.minWidth.mobile }}>
                キャンセル
              </Button>
            )}

            {/* 下書き作成中: 今すぐ送信ボタン */}
            {isDrafting && (
              <Button
                variant="contained"
                size="small"
                color="success"
                startIcon={<SendIcon />}
                onClick={() => handleSendNow(reminder.reminderId)}
                sx={{ minWidth: BUTTON_SIZE.minWidth.desktop }}>
                今すぐ送信
              </Button>
            )}

            {isCancelled && (
              <Button
                variant="contained"
                size="small"
                color="primary"
                startIcon={<ScheduleIcon />}
                onClick={() => handleReschedule(reminder.reminderId)}
                sx={{ minWidth: BUTTON_SIZE.minWidth.desktop }}>
                再スケジュール
              </Button>
            )}

            <Button
              variant="outlined"
              size="small"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => handleDeleteClick(reminder.reminderId)}
              sx={{ minWidth: BUTTON_SIZE.minWidth.mobile }}>
              削除
            </Button>
          </Box>
        </Box>
      </Card>
    );
  };

  // ================================
  // メインレンダー
  // ================================

  return (
    <Container maxWidth="xl" sx={{ py: SPACING.page.desktop }}>
      {/* ページヘッダー */}
      <PageHeader title={MESSAGES.pageTitle} subtitle={MESSAGES.pageSubtitle} />

      {/* ステータスタブ（スクロール対応） */}
      <Box
        sx={{
          mb: SPACING.section.desktop,
          borderBottom: 1,
          borderColor: 'divider',
        }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            '& .MuiTabs-scrollButtons': {
              '&.Mui-disabled': { opacity: 0.3 },
            },
          }}>
          {Object.entries(STATUS_CONFIG).map(([value, config]) => {
            // お知らせタブの場合は件数を表示
            const label =
              value === 'notification'
                ? `${config.label}（${getNotifications().length}）`
                : config.label;
            return (
              <Tab
                key={value}
                value={value}
                label={label}
                icon={config.icon}
                iconPosition="start"
                sx={{
                  minHeight: BUTTON_SIZE.minHeight.desktop,
                  fontSize: {
                    xs: FONT_SIZES.label.mobile,
                    md: FONT_SIZES.body.desktop,
                  },
                  fontWeight: 'bold',
                  minWidth: { xs: BUTTON_SIZE.minWidth.desktop, md: 'auto' },
                }}
              />
            );
          })}
        </Tabs>
      </Box>

      {/* リマインダー一覧 / お知らせ一覧 */}
      {loading ? (
        <Alert severity="info">読み込み中...</Alert>
      ) : selectedTab === 'notification' ? (
        // お知らせタブ
        notifications.length > 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: SPACING.gap.medium,
            }}>
            {notifications.map(renderNotificationCard)}
          </Box>
        ) : (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              px: 2,
            }}>
            <InfoIcon
              sx={{
                fontSize: 80,
                color: 'text.secondary',
                mb: 2,
              }}
            />
            <Typography
              variant="h6"
              color="text.primary"
              gutterBottom
              sx={{
                fontSize: FONT_SIZES.cardTitle.desktop,
                mb: 1,
              }}>
              今はお知らせはありません
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: FONT_SIZES.body.desktop,
              }}>
              メンテナンス時期を迎えた現場が追加されると、ここに表示されます
            </Typography>
          </Box>
        )
      ) : filteredReminders.length > 0 ? (
        // 通常のリマインダータブ
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.gap.medium,
          }}>
          {filteredReminders.map(renderReminderCard)}
        </Box>
      ) : (
        <Alert severity="info">{MESSAGES.noReminders}</Alert>
      )}

      {/* 新規作成FABボタン */}
      <Fab
        color="primary"
        aria-label="新規リマインダー作成"
        onClick={handleCreateNew}
        sx={{
          position: 'fixed',
          bottom: SPACING.gap.large * 8,
          right: SPACING.gap.large * 8,
          width: 64,
          height: 64,
        }}>
        <AddIcon sx={{ fontSize: ICON_SIZE.large }} />
      </Fab>

      {/* リマインダーフォームモーダル */}
      {isFormOpen && (
        <ReminderForm
          open={isFormOpen}
          onClose={handleFormClose}
          reminder={editingReminder}
          defaultCustomerId={defaultFormData.customerId}
          defaultTitle={defaultFormData.title}
          defaultMessage={defaultFormData.message}
          defaultDate={defaultFormData.reminderDate}
        />
      )}

      {/* 削除確認ダイアログ */}
      <Modal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="削除確認">
        <Box>
          <Typography>{MESSAGES.deleteConfirm}</Typography>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: SPACING.gap.small,
              mt: SPACING.section.desktop,
            }}>
            <Button onClick={() => setDeleteConfirmOpen(false)}>
              キャンセル
            </Button>
            <Button color="error" onClick={handleDeleteConfirm}>
              削除
            </Button>
          </Box>
        </Box>
      </Modal>
    </Container>
  );
};

export default ReminderListPage;
