/**
 * uiDesignSystem.ts
 *
 * 【50代向けCRM UI Design System】
 *
 * すべてのページ・コンポーネントで統一されたデザイン定数を提供。
 * Production-ready で見やすく、直感的に使いやすいUIを実現。
 */

// ================================
// フォントサイズ（50代向け）
// ================================

export const FONT_SIZES = {
  // ページタイトル
  pageTitle: {
    desktop: "32px",
    tablet: "28px",
    mobile: "24px",
  },

  // セクションタイトル（ページ内の大きな区分）
  sectionTitle: {
    desktop: "24px",
    tablet: "22px",
    mobile: "20px",
  },

  // サブタイトル
  subtitle: {
    desktop: "18px",
    tablet: "18px",
    mobile: "16px",
  },

  // パンくずリスト
  breadcrumbs: {
    desktop: "18px",
    tablet: "18px",
    mobile: "16px",
  },

  // カードタイトル
  cardTitle: {
    desktop: "20px",
    tablet: "18px",
    mobile: "18px",
  },

  // 本文
  body: {
    desktop: "16px",
    tablet: "16px",
    mobile: "14px",
  },

  // ラベル
  label: {
    desktop: "14px",
    tablet: "14px",
    mobile: "12px",
  },

  // ボタンテキスト
  button: {
    large: "16px",
    medium: "14px",
    small: "12px",
  },
} as const;

// ================================
// スペーシング（パディング・マージン）
// ================================

export const SPACING = {
  // ページ全体のパディング
  page: {
    desktop: 3, // theme.spacing(3) = 24px
    tablet: 2, // 16px
    mobile: 2, // 16px
  },

  // カードのパディング
  card: {
    desktop: 3, // 24px
    tablet: 2.5, // 20px
    mobile: 2, // 16px
  },

  // セクション間のマージン
  section: {
    desktop: 4, // 32px
    tablet: 3, // 24px
    mobile: 2, // 16px
  },

  // アイテム間のギャップ
  gap: {
    large: 3, // 24px
    medium: 2, // 16px
    small: 1, // 8px
  },
} as const;

// ================================
// カード最小高さ（統一性のため）
// ================================

export const CARD_MIN_HEIGHT = {
  // 顧客カード
  customer: {
    desktop: 280,
    tablet: 240,
    mobile: 220,
  },

  // メンテナンス予測カード
  maintenance: {
    desktop: 450,
    tablet: 420,
    mobile: 400,
  },

  // サービス履歴カード
  service: {
    desktop: 180,
    tablet: 160,
    mobile: 140,
  },

  // レポートカード
  report: {
    desktop: 200,
    tablet: 180,
    mobile: 160,
  },
} as const;

// ================================
// ボタンサイズ（50代向け）
// ================================

export const BUTTON_SIZE = {
  // 最小タッチターゲット（WCAG基準）
  minHeight: {
    desktop: 48,
    tablet: 44,
    mobile: 48, // モバイルは大きめ
  },

  minWidth: {
    desktop: 120,
    tablet: 100,
    mobile: 100,
  },

  // パディング
  padding: {
    large: "12px 24px",
    medium: "10px 20px",
    small: "8px 16px",
  },
} as const;

// ================================
// グリッドレイアウト
// ================================

export const GRID_LAYOUT = {
  // 顧客一覧（3カラム）
  customerList: {
    xs: 12,
    sm: 12,
    md: 6,
    lg: 4,
    xl: 4,
  },

  // メンテナンス予測（2カラム）
  maintenancePrediction: {
    xs: 12,
    sm: 12,
    md: 6,
    lg: 6,
    xl: 6,
  },

  // レポート（2カラム）
  report: {
    xs: 12,
    sm: 12,
    md: 6,
    lg: 6,
    xl: 6,
  },

  // ダッシュボードクイックアクション（3カラム）
  dashboardAction: {
    xs: 12,
    sm: 12,
    md: 4,
    lg: 4,
    xl: 4,
  },
} as const;

// ================================
// レスポンシブブレークポイント
// ================================

export const BREAKPOINTS = {
  mobile: "sm", // 0-600px
  tablet: "md", // 600-900px
  desktop: "lg", // 900px+
} as const;

// ================================
// アニメーション
// ================================

export const ANIMATION = {
  // トランジション時間
  duration: {
    fast: "0.15s",
    normal: "0.2s",
    slow: "0.3s",
  },

  // イージング
  easing: "ease-in-out",

  // ホバー時の拡大率
  hoverScale: 1.02,
  buttonHoverScale: 1.05,
} as const;

// ================================
// アイコンサイズ
// ================================

export const ICON_SIZE = {
  large: "28px",
  medium: "20px",
  small: "16px",
  tiny: "14px",
} as const;

// ================================
// ヘルパー関数
// ================================

/**
 * レスポンシブフォントサイズを取得
 */
export const getResponsiveFontSize = (
  type: Exclude<keyof typeof FONT_SIZES, "button">,
  breakpoint: keyof typeof BREAKPOINTS,
): string => {
  const sizes = FONT_SIZES[type];
  if ("mobile" in sizes && "tablet" in sizes && "desktop" in sizes) {
    switch (breakpoint) {
      case "mobile":
        return sizes.mobile;
      case "tablet":
        return sizes.tablet;
      case "desktop":
        return sizes.desktop;
      default:
        return sizes.desktop;
    }
  }
  return "16px"; // fallback
};

/**
 * レスポンシブスペーシングを取得
 */
export const getResponsiveSpacing = (
  type: Exclude<keyof typeof SPACING, "gap">,
  breakpoint: keyof typeof BREAKPOINTS,
): number => {
  const spacing = SPACING[type];
  if ("mobile" in spacing && "tablet" in spacing && "desktop" in spacing) {
    switch (breakpoint) {
      case "mobile":
        return spacing.mobile;
      case "tablet":
        return spacing.tablet;
      case "desktop":
        return spacing.desktop;
      default:
        return spacing.desktop;
    }
  }
  return 2; // fallback
};

/**
 * カード最小高さをMUI sx形式で取得
 */
export const getCardMinHeight = (type: keyof typeof CARD_MIN_HEIGHT) => {
  const heights = CARD_MIN_HEIGHT[type];
  return {
    xs: heights.mobile,
    sm: heights.tablet,
    md: heights.desktop,
  };
};

/**
 * グリッドレイアウトサイズを取得
 */
export const getGridSize = (type: keyof typeof GRID_LAYOUT) => {
  return GRID_LAYOUT[type];
};

// ================================
// エクスポート
// ================================

export const UI_DESIGN_SYSTEM = {
  FONT_SIZES,
  SPACING,
  CARD_MIN_HEIGHT,
  BUTTON_SIZE,
  GRID_LAYOUT,
  BREAKPOINTS,
  ANIMATION,
  ICON_SIZE,
} as const;

export default UI_DESIGN_SYSTEM;
