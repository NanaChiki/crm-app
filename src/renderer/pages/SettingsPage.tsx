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

import BackupIcon from '@mui/icons-material/Backup';
import BugReportIcon from '@mui/icons-material/BugReport';
import CodeIcon from '@mui/icons-material/Code';
import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';
import EmailIcon from '@mui/icons-material/Email';
import GitHubIcon from '@mui/icons-material/GitHub';
import HelpIcon from '@mui/icons-material/Help';
import InfoIcon from '@mui/icons-material/Info';
import LanguageIcon from '@mui/icons-material/Language';
import RestoreIcon from '@mui/icons-material/Restore';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Link,
  Button as MuiButton,
  Paper,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

import type { AppVersions } from '../../types/global';
import { DataStatistics } from '../components/backup/DataStatistics';
import PageHeader from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { BUTTON_SIZE, FONT_SIZES, SPACING } from '../constants/uiDesignSystem';
import { useBackup } from '../contexts/BackupContext';
import { useCSV } from '../contexts/CSVContext';

/**
 * アプリ設定タブコンポーネント
 *
 * 【機能】
 * - アプリケーション情報表示（バージョン、ビルド日、技術情報）
 * - 開発者情報表示（名前、メール、GitHub/Webサイトリンク）
 * - ライセンス情報表示（MIT License、著作権、全文ダイアログ）
 * - サポート情報表示（マニュアル、バグ報告、機能リクエスト）
 *
 * 【50代配慮】
 * - 大きなフォント（sectionTitle: 24px）
 * - カードレイアウトで情報整理
 * - アイコン付きボタンで視認性向上
 * - 外部リンクは新しいウィンドウで開く
 */
