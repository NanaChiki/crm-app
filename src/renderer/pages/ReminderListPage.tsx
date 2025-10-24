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

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Add as AddIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Drafts as DraftsIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Schedule as ScheduleIcon,
  Send as SendIcon,
} from "@mui/icons-material";
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
} from "@mui/material";

import { PageHeader } from "../components/layout/PageHeader";
import { ReminderForm } from "../components/reminder/ReminderForm";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { useApp } from "../contexts/AppContext";
import { useReminder } from "../contexts/ReminderContext";

// Design System
import {
  FONT_SIZES,
  SPACING,
  BUTTON_SIZE,
  ICON_SIZE,
} from "../constants/uiDesignSystem";

// Types
import type { ReminderStatus, ReminderWithCustomer } from "../../types";

// ================================
// 定数定義
// ================================

type TabValue = "scheduled" | "drafting" | "sent" | "cancelled";

const STATUS_CONFIG = {
  scheduled: {
    label: "送信予定",
    color: "primary" as const,
    icon: <ScheduleIcon />,
  },
  drafting: {
    label: "下書き作成中",
    color: "warning" as const,
    icon: <DraftsIcon />,
  },
  sent: {
    label: "送信済み",
    color: "success" as const,
    icon: <CheckCircleIcon />,
  },
  cancelled: {
    label: "キャンセル",
    color: "default" as const,
    icon: <CancelIcon />,
  },
};

const MESSAGES = {
  pageTitle: "リマインダー管理",
  pageSubtitle: "メンテナンス推奨のリマインダーを管理します",
  noReminders: "リマインダーがありません",
  deleteConfirm: "このリマインダーを削除してもよろしいですか？",
  sendConfirm: "このリマインダーを今すぐ送信しますか？",
};

// ================================
// メインコンポーネント
// ================================

