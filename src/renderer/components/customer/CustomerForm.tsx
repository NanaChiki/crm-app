/**
 * CustomerForm.tsx
 *
 * 【50代向け顧客基本情報編集コンポーネント】
 *
 * 顧客の基本情報を表示・編集するための専用コンポーネント。
 * インライン編集機能により、表示モードと編集モードを
 * シームレスに切り替え可能。50代ユーザーが安心して
 * 操作できる分かりやすいUI設計。
 *
 * 【主な機能】
 * ✅ 表示モード・編集モード切り替え
 * ✅ リアルタイムバリデーション
 * ✅ useCustomerFormフック完全連携
 * ✅ 顧客情報サマリー表示
 * ✅ 未保存変更の検知・通知
 * ✅ 削除機能（確認ダイアログ付き）
 *
 * 【50代配慮】
 * - 大きなボタン・入力フィールド（44px以上）
 * - 読みやすいフォントサイズ（16px以上）
 * - 明確な編集状態表示
 * - 親切な日本語バリデーションメッセージ
 * - 操作確認ダイアログ
 */

import {
  AccountBalance as AccountBalanceIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  LocationOn as LocationOnIcon,
  Notes as NotesIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Save as SaveIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Chip,
  Grid,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

// // Custom Hooks & Contexts
import { useApp } from '../../contexts/AppContext';
import { useCustomer } from '../../contexts/CustomerContext';
import { useCustomerForm } from '../../hooks/useCustomerForm';

// // Components
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';

// Types
import { Customer } from '../../../types';
import { useServiceRecords } from '../../hooks/useServiceRecords';

// ================================
// 型定義・定数
// ================================
interface CustomerFormProps {
  /** 表示・編集対象の顧客データ */
  customer: Customer;
  /** 未保存変更の通知コールバック */
  onUnsavedChanges: (hasChanges: boolean) => void;
}

interface EditState {
  isEditing: boolean;
  showDeleteDialog: boolean;
}

// ================================
// エラーメッセージ定義（50代配慮）
// ================================
const MESSAGES = {
  success: {
    save: '顧客情報を保存しました。',
    delete: '顧客情報を削除しました。',
  },
  error: {
    save: '保存に失敗しました。もう一度お試しください。',
    delete: '削除に失敗しました。もう一度お試しください。',
    required: '必須項目を入力してください。',
  },
  confirm: {
    delete:
      'この顧客情報を削除してもよろしいですか？\n関連するサービス履歴もすべて削除されます。',
    unsavedChanges: '変更内容が保存されていません。編集を中止しますか？',
  },
  info: {
    editMode: '編集モードです。変更後は必ず保存してください。',
    viewMode: '表示モードです。編集する場合は編集ボタンを押してください。',
  },
} as const;

// ================================
// ユーティリティ関数
// ================================

/**
 * 日付フォーマット（50代向け和暦表示）
 */
const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('ja-JP-u-ca-japanese', {
    era: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date);
};

/**
 * 金額フォーマット（50代向けわかりやすい表示 - ）
 */
const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0,
  }).format(amount);
};

