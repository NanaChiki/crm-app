import {
  Box,
  Button,
  Container,
  Divider,
  Grid,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Button as ButtonUI } from '../components/ui/Button';
import { Card as CardUI } from '../components/ui/Card';

function Dashboard() {
  const navigate = useNavigate();
  const handleAddCustomer = () => {
    alert(
      '顧客追加機能はまだ実装されていません: 顧客ボタンが追加されました（仮）'
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/** PageHeader コンポーネントの使用例 */}
      <PageHeader
        title="Dashboard"
        subtitle="Dashboard Overview"
        breadcrumbs={[{ label: 'ダッシュボード', path: '/' }]}
        actions={
          <>
            <ButtonUI variant="outlined" onClick={handleAddCustomer}>
              Add New Customer (Tentative)
            </ButtonUI>
          </>
        }
      />
      <PageHeader
        title="田中工務店"
        subtitle="東京都中央区大門1-1-1"
        breadcrumbs={[
          { label: 'ダッシュボード', path: '/' },
          { label: '顧客一覧', path: '/customers' },
          { label: '田中工務店', path: '/customers' },
        ]}
        actions={
          <>
            <ButtonUI variant="outlined" onClick={handleAddCustomer}>
              新規顧客追加
            </ButtonUI>
            <ButtonUI
              variant="outlined"
              color="error"
              onClick={handleAddCustomer}>
              削除
            </ButtonUI>
          </>
        }
      />

      {/** Card コンポーネントの使用例 */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <CardUI
            title="最近の顧客"
            clickable
            onCardClick={() => navigate('/customers')}>
            <Typography>ここに最近追加された顧客が表示されます</Typography>
          </CardUI>
        </Grid>

        <Grid item xs={12} md={6}>
          <CardUI
            title="今週のサービス"
            clickable
            onCardClick={() => navigate('/services')}>
            <Typography>ここに今週のサービス履歴が表示されます</Typography>
          </CardUI>
        </Grid>
      </Grid>

      <Divider sx={{ my: 5 }} />

      <Typography variant="h1" gutterBottom>
        🏢 建築事業者向けCRMツール
      </Typography>
      <Typography variant="body1" sx={{ mb: 3, fontSize: '18px' }}>
        Phase1: 50代向けUIコンポーネントライブラリ完成！
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/ui-demo')}>
          🎨 UIコンポーネントデモを見る
        </Button>

        <Button variant="outlined" size="large" disabled>
          👥 顧客管理（開発予定）
        </Button>

        <Button variant="outlined" size="large" disabled>
          📋 サービス履歴（開発予定）
        </Button>
      </Box>

      <Box
        sx={{ p: 3, backgroundColor: 'background.default', borderRadius: 2 }}>
        <Typography variant="h2" gutterBottom>
          ✅ 完成した機能
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          • 🎨 <strong>50代向けUIコンポーネント</strong> - Button, Input, Card,
          Modal
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          • 🎨 <strong>レイアウトコンポーネント</strong> - Header, MainLayout,
          PageHeader,
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          • ⚡ <strong>Electron + Vite + HMR</strong> - 完全統合開発環境
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          • 🗃️ <strong>Prismaデータベース設計</strong> - Customer, ServiceRecord
        </Typography>
        <Typography variant="body2">
          • 🔧 <strong>TypeScript + Material-UI</strong> - 型安全な開発環境
        </Typography>
      </Box>
    </Container>
  );
}

export default Dashboard;
