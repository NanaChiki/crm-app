/**
 * CustomerListPage.tsx
 *
 * 【50代向け顧客一覧メインページ】
 *
 * 50代後半の建築系自営業者向けCRMツールの中核となる顧客一覧画面。
 * IT不慣れなユーザーでも直感的に操作でき、営業対象の工務店を
 * 即座に特定できる、Card形式の分かりやすい一覧表示を提供。
 *
 * 【主な機能】
 * ✅ 全顧客のCard形式一覧表示
 * ✅ useCustomer検索による顧客フィルタリング
 * ✅ ページング機能（10件ずつ表示）
 * ✅ レスポンシブ対応（デスクトップ3列、タブレット2列、モバイル1列）
 * ✅ 新規顧客登録FAB（Floating Action Button）
 * ✅ 各顧客から詳細画面への遷移
 * ✅ ソート機能（更新日・会社名順）
 * ✅ ローディング・エラー・空データ状態表示
 *
 * 【Context API連携】
 * - useCustomer: 顧客データ・CRUD操作・検索機能
 * - useApp: グローバル通知・エラーハンドリング
 *
 * 【50代配慮】
 * - 大きなCard・ボタン（最小44px×44px）
 * - 読みやすいフォントサイズ（16px以上）
 * - 明確な操作フィードバック
 * - シンプルで直感的なレイアウト
 * - 親切な日本語メッセージ
 */

