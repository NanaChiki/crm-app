import { Box, Container, styled } from "@mui/material";
import React from "react";
import { Header } from "./Header";

// =============================
// 🔧 修正: MainContentArea の型安全な component prop 対応
// =============================

/**
 * 【修正内容】Material-UI styled component での component prop 型修正
 *
 * 問題: styled(Box) で component="main" を使用すると型エラー
 * 原因: Material-UI v5 の型定義で component prop が適切に推論されない
 * 解決策: ElementType を明示的に指定して型安全性を保つ
 */

// Main Content Area with proper component prop typing
const MainContentArea = styled(Box)<{ component?: React.ElementType }>(
  ({ theme }) => ({
    minHeight: "calc(100vh - 72px)", // 修正: 64px → 72px
    backgroundColor: theme.palette.background.default,
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(3),
    width: "100%", // 幅を明示的に指定

    // フレックスレイアウトでコンテンツを中央配置
    display: "flex",
    flexDirection: "column",
    alignItems: "center", // 子要素を横幅いっぱいに展開
  }),
);

// TypeScript Type Definition
interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout Component for 50 year olds
 *
 * @description
 *
 * - Layout component that contains the entire application
 * - Header component integrated with navigation
 * - Display page content with children prop
 * - Simple structure for 50 year olds to understand
 * - Responsive design with proper spacing
 *
 * 【50代向けレイアウト設計】
 * - 大きめのヘッダー（72px高）
 * - 十分な余白設定
 * - シンプルなフレックスレイアウト
 * - セマンティックHTML（main要素）の使用
 */
export function MainLayout({ children }: MainLayoutProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        width: "100%",
        overflow: "hidden", // 横スクロール防止
      }}
    >
      {/* =============================
       * Header Area - 統合済みナビゲーション
       * ============================= */}
      <Header />

      {/* =============================
       * Main Content Area - セマンティックHTML
       * ============================= */}
      <MainContentArea component="main">
        <Container
          maxWidth="xl"
          // 50代向けの適切な余白設定
          sx={{
            paddingX: { xs: 2, sm: 3, md: 4 },
            // コンテンツの垂直中央寄せ防止（上寄せ）
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {children}
        </Container>
      </MainContentArea>
    </Box>
  );
}

export type { MainLayoutProps };
