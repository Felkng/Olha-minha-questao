import React from 'react';
import { Box, Typography } from '@mui/material';

export const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        borderTop: '1px solid',
        borderColor: 'divider',
        textAlign: 'center',
      }}
    >
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        Olha Minha Questão &copy; {new Date().getFullYear()} — Plataforma de Estudo e Resolução de Questões
      </Typography>
    </Box>
  );
};
