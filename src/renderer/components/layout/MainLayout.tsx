import React from 'react';
import { Box } from '@mui/material';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return <Box sx={{ minHeight: '100vh', overflow: 'auto' }}>{children}</Box>;
}
