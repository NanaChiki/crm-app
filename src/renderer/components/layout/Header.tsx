import {
  Assessment as AssessmentIcon,
  Dashboard as DashboardIcon,
  Home as HomeIcon,
  Notifications as NotificationsIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import {
  AppBar,
  Box,
  Button,
  Toolbar,
  Typography,
  styled,
  useMediaQuery,
  useTheme,
  type ButtonProps,
  type TypographyProps,
} from '@mui/material';
import React from 'react';
import {
  Link as RouterLink,
  useLocation,
  useNavigate,
  type LinkProps,
} from 'react-router-dom'; // ← useNavigateを追加

// AppBar styled for those in their 50s
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  // Set the header height bigger
  '& .MuiToolbar-root': {
    minHeight: '72px', // for those in their 50s
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),

    // Mobile styles
    [theme.breakpoints.down('md')]: {
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
      minHeight: '64px',
    },
  },

  // Shadow and Border
  boxShadow: theme.shadows[1],
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

// =============================
// 🔧 修正: NavButton の型定義
// =============================

/**
 * 【修正内容】React Router Link との互換性を追加
 *
 * Material-UI v5 でButtonとReact Router Linkを組み合わせる際の型問題を解決：
 * 1. LinkProps から必要な props を抽出
 * 2. ButtonProps と組み合わせて型安全性を保つ
 * 3. shouldForwardProp でカスタムpropsを適切に処理
 */

// React Router Link の主要プロパティを抽出（オプショナルに変更）
type RouterLinkProps = Partial<Pick<LinkProps, 'to' | 'replace' | 'state'>>;

// NavButton用の拡張型定義
interface NavButtonProps
  extends Omit<ButtonProps, 'href' | 'component'>,
    RouterLinkProps {
  isActive?: boolean;
  component?: React.ElementType; // componentプロパティを明示的に追加
}

const NavButton = styled(Button, {
  shouldForwardProp: (prop) =>
    prop !== 'isActive' && // カスタムprop
    prop !== 'to' && // Router prop
    prop !== 'replace' && // Router prop
    prop !== 'state' && // Router prop
    prop !== 'component', // React Router component prop
})<NavButtonProps>(({ theme, isActive }) => ({
  // Basic styles
  minHeight: '48px',
  minWidth: '120px',
  fontSize: '16px',
  fontWeight: 600,
  textTransform: 'none',
  borderRadius: theme.spacing(1),
  padding: theme.spacing(1.5, 3),
  margin: theme.spacing(0, 0.5),

  // Icon and letter spacing
  '& .MuiButton-startIcon': {
    marginRight: theme.spacing(1),
    fontSize: '20px',
  },

  // Active state
  ...(isActive && {
    backgroundColor: theme.palette.primary.dark,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.primary.main,
    },
  }),

  // Focused state (accessibility)
  '&:focus': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: '2px',
  },

  // Mobile styles
  [theme.breakpoints.down('md')]: {
    minWidth: '100px',
    fontSize: '14px',
    padding: theme.spacing(1, 2),
    minHeight: '44px',

    '& .MuiButton-startIcon': {
      fontSize: '18px',
      marginRight: theme.spacing(0.5),
    },
  },

  // Hide texts on small screens
  [theme.breakpoints.down('sm')]: {
    minWidth: '44px',
    padding: theme.spacing(1),

    '& .MuiButton-startIcon': {
      marginRight: 0,
    },

    '& .nav-text': {
      display: 'none',
    },
  },
}));

// App Title
const AppTitle = styled(Typography)<TypographyProps>(({ theme }) => ({
  fontSize: '24px',
  fontWeight: 700,
  letterSpacing: '0.5px',
  color: theme.palette.primary.contrastText,
  flexGrow: 1,

  // Mobile styles
  [theme.breakpoints.down('md')]: {
    fontSize: '18px',
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '16px',
  },
}));

// Navigation Buttons
const navigationItems = [
  {
    path: '/',
    label: 'ダッシュボード',
    icon: <HomeIcon />,
    ariaLabel: 'ダッシュボードページへ移動',
  },
  {
    path: '/customers',
    label: '顧客管理',
    icon: <PeopleIcon />,
    ariaLabel: '顧客管理ページへ移動',
  },
  {
    path: '/reminders',
    label: 'リマインダー',
    icon: <NotificationsIcon />,
    ariaLabel: 'リマインダーページへ移動',
  },
  {
    path: '/reports',
    label: '集計レポート',
    icon: <AssessmentIcon />,
    ariaLabel: '集計レポートページへ移動',
  },
] as const;

/**
 * Header Component for those who are in their 50s
 *
 * @description
 * - Top navigation used AppBar
 * - Bigger button format menu (More than or equal to 44px)
 * - Combination of Icon and Text
 * - React Router Link for navigation
 * - Responsive design
 * - Accessibility considerations
 */

export function Header() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  const navigate = useNavigate();

  /**
   * ナビゲーションハンドラー
   *
   * 【修正理由】styled-componentsとReact Router Linkの組み合わせで
   * ナビゲーションが動作しない問題を解決するため、
   * useNavigate()フックを使った明示的なナビゲーションに変更
   */
  const handleNavigate = (path: string) => {
    console.log(`🔗 Header ナビゲーション: ${path}`);
    navigate(path);
  };

  return (
    <StyledAppBar position="static" color="primary" elevation={3}>
      <Toolbar>
        {/* App Title*/}
        <AppTitle variant="h6" component="h1">
          <Box
            component={RouterLink}
            to="/"
            sx={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
              '&:hover': {
                outline: `2px solid ${theme.palette.primary.main}`,
                outlineOffset: '2px',
                borderRadius: theme.spacing(0.5),
              },
            }}
            aria-label="ホームページに戻る">
            <HomeIcon
              sx={{
                marginRight: 1,
                fontSize: isMobile ? '20px' : '28px',
              }}
            />
            建築事業者向けCRM
          </Box>
        </AppTitle>

        {/* Navigation Menu*/}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 0.5, md: 1 },
          }}>
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <NavButton
                key={item.path}
                startIcon={item.icon}
                isActive={isActive}
                aria-label={item.ariaLabel}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => handleNavigate(item.path)}>
                <span className="nav-text">{item.label}</span>
              </NavButton>
            );
          })}

          {/* Demo Page Link (Development Only)*/}
          <NavButton
            startIcon={<DashboardIcon />}
            isActive={location.pathname === '/ui-demo'}
            aria-label="UIデモページへ移動"
            aria-current={location.pathname === '/ui-demo' ? 'page' : undefined}
            onClick={() => handleNavigate('/ui-demo')}
            sx={{
              // Remove on production
              opacity: 0.8,
              fontSize: { xs: '12px', md: '14px' },
            }}>
            <span className="nav-text">UIデモ</span>
          </NavButton>
        </Box>
      </Toolbar>
    </StyledAppBar>
  );
}
