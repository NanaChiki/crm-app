/**
 * Dashboard.tsx
 *
 * 【50代向け実用的ダッシュボード】
 *
 * 50代後半の建築系自営業者が毎朝使える実用的なダッシュボード。
 * 事業の現状把握、ビジネス機会の発見、主要機能へのクイックアクセスを提供。
 *
 * 【主な機能】
 * ✅ クイックアクション（新規登録、顧客一覧、レポート）
 * ✅ ビジネスサマリー4枚（総顧客数、今月サービス件数、今月売上、要対応顧客数）
 * ✅ タブ式コンテンツ（最近のサービス、メンテナンス推奨、今週のリマインダー）
 *
 * 【50代配慮】
 * - 大きな数値表示で事業状況を一目で把握
 * - タブ式で縦長を解消、一覧性向上
 * - 色分けで緊急度を視覚化
 * - アイコン付きで直感的
 * - クリック可能な要素を明確に
 */

import {
  Add as AddIcon,
  Assessment as AssessmentIcon,
  Build as BuildIcon,
  History as HistoryIcon,
  Notifications as NotificationsIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Chip,
  Container,
  FormControl,
  Grid,
  MenuItem,
  Select,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { Customer } from '../../types';
import PageHeader from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { BUTTON_SIZE, FONT_SIZES, SPACING } from '../constants/uiDesignSystem';
import { useCustomer } from '../contexts/CustomerContext';
import { useReminder } from '../contexts/ReminderContext';
import { useServiceRecords } from '../hooks/useServiceRecords';

// ================================
// 型定義
// ================================
type TabValue = 'services' | 'maintenance' | 'reminders';

// ================================
// メインコンポーネント
// ================================
function Dashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  // ================================
  // 状態管理
  // ================================
  const [currentTab, setCurrentTab] = useState<TabValue>('services');
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );

  // ================================
  // データ取得
  // ================================

  // 顧客データ
  const { customers, loading } = useCustomer();

  // 全サービス履歴を取得
  const { serviceRecords, error: serviceError } = useServiceRecords({
    autoLoad: true,
  });

  // リマインダーデータ取得
  const { getUpcomingReminders, fetchReminders, getNotifications } =
    useReminder();

  // ================================
  // Effects
  // ================================

  // リマインダーを初回ロード時に取得
  useEffect(() => {
    fetchReminders();
  }, []); // Run only on mount to avoid unnecessary re-fetches

  // ================================
  // データ計算（useMemoで最適化）
  // ================================

  /**
   * 今月のサービス履歴フィルタリング
   */
  const thisMonthRecords = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return serviceRecords.filter((record) => {
      const dateObj =
        typeof record.serviceDate === 'string'
          ? new Date(record.serviceDate)
          : record.serviceDate;

      return (
        dateObj.getMonth() === currentMonth &&
        dateObj.getFullYear() === currentYear
      );
    });
  }, [serviceRecords]);

  /**
   * 今月の売上計算
   */
  const thisMonthRevenue = useMemo(() => {
    return thisMonthRecords.reduce(
      (sum, record) => sum + (Number(record.amount) || 0),
      0
    );
  }, [thisMonthRecords]);

  /**
   * メンテナンス推奨顧客の計算
   *
   * 【改善されたロジック】
   * - 顧客ごと＋サービス種別ごとの最終実施日を計算
   * - 同じ顧客の同じサービス種別で5年以上経過したものを抽出
   * - 緊急度別（10年以上=high、5-10年=medium）に分類
   * - 経過年数の長い順にソート
   *
   * 【例】
   * 田中建設の「外壁塗装」が2013年実施 → 11年経過 → 要対応
   * 田中建設の「定期点検」が2024年実施 → 0年経過 → 対象外
   */
  /**
   * メンテナンス推奨アラートの計算
   *
   * 【改善されたロジック v2.0】
   * - 顧客×サービス種別ごとに独立したアラートを生成
   * - 同じ顧客でも異なるserviceTypeなら別々に表示
   * - 例: 田中建設の「外壁塗装」と「屋根修理」がどちらも5年超なら両方表示
   */
  const maintenanceAlerts = useMemo(() => {
    // 顧客ごと＋サービス種別ごとの最終実施日を計算
    // キー: "customerId-serviceType"
    const customerServiceLastDate = new Map<
      string,
      {
        customerId: number;
        serviceType: string;
        lastServiceDate: Date;
      }
    >();

    serviceRecords.forEach((record) => {
      const key = `${record.customerId}-${record.serviceType}`;
      const existing = customerServiceLastDate.get(key);
      const serviceDate =
        typeof record.serviceDate === 'string'
          ? new Date(record.serviceDate)
          : record.serviceDate;

      // 同じserviceTypeの最新日付を保存（最新実施日基準でメンテナンス判定）
      if (!existing || serviceDate > existing.lastServiceDate) {
        customerServiceLastDate.set(key, {
          customerId: record.customerId,
          serviceType: record.serviceType || '',
          lastServiceDate: serviceDate,
        });
      }
    });

    // 5年以上経過したサービスを抽出（顧客×サービス種別ごと）
    const now = new Date();
    const alerts: {
      customer: Customer;
      yearsSince: number;
      lastServiceType: string;
      urgency: 'high' | 'medium';
    }[] = [];

    customerServiceLastDate.forEach((service) => {
      const yearsSince =
        (now.getTime() - service.lastServiceDate.getTime()) /
        (1000 * 60 * 60 * 24 * 365.25);

      // 小数点誤差を考慮して4.99年以上を対象とする
      if (yearsSince >= 4.99) {
        const customer = customers.find(
          (c) => c.customerId === service.customerId
        );
        if (customer) {
          // 🎯 変更点: 同じ顧客でもserviceTypeが異なれば別アラートとして追加
          alerts.push({
            customer,
            yearsSince: Math.floor(yearsSince),
            lastServiceType: service.serviceType,
            urgency: yearsSince >= 10 ? 'high' : 'medium',
          });
        }
      }
    });

    // 経過年数降順でソート → 上位5件を返却
    return alerts.sort((a, b) => b.yearsSince - a.yearsSince).slice(0, 5);
  }, [serviceRecords, customers]);

  /**
   * お知らせ（メンテナンス時期到来時の自動通知）を取得
   */
  const notifications = useMemo(() => {
    return getNotifications();
  }, [getNotifications]);

  /**
   * 要対応顧客数（緊急度=high）
   */
  const criticalCustomerCount = useMemo(() => {
    return maintenanceAlerts.filter((a) => a.urgency === 'high').length;
  }, [maintenanceAlerts]);

  /**
   * 顧客情報のMap（O(1)検索用）
   */
  const customerMap = useMemo(() => {
    return new Map(customers.map((c) => [c.customerId, c]));
  }, [customers]);

  /**
   * 今週のリマインダー（7日以内）
   */
  const upcomingReminders = useMemo(() => {
    return getUpcomingReminders(7); // 7日以内
  }, [getUpcomingReminders]);

  /**
   * 最近のサービス履歴（日付降順、同日の場合は作成日時降順）
   */
  const recentServices = useMemo(() => {
    return serviceRecords
      .slice()
      .sort((a, b) => {
        // まずserviceDateで降順ソート
        const dateA =
          typeof a.serviceDate === 'string'
            ? new Date(a.serviceDate)
            : a.serviceDate;
        const dateB =
          typeof b.serviceDate === 'string'
            ? new Date(b.serviceDate)
            : b.serviceDate;
        const dateCompare = dateB.getTime() - dateA.getTime();

        // serviceDateが同じ場合は、recordId（追加順）で降順ソート
        // recordIdが大きい = 後から追加された = 新しい
        if (dateCompare === 0) {
          return b.recordId - a.recordId;
        }

        return dateCompare;
      })
      .slice(0, 10);
  }, [serviceRecords]);

  // ================================
  // イベントハンドラー
  // ================================

  /**
   * タブ切り替え
   */
  const handleTabChange = (event: React.SyntheticEvent, newValue: TabValue) => {
    setCurrentTab(newValue);
  };

  // ================================
  // サブコンポーネント: タブコンテンツ
  // ================================

  /**
   * 年度別・月別・顧客別サービス履歴の計算
   */
  const servicesByYearMonth = useMemo(() => {
    const yearRecords = serviceRecords.filter((record) => {
      const dateObj =
        typeof record.serviceDate === 'string'
          ? new Date(record.serviceDate)
          : record.serviceDate;
      return dateObj.getFullYear() === selectedYear;
    });

    // 月別にグループ化
    const monthGroups: Record<number, typeof yearRecords> = {};
    yearRecords.forEach((record) => {
      const dateObj =
        typeof record.serviceDate === 'string'
          ? new Date(record.serviceDate)
          : record.serviceDate;
      const month = dateObj.getMonth() + 1; // 1-12
      if (!monthGroups[month]) {
        monthGroups[month] = [];
      }
      monthGroups[month].push(record);
    });

    // 各月の顧客別集計
    const monthCustomerCounts: Record<number, Map<number, number>> = {};
    Object.keys(monthGroups).forEach((monthStr) => {
      const month = parseInt(monthStr, 10);
      const customerCounts = new Map<number, number>();
      monthGroups[month].forEach((record) => {
        const count = customerCounts.get(record.customerId) || 0;
        customerCounts.set(record.customerId, count + 1);
      });
      monthCustomerCounts[month] = customerCounts;
    });

    return { monthGroups, monthCustomerCounts };
  }, [serviceRecords, selectedYear]);

  /**
   * 年度選択オプション生成
   * 平成25年（2013年）から現在年まで
   */
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = 2013; // 平成25年
    const years: number[] = [];
    // 平成25年（2013年）から現在年まで
    for (let i = currentYear; i >= startYear; i--) {
      years.push(i);
    }
    return years;
  }, []);

  /**
   * 最近のサービス履歴タブ（年度別・月別・顧客別表示）
   */
  const renderServicesTab = () => (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* 年度選択 */}
      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth sx={{ maxWidth: 300 }}>
          <Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value as number)}
            sx={{
              fontSize: FONT_SIZES.body.desktop,
              minHeight: BUTTON_SIZE.minHeight.desktop,
            }}>
            {yearOptions.map((year) => (
              <MenuItem key={year} value={year}>
                {year}年
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* 月別表示 */}
      {Object.keys(servicesByYearMonth.monthGroups).length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => {
            const records = servicesByYearMonth.monthGroups[month] || [];
            const customerCounts =
              servicesByYearMonth.monthCustomerCounts[month] || new Map();

            if (records.length === 0) {
              return null;
            }

            return (
              <Box
                key={month}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 2,
                }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 'bold',
                    mb: 2,
                    fontSize: FONT_SIZES.sectionTitle.desktop,
                  }}>
                  {month}月（{records.length}件のサービス）
                </Typography>

                {/* 顧客別リスト */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {Array.from(customerCounts.entries())
                    .sort((a, b) => b[1] - a[1]) // 件数が多い順
                    .map(([customerId, count]) => {
                      const customer = customerMap.get(customerId);
                      return (
                        <Box
                          key={customerId}
                          role="button"
                          tabIndex={0}
                          aria-label={`${customer?.companyName || '不明'}のサービス履歴を表示（${count}件）`}
                          sx={{
                            p: 1.5,
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                            '&:hover': {
                              bgcolor: 'action.hover',
                              cursor: 'pointer',
                            },
                          }}
                          onClick={() =>
                            navigate(`/customers/${customerId}#history`)
                          }
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              navigate(`/customers/${customerId}#history`);
                            }
                          }}>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 'bold',
                              fontSize: FONT_SIZES.body.desktop,
                            }}>
                            {customer?.companyName || '不明'} - {count}件
                          </Typography>
                        </Box>
                      );
                    })}
                </Box>
              </Box>
            );
          })}
        </Box>
      ) : (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            fontSize: FONT_SIZES.body.desktop,
            textAlign: 'center',
            py: 8,
          }}>
          {selectedYear}年のサービス履歴がありません
        </Typography>
      )}
    </Box>
  );

  /**
   * メンテナンス推奨顧客タブ（お知らせも含む）
   */
  const renderMaintenanceTab = () => {
    // お知らせもメンテナンス推奨として表示
    const allAlerts = [
      ...maintenanceAlerts,
      ...notifications.map((notification) => ({
        customer: notification.customer,
        yearsSince: 0, // お知らせは経過年数なし
        lastServiceType: notification.title,
        urgency: 'high' as const,
        isNotification: true,
        reminderId: notification.reminderId,
      })),
    ];

    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {allAlerts.length > 0 ? (
          <>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {allAlerts.map((alert, index) => {
                const alertKey = (alert as any).isNotification
                  ? `notification-${(alert as any).reminderId}`
                  : `${alert.customer.customerId}-${alert.lastServiceType}`;

                return (
                  <Box
                    key={alertKey}
                    role="button"
                    tabIndex={0}
                    aria-label={`${alert.customer.companyName}の${alert.lastServiceType}メンテナンス推奨${alert.yearsSince > 0 ? ` - ${alert.yearsSince}年経過` : ''}`}
                    sx={{
                      p: 2,
                      border: 2,
                      borderColor:
                        alert.urgency === 'high'
                          ? 'error.main'
                          : 'warning.main',
                      borderRadius: 1,
                      bgcolor:
                        alert.urgency === 'high'
                          ? 'error.lighter'
                          : 'warning.lighter',
                      '&:hover': {
                        cursor: 'pointer',
                        opacity: 0.9,
                      },
                    }}
                    onClick={() =>
                      navigate(`/customers/${alert.customer.customerId}#sites`)
                    }
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        navigate(
                          `/customers/${alert.customer.customerId}#sites`
                        );
                      }
                    }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 1,
                      }}>
                      <Chip
                        label={
                          alert.urgency === 'high' ? '🔴 要対応' : '🟡 推奨時期'
                        }
                        color={alert.urgency === 'high' ? 'error' : 'warning'}
                        sx={{
                          fontWeight: 'bold',
                          fontSize: FONT_SIZES.label.desktop,
                        }}
                      />
                    </Box>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 'bold',
                        mb: 1,
                        fontSize: FONT_SIZES.cardTitle.desktop,
                      }}>
                      {alert.customer.companyName || '不明'}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: FONT_SIZES.body.desktop }}>
                      {(alert as any).isNotification
                        ? alert.lastServiceType || 'お知らせ'
                        : `${alert.lastServiceType || 'サービス'}から${alert.yearsSince}年経過`}
                    </Typography>
                  </Box>
                );
              })}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/customers')}
                sx={{
                  mt: 3,
                  fontSize: FONT_SIZES.body.desktop,
                  minHeight: BUTTON_SIZE.minHeight.desktop,
                }}>
                全ての顧客を見る
              </Button>
            </Box>
          </>
        ) : (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: FONT_SIZES.body.desktop,
              textAlign: 'center',
              py: 8,
            }}>
            メンテナンス推奨顧客がありません
          </Typography>
        )}
      </Box>
    );
  };

  /**
   * 最近の顧客タブ
   */
  /**
   * 今週のリマインダータブ
   */
  const renderRemindersTab = () => (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {upcomingReminders.length > 0 ? (
        <>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {upcomingReminders.map((reminder) => (
              <Box
                key={reminder.reminderId}
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: 'warning.main',
                  borderRadius: 1,
                  bgcolor: 'warning.lighter',
                }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 'bold',
                    mb: 0.5,
                    fontSize: FONT_SIZES.cardTitle.desktop,
                  }}>
                  {reminder.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: FONT_SIZES.body.desktop }}>
                  {reminder.customer.companyName}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: FONT_SIZES.label.desktop }}>
                  送信予定:{' '}
                  {(typeof reminder.reminderDate === 'string'
                    ? new Date(reminder.reminderDate)
                    : reminder.reminderDate
                  ).toLocaleDateString('ja-JP')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => navigate('/reminders')}
                    sx={{ fontSize: FONT_SIZES.label.desktop }}>
                    詳細
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/reminders')}
              sx={{
                mt: 2,
                fontSize: FONT_SIZES.body.desktop,
                minHeight: BUTTON_SIZE.minHeight.desktop,
              }}>
              すべてのリマインダーを見る
            </Button>
          </Box>
        </>
      ) : (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            fontSize: FONT_SIZES.body.desktop,
            textAlign: 'center',
            py: 8,
          }}>
          今週のリマインダーはありません
        </Typography>
      )}
    </Box>
  );

  // ================================
  // レンダリング
  // ================================
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* ページヘッダー */}
      <PageHeader
        title="ダッシュボード"
        subtitle="事業の現状を一目で確認できます"
      />

      {/* エラー表示 */}
      {(loading.error || serviceError) && (
        <Alert
          severity="error"
          sx={{ mb: 3, fontSize: FONT_SIZES.body.desktop }}>
          データの読み込みに失敗しました。ページを再読み込みしてください。
        </Alert>
      )}

      {loading.isLoading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" sx={{ fontSize: FONT_SIZES.body.desktop }}>
            読み込み中...
          </Typography>
        </Box>
      ) : (
        <>
          {/* クリックアクションエリア */}
          <Box sx={{ mb: 6 }}>
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                fontWeight: 'bold',
                fontSize: {
                  xs: FONT_SIZES.sectionTitle.mobile,
                  md: FONT_SIZES.sectionTitle.desktop,
                },
              }}>
              ⚡ よく使う機能
            </Typography>
            <Grid container spacing={SPACING.gap.medium}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<AddIcon fontSize="large" />}
                  onClick={() => navigate('/customers/new')}
                  sx={{
                    minHeight: BUTTON_SIZE.minHeight.desktop,
                    fontSize: FONT_SIZES.body.desktop,
                    fontWeight: 'bold',
                  }}>
                  新規顧客登録
                </Button>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<PeopleIcon fontSize="large" />}
                  onClick={() => navigate('/customers')}
                  sx={{
                    minHeight: BUTTON_SIZE.minHeight.desktop,
                    fontSize: FONT_SIZES.body.desktop,
                    fontWeight: 'bold',
                  }}>
                  顧客一覧へ
                </Button>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<AssessmentIcon fontSize="large" />}
                  onClick={() => navigate('/reports')}
                  sx={{
                    minHeight: BUTTON_SIZE.minHeight.desktop,
                    fontSize: FONT_SIZES.body.desktop,
                    fontWeight: 'bold',
                  }}>
                  集計レポートへ
                </Button>
              </Grid>
            </Grid>
          </Box>
          {/* 📊 ビジネスサマリー */}
          <Box sx={{ mb: 6 }}>
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                fontWeight: 'bold',
                fontSize: {
                  xs: FONT_SIZES.sectionTitle.mobile,
                  md: FONT_SIZES.sectionTitle.desktop,
                },
              }}>
              📊 今月の事業サマリー
            </Typography>
            <Grid container spacing={3}>
              {/* 総顧客数 */}
              <Grid
                size={{ xs: 12, sm: 6, md: 3 }}
                sx={{
                  display: 'flex',
                  alignItems: 'stretch',
                }}>
                <Card sx={{ width: '100%' }}>
                  <Box sx={{ textAlign: 'center', p: 3 }}>
                    <PeopleIcon
                      sx={{ fontSize: 56, color: 'primary.main', mb: 1 }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 1,
                        fontSize: FONT_SIZES.cardTitle.desktop,
                        fontWeight: 'bold',
                      }}>
                      総顧客数
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 'bold',
                        color: 'primary.main',
                        fontSize: { xs: 36, md: 42 },
                      }}>
                      {customers.length}社
                    </Typography>
                  </Box>
                </Card>
              </Grid>

              {/* 今月のサービス件数 */}
              <Grid
                size={{ xs: 12, sm: 6, md: 3 }}
                sx={{
                  display: 'flex',
                  alignItems: 'stretch',
                }}>
                <Card sx={{ width: '100%' }}>
                  <Box sx={{ textAlign: 'center', p: 3 }}>
                    <BuildIcon
                      sx={{ fontSize: 56, color: 'success.main', mb: 1 }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 1,
                        fontSize: FONT_SIZES.cardTitle.desktop,
                        fontWeight: 'bold',
                      }}>
                      今月のサービス件数
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 'bold',
                        color: 'success.main',
                        fontSize: { xs: 36, md: 42 },
                      }}>
                      {thisMonthRecords.length}件
                    </Typography>
                  </Box>
                </Card>
              </Grid>

              {/* 今月の売上 */}
              <Grid
                size={{ xs: 12, sm: 6, md: 3 }}
                sx={{ display: 'flex', alignItems: 'stretch' }}>
                <Card sx={{ width: '100%' }}>
                  <Box sx={{ textAlign: 'center', p: 3 }}>
                    <TrendingUpIcon
                      sx={{ fontSize: 56, color: 'warning.main', mb: 1 }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 1,
                        fontSize: FONT_SIZES.cardTitle.desktop,
                        fontWeight: 'bold',
                      }}>
                      今月の売上
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 'bold',
                        color: 'warning.main',
                        fontSize: { xs: 36, md: 42 },
                      }}>
                      ¥{thisMonthRevenue.toLocaleString()}
                    </Typography>
                  </Box>
                </Card>
              </Grid>

              {/* 要対応顧客数 */}
              <Grid
                size={{ xs: 12, sm: 6, md: 3 }}
                sx={{ display: 'flex', alignItems: 'stretch' }}>
                <Card sx={{ width: '100%' }}>
                  <Box sx={{ textAlign: 'center', p: 3 }}>
                    <WarningIcon
                      sx={{ fontSize: 56, color: 'error.main', mb: 1 }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 1,
                        fontSize: FONT_SIZES.cardTitle.desktop,
                        fontWeight: 'bold',
                      }}>
                      要対応顧客数
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 'bold',
                        color: 'error.main',
                        fontSize: { xs: 36, md: 42 },
                      }}>
                      {criticalCustomerCount}社
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            </Grid>
          </Box>

          {/**  📋 タブ式コンテンツエリア*/}
          <Box sx={{ mb: 4 }}>
            <Card>
              {/* タブヘッダー */}
              <Tabs
                value={currentTab}
                onChange={handleTabChange}
                variant={isMobile ? 'fullWidth' : 'standard'}
                centered={!isMobile}
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  '& .MuiTab-root': {
                    minHeight: BUTTON_SIZE.minHeight.desktop,
                    fontSize: FONT_SIZES.cardTitle.desktop,
                    fontWeight: 'bold',
                    textTransform: 'none',
                    padding: { xs: '12px 16px', md: '12px 24px' },
                  },
                }}>
                <Tab
                  value="services"
                  label={
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 1,
                        alignItems: 'center',
                      }}>
                      <HistoryIcon />
                      <Typography
                        sx={{
                          fontSize: FONT_SIZES.body.desktop,
                          fontWeight: 'bold',
                        }}>
                        最近のサービス ({recentServices.length})
                      </Typography>
                    </Box>
                  }
                />
                <Tab
                  value="maintenance"
                  label={
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 1,
                        alignItems: 'center',
                      }}>
                      <BuildIcon />
                      <Typography
                        sx={{
                          fontSize: FONT_SIZES.body.desktop,
                          fontWeight: 'bold',
                        }}>
                        メンテナンス推奨 (
                        {maintenanceAlerts.length + notifications.length})
                      </Typography>
                    </Box>
                  }
                />
                <Tab
                  value="reminders"
                  label={
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 1,
                        alignItems: 'center',
                      }}>
                      <NotificationsIcon />
                      {upcomingReminders.length > 0 && (
                        <Chip
                          label={upcomingReminders.length}
                          color="warning"
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      )}
                      <Typography
                        sx={{
                          fontSize: FONT_SIZES.body.desktop,
                          fontWeight: 'bold',
                        }}>
                        今週のリマインダー
                      </Typography>
                    </Box>
                  }
                />
              </Tabs>

              {/* タブコンテンツ */}
              <Box>
                {currentTab === 'services' && renderServicesTab()}
                {currentTab === 'maintenance' && renderMaintenanceTab()}
                {currentTab === 'reminders' && renderRemindersTab()}
              </Box>
            </Card>
          </Box>
        </>
      )}
    </Container>
  );
}

export default Dashboard;

/**
 * 【50代ユーザー向け設計のポイント】
 *
 * 1. 事業状況の即座把握
 *    - 大きな数値表示（h3サイズ）で一目で分かる
 *    - アイコン付きで直感的
 *    - 色分けで緊急度を視覚化
 *
 * 2. ビジネス機会の発見
 *    - メンテナンス推奨顧客を自動抽出
 *    - 経過年数で緊急度を判定
 *    - クリックで即座に詳細確認
 *
 * 3. 主要機能への即アクセス
 *    - クイックアクション3ボタン
 *    - 各カードからの詳細ページ遷移
 *    - 大きなボタン（56px高）で操作しやすい
 *
 * 4. レスポンシブ対応
 *    - モバイル: 1カラム縦配置
 *    - デスクトップ: 効率的な多カラム
 *    - タッチ操作に配慮したサイズ
 *
 * 5. パフォーマンス最適化
 *    - useMemoで再計算最小化
 *    - 既存Hooksを完全活用
 *    - 不要なAPI呼び出しなし
 *
 * この実装により、50代の建築系自営業者が
 * 毎朝ダッシュボードで事業状況を把握し、
 * ビジネス機会を見逃さない環境が完成します。
 */
