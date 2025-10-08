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

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Typography,
  Chip,
  Alert,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  Fab,
} from '@mui/material';
import {
  Add as AddIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';

// Custom Components
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ReminderForm } from '../components/reminder/ReminderForm';

// Custom Hooks
import { useReminder } from '../contexts/ReminderContext';
import { useCustomer } from '../contexts/CustomerContext';
import { useApp } from '../contexts/AppContext';

// Types
import type { ReminderStatus, ReminderWithCustomer } from '../../types';

// ================================
// 定数定義
// ================================

type TabValue = 'scheduled' | 'sent' | 'cancelled';

const STATUS_CONFIG = {
  scheduled: {
    label: '送信予定',
    color: 'primary' as const,
    icon: <ScheduleIcon />,
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
    sendReminderEmail,
  } = useReminder();

  // ================================
  // State
  // ================================

  const [selectedTab, setSelectedTab] = useState<TabValue>('scheduled');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ReminderWithCustomer | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reminderToDelete, setReminderToDelete] = useState<number | null>(null);

  // ================================
  // Effects
  // ================================

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  // ================================
  // フィルタリング
  // ================================

  const filteredReminders = useMemo(() => {
    return reminders
      .filter((reminder) => reminder.status === selectedTab)
      .sort((a, b) => {
        // 送信予定日の近い順
        return new Date(a.reminderDate).getTime() - new Date(b.reminderDate).getTime();
      });
  }, [reminders, selectedTab]);

  // ================================
  // イベントハンドラー
  // ================================

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: TabValue) => {
    setSelectedTab(newValue);
  }, []);

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

  const handleSendNow = useCallback(async (reminderId: number) => {
    const confirmed = window.confirm(MESSAGES.sendConfirm);
    if (!confirmed) return;

    try {
      await sendReminderEmail(reminderId);
      await markAsSent(reminderId);
      showSnackbar('リマインダーを送信しました', 'success');
    } catch (error) {
      showSnackbar('送信に失敗しました', 'error');
    }
  }, [sendReminderEmail, markAsSent, showSnackbar]);

  const handleCustomerClick = useCallback((customerId: number) => {
    navigate(`/customers/${customerId}`);
  }, [navigate]);

  // ================================
  // レンダリング: リマインダーカード
  // ================================

  const renderReminderCard = (reminder: ReminderWithCustomer) => {
    const statusConfig = STATUS_CONFIG[reminder.status as ReminderStatus];
    const isScheduled = reminder.status === 'scheduled';
    const daysUntil = Math.ceil(
      (new Date(reminder.reminderDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return (
      <Card key={reminder.reminderId}>
          <Box sx={{ p: 3 }}>
            {/* ヘッダー部分 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ mb: 1, fontSize: { xs: 18, md: 20 } }}>
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
                  <Typography variant="body1" color="primary" sx={{ fontWeight: 'bold' }}>
                    {reminder.customer.companyName}
                  </Typography>
                </Box>
              </Box>

              <Chip
                icon={statusConfig.icon}
                label={statusConfig.label}
                color={statusConfig.color}
                sx={{ fontSize: 14, fontWeight: 'bold' }}
              />
            </Box>

            {/* メッセージ */}
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 2,
                whiteSpace: 'pre-wrap',
                maxHeight: 100,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
              {reminder.message}
            </Typography>

            {/* 送信予定日 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <ScheduleIcon fontSize="small" color="action" />
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                送信予定日: {new Date(reminder.reminderDate).toLocaleDateString('ja-JP', {
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
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
              {reminder.createdBy === 'system' ? '🤖 自動生成' : '✍️ 手動作成'}
            </Typography>

            {/* アクションボタン */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {isScheduled && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<SendIcon />}
                  onClick={() => handleSendNow(reminder.reminderId)}
                  sx={{ minWidth: 120 }}>
                  今すぐ送信
                </Button>
              )}

              {isScheduled && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleEdit(reminder)}
                  sx={{ minWidth: 100 }}>
                  編集
                </Button>
              )}

              <Button
                variant="outlined"
                size="small"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => handleDeleteClick(reminder.reminderId)}
                sx={{ minWidth: 100 }}>
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
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* ページヘッダー */}
      <PageHeader
        title={MESSAGES.pageTitle}
        subtitle={MESSAGES.pageSubtitle}
      />

      {/* ステータスタブ */}
      <Box sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={selectedTab} onChange={handleTabChange}>
          {Object.entries(STATUS_CONFIG).map(([value, config]) => (
            <Tab
              key={value}
              value={value}
              label={config.label}
              icon={config.icon}
              iconPosition="start"
              sx={{
                minHeight: 48,
                fontSize: 16,
                fontWeight: 'bold',
              }}
            />
          ))}
        </Tabs>
      </Box>

      {/* リマインダー一覧 */}
      {loading ? (
        <Alert severity="info">読み込み中...</Alert>
      ) : filteredReminders.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
          bottom: 24,
          right: 24,
          width: 64,
          height: 64,
        }}>
        <AddIcon sx={{ fontSize: 32 }} />
      </Fab>

      {/* リマインダーフォームモーダル */}
      {isFormOpen && (
        <ReminderForm
          open={isFormOpen}
          onClose={handleFormClose}
          reminder={editingReminder}
        />
      )}

      {/* 削除確認ダイアログ */}
      <Modal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="削除確認">
        <Box>
          <Typography>{MESSAGES.deleteConfirm}</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
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
