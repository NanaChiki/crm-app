/**
 * SiteListPage - 物件リスト表示ページ
 *
 * 【目的】
 * メンテナンス時期を迎えた現場（物件）を一覧表示し、
 * 社長が自信を持ってお客様にアプローチできる営業リストを提供する
 *
 * 【50代向けUI設計】
 * - 年度選択: カレンダー風の大きなボタン（2025, 2026...）
 * - サービス種別選択: 屋根・外壁・雨樋の3つのトグルボタン
 * - 分かりやすいサマリー表示: 「〇〇件の現場が10年を迎えました」
 * - カードレイアウト: 1現場 = 1カード（視認性重視）
 * - 大きなボタン・フォント（BUTTON_SIZE.minHeight: 48px以上）
 *
 * 【ビジネス価値】
 * - 「屋根工事がそろそろ10年を迎えますよ」とアプローチできる
 * - 年度別・サービス種別別の営業リスト作成
 * - 印刷して持ち歩ける営業資料（Week 2実装予定）
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useSiteList } from '../hooks/useSiteList';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/layout/PageHeader';
import { FONT_SIZES, SPACING, GRID_LAYOUT } from '../constants/uiDesignSystem';
import type { MaintenanceServiceType } from '../../types/siteList';

/**
 * 物件リストページコンポーネント
 */
