/**
 * SettingsPage.tsx
 *
 * 【設定ページ】
 *
 * データ連携、バックアップ、アプリ設定を管理するページ。
 * Phase 3A: ジョブカン連携のためのCSVエクスポート機能を提供。
 *
 * 【50代配慮】
 * - タブ形式で機能を整理
 * - 大きなボタンと分かりやすいラベル
 * - 使い方の説明を表示
 * - 視覚的なフィードバック（ローディング表示）
 */

import {
  Box,
  CircularProgress,
  Container,
  Paper,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { useState } from 'react';

// Icons
import BackupIcon from '@mui/icons-material/Backup';
import DownloadIcon from '@mui/icons-material/Download';
import SettingsIcon from '@mui/icons-material/Settings';

// Components
import PageHeader from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';

// Contexts
import { useCSV } from '../contexts/CSVContext';

// Design System
import { BUTTON_SIZE, FONT_SIZES, SPACING } from '../constants/uiDesignSystem';

/**
 * 設定ページメインコンポーネント
 */
export default function SettingsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [currentTab, setCurrentTab] = useState(0);
  const { loading, exportCustomersCSV } = useCSV();

  /**
   * タブ変更ハンドラー
   */
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  /**
   * 顧客データCSVエクスポートハンドラー
   */
  const handleExportCustomers = async () => {
    await exportCustomersCSV();
  };

  return (
    <Container maxWidth="lg">
      <PageHeader
        title="設定"
        subtitle="データ連携、バックアップ、アプリ設定"
        breadcrumbs={[
          // { label: 'ホーム', path: '/' },
          { label: '設定', path: '/settings' },
        ]}
      />

      <Paper
        sx={{
          mb: SPACING.gap.large,
          overflow: 'hidden',
        }}>
        {/* タブヘッダー */}
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant={isMobile ? 'fullWidth' : 'standard'}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              fontSize: FONT_SIZES.body.desktop,
              py: SPACING.gap.medium,
              minHeight: BUTTON_SIZE.minHeight.tablet,
            },
          }}>
          <Tab
            label="データ連携"
            icon={<DownloadIcon />}
            iconPosition="start"
          />
          <Tab
            label="バックアップ"
            icon={<BackupIcon />}
            iconPosition="start"
          />
          <Tab
            label="アプリ設定"
            icon={<SettingsIcon />}
            iconPosition="start"
          />
        </Tabs>

        {/* タブ1: データ連携 */}
        {currentTab === 0 && (
          <Box
            sx={{ p: { xs: SPACING.card.mobile, md: SPACING.card.desktop } }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontSize: FONT_SIZES.cardTitle.desktop,
                fontWeight: 'bold',
                mb: SPACING.gap.large,
              }}>
              ジョブカン連携
            </Typography>

            <Box sx={{ mb: SPACING.section.desktop }}>
              <Typography
                variant="body1"
                sx={{
                  fontSize: FONT_SIZES.body.desktop,
                  mb: SPACING.gap.medium,
                  color: 'text.secondary',
                  lineHeight: 1.8,
                }}>
                CRMの顧客データをジョブカン形式のCSVファイルに出力します。
                <br />
                出力したCSVファイルをジョブカンでインポートできます。
              </Typography>

              <Button
                variant="contained"
                size="large"
                startIcon={
                  loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <DownloadIcon />
                  )
                }
                onClick={handleExportCustomers}
                disabled={loading}
                sx={{
                  fontSize: FONT_SIZES.body.desktop,
                  py: 2,
                  px: 4,
                  minHeight: BUTTON_SIZE.minHeight.desktop,
                }}>
                {loading ? 'エクスポート中...' : '顧客データをCSV出力'}
              </Button>
            </Box>

            {/* 使い方の説明 */}
            <Box
              sx={{
                p: SPACING.card.desktop,
                bgcolor: 'info.light',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'info.main',
              }}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: FONT_SIZES.body.desktop,
                  color: 'text.primary',
                  lineHeight: 1.8,
                }}>
                <strong>使い方:</strong>
                <br />
                1. 「顧客データをCSV出力」ボタンをクリック
                <br />
                2. 保存先を選択（デスクトップがおすすめ）
                <br />
                3. ジョブカンで「顧客インポート」から出力したCSVを読み込み
              </Typography>
            </Box>
          </Box>
        )}

        {/* タブ2: バックアップ（Phase 3B で実装予定） */}
        {currentTab === 1 && (
          <Box
            sx={{ p: { xs: SPACING.card.mobile, md: SPACING.card.desktop } }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontSize: FONT_SIZES.cardTitle.desktop,
                fontWeight: 'bold',
                mb: SPACING.gap.large,
              }}>
              データバックアップ
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: FONT_SIZES.body.desktop,
                color: 'text.secondary',
              }}>
              この機能は次回のアップデートで実装予定です。
            </Typography>
          </Box>
        )}

        {/* タブ3: アプリ設定（Phase 3B で実装予定） */}
        {currentTab === 2 && (
          <Box
            sx={{ p: { xs: SPACING.card.mobile, md: SPACING.card.desktop } }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontSize: FONT_SIZES.cardTitle.desktop,
                fontWeight: 'bold',
                mb: SPACING.gap.large,
              }}>
              アプリ設定
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: FONT_SIZES.body.desktop,
                color: 'text.secondary',
              }}>
              この機能は次回のアップデートで実装予定です。
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
}
