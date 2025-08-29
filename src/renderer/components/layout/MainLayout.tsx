import { Box, Container, styled } from '@mui/material';
import React from 'react';
import { Header } from './Header';

// Header Component Placeholder
// const HeaderPlaceholder = styled(Box)(({ theme }) => ({
//   height: '64px',
//   backgroundColor: theme.palette.primary.main,
//   display: 'flex',
//   alignItems: 'center',
//   justifyContent: 'center',
//   color: theme.palette.primary.contrastText,
//   fontSize: '18px',
//   fontWeight: 600,
//   boxShadow: theme.shadows[2],
// }));

// Main Content Area
const MainContentArea = styled(Box)(({ theme }) => ({
  minHeight: 'calc(100vh - 64px)',
  backgroundColor: theme.palette.background.default,
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(3),
}));

// TypeScript Type Definition
interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout Component for 50 year olds
 *
 * @description
 *
 * - Layout component that contains the entire application
 * - Header component (I'll implement later) contained in the header placeholder
 * - Display page content with children prop
 * - Simple structure for 50 year olds to understand
 */
export function MainLayout({ children }: MainLayoutProps) {
  // return <Box sx={{ minHeight: '100vh', overflow: 'auto' }}>{children}</Box>;
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        alignItems: 'center',
      }}>
      {/* Header Area - I'll replace this with the actual header component later*/}
      {/* <HeaderPlaceholder>建築事業者向けCRMツール</HeaderPlaceholder> */}
      <Header />
      {/* Main Content Area*/}
      <MainContentArea component="main">
        <Container
          maxWidth="xl"
          // Set margins for those in their 50s to understand
          sx={{ paddingX: { xs: 2, sm: 3, md: 4 } }}>
          {children}
        </Container>
      </MainContentArea>
    </Box>
  );
}

export type { MainLayoutProps };
