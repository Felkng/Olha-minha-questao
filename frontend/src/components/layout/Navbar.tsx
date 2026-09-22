import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Tooltip,
  Container,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Avatar,
  Chip,
} from '@mui/material';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import StyleOutlinedIcon from '@mui/icons-material/StyleOutlined';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppTheme } from '../../theme/ThemeContext';
import { PALETTE_COLORS } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { LoginModal } from '../auth/LoginModal';
import { RegisterModal } from '../auth/RegisterModal';

export const Navbar: React.FC = () => {
  const { mode, toggleColorMode } = useAppTheme();
  const isDark = mode === 'dark';
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const openUserMenu = Boolean(userMenuAnchor);

  // Auth Modals
  const [openLogin, setOpenLogin] = useState(false);
  const [openRegister, setOpenRegister] = useState(false);

  const navItems = [
    { id: 'questoes', path: '/questoes', label: 'Questões', icon: <QuizOutlinedIcon fontSize="small" /> },
    { id: 'provas', path: '/provas', label: 'Provas', icon: <MenuBookOutlinedIcon fontSize="small" /> },
    { id: 'flashcards', path: '/flashcards', label: 'Flashcards', icon: <StyleOutlinedIcon fontSize="small" /> },
    { id: 'bancas', path: '/bancas', label: 'Bancas', icon: <AccountBalanceOutlinedIcon fontSize="small" /> },
    { id: 'areas', path: '/areas', label: 'Áreas', icon: <CategoryOutlinedIcon fontSize="small" /> },
  ];

  const getActiveTab = () => {
    const p = location.pathname;
    if (p.startsWith('/flashcards')) return 'flashcards';
    if (p.startsWith('/provas')) return 'provas';
    if (p.startsWith('/bancas')) return 'bancas';
    if (p.startsWith('/areas')) return 'areas';
    if (p.startsWith('/questoes')) return 'questoes';
    return '';
  };

  const activeTab = getActiveTab();

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setUserMenuAnchor(null);
  };

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
            onClick={() => navigate('/')}
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

          {/* Action Controls: Auth Controls & Mode Toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Auth Buttons / Profile Menu */}
            {user ? (
              <>
                <Button
                  onClick={handleOpenUserMenu}
                  sx={{
                    textTransform: 'none',
                    borderRadius: 2,
                    py: 0.5,
                    px: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                  startIcon={
                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        fontSize: '0.85rem',
                        bgcolor: 'secondary.main',
                      }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </Avatar>
                  }
                >
                  <Box sx={{ textAlign: 'left', display: { xs: 'none', sm: 'block' } }}>
                    <Typography variant="body2" fontWeight="bold" lineHeight={1.2}>
                      {user.name}
                    </Typography>
                    <Chip
                      label={user.role}
                      size="small"
                      color={user.role === 'ADMIN' ? 'error' : 'secondary'}
                      sx={{ height: 16, fontSize: '0.65rem', fontWeight: 'bold' }}
                    />
                  </Box>
                </Button>

                <Menu
                  anchorEl={userMenuAnchor}
                  open={openUserMenu}
                  onClose={handleCloseUserMenu}
                  PaperProps={{
                    elevation: 4,
                    sx: { borderRadius: 2, mt: 1, minWidth: 160 },
                  }}
                >
                  <MenuItem
                    onClick={() => {
                      handleCloseUserMenu();
                      navigate(`/perfil/${user.id}`);
                    }}
                  >
                    <ListItemIcon>
                      <PersonIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Meu Perfil" />
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleCloseUserMenu();
                      logout();
                    }}
                  >
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Sair" />
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setOpenLogin(true)}
                  sx={{ fontWeight: 600, borderRadius: 2 }}
                >
                  Entrar
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  size="small"
                  onClick={() => setOpenRegister(true)}
                  sx={{ fontWeight: 600, borderRadius: 2 }}
                >
                  Cadastrar
                </Button>
              </Stack>
            )}

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

      {/* Auth Modals */}
      <LoginModal
        open={openLogin}
        onClose={() => setOpenLogin(false)}
        onSwitchToRegister={() => setOpenRegister(true)}
      />
      <RegisterModal
        open={openRegister}
        onClose={() => setOpenRegister(false)}
        onSwitchToLogin={() => setOpenLogin(true)}
      />

    </AppBar>
  );
};