import {
  Add as AddIcon,
  List as ListIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Fab,
  Grid,
  Pagination,
  Paper,
  Skeleton,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// // Custom Hooks
import { useApp } from '../contexts/AppContext';
import { useCustomer } from '../contexts/CustomerContext';

// // Components
import { CustomerCard } from '../components/customer/CustomerCard';
import CustomerSearchBar from '../components/customer/CustomerSearchBar';
import PageHeader from '../components/layout/PageHeader';

// Design System
import { GRID_LAYOUT, SPACING } from '../constants/uiDesignSystem';

// Types, 型定義・定数
import { Customer, SortOrder } from '../../types';

// ページング設定
const ITEMS_PER_PAGE = 10;

// ソートオプション定義
const SORT_OPTIONS: SortOrder[] = [
  { field: 'updatedAt', direction: 'desc', label: '更新日（新しい順）' },
  { field: 'companyName', direction: 'asc', label: '会社名（あいうえお順）' },
  { field: 'createdAt', direction: 'desc', label: '登録日（新しい順）' },
];

// レスポンシブ設定（Design System統一）
const RESPONSIVE_COLUMNS = {
  size: GRID_LAYOUT.customerList,
};

// ================================
// メインコンポーネント
// ================================

/**
 * CustomerListPage - 顧客一覧ページ
 */
export const CustomerListPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // ================================
  // 状態管理
  // ================================
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSort, setSelectedSort] = useState<SortOrder>(SORT_OPTIONS[0]);

  // ================================
  // Context連携
  // ================================

  // 顧客データ管理・検索機能
  const {
    customers,
    loading,
    refreshCustomers,
    filteredCustomers,
    searchTerm,
    searchCustomers,
    clearSearch,
  } = useCustomer();

  // グローバル通知
  const { showSnackbar } = useApp();

  // ================================
  // データ処理ロジック
  // ================================

  /**
   * 表示用顧客データの計算
   * 検索結果 vs 全顧客データの切り替え、ソート処理
   */
  const displayCustomers = useMemo(() => {
    const baseData = searchTerm ? filteredCustomers : customers;

    // ソート処理
    const sortedData = [...baseData].sort((a, b) => {
      const fieldA = a[selectedSort.field as keyof Customer] || '';
      const fieldB = b[selectedSort.field as keyof Customer] || '';

      if (selectedSort.direction === 'desc') {
        return fieldB > fieldA ? 1 : -1;
      } else {
        return fieldA > fieldB ? 1 : -1;
      }
    });

    console.log(
      `表示用顧客データ計算: ${sortedData.length}件（ソート: ${selectedSort.label}）`
    );
    return sortedData;
  }, [customers, filteredCustomers, searchTerm, selectedSort]);

  /**
   * ページング計算
   * 総件数・総ページ数・現在ページのデータ取得
   */
  const paginationData = useMemo(() => {
    const totalItems = displayCustomers.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pageData = displayCustomers.slice(startIndex, endIndex);

    return {
      totalItems,
      totalPages,
      pageData,
      hasData: totalItems > 0,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, totalItems),
    };
  }, [displayCustomers, currentPage]);

  // ================================
  // イベントハンドラー
  // ================================

  /**
   * 検索実行
   */
  const handleSearch = useCallback(
    (keyword: string) => {
      if (keyword.trim()) {
        searchCustomers(keyword.trim());
        setCurrentPage(1);
        console.log(`顧客検索実行: "${keyword}"`);
        showSnackbar(`"${keyword}"で検索しました`, 'info');
      } else {
        clearSearch();
      }
    },
    [searchCustomers, clearSearch, showSnackbar]
  );

  /**
   * 検索クリア
   */
  const handleClearSearch = useCallback(() => {
    clearSearch();
    setCurrentPage(1);
    console.log('顧客検索をクリア');
    showSnackbar('検索をクリアしました', 'info');
  }, [clearSearch, showSnackbar]);

  /**
   * 顧客カードクリック - 詳細画面遷移
   */
  const handleCustomerClick = useCallback(
    (customerId: number) => {
      console.log(`顧客詳細画面へ遷移: ${customerId}`);
      navigate(`/customers/${customerId}`);
    },
    [navigate]
  );

  /**
   * ページ変更
   */
  const handlePageChange = useCallback(
    (_: React.ChangeEvent<unknown>, page: number) => {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      console.log(`ページ変更: ${page}/${paginationData.totalPages}`);
    },
    [paginationData.totalPages]
  );

  /**
   * 新規顧客登録画面遷移
   */
  const handleNewCustomer = useCallback(() => {
    console.log('新規顧客登録画面へ遷移');
    navigate('/customers/new');
  }, [navigate]);

  /**
   * データ再読み込み
   */
  const handleRefresh = useCallback(async () => {
    console.log('顧客データ再読み込み');
    await refreshCustomers();
    showSnackbar('顧客情報を更新しました', 'success');
  }, [refreshCustomers, showSnackbar]);

  // ================================
  // 副作用処理
  // ================================

  /**
   * 初期データ読み込み
   */
  useEffect(() => {
    if (customers.length === 0 && !loading) {
      console.log('初期顧客データ読み込み開始 (CustomerListPage.tsx)');
      refreshCustomers();
    }
  }, [customers.length, loading, refreshCustomers]);

  /**
   * 検索条件変更時のページリセット
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // ================================
  // UI状態コンポーネント
  // ================================

  /**
   * ローディング状態表示
   */
  const renderLoadingState = () => (
    <Grid container spacing={3}>
      {[...Array(6)].map((_, index) => (
        <Grid key={index} {...RESPONSIVE_COLUMNS}>
          <Skeleton
            variant="rectangular"
            height={280}
            sx={{ borderRadius: 2 }}
            animation="wave"
          />
        </Grid>
      ))}
    </Grid>
  );

  /**
   * エラー状態表示
   */
  const renderErrorState = () => (
    <Paper sx={{ p: 4, textAlign: 'center' }}>
      <Alert
        severity="error"
        sx={{
          fontSize: '16px',
          alignItems: 'center',
          '& .MuiAlert-message': {
            fontSize: '16px',
          },
        }}
        action={
          <Button
            color="inherit"
            size="large"
            onClick={handleRefresh}
            startIcon={<RefreshIcon />}
            sx={{ minHeight: 44 }}>
            再読み込み
          </Button>
        }>
        <Box>
          <Typography variant="h6" sx={{ mb: 1, fontSize: '18px' }}>
            顧客情報の再読み込みに失敗しました
          </Typography>
          <Typography variant="body1">
            インターネット接続を確認してから「再読み込み」をお試しください
          </Typography>
        </Box>
      </Alert>
    </Paper>
  );

  /**
   * 検索結果なし状態
   */
  const renderNoResultsState = () => (
    <Paper sx={{ p: 4, textAlign: 'center' }}>
      <SearchIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
      <Typography
        variant="h5"
        color="text.primary"
        gutterBottom
        sx={{ fontSize: '20px' }}>
        "{searchTerm}"に一致する顧客が見つかりません
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 3, fontSize: '16px' }}>
        別のキーワードで検索するか、検索条件をクリアしてください
      </Typography>
      <Button
        variant="contained"
        onClick={handleClearSearch}
        size="large"
        sx={{ minHeight: 44, fontSize: '16px' }}>
        検索をクリア
      </Button>
    </Paper>
  );

  /**
   * データなし状態（初回訪問時）
   */
  const renderEmptyState = () => (
    <Paper sx={{ p: 4, textAlign: 'center' }}>
      <WarningIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
      <Typography
        variant="h5"
        color="text.primary"
        gutterBottom
        sx={{ fontSize: '20px' }}>
        まだ顧客が登録されていません
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 3, fontSize: '16px' }}>
        最初の顧客を登録して、CRM管理を始めましょう
      </Typography>
      <Button
        variant="contained"
        onClick={handleNewCustomer}
        size="large"
        sx={{ minHeight: 48, fontSize: '16px', px: 4 }}>
        新規顧客を登録
      </Button>
    </Paper>
  );

  /**
   * 顧客一覧表示
   */
  const renderCustomerList = () => (
    <>
      {/* ページング情報 */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 1,
        }}>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ fontSize: '16px' }}>
          {paginationData.startIndex}〜{paginationData.endIndex}件 / 全
          {paginationData.totalItems}件
        </Typography>

        {!isMobile && (
          <Button
            variant="text"
            onClick={handleRefresh}
            startIcon={
              loading.isLoading ? (
                <CircularProgress size={16} />
              ) : (
                <RefreshIcon />
              )
            }
            disabled={loading.isLoading}
            sx={{ fontSize: '14px' }}>
            {loading.isLoading ? '更新中...' : '最新情報に更新'}
          </Button>
        )}
      </Box>

      {/* 顧客カード一覧 */}
      <Grid container spacing={3}>
        {paginationData.pageData.map((customer) => (
          <Grid key={customer.customerId} {...RESPONSIVE_COLUMNS}>
            <CustomerCard
              customer={customer}
              onClick={handleCustomerClick}
              showActions={true}
            />
          </Grid>
        ))}
      </Grid>

      {/* ページング */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Pagination
          count={paginationData.totalPages}
          page={currentPage}
          onChange={handlePageChange}
          color="primary"
          size={isMobile ? 'medium' : 'large'}
          showFirstButton
          showLastButton
          sx={{
            '& .MuiPaginationItem-root': {
              minHeight: 44,
              minWidth: 44,
              fontSize: '16px',
            },
          }}
        />
      </Box>
    </>
  );

  // ================================
  // メインレンダー
  // ================================

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* ページヘッダー */}
      <PageHeader
        title="顧客一覧"
        subtitle={`${paginationData.totalItems}件の顧客が登録されています`}
        breadcrumbs={[
          { label: '顧客管理', path: '/customers', icon: <PeopleIcon /> },
          { label: '一覧', icon: <ListIcon /> },
        ]}
      />

      {/* 検索バー */}
      <CustomerSearchBar
        onSearch={handleSearch}
        onClear={handleClearSearch}
        onSortChange={setSelectedSort}
        selectedSort={selectedSort}
        sortOptions={SORT_OPTIONS}
        isLoading={loading.isLoading}
        resultCount={paginationData.totalItems}
        searchKeyword={searchTerm}
      />

      {/* メインコンテンツ */}
      <Box sx={{ mb: 2, mt: 2 }}>
        {/* エラー状態 */}
        {loading.error && renderErrorState()}

        {/* ローディング状態 */}
        {!loading.error && loading.isLoading && renderLoadingState()}

        {/* データなし状態 （初回）*/}
        {!loading.error &&
          !loading.isLoading &&
          !searchTerm &&
          customers.length === 0 &&
          renderEmptyState()}

        {/* 検索結果なし */}
        {!loading.error &&
          !loading.isLoading &&
          searchTerm &&
          filteredCustomers.length === 0 &&
          renderNoResultsState()}

        {/* 顧客一覧表示 */}
        {!loading.error &&
          !loading.isLoading &&
          paginationData.hasData &&
          renderCustomerList()}
      </Box>

      {/* 新規登録FAB（Floating Action Button） */}
      <Fab
        color="primary"
        aria-label="新規顧客登録"
        onClick={handleNewCustomer}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          minHeight: 60,
          minWidth: 60,
          fontSize: '24px',
          zIndex: 1000,
        }}>
        <AddIcon sx={{ fontSize: '28px' }} />
      </Fab>
    </Container>
  );
};

export default CustomerListPage;

/**
 * 【50代ユーザー向け設計のポイント】
 *
 * 1. 視認性重視
 *    - Card形式で顧客情報を分かりやすく表示
 *    - 大きなフォントサイズ（16px以上）
 *    - はっきりとした色使いとアイコン
 *
 * 2. 操作性配慮
 *    - 大きなボタン（最小44px×44px）
 *    - Floating Action Buttonで新規登録を明確に
 *    - ページング操作の分かりやすさ
 *
 * 3. 情報整理
 *    - 検索結果件数の明確表示
 *    - 現在表示範囲の明示
 *    - ソート機能で情報整理
 *
 * 4. エラーハンドリング
 *    - 親切な日本語エラーメッセージ
 *    - 明確な解決方法の提示
 *    - ローディング状態の適切な表示
 *
 * 5. レスポンシブ対応
 *    - デバイスに応じたカラム数調整
 *    - モバイル時のUI要素サイズ最適化
 *    - タッチ操作を考慮したボタン配置
 *
 * この実装により、50代の建築系自営業者が
 * 毎日快適に顧客管理業務を行える基盤が完成します。
 */
