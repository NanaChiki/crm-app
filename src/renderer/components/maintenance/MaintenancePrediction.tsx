/**
 * MaintenancePrediction.tsx
 *
 * 【50代向けメンテナンス予測管理コンポーネント】
 *
 * 顧客の過去のサービス履歴を分析し、建築業界の標準メンテナンス周期に基づいて
 * 次回メンテナンス推奨時期を予測・表示する専用コンポーネント。
 * 50代の建築系自営業者が顧客への提案タイミングを逃さないよう支援。
 *
 * 【主な機能】
 * ✅ 建築業界標準メンテナンス周期による予測
 * ✅ 緊急度別の色分け表示（低・中・高・要対応）
 * ✅ サービス種別ごとの経過年数表示
 * ✅ 次回推奨時期の明確な表示
 * ✅ 「そろそろメンテナンス時期」アラート
 *
 * 【50代配慮】
 * - 大きなカード・見やすい色分け
 * - 経過年数の分かりやすい表示
 * - 「○年経過 → そろそろ時期」の直感的な表現
 * - 建築業界の常識に基づいた予測ロジック
 * - アクション推奨の明確な表示
 */

import {
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { useCallback, useMemo } from 'react';

// Custom Components
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

// Custom Hooks
import { useServiceRecords } from '../../hooks/useServiceRecords';

// Types
import { ServiceRecordWithCustomer } from '../../../types';

// ================================
// 型定義・定数
// ================================
interface MaintenancePredictionProps {
  // 顧客対象ID
  customerId: number;
  /** サービス履歴Hook（親から渡される、データ同期用） */
  serviceRecordsHook?: ReturnType<typeof useServiceRecords>;
}

//緊急度レベル
type UrgencyLevel = 'low' | 'medium' | 'high' | 'overdue';

// メンテナンス予測データ
interface MaintenanceStatus {
  serviceType: string;
  lastServiceDate: Date;
  yearsElapsed: number;
  nextRecommendedDate: Date;
  urgencyLevel: UrgencyLevel;
  standardCycle: number;
  progressPercentage: number;
  icon: string;
}

// ================================
// 建築業界標準メンテナンス周期定義
// ================================

/** 建築業界標準メンテナンス周期（50代向け業界知識） */
const MAINTENANCE_CYCLES = {
  外壁塗装: { standard: 10, early: 8, late: 12, icon: '🎨' },
  屋根修理: { standard: 15, early: 12, late: 18, icon: '🏠' },
  屋根塗装: { standard: 8, early: 6, late: 10, icon: '🎨' },
  防水工事: { standard: 10, early: 8, late: 12, icon: '💧' },
  配管工事: { standard: 20, early: 15, late: 25, icon: '🔧' },
  電気工事: { standard: 15, early: 12, late: 18, icon: '⚡' },
  内装リフォーム: { standard: 15, early: 12, late: 20, icon: '🏡' },
  水回りリフォーム: { standard: 12, early: 10, late: 15, icon: '🚿' },
  定期点検: { standard: 3, early: 2, late: 4, icon: '🔍' },
  緊急修理: { standard: 5, early: 3, late: 7, icon: '🚨' },
  エアコン工事: { standard: 10, early: 8, late: 12, icon: '❄️' },
  その他: { standard: 10, early: 8, late: 12, icon: '🛠️' },
} as const;

// ================================
// 緊急度別設定（50代向け分かりやすい色分け）
// ================================
const URGENCY_CONFIG = {
  low: {
    label: '余裕あり',
    color: 'success' as const,
    bgColor: '#e8f5e8',
    textColor: '#2e7d32',
    icon: <CheckCircleIcon />,
    message: 'まだ余裕があります',
  },
  medium: {
    label: '検討時期',
    color: 'warning' as const,
    bgColor: '#fff3e0',
    textColor: '#f57c00',
    icon: <ScheduleIcon />,
    message: 'そろそろ検討時期です',
  },
  high: {
    label: '推奨時期',
    color: 'error' as const,
    bgColor: '#ffebee',
    textColor: '#d32f2f',
    icon: <WarningIcon />,
    message: 'メンテナンス推奨時期です',
  },
  overdue: {
    label: '要対応',
    color: 'error' as const,
    bgColor: '#ffcdd2',
    textColor: '#c62828',
    icon: <ErrorIcon />,
    message: '早急な対応が必要です',
  },
} as const;

// ================================
// エラーメッセージ定義（50代配慮）
// ================================
const MESSAGES = {
  info: {
    noServices: 'サービス履歴がないため、メンテナンス予測を表示できません。',
    noMaintenanceNeeded: '現在、緊急なメンテナンスは必要ありません。',
    analysisNote: '※ 予測は目安です。実際の状況に応じてご判断ください。',
    industryStandard: '建築業界標準周期に基づく予測',
  },
  action: {
    contactCustomer: '顧客に連絡する',
    scheduleVisit: '訪問予定を立てる',
    createEstimate: '見積もりを作成',
  },
} as const;

// ================================
// ユーティリティ関数
// ================================

/**
 * 経過年数計算（50代向け分かりやすい計算）
 */
const calculateYearsElapsed = (serviceData: Date): number => {
  const now = new Date();
  const diffMs = now.getTime() - serviceData.getTime();
  const years = diffMs / (1000 * 60 * 60 * 24 * 365.25);
  return Math.floor(years * 10) / 10; // 小数点第1位まで
};

/**
 * メンテナンス緊急度判定
 */
const getMaintenanceUrgencyLevel = (
  yearsElapsed: number,
  cycle: (typeof MAINTENANCE_CYCLES)[keyof typeof MAINTENANCE_CYCLES]
): UrgencyLevel => {
  if (yearsElapsed >= cycle.late) {
    return 'overdue';
  }
  if (yearsElapsed >= cycle.standard) {
    return 'high';
  }
  if (yearsElapsed >= cycle.early) {
    return 'medium';
  }
  return 'low';
};

/**
 * 次回推奨日付計算
 */
const calculateNextRecommendedDate = (
  lastServiceDate: Date,
  standardCycle: number
): Date => {
  // nextDate.getFullYear() → gets current year (e.g., 2024)
  // + standardCycle → adds cycle years (e.g., + 10)
  // setFullYear(2024 + 10) → sets year to 2034
  const nextDate = new Date(lastServiceDate);
  nextDate.setFullYear(nextDate.getFullYear() + standardCycle);
  return nextDate;
};

/**
 * 進捗パーセンテージ計算
 * メンテナンス時期の「どのくらい進んでいるか」
 * を0-100%で表示し、ユーザーが直感的に緊急度を把握できるようにする。
 *
 * Math.max(percentage, 0): 0%未満にならないよう下限設定
 * Math.min(結果, 100): 100%を超えないよう上限設定
 */
const calculateProgressPercentage = (
  yearsElapsed: number,
  standardCycle: number
): number => {
  const percentage = (yearsElapsed / standardCycle) * 100;
  return Math.min(Math.max(percentage, 0), 100);
};

/**
 * 日付フォーマット（50代向け和暦表示）
 * より詳細に統一
 */
const formatDateForDisplay = (date: Date): string => {
  return new Intl.DateTimeFormat('ja-JP-u-ca-japanese', {
    era: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date);
};

// ================================
// メインコンポーネント
// ================================

export const MaintenancePrediction: React.FC<MaintenancePredictionProps> = ({
  customerId,
  serviceRecordsHook: providedHook,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // ================================
  // データ取得
  // ================================

  /**
   * サービス履歴Hook
   *
   * 【修正】親から渡されたHookがあればそれを使用し、
   * なければ自分でuseServiceRecordsを呼び出す。
   * これにより、ServiceRecordListでデータ更新があった際も
   * MaintenancePredictionが自動的に最新データで再レンダリングされる。
   */
  const localHook = useServiceRecords({
    customerId,
    autoLoad: !providedHook, // 親から渡されていない場合のみ自動読み込み
  });

  const { serviceRecords, loading, hasRecords } = providedHook || localHook;

  // ================================
  // 計算値・メモ化データ
  // ================================

  /**
   * サービス種別ごとの最新履歴取得
   */
  const latestServicesByType = useMemo(() => {
    const serviceMap = new Map<string, ServiceRecordWithCustomer>();

    serviceRecords.forEach((record) => {
      const serviceType = record.serviceType || 'その他';
      const existingRecord = serviceMap.get(serviceType);

      if (
        !existingRecord ||
        new Date(record.serviceDate) > new Date(existingRecord.serviceDate)
      ) {
        serviceMap.set(serviceType, record);
      }
    });

    return serviceMap;
  }, [serviceRecords]);

  /**
   * メンテナンス予測データ生成
   */
  const maintenancePredictions = useMemo((): MaintenanceStatus[] => {
    const predictions: MaintenanceStatus[] = [];

    latestServicesByType.forEach((record, serviceType) => {
      const cycle =
        MAINTENANCE_CYCLES[serviceType as keyof typeof MAINTENANCE_CYCLES] ||
        MAINTENANCE_CYCLES['その他'];

      const lastServiceDate = new Date(record.serviceDate);
      const yearsElapsed = calculateYearsElapsed(lastServiceDate);
      const urgencyLevel = getMaintenanceUrgencyLevel(yearsElapsed, cycle);
      const nextRecommendedDate = calculateNextRecommendedDate(
        lastServiceDate,
        cycle.standard
      );
      const progressPercentage = calculateProgressPercentage(
        yearsElapsed,
        cycle.standard
      );

      predictions.push({
        serviceType,
        lastServiceDate,
        yearsElapsed,
        nextRecommendedDate,
        urgencyLevel,
        standardCycle: cycle.standard,
        progressPercentage,
        icon: cycle.icon,
      });
    });

    // 緊急度順でソート
    return predictions.sort((a, b) => {
      const urgencyOrder = { overdue: 4, high: 3, medium: 2, low: 1 };
      return urgencyOrder[b.urgencyLevel] - urgencyOrder[a.urgencyLevel];
    });
  }, [latestServicesByType]);

  /**
   * 緊急対応が必要な項目
   */
  const urgentItems = useMemo(() => {
    return maintenancePredictions.filter(
      (item) => item.urgencyLevel === 'overdue' || item.urgencyLevel === 'high'
    );
  }, [maintenancePredictions]);

  /**
   * レスポンシブ設定
   */
  const responsiveSettings = useMemo(
    () => ({
      cardPadding: isMobile ? 2 : 3,
      fontSize: isMobile ? '18px' : '20px',
      titleFontSize: isMobile ? '20px' : '24px',
      spacing: isMobile ? 2 : 3,
    }),
    [isMobile]
  );

  // ================================
  // イベントハンドラー
  // ================================
  const handleContactCustomer = useCallback(() => {
    // 将来的に顧客連絡機能と連携
    alert('顧客連絡機能は今後実装予定です');
  }, []);

  const handleScheduleVisit = useCallback(() => {
    // 将来的にスケジュール機能と連携
    alert('訪問スケジュール機能は今後実装予定です');
  }, []);

  const handleCreateEstimate = useCallback(() => {
    // 将来的に見積もり機能と連携
    alert('見積もり作成機能は今後実装予定です');
  }, []);

  // ================================
  // サブコンポーネント定義
  // ================================

  /**
   * 緊急アラート表示
   */
  const renderUrgentAlert = () => {
    if (urgentItems.length === 0) {
      return null;
    }

    return (
      <Alert
        severity="error"
        sx={{
          mb: 3,
          fontSize: '16px',
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
            🚨 緊急メンテナンス対応が必要です
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {urgentItems.length}件のサービス推奨時期を迎えています。
            早急な顧客対応をお勧めします。
          </Typography>
          <Stack direction={isMobile ? 'column' : 'row'} spacing={1}>
            <Button
              variant="contained"
              size="small"
              color="error"
              onClick={handleContactCustomer}
              sx={{ fontSize: '14px' }}>
              {MESSAGES.action.contactCustomer}
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={handleScheduleVisit}
              sx={{ fontSize: '14px' }}>
              {MESSAGES.action.scheduleVisit}
            </Button>
          </Stack>
        </Box>
      </Alert>
    );
  };

  /**
   * メンテナンス予測カード表示
   */
  const renderMaintenanceCard = (prediction: MaintenanceStatus) => {
    if (!prediction) {
      return null;
    }
    const urgencyConfig = URGENCY_CONFIG[prediction.urgencyLevel];

    return (
      <Card key={prediction.serviceType} cardsize="medium">
        <Box
          sx={{
            p: responsiveSettings.cardPadding,
          }}>
          {/* ヘッダー */}
          <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 1, mb: 2 }}>
            <Typography sx={{ fontSize: '24px' }}>{prediction.icon}</Typography>
            <Typography
              variant="h6"
              sx={{
                fontSize: responsiveSettings.fontSize,
                fontWeight: 'bold',
                flex: 1,
              }}>
              {prediction.serviceType}
            </Typography>
            <Chip
              icon={urgencyConfig.icon}
              label={urgencyConfig.label}
              color={urgencyConfig.color}
              sx={{
                fontWeight: 'bold',
                fontSize: isMobile ? '14px' : '12px',
              }}
            />
          </Box>

          {/* 進捗バー */}
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                経過年数: {prediction.yearsElapsed}年
              </Typography>
              <Typography variant="body2" color="text.secondary">
                標準周期: {prediction.standardCycle}年
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={prediction.progressPercentage}
              sx={{
                height: 12,
                borderRadius: 6,
                backgroundColor: theme.palette.grey[200],
                '& .MuiLinearProgress-bar': {
                  backgroundColor:
                    prediction.urgencyLevel === 'overdue'
                      ? theme.palette.error.main
                      : prediction.urgencyLevel === 'high'
                      ? theme.palette.error.light
                      : prediction.urgencyLevel === 'medium'
                      ? theme.palette.warning.main
                      : theme.palette.success.main,
                  borderRadius: 6,
                },
              }}
            />
            <Typography
              variant="caption"
              sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
              {Math.round(prediction.progressPercentage)}% 経過
            </Typography>
          </Box>

          <Divider orientation="horizontal" sx={{ my: 3 }} />

          {/* 詳細情報 */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CalendarIcon fontSize="small" color="primary" />
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  最終実施日
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {formatDateForDisplay(prediction.lastServiceDate)}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TrendingUpIcon fontSize="small" color="primary" />
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  次回推奨時期
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{
                  color:
                    prediction.urgencyLevel === 'overdue' ||
                    prediction.urgencyLevel === 'high'
                      ? theme.palette.error.main
                      : 'text.secondary',
                  fontWeight:
                    prediction.urgencyLevel === 'overdue' ||
                    prediction.urgencyLevel === 'high'
                      ? 'bold'
                      : 'normal',
                }}>
                {formatDateForDisplay(prediction.nextRecommendedDate)}
              </Typography>
            </Grid>
          </Grid>

          {/* ステータスメッセージ */}
          <Box
            sx={{
              mt: 3,
              p: 2,
              borderRadius: 2,
              backgroundColor: urgencyConfig.bgColor,
              textAlign: 'center',
            }}>
            <Typography
              variant="body2"
              sx={{
                color: urgencyConfig.textColor,
                fontWeight: 'bold',
              }}>
              {urgencyConfig.message}
            </Typography>
          </Box>

          {/* アクションボタン */}
          {(prediction.urgencyLevel === 'overdue' ||
            prediction.urgencyLevel === 'high') && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="contained"
                size="small"
                onClick={handleCreateEstimate}
                sx={{
                  fontSize: '14px',
                  backgroundColor: urgencyConfig.textColor,
                  '&:hover': {
                    backgroundColor: urgencyConfig.textColor,
                    opacity: 0.8,
                  },
                }}>
                {MESSAGES.action.createEstimate}
              </Button>
            </Box>
          )}
        </Box>
      </Card>
    );
  };

  /**
   * データなしの場合
   */
  const renderEmptyState = () => (
    <Card>
      <Box sx={{ textAlign: 'center', p: 6 }}>
        <ScheduleIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
        <Typography
          variant="h6"
          sx={{ mb: 2, fontSize: responsiveSettings.fontSize }}>
          {MESSAGES.info.noServices}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          サービス履歴を追加すると、メンテナンス予測が表示されます。
        </Typography>
      </Box>
    </Card>
  );

  // ================================
  // メインレンダー
  // ================================

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Typography variant="h6" color="text.secondary">
          メンテナンス予測を分析中...
        </Typography>
      </Box>
    );
  }

  if (!hasRecords) {
    return renderEmptyState();
  }

  return (
    <Box sx={{ p: responsiveSettings.cardPadding }}>
      {/* header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          sx={{
            fontSize: responsiveSettings.titleFontSize,
            fontWeight: 'bold',
            textAlign: isMobile ? 'center' : 'left',
            mb: 1,
          }}>
          🔔 メンテナンス予測
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: isMobile ? 'center' : 'left' }}>
          {MESSAGES.info.industryStandard}
        </Typography>
      </Box>

      {/* 緊急アラート */}
      {renderUrgentAlert()}

      {/* メンテナンス予測カード一覧 */}
      {maintenancePredictions.length > 0 ? (
        <Grid
          container
          spacing={2}
          sx={{ display: 'flex', alignItems: 'stretch' }}>
          {maintenancePredictions.map((prediction) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={prediction.serviceType}>
              {renderMaintenanceCard(prediction)}
            </Grid>
          ))}
        </Grid>
      ) : (
        <Card>
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <ScheduleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography
              variant="h6"
              sx={{ mb: 2, fontSize: responsiveSettings.fontSize }}>
              {MESSAGES.info.noMaintenanceNeeded}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              すべてのサービスが適切な周期内にあります。
            </Typography>
          </Box>
        </Card>
      )}

      {/* 注意事項 */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          {MESSAGES.info.analysisNote}
        </Typography>
      </Box>
    </Box>
  );
};

