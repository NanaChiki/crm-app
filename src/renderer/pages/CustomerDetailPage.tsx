/**
 * CustomerDetailPage.tsx
 *
 * 【50代向け顧客詳細管理メインページ】
 *
 * 50代後半の建築系自営業者向けCRMツールの顧客詳細画面。
 * 基本情報・サービス履歴・メンテナンス予測を統合的に管理し、
 * IT不慣れなユーザーでも迷わず操作できるタブ形式の包括的な詳細ページ。
 *
 * 【主な機能】
 * ✅ 3つのタブによる情報整理（基本情報・サービス履歴・メンテナンス予測）
 * ✅ React Router連携（/customers/:customerId）
 * ✅ 顧客ID自動取得・404エラー処理
 * ✅ 戻るボタン・ブレッドクラム表示
 * ✅ タブ切り替え・状態管理
 * ✅ 50代向け大きなタブボタン
 *
 * 【タブ構成】
 * タブ1: 基本情報（CustomerForm.tsx）- 顧客情報表示・編集
 * タブ2: サービス履歴（ServiceRecordList.tsx）- 年度別履歴管理
 * タブ3: メンテナンス予測（MaintenancePrediction.tsx）- 次回推奨時期予測
 *
 * 【50代配慮】
 * - 大きなタブボタン（最小48px高）
 * - 明確なアイコン・ラベル
 * - レスポンシブ対応
 * - 直感的なナビゲーション
 * - 親切な日本語メッセージ
 */
