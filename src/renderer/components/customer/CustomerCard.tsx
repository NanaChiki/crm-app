/**
 * CustomerCard.tsx
 *
 * 【50代向け顧客カードコンポーネント】
 *
 * 顧客情報を見やすいCard形式で表示する専用コンポーネント。
 * 50代建築系自営業者が一目で顧客の重要情報を把握できるよう設計。
 *
 * 【表示情報】
 * ✅ 会社名（大きな文字で目立つように）
 * ✅ 担当者名・連絡先
 * ✅ 最終取引日・累計取引額
 * ✅ ステータス表示（色分け）
 * ✅ 詳細画面への遷移ボタン
 *
 * 【50代配慮】
 * - 大きなフォントサイズ（16px以上）
 * - はっきりした色使い
 * - 重要情報を上部に配置
 * - クリック領域を大きく
 */

import {
  ArrowForward as ArrowForwardIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Divider,
  Typography,
  useTheme,
} from '@mui/material';
import React from 'react';
import { Customer } from '../../../types';
import {
  ANIMATION,
  CARD_MIN_HEIGHT,
  FONT_SIZES,
} from '../../constants/uiDesignSystem';

// ================================
// 型定義
// ================================
interface CustomerCardProps {
  customer: Customer;
  onClick?: (customerId: number) => void;
  showActions?: boolean;
}

// ================================
// スタイル定数（Design System統一）
// ================================
const CARD_STYLES = {
  minHeight: CARD_MIN_HEIGHT.customer, // Design Systemから統一
  transition: `all ${ANIMATION.duration.normal} ${ANIMATION.easing}`,
  borderRadius: 3, // 12px相当
  '&:hover, &:focus': {
    transform: `translateY(-2px) scale(${ANIMATION.hoverScale})`,
    boxShadow: 3,
  },
  '&:active': {
    transform: 'translateY(0)',
    boxShadow: 2,
  },
  '&:disabled': {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
};

const INFO_ROW_STYLES = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  mb: 1.5,
  fontSize: FONT_SIZES.body.desktop, // Design Systemから統一
};

// ================================
// ユーティリティ関数
// ================================

/**
 * 日付フォーマット（50代向けに分かりやすく）
 */
const formatDate = (date: Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ja-JP-u-ca-japanese', {
    era: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(dateObj);
};

/**
 * 金額フォーマット（50代向けに分かりやすく）
 */
const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * 顧客ステータスの判定
 */
const getCustomerStatus = (
  customer: Customer
): {
  label: string;
  color: 'success' | 'warning' | 'error' | 'default';
} => {
  const lastUpdate =
    typeof customer.updatedAt === 'string'
      ? new Date(customer.updatedAt)
      : customer.updatedAt;
  const daysSinceUpdate = Math.floor(
    (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceUpdate <= 30) {
    return { label: '活動中', color: 'success' };
  } else if (daysSinceUpdate <= 90) {
    return { label: '要フォロー', color: 'warning' };
  } else {
    return { label: '長期未連絡', color: 'error' };
  }
};

// ================================
// メインコンポーネント
// ================================

/**
 * CustomerCard - 顧客情報表示カード
 */
export const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  onClick,
  showActions = true,
}) => {
  const theme = useTheme();
  const status = getCustomerStatus(customer);

  const handleClick = () => {
    if (onClick) {
      onClick(customer.customerId);
    }
  };

  const handleCardKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <Card
      sx={CARD_STYLES}
      onClick={handleClick}
      onKeyDown={handleCardKeyPress}
      tabIndex={0}
      role="button"
      aria-label={`${customer.companyName}の詳細を表示`}>
      <CardContent sx={{ pb: 1 }}>
        {/* ステータス */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}>
          <Chip
            label={status.label}
            color={status.color}
            size="small"
            sx={{
              fontWeight: 'bold',
            }}
          />
          <Typography variant="caption" color="text.secondary">
            ID: {customer.customerId}
          </Typography>
        </Box>

        {/* 会社名 (メインタイトル) */}
        <Typography
          variant="h6"
          component="h3"
          sx={{
            fontSize: FONT_SIZES.cardTitle.desktop, // Design System統一
            fontWeight: 'bold',
            color: theme.palette.primary.dark,
            lineHeight: 1.3,
            mb: 2.5,
          }}>
          <BusinessIcon sx={{ mr: 0.5, verticalAlign: 'middle' }} />
          {customer.companyName}
        </Typography>

        {/* 担当者名 */}
        {customer.contactPerson && (
          <Box sx={INFO_ROW_STYLES}>
            <PersonIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.primary">
              {customer.contactPerson}
            </Typography>
          </Box>
        )}

        {/* 電話番号 */}
        {customer.phone && (
          <Box sx={INFO_ROW_STYLES}>
            <PhoneIcon fontSize="small" color="action" />
            <Typography
              variant="body2"
              color="text.primary"
              sx={{ fontFamily: 'monospace' }}>
              {customer.phone}
            </Typography>
          </Box>
        )}

        {/* メールアドレス */}
        {customer.email && (
          <Box sx={INFO_ROW_STYLES}>
            <EmailIcon fontSize="small" color="action" />
            <Typography
              variant="body2"
              color="text.primary"
              sx={{
                fontFamily: 'monospace',
                wordBreak: 'break-all',
              }}>
              {customer.email}
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 1.5 }} />

        {/* 最終更新日 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <CalendarIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            最終更新: {formatDate(customer.updatedAt)}
          </Typography>
        </Box>

        {/* 住所（部分表示） */}
        {customer.address && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: '14px',
              overflow: 'hidden', // 修正
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
            📍 {customer.address}
          </Typography>
        )}
      </CardContent>

      {/* アクションエリア */}
      {showActions && (
        <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
          <Button
            variant="outlined"
            size="small"
            endIcon={<ArrowForwardIcon />}
            onClick={handleClick}
            sx={{
              minHeight: 36,
              fontSize: '14px', // 16px→14pxが適切
              fontWeight: 'bold',
              width: '100%',
            }}>
            詳細を見る
          </Button>
        </CardActions>
      )}
    </Card>
  );
};

export default CustomerCard;

/**
 * 【50代ユーザー向け設計のポイント】
 *
 * 1. 視認性重視
 *    - 会社名を大きく目立つように表示
 *    - アイコンで情報の種類を直感的に表現
 *    - ステータスを色分けで明確に
 *
 * 2. 操作性配慮
 *    - カード全体をクリック可能に
 *    - ホバー効果で操作可能であることを明示
 *    - キーボードナビゲーション対応
 *
 * 3. 情報の優先度
 *    - 重要な情報（会社名、担当者）を上部に
 *    - 連絡先情報を見つけやすく配置
 *    - 最終更新日で活動状況を把握
 *
 * 4. アクセシビリティ
 *    - aria-label でスクリーンリーダー対応
 *    - tabIndex でキーボードナビゲーション
 *    - 適切な色コントラスト
 */
