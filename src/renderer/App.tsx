import { BrowserRouter } from "react-router-dom";
import { Alert, CssBaseline, Snackbar } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";

import { MainLayout } from "./components/layout/MainLayout";
import { AppProvider, useApp } from "./contexts/AppContext";
import { BackupProvider } from "./contexts/BackupContext";
import { CSVProvider } from "./contexts/CSVContext";
import { CustomerProvider } from "./contexts/CustomerContext";
import { ReminderProvider } from "./contexts/ReminderContext";
import { AppRouter } from "./routes/AppRouter";
import { theme } from "./styles/theme";

/**
 * 🎯 App Component - アプリケーションのルートコンポーネント
 *
 * 【Context階層の設計思想】
 *
 * 最適なProvider階層順序：
 * 1. AppProvider（最上位）     - グローバル状態管理（通知、エラー、ローディング）
 * 2. CustomerProvider          - 顧客データ特化状態管理（CRUD、検索、選択）
 * 3. ReminderProvider          - リマインダーデータ管理（CRUD、OutLook連携）
 * 4. CSVProvider               - CSV出力機能
 * 5. BackupProvider            - バックアップ・リストア機能
 * 6. ThemeProvider             - Material-UI テーマ設定
 * 7. BrowserRouter             - React Router ナビゲーション
 * 8. MainLayout                - レイアウト構造
 * 9. AppRouter                 - ページルーティング
 *
 * 【50代・低ITリテラシー向け配慮】
 * • Provider階層の複雑さをコンポーネント内で隠蔽
 * • エラー発生時は自動的にAppProviderのエラーハンドリングが動作
 * • シンプルで直感的なコンポーネント使用感を維持
 */

/**
 * AppContent - スナックバー表示を含むメインコンテンツ
 *
 * 【設計理由】
 * - useApp()フックを使用するため、AppProvider内に配置
 * - スナックバーをアプリ全体で共有
 */
function AppContent() {
  const { snackbarMessage, hideSnackbar } = useApp();

  return (
    <>
      <CustomerProvider>
        <ReminderProvider>
          <CSVProvider>
            <BackupProvider>
              <ThemeProvider theme={theme}>
                <CssBaseline />
                <BrowserRouter>
                  <MainLayout>
                    <AppRouter />
                  </MainLayout>
                </BrowserRouter>
              </ThemeProvider>
            </BackupProvider>
          </CSVProvider>
        </ReminderProvider>
      </CustomerProvider>

      {/*
        グローバルスナックバー表示

        【50代向けUI配慮】
        - 画面下部中央に表示（見やすい位置）
        - 大きめのフォントサイズ（16px以上）
        - 自動非表示（5秒デフォルト）
        - 手動で閉じることも可能
      */}
      <Snackbar
        open={!!snackbarMessage}
        autoHideDuration={snackbarMessage?.duration || 5000}
        onClose={hideSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{
          // 50代向け：下部に余白を確保（ボタンと重ならない）
          bottom: { xs: 80, sm: 24 },
        }}
      >
        {snackbarMessage ? (
          <Alert
            onClose={hideSnackbar}
            severity={snackbarMessage.severity}
            variant="filled"
            sx={{
              // 50代向け：大きめのフォントと余白
              fontSize: "16px",
              minWidth: "300px",
              boxShadow: 3,
            }}
          >
            {snackbarMessage.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
