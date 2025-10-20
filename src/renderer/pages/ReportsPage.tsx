/**
 * ReportsPage.tsx
 *
 * 【50代向け集計レポートページ】
 *
 * 50代後半の建築系自営業者向けCRMツールの集計レポートページ。
 * 年度別・顧客別の売上データを視覚的に表示し、事業分析や
 * 確定申告準備に活用します。
 */

import {
  Assessment as AssessmentIcon,
  CalendarToday as CalendarIcon,
  Download as DownloadIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Chip,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// Custom Components
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

// Custom Hooks
import { useApp } from '../contexts/AppContext';
import { useCustomer } from '../contexts/CustomerContext';
import { useServiceRecords } from '../hooks/useServiceRecords';

// Design System Constants
import { BUTTON_SIZE, FONT_SIZES, SPACING } from '../constants/uiDesignSystem';

// ================================
// 型定義
// ================================

interface MonthlyData {
  month: string;
  monthLabel: string;
  revenue: number;
  count: number;
}

interface CustomerSummary {
  customerId: number;
  companyName: string;
  totalRevenue: number;
  serviceCount: number;
  lastServiceDate: Date | null;
}

interface ServiceTypeSummary {
  serviceType: string;
  revenue: number;
  count: number;
  percentage: number;
  [key: string]: string | number;
}

interface YearSummary {
  year: number;
  totalRevenue: number;
  totalCount: number;
  averageRevenue: number;
  customerCount: number;
}

// ================================
// 定数定義
// ================================

const COLORS = {
  primary: '#1976d2',
  success: '#2e7d32',
  warning: '#ed6c02',
  error: '#d32f2f',
  info: '#0288d1',
  chartColors: [
    '#1976d2',
    '#2e7d32',
    '#ed6c02',
    '#9c27b0',
    '#d32f2f',
    '#0288d1',
    '#f57c00',
    '#7b1fa2',
    '#c62828',
    '#0277bd',
  ],
};

const MONTH_LABELS = [
  '1月',
  '2月',
  '3月',
  '4月',
  '5月',
  '6月',
  '7月',
  '8月',
  '9月',
  '10月',
  '11月',
  '12月',
];

const MESSAGES = {
  pageTitle: '集計レポート',
  pageSubtitle: '年度別・顧客別の売上データを確認できます',

  sections: {
    yearSummary: '年度サマリー',
    monthlyTrend: '月別売上推移',
    customerRanking: '顧客別売上ランキング',
    serviceTypeAnalysis: 'サービス種別分析',
  },

  labels: {
    selectYear: '表示年度',
    totalRevenue: '総売上',
    totalCount: '総サービス件数',
    averageRevenue: '平均単価',
    customerCount: '顧客数',
    exportCSV: 'CSV出力',
    print: '印刷',
  },

  info: {
    noData: '選択した年度のデータがありません',
  },
};

const RESPONSIVE_SETTINGS = {
  mobile: {
    fontSize: parseInt(FONT_SIZES.body.mobile),
    chartHeight: 250,
  },
  desktop: {
    fontSize: parseInt(FONT_SIZES.body.desktop),
    chartHeight: 300,
  },
};

// ================================
// ユーティリティ関数
// ================================

const formatCurrency = (amount: number): string => {
  return `¥${amount.toLocaleString('ja-JP')}`;
};

const formatPercentage = (value: number): string => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};

const getYearOptions = (): number[] => {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let year = 2020; year <= currentYear; year++) {
    years.push(year);
  }
  return years.reverse();
};

// ================================
// メインコンポーネント
// ================================

