import {
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
} from "@mui/icons-material";
import {
  Box,
  Breadcrumbs,
  Divider,
  styled,
  Typography,
  useMediaQuery,
  useTheme,
  type TypographyProps,
} from "@mui/material";
import React, { useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

// 50代向けスタイルされたPageHeader
const StyledPageHeader = styled(Box)(({ theme }) => ({
  // 基本レイアウト
  padding: theme.spacing(3, 0),
  marginBottom: theme.spacing(2),

  // モバイル対応
  [theme.breakpoints.down("md")]: {
    padding: theme.spacing(2, 0),
    marginBottom: theme.spacing(1.5),
  },
}));

// ページタイトル（50代向けに大きめ - さらに拡大）
const PageTitle = styled(Typography)<TypographyProps>(({ theme }) => ({
  fontSize: "32px", // 28px → 32px
  fontWeight: 700,
  color: theme.palette.text.primary,
  lineHeight: 1.3,
  marginBottom: theme.spacing(1),

  // モバイル対応
  [theme.breakpoints.down("md")]: {
    fontSize: "28px", // 24px → 28px
  },

  [theme.breakpoints.down("sm")]: {
    fontSize: "24px", // 20px → 24px
  },
}));

// パンくずリスト (50代向けに大きめ - さらに拡大)
const StyledBreadcrumbs = styled(Breadcrumbs)(({ theme }) => ({
  "& .MuiBreadcrumbs-ol": {
    fontSize: "18px", // 16px → 18px
    fontWeight: 500, // 読みやすさ向上

    // モバイル対応
    [theme.breakpoints.down("sm")]: {
      fontSize: "16px", // 14px → 16px
    },
  },

  "& .MuiBreadcrumbs-li": {
    // パンくずアイテムの間隔
    "& a": {
      color: theme.palette.primary.main,
      textDecoration: "none",
      padding: theme.spacing(0.75, 1.25), // クリックエリア拡大
      borderRadius: theme.spacing(0.5),
      transition: "all 0.2s",
      fontWeight: 500,
      display: "flex",
      alignItems: "center",
      gap: theme.spacing(0.5),

      "&:hover": {
        backgroundColor: theme.palette.primary.light + "30",
        transform: "scale(1.02)", // わずかに拡大
        fontWeight: 600, // ホバー時に太く
      },

      "&:focus": {
        outline: `2px solid ${theme.palette.primary.main}`,
        outlineOffset: "2px",
        borderRadius: theme.spacing(0.5),
      },
    },

    // 現在のページ（リンクではない）
    "& > span": {
      color: theme.palette.text.primary,
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      gap: theme.spacing(0.5),
    },
  },
}));

// アクションボタンエリア
const ActionButtonArea = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(1.5),
  alignItems: "center",
  flexWrap: "wrap",

  // モバイル対応
  [theme.breakpoints.down("sm")]: {
    gap: theme.spacing(1),
    justifyContent: "flex-start",
  },
}));

// TypeScript型定義
export interface BreadcrumbItem {
  /** パンくずのラベル */
  label: string;
  /** リンク先のパス（最後のアイテムの場合は省略可） */
  path?: string;
  /** リンク先のパス（下位互換性のため、pathと同じ） */
  href?: string;
  /** アイコン（オプション） */
  icon?: React.ReactNode;
}

export interface PageHeaderProps {
  /** ページタイトル */
  title: string;
  /** パンくずリストのアイテム */
  breadcrumbs?: BreadcrumbItem[];
  /** アクションボタン（新規追加ボタンなど） */
  actions?: React.ReactNode;
  /** サブタイトル（オプション） */
  subtitle?: string;
  /** ヘッダー下の区切り線を表示するか */
  showDivider?: boolean;
}

// ルートパスから日本語ラベルへのマッピング
const routeLabels: Record<string, string> = {
  "/": "ダッシュボード",
  "/customers": "顧客管理",
  "/customers/new": "新規顧客登録",
  "/reminders": "リマインダー",
  "/reports": "集計レポート",
};

/**
 * 50代向けページヘッダーコンポーネント
 *
 * @description
 * - ページタイトルの表示（大きめフォント - 32px）
 * - 動的パンくずリスト（現在のルートから自動生成、常にクリック可能）
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
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const location = useLocation();
  const navigate = useNavigate();

  // 現在のパスから動的にパンくずリストを生成
  const dynamicBreadcrumbs = useMemo(() => {
    const pathSegments = location.pathname.split("/").filter(Boolean);
    const crumbs: BreadcrumbItem[] = [
      {
        label: "ホーム",
        path: "/",
        icon: <HomeIcon sx={{ fontSize: "20px" }} />,
      },
    ];

    // パスセグメントから階層的なパンくずを生成
    let currentPath = "";
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const label = routeLabels[currentPath] || segment;

      // 最後の要素以外は常にクリック可能
      crumbs.push({
        label,
        path: currentPath,
      });
    });

    return crumbs;
  }, [location.pathname]);

  // カスタムのパンくずが提供されている場合は、常にホームを先頭に追加
  const allBreadcrumbs = useMemo(() => {
    const homeCrumb: BreadcrumbItem = {
      label: "ホーム",
      path: "/",
      icon: <HomeIcon sx={{ fontSize: "20px" }} />,
    };

    if (breadcrumbs.length > 0) {
      // カスタムブレッドクラムがある場合、ホームを先頭に追加
      return [homeCrumb, ...breadcrumbs];
    }

    // カスタムブレッドクラムがない場合、動的生成を使用
    return dynamicBreadcrumbs;
  }, [breadcrumbs, dynamicBreadcrumbs]);

  return (
    <StyledPageHeader>
      {/* パンくずリスト - 常にクリック可能 */}
      {allBreadcrumbs.length > 0 && (
        <StyledBreadcrumbs
          separator={<NavigateNextIcon fontSize="medium" />}
          aria-label="パンくずリスト"
          sx={{ marginBottom: 2 }}
        >
          {allBreadcrumbs.map((crumb, index) => {
            const isLast = index === allBreadcrumbs.length - 1;
            // path または href のどちらかを使用（下位互換性）
            const linkPath = crumb.path || crumb.href || "";
            const hasLink = linkPath && linkPath.trim() !== "";

            if (isLast) {
              // 最後のアイテムはテキストのみ（現在のページ）
              return (
                <Box
                  key={index}
                  component="span"
                  sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  {crumb.icon}
                  <span>{crumb.label}</span>
                </Box>
              );
            }

            // 最後以外のアイテムで、リンクがある場合は常にクリック可能
            if (hasLink) {
              return (
                <Link
                  key={index}
                  to={linkPath}
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  {crumb.icon}
                  {crumb.label}
                </Link>
              );
            }

            // リンクがない場合はテキストのみ
            return (
              <Box
                key={index}
                component="span"
                sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
              >
                {crumb.icon}
                <span>{crumb.label}</span>
              </Box>
            );
          })}
        </StyledBreadcrumbs>
      )}

      {/* メインヘッダーエリア */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "center",
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 2 : 3,
        }}
      >
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
                fontSize: "18px", // 16px → 18px
                lineHeight: 1.5,
                marginTop: 0.5,
                fontWeight: 400,

                // モバイル対応
                [theme.breakpoints.down("sm")]: {
                  fontSize: "16px", // 14px → 16px
                },
              }}
            >
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
            [theme.breakpoints.down("sm")]: {
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
