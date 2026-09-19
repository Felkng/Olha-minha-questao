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
} from '@mui/material';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import FolderSpecialOutlinedIcon from '@mui/icons-material/FolderSpecialOutlined';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppTheme } from '../theme/ThemeContext';
import { PALETTE_COLORS } from '../theme/theme';

export const Navbar: React.FC = () => {
  const { mode, toggleColorMode } = useAppTheme();
  const isDark = mode === 'dark';
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { id: 'questoes', path: '/questoes', label: 'Questões', icon: <QuizOutlinedIcon fontSize="small" /> },
    { id: 'provas', path: '/provas', label: 'Provas', icon: <MenuBookOutlinedIcon fontSize="small" /> },
    { id: 'bancas', path: '/bancas', label: 'Bancas', icon: <AccountBalanceOutlinedIcon fontSize="small" /> },
    { id: 'areas', path: '/areas', label: 'Áreas', icon: <CategoryOutlinedIcon fontSize="small" /> },
    { id: 'pastas', path: '/pastas', label: 'Pastas Salvas', icon: <FolderSpecialOutlinedIcon fontSize="small" /> },
  ];

  const getActiveTab = () => {
    const p = location.pathname;
    if (p.startsWith('/provas')) return 'provas';
    if (p.startsWith('/bancas')) return 'bancas';
    if (p.startsWith('/areas')) return 'areas';
    if (p.startsWith('/pastas')) return 'pastas';
    return 'questoes';
  };

  const activeTab = getActiveTab();

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
            onClick={() => navigate('/questoes')}
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
                  onClick={() => navigate(item.path)}
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

          {/* Right Action Controls: Light / Dark Mode Toggle ONLY */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
