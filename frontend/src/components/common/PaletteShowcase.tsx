import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Paper,
  Divider,
} from '@mui/material';
import { PALETTE_COLORS } from '../../theme/theme';
import { useAppTheme } from '../../theme/ThemeContext';

export const PaletteShowcase: React.FC = () => {
  const { mode } = useAppTheme();

  const colorItems = [
    {
      name: 'Primary (Pasteurizado)',
      hex: PALETTE_COLORS.primary,
      desc: 'Cor principal para botões, destaques e identidade do sistema.',
    },
    {
      name: 'Secondary (Azul Suave)',
      hex: PALETTE_COLORS.secondary,
      desc: 'Cor secundária para elementos de apoio, badges e ações secundárias.',
    },
    {
      name: 'Success (Verde Limão)',
      hex: PALETTE_COLORS.success,
      desc: 'Usado para respostas corretas, mensagens de aprovação e métricas positivas.',
    },
    {
      name: 'Danger (Vermelho Vivo)',
      hex: PALETTE_COLORS.danger,
      desc: 'Usado para respostas incorretas, ações de exclusão e alertas de erro.',
    },
    {
      name: 'Warning (Amarelo Neon)',
      hex: PALETTE_COLORS.warning,
      desc: 'Usado para avisos, atenção e estados pendentes.',
    },
  ];

  return (
    <Paper elevation={4} sx={{ p: 4, mb: 4, borderRadius: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
        Paleta de Cores & Design System (Modo: {mode.toUpperCase()})
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Cores institucionais e funcionais sem gradientes, com contraste calibrado para modo claro e escuro.
      </Typography>

      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={2}>
        {colorItems.map((color) => (
          <Grid item xs={12} sm={6} md={2.4} key={color.name}>
            <Card
              elevation={2}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
              }}
            >
              <Box
                sx={{
                  height: 90,
                  backgroundColor: color.hex,
                  display: 'flex',
                  alignItems: 'flex-end',
                  p: 1.5,
                }}
              >
                <Chip
                  label={color.hex}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(0, 0, 0, 0.65)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                  }}
                />
              </Box>
              <CardContent sx={{ flexGrow: 1, p: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {color.name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  {color.desc}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};