function AppSettingsTab() {
  const [versions, setVersions] = useState<AppVersions | null>(null);
  const [licenseDialogOpen, setLicenseDialogOpen] = useState(false);

  // バージョン情報取得
  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const versionInfo = await window.appAPI.getVersions();
        setVersions(versionInfo);
      } catch (error) {
        console.error('バージョン情報の取得に失敗しました:', error);
      }
    };
    fetchVersions();
  }, []);

  // 外部リンクを開く（システムデフォルトブラウザで開く）
  const openExternalLink = async (url: string) => {
    try {
      await window.appAPI.openExternal(url);
    } catch (error) {
      console.error('外部リンクを開けませんでした:', error);
    }
  };

  return (
    <Box sx={{ p: { xs: SPACING.card.mobile, md: SPACING.card.desktop } }}>
      {/* アプリ情報セクション */}
      <Typography
        variant="h5"
        sx={{
          mb: SPACING.gap.medium,
          fontWeight: 'bold',
          fontSize: {
            xs: FONT_SIZES.sectionTitle.mobile,
            md: FONT_SIZES.sectionTitle.desktop,
          },
        }}>
        ℹ️ アプリ情報
      </Typography>

      <Card sx={{ mb: SPACING.section.desktop }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <InfoIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 'bold',
                fontSize: FONT_SIZES.cardTitle.desktop,
              }}>
              アプリケーション詳細
            </Typography>
          </Box>

          <Box sx={{ pl: 4 }}>
            <Typography
              variant="body1"
              sx={{ mb: 1, fontSize: FONT_SIZES.body.desktop }}>
              <strong>アプリ名:</strong> 建築事業者向けCRM
            </Typography>
            <Typography
              variant="body1"
              sx={{ mb: 1, fontSize: FONT_SIZES.body.desktop }}>
              <strong>バージョン:</strong> {versions?.app || '読み込み中...'}
            </Typography>
            <Typography
              variant="body1"
              sx={{ mb: 1, fontSize: FONT_SIZES.body.desktop }}>
              <strong>ビルド日:</strong> 2025年10月28日
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography
              variant="body2"
              sx={{
                mb: 1,
                fontWeight: 'bold',
                color: 'text.secondary',
                fontSize: FONT_SIZES.label.desktop,
              }}>
              技術情報
            </Typography>
            <Typography
              variant="body2"
              sx={{
                mb: 0.5,
                color: 'text.secondary',
                fontSize: FONT_SIZES.label.desktop,
              }}>
              Electron: {versions?.electron || '読み込み中...'}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                mb: 0.5,
                color: 'text.secondary',
                fontSize: FONT_SIZES.label.desktop,
              }}>
              Node.js: {versions?.node || '読み込み中...'}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: FONT_SIZES.label.desktop,
              }}>
              Chromium: {versions?.chrome || '読み込み中...'}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* 開発者情報セクション */}
      <Typography
        variant="h5"
        sx={{
          mb: SPACING.gap.medium,
          fontWeight: 'bold',
          fontSize: {
            xs: FONT_SIZES.sectionTitle.mobile,
            md: FONT_SIZES.sectionTitle.desktop,
          },
        }}>
        👨‍💻 開発者情報
      </Typography>

      <Card sx={{ mb: SPACING.section.desktop }}>
        <CardContent>
          <Typography
            variant="body1"
            sx={{ mb: 1, fontSize: FONT_SIZES.body.desktop }}>
            <strong>開発者:</strong> 山本大翔（Daito Yamamoto）
          </Typography>
          <Typography
            variant="body1"
            sx={{ mb: 2, fontSize: FONT_SIZES.body.desktop }}>
            <strong>メールアドレス:</strong>{' '}
            <Link
              href="mailto:crm.tool.construction@gmail.com"
              sx={{ color: 'primary.main', textDecoration: 'none' }}>
              crm.tool.construction@gmail.com
            </Link>
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <MuiButton
              variant="outlined"
              startIcon={<GitHubIcon />}
              onClick={() =>
                openExternalLink('https://github.com/NanaChiki/crm-app')
              }
              sx={{
                minHeight: BUTTON_SIZE.minHeight.desktop,
                fontSize: FONT_SIZES.body.desktop,
              }}>
              GitHub
            </MuiButton>
            <MuiButton
              variant="outlined"
              startIcon={<LanguageIcon />}
              onClick={() =>
                openExternalLink('https://crm-landing-page-ten.vercel.app/')
              }
              sx={{
                minHeight: BUTTON_SIZE.minHeight.desktop,
                fontSize: FONT_SIZES.body.desktop,
              }}>
              ウェブサイト
            </MuiButton>
            <MuiButton
              variant="outlined"
              startIcon={<EmailIcon />}
              onClick={() => openExternalLink('mailto:nanachiki256@gmail.com')}
              sx={{
                minHeight: BUTTON_SIZE.minHeight.desktop,
                fontSize: FONT_SIZES.body.desktop,
              }}>
              メールを送る
            </MuiButton>
          </Box>
        </CardContent>
      </Card>

      {/* ライセンス情報セクション */}
      <Typography
        variant="h5"
        sx={{
          mb: SPACING.gap.medium,
          fontWeight: 'bold',
          fontSize: {
            xs: FONT_SIZES.sectionTitle.mobile,
            md: FONT_SIZES.sectionTitle.desktop,
          },
        }}>
        📄 ライセンス情報
      </Typography>

      <Card sx={{ mb: SPACING.section.desktop }}>
        <CardContent>
          <Typography
            variant="body1"
            sx={{ mb: 1, fontSize: FONT_SIZES.body.desktop }}>
            <strong>ライセンス:</strong> MIT License
          </Typography>
          <Typography
            variant="body1"
            sx={{ mb: 2, fontSize: FONT_SIZES.body.desktop }}>
            <strong>著作権:</strong> © 2025 山本大翔
          </Typography>

          <MuiButton
            variant="outlined"
            startIcon={<DescriptionIcon />}
            onClick={() => setLicenseDialogOpen(true)}
            sx={{
              minHeight: BUTTON_SIZE.minHeight.desktop,
              fontSize: FONT_SIZES.body.desktop,
            }}>
            ライセンス全文を表示
          </MuiButton>
        </CardContent>
      </Card>

      {/* サポート情報セクション */}
      <Typography
        variant="h5"
        sx={{
          mb: SPACING.gap.medium,
          fontWeight: 'bold',
          fontSize: {
            xs: FONT_SIZES.sectionTitle.mobile,
            md: FONT_SIZES.sectionTitle.desktop,
          },
        }}>
        🆘 サポート情報
      </Typography>

      <Card>
        <CardContent>
          <Typography
            variant="body1"
            sx={{
              mb: 2,
              fontSize: FONT_SIZES.body.desktop,
              lineHeight: 1.8,
            }}>
            困ったときは以下のリソースをご利用ください。
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
              gap: 2,
            }}>
            <MuiButton
              variant="outlined"
              startIcon={<HelpIcon />}
              onClick={() =>
                openExternalLink('https://github.com/NanaChiki/crm-app/wiki')
              }
              sx={{
                minHeight: BUTTON_SIZE.minHeight.desktop,
                fontSize: FONT_SIZES.body.desktop,
                justifyContent: 'flex-center',
                px: 3,
              }}>
              使い方マニュアル（準備中）
            </MuiButton>
            <MuiButton
              variant="outlined"
              startIcon={<BugReportIcon />}
              onClick={() =>
                openExternalLink(
                  'https://github.com/NanaChiki/crm-app/issues/new?template=bug_report.md'
                )
              }
              sx={{
                minHeight: BUTTON_SIZE.minHeight.desktop,
                fontSize: FONT_SIZES.body.desktop,
                justifyContent: 'flex-center',
                px: 3,
              }}>
              バグを報告する
            </MuiButton>
            <MuiButton
              variant="outlined"
              startIcon={<CodeIcon />}
              onClick={() =>
                openExternalLink(
                  'https://github.com/NanaChiki/crm-app/issues/new?template=feature_request.md'
                )
              }
              sx={{
                minHeight: BUTTON_SIZE.minHeight.desktop,
                fontSize: FONT_SIZES.body.desktop,
                justifyContent: 'flex-center',
                px: 3,
              }}>
              機能をリクエストする
            </MuiButton>
          </Box>
        </CardContent>
      </Card>

      {/* ライセンス全文ダイアログ */}
      <Dialog
        open={licenseDialogOpen}
        onClose={() => setLicenseDialogOpen(false)}
        maxWidth="md"
        fullWidth>
        <DialogTitle
          sx={{
            fontSize: FONT_SIZES.cardTitle.desktop,
            fontWeight: 'bold',
          }}>
          MIT License
        </DialogTitle>
        <DialogContent>
          <Typography
            variant="body2"
            component="pre"
            sx={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: FONT_SIZES.label.desktop,
              lineHeight: 1.6,
              color: 'text.primary',
            }}>
            {`MIT License

Copyright (c) 2025 山本大翔

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <MuiButton
            onClick={() => setLicenseDialogOpen(false)}
            sx={{
              minHeight: BUTTON_SIZE.minHeight.desktop,
              fontSize: FONT_SIZES.body.desktop,
            }}>
            閉じる
          </MuiButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

/**
 * 設定ページメインコンポーネント
 */
export default function SettingsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [currentTab, setCurrentTab] = useState(0);
  const { loading, exportCustomersCSV, exportServiceRecordsCSV } = useCSV();
  const { loading: backupLoading, createBackup, restoreBackup } = useBackup();

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

  /**
   * サービス履歴CSVエクスポートハンドラー
   */
  const handleExportServiceRecords = async () => {
    await exportServiceRecordsCSV();
  };

  return (
    <Container maxWidth="lg">
      <PageHeader
        title="設定"
        subtitle="データ連携、バックアップ、アプリ情報"
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
          />
          <Tab
            label="バックアップ"
            icon={<BackupIcon />}
          />
          <Tab
            label="アプリ情報"
            icon={<SettingsIcon />}
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

            {/* サービス履歴CSVエクスポート */}
            <Box sx={{ mb: SPACING.section.desktop }}>
              <Typography
                variant="body1"
                sx={{
                  fontSize: FONT_SIZES.body.desktop,
                  mb: SPACING.gap.medium,
                  color: 'text.secondary',
                  lineHeight: 1.8,
                }}>
                CRMのサービス履歴をジョブカン請求書作成用のCSVファイルに出力します。
                <br />
                出力したCSVファイルをジョブカンで参照、またはインポートできます。
              </Typography>

              <Button
                variant="contained"
                size="large"
                color="secondary"
                startIcon={
                  loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <DownloadIcon />
                  )
                }
                onClick={handleExportServiceRecords}
                disabled={loading}
                sx={{
                  fontSize: FONT_SIZES.body.desktop,
                  py: 2,
                  px: 4,
                  minHeight: BUTTON_SIZE.minHeight.desktop,
                }}>
                {loading ? 'エクスポート中...' : 'サービス履歴をCSV出力'}
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
                <br />
                <strong>📋 顧客データ:</strong>
                <br />
                1. 「顧客データをCSV出力」ボタンをクリック
                <br />
                2. 保存先を選択（デスクトップがおすすめ）
                <br />
                3. ジョブカンで「顧客インポート」から出力したCSVを読み込み
                <br />
                <br />
                <strong>📊 サービス履歴:</strong>
                <br />
                1. 「サービス履歴をCSV出力」ボタンをクリック
                <br />
                2. 保存先を選択（デスクトップがおすすめ）
                <br />
                3. ジョブカンで請求書作成時に参照、またはインポート
              </Typography>
            </Box>
          </Box>
        )}

        {/* タブ2: バックアップ */}
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

            {/* データ統計情報 */}
            <Box sx={{ mb: SPACING.section.desktop }}>
              <DataStatistics />
            </Box>

            {/* バックアップ作成 */}
            <Box sx={{ mb: SPACING.section.desktop }}>
              <Typography
                variant="body1"
                sx={{
                  fontSize: FONT_SIZES.body.desktop,
                  mb: SPACING.gap.medium,
                  color: 'text.secondary',
                  lineHeight: 1.8,
                }}>
                すべてのデータをZIPファイルにバックアップします。
                <br />
                定期的にバックアップを作成することをおすすめします。
              </Typography>

              <Button
                variant="contained"
                size="large"
                startIcon={
                  backupLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <BackupIcon />
                  )
                }
                onClick={createBackup}
                disabled={backupLoading}
                sx={{
                  fontSize: FONT_SIZES.body.desktop,
                  py: 2,
                  px: 4,
                  minHeight: BUTTON_SIZE.minHeight.desktop,
                }}>
                {backupLoading ? '作成中...' : 'バックアップを作成'}
              </Button>
            </Box>

            {/* バックアップから復元 */}
            <Box sx={{ mb: SPACING.section.desktop }}>
              <Typography
                variant="body1"
                sx={{
                  fontSize: FONT_SIZES.body.desktop,
                  mb: SPACING.gap.medium,
                  color: 'text.secondary',
                  lineHeight: 1.8,
                }}>
                バックアップファイルからデータを復元します。
                <br />
                現在のデータは削除されますのでご注意ください。
              </Typography>

              <Button
                variant="contained"
                size="large"
                color="warning"
                startIcon={
                  backupLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <RestoreIcon />
                  )
                }
                onClick={restoreBackup}
                disabled={backupLoading}
                sx={{
                  fontSize: FONT_SIZES.body.desktop,
                  py: 2,
                  px: 4,
                  minHeight: BUTTON_SIZE.minHeight.desktop,
                }}>
                {backupLoading ? '復元中...' : 'バックアップから復元'}
              </Button>
            </Box>

            {/* 注意事項 */}
            <Box
              sx={{
                p: SPACING.card.desktop,
                bgcolor: 'warning.light',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'warning.main',
              }}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: FONT_SIZES.body.desktop,
                  color: 'text.dark',
                  lineHeight: 1.8,
                }}>
                <strong>⚠️ 重要な注意事項:</strong>
                <br />
                <br />
                • バックアップファイルは安全な場所に保管してください
                <br />
                •
                定期的（週1回程度）にバックアップを作成することをおすすめします
                <br />
                • 復元前に自動で現在のデータがバックアップされます
                <br />• 復元後はアプリを再起動してください
              </Typography>
            </Box>
          </Box>
        )}

        {/* タブ3: アプリ設定 */}
        {currentTab === 2 && <AppSettingsTab />}
      </Paper>
    </Container>
  );
}
