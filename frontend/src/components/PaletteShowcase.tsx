import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Stack,
  Chip,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { PALETTE_COLORS } from '../theme/theme';
import { useAppTheme } from '../theme/ThemeContext';

interface PaletteShowcaseProps {
  open: boolean;
  onClose: () => void;
}

export const PaletteShowcase: React.FC<PaletteShowcaseProps> = ({ open, onClose }) => {
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';

  const paletteItems = [
    {
      name: 'Primary',
      hex: PALETTE_COLORS.primary,
      role: 'Dourado / Ocre pasteurizado',
      description: 'Identidade visual, logotipo, botões principais de ação e acentos de navegação.',
      contrast: '#1a1e24',
    },
    {
      name: 'Secondary',
      hex: PALETTE_COLORS.secondary,
      role: 'Azul suave pasteurizado',
      description: 'Chips de banca e disciplina, links de apoio e detalhes secundários.',
      contrast: '#ffffff',
    },
    {
      name: 'Success',
      hex: PALETTE_COLORS.success,
      role: 'Verde pasteurizado vibrante',
      description: 'Feedback de alternativa correta, acertos de questões e status positivo.',
      contrast: '#0f2910',
    },
    {
      name: 'Danger / Error',
      hex: PALETTE_COLORS.danger,
      role: 'Vermelho coral pasteurizado',
      description: 'Feedback de alternativa incorreta, mensagens de erro e alertas críticos.',
      contrast: '#ffffff',
    },
    {
      name: 'Warning',
      hex: PALETTE_COLORS.warning,
      role: 'Amarelo pasteurizado',
      description: 'Alertas de atenção, badges de aviso e status pendentes.',
      contrast: '#262900',
    },
  ];

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: 320, sm: 420 }, p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Design & Paleta de Cores
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Definição do Sistema Olha Minha Questão (Sem Gradientes)
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Color Swatches */}
        <Stack spacing={2.5}>
          {paletteItems.map((item) => (
            <Box
              key={item.name}
              sx={{
                p: 2,
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    backgroundColor: item.hex,
                    border: '1px solid rgba(0,0,0,0.1)',
                    flexShrink: 0,
                  }}
                />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                    {item.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      color: PALETTE_COLORS.primary,
                      fontSize: '0.85rem',
                    }}
                  >
                    {item.hex}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem', mb: 1.5 }}>
                {item.description}
              </Typography>

              {/* Sample usages */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={item.name}
                  size="small"
                  sx={{
                    backgroundColor: item.hex,
                    color: item.contrast,
                    fontWeight: 700,
                  }}
                />
                <Chip
                  label="Outline"
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: item.hex,
                    color: item.hex,
                    fontWeight: 600,
                  }}
                />
              </Box>
            </Box>
          ))}
        </Stack>

        <Divider sx={{ my: 3 }} />

        {/* Surface info */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          Superfícies & Elevação
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem', mb: 2 }}>
          Containers de questões usam <strong>Paper (elevação 4)</strong> sem gradientes, com borda sutil e sombra suave tanto no Modo Claro quanto no Modo Escuro.
        </Typography>

        <Alert severity="info" sx={{ borderRadius: 2, fontSize: '0.8rem' }}>
          O tema pode ser refinado conforme as necessidades da aplicação.
        </Alert>
      </Box>
    </Drawer>
  );
};
