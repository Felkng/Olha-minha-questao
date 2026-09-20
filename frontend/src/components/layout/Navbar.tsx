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
} from '@mui/material';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import FolderSpecialOutlinedIcon from '@mui/icons-material/FolderSpecialOutlined';
import AddIcon from '@mui/icons-material/Add';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ClassIcon from '@mui/icons-material/Class';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppTheme } from '../../theme/ThemeContext';
import { PALETTE_COLORS } from '../../theme/theme';
import { CreateQuestionModal } from '../crud/CreateQuestionModal';
import { CreateTestWizardModal } from '../crud/CreateTestWizardModal';
import { CreateOriginModal } from '../crud/CreateOriginModal';
import { CreateAreaModal } from '../crud/CreateAreaModal';
import { CreateSubjectModal } from '../crud/CreateSubjectModal';
import { useAuth } from '../../context/AuthContext';
import { LoginModal } from '../auth/LoginModal';
import { RegisterModal } from '../auth/RegisterModal';
import { Avatar, Chip } from '@mui/material';

export const Navbar: React.FC = () => {
  const { mode, toggleColorMode } = useAppTheme();
  const isDark = mode === 'dark';
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);

  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const openUserMenu = Boolean(userMenuAnchor);

  // Auth Modals
  const [openLogin, setOpenLogin] = useState(false);
  const [openRegister, setOpenRegister] = useState(false);

  // Modais de Criação
  const [openCreateQuestion, setOpenCreateQuestion] = useState(false);
  const [openCreateTest, setOpenCreateTest] = useState(false);
  const [openCreateOrigin, setOpenCreateOrigin] = useState(false);
  const [openCreateArea, setOpenCreateArea] = useState(false);
  const [openCreateSubject, setOpenCreateSubject] = useState(false);

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

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    if (!user) {
      setOpenLogin(true);
      return;
    }
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setUserMenuAnchor(null);
  };

  const isAdmin = user?.role === 'ADMIN';

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

          {/* Action Controls: Menu + Criar, Auth Controls & Mode Toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenMenu}
              sx={{
                fontWeight: 700,
                borderRadius: 2,
                backgroundColor: PALETTE_COLORS.primary,
                color: '#1a1e24',
                '&:hover': { filter: 'brightness(0.9)' },
              }}
            >
              Criar
            </Button>

            <Menu
              anchorEl={anchorEl}
              open={openMenu}
              onClose={handleCloseMenu}
              PaperProps={{
                elevation: 4,
                sx: { borderRadius: 2, mt: 1, minWidth: 180 },
              }}
            >
              <MenuItem
                onClick={() => {
                  handleCloseMenu();
                  setOpenCreateQuestion(true);
                }}
              >
                <ListItemIcon>
                  <QuizOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Nova Questão" />
              </MenuItem>

              <MenuItem
                onClick={() => {
                  handleCloseMenu();
                  setOpenCreateTest(true);
                }}
              >
                <ListItemIcon>
                  <MenuBookIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Nova Prova" />
              </MenuItem>

              {isAdmin && (
                <MenuItem
                  onClick={() => {
                    handleCloseMenu();
                    setOpenCreateOrigin(true);
                  }}
                >
                  <ListItemIcon>
                    <AccountBalanceOutlinedIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Nova Banca" />
                </MenuItem>
              )}

              {isAdmin && (
                <MenuItem
                  onClick={() => {
                    handleCloseMenu();
                    setOpenCreateArea(true);
                  }}
                >
                  <ListItemIcon>
                    <CategoryOutlinedIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Nova Área" />
                </MenuItem>
              )}

              {isAdmin && (
                <MenuItem
                  onClick={() => {
                    handleCloseMenu();
                    setOpenCreateSubject(true);
                  }}
                >
                  <ListItemIcon>
                    <ClassIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Nova Matéria" />
                </MenuItem>
              )}

              <MenuItem
                onClick={() => {
                  handleCloseMenu();
                  navigate('/pastas');
                }}
              >
                <ListItemIcon>
                  <FolderSpecialOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Nova Pasta" />
              </MenuItem>
            </Menu>

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

      {/* Modais de Criação */}
      <CreateQuestionModal
        open={openCreateQuestion}
        onClose={() => setOpenCreateQuestion(false)}
        onCreated={() => window.location.reload()}
      />
      <CreateTestWizardModal
        open={openCreateTest}
        onClose={() => setOpenCreateTest(false)}
        onCreated={() => window.location.reload()}
      />
      <CreateOriginModal
        open={openCreateOrigin}
        onClose={() => setOpenCreateOrigin(false)}
        onCreated={() => window.location.reload()}
      />
      <CreateAreaModal
        open={openCreateArea}
        onClose={() => setOpenCreateArea(false)}
        onCreated={() => window.location.reload()}
      />
      <CreateSubjectModal
        open={openCreateSubject}
        onClose={() => setOpenCreateSubject(false)}
        onCreated={() => window.location.reload()}
      />
    </AppBar>
  );
};
