import React from 'react';
import { Typography, Button, Container } from '@mui/material';

function Dashboard() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h1" gutterBottom>
        🎉PERFECT! HMR SUCCESS!🎉
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        🚀 ELECTRON INTEGRATION TEST 🚀 統合テスト実行中!
      </Typography>
      <Button variant="contained" size="large" sx={{ mb: 3 }} color="success">
        ✅ Electron + Vite 統合成功！
      </Button>
      <Typography variant="body2" color="primary" sx={{ mt: 2 }}>
        🎯 ブラウザとElectronの両方でHMRが動作中...
      </Typography>
      <Typography variant="body2" color="info" sx={{ mt: 2 }}>
        🎯 This is a test for instant update magic.
      </Typography>
    </Container>
  );
}

export default Dashboard;
