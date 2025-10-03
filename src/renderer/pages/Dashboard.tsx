// import { useNavigate } from 'react-router-dom';

// import { useCustomer } from "@/contexts/CustomerContext";
// import { useNavigate } from "react-router-dom";

// import { Box, Container, Grid, Typography } from '@mui/material';
// import { AppError } from '../../types';
// import PageHeader from '../components/layout/PageHeader';
// import { useApp } from '../contexts/AppContext';
// import { useCustomer } from '../contexts/CustomerContext';

// // Custom UIs
// import { Button } from '../components/ui/Button';
// import { Card } from '../components/ui/Card';

// function Dashboard() {
//   const { customers, loading, fetchCustomers } = useCustomer();
//   const { showSnackbar, handleError } = useApp();
//   const navigate = useNavigate();
//   const handleRefresh = async () => {
//     try {
//       await fetchCustomers();
//       showSnackbar('顧客一覧を更新しました(DASHBOARD)', 'success');
//     } catch (error) {
//       handleError(
//         error as AppError,
//         '顧客一覧を更新できませんでした(DASHBOARD)'
//       );
//     }
//   };
//   const handleTestError = () => {
//     showSnackbar('テストエラーです(DASHBOARD)', 'error');
//   };
//   const handleTestInfo = () => {
//     showSnackbar('テスト情報です(DASHBOARD)', 'info');
//   };

//   return (
//     <Container maxWidth="lg" sx={{ py: 4 }}>
//       {/**  PageHeader コンポーネントの使用例 */}
//       <PageHeader
//         title="Dashboard"
//         actions={
//           <Box sx={{ display: 'flex', gap: 2 }}>
//             <Button variant="contained" onClick={handleRefresh}>
//               データ更新
//             </Button>
//             <Button variant="outlined" onClick={handleTestError}>
//               エラーテスト
//             </Button>
//             <Button variant="outlined" onClick={handleTestInfo}>
//               通知テスト
//             </Button>
//           </Box>
//         }
//       />

//       {loading.isLoading ? (
//         <Typography variant="h6">読み込み中...</Typography>
//       ) : (
//         <>
//           <Grid container spacing={3}>
//             <Grid size={{ xs: 12, md: 6 }} sx={{ mb: 3 }}>
//               <Card title="顧客一覧" subtitle="顧客一覧を表示します">
//                 <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
//                   <Typography variant="h3" color="primary">
//                     {customers.length} 件
//                   </Typography>
//                   <Typography
//                     variant="body2"
//                     color="text.secondary"
//                     sx={{ mb: 1 }}>
//                     登録済み顧客
//                   </Typography>
//                   <Button
//                     size="small"
//                     variant="contained"
//                     fullWidth
//                     loading={loading.isLoading}
//                     onClick={() => navigate('/customers')}>
//                     顧客一覧へ Customer List
//                   </Button>
//                 </Box>
//               </Card>
//             </Grid>

//             <Grid size={{ xs: 12, md: 6 }}>
//               <Card
//                 title="最近の顧客"
//                 subtitle="最近登録された顧客を表示します">
//                 <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
//                   {customers.slice(0, 3).map((customer) => (
//                     <Box key={customer.customerId}>
//                       <Typography variant="body1">
//                         {customer.companyName}
//                       </Typography>
//                       <Typography variant="body2" color="text.secondary">
//                         {customer.contactPerson || '担当者未登録'}
//                       </Typography>
//                     </Box>
//                   ))}
//                 </Box>
//               </Card>
//             </Grid>
//           </Grid>
//         </>
//       )}
//     </Container>
//   );
// }

// export default Dashboard;