export default MaintenancePrediction;

/**
 * 【50代ユーザー向け設計のポイント】
 *
 * 1. 建築業界標準に基づく予測
 *    - 外壁塗装10年、屋根修理15年等の業界常識を反映
 *    - 早期・標準・遅延の3段階で柔軟な判定
 *    - 50代の業界経験に合致した現実的な周期設定
 *
 * 2. 直感的な緊急度表示
 *    - 色分けによる視覚的な緊急度判定
 *    - 進捗バーで経過状況を一目で把握
 *    - 「余裕あり」「検討時期」「推奨時期」「要対応」の分かりやすい表現
 *
 * 3. アクション指向の設計
 *    - 緊急時の「顧客に連絡」「訪問予定」「見積もり作成」ボタン
 *    - ビジネス機会を逃さないための能動的な提案
 *    - 50代の営業スタイルに合った段階的なアプローチ
 *
 * 4. 視覚的配慮
 *    - 大きなカード・読みやすいフォント
 *    - アイコン・絵文字による直感的な識別
 *    - 和暦対応の日付表示
 *
 * 5. Phase 2連携準備
 *    - リマインダー機能の基盤となるデータ構造
 *    - 自動通知システムとの将来的な連携を考慮
 *    - 顧客管理システムとの統合設計
 *
 * この実装により、50代の建築系自営業者が顧客のメンテナンス時期を
 * 的確に把握し、適切なタイミングで営業提案できる環境が完成します。
 */