export const ReminderListPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
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
  } = useReminder();

  // ================================
  // State
  // ================================

  const [selectedTab, setSelectedTab] = useState<TabValue>("scheduled");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReminder, setEditingReminder] =
    useState<ReminderWithCustomer | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reminderToDelete, setReminderToDelete] = useState<number | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(
    new Set(),
  );

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
    [],
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
  }, []);

  const handleDeleteClick = useCallback((reminderId: number) => {
    setReminderToDelete(reminderId);
    setDeleteConfirmOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (reminderToDelete) {
      try {
        await deleteReminder(reminderToDelete);
        showSnackbar("リマインダーを削除しました", "success");
      } catch (error) {
        showSnackbar("削除に失敗しました", "error");
      }
    }
    setDeleteConfirmOpen(false);
    setReminderToDelete(null);
  }, [reminderToDelete, deleteReminder, showSnackbar]);

  // 下書き作成: メールアプリを開いてステータスを「下書き作成中」に変更
  const handleCreateDraft = useCallback(
    async (reminderId: number) => {
      const confirmed = window.confirm("メールアプリで下書きを作成しますか？");
      if (!confirmed) {
        return;
      }

      try {
        await sendReminderEmail(reminderId);
        // sendReminderEmail内でステータスが'drafting'に変更される
      } catch (error) {
        showSnackbar("下書き作成に失敗しました", "error");
      }
    },
    [sendReminderEmail, showSnackbar],
  );

  // 今すぐ送信: draftingステータスから送信済みに変更
  const handleSendNow = useCallback(
    async (reminderId: number) => {
      const confirmed = window.confirm(
        "メールを送信しましたか？\n「送信済み」ステータスに変更します。",
      );
      if (!confirmed) {
        return;
      }

      try {
        await markAsSent(reminderId);
        showSnackbar("リマインダーを送信済みにしました", "success");
      } catch (error) {
        showSnackbar("ステータス更新に失敗しました", "error");
      }
    },
    [markAsSent, showSnackbar],
  );

  const handleCustomerClick = useCallback(
    (customerId: number) => {
      navigate(`/customers/${customerId}`);
    },
    [navigate],
  );

  const handleCancelReminder = useCallback(
    async (reminderId: number) => {
      const confirmed = window.confirm(
        "このリマインダーをキャンセルしてもよろしいですか？",
      );
      if (!confirmed) {
        return;
      }

      try {
        await cancelReminder(reminderId);
        showSnackbar("リマインダーをキャンセルしました", "success");
      } catch (error) {
        showSnackbar("キャンセルに失敗しました", "error");
      }
    },
    [cancelReminder, showSnackbar],
  );

  const handleReschedule = useCallback(
    async (reminderId: number) => {
      try {
        await rescheduleReminder(reminderId);
      } catch (error) {
        // エラーハンドリングはrescheduleReminder内で実施済み
      }
    },
    [rescheduleReminder],
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

  // ================================
  // レンダリング: リマインダーカード
  // ================================

  const renderReminderCard = (reminder: ReminderWithCustomer) => {
    const statusConfig = STATUS_CONFIG[reminder.status as ReminderStatus];
    const isScheduled = reminder.status === "scheduled";
    const isDrafting = reminder.status === "drafting";
    const isCancelled = reminder.status === "cancelled";
    const daysUntil = Math.ceil(
      (new Date(reminder.reminderDate).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24),
    );
    const isExpanded = expandedMessages.has(reminder.reminderId);
    const messageLines = reminder.message.split("\n").length;
    const isLongMessage = messageLines > 3 || reminder.message.length > 100;

    return (
      <Card key={reminder.reminderId}>
        <Box sx={{ p: SPACING.card.desktop }}>
          {/* ヘッダー部分 */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: SPACING.gap.medium,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  mb: 1,
                  fontSize: {
                    xs: FONT_SIZES.cardTitle.mobile,
                    md: FONT_SIZES.cardTitle.desktop,
                  },
                }}
              >
                {reminder.title}
              </Typography>
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  cursor: "pointer",
                  "&:hover": { textDecoration: "underline" },
                }}
                onClick={() => handleCustomerClick(reminder.customerId)}
              >
                <Typography
                  variant="body1"
                  color="primary"
                  sx={{ fontWeight: "bold" }}
                >
                  {reminder.customer.companyName}
                </Typography>
              </Box>
            </Box>

            <Chip
              icon={statusConfig.icon}
              label={statusConfig.label}
              color={statusConfig.color}
              sx={{ fontSize: FONT_SIZES.label.desktop, fontWeight: "bold" }}
            />
          </Box>

          {/* メッセージ（折りたたみ対応） */}
          <Box sx={{ mb: SPACING.gap.medium }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                whiteSpace: "pre-wrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: isExpanded ? "unset" : 3,
                WebkitBoxOrient: "vertical",
              }}
            >
              {reminder.message}
            </Typography>
            {isLongMessage && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mt: SPACING.gap.small,
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => handleToggleMessage(reminder.reminderId)}
                  sx={{
                    transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.3s",
                  }}
                >
                  <ExpandMoreIcon />
                </IconButton>
                <Typography
                  variant="caption"
                  color="primary"
                  sx={{
                    cursor: "pointer",
                    "&:hover": { textDecoration: "underline" },
                  }}
                  onClick={() => handleToggleMessage(reminder.reminderId)}
                >
                  {isExpanded ? "折りたたむ" : "もっと見る"}
                </Typography>
              </Box>
            )}
          </Box>

          {/* 送信予定日 */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: SPACING.gap.small,
              mb: SPACING.gap.medium,
            }}
          >
            <ScheduleIcon fontSize="small" color="action" />
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              送信予定日:{" "}
              {new Date(reminder.reminderDate).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "short",
              })}
            </Typography>
            {isScheduled && daysUntil >= 0 && (
              <Chip
                label={daysUntil === 0 ? "今日" : `${daysUntil}日後`}
                size="small"
                color={daysUntil <= 3 ? "warning" : "default"}
              />
            )}
          </Box>

          {/* 作成元 */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: SPACING.gap.medium, display: "block" }}
          >
            {reminder.createdBy === "system" ? "🤖 自動生成" : "✍️ 手動作成"}
          </Typography>

          {/* アクションボタン */}
          <Box
            sx={{ display: "flex", gap: SPACING.gap.small, flexWrap: "wrap" }}
          >
            {/* 送信予定: 下書き作成ボタン */}
            {isScheduled && (
              <Button
                variant="contained"
                size="small"
                color="warning"
                startIcon={<DraftsIcon />}
                onClick={() => handleCreateDraft(reminder.reminderId)}
                sx={{ minWidth: BUTTON_SIZE.minWidth.desktop }}
              >
                下書き作成
              </Button>
            )}

            {isScheduled && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditIcon />}
                onClick={() => handleEdit(reminder)}
                sx={{ minWidth: BUTTON_SIZE.minWidth.mobile }}
              >
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
                sx={{ minWidth: BUTTON_SIZE.minWidth.mobile }}
              >
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
                sx={{ minWidth: BUTTON_SIZE.minWidth.desktop }}
              >
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
                sx={{ minWidth: BUTTON_SIZE.minWidth.desktop }}
              >
                再スケジュール
              </Button>
            )}

            <Button
              variant="outlined"
              size="small"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => handleDeleteClick(reminder.reminderId)}
              sx={{ minWidth: BUTTON_SIZE.minWidth.mobile }}
            >
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
          borderColor: "divider",
        }}
      >
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            "& .MuiTabs-scrollButtons": {
              "&.Mui-disabled": { opacity: 0.3 },
            },
          }}
        >
          {Object.entries(STATUS_CONFIG).map(([value, config]) => (
            <Tab
              key={value}
              value={value}
              label={config.label}
              icon={config.icon}
              iconPosition="start"
              sx={{
                minHeight: BUTTON_SIZE.minHeight.desktop,
                fontSize: {
                  xs: FONT_SIZES.label.mobile,
                  md: FONT_SIZES.body.desktop,
                },
                fontWeight: "bold",
                minWidth: { xs: BUTTON_SIZE.minWidth.desktop, md: "auto" },
              }}
            />
          ))}
        </Tabs>
      </Box>

      {/* リマインダー一覧 */}
      {loading ? (
        <Alert severity="info">読み込み中...</Alert>
      ) : filteredReminders.length > 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: SPACING.gap.medium,
          }}
        >
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
          position: "fixed",
          bottom: SPACING.gap.large * 8,
          right: SPACING.gap.large * 8,
          width: 64,
          height: 64,
        }}
      >
        <AddIcon sx={{ fontSize: ICON_SIZE.large }} />
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
        title="削除確認"
      >
        <Box>
          <Typography>{MESSAGES.deleteConfirm}</Typography>
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: SPACING.gap.small,
              mt: SPACING.section.desktop,
            }}
          >
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