/**
 * Dashboard.tsx
 *
 * 【50代向け実用的ダッシュボード】
 *
 * 50代後半の建築系自営業者が毎朝使える実用的なダッシュボード。
 * 事業の現状把握、ビジネス機会の発見、主要機能へのクイックアクセスを提供。
 *
 * 【主な機能】
 * ✅ クイックアクション（新規登録、顧客一覧、レポート）
 * ✅ ビジネスサマリー4枚（総顧客数、今月サービス件数、今月売上、要対応顧客数）
 * ✅ 最近のサービス履歴（5件）
 * ✅ メンテナンス推奨顧客（緊急度順）
 * ✅ 最近の顧客（既存機能維持）
 *
 * 【50代配慮】
 * - 大きな数値表示で事業状況を一目で把握
 * - 色分けで緊急度を視覚化
 * - アイコン付きで直感的
 * - クリック可能な要素を明確に
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { Box, Chip, Container, Grid, Typography } from '@mui/material';

// Icons
import {
  Add as AddIcon,
  Assessment as AssessmentIcon,
  Build as BuildIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

// Custom Components
import PageHeader from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

// Custom Hooks
import { useCustomer } from '../contexts/CustomerContext';
import { useServiceRecords } from '../hooks/useServiceRecords';

// Types
import { Customer } from '../../types';

// ================================
// メインコンポーネント
// ================================
function Dashboard() {
  const navigate = useNavigate();

  // ================================
  // データ取得
  // ================================

  // 顧客データ
  const { customers, loading } = useCustomer();

  // 全サービス履歴を取得
  const { serviceRecords } = useServiceRecords({
    autoLoad: true,
  });

  // ================================
  // データ計算（useMemoで最適化）
  // ================================

  /**
   * 今月のサービス履歴フィルタリング
   */
  const thisMonthRecords = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return serviceRecords.filter((record) => {
      const date = new Date(record.serviceDate);

      return (
        date.getMonth() === currentMonth && date.getFullYear() === currentYear
      );
    });
  }, [serviceRecords]);

  /**
   * 今月の売上計算
   */
  const thisMonthRevenue = useMemo(() => {
    return thisMonthRecords.reduce(
      (sum, record) => sum + (Number(record.amount) || 0),
      0
    );
  }, [thisMonthRecords]);

  /**
   * メンテナンス推奨顧客の計算
   *
   * 【ロジック】
   * - 各顧客の最終サービス日を計算
   * - 5年以上経過した顧客を抽出
   * - 緊急度別（10年以上=high、5-10年=medium）に分類
   * - 経過年数の長い順にソート
   */
  const maintenanceAlerts = useMemo(() => {
    // 顧客ごとの最終サービス日を計算
    const customerLastService = new Map();

    serviceRecords.forEach((record) => {
      const existing = customerLastService.get(record.customerId);
      const serviceDate = new Date(record.serviceDate);

      if (!existing || serviceDate > existing.lastServiceDate) {
        customerLastService.set(record.customerId, {
          customerId: record.customerId,
          lastServiceDate: serviceDate,
          serviceType: record.serviceType,
        });
      }
    });

    // 5年以上経過した顧客を抽出
    const alerts: {
      customer: Customer;
      yearsSince: number;
      lastServiceType: string;
      urgency: 'high' | 'medium';
    }[] = [];
    const now = new Date();

    customerLastService.forEach((service, customerId) => {
      const yearsSince =
        (now.getTime() - service.lastServiceDate.getTime()) /
        (1000 * 60 * 60 * 24 * 365.25);

      if (yearsSince >= 5) {
        const customer = customers.find((c) => c.customerId === customerId);
        if (customer) {
          alerts.push({
            customer,
            yearsSince: Math.floor(yearsSince),
            lastServiceType: service.serviceType,
            urgency: yearsSince >= 10 ? 'high' : 'medium',
          });
        }
      }
    });

    return alerts.sort((a, b) => b.yearsSince - a.yearsSince).slice(0, 5);
  }, [serviceRecords, customers]);

  /**
   * 要対応顧客数（緊急度=high）
   */
  const criticalCustomerCount = useMemo(() => {
    return maintenanceAlerts.filter((a) => a.urgency === 'high').length;
  }, [maintenanceAlerts]);

  // ================================
  // レンダリング
  // ================================
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* ページヘッダー */}
      <PageHeader
        title="ダッシュボード"
        subtitle="事業の現状を一目で確認できます"
      />

      {loading.isLoading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" sx={{ fontSize: 18 }}>
            読み込み中...
          </Typography>
        </Box>
      ) : (
        <>
          {/* クリックアクションエリア */}
          <Box sx={{ mb: 6 }}>
            <Typography
              variant="h6"
              sx={{ mb: 2, fontWeight: 'bold', fontSize: 20 }}>
              ⚡ よく使う機能
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 9, md: 4 }}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/customers/new')}
                  sx={{
                    minHeight: 56,
                    fontSize: 16,
                    fontWeight: 'bold',
                  }}>
                  新規顧客登録
                </Button>
              </Grid>

              <Grid size={{ xs: 9, md: 4 }}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<PeopleIcon />}
                  onClick={() => navigate('/customers')}
                  sx={{
                    minHeight: 56,
                    fontSize: 16,
                    fontWeight: 'bold',
                  }}>
                  顧客一覧へ
                </Button>
              </Grid>

              <Grid size={{ xs: 9, md: 4 }}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<AssessmentIcon />}
                  onClick={() => navigate('/reports')}
                  sx={{
                    minHeight: 56,
                    fontSize: 16,
                    fontWeight: 'bold',
                  }}>
                  集計レポートへ
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* 📊 ビジネスサマリー */}
          <Box sx={{ mb: 6 }}>
            <Typography
              variant="h6"
              sx={{ mb: 2, fontWeight: 'bold', fontSize: 20 }}>
              📊 今月の事業サマリー
            </Typography>
            <Grid container spacing={3}>
              {/* 総顧客数 */}
              <Grid
                size={{ xs: 12, sm: 6, md: 3 }}
                sx={{
                  display: 'flex',
                  alignItems: 'stretch',
                }}>
                <Card sx={{ width: '100%' }}>
                  <Box sx={{ textAlign: 'center', p: 3 }}>
                    <PeopleIcon
                      sx={{ fontSize: 56, color: 'primary.main', mb: 1 }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1, fontSize: 22, fontWeight: 'bold' }}>
                      総顧客数
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 'bold',
                        color: 'primary.main',
                        fontSize: { xs: 36, md: 42 },
                      }}>
                      {customers.length}社
                    </Typography>
                  </Box>
                </Card>
              </Grid>

              {/* 今月のサービス件数 */}
              <Grid
                size={{ xs: 12, sm: 6, md: 3 }}
                sx={{
                  display: 'flex',
                  alignItems: 'stretch',
                }}>
                <Card sx={{ width: '100%' }}>
                  <Box sx={{ textAlign: 'center', p: 3 }}>
                    <BuildIcon
                      sx={{ fontSize: 56, color: 'success.main', mb: 1 }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1, fontSize: 22, fontWeight: 'bold' }}>
                      今月のサービス件数
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 'bold',
                        color: 'success.main',
                        fontSize: { xs: 36, md: 42 },
                      }}>
                      {thisMonthRecords.length}件
                    </Typography>
                  </Box>
                </Card>
              </Grid>

              {/* 今月の売上 */}
              <Grid
                size={{ xs: 12, sm: 6, md: 3 }}
                sx={{ display: 'flex', alignItems: 'stretch' }}>
                <Card sx={{ width: '100%' }}>
                  <Box sx={{ textAlign: 'center', p: 3 }}>
                    <TrendingUpIcon
                      sx={{ fontSize: 56, color: 'warning.main', mb: 1 }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1, fontSize: 22, fontWeight: 'bold' }}>
                      今月の売上
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 'bold',
                        color: 'warning.main',
                        fontSize: { xs: 36, md: 42 },
                      }}>
                      ¥{(thisMonthRevenue / 10000).toFixed(0)}万
                    </Typography>
                  </Box>
                </Card>
              </Grid>

              {/* 要対応顧客数 */}
              <Grid
                size={{ xs: 12, sm: 6, md: 3 }}
                sx={{ display: 'flex', alignItems: 'stretch' }}>
                <Card sx={{ width: '100%' }}>
                  <Box sx={{ textAlign: 'center', p: 3 }}>
                    <WarningIcon
                      sx={{ fontSize: 56, color: 'error.main', mb: 1 }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1, fontSize: 22, fontWeight: 'bold' }}>
                      要対応顧客数
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 'bold',
                        color: 'error.main',
                        fontSize: { xs: 36, md: 42 },
                      }}>
                      {criticalCustomerCount}社
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            </Grid>
          </Box>

          {/* 2カラムレイアウト */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* 左カラム: 最近のサービス履歴 */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Card sx={{ width: '100%' }}>
                <Box sx={{ p: 3 }}>
                  <Typography
                    variant="h6"
                    sx={{ mb: 2, fontWeight: 'bold', fontSize: 22 }}>
                    🔧 最近のサービス履歴
                  </Typography>
                  {serviceRecords.length > 0 ? (
                    <>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 2,
                        }}>
                        {serviceRecords
                          .sort(
                            (a, b) =>
                              new Date(b.serviceDate).getTime() -
                              new Date(a.serviceDate).getTime()
                          )
                          .slice(0, 5)
                          .map((record) => {
                            const customer = customers.find(
                              (c) => c.customerId === record.customerId
                            );
                            return (
                              <Box
                                key={record.recordId}
                                sx={{
                                  p: 2,
                                  border: 1,
                                  borderColor: 'divider',
                                  borderRadius: 1,
                                  '&:hover': {
                                    bgcolor: 'action.hover',
                                    cursor: 'pointer',
                                  },
                                }}
                                onClick={() =>
                                  navigate(
                                    `/customers/${record.customerId}#history`
                                  )
                                }>
                                <Typography
                                  variant="subtitle1"
                                  sx={{
                                    fontWeight: 'bold',
                                    mb: 1,
                                    fontSize: 20,
                                  }}>
                                  {customer?.companyName || '不明'}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ fontSize: 18 }}>
                                  {record.serviceType || 'サービス'} -{' '}
                                  {record.amount
                                    ? `¥${Number(
                                        record.amount
                                      ).toLocaleString()}`
                                    : '金額未設定'}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ fontSize: 16 }}>
                                  {new Date(
                                    record.serviceDate
                                  ).toLocaleDateString('ja-JP')}
                                </Typography>
                              </Box>
                            );
                          })}
                      </Box>

                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => navigate('/customers')}
                        sx={{ mt: 2, fontSize: 16 }}>
                        全てのサービス履歴を見る
                      </Button>
                    </>
                  ) : (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: 16, textAlign: 'center', py: 4 }}>
                      サービス履歴がありません
                    </Typography>
                  )}
                </Box>
              </Card>
            </Grid>

            {/* 右カラム: メンテナンス推奨顧客 */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Card sx={{ width: '100%' }}>
                <Box sx={{ p: 3 }}>
                  <Typography
                    variant="h6"
                    sx={{ mb: 2, fontWeight: 'bold', fontSize: 22 }}>
                    🔔 メンテナンス推奨顧客
                  </Typography>

                  {maintenanceAlerts.length > 0 ? (
                    <>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 2,
                        }}>
                        {maintenanceAlerts.map((alert) => (
                          <Box
                            key={alert.customer.customerId}
                            sx={{
                              p: 2,
                              border: 2,
                              borderColor:
                                alert.urgency === 'high'
                                  ? 'error.main'
                                  : 'warning.main',
                              borderRadius: 1,
                              bgcolor:
                                alert.urgency === 'high'
                                  ? 'error.lighter'
                                  : 'warning.lighter',
                            }}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                mb: 1,
                              }}>
                              <Chip
                                label={
                                  alert.urgency === 'high'
                                    ? '🔴 要対応'
                                    : '🟡 推奨時期'
                                }
                                color={
                                  alert.urgency === 'high' ? 'error' : 'warning'
                                }
                                size="small"
                                sx={{ fontWeight: 'bold', fontSize: 16 }}
                              />
                            </Box>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ fontSize: 18 }}>
                              {alert.lastServiceType || 'サービス'}から
                              {alert.yearsSince}年経過
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() =>
                                  navigate(
                                    `/customers/${alert.customer.customerId}`
                                  )
                                }
                                sx={{ fontSize: 14 }}>
                                詳細を見る
                              </Button>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </>
                  ) : (
                    <Typography
                      color="text.secondary"
                      sx={{ textAlign: 'center', py: 4, fontSize: 16 }}>
                      現在、メンテナンス推奨顧客はありません
                    </Typography>
                  )}
                </Box>
              </Card>
            </Grid>
          </Grid>

          {/* 最近追加した顧客 - 既存実装を維持 */}
          <Box sx={{ mb: 6 }}>
            <Card>
              <Box sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  sx={{ mb: 2, fontWeight: 'bold', fontSize: 22 }}>
                  👥 最近の顧客
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2, fontSize: 16 }}>
                  最近登録された顧客を表示します
                </Typography>

                {customers.length > 0 ? (
                  <>
                    <Box
                      sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {customers
                        .slice()
                        .sort(
                          (a, b) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime()
                        )
                        .slice(0, 5)
                        .map((customer) => (
                          <Box
                            key={customer.customerId}
                            sx={{
                              p: 2,
                              border: 1,
                              borderColor: 'divider',
                              borderRadius: 1,
                              '&:hover': {
                                bgcolor: 'action.hover',
                                cursor: 'pointer',
                              },
                            }}
                            onClick={() =>
                              navigate(`/customers/${customer.customerId}`)
                            }>
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: 'bold',
                                fontSize: 20,
                              }}>
                              {customer.companyName || '不明'}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ fontSize: 18 }}>
                              {customer.contactPerson || '担当者未登録'}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontSize: 16 }}>
                              登録日:{' '}
                              {new Date(customer.createdAt).toLocaleDateString(
                                'ja-JP'
                              )}
                            </Typography>
                          </Box>
                        ))}
                    </Box>

                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate('/customers')}
                      sx={{ mt: 2, fontSize: 16 }}>
                      顧客一覧へ
                    </Button>
                  </>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: 16, textAlign: 'center', py: 4 }}>
                    登録済み顧客がありません
                  </Typography>
                )}
              </Box>
            </Card>
          </Box>

          {/* 
  【今後実装予定 - Phase 2】
  今週のリマインダーカード
  
  <Box sx={{ mb: 4 }}>
    <Card>
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          📅 今週のリマインダー
        </Typography>
        
        Phase 2でOutLook連携リマインダー機能を実装予定:
        - 今週送信予定のリマインダー表示
        - リマインダーの編集・削除
        - OutLook予定表との同期状態表示
      </Box>
    </Card>
  </Box>
*/}
        </>
      )}
    </Container>
  );
}

export default Dashboard;

/**
 * 【50代ユーザー向け設計のポイント】
 *
 * 1. 事業状況の即座把握
 *    - 大きな数値表示（h3サイズ）で一目で分かる
 *    - アイコン付きで直感的
 *    - 色分けで緊急度を視覚化
 *
 * 2. ビジネス機会の発見
 *    - メンテナンス推奨顧客を自動抽出
 *    - 経過年数で緊急度を判定
 *    - クリックで即座に詳細確認
 *
 * 3. 主要機能への即アクセス
 *    - クイックアクション3ボタン
 *    - 各カードからの詳細ページ遷移
 *    - 大きなボタン（56px高）で操作しやすい
 *
 * 4. レスポンシブ対応
 *    - モバイル: 1カラム縦配置
 *    - デスクトップ: 効率的な多カラム
 *    - タッチ操作に配慮したサイズ
 *
 * 5. パフォーマンス最適化
 *    - useMemoで再計算最小化
 *    - 既存Hooksを完全活用
 *    - 不要なAPI呼び出しなし
 *
 * この実装により、50代の建築系自営業者が
 * 毎朝ダッシュボードで事業状況を把握し、
 * ビジネス機会を見逃さない環境が完成します。
 */
