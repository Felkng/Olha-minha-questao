import React from 'react';
import { Box, Container } from '@mui/material';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { ActiveTestBanner } from '../components/common/ActiveTestBanner';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar Superior */}
      <Navbar />

      {/* Conteúdo Principal com Container Responsivo */}
      <Container maxWidth="lg" sx={{ py: 4, flexGrow: 1 }}>
        <ActiveTestBanner />
        {children}
      </Container>

      {/* Rodapé Padrão */}
      <Footer />
    </Box>
  );
};
