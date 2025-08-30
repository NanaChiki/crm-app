import {
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import {
  Box,
  Breadcrumbs,
  Divider,
  styled,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React from 'react';
import { Link } from 'react-router-dom';

// 50代向けスタイルされたPageHeader
const StyledPageHeader = styled(Box)(({ theme }) => ({
  // 基本レイアウト
  padding: theme.spacing(3, 0),
  marginBottom: theme.spacing(2),

  // モバイル対応
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(2, 0),
    marginBottom: theme.spacing(1.5),
  },
}));

// ページタイトル（50代向けに大きめ）
const PageTitle = styled(Typography)(({ theme }) => ({
  fontSize: '28px',
  fontWeight: 700,
  color: theme.palette.text.primary,
  lineHeight: 1.3,
  marginBottom: theme.spacing(1),

  // モバイル対応
  [theme.breakpoints.down('md')]: {
    fontSize: '24px',
  },

  [theme.breakpoints.down('sm')]: {
    fontSize: '20px',
  },
}));

// パンくずリスト (50代向けに大きめ)
const StyledBreadcrumbs = styled(Breadcrumbs)(({ theme }) => ({
  '& .MuiBreadcrumbs-ol': {
    fontSize: '16px',

    // モバイル対応
    [theme.breakpoints.down('sm')]: {
      fontSize: '14px',
    },
  },

  '& .MuiBreadcrumbs-li': {
    // パンくずアイテムの間隔
    '& a': {
      color: theme.palette.primary.main,
      textDecoration: 'none',
      padding: theme.spacing(0.5, 1),
      borderRadius: theme.spacing(0.5),
      transition: 'background-color 0.2s',
    },

    '& a:hover': {
      backgroundColor: theme.palette.primary.light + '20',
    },

    '& a:focus': {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: '2px',
      borderRadius: theme.spacing(0.5),
    },

    // 現在のページ　（リンクではない）
    '& .span': {
      color: theme.palette.text.primary,
      fontWeight: 500,
    },
  },
}));

// アクションボタンエリア
const ActionButtonArea = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1.5),
  alignItems: 'center',
  flexWrap: 'wrap',

  // モバイル対応
  [theme.breakpoints.down('sm')]: {
    gap: theme.spacing(1),
    justifyContent: 'flex-start',
  },
}));

// TypeScript型定義
export interface BreadcrumbItem {
  /**　パンくずのラベル */
  label: string;
  /** リンク先のパス（最後のアイテムの場合は省略可） */
  path?: string;
  /** アイコン（オプション） */
  icon?: React.ReactNode;
}

export interface PageHeaderProps {
  /** ページタイトル */
  title: string;
  /** パンくずリストのアイテム */
  breadcrumbs?: BreadcrumbItem[];
  /** アクションボタン　（新規追加ボタンなど） */
  actions?: React.ReactNode;
  /** サブタイトル　（オプション） */
  subtitle?: string;
  /** ヘッダー下の区切り線を表示するか */
  showDivider?: boolean;
}

/**
 * 50代向けページヘッダーコンポーネント
 *
 * @description
 * - ページタイトルの表示（大きめフォント）
 * - パンくずリスト（Breadcrumbs）
 * - アクションボタンの配置エリア
 * - レスポンシブ対応
 * - アクセシビリティ配慮
 */
export function PageHeader({
  title,
  breadcrumbs = [],
  actions,
  subtitle,
  showDivider = true,
}: PageHeaderProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // デフォルトのパンくずリスト（ホームページ）
  const defaultBreadcrumbs: BreadcrumbItem[] = [
    {
      label: 'ホーム',
      path: '/',
      icon: <HomeIcon sx={{ fontSize: '18px' }} />,
    },
  ];

  // パンくずリストのアイテムを結合
  const allBreadcrumbs =
    breadcrumbs.length > 0
      ? [...defaultBreadcrumbs, ...breadcrumbs]
      : defaultBreadcrumbs;

  return (
    <StyledPageHeader>
      {/* パンくずリスト */}
      {allBreadcrumbs.length > 0 && (
        <StyledBreadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="パンくずリスト"
          sx={{ marginBottom: 2 }}>
          {allBreadcrumbs.map((crumb, index) => {
            const isLast = index === allBreadcrumbs.length - 1;

            if (isLast || !crumb.path) {
              // 最後のアイテムまたはリンクがない場合
              return (
                <Box
                  key={index}
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {crumb.icon}
                  <span>{crumb.label}</span>
                </Box>
              );
            }

            // リンクがある場合
            return (
              <Link
                key={index}
                to={crumb.path}
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {crumb.icon}
                {crumb.label}
              </Link>
            );
          })}
        </StyledBreadcrumbs>
      )}

      {/* メインヘッダーエリア */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 2 : 3,
        }}>
        {/* タイトルエリア */}
        <Box sx={{ flex: 1 }}>
          <PageTitle variant="h1" component="h1">
            {title}
          </PageTitle>

          {subtitle && (
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                fontSize: '16px',
                lineHeight: 1.5,
                marginTop: 0.5,

                // モバイル対応
                [theme.breakpoints.down('sm')]: {
                  fontSize: '14px',
                },
              }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        {/* アクションボタンエリア */}
        {actions && <ActionButtonArea>{actions}</ActionButtonArea>}
      </Box>

      {/* 区切り線 */}
      {showDivider && (
        <Divider
          sx={{
            marginTop: 3,
            marginBottom: 0,

            // モバイル対応
            [theme.breakpoints.down('sm')]: {
              marginTop: 2,
            },
          }}
        />
      )}
    </StyledPageHeader>
  );
}

export default PageHeader;

/**
 * 使用例:
 *
 * ```tsx
 * // 基本的な使用
 * <PageHeader
 *   title="顧客管理"
 *   breadcrumbs={[
 *     { label: '顧客管理', path: '/customers' }
 *   ]}
 * />
 *
 * // アクションボタン付き
 * <PageHeader
 *   title="顧客一覧"
 *   subtitle="登録済み顧客の管理"
 *   breadcrumbs={[
 *     { label: '顧客管理', path: '/customers' },
 *     { label: '顧客一覧' }
 *   ]}
 *   actions={
 *     <>
 *       <Button variant="outlined" startIcon={<ImportIcon />}>
 *         インポート
 *       </Button>
 *       <Button variant="contained" startIcon={<AddIcon />}>
 *         新規顧客追加
 *       </Button>
 *     </>
 *   }
 * />
 * ```
 */
