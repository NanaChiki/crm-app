/**
 * ReminderForm.tsx
 *
 * 【リマインダー作成・編集フォーム】
 *
 * リマインダーの作成・編集を行うモーダルフォーム。
 * 顧客選択、タイトル、メッセージ、送信予定日を入力します。
 *
 * 【50代配慮】
 * - 大きな入力フィールド
 * - メッセージテンプレート提供
 * - 分かりやすいバリデーション
 * - プレビュー表示
 */

import {
  Alert,
  Box,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import React, { useCallback, useState } from "react";

// Custom Components
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";

// Custom Hooks
import { useApp } from "../../contexts/AppContext";
import { useCustomer } from "../../contexts/CustomerContext";
import { useReminder } from "../../contexts/ReminderContext";

// Types
import type { CreateReminderInput, ReminderWithCustomer } from "../../../types";

// ================================
// Props
// ================================

interface ReminderFormProps {
  open: boolean;
  onClose: () => void;
  reminder?: ReminderWithCustomer | null;
  defaultCustomerId?: number;
  defaultTitle?: string;
  defaultMessage?: string;
  defaultDate?: Date;
}

// ================================
// メッセージテンプレート
// ================================

const MESSAGE_TEMPLATES = [
  {
    label: "標準テンプレート",
    template: (companyName: string) =>
      `${companyName}様\n\nいつもお世話になっております。\n\nそろそろメンテナンスの時期ではないでしょうか？\n一度、現場を拝見させていただければと存じます。\n\nご都合の良い日時をお聞かせいただけますと幸いです。`,
  },
  {
    label: "緊急対応テンプレート",
    template: (companyName: string) =>
      `${companyName}様\n\nいつもお世話になっております。\n\n早急なメンテナンスをお勧めいたします。\nお早めにご連絡いただけますと幸いです。`,
  },
];

// ================================
// メインコンポーネント
// ================================

export const ReminderForm: React.FC<ReminderFormProps> = ({
  open,
  onClose,
  reminder,
  defaultCustomerId,
  defaultTitle,
  defaultMessage,
  defaultDate,
}) => {
  const { showSnackbar } = useApp();
  const { customers } = useCustomer();
  const { createReminder, updateReminder } = useReminder();

  // ================================
  // State
  // ================================

  const [formData, setFormData] = useState<CreateReminderInput>({
    customerId: reminder?.customerId || defaultCustomerId || 0,
    title: reminder?.title || defaultTitle || "",
    message: reminder?.message || defaultMessage || "",
    reminderDate: reminder?.reminderDate
      ? new Date(reminder.reminderDate)
      : defaultDate || new Date(),
    notes: reminder?.notes || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // ================================
  // バリデーション
  // ================================

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerId) {
      newErrors.customerId = "顧客を選択してください";
    }
    if (!formData.title) {
      newErrors.title = "タイトルを入力してください";
    }
    if (!formData.message) {
      newErrors.message = "メッセージを入力してください";
    }
    if (!formData.reminderDate) {
      newErrors.reminderDate = "送信予定日を選択してください";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // ================================
  // イベントハンドラー
  // ================================

  const handleChange = useCallback(
    (field: keyof CreateReminderInput, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: "" }));
    },
    [],
  );

  const handleTemplateApply = useCallback(
    (templateFn: (name: string) => string) => {
      const customer = customers.find(
        (c) => c.customerId === formData.customerId,
      );
      if (customer) {
        handleChange("message", templateFn(customer.companyName));
      }
    },
    [customers, formData.customerId, handleChange],
  );

  const handleSubmit = useCallback(async () => {
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      if (reminder) {
        await updateReminder({
          reminderId: reminder.reminderId,
          ...formData,
        });
        showSnackbar("リマインダーを更新しました", "success");
      } else {
        await createReminder(formData);
        showSnackbar("リマインダーを作成しました", "success");
      }
      onClose();
    } catch (error) {
      showSnackbar("保存に失敗しました", "error");
    } finally {
      setSubmitting(false);
    }
  }, [
    validate,
    reminder,
    formData,
    createReminder,
    updateReminder,
    showSnackbar,
    onClose,
  ]);

  // ================================
  // レンダリング
  // ================================

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={reminder ? "リマインダー編集" : "新規リマインダー作成"}
      maxWidth="md"
    >
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, p: 2 }}>
          {/* 顧客選択 */}
          <FormControl fullWidth error={!!errors.customerId}>
            <InputLabel>顧客</InputLabel>
            <Select
              value={formData.customerId}
              onChange={(e) => handleChange("customerId", e.target.value)}
              label="顧客"
              sx={{ minHeight: 48 }}
            >
              <MenuItem value={0}>選択してください</MenuItem>
              {customers.map((customer) => (
                <MenuItem key={customer.customerId} value={customer.customerId}>
                  {customer.companyName}
                </MenuItem>
              ))}
            </Select>
            {errors.customerId && (
              <FormHelperText>{errors.customerId}</FormHelperText>
            )}
          </FormControl>

          {/* タイトル */}
          <Input
            label="タイトル"
            value={formData.title}
            onChange={(e) => handleChange("title", e.target.value)}
            error={!!errors.title}
            helperText={errors.title}
            placeholder="例: 外壁塗装メンテナンス推奨"
            required
          />

          {/* メッセージテンプレート */}
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              メッセージテンプレート:
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {MESSAGE_TEMPLATES.map((template, index) => (
                <Button
                  key={index}
                  size="small"
                  variant="outlined"
                  onClick={() => handleTemplateApply(template.template)}
                  disabled={!formData.customerId}
                >
                  {template.label}
                </Button>
              ))}
            </Box>
          </Box>

          {/* メッセージ */}
          <Input
            label="メッセージ"
            value={formData.message}
            onChange={(e) => handleChange("message", e.target.value)}
            error={!!errors.message}
            helperText={errors.message}
            multiline
            rows={8}
            placeholder="リマインダーメッセージを入力してください"
            required
          />

          {/* 送信予定日 */}
          <DatePicker
            label="送信予定日"
            value={formData.reminderDate}
            onChange={(date) => handleChange("reminderDate", date)}
            slotProps={{
              textField: {
                error: !!errors.reminderDate,
                helperText: errors.reminderDate,
                fullWidth: true,
              },
            }}
          />

          {/* メモ */}
          <Input
            label="メモ（オプション）"
            value={formData.notes || ""}
            onChange={(e) => handleChange("notes", e.target.value)}
            multiline
            rows={3}
            placeholder="内部用のメモ"
          />

          {/* プレビュー */}
          {formData.message && (
            <Alert severity="info">
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                <strong>プレビュー:</strong>
                <br />
                {formData.message}
              </Typography>
            </Alert>
          )}

          {/* アクションボタン */}
          <Box
            sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 3 }}
          >
            <Button onClick={onClose} disabled={submitting}>
              キャンセル
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "保存中..." : "保存"}
            </Button>
          </Box>
        </Box>
      </LocalizationProvider>
    </Modal>
  );
};

export default ReminderForm;
