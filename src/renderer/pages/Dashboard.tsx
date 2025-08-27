import { Box, Button, Container, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
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