export const SiteListPage: React.FC = () => {
  const {
    filteredSites,
    yearSummaries,
    filters,
    setFilters,
    clearFilters,
    getTotalMaintenanceNeeded,
    loading,
    error,
  } = useSiteList();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedType, setSelectedType] = useState<MaintenanceServiceType | null>(null);

  /**
   * 年度選択ハンドラー
   */
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setFilters({ year });
  };

  /**
   * サービス種別選択ハンドラー
   */
  const handleTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newType: MaintenanceServiceType | null
  ) => {
    setSelectedType(newType);
    setFilters({ serviceType: newType || undefined });
  };

  // 年度別サマリー取得
  const currentYearSummary = yearSummaries.find((s) => s.year === selectedYear);

  // ローディング状態
  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', p: 6 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          物件リストを読み込んでいます...
        </Typography>
      </Box>
    );
  }

  // エラー状態
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <Typography variant="h6">エラーが発生しました</Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* ページヘッダー */}
      <PageHeader
        title="物件リスト"
        subtitle="メンテナンス時期を迎えた現場の一覧"
        breadcrumbs={[{ label: 'ホーム', path: '/' }, { label: '物件リスト' }]}
      />

      {/* お知らせバー */}
      <Box
        sx={{
          backgroundColor: 'primary.main',
          color: 'white',
          p: 2,
          borderRadius: 2,
          mb: 3,
          textAlign: 'center',
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 'bold',
            fontSize: {
              xs: FONT_SIZES.cardTitle.mobile,
              md: FONT_SIZES.cardTitle.desktop,
            },
          }}
        >
          🏗️ {getTotalMaintenanceNeeded()}件の現場がメンテナンス時期を迎えています
        </Typography>
      </Box>

      {/* 年度選択エリア */}
      <Card>
        <Box sx={{ p: { xs: SPACING.card.mobile, md: SPACING.card.desktop } }}>
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              fontSize: {
                xs: FONT_SIZES.sectionTitle.mobile,
                md: FONT_SIZES.sectionTitle.desktop,
              },
            }}
          >
            📅 年度を選択
          </Typography>

          <Grid container spacing={2}>
            {yearSummaries.slice(0, 5).map((summary) => (
              <Grid key={summary.year} size={{ xs: 6, sm: 4, md: 2.4 }}>
                <Button
                  variant={selectedYear === summary.year ? 'contained' : 'outlined'}
                  size="large"
                  onClick={() => handleYearChange(summary.year)}
                  fullWidth
                  sx={{
                    minHeight: 80,
                    flexDirection: 'column',
                    gap: 1,
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {summary.year}年
                  </Typography>
                  <Typography variant="caption">{summary.totalSites}件</Typography>
                </Button>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Card>

      {/* サービス種別選択エリア */}
      <Card sx={{ mt: 3 }}>
        <Box sx={{ p: { xs: SPACING.card.mobile, md: SPACING.card.desktop } }}>
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              fontSize: {
                xs: FONT_SIZES.sectionTitle.mobile,
                md: FONT_SIZES.sectionTitle.desktop,
              },
            }}
          >
            🏠 工事種類を選択
          </Typography>

          <ToggleButtonGroup
            value={selectedType}
            exclusive
            onChange={handleTypeChange}
            sx={{ width: '100%', flexWrap: 'wrap' }}
          >
            <ToggleButton
              value={null as unknown as string}
              sx={{
                flex: { xs: '1 1 100%', sm: '1 1 auto' },
                minHeight: 56,
                fontSize: FONT_SIZES.button.medium,
              }}
            >
              全て ({currentYearSummary?.totalSites || 0}件)
            </ToggleButton>
            <ToggleButton
              value="屋根"
              sx={{
                flex: { xs: '1 1 100%', sm: '1 1 auto' },
                minHeight: 56,
                fontSize: FONT_SIZES.button.medium,
              }}
            >
              🏠 屋根 ({currentYearSummary?.roof || 0}件)
            </ToggleButton>
            <ToggleButton
              value="外壁"
              sx={{
                flex: { xs: '1 1 100%', sm: '1 1 auto' },
                minHeight: 56,
                fontSize: FONT_SIZES.button.medium,
              }}
            >
              🎨 外壁 ({currentYearSummary?.wall || 0}件)
            </ToggleButton>
            <ToggleButton
              value="雨樋"
              sx={{
                flex: { xs: '1 1 100%', sm: '1 1 auto' },
                minHeight: 56,
                fontSize: FONT_SIZES.button.medium,
              }}
            >
              💧 雨樋 ({currentYearSummary?.gutter || 0}件)
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Card>

      {/* サマリー表示 */}
      {filteredSites.length > 0 && (
        <Box
          sx={{
            mt: 3,
            p: 3,
            backgroundColor: 'success.light',
            borderRadius: 2,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 'bold',
              color: 'success.dark',
              fontSize: {
                xs: FONT_SIZES.cardTitle.mobile,
                md: FONT_SIZES.cardTitle.desktop,
              },
            }}
          >
            {selectedType ? (
              <>
                {selectedType}工事が
                {filteredSites.length > 0 && filteredSites[0].yearsElapsed >= 10
                  ? '10年'
                  : filteredSites.length > 0 && filteredSites[0].yearsElapsed >= 7
                    ? '7年'
                    : filteredSites.length > 0 && filteredSites[0].yearsElapsed >= 5
                      ? '5年'
                      : ''}
                経過した現場が {filteredSites.length}件 あります
              </>
            ) : (
              <>
                {selectedYear}年までにメンテナンス時期を迎える現場が {filteredSites.length}件
                あります
              </>
            )}
          </Typography>
        </Box>
      )}

      {/* 物件リスト */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {filteredSites.map((site) => (
          <Grid key={site.recordId} size={GRID_LAYOUT.customerList}>
            <Card cardsize="medium">
              <Box sx={{ p: 2 }}>
                {/* 顧客名 + 緊急度バッジ */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontSize: FONT_SIZES.cardTitle.desktop,
                      fontWeight: 'bold',
                    }}
                  >
                    {site.companyName}
                  </Typography>
                  <Chip
                    label={
                      site.urgencyLevel === 'overdue'
                        ? '要対応'
                        : site.urgencyLevel === 'high'
                          ? '推奨時期'
                          : '検討時期'
                    }
                    color={
                      site.urgencyLevel === 'overdue'
                        ? 'error'
                        : site.urgencyLevel === 'high'
                          ? 'warning'
                          : 'info'
                    }
                    size="small"
                  />
                </Box>

                {/* サービス種別 */}
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 1,
                    fontSize: FONT_SIZES.body.desktop,
                  }}
                >
                  🏗️ {site.serviceType}工事
                </Typography>

                {/* 経過年数・次回推奨日 */}
                <Typography
                  variant="body2"
                  sx={{
                    mb: 1,
                    fontSize: FONT_SIZES.body.desktop,
                  }}
                >
                  📅 施工日:{' '}
                  {new Intl.DateTimeFormat('ja-JP').format(
                    typeof site.serviceDate === 'string'
                      ? new Date(site.serviceDate)
                      : site.serviceDate
                  )}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 'bold',
                    color: 'error.main',
                    mb: 1,
                    fontSize: FONT_SIZES.body.desktop,
                  }}
                >
                  ⏰ 経過年数: {site.yearsElapsed}年
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontSize: FONT_SIZES.body.desktop,
                  }}
                >
                  次回推奨:{' '}
                  {new Intl.DateTimeFormat('ja-JP').format(
                    typeof site.nextRecommendedDate === 'string'
                      ? new Date(site.nextRecommendedDate)
                      : site.nextRecommendedDate
                  )}
                </Typography>

                {/* 住所・連絡先 */}
                {site.address && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: 'block',
                      mt: 1,
                      fontSize: FONT_SIZES.label.desktop,
                    }}
                  >
                    📍 {site.address}
                  </Typography>
                )}
                {site.phone && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontSize: FONT_SIZES.label.desktop,
                    }}
                  >
                    📞 {site.phone}
                  </Typography>
                )}
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 空状態 */}
      {filteredSites.length === 0 && (
        <Card sx={{ mt: 3 }}>
          <Box sx={{ textAlign: 'center', p: 6 }}>
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                fontSize: {
                  xs: FONT_SIZES.cardTitle.mobile,
                  md: FONT_SIZES.cardTitle.desktop,
                },
              }}
            >
              条件に一致する現場がありません
            </Typography>
            <Button variant="outlined" size="large" onClick={clearFilters}>
              フィルターをクリア
            </Button>
          </Box>
        </Card>
      )}
    </Box>
  );
};