import {
  ArrowBack as ArrowBackIcon,
  History as HistoryIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

// Custom Components
import { CustomerForm } from '../components/customer/CustomerForm';
import { PageHeader } from '../components/layout/PageHeader';
import { MaintenancePrediction } from '../components/maintenance/MaintenancePrediction';
import { ServiceRecordList } from '../components/service/ServiceRecordList';
import { Button } from '../components/ui/Button';

// Custom Hooks
import { useApp } from '../contexts/AppContext';
import { useCustomer } from '../contexts/CustomerContext';
import { useServiceRecords } from '../hooks/useServiceRecords';

// Types
import { Customer } from '../../types';

// ================================
// 型定義・定数
// ================================

/** タブ識別子 */
type TabValue = 'info' | 'history' | 'maintenance';

// Page State
interface PageState {
  loading: boolean;
  error: string | null;
  currentTab: TabValue;
  hasUnsavedChanges: boolean;
}

// Tab setup
interface TabConfig {
  value: TabValue;
  label: string;
  icon: React.ReactNode;
  description: string;
}

// ================================
// タブ定義（50代向けアイコン・ラベル）
// ================================
const TAB_CONFIGS: TabConfig[] = [
  {
    value: 'info',
    label: '基本情報',
    icon: <PersonIcon />,
    description: '顧客の基本情報を表示・編集',
  },
  {
    value: 'history',
    label: 'サービス履歴',
    icon: <HistoryIcon />,
    description: '年度別のサービス履歴管理',
  },
  {
    value: 'maintenance',
    label: 'メンテナンス予測',
    icon: <ScheduleIcon />,
    description: '次回推奨時期の予測表示',
  },
];

// ================================
// メッセージ定義（50代配慮）
// ================================
const MESSAGES = {
  error: {
    customerNotFound: '指定された顧客が見つかりません。',
    invalidId: '無効な顧客IDです。',
    loadFailed: '顧客情報の読み込みに失敗しました。',
    networkError:
      '通信エラーが発生しました。しばらくしてから再度お試しください。',
  },
  confirm: {
    unsavedChanges: '変更が保存されていません。このまま移動しますか？',
    leaveTab: 'タブを切り替えますか？未保存の変更は失われます。',
  },
  info: {
    loading: '顧客情報を読み込んでいます...',
    tabChanged: 'タブを切り替えました。',
  },
  action: {
    backToList: '顧客一覧に戻る',
    reload: '再読み込み',
  },
} as const;

// ================================
// メインコンポーネント
// ================================
export const CustomerDetailPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  // Router hooks
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // ================================
  // 状態管理
  // ================================
  const [pageState, setPageState] = useState<PageState>({
    loading: true,
    error: null,
    currentTab: 'info',
    hasUnsavedChanges: false,
  });

  // ================================
  // Context API連携
  // ================================
  const {
    customers,
    selectedCustomer,
    selectCustomer,
    loading: customerLoading,
  } = useCustomer();
  const { showSnackbar, handleError } = useApp();

  // ================================
  // 計算値・メモ化データ
  // ================================

  /**
   * 現在の顧客データ
   */
  const currentCustomer = useMemo((): Customer | null => {
    if (!customerId || !customers.length) {
      return null;
    }

    const parsedId = parseInt(customerId, 10);
    if (Number.isNaN(parsedId)) {
      return null;
    }

    return (
      customers.find((customer) => customer.customerId === parsedId) || null
    );
  }, [customerId, customers]);

  // ================================
  // サービス履歴データ取得（タブ間で共有）
  // ================================

  /**
   * サービス履歴データの一元管理
   *
   * 【修正理由】ServiceRecordListとMaintenancePredictionで
   * 別々のuseServiceRecordsインスタンスを使用すると、
   * 片方でデータを更新しても他方が自動更新されない問題を解決。
   *
   * CustomerDetailPageで1つのインスタンスを管理し、
   * 両コンポーネントにpropsとして渡すことでデータを同期。
   */
  const serviceRecordsHook = useServiceRecords({
    customerId: currentCustomer?.customerId,
    autoLoad: true,
  });

  /**
   * ブレッドクラムデータ
   */
  const breadcrumbs = useMemo(() => {
    const baseBreadcrumbs = [
      { label: '顧客管理', href: '/customers', icon: <PeopleIcon /> },
    ];

    if (currentCustomer) {
      baseBreadcrumbs.push({
        label: currentCustomer.companyName,
        href: '',
        icon: <PersonIcon />,
      });
    }

    return baseBreadcrumbs;
  }, [currentCustomer]);

  /**
   * レスポンシブ設定
   */
  const responsiveSettings = useMemo(
    () => ({
      containerMaxWidth: 'xl' as const,
      tabSize: isMobile ? 'large' : 'medium',
      tabMinHeight: isMobile ? 56 : 48,
      fontSize: isMobile ? '16px' : '14px',
      spacing: isMobile ? 2 : 3,
      tabOrientation: isMobile ? 'horizontal' : 'horizontal',
      tabSpacing: isMobile ? 1 : 2,
    }),
    [isMobile, isTablet]
  );

  // ================================
  // 副作用処理
  // ================================

  /**
   * 顧客データ初期化・エラー処理
   */
  useEffect(() => {
    const initializeCustomer = async () => {
      try {
        // 顧客ID検証
        if (!customerId) {
          throw new Error(MESSAGES.error.invalidId);
        }

        const parsedId = parseInt(customerId, 10);
        if (Number.isNaN(parsedId)) {
          throw new Error(MESSAGES.error.invalidId);
        }

        // 顧客データが読み込まれるまで待機
        if (customerLoading || customers.length === 0) {
          console.log('⏳ 顧客データ読み込み待機中...');
          setPageState((prev) => ({ ...prev, loading: true, error: null }));
          // return;
        }

        // 顧客データ存在確認
        if (!currentCustomer) {
          throw new Error(MESSAGES.error.customerNotFound);
        }

        // 顧客選択
        selectCustomer(currentCustomer);

        setPageState((prev) => ({
          ...prev,
          loading: false,
          error: null,
        }));

        console.log(`✅ 顧客詳細ページ初期化: ${currentCustomer.companyName}`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : MESSAGES.error.loadFailed;
        setPageState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));

        // handleError の引数を修正（AppError型に準拠）
        handleError({
          message: errorMessage,
          type: 'NOT_FOUND',
        });

        console.error('❌ 顧客詳細ページエラー:', error);
      }
    };

    initializeCustomer();
  }, [
    customerId,
    customers.length,
    customerLoading,
    // Note: currentCustomer, selectCustomer, handleErrorは依存配列から除外
    // 理由: 無限ループ防止。customersとcustomerIdの変更のみを監視
  ]);

  /**
   * URL変更時のタブ同期
   */
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && ['info', 'history', 'maintenance'].includes(hash)) {
      setPageState((prev) => ({
        ...prev,
        currentTab: hash as TabValue,
      }));
    }
  }, [location.hash]);

  // ================================
  // イベントハンドラー
  // ================================

  /**
   * タブ切り替え処理
   */
  const handleTabChange = useCallback(
    async (event: React.SyntheticEvent, newTab: TabValue) => {
      // 未保存変更の確認
      if (pageState.hasUnsavedChanges) {
        const confirmed = window.confirm(MESSAGES.confirm.leaveTab);
        if (!confirmed) {
          return;
        }
      }

      setPageState((prev) => ({
        ...prev,
        currentTab: newTab,
        hasUnsavedChanges: false,
      }));

      // URL更新
      navigate(`${location.pathname}#${newTab}`, { replace: true });

      showSnackbar(MESSAGES.info.tabChanged, 'info', 2000);
    },
    [pageState.hasUnsavedChanges, navigate, location.pathname, showSnackbar]
  );

  /**
   * 未保存変更の検知
   */
  const handleUnsavedChanges = useCallback((hasChanges: boolean) => {
    setPageState((prev) => ({
      ...prev,
      hasUnsavedChanges: hasChanges,
    }));
  }, []);

  /**
   * 顧客一覧への戻る処理
   */
  const handleBackToList = useCallback(async () => {
    // 未保存変更の確認
    if (pageState.hasUnsavedChanges) {
      const confirmed = window.confirm(MESSAGES.confirm.unsavedChanges);
      if (!confirmed) {
        return;
      }
    }

    navigate('/customers');
  }, [pageState.hasUnsavedChanges, navigate]);

  /**
   * エラー再読み込み処理
   */
  const handleReload = useCallback(() => {
    window.location.reload();
  }, []);

  /**
   * ページヘッダーアクション
   * 計算値・メモ化データに含める
   */
  const headerActions = useMemo(
    () => [
      <Button
        key="back"
        variant="outlined"
        onClick={handleBackToList}
        startIcon={<ArrowBackIcon />}
        size={isMobile ? 'large' : 'medium'}
        sx={{
          minHeight: 44,
          fontSize: isMobile ? '16px' : '14px',
        }}>
        {MESSAGES.action.backToList}
      </Button>,
    ],
    [isMobile, handleBackToList]
  );

  // ================================
  // サブコンポーネント定義
  // ================================

  /**
   * ローディング表示
   */
  const renderLoading = () => (
    <Container maxWidth={responsiveSettings.containerMaxWidth} sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ fontSize: '18px' }}>
          {MESSAGES.info.loading}
        </Typography>
      </Box>
    </Container>
  );

  /**
   * エラー表示
   */
  const renderError = () => (
    <Container maxWidth={responsiveSettings.containerMaxWidth} sx={{ py: 4 }}>
      <Alert
        severity="error"
        sx={{
          mb: 3,
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
            <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            エラーが発生しました
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {pageState.error}
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" onClick={handleReload} size="small">
              {MESSAGES.action.reload}
            </Button>
            <Button variant="outlined" onClick={handleBackToList} size="small">
              {MESSAGES.action.backToList}
            </Button>
          </Stack>
        </Box>
      </Alert>
    </Container>
  );
  /**
   * タブコンテンツレンダリング
   *
   * 【修正】serviceRecordsHookを両コンポーネントに渡すことで
   * データの同期を実現
   */
  const renderTabContent = () => {
    if (!currentCustomer) {
      return null;
    }

    switch (pageState.currentTab) {
      case 'info':
        return (
          <CustomerForm
            customer={currentCustomer}
            onUnsavedChanges={handleUnsavedChanges}
          />
        );

      case 'history':
        return (
          <ServiceRecordList
            customerId={currentCustomer.customerId}
            serviceRecordsHook={serviceRecordsHook}
          />
        );

      case 'maintenance':
        return (
          <MaintenancePrediction
            customerId={currentCustomer.customerId}
            serviceRecordsHook={serviceRecordsHook}
          />
        );

      default:
        return null;
    }
  };

  // ================================
  // メインレンダー
  // ================================

  // ローディング状態
  if (pageState.loading) {
    return renderLoading();
  }

  if (!currentCustomer) {
    navigate('/customers');
    return;
  }

  // エラー状態
  if (pageState.error) {
    return renderError();
  }

  return (
    <Container
      maxWidth={responsiveSettings.containerMaxWidth}
      sx={{ py: responsiveSettings.spacing }}>
      {/* Page Header */}
      <PageHeader
        title={`${currentCustomer.companyName} 様`}
        breadcrumbs={breadcrumbs}
        actions={headerActions}
      />

      {/* Tab navigation */}
      <Paper sx={{ mb: responsiveSettings.spacing }}>
        <Tabs
          value={pageState.currentTab}
          onChange={handleTabChange}
          variant={isMobile ? 'fullWidth' : 'standard'}
          centered={!isMobile}
          sx={{
            '& .MuiTab-root': {
              minHeight: responsiveSettings.tabMinHeight,
              fontSize: responsiveSettings.fontSize,
              fontWeight: 'bold',
              textTransform: 'none',
              padding: isMobile ? '12px 16px' : '12px 24px',
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
              '&.Mui-selected': {
                color: theme.palette.primary.main,
                fontWeight: 'bold',
              },
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '2px 2px 0 0',
            },
          }}>
          {TAB_CONFIGS.map((tab) => (
            <Tab
              key={tab.value}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {tab.icon}
                  <Typography
                    component="span"
                    sx={{
                      fontSize: responsiveSettings.fontSize,
                      fontWeight: 'inherit',
                    }}>
                    {tab.label}
                  </Typography>
                </Box>
              }
              value={tab.value}
              aria-label={tab.description}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Tab content */}
      <Box sx={{ minHeight: '60vh' }}>{renderTabContent()}</Box>

      {/* 未保存変更インジケーター */}
      {pageState.hasUnsavedChanges && (
        <Alert
          severity="warning"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: theme.zIndex.snackbar,
            maxWidth: 300,
          }}>
          未保存の変更があります
        </Alert>
      )}
    </Container>
  );
};

