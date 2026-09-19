import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Tooltip,
  Container,
  Chip,
} from '@mui/material';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import { useAppTheme } from '../theme/ThemeContext';
import { PALETTE_COLORS } from '../theme/theme';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  showSkeleton: boolean;
  onToggleSkeleton: () => void;
  onOpenPalette: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  showSkeleton,
  onToggleSkeleton,
  onOpenPalette,
}) => {
  const { mode, toggleColorMode } = useAppTheme();
  const isDark = mode === 'dark';

  const navItems = [
    { id: 'questoes', label: 'Questões', icon: <QuizOutlinedIcon fontSize="small" /> },
    { id: 'provas', label: 'Provas', icon: <MenuBookOutlinedIcon fontSize="small" /> },
    { id: 'bancas', label: 'Bancas', icon: <AccountBalanceOutlinedIcon fontSize="small" /> },
    { id: 'areas', label: 'Áreas', icon: <CategoryOutlinedIcon fontSize="small" /> },
  ];

  return (
    <AppBar position="sticky" color="inherit">
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 72 }, gap: 2 }}>
          {/* Logo / Brand */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              cursor: 'pointer',
              userSelect: 'none',
              mr: { xs: 1, md: 3 },
            }}
            onClick={() => onTabChange('questoes')}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                backgroundColor: PALETTE_COLORS.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1a1e24',
                fontWeight: 800,
                fontSize: '1.2rem',
              }}
            >
              Q
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '1.05rem', sm: '1.25rem' },
                  lineHeight: 1.1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                Olha Minha <Box component="span" sx={{ color: PALETTE_COLORS.primary }}>Questão</Box>
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.7rem',
                  letterSpacing: '0.04em',
                  fontWeight: 500,
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                REPOSITÓRIO DE QUESTÕES & PROVAS
              </Typography>
            </Box>
          </Box>

          {/* Horizontal Navigation Items */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, flexGrow: 1 }}>
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <Button
                  key={item.id}
                  startIcon={item.icon}
                  onClick={() => onTabChange(item.id)}
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    color: isActive ? PALETTE_COLORS.primary : 'text.secondary',
                    backgroundColor: isActive
                      ? isDark
                        ? 'rgba(217, 183, 99, 0.12)'
                        : 'rgba(217, 183, 99, 0.16)'
                      : 'transparent',
                    fontWeight: isActive ? 700 : 500,
                    '&:hover': {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Box>

          <Box sx={{ flexGrow: { xs: 1, md: 0 } }} />

          {/* Right Action Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Toggle Loading Skeleton Mode */}
            <Tooltip title={showSkeleton ? 'Ocultar Skeletons' : 'Ver Skeletons de Carregamento'}>
              <Chip
                icon={<AutoAwesomeOutlinedIcon fontSize="small" />}
                label={showSkeleton ? 'Skeleton ON' : 'Skeleton'}
                onClick={onToggleSkeleton}
                clickable
                color={showSkeleton ? 'warning' : 'default'}
                variant={showSkeleton ? 'filled' : 'outlined'}
                sx={{
                  height: 32,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  borderColor: showSkeleton ? undefined : 'divider',
                }}
              />
            </Tooltip>

            {/* Open Palette Showcase */}
            <Tooltip title="Guia da Paleta de Cores & Design">
              <IconButton
                onClick={onOpenPalette}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 1,
                }}
              >
                <PaletteOutlinedIcon fontSize="small" sx={{ color: PALETTE_COLORS.primary }} />
              </IconButton>
            </Tooltip>

            {/* Light / Dark Mode Toggle */}
            <Tooltip title={isDark ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}>
              <IconButton
                onClick={toggleColorMode}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 1,
                }}
              >
                {isDark ? (
                  <LightModeOutlinedIcon fontSize="small" sx={{ color: PALETTE_COLORS.warning }} />
                ) : (
                  <DarkModeOutlinedIcon fontSize="small" sx={{ color: PALETTE_COLORS.secondary }} />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};
