/**
 * CustomerFormPage.tsx
 *
 * 【50代向け新規顧客登録ページ】
 *
 * 50代後半の建築系自営業者向けCRMツールの新規顧客登録専用ページ。
 * CustomerListPageのFABボタンから遷移し、クリーンで分かりやすい
 * 入力フォームで新規顧客（工務店）を登録します。
 *
 * 【主な機能】
 * ✅ 新規顧客登録フォーム
 * ✅ useCustomerFormフック完全活用
 * ✅ リアルタイムバリデーション
 * ✅ 入力必須項目の明確な表示
 * ✅ 保存成功後は詳細ページへ自動遷移
 *
 * 【50代配慮】
 * - 大きな入力フィールド（最小44px高）
 * - 読みやすいラベル（16px以上）
 * - 明確なエラーメッセージ
 * - シンプルなレイアウト
 * - 分かりやすい必須マーク（*）
 * - 大きな保存・キャンセルボタン
 *
 * 【useCustomerFormフックとの連携】
 * - formData: フォーム入力値の管理
 * - errors: バリデーションエラー表示
 * - handleChange: 入力変更ハンドラー
 * - handleSubmit: フォーム送信処理
 * - isSubmitting: 送信中状態管理
 */

import {
  ArrowBack as ArrowBackIcon,
  Business as BusinessIcon,
  Cancel as CancelIcon,
  Email as EmailIcon,
  LocationOn as LocationOnIcon,
  Notes as NotesIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";

// Custom Components
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";

// Custom Hooks
import { useApp } from "../contexts/AppContext";
import { useCustomerForm } from "../hooks/useCustomerForm";

// Design System
import { FONT_SIZES, SPACING, BUTTON_SIZE } from "../constants/uiDesignSystem";

// ================================
// 定数定義
// ================================

/**
 * 50代向けレスポンシブ設定
 *
 * 画面サイズに応じた最適な表示を提供:
 * - モバイル: 縦方向レイアウト、大きなボタン
 * - デスクトップ: 2カラムレイアウト、効率的な入力
 */
const RESPONSIVE_SETTINGS = {
  mobile: {
    fontSize: parseInt(FONT_SIZES.body.mobile),
    inputHeight: BUTTON_SIZE.minHeight.mobile,
    buttonHeight: BUTTON_SIZE.minHeight.mobile,
  },
  desktop: {
    fontSize: parseInt(FONT_SIZES.body.desktop),
    inputHeight: BUTTON_SIZE.minHeight.desktop,
    buttonHeight: BUTTON_SIZE.minHeight.desktop,
  },
};

/**
 * 50代向けメッセージ定義
 *
 * 【設計原則】
 * - 専門用語を避けた優しい日本語
 * - 具体的な例を含む
 * - ユーザーの不安を解消する表現
 */
const MESSAGES = {
  pageTitle: "新規顧客登録",
  pageSubtitle: "新しい顧客（工務店）の情報を入力してください",

  success: {
    created: "顧客情報を登録しました",
  },

  error: {
    saveFailed:
      "登録に失敗しました。入力内容を確認してもう一度お試しください。",
  },

  info: {
    requiredFields: "※ 必須の項目は必ず入力してください",
    cancelConfirm: "入力内容が保存されていません。本当にキャンセルしますか？",
  },

  labels: {
    companyName: "会社名",
    contactPerson: "担当者名",
    phone: "電話番号",
    email: "メールアドレス",
    address: "住所",
    notes: "備考",
  },

  placeholders: {
    companyName: "例：山田工務店",
    contactPerson: "例：山田太郎",
    phone: "例：03-1234-5678",
    email: "例：yamada@example.com",
    address: "例：東京都新宿区○○1-2-3",
    notes: "特記事項があれば入力してください",
  },

  buttons: {
    save: "登録する",
    cancel: "キャンセル",
    back: "戻る",
  },
};

// ================================
// メインコンポーネント
// ================================

/**
 * CustomerFormPage - 新規顧客登録ページ
 *
 * 【実装のポイント】
 *
 * 1. useCustomerFormフックの完全活用
 *    - 新規登録モード（mode: 'create'）
 *    - フォーム状態管理
 *    - バリデーション
 *    - 保存処理
 *
 * 2. 50代向けフォーム設計
 *    - 大きな入力フィールド
 *    - 明確なラベルと例示
 *    - リアルタイムエラー表示
 *    - 必須項目の視覚的な強調
 *
 * 3. スムーズなユーザーフロー
 *    - 保存成功 → 詳細ページへ自動遷移
 *    - キャンセル → 確認後に顧客一覧へ戻る
 *    - エラー → 分かりやすいメッセージ表示
 *
 * 4. レスポンシブ対応
 *    - モバイル: 1カラム、縦方向レイアウト
 *    - デスクトップ: 2カラム、効率的な入力
 */
export const CustomerFormPage: React.FC = () => {
  // ================================
  // Hooks
  // ================================

  const navigate = useNavigate();
  const { showSnackbar } = useApp();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  /**
   * useCustomerFormフック
   *
   * 新規登録モード（mode: 'create'）で使用。
   * フォーム入力、バリデーション、保存処理を一元管理。
   */
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
    mode: "create",
  });

  // ================================
  // レスポンシブ設定
  // ================================

  const responsiveSettings = isMobile
    ? RESPONSIVE_SETTINGS.mobile
    : RESPONSIVE_SETTINGS.desktop;

  // ================================
  // イベントハンドラー
  // ================================

  /**
   * キャンセルボタンハンドラー
   *
   * 入力内容がある場合は確認ダイアログを表示。
   * 50代ユーザーの誤操作を防止。
   */
  const handleCancel = useCallback(() => {
    // 入力内容があるかチェック
    if (hasChanges) {
      // 確認ダイアログ表示
      const confirmed = window.confirm(MESSAGES.info.cancelConfirm);
      if (!confirmed) {
        return;
      }
    }

    // 顧客一覧ページへ戻る
    navigate("/customers");
  }, [hasChanges, navigate]);

  /**
   * フォーム送信ハンドラー
   *
   * useCustomerFormのhandleSubmitをラップし、
   * 成功時の遷移処理を追加。
   */
  const handleFormSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      try {
        // フォーム送信
        await handleSubmit(e);

        // 成功メッセージ表示
        showSnackbar(MESSAGES.success.created, "success");

        // 顧客一覧ページに戻る
        // （新規作成した顧客のIDがない場合は一覧に戻る）
        navigate("/customers");
      } catch (error) {
        // エラーメッセージ表示
        const errorMessage =
          error instanceof Error ? error.message : MESSAGES.error.saveFailed;
        showSnackbar(errorMessage, "error");
        console.error("❌ 顧客登録エラー:", error);
      }
    },
    [handleSubmit, showSnackbar, navigate],
  );

  // ================================
  // レンダリング: ページヘッダー
  // ================================

  const renderPageHeader = () => (
    <Box>
      {/* 戻るボタン */}
      <Box sx={{ mb: SPACING.gap.medium }}>
        <Button
          variant="outlined"
          onClick={handleCancel}
          startIcon={<ArrowBackIcon />}
          sx={{ minHeight: BUTTON_SIZE.minHeight.desktop }}
        >
          {MESSAGES.buttons.back}
        </Button>
      </Box>

      {/* ページタイトル */}
      <PageHeader title={MESSAGES.pageTitle} subtitle={MESSAGES.pageSubtitle} />
    </Box>
  );

  // ================================
  // レンダリング: 必須項目の注意書き
  // ================================

  const renderRequiredFieldsNote = () => (
    <Alert severity="info" sx={{ mb: SPACING.gap.large }}>
      <Typography
        variant="body2"
        sx={{ fontSize: responsiveSettings.fontSize }}
      >
        {MESSAGES.info.requiredFields}
      </Typography>
    </Alert>
  );

  // ================================
  // レンダリング: フォーム入力フィールド
  // ================================

  const renderFormFields = () => (
    <Grid container spacing={SPACING.gap.large}>
      {/* 会社名（必須） */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: SPACING.gap.small,
              mb: SPACING.gap.small,
            }}
          >
            <BusinessIcon color="primary" />
            <Typography
              variant="subtitle1"
              sx={{
                fontSize: responsiveSettings.fontSize,
                fontWeight: 600,
              }}
            >
              {MESSAGES.labels.companyName}
            </Typography>
            <Chip label="必須" size="small" color="error" />
          </Box>
          <Input
            fullWidth
            name="companyName"
            value={formData.companyName || ""}
            onChange={(e) => handleChange("companyName", e.target.value)}
            error={!!errors.companyName}
            helperText={errors.companyName}
            placeholder={MESSAGES.placeholders.companyName}
            inputsize="large"
          />
        </Box>
      </Grid>

      {/* 担当者名 */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: SPACING.gap.small,
              mb: SPACING.gap.small,
            }}
          >
            <PersonIcon color="primary" />
            <Typography
              variant="subtitle1"
              sx={{
                fontSize: responsiveSettings.fontSize,
                fontWeight: 600,
              }}
            >
              {MESSAGES.labels.contactPerson}
            </Typography>
          </Box>
          <Input
            fullWidth
            name="contactPerson"
            value={formData.contactPerson || ""}
            onChange={(e) => handleChange("contactPerson", e.target.value)}
            error={!!errors.contactPerson}
            helperText={errors.contactPerson}
            placeholder={MESSAGES.placeholders.contactPerson}
            inputsize="large"
          />
        </Box>
      </Grid>

      {/* 電話番号 */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: SPACING.gap.small,
              mb: SPACING.gap.small,
            }}
          >
            <PhoneIcon color="primary" />
            <Typography
              variant="subtitle1"
              sx={{
                fontSize: responsiveSettings.fontSize,
                fontWeight: 600,
              }}
            >
              {MESSAGES.labels.phone}
            </Typography>
          </Box>
          <Input
            fullWidth
            name="phone"
            type="tel"
            value={formData.phone || ""}
            onChange={(e) => handleChange("phone", e.target.value)}
            error={!!errors.phone}
            helperText={errors.phone}
            placeholder={MESSAGES.placeholders.phone}
            inputsize="large"
          />
        </Box>
      </Grid>

      {/* メールアドレス */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: SPACING.gap.small,
              mb: SPACING.gap.small,
            }}
          >
            <EmailIcon color="primary" />
            <Typography
              variant="subtitle1"
              sx={{
                fontSize: responsiveSettings.fontSize,
                fontWeight: 600,
              }}
            >
              {MESSAGES.labels.email}
            </Typography>
          </Box>
          <Input
            fullWidth
            name="email"
            type="email"
            value={formData.email || ""}
            onChange={(e) => handleChange("email", e.target.value)}
            error={!!errors.email}
            helperText={errors.email}
            placeholder={MESSAGES.placeholders.email}
            inputsize="large"
          />
        </Box>
      </Grid>

      {/* 住所 */}
      <Grid size={{ xs: 12 }}>
        <Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: SPACING.gap.small,
              mb: SPACING.gap.small,
            }}
          >
            <LocationOnIcon color="primary" />
            <Typography
              variant="subtitle1"
              sx={{
                fontSize: responsiveSettings.fontSize,
                fontWeight: 600,
              }}
            >
              {MESSAGES.labels.address}
            </Typography>
          </Box>
          <Input
            fullWidth
            name="address"
            value={formData.address || ""}
            onChange={(e) => handleChange("address", e.target.value)}
            error={!!errors.address}
            helperText={errors.address}
            placeholder={MESSAGES.placeholders.address}
            inputsize="large"
          />
        </Box>
      </Grid>

      {/* 備考 */}
      <Grid size={{ xs: 12 }}>
        <Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: SPACING.gap.small,
              mb: SPACING.gap.small,
            }}
          >
            <NotesIcon color="primary" />
            <Typography
              variant="subtitle1"
              sx={{
                fontSize: responsiveSettings.fontSize,
                fontWeight: 600,
              }}
            >
              {MESSAGES.labels.notes}
            </Typography>
          </Box>
          <Input
            fullWidth
            name="notes"
            value={formData.notes || ""}
            onChange={(e) => handleChange("notes", e.target.value)}
            error={!!errors.notes}
            helperText={errors.notes}
            multiline
            rows={4}
            placeholder={MESSAGES.placeholders.notes}
            inputsize="medium"
          />
        </Box>
      </Grid>
    </Grid>
  );

  // ================================
  // レンダリング: アクションボタン
  // ================================

  const renderActionButtons = () => (
    <Box
      sx={{
        display: "flex",
        gap: SPACING.gap.medium,
        justifyContent: "center",
        flexDirection: isMobile ? "column" : "row",
        mt: SPACING.section.desktop,
      }}
    >
      {/* キャンセルボタン */}
      <Button
        variant="outlined"
        size="large"
        onClick={handleCancel}
        disabled={isSubmitting}
        startIcon={<CancelIcon />}
        sx={{
          minWidth: isMobile ? "100%" : 200,
          minHeight: responsiveSettings.buttonHeight,
          fontSize: responsiveSettings.fontSize,
        }}
      >
        {MESSAGES.buttons.cancel}
      </Button>

      {/* 登録ボタン */}
      <Button
        variant="contained"
        size="large"
        type="submit"
        disabled={isSubmitting || !isValid}
        startIcon={isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
        sx={{
          minWidth: isMobile ? "100%" : 200,
          minHeight: responsiveSettings.buttonHeight,
          fontSize: responsiveSettings.fontSize,
        }}
      >
        {isSubmitting ? "登録中..." : MESSAGES.buttons.save}
      </Button>
    </Box>
  );

  // ================================
  // メインレンダー
  // ================================

  return (
    <Container maxWidth="md" sx={{ py: SPACING.page.desktop }}>
      {/* ページヘッダー */}
      {renderPageHeader()}

      {/* フォームカード */}
      <Card>
        <Box component="form" onSubmit={handleFormSubmit} noValidate>
          {/* 必須項目の注意書き */}
          {renderRequiredFieldsNote()}

          {/* フォーム入力フィールド */}
          {renderFormFields()}

          {/* アクションボタン */}
          {renderActionButtons()}
        </Box>
      </Card>
    </Container>
  );
};

export default CustomerFormPage;

/**
 * 【50代ユーザー向け設計のポイント】
 *
 * 1. クリーンなフォーム設計
 *    - 新規登録に特化したシンプルな構成
 *    - 余計な情報を排除
 *    - 必要な項目のみに集中
 *
 * 2. 明確な入力ガイド
 *    - 各項目に具体例を提示
 *    - 必須項目の視覚的な強調
 *    - リアルタイムエラー表示
 *
 * 3. 誤操作の防止
 *    - キャンセル時の確認ダイアログ
 *    - 大きなボタンで誤タップ防止
 *    - 送信中の二重クリック防止
 *
 * 4. スムーズなフロー
 *    - 保存成功後は自動で一覧ページへ
 *    - キャンセルで顧客一覧に戻る
 *    - エラー時の親切なメッセージ
 *
 * 5. レスポンシブ対応
 *    - モバイル: 縦方向レイアウト
 *    - デスクトップ: 2カラムで効率的
 *    - 各デバイスに最適化された表示
 *
 * この実装により、50代の建築系自営業者が迷うことなく
 * 新規顧客を登録できる、使いやすいページが完成します。
 */
