import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { AppRouter } from './routes/AppRouter';
import { theme } from './styles/theme';

// =============================
// 🆕 Context Providers のインポート
// =============================
import { AppProvider } from './contexts/AppContext';
import { CustomerProvider } from './contexts/CustomerContext';

/**
 * 🎯 App Component - アプリケーションのルートコンポーネント
 *
 * 【Context階層の設計思想】
 *
 * 最適なProvider階層順序：
 * 1. AppProvider（最上位）     - グローバル状態管理（通知、エラー、ローディング）
 * 2. CustomerProvider          - 顧客データ特化状態管理（CRUD、検索、選択）
 * 3. ThemeProvider             - Material-UI テーマ設定
 * 4. BrowserRouter             - React Router ナビゲーション
 * 5. MainLayout                - レイアウト構造
 * 6. AppRouter                 - ページルーティング
 *
 * 【50代・低ITリテラシー向け配慮】
 * • Provider階層の複雑さをコンポーネント内で隠蔽
 * • エラー発生時は自動的にAppProviderのエラーハンドリングが動作
 * • シンプルで直感的なコンポーネント使用感を維持
 */

function App() {
  return (
    <AppProvider>
      <CustomerProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <BrowserRouter>
            <MainLayout>
              <AppRouter />
            </MainLayout>
          </BrowserRouter>
        </ThemeProvider>
      </CustomerProvider>
    </AppProvider>
  );
}

export default App;
