import { useNavigate } from 'react-router-dom';

import { Box, Container, Grid, Typography } from '@mui/material';
import { AppError } from '../../types';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useApp } from '../contexts/AppContext';
import { useCustomer } from '../contexts/CustomerContext';

function Dashboard() {
  const { customers, loading, fetchCustomers } = useCustomer();
  const { showSnackbar, handleError } = useApp();
  const navigate = useNavigate();
  const handleRefresh = async () => {
    try {
      await fetchCustomers();
      showSnackbar('顧客一覧を更新しました(DASHBOARD)', 'success');
    } catch (error) {
      handleError(
        error as AppError,
        '顧客一覧を更新できませんでした(DASHBOARD)'
      );
    }
  };
  const handleTestError = () => {
    showSnackbar('テストエラーです(DASHBOARD)', 'error');
  };
  const handleTestInfo = () => {
    showSnackbar('テスト情報です(DASHBOARD)', 'info');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/** PageHeader コンポーネントの使用例 */}
      <PageHeader
        title="Dashboard"
        actions={
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" onClick={handleRefresh}>
              データ更新
            </Button>
            <Button variant="outlined" onClick={handleTestError}>
              エラーテスト
            </Button>
            <Button variant="outlined" onClick={handleTestInfo}>
              通知テスト
            </Button>
          </Box>
        }
      />

      {loading.isLoading ? (
        <Typography variant="h6">読み込み中...</Typography>
      ) : (
        <>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }} sx={{ mb: 3 }}>
              <Card title="顧客一覧" subtitle="顧客一覧を表示します">
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="h3" color="primary">
                    {customers.length} 件
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}>
                    登録済み顧客
                  </Typography>
                  <Button
                    size="small"
                    variant="contained"
                    fullWidth
                    loading={loading.isLoading}
                    onClick={() => navigate('/customers')}>
                    顧客一覧へ
                  </Button>
                </Box>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card
                title="最近の顧客"
                subtitle="最近登録された顧客を表示します">
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {customers.slice(0, 3).map((customer) => (
                    <Box key={customer.customerId}>
                      <Typography variant="body1">
                        {customer.companyName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {customer.contactPerson || '担当者未登録'}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  );
}

export default Dashboard;