// ================================
// メインコンポーネント
// ================================
export const CustomerForm: React.FC<CustomerFormProps> = ({
  customer,
  onUnsavedChanges,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // ================================
  // 状態管理
  // ================================
  const [editState, setEditState] = useState<EditState>({
    isEditing: false,
    showDeleteDialog: false,
  });

  // ================================
  // Context API連携
  // ================================
  const { updateCustomer, deleteCustomer } = useCustomer();
  const { showSnackbar } = useApp();

  // サービス履歴データ（統計表示用）
  const { serviceRecords } = useServiceRecords({
    customerId: customer?.customerId,
    autoLoad: true,
  });

  // 編集フォーム管理
  const {
    formData,
    errors,
    isSubmitting,
    isValid,
    hasChanges,
    handleChange,
    handleSubmit,
    resetForm,
  } = useCustomerForm({
    mode: 'edit',
    initialCustomer: customer,
  });

  // ================================
  // 計算値・メモ化データ
  // ================================

  /**
   * 顧客統計データ計算
   * @returns totalServices, totalAmount, latestServiceDate
   */
  const customerStats = useMemo(() => {
    const totalServices = serviceRecords.length;
    const totalAmount = serviceRecords.reduce(
      (sum, service) => sum + (service.amount ? Number(service.amount) : 0),
      0
    );

    const lastServiceDate =
      serviceRecords.length > 0
        ? serviceRecords[serviceRecords.length - 1].serviceDate
        : null;

    return {
      totalServices,
      totalAmount,
      lastServiceDate,
    };
  }, [serviceRecords]);

  /**
   * レスポンシブ設定
   */
  const responsiveSettings = useMemo(
    () => ({
      buttonSize: isMobile ? 'large' : 'medium',
      fontSize: isMobile ? '18px' : '16px',
      contentPadding: isMobile ? 2 : 3,
      cardSpacing: isMobile ? 2 : 3,
    }),
    [isMobile]
  );

  // ================================
  // 副作用処理
  // ================================

  /**
   * 未保存変更の親コンポーネントへの通知
   */
  useEffect(() => {
    onUnsavedChanges(hasChanges && editState.isEditing);
  }, [hasChanges, editState.isEditing, onUnsavedChanges]);

  /**
   * 顧客データ変更時のフォームリセット
   */
  useEffect(() => {
    if (!editState.isEditing) {
      resetForm();
    }
  }, [customer?.customerId, resetForm, editState.isEditing]);

  // ================================
  // イベントハンドラー
  // ================================

  /**
   * 編集モード切り替え
   */
  const handleEditToggle = useCallback(() => {
    if (editState.isEditing && hasChanges) {
      const confirmed = window.confirm(MESSAGES.confirm.unsavedChanges);
      if (!confirmed) {
        return;
      }
      resetForm();
    }

    setEditState((prev) => ({ ...prev, isEditing: !prev.isEditing }));

    if (!editState.isEditing && !hasChanges) {
      showSnackbar(MESSAGES.info.editMode, 'info');
    } else {
      showSnackbar(MESSAGES.info.viewMode, 'info');
    }
  }, [editState.isEditing, hasChanges, resetForm, showSnackbar]);

  /**
   * 保存処理
   */
  const handleSave = useCallback(async () => {
    try {
      await handleSubmit();
      setEditState((prev) => ({ ...prev, isEditing: false }));
      showSnackbar(MESSAGES.success.save, 'success');
    } catch (error) {
      showSnackbar(MESSAGES.error.save, 'error');
    }
  }, [handleSubmit, showSnackbar]);

  /**
   * 削除処理
   */
  const handleDelete = useCallback(async () => {
    const confirmed = window.confirm(MESSAGES.confirm.delete);
    if (!confirmed) {
      return;
    }

    try {
      await deleteCustomer(customer?.customerId);
      showSnackbar(MESSAGES.success.delete, 'success');
      // 削除成功時は親コンポーネント（ページ）がナビゲーション処理を行う
    } catch (error) {
      showSnackbar(MESSAGES.error.delete, 'error');
    }
    setEditState((prev) => ({ ...prev, showDeleteDialog: false }));
  }, [deleteCustomer, customer?.customerId, showSnackbar]);

  // ================================
  // サブコンポーネント定義
  // ================================

  /**
   * 編集モード制御ボタン群（50代向けモバイル対応）
   */
  const renderActionButtons = () => (
    <Stack
      direction="row"
      spacing={isMobile ? 1 : 2}
      sx={{
        width: isMobile ? '100%' : 'auto',
        alignItems: 'stretch',
      }}>
      {editState.isEditing ? (
        <>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            loading={isSubmitting}
            disabled={isSubmitting || !isValid}
            startIcon={<SaveIcon />}
            sx={{
              minHeight: '48px',
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: 'bold',
              px: isMobile ? 2 : 2,
              flex: isMobile ? 1 : 'none',
            }}>
            {isSubmitting ? '保存中...' : '保存'}
          </Button>
          <Button
            variant="outlined"
            onClick={handleEditToggle}
            disabled={isSubmitting}
            sx={{
              minHeight: '48px',
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: 'bold',
              px: isMobile ? 2 : 2,
              flex: isMobile ? 1 : 'none',
            }}>
            キャンセル
          </Button>
        </>
      ) : (
        <>
          <Button
            variant="contained"
            onClick={handleEditToggle}
            startIcon={<EditIcon />}
            sx={{
              minHeight: '48px',
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: 'bold',
              px: isMobile ? 2 : 2,
              flex: isMobile ? 1 : 'none',
            }}>
            編集
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() =>
              setEditState((prev) => ({ ...prev, showDeleteDialog: true }))
            }
            startIcon={<DeleteIcon />}
            sx={{
              minHeight: '48px',
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: 'bold',
              px: isMobile ? 2 : 2,
              flex: isMobile ? 1 : 'none',
            }}>
            削除
          </Button>
        </>
      )}
    </Stack>
  );

  /**
   * フィールド表示コンポーネント
   */
  const renderField = (
    icon: React.ReactNode,
    label: string,
    fieldName: keyof typeof formData,
    isRequired: boolean = false,
    type: 'text' | 'email' | 'tel' | 'multiline' = 'text',
    placeholder: string,
    rows?: number
  ) => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        {icon}
        <Typography variant="h6" sx={{ fontSize: responsiveSettings.fontSize }}>
          {label}
        </Typography>
        {isRequired && <Chip label="必須" size="small" color="error" />}
      </Box>

      {editState.isEditing ? (
        <Input
          fullWidth
          type={type === 'multiline' ? 'text' : type}
          multiline={type === 'multiline'}
          rows={rows || (type === 'multiline' ? 3 : 1)}
          value={String(formData[fieldName] || '')}
          onChange={(e) => handleChange(fieldName, e.target.value)}
          error={!!errors[fieldName]}
          helperText={errors[fieldName]}
          placeholder={placeholder}
          inputsize="large"
        />
      ) : (
        <Typography
          variant={fieldName === 'companyName' ? 'h4' : 'body1'}
          sx={{
            fontSize: fieldName === 'companyName' ? '24px' : '18px',
            fontWeight: fieldName === 'companyName' ? 'bold' : 'normal',
            color:
              fieldName === 'companyName'
                ? theme.palette.primary.dark
                : 'text.primary',
            fontFamily:
              fieldName === 'phone' || fieldName === 'email'
                ? 'monospace'
                : 'inherit',
            whiteSpace: type === 'multiline' ? 'pre-wrap' : 'normal',
          }}>
          {String(customer[fieldName as keyof Customer] || '未設定')}
        </Typography>
      )}
    </Box>
  );

  /**
   * 顧客統計サマリー（50代向け完全レスポンシブカードレイアウト）
   */
  const renderCustomerSummary = () => (
    <Box sx={{ mt: 4 }}>
      <Typography
        variant="h6"
        sx={{
          mb: 3,
          fontSize: isMobile ? '20px' : '18px',
          fontWeight: 'bold',
        }}>
        📊 顧客情報サマリー
      </Typography>
      <Grid
        container
        spacing={isMobile ? 2 : 3}
        sx={{ display: 'flex', alignItems: 'stretch' }}>
        {/* 登録日 */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            cardsize="small"
            sx={{
              height: '100%',
              minHeight: '180px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Box
              sx={{
                textAlign: 'center',
                p: isMobile ? 2.5 : 3,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                height: '100%',
              }}>
              <CalendarIcon
                sx={{
                  fontSize: isMobile ? 38 : 42,
                  color: theme.palette.primary.main,
                  mb: 1.5,
                  display: 'block',
                  mx: 'auto',
                }}
              />
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 1.5,
                  fontSize: isMobile ? '16px' : '15px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}>
                登録日
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: isMobile ? '14px' : '13px',
                  lineHeight: 1.4,
                  textAlign: 'center',
                }}>
                {formatDate(customer.createdAt)}
              </Typography>
            </Box>
          </Card>
        </Grid>

        {/* サービス回数 */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            cardsize="small"
            sx={{
              height: '100%',
              minHeight: '180px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Box
              sx={{
                textAlign: 'center',
                p: isMobile ? 2.5 : 3,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                height: '100%',
              }}>
              <CalendarIcon
                sx={{
                  fontSize: isMobile ? 38 : 42,
                  color: theme.palette.success.main,
                  mb: 1.5,
                  display: 'block',
                  mx: 'auto',
                }}
              />
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 1.5,
                  fontSize: isMobile ? '16px' : '15px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}>
                サービス回数
              </Typography>
              <Typography
                variant="h5"
                color="primary"
                sx={{
                  fontWeight: 'bold',
                  fontSize: isMobile ? '22px' : '20px',
                  textAlign: 'center',
                }}>
                {customerStats.totalServices}回
              </Typography>
            </Box>
          </Card>
        </Grid>

        {/* 累計売上 */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            cardsize="small"
            sx={{
              height: '100%',
              minHeight: '180px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Box
              sx={{
                textAlign: 'center',
                p: isMobile ? 2.5 : 3,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                height: '100%',
              }}>
              <AccountBalanceIcon
                sx={{
                  fontSize: isMobile ? 38 : 42,
                  color: theme.palette.warning.main,
                  mb: 1.5,
                  display: 'block',
                  mx: 'auto',
                }}
              />
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 1.5,
                  fontSize: isMobile ? '16px' : '15px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}>
                累計売上
              </Typography>
              <Typography
                variant="h5"
                color="primary"
                sx={{
                  fontWeight: 'bold',
                  fontSize: isMobile ? '20px' : '18px',
                  textAlign: 'center',
                }}>
                {formatAmount(customerStats.totalAmount)}
              </Typography>
            </Box>
          </Card>
        </Grid>

        {/* 最終サービス日 */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            cardsize="small"
            sx={{
              height: '100%',
              minHeight: '180px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Box
              sx={{
                textAlign: 'center',
                p: isMobile ? 2.5 : 3,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                height: '100%',
              }}>
              <TrendingUpIcon
                sx={{
                  fontSize: isMobile ? 38 : 42,
                  color: theme.palette.info.main,
                  mb: 1.5,
                  display: 'block',
                  mx: 'auto',
                }}
              />
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 1.5,
                  fontSize: isMobile ? '16px' : '15px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}>
                最終サービス日
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: isMobile ? '14px' : '13px',
                  lineHeight: 1.4,
                  textAlign: 'center',
                }}>
                {customerStats.lastServiceDate
                  ? formatDate(new Date(customerStats.lastServiceDate))
                  : 'サービス未実施'}
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  // ================================
  // メインレンダー
  // ================================

  return (
    <Box sx={{ p: responsiveSettings.contentPadding }}>
      {/* ヘッダー（50代向けモバイル対応） */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: isMobile ? 2 : 0,
          mb: 3,
        }}>
        <Typography
          variant="h5"
          sx={{
            fontSize: isMobile ? '20px' : '24px',
            fontWeight: 'bold',
            textAlign: isMobile ? 'center' : 'left',
            mb: isMobile ? 0 : 0,
          }}>
          顧客基本情報
        </Typography>
        {renderActionButtons()}
      </Box>

      {/* 編集状態表示 */}
      {editState.isEditing && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">{MESSAGES.info.editMode}</Typography>
        </Alert>
      )}

      {/* バリデーションエラー表示 */}
      {editState.isEditing && Object.keys(errors).length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {MESSAGES.error.required}
          </Typography>
        </Alert>
      )}

      {/* 顧客情報フォーム */}
      <Card>
        <Grid container spacing={4}>
          {/* 会社名 */}
          <Grid size={{ xs: 12, md: 6 }}>
            {renderField(
              <BusinessIcon color="primary" />,
              '会社名',
              'companyName',
              true,
              'text',
              '例：田中株式会社'
            )}
          </Grid>

          {/* 担当者名 */}
          <Grid size={{ xs: 12, md: 6 }}>
            {renderField(
              <PersonIcon color="primary" />,
              '担当者名',
              'contactPerson',
              false,
              'text',
              '例：田中太郎'
            )}
          </Grid>

          {/* 電話番号 */}
          <Grid size={{ xs: 12, md: 6 }}>
            {renderField(
              <PhoneIcon color="primary" />,
              '電話番号',
              'phone',
              false,
              'tel',
              '例：03-1234-5678'
            )}
          </Grid>

          {/* メールアドレス */}
          <Grid size={{ xs: 12, md: 6 }}>
            {renderField(
              <EmailIcon color="primary" />,
              'メールアドレス',
              'email',
              false,
              'email',
              '例：tanaka@example.com'
            )}
          </Grid>

          {/* 住所 */}
          <Grid size={{ xs: 12, md: 6 }}>
            {renderField(
              <LocationOnIcon color="primary" />,
              '住所',
              'address',
              false,
              'multiline',
              '例：東京都渋谷区〇〇1-2-3',
              2
            )}
          </Grid>

          {/* 備考 */}
          <Grid size={{ xs: 12 }}>
            {renderField(
              <NotesIcon color="primary" />,
              '備考',
              'notes',
              false,
              'multiline',
              '特記事項やメモをご記入ください',
              3
            )}
          </Grid>
        </Grid>
      </Card>

      {/* 顧客統計サマリー */}
      {renderCustomerSummary()}

      {/* 削除確認ダイアログ（50代向けモバイル対応） */}
      <Modal
        open={editState.showDeleteDialog}
        onClose={() =>
          setEditState((prev) => ({ ...prev, showDeleteDialog: false }))
        }
        title="顧客削除の確認"
        modalsize="small"
        sx={{
          '& .MuiDialog-paper': {
            margin: isMobile ? '16px' : '32px',
            maxWidth: isMobile ? 'calc(100vw - 32px)' : '400px',
            width: isMobile ? 'calc(100vw - 32px)' : '400px',
            maxHeight: isMobile ? 'calc(100vh - 64px)' : 'auto',
            borderRadius: '12px',
          },
        }}>
        <Box
          sx={{
            textAlign: 'center',
            p: isMobile ? 3 : 2,
          }}>
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              color: theme.palette.error.main,
              fontSize: isMobile ? '18px' : '16px',
              fontWeight: 'bold',
            }}>
            ⚠️ 重要な操作です
          </Typography>
          <Typography
            variant="body1"
            sx={{
              mb: 3,
              whiteSpace: 'pre-line',
              fontSize: isMobile ? '16px' : '14px',
              lineHeight: 1.5,
              fontWeight: 'bold',
            }}>
            {MESSAGES.confirm.delete}
          </Typography>
          <Stack
            direction={isMobile ? 'column' : 'row'}
            spacing={2}
            justifyContent="center"
            sx={{
              alignItems: isMobile ? 'stretch' : 'center',
              gap: isMobile ? 2 : 0,
            }}>
            <Button
              variant="outlined"
              onClick={() =>
                setEditState((prev) => ({ ...prev, showDeleteDialog: false }))
              }
              sx={{
                minHeight: '48px',
                fontSize: isMobile ? '16px' : '14px',
                fontWeight: 'bold',
                px: isMobile ? 3 : 2,
                order: isMobile ? 2 : 1,
              }}>
              キャンセル
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDelete}
              startIcon={<DeleteIcon />}
              sx={{
                minHeight: '48px',
                fontSize: isMobile ? '16px' : '14px',
                fontWeight: 'bold',
                px: isMobile ? 3 : 2,
                order: isMobile ? 1 : 2,
              }}>
              削除
            </Button>
          </Stack>
        </Box>
      </Modal>
    </Box>
  );
};

export default CustomerForm;

/**
 * 【50代ユーザー向け設計のポイント】
 *
 * 1. 編集モード制御
 *    - 明確な編集状態表示（Alert使用）
 *    - 保存・キャンセルボタンの分かりやすい配置
 *    - 未保存変更の確認ダイアログ
 *
 * 2. フォームバリデーション
 *    - リアルタイムバリデーション
 *    - 50代向け親切な日本語メッセージ
 *    - 必須項目の明確な表示
 *
 * 3. 視覚的配慮
 *    - 大きなボタン（44px以上）
 *    - 読みやすいフォントサイズ（16px以上）
 *    - アイコンによる直感的な項目識別
 *
 * 4. 顧客情報サマリー
 *    - 重要な統計情報を視覚的に表示
 *    - カード形式で分かりやすく整理
 *    - 日本語の和暦表示対応
 *
 * 5. レスポンシブ対応
 *    - モバイル・タブレット・デスクトップ最適化
 *    - デバイス別のボタンサイズ調整
 *    - 画面サイズに応じたレイアウト変更
 *
 * この実装により、50代の建築系自営業者が安心して
 * 顧客情報を編集・管理できる環境が完成します。
 */