export default CustomerDetailPage;

/**
 * 【50代ユーザー向け設計のポイント】
 *
 * 1. 統合的な顧客管理
 *    - 3つのタブで情報を整理（基本情報・履歴・予測）
 *    - タブ間の切り替えがスムーズ
 *    - 各タブの役割が明確
 *
 * 2. 直感的なナビゲーション
 *    - 大きなタブボタン（最小48px高）
 *    - アイコン付きラベルで識別しやすい
 *    - ブレッドクラム・戻るボタンで迷わない
 *
 * 3. エラーハンドリング
 *    - 404エラーの適切な処理
 *    - 親切な日本語エラーメッセージ
 *    - 再読み込み・戻るボタンで復旧支援
 *
 * 4. 状態管理
 *    - 未保存変更の検知・確認ダイアログ
 *    - URL同期によるブックマーク対応
 *    - タブ状態の永続化
 *
 * 5. レスポンシブ対応
 *    - モバイル：フルWidth タブ
 *    - デスクトップ：センタリング
 *    - デバイス別のサイズ調整
 *
 * 6. パフォーマンス最適化
 *    - useMemo/useCallbackによる最適化
 *    - 必要時のみ再レンダリング
 *    - Context APIとの効率的な連携
 *
 * この実装により、50代の建築系自営業者が顧客情報を
 * 包括的かつ効率的に管理できる最高品質のページが完成します。
 */