export const ReportsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { showSnackbar } = useApp();
  const { customers } = useCustomer();

  // 全サービス履歴を取得
  const { serviceRecords, refreshServiceRecords, loading } = useServiceRecords({
    autoLoad: true,
  });

  // データ更新用のリフレッシュボタンを追加
  const handleRefreshData = useCallback(async () => {
    // サイレントモード（silent=true）で更新してメッセージ重複を防ぐ
    await refreshServiceRecords(true);
    showSnackbar('データを更新しました。', 'success');
  }, [refreshServiceRecords, showSnackbar]);

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const responsiveSettings = isMobile
    ? RESPONSIVE_SETTINGS.mobile
    : RESPONSIVE_SETTINGS.desktop;

  // ================================
  // データ集計ロジック
  // ================================

  const yearServiceRecords = useMemo(() => {
    return serviceRecords.filter((record) => {
      const dateObj =
        typeof record.serviceDate === 'string'
          ? new Date(record.serviceDate)
          : record.serviceDate;
      const recordYear = dateObj.getFullYear();
      return recordYear === selectedYear;
    });
  }, [serviceRecords, selectedYear]);

  /**
   * 前年のサービス履歴をフィルタリング
   */
  const lastYearServiceRecords = useMemo(() => {
    return serviceRecords.filter((record) => {
      const dateObj =
        typeof record.serviceDate === 'string'
          ? new Date(record.serviceDate)
          : record.serviceDate;
      const recordYear = dateObj.getFullYear();
      return recordYear === selectedYear - 1;
    });
  }, [serviceRecords, selectedYear]);

  /**
   * 年度サマリー計算
   */
  const yearSummary = useMemo((): YearSummary => {
    const totalRevenue = yearServiceRecords.reduce(
      (sum, record) => sum + (Number(record.amount) || 0),
      0
    );

    const totalCount = yearServiceRecords.length;
    const averageRevenue = totalCount > 0 ? totalRevenue / totalCount : 0;

    const customerIds = new Set(
      yearServiceRecords.map((record) => record.customerId)
    );
    const customerCount = customerIds.size;

    return {
      year: selectedYear,
      totalRevenue,
      totalCount,
      averageRevenue,
      customerCount,
    };
  }, [yearServiceRecords, selectedYear]);

  /**
   * 前年比計算
   */
  const yearComparison = useMemo(() => {
    const lastYearRevenue = lastYearServiceRecords.reduce(
      (sum, record) => sum + (Number(record.amount) || 0),
      0
    );

    if (lastYearRevenue === 0) {
      return null;
    }

    const changePercentage =
      ((yearSummary.totalRevenue - lastYearRevenue) / lastYearRevenue) * 100;

    return {
      lastYearRevenue,
      changePercentage,
      isIncrease: changePercentage >= 0,
    };
  }, [yearSummary.totalRevenue, lastYearServiceRecords]);

  /**
   * 月別集計データ
   */
  const monthlyData = useMemo((): MonthlyData[] => {
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    return months.map((month) => {
      const monthRecords = yearServiceRecords.filter((record) => {
        const dateObj =
          typeof record.serviceDate === 'string'
            ? new Date(record.serviceDate)
            : record.serviceDate;
        const recordMonth = dateObj.getMonth() + 1;
        return recordMonth === month;
      });

      const revenue = monthRecords.reduce(
        (sum, record) => sum + (Number(record.amount) || 0),
        0
      );

      return {
        month: month.toString().padStart(2, '0'),
        monthLabel: MONTH_LABELS[month - 1],
        revenue,
        count: monthRecords.length,
      };
    });
  }, [yearServiceRecords]);

  /**
   * 顧客別集計データ（上位10位）
   */
  const customerSummaries = useMemo((): CustomerSummary[] => {
    const summaryMap = new Map<number, CustomerSummary>();

    yearServiceRecords.forEach((record) => {
      const customerId = record.customerId;

      if (!summaryMap.has(customerId)) {
        const customer = customers.find((c) => c.customerId === customerId);
        summaryMap.set(customerId, {
          customerId,
          companyName: customer?.companyName || '不明',
          totalRevenue: 0,
          serviceCount: 0,
          lastServiceDate: null,
        });
      }

      const summary = summaryMap.get(customerId)!;
      summary.totalRevenue += Number(record.amount) || 0;
      summary.serviceCount += 1;

      const serviceDate =
        typeof record.serviceDate === 'string'
          ? new Date(record.serviceDate)
          : record.serviceDate;
      if (!summary.lastServiceDate || serviceDate > summary.lastServiceDate) {
        summary.lastServiceDate = serviceDate;
      }
    });

    // 売上順にソート、上位10位のみ
    return Array.from(summaryMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);
  }, [yearServiceRecords, customers]);

  /**
   * サービス種別集計データ
   */
  const serviceTypeSummaries = useMemo((): ServiceTypeSummary[] => {
    const summaryMap = new Map<string, ServiceTypeSummary>();
    const totalRevenue = yearSummary.totalRevenue;

    yearServiceRecords.forEach((record) => {
      const serviceType = record.serviceType || 'その他';

      if (!summaryMap.has(serviceType)) {
        summaryMap.set(serviceType, {
          serviceType,
          revenue: 0,
          count: 0,
          percentage: 0,
        });
      }

      const summary = summaryMap.get(serviceType)!;
      summary.revenue += Number(record.amount) || 0;
      summary.count += 1;
    });
    // パーセンテージ計算
    summaryMap.forEach((summary) => {
      summary.percentage =
        totalRevenue > 0 ? (summary.revenue / totalRevenue) * 100 : 0;
    });

    return Array.from(summaryMap.values()).sort(
      (a, b) => b.revenue - a.revenue
    );
  }, [yearServiceRecords, yearSummary.totalRevenue]);

  // ================================
  // イベントハンドラー
  // ================================

  /**
   * 年度選択変更ハンドラー
   */
  const handleYearChange = useCallback((event: SelectChangeEvent<number>) => {
    setSelectedYear(Number(event.target.value));
  }, []);

  /**
   * CSV出力ハンドラー (確定申告対応版)
   */
  /**
   * CSV出力ハンドラー（確定申告対応版）
   */
  const handleExportCSV = useCallback(() => {
    try {
      let csv = '';

      // ===========================================
      // 1. タイトルと基本情報
      // ===========================================
      csv += `年度別売上レポート（確定申告用）\n`;
      csv += `作成日,${new Date().toLocaleDateString('ja-JP')}\n`;
      csv += `対象年度,${selectedYear}年\n\n`;

      // ===========================================
      // 2. サマリー情報
      // ===========================================
      csv += `【年度サマリー】\n`;
      csv += `項目,金額・件数\n`;
      csv += `総売上,${formatCurrency(yearSummary.totalRevenue)}\n`;
      csv += `総サービス件数,${yearSummary.totalCount}件\n`;
      csv += `平均単価,${formatCurrency(
        Math.round(yearSummary.averageRevenue)
      )}\n`;
      csv += `取引顧客数,${yearSummary.customerCount}社\n`;

      if (yearComparison) {
        csv += `前年度総売上,${formatCurrency(
          yearComparison.lastYearRevenue
        )}\n`;
        csv += `前年比,${formatPercentage(yearComparison.changePercentage)}\n`;
      }
      csv += `\n\n`;

      // ===========================================
      // 3. 月別売上明細（確定申告用）
      // ===========================================
      csv += `【月別売上明細】\n`;
      csv += `月,売上,件数,累計売上\n`;

      let cumulativeRevenue = 0;
      monthlyData.forEach((month) => {
        cumulativeRevenue += month.revenue;
        csv += `${month.monthLabel},${month.revenue.toLocaleString()},${
          month.count
        },${cumulativeRevenue.toLocaleString()}\n`;
      });
      csv += `\n\n`;

      // ===========================================
      // 4. 顧客別売上ランキング
      // ===========================================
      csv += `【顧客別売上ランキング】\n`;
      csv += `順位,会社名,売上,構成比,サービス件数,最終取引日\n`;

      customerSummaries.forEach((summary, index) => {
        const percentage =
          yearSummary.totalRevenue > 0
            ? ((summary.totalRevenue / yearSummary.totalRevenue) * 100).toFixed(
                1
              )
            : '0.0';
        const lastDate = summary.lastServiceDate
          ? new Date(summary.lastServiceDate).toLocaleDateString('ja-JP')
          : '-';

        csv += `${index + 1},${
          summary.companyName
        },${summary.totalRevenue.toLocaleString()},${percentage}%,${
          summary.serviceCount
        },${lastDate}\n`;
      });
      csv += `\n\n`;

      // ===========================================
      // 5. サービス種別分析
      // ===========================================
      csv += `【サービス種別分析】\n`;
      csv += `サービス種別,売上,構成比,件数,平均単価\n`;

      serviceTypeSummaries.forEach((summary) => {
        const avgAmount =
          summary.count > 0 ? Math.round(summary.revenue / summary.count) : 0;

        csv += `${
          summary.serviceType
        },${summary.revenue.toLocaleString()},${summary.percentage.toFixed(
          1
        )}%,${summary.count},${avgAmount.toLocaleString()}\n`;
      });
      csv += `\n\n`;

      // ===========================================
      // 6. 詳細取引履歴（確定申告の証拠資料）
      // ===========================================
      csv += `【詳細取引履歴】\n`;
      csv += `No,日付,顧客名,サービス種別,サービス内容,金額,ステータス\n`;

      yearServiceRecords
        .sort((a, b) => {
          const dateA =
            typeof a.serviceDate === 'string'
              ? new Date(a.serviceDate)
              : a.serviceDate;
          const dateB =
            typeof b.serviceDate === 'string'
              ? new Date(b.serviceDate)
              : b.serviceDate;
          return dateA.getTime() - dateB.getTime();
        })
        .forEach((record, index) => {
          const dateObj =
            typeof record.serviceDate === 'string'
              ? new Date(record.serviceDate)
              : record.serviceDate;
          const date = dateObj.toLocaleDateString('ja-JP');
          const customer = customers.find(
            (c) => c.customerId === record.customerId
          );
          const companyName = customer?.companyName || '不明';
          const serviceType = record.serviceType || 'その他';
          const description = (record.serviceDescription || '')
            .replace(/,/g, '，')
            .replace(/\n/g, ' ');
          const amount = record.amount
            ? Number(record.amount).toLocaleString()
            : '0';
          const status = record.status || 'completed';

          csv += `${
            index + 1
          },${date},${companyName},${serviceType},"${description}",${amount},${status}\n`;
        });

      // ===========================================
      // 7. CSV出力
      // ===========================================

      // BOM付きUTF-8でエンコード（Excel対応）
      const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
      const blob = new Blob([bom, csv], { type: 'text/csv;charset=utf-8;' });

      // ダウンロード
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `売上レポート_${selectedYear}年_${
        new Date().toISOString().split('T')[0]
      }.csv`;
      link.click();

      showSnackbar('確定申告用CSVファイルをダウンロードしました。', 'success');
    } catch (error) {
      console.error('CSV出力エラー:', error);
      showSnackbar('CSV出力に失敗しました。', 'error');
    }
  }, [
    selectedYear,
    yearSummary,
    yearComparison,
    monthlyData,
    customerSummaries,
    serviceTypeSummaries,
    yearServiceRecords,
    customers,
    showSnackbar,
  ]);

  /**
   * 印刷ハンドラー
   */
  const handlePrint = useCallback(() => {
    // 印刷用のレイアウトを作成
    const printStyles = `
        @media print {
            /* ヘッダー・ナビゲーションを非表示 */
            header, nav, .MuiAppBar-root {
                display: none !important;
            }

            /* ボタン・PageHeader・年度選択を非表示 */
            button, 
            .no-print,
            .MuiBox-root:has(> .MuiTypography-h4),
            .MuiFormControl-root,
            .MuiSelect-root,
            .MuiInputLabel-root {
                display: none !important;
            }

            /* ページ設定 */
            body {
                margin: 0;
                padding: 20px;
            }

            /* カラー設定 (インク節約) */
            * {
                color: black !important;
                background: white !important;
            }

            /* グラフは表示 */
            svg {
                display: block !important;
            }

            /* テーブルの境界線 */
            table, th, td {
                border: 1px solid black !important;
            }

            /* 改ページ制御 */
            .MuiCard-root {
                page-bread-inside: avoid;
                margin-bottom: 20px;
            }

            /* レポートタイトルを印刷用に追加 */
            body::before {
                content: "年度別売上レポート - ${selectedYear}年";
                display: block;
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 20px;
                text-align: center;
            }
        }
    `;

    // スタイルを一時的に追加
    const styleElement = document.createElement('style');
    styleElement.textContent = printStyles;
    document.head.appendChild(styleElement);

    // 印刷実行
    window.print();

    // 印刷後にスタイルを削除
    setTimeout(() => {
      document.head.removeChild(styleElement);
    }, 1000);
  }, [selectedYear]);

  // ================================
  // レンダリング
  // ================================

  /**
   * ページヘッダー
   */
  const renderPageHeader = () => (
    <PageHeader
      title={MESSAGES.pageTitle}
      subtitle={MESSAGES.pageSubtitle}
      breadcrumbs={[
        {
          label: '集計レポート',
          path: '/reports',
          icon: <AssessmentIcon />,
        },
      ]}
      actions={
        <Box
          sx={{ display: 'flex', gap: SPACING.gap.medium, flexWrap: 'wrap' }}
          className="no-print">
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefreshData}
            disabled={loading}>
            {loading ? 'データ更新中...' : 'データ更新'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportCSV}
            disabled={yearServiceRecords.length === 0}>
            {MESSAGES.labels.exportCSV}
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            disabled={yearServiceRecords.length === 0}>
            {MESSAGES.labels.print}
          </Button>
        </Box>
      }
    />
    // <Box sx={{ mb: 3 }}>
    //   <Box
    //     sx={{
    //       display: 'flex',
    //       justifyContent: 'space-between',
    //       alignItems: isMobile ? 'flex-start' : 'center',
    //       flexDirection: isMobile ? 'column' : 'row',
    //       gap: 2,
    //       mb: 2,
    //     }}>
    //     <Box>
    //       <Typography
    //         variant="h4"
    //         sx={{
    //           fontSize: { xs: '24px', md: '28px' },
    //           fontWeight: 'bold',
    //           mb: 1,
    //         }}>
    //         {MESSAGES.pageTitle}
    //       </Typography>
    //       <Typography
    //         variant="body1"
    //         color="text.secondary"
    //         sx={{ fontSize: { xs: '14px', md: '16px' } }}>
    //         {MESSAGES.pageSubtitle}
    //       </Typography>
    //     </Box>

    //     <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
    //       <Button
    //         variant="outlined"
    //         startIcon={<DownloadIcon />}
    //         onClick={handleExportCSV}
    //         disabled={yearServiceRecords.length === 0}>
    //         {MESSAGES.labels.exportCSV}
    //       </Button>
    //       <Button
    //         variant="outlined"
    //         startIcon={<PrintIcon />}
    //         onClick={handlePrint}
    //         disabled={yearServiceRecords.length === 0}>
    //         {MESSAGES.labels.print}
    //       </Button>
    //     </Box>
    //   </Box>
    // </Box>
  );

  // ================================
  // レンダリング: 年度選択
  // ================================

  const renderYearSelector = () => (
    <Box sx={{ mb: SPACING.gap.large }}>
      <FormControl sx={{ minWidth: 200 }}>
        <InputLabel>{MESSAGES.labels.selectYear}</InputLabel>
        <Select
          value={selectedYear}
          onChange={handleYearChange}
          label={MESSAGES.labels.selectYear}
          sx={{
            fontSize: responsiveSettings.fontSize,
            '& .MuiSelect-select': {
              minHeight: BUTTON_SIZE.minHeight.tablet,
            },
          }}>
          {getYearOptions().map((year) => (
            <MenuItem key={year} value={year}>
              {year}年
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );

  // ================================
  // レンダリング: 年度サマリー
  // ================================
  const renderYearSummary = () => (
    <Card>
      <Typography
        variant="h6"
        sx={{
          mb: SPACING.gap.large,
          fontSize: FONT_SIZES.cardTitle.desktop,
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.gap.small,
        }}>
        <AssessmentIcon />
        {MESSAGES.sections.yearSummary}
      </Typography>

      <Grid container spacing={SPACING.gap.large}>
        {/* 総売上 */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: SPACING.gap.small }}>
              {MESSAGES.labels.totalRevenue}
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 'bold',
                color: COLORS.primary,
                fontSize: {
                  xs: FONT_SIZES.pageTitle.mobile,
                  md: FONT_SIZES.pageTitle.desktop,
                },
              }}>
              {formatCurrency(yearSummary.totalRevenue)}
            </Typography>
            {yearComparison && (
              <Chip
                icon={
                  yearComparison.isIncrease ? (
                    <TrendingUpIcon />
                  ) : (
                    <TrendingDownIcon />
                  )
                }
                label={formatPercentage(yearComparison.changePercentage)}
                color={yearComparison.isIncrease ? 'success' : 'error'}
                size="small"
                sx={{ mt: SPACING.gap.small }}
              />
            )}
          </Box>
        </Grid>

        {/* 総件数 */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: SPACING.gap.small }}>
              {MESSAGES.labels.totalCount}
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 'bold',
                color: COLORS.success,
                fontSize: {
                  xs: FONT_SIZES.pageTitle.mobile,
                  md: FONT_SIZES.pageTitle.desktop,
                },
              }}>
              {yearSummary.totalCount}件
            </Typography>
          </Box>
        </Grid>

        {/* 平均単価 */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: SPACING.gap.small }}>
              {MESSAGES.labels.averageRevenue}
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 'bold',
                color: COLORS.warning,
                fontSize: {
                  xs: FONT_SIZES.pageTitle.mobile,
                  md: FONT_SIZES.pageTitle.desktop,
                },
              }}>
              {formatCurrency(Math.round(yearSummary.averageRevenue))}
            </Typography>
          </Box>
        </Grid>

        {/* 顧客数 */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: SPACING.gap.small }}>
              {MESSAGES.labels.customerCount}
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 'bold',
                color: COLORS.info,
                fontSize: {
                  xs: FONT_SIZES.pageTitle.mobile,
                  md: FONT_SIZES.pageTitle.desktop,
                },
              }}>
              {yearSummary.customerCount}社
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
  // ================================
  // レンダリング: 月別売上推移グラフ
  // ================================
  const renderMonthlyTrendChart = () => (
    <Card>
      <Typography
        variant="h6"
        sx={{
          mb: SPACING.gap.large,
          fontSize: FONT_SIZES.cardTitle.desktop,
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.gap.small,
        }}>
        <CalendarIcon />
        {MESSAGES.sections.monthlyTrend}
      </Typography>

      <ResponsiveContainer width="100%" height={responsiveSettings.chartHeight}>
        <BarChart data={monthlyData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="monthLabel"
            style={{ fontSize: parseInt(FONT_SIZES.label.desktop) }}
          />
          <YAxis
            tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`}
            style={{ fontSize: parseInt(FONT_SIZES.label.desktop) }}
          />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{ fontSize: parseInt(FONT_SIZES.label.desktop) }}
          />
          <Legend
            wrapperStyle={{ fontSize: parseInt(FONT_SIZES.label.desktop) }}
          />
          <Bar dataKey="revenue" name="売上" fill={COLORS.primary} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );

  // ================================
  // レンダリング: 顧客別売上ランキング
  // ================================
  const renderCustomerRanking = () => (
    <Card>
      <Typography
        variant="h6"
        sx={{
          mb: SPACING.gap.large,
          fontSize: FONT_SIZES.cardTitle.desktop,
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.gap.small,
        }}>
        <PeopleIcon />
        {MESSAGES.sections.customerRanking}
      </Typography>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{ fontWeight: 'bold', fontSize: FONT_SIZES.body.desktop }}>
                順位
              </TableCell>
              <TableCell
                sx={{ fontWeight: 'bold', fontSize: FONT_SIZES.body.desktop }}>
                会社名
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: 'bold', fontSize: FONT_SIZES.body.desktop }}>
                売上
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: 'bold', fontSize: FONT_SIZES.body.desktop }}>
                件数
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customerSummaries.map((summary, index) => (
              <TableRow key={summary.customerId} hover>
                <TableCell sx={{ fontSize: FONT_SIZES.body.desktop }}>
                  <Chip
                    label={index + 1}
                    color={index < 3 ? 'primary' : 'default'}
                    sx={{ fontWeight: 'bold' }}
                  />
                </TableCell>
                <TableCell sx={{ fontSize: FONT_SIZES.body.desktop }}>
                  {summary.companyName}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontSize: FONT_SIZES.body.desktop,
                    fontWeight: 'bold',
                  }}>
                  {formatCurrency(summary.totalRevenue)}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontSize: FONT_SIZES.body.desktop }}>
                  {summary.serviceCount}件
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {customerSummaries.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">データがありません</Typography>
        </Box>
      )}
    </Card>
  );

  // ================================
  // レンダリング: サービス種別分析
  // ================================
  const renderServiceTypeAnalysis = () => (
    <Card>
      <Typography
        variant="h6"
        sx={{
          mb: SPACING.gap.large,
          fontSize: FONT_SIZES.cardTitle.desktop,
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.gap.small,
        }}>
        <MoneyIcon />
        {MESSAGES.sections.serviceTypeAnalysis}
      </Typography>

      <Grid container spacing={SPACING.gap.large}>
        {/* 円グラフ */}
        <Grid size={{ xs: 12, md: 6 }}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={serviceTypeSummaries}
                dataKey="revenue"
                nameKey="serviceType"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(props: any) => {
                  const data = props as ServiceTypeSummary;
                  return `${data.serviceType} (${data.percentage.toFixed(1)}%)`;
                }}>
                {serviceTypeSummaries.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS.chartColors[index % COLORS.chartColors.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </Grid>

        {/* 詳細テーブル */}
        <Grid size={{ xs: 12, md: 6 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>種別</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    売上
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    割合
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {serviceTypeSummaries.map((summary, index) => (
                  <TableRow key={summary.serviceType}>
                    <TableCell>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: SPACING.gap.small,
                        }}>
                        <Box
                          sx={{
                            width: parseInt(FONT_SIZES.body.desktop),
                            height: parseInt(FONT_SIZES.body.desktop),
                            borderRadius: '50%',
                            backgroundColor:
                              COLORS.chartColors[
                                index % COLORS.chartColors.length
                              ],
                          }}
                        />
                        {summary.serviceType}
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(summary.revenue)}
                    </TableCell>
                    <TableCell align="right">
                      {summary.percentage.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Card>
  );

  // ================================
  // レンダリング: データなし表示
  // ================================
  const renderNoData = () => (
    <Alert severity="info" sx={{ fontSize: FONT_SIZES.body.desktop }}>
      {MESSAGES.info.noData}
    </Alert>
  );

  // ================================
  // メインレンダー
  // ================================
  return (
    <Container maxWidth="xl" sx={{ py: SPACING.page.desktop }}>
      {/* ページヘッダー */}
      {renderPageHeader()}

      {/* 年度選択 */}
      {renderYearSelector()}

      {/* データがある場合のレポート表示 */}
      {yearServiceRecords.length > 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.gap.large,
          }}>
          {/* 年度サマリー */}
          {renderYearSummary()}

          {/* 月別売上推移グラフ */}
          {renderMonthlyTrendChart()}

          {/* 顧客別売上ランキング */}
          {renderCustomerRanking()}

          {/* サービス種別分析 */}
          {renderServiceTypeAnalysis()}
        </Box>
      ) : (
        // データなし表示
        renderNoData()
      )}
    </Container>
  );
};
/**
 * 【50代ユーザー向け設計のポイント】
 *
 * 1. 視覚的な分かりやすさ
 *    - 大きな数値表示（28-32px）
 *    - 鮮やかな色分け
 *    - 明確なグラフ・チャート
 *
 * 2. 実用的な情報提示
 *    - 年度サマリーで全体像把握
 *    - 月別推移で季節性分析
 *    - 顧客ランキングで重点顧客特定
 *    - サービス種別で事業構成把握
 *
 * 3. 確定申告対応
 *    - CSV出力機能
 *    - 印刷用レイアウト
 *    - 年度別集計
 *
 * 4. 前年比較機能
 *    - 事業成長の可視化
 *    - 増減の明確な表示
 *    - トレンド分析
 *
 * 5. レスポンシブ対応
 *    - モバイル: 縦方向レイアウト
 *    - デスクトップ: 効率的な2カラム
 *
 * この実装により、50代の建築系自営業者が事業の状況を
 * 一目で把握し、確定申告準備や営業戦略立案に活用できる
 * 実用的なレポートページが完成します。
 */

export default ReportsPage;
