import React from 'react';
import { Typography, Button, Container } from '@mui/material';

function Dashboard() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h1" gutterBottom>
        🎉PERFECT! HMR SUCCESS!🎉
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        🚀 INSTANT UPDATE MAGIC 🚀 【テスト2】連続更新!
      </Typography>
      <Button variant="contained" size="large" sx={{ mb: 3 }}>
        顧客一覧を見る
      </Button>
    </Container>
  );
}

export default Dashboard;
