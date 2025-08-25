import { createTheme } from '@mui/material/styles';

// 50代ユーザー向けの大きめ・見やすいテーマ
export const theme = createTheme({
  palette: {
    primary: {
      main: '#2563eb',
    },
    secondary: {
      main: '#10b981',
    },
    error: {
      main: '#e44444',
    },
    background: {
      default: '#f9fafb',
    },
  },
  typography: {
    fontSize: 16, // デフォルトより大きく
    fontFamily: '"Noto Sans JP", sans-serif',
    button: {
      fontSize: '16px',
      fontWeight: 600,
    },
    h1: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        size: 'large',
      },
      styleOverrides: {
        root: {
          minHeight: 48, // 大きなタッチ領域
          borderRadius: 8, // 角を丸く
          textTransform: 'none', // 全て大文字にしない
        },
      },
    },
  },
});
