/**
 * DataStatistics.tsx
 *
 * データベース統計情報表示コンポーネント
 * バックアップ前後のデータ確認用
 */

import { Box, CircularProgress, Paper, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { FONT_SIZES, SPACING } from '../../constants/uiDesignSystem';
import { useCustomer } from '../../contexts/CustomerContext';
import { useReminder } from '../../contexts/ReminderContext';
import { useServiceRecords } from '../../hooks/useServiceRecords';

interface DataStats {
  customerCount: number;
  serviceRecordCount: number;
  reminderCount: number;
  lastUpdated: string;
}

export function DataStatistics() {
  const { customers } = useCustomer();
  const { serviceRecords } = useServiceRecords({ autoLoad: true });
  const { reminders } = useReminder();
  const [stats, setStats] = useState<DataStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // データを集計
    const calculateStats = () => {
      setStats({
        customerCount: customers.length,
        serviceRecordCount: serviceRecords.length,
        reminderCount: reminders.length,
        lastUpdated: new Date().toLocaleString('ja-JP', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      });
      setLoading(false);
    };

    calculateStats();
  }, [customers, serviceRecords, reminders]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Paper
      sx={{
        p: SPACING.card.desktop,
        bgcolor: 'info.light',
        border: '1px solid',
        borderColor: 'info.main',
      }}>
      <Typography
        variant="h6"
        sx={{
          fontSize: FONT_SIZES.cardTitle.desktop,
          fontWeight: 'bold',
          mb: SPACING.gap.medium,
          color: 'text.primary',
        }}>
        📊 現在のデータ統計
      </Typography>

      <Box sx={{ display: 'grid', gap: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography
            sx={{
              fontSize: FONT_SIZES.body.desktop,
              color: 'text.primary',
            }}>
            顧客数:
          </Typography>
          <Typography
            sx={{
              fontSize: FONT_SIZES.body.desktop,
              fontWeight: 'bold',
              color: 'text.primary',
            }}>
            {stats.customerCount}件
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography
            sx={{
              fontSize: FONT_SIZES.body.desktop,
              color: 'text.primary',
            }}>
            サービス履歴:
          </Typography>
          <Typography
            sx={{
              fontSize: FONT_SIZES.body.desktop,
              fontWeight: 'bold',
              color: 'text.primary',
            }}>
            {stats.serviceRecordCount}件
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography
            sx={{
              fontSize: FONT_SIZES.body.desktop,
              color: 'text.primary',
            }}>
            リマインダー:
          </Typography>
          <Typography
            sx={{
              fontSize: FONT_SIZES.body.desktop,
              fontWeight: 'bold',
              color: 'text.primary',
            }}>
            {stats.reminderCount}件
          </Typography>
        </Box>

        <Box
          sx={{
            mt: 1,
            pt: 1.5,
            borderTop: '1px solid',
            borderColor: 'info.main',
          }}>
          <Typography
            sx={{
              fontSize: FONT_SIZES.label.desktop,
              color: 'text.secondary',
              textAlign: 'right',
            }}>
            最終更新: {stats.lastUpdated}
          </Typography>
        </Box>
      </Box>

      <Typography
        sx={{
          mt: 2,
          fontSize: FONT_SIZES.label.desktop,
          color: 'text.secondary',
          fontStyle: 'italic',
        }}>
        💡 ヒント:
        バックアップ作成前にこの数値をメモしておくと、復元後の確認に便利です
      </Typography>
    </Paper>
  );
}
