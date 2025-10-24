/**
 * AppRouter.tsx
 *
 * 【アプリケーション全体のルーティング設定】
 *
 * 50代後半の建築系自営業者向けCRMツールのルーティングシステム。
 * React Router DOM v7を使用し、直感的なURL構造とナビゲーションを提供。
 *
 * 【ルート構成】
 * / → Dashboard（ダッシュボード）
 * /customers → CustomerListPage（顧客一覧）
 * /customers/:customerId → CustomerDetailPage（顧客詳細）
 * /customers/new → CustomerFormPage（新規顧客登録）※未実装
 * /service/new → ServiceFormPage（サービス履歴登録）※未実装
 * /reports → ReportsPage（集計レポート）※未実装
 * * → NotFoundPage（404エラー）
 *
 * 【50代配慮】
 * - 分かりやすいURL構造（/customers、/reports等）
 * - 親切な404エラーページ
 * - ブラウザの戻る/進むボタン完全対応
 * - ブックマーク・URL共有サポート
 */

import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

// Pages - Phase 5A, 5B, 5C完成
import CustomerDetailPage from "../pages/CustomerDetailPage";
import CustomerFormPage from "../pages/CustomerFormPage";
import CustomerListPage from "../pages/CustomerListPage";
import Dashboard from "../pages/Dashboard";
import NotFoundPage from "../pages/NotFoundPage";
import ReminderListPage from "../pages/ReminderListPage";
import ReportsPage from "../pages/ReportsPage";
import SettingsPage from "../pages/SettingsPage";
// ================================
// 未実装ページ用プレースホルダー
// ================================

/**
 * ComingSoonPage - 未実装ページ用の一時的なプレースホルダー
 *
 * 【使用目的】
 * Phase 1 / Step 5C, 5D, 5E実装時に実際のコンポーネントに置き換えるための
 * 一時的な表示コンポーネント。ユーザーに開発中であることを明示。
 *
 * 【Step別実装予定】
 * - Phase 1 / Step 5C: CustomerFormPage（新規顧客登録）
 * - Phase 1 / Step 5D: ServiceFormPage（サービス履歴登録）
 * - Phase 1 / Step 5E: ReportsPage（集計レポート）
 */
const ComingSoonPage: React.FC<{ pageName: string }> = ({ pageName }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "70vh",
      padding: "20px",
    }}
  >
    <h1 style={{ fontSize: "48px", marginBottom: "16px" }}>🚧</h1>
    <h2 style={{ fontSize: "24px", marginBottom: "8px", fontWeight: "bold" }}>
      {pageName}は準備中です
    </h2>
    <p style={{ fontSize: "16px", color: "#666", textAlign: "center" }}>
      このページは現在開発中です。
      <br />
      もうしばらくお待ちください。
    </p>
  </div>
);

/**
 * AppRouter - メインルーティングコンポーネント
 *
 * 【実装のポイント】
 * 1. Routes内でのルート定義
 *    - 各ページへのパスを明確に定義
 *    - パラメータ付きルート（:customerId）のサポート
 *
 * 2. 404エラーハンドリング
 *    - ワイルドカード（*）で未定義ルートをキャッチ
 *    - 親切なNotFoundPageへ誘導
 *
 * 3. 未実装ページの準備
 *    - ComingSoonPageで将来のページを準備
 *    - 実装完了後に簡単に置き換え可能
 *
 * 4. TypeScript型安全性
 *    - React.FCによる型定義
 *    - パラメータの型安全な処理
 */
export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* ================================
          メインページ
          ================================ */}

      {/* ダッシュボード - ホーム画面 */}
      <Route path="/" element={<Dashboard />} />

      {/* ダッシュボードへのリダイレクト（/homeも許容） */}
      <Route path="/home" element={<Navigate to="/" replace />} />

      {/* ================================
          顧客管理ページ
          ================================ */}

      {/* 顧客一覧ページ - Phase 1 / Step 5A完成 */}
      <Route path="/customers" element={<CustomerListPage />} />

      {/* 新規顧客登録ページ - Phase 1 / Step 5C完成 ✅ */}
      {/* 注意: /customers/:customerIdより先に定義する必要がある */}
      <Route path="/customers/new" element={<CustomerFormPage />} />

      {/* 顧客詳細ページ - Phase 1 / Step 5B完成 */}
      {/* :customerIdパラメータで特定の顧客を表示 */}
      <Route path="/customers/:customerId" element={<CustomerDetailPage />} />

      {/* ================================
          サービス履歴管理
          ================================ */}

      {/* サービス履歴登録ページ - Phase 1 / Step 5D未実装 */}
      <Route
        path="/service/new"
        element={<ComingSoonPage pageName="サービス履歴登録" />}
      />

      {/* ================================
          集計・レポート
          ================================ */}
      {/* 集計レポートページ - Phase 5E完成 */}
      <Route path="/reports" element={<ReportsPage />} />

      {/* ================================
          リマインダー管理（Phase 2）
          ================================ */}
      {/* リマインダー管理ページ - Phase 2B完成 */}
      <Route path="/reminders" element={<ReminderListPage />} />

      {/* ================================
          設定（Phase 3A）
          ================================ */}
      {/* 設定ページ - Phase 3A完成 */}
      <Route path="/settings" element={<SettingsPage />} />

      {/* ================================
          エラーページ
          ================================ */}

      {/* 404 Not Found - 未定義ルート */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRouter;

/**
 * 【将来の拡張予定】
 *
 * Phase 1 / Step 5C実装時:
 * - ComingSoonPage → CustomerFormPage に置き換え
 * - /customers/new ルートを有効化
 * - import CustomerFormPage from '../pages/CustomerFormPage';
 *
 * Phase 1 / Step 5D実装時:
 * - ComingSoonPage → ServiceFormPage に置き換え
 * - /service/new ルートを有効化
 * - import ServiceFormPage from '../pages/ServiceFormPage';
 *
 * Phase 5E実装時:
 * - ComingSoonPage → ReportsPage に置き換え
 * - /reports ルートを有効化
 * - import ReportsPage from '../pages/ReportsPage';
 *
 * Phase 2（リマインダー機能）実装時:
 * - /reminders ルート追加
 * - /settings ルート追加（OutLook連携設定）
 * - import RemindersPage from '../pages/RemindersPage';
 * - import SettingsPage from '../pages/SettingsPage';
 */
