import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Stack,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Grid,
  Card,
  CardContent,
  CardActions,
  Pagination,
  Alert,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PeopleIcon from '@mui/icons-material/People';
import QuizIcon from '@mui/icons-material/Quiz';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SecurityIcon from '@mui/icons-material/Security';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import PublicIcon from '@mui/icons-material/Public';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CategoryIcon from '@mui/icons-material/Category';
import SubjectIcon from '@mui/icons-material/Subject';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../theme/ThemeContext';
import { PALETTE_COLORS } from '../theme/theme';
import {
  getAdminUsers,
  toggleBlockUser,
  updateUserRole,
  deleteUser,
  getQuestions,
  getTests,
  toggleTestVisibility,
  deleteTest,
} from '../services/api';
import { UserSummary, Question, Test } from '../types';
import { QuestionCard } from '../components/questions/QuestionCard';

// Modals
import { CreateQuestionModal } from '../components/crud/CreateQuestionModal';
import { CreateTestModal } from '../components/crud/CreateTestModal';
import { CreateTestWizardModal } from '../components/crud/CreateTestWizardModal';
import { CreateOriginModal } from '../components/crud/CreateOriginModal';
import { CreateAreaModal } from '../components/crud/CreateAreaModal';
import { CreateSubjectModal } from '../components/crud/CreateSubjectModal';
import { EditTestModal } from '../components/crud/EditTestModal';
import { TestQuestionsManagerModal } from '../components/crud/TestQuestionsManagerModal';

export const AdminPage: React.FC = () => {
  const { user: currentUser, isAdmin } = useAuth();
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';
  const navigate = useNavigate();

  const [currentTab, setCurrentTab] = useState<number>(0);

  // Toast Feedback
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error' | 'info'>('success');
  const [toastOpen, setToastOpen] = useState<boolean>(false);

  const showToast = (message: string, severity: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  // ==========================================
  // TAB 0: USUÁRIOS
  // ==========================================
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [usersLoading, setUsersLoading] = useState<boolean>(false);
  const [userSearch, setUserSearch] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('ALL');
  const [userPage, setUserPage] = useState<number>(1);
  const [userTotalPages, setUserTotalPages] = useState<number>(1);
  const [userTotalElements, setUserTotalElements] = useState<number>(0);

  // Delete User Dialog
  const [userToDelete, setUserToDelete] = useState<UserSummary | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState<boolean>(false);

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    setUsersLoading(true);
    try {
      const res = await getAdminUsers({
        search: userSearch.trim() || undefined,
        role: userRoleFilter !== 'ALL' ? userRoleFilter : undefined,
        isBlocked: userStatusFilter === 'BLOCKED' ? true : userStatusFilter === 'ACTIVE' ? false : undefined,
        page: userPage - 1,
        size: 15,
      });
      setUsers(res.content || []);
      setUserTotalPages(res.totalPages || 1);
      setUserTotalElements(res.totalElements || 0);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      showToast('Erro ao carregar lista de usuários.', 'error');
    } finally {
      setUsersLoading(false);
    }
  }, [isAdmin, userSearch, userRoleFilter, userStatusFilter, userPage]);

  useEffect(() => {
    if (isAdmin && currentTab === 0) {
      fetchUsers();
    }
  }, [isAdmin, currentTab, fetchUsers]);

  const handleToggleBlock = async (targetUser: UserSummary) => {
    try {
      const updated = await toggleBlockUser(targetUser.id);
      showToast(
        updated.isBlocked
          ? `Usuário ${updated.name} bloqueado com sucesso.`
          : `Usuário ${updated.name} desbloqueado com sucesso.`
      );
      fetchUsers();
    } catch (err: any) {
      console.error('Erro ao alterar status de bloqueio:', err);
      showToast(err.response?.data?.message || 'Erro ao alterar status do usuário.', 'error');
    }
  };

  const handleToggleRole = async (targetUser: UserSummary) => {
    const nextRole = targetUser.role === 'ADMIN' ? 'GENERAL' : 'ADMIN';
    try {
      const updated = await updateUserRole(targetUser.id, nextRole);
      showToast(`Cargo de ${updated.name} alterado para ${updated.role}.`);
      fetchUsers();
    } catch (err: any) {
      console.error('Erro ao alterar cargo:', err);
      showToast(err.response?.data?.message || 'Erro ao alterar cargo do usuário.', 'error');
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    try {
      await deleteUser(userToDelete.id);
      showToast(`Usuário ${userToDelete.name} excluído com sucesso.`);
      setUserToDelete(null);
      fetchUsers();
    } catch (err: any) {
      console.error('Erro ao excluir usuário:', err);
      showToast(err.response?.data?.message || 'Erro ao excluir usuário.', 'error');
    } finally {
      setIsDeletingUser(false);
    }
  };

  // ==========================================
  // TAB 1: MODERAÇÃO DE QUESTÕES
  // ==========================================
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState<boolean>(false);
  const [questionSearch, setQuestionSearch] = useState<string>('');
  const [questionCreatorFilter, setQuestionCreatorFilter] = useState<'ALL' | 'USERS_ONLY' | 'ADMIN_ONLY'>('ALL');
  const [questionVisibilityFilter, setQuestionVisibilityFilter] = useState<'ALL' | 'PUBLIC' | 'PRIVATE'>('ALL');
  const [questionPage, setQuestionPage] = useState<number>(1);
  const [questionTotalPages, setQuestionTotalPages] = useState<number>(1);
  const [questionTotalElements, setQuestionTotalElements] = useState<number>(0);

  const fetchQuestions = useCallback(async () => {
    if (!isAdmin) return;
    setQuestionsLoading(true);
    try {
      const res = await getQuestions({
        search: questionSearch.trim() || undefined,
        page: questionPage - 1,
        size: 10,
      });

      let filtered = res.content || [];

      if (questionCreatorFilter === 'USERS_ONLY') {
        filtered = filtered.filter((q) => q.createdByUser && q.createdByUser.role !== 'ADMIN');
      } else if (questionCreatorFilter === 'ADMIN_ONLY') {
        filtered = filtered.filter((q) => !q.createdByUser || q.createdByUser.role === 'ADMIN');
      }

      if (questionVisibilityFilter === 'PUBLIC') {
        filtered = filtered.filter((q) => q.isPublic !== false);
      } else if (questionVisibilityFilter === 'PRIVATE') {
        filtered = filtered.filter((q) => q.isPublic === false);
      }

      setQuestions(filtered);
      setQuestionTotalPages(res.totalPages || 1);
      setQuestionTotalElements(res.totalElements || 0);
    } catch (err) {
      console.error('Erro ao carregar questões para moderação:', err);
      showToast('Erro ao carregar questões.', 'error');
    } finally {
      setQuestionsLoading(false);
    }
  }, [isAdmin, questionSearch, questionPage, questionCreatorFilter, questionVisibilityFilter]);

  useEffect(() => {
    if (isAdmin && currentTab === 1) {
      fetchQuestions();
    }
  }, [isAdmin, currentTab, fetchQuestions]);

  // ==========================================
  // TAB 2: MODERAÇÃO DE PROVAS
  // ==========================================
  const [tests, setTests] = useState<Test[]>([]);
  const [testsLoading, setTestsLoading] = useState<boolean>(false);
  const [testSearch, setTestSearch] = useState<string>('');
  const [testCreatorFilter, setTestCreatorFilter] = useState<'ALL' | 'USERS_ONLY' | 'ADMIN_ONLY'>('ALL');
  const [testVisibilityFilter, setTestVisibilityFilter] = useState<'ALL' | 'PUBLIC' | 'PRIVATE'>('ALL');

  // Modals for test management
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [managingQuestionsTest, setManagingQuestionsTest] = useState<Test | null>(null);
  const [deletingTest, setDeletingTest] = useState<Test | null>(null);
  const [isDeletingTest, setIsDeletingTest] = useState<boolean>(false);

  const fetchTests = useCallback(async () => {
    if (!isAdmin) return;
    setTestsLoading(true);
    try {
      const res = await getTests();
      let list = Array.isArray(res) ? res : [];

      if (testSearch.trim()) {
        const query = testSearch.toLowerCase().trim();
        list = list.filter((t) => t.name.toLowerCase().includes(query));
      }

      if (testCreatorFilter === 'USERS_ONLY') {
        list = list.filter((t) => t.createdByUser && t.createdByUser.role !== 'ADMIN');
      } else if (testCreatorFilter === 'ADMIN_ONLY') {
        list = list.filter((t) => !t.createdByUser || t.createdByUser.role === 'ADMIN');
      }

      if (testVisibilityFilter === 'PUBLIC') {
        list = list.filter((t) => t.isPublic !== false);
      } else if (testVisibilityFilter === 'PRIVATE') {
        list = list.filter((t) => t.isPublic === false);
      }

      setTests(list);
    } catch (err) {
      console.error('Erro ao carregar provas para moderação:', err);
      showToast('Erro ao carregar provas.', 'error');
    } finally {
      setTestsLoading(false);
    }
  }, [isAdmin, testSearch, testCreatorFilter, testVisibilityFilter]);

  useEffect(() => {
    if (isAdmin && currentTab === 2) {
      fetchTests();
    }
  }, [isAdmin, currentTab, fetchTests]);

  const handleToggleTestVisibility = async (testId: number) => {
    try {
      const updated = await toggleTestVisibility(testId);
      showToast(`Visibilidade da prova alterada para ${updated.isPublic ? 'Pública' : 'Privada'}.`);
      fetchTests();
    } catch (err) {
      console.error('Erro ao alternar visibilidade da prova:', err);
      showToast('Erro ao alternar visibilidade da prova.', 'error');
    }
  };

  const handleConfirmDeleteTest = async () => {
    if (!deletingTest) return;
    setIsDeletingTest(true);
    try {
      await deleteTest(deletingTest.id);
      showToast(`Prova "${deletingTest.name}" excluída com sucesso.`);
      setDeletingTest(null);
      fetchTests();
    } catch (err) {
      console.error('Erro ao excluir prova:', err);
      showToast('Erro ao excluir prova.', 'error');
    } finally {
      setIsDeletingTest(false);
    }
  };

  // ==========================================
  // CREATION MODALS STATE (TAB 3 & QUICK ACTIONS)
  // ==========================================
  const [modalCreateQuestionOpen, setModalCreateQuestionOpen] = useState(false);
  const [modalCreateTestOpen, setModalCreateTestOpen] = useState(false);
  const [modalCreateTestWizardOpen, setModalCreateTestWizardOpen] = useState(false);
  const [modalCreateOriginOpen, setModalCreateOriginOpen] = useState(false);
  const [modalCreateAreaOpen, setModalCreateAreaOpen] = useState(false);
  const [modalCreateSubjectOpen, setModalCreateSubjectOpen] = useState(false);

  if (!currentUser || !isAdmin) {
    return (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <Alert severity="error" sx={{ borderRadius: 2, maxWidth: 600, mx: 'auto', mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            Acesso Restrito
          </Typography>
          Você não possui permissões administrativas para acessar esta área.
        </Alert>
        <Button variant="contained" onClick={() => navigate('/')}>
          Voltar para a Página Inicial
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', mb: 6 }}>
      {/* Header Section */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3.5 },
            mb: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: isDark ? 'rgba(217, 183, 99, 0.3)' : 'rgba(217, 183, 99, 0.4)',
            background: isDark
              ? 'linear-gradient(135deg, rgba(217, 183, 99, 0.1) 0%, rgba(20, 24, 30, 0.8) 100%)'
              : 'linear-gradient(135deg, rgba(217, 183, 99, 0.12) 0%, #ffffff 100%)',
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
                <Avatar
                  sx={{
                    bgcolor: PALETTE_COLORS.primary,
                    color: '#1a1e24',
                    width: 44,
                    height: 44,
                  }}
                >
                  <AdminPanelSettingsIcon fontSize="medium" />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    Painel de Administração
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Gerenciamento de usuários, moderação de conteúdos criados pela comunidade e ações rápidas
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<QuizIcon fontSize="small" />}
                onClick={() => setModalCreateQuestionOpen(true)}
                size="small"
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                + Nova Questão
              </Button>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<MenuBookIcon fontSize="small" />}
                onClick={() => setModalCreateTestOpen(true)}
                size="small"
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                + Nova Prova
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* Tabs Navigation */}
        <Paper elevation={0} sx={{ borderRadius: 2.5, mb: 3, border: '1px solid', borderColor: 'divider' }}>
          <Tabs
            value={currentTab}
            onChange={(_, val) => setCurrentTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              px: 2,
              '& .MuiTab-root': {
                py: 2,
                fontWeight: 700,
                fontSize: '0.95rem',
                textTransform: 'none',
              },
            }}
          >
            <Tab icon={<PeopleIcon />} iconPosition="start" label="Gerenciamento de Usuários" />
            <Tab icon={<QuizIcon />} iconPosition="start" label="Moderação de Questões" />
            <Tab icon={<MenuBookIcon />} iconPosition="start" label="Moderação de Provas" />
            <Tab icon={<AddCircleOutlineIcon />} iconPosition="start" label="Atalhos & Criações" />
          </Tabs>
        </Paper>

        {/* ========================================== */}
        {/* TAB 0: GERENCIAMENTO DE USUÁRIOS */}
        {/* ========================================== */}
        {currentTab === 0 && (
          <Box>
            {/* Filters Bar */}
            <Paper elevation={0} sx={{ p: 2, mb: 2.5, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    placeholder="Buscar usuário por nome ou e-mail..."
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setUserPage(1);
                    }}
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={6} sm={3} md={2.5}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Cargo / Papel</InputLabel>
                    <Select
                      value={userRoleFilter}
                      label="Cargo / Papel"
                      onChange={(e) => {
                        setUserRoleFilter(e.target.value);
                        setUserPage(1);
                      }}
                    >
                      <MenuItem value="ALL">Todos os Cargos</MenuItem>
                      <MenuItem value="ADMIN">Apenas Administradores</MenuItem>
                      <MenuItem value="GENERAL">Apenas Usuários Comuns</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6} sm={3} md={2.5}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status da Conta</InputLabel>
                    <Select
                      value={userStatusFilter}
                      label="Status da Conta"
                      onChange={(e) => {
                        setUserStatusFilter(e.target.value);
                        setUserPage(1);
                      }}
                    >
                      <MenuItem value="ALL">Todos os Status</MenuItem>
                      <MenuItem value="ACTIVE">Ativos</MenuItem>
                      <MenuItem value="BLOCKED">Bloqueados</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={12} md={3} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    Total de usuários: <Box component="span" sx={{ color: PALETTE_COLORS.primary }}>{userTotalElements}</Box>
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* Users Table */}
            <Paper elevation={0} sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
              {usersLoading ? (
                <Box sx={{ p: 6, textAlign: 'center' }}>
                  <CircularProgress size={36} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                    Carregando usuários...
                  </Typography>
                </Box>
              ) : users.length === 0 ? (
                <Box sx={{ p: 6, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    Nenhum usuário encontrado com os filtros selecionados.
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table sx={{ minWidth: 650 }}>
                    <TableHead sx={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Usuário</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>E-mail</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Cargo</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">
                          Ações Administrativas
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.map((u) => {
                        const isSelf = currentUser.id === u.id;
                        const isBlocked = Boolean(u.isBlocked);
                        const isAdminUser = u.role === 'ADMIN';

                        return (
                          <TableRow key={u.id} hover>
                            <TableCell>
                              <Stack direction="row" spacing={1.5} alignItems="center">
                                <Avatar
                                  sx={{
                                    width: 36,
                                    height: 36,
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                    bgcolor: isAdminUser ? 'error.main' : 'secondary.main',
                                  }}
                                >
                                  {u.name ? u.name.charAt(0).toUpperCase() : '?'}
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle2" fontWeight={700}>
                                    {u.name} {isSelf && <Typography component="span" variant="caption" color="text.secondary">(Você)</Typography>}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    ID: #{u.id}
                                  </Typography>
                                </Box>
                              </Stack>
                            </TableCell>

                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {u.email}
                              </Typography>
                            </TableCell>

                            <TableCell>
                              <Chip
                                label={u.role}
                                size="small"
                                color={isAdminUser ? 'error' : 'default'}
                                sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                              />
                            </TableCell>

                            <TableCell>
                              <Chip
                                size="small"
                                icon={isBlocked ? <BlockIcon fontSize="inherit" /> : <CheckCircleOutlineIcon fontSize="inherit" />}
                                label={isBlocked ? 'Bloqueado' : 'Ativo'}
                                sx={{
                                  backgroundColor: isBlocked
                                    ? isDark ? 'rgba(250, 66, 75, 0.15)' : 'rgba(250, 66, 75, 0.15)'
                                    : isDark ? 'rgba(75, 241, 81, 0.15)' : 'rgba(75, 241, 81, 0.2)',
                                  color: isBlocked ? PALETTE_COLORS.danger : PALETTE_COLORS.success,
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                  border: '1px solid',
                                  borderColor: isBlocked ? PALETTE_COLORS.danger : PALETTE_COLORS.success,
                                }}
                              />
                            </TableCell>

                            <TableCell align="right">
                              <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                                {/* Ver Perfil */}
                                <Tooltip title="Visualizar perfil completo">
                                  <IconButton
                                    size="small"
                                    component={Link}
                                    to={`/perfil/${u.id}`}
                                    sx={{ color: 'text.secondary', '&:hover': { color: PALETTE_COLORS.primary } }}
                                  >
                                    <VisibilityOutlinedIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>

                                {/* Tornar / Remover Admin */}
                                <Tooltip title={isSelf ? 'Você não pode alterar seu próprio cargo' : isAdminUser ? 'Rebaixar para Usuário Comum' : 'Promover a Administrador'}>
                                  <span>
                                    <IconButton
                                      size="small"
                                      disabled={isSelf}
                                      onClick={() => handleToggleRole(u)}
                                      sx={{
                                        color: isAdminUser ? 'error.main' : 'text.secondary',
                                        '&:hover': { color: isAdminUser ? 'text.secondary' : PALETTE_COLORS.primary },
                                      }}
                                    >
                                      <SecurityIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>

                                {/* Bloquear / Desbloquear */}
                                <Tooltip title={isSelf ? 'Você não pode bloquear a si próprio' : isBlocked ? 'Desbloquear login do usuário' : 'Bloquear login do usuário'}>
                                  <span>
                                    <IconButton
                                      size="small"
                                      disabled={isSelf}
                                      onClick={() => handleToggleBlock(u)}
                                      sx={{
                                        color: isBlocked ? PALETTE_COLORS.danger : 'text.secondary',
                                        '&:hover': { color: isBlocked ? PALETTE_COLORS.success : PALETTE_COLORS.danger },
                                      }}
                                    >
                                      <BlockIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>

                                {/* Excluir Usuário */}
                                <Tooltip title={isSelf ? 'Você não pode excluir sua própria conta' : 'Excluir usuário do sistema'}>
                                  <span>
                                    <IconButton
                                      size="small"
                                      disabled={isSelf}
                                      onClick={() => setUserToDelete(u)}
                                      sx={{
                                        color: 'text.secondary',
                                        '&:hover': { color: PALETTE_COLORS.danger },
                                      }}
                                    >
                                      <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Pagination */}
              {userTotalPages > 1 && (
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
                  <Pagination
                    count={userTotalPages}
                    page={userPage}
                    onChange={(_, page) => setUserPage(page)}
                    color="primary"
                    shape="rounded"
                  />
                </Box>
              )}
            </Paper>
          </Box>
        )}

        {/* ========================================== */}
        {/* TAB 1: MODERAÇÃO DE QUESTÕES */}
        {/* ========================================== */}
        {currentTab === 1 && (
          <Box>
            {/* Filters Bar */}
            <Paper elevation={0} sx={{ p: 2, mb: 2.5, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={5} md={4}>
                  <TextField
                    placeholder="Buscar no enunciado ou identificador..."
                    value={questionSearch}
                    onChange={(e) => {
                      setQuestionSearch(e.target.value);
                      setQuestionPage(1);
                    }}
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={6} sm={3.5} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Origem do Autor</InputLabel>
                    <Select
                      value={questionCreatorFilter}
                      label="Origem do Autor"
                      onChange={(e: any) => {
                        setQuestionCreatorFilter(e.target.value);
                        setQuestionPage(1);
                      }}
                    >
                      <MenuItem value="ALL">Todas as Questões</MenuItem>
                      <MenuItem value="USERS_ONLY">Adicionadas por Usuários</MenuItem>
                      <MenuItem value="ADMIN_ONLY">Criadas por Administradores</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6} sm={3.5} md={2.5}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Visibilidade</InputLabel>
                    <Select
                      value={questionVisibilityFilter}
                      label="Visibilidade"
                      onChange={(e: any) => {
                        setQuestionVisibilityFilter(e.target.value);
                        setQuestionPage(1);
                      }}
                    >
                      <MenuItem value="ALL">Todas (Públicas e Privadas)</MenuItem>
                      <MenuItem value="PUBLIC">Apenas Públicas</MenuItem>
                      <MenuItem value="PRIVATE">Apenas Privadas</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={2.5} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" justifyContent={{ xs: 'space-between', md: 'flex-end' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Total: {questionTotalElements}
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<QuizIcon fontSize="small" />}
                      onClick={() => setModalCreateQuestionOpen(true)}
                      size="small"
                      sx={{ borderRadius: 2, fontWeight: 700 }}
                    >
                      + Nova Questão
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </Paper>

            {/* Questions List */}
            {questionsLoading ? (
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <CircularProgress size={36} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                  Carregando questões para moderação...
                </Typography>
              </Box>
            ) : questions.length === 0 ? (
              <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body1" color="text.secondary">
                  Nenhuma questão encontrada com os filtros selecionados.
                </Typography>
              </Paper>
            ) : (
              <Stack spacing={2.5}>
                {questions.map((q) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    onDelete={() => {
                      showToast('Questão excluída com sucesso.');
                      fetchQuestions();
                    }}
                    onUpdated={() => {
                      showToast('Questão atualizada com sucesso.');
                      fetchQuestions();
                    }}
                  />
                ))}

                {/* Pagination */}
                {questionTotalPages > 1 && (
                  <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
                    <Pagination
                      count={questionTotalPages}
                      page={questionPage}
                      onChange={(_, page) => setQuestionPage(page)}
                      color="primary"
                      shape="rounded"
                    />
                  </Box>
                )}
              </Stack>
            )}
          </Box>
        )}

        {/* ========================================== */}
        {/* TAB 2: MODERAÇÃO DE PROVAS */}
        {/* ========================================== */}
        {currentTab === 2 && (
          <Box>
            {/* Filters Bar */}
            <Paper elevation={0} sx={{ p: 2, mb: 2.5, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4} md={4}>
                  <TextField
                    placeholder="Buscar pelo nome da prova..."
                    value={testSearch}
                    onChange={(e) => setTestSearch(e.target.value)}
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={6} sm={4} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Origem do Criador</InputLabel>
                    <Select
                      value={testCreatorFilter}
                      label="Origem do Criador"
                      onChange={(e: any) => setTestCreatorFilter(e.target.value)}
                    >
                      <MenuItem value="ALL">Todas as Provas</MenuItem>
                      <MenuItem value="USERS_ONLY">Criadas por Usuários</MenuItem>
                      <MenuItem value="ADMIN_ONLY">Criadas por Administradores</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6} sm={4} md={2.5}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Visibilidade</InputLabel>
                    <Select
                      value={testVisibilityFilter}
                      label="Visibilidade"
                      onChange={(e: any) => setTestVisibilityFilter(e.target.value)}
                    >
                      <MenuItem value="ALL">Todas (Públicas e Privadas)</MenuItem>
                      <MenuItem value="PUBLIC">Apenas Públicas</MenuItem>
                      <MenuItem value="PRIVATE">Apenas Privadas</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={2.5} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                  <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<MenuBookIcon fontSize="small" />}
                      onClick={() => setModalCreateTestOpen(true)}
                      size="small"
                      sx={{ borderRadius: 2, fontWeight: 700 }}
                    >
                      + Nova Prova
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </Paper>

            {/* Tests Grid */}
            {testsLoading ? (
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <CircularProgress size={36} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                  Carregando provas para moderação...
                </Typography>
              </Box>
            ) : tests.length === 0 ? (
              <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body1" color="text.secondary">
                  Nenhuma prova encontrada com os filtros selecionados.
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={2.5}>
                {tests.map((t) => {
                  const isPublic = t.isPublic !== false;

                  return (
                    <Grid item xs={12} sm={6} md={4} key={t.id}>
                      <Card
                        elevation={0}
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          borderRadius: 2.5,
                          border: '1px solid',
                          borderColor: 'divider',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            borderColor: PALETTE_COLORS.primary,
                            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.08)',
                          },
                        }}
                      >
                        <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} sx={{ mb: 1.5 }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.05rem', lineHeight: 1.3 }}>
                                {t.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {t.originName || 'Sem banca'} • {t.year} • {t.areaName || 'Geral'}
                              </Typography>
                            </Box>

                            <Tooltip title={isPublic ? 'Prova pública' : 'Prova privada'}>
                              <IconButton
                                size="small"
                                onClick={() => handleToggleTestVisibility(t.id)}
                                sx={{
                                  color: isPublic ? PALETTE_COLORS.success : PALETTE_COLORS.danger,
                                  backgroundColor: isPublic
                                    ? isDark ? 'rgba(75, 241, 81, 0.12)' : 'rgba(75, 241, 81, 0.15)'
                                    : isDark ? 'rgba(250, 66, 75, 0.12)' : 'rgba(250, 66, 75, 0.15)',
                                }}
                              >
                                {isPublic ? <PublicIcon fontSize="small" /> : <LockOutlinedIcon fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                          </Stack>

                          {/* Creator Badge */}
                          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 0.5, mt: 1 }}>
                            {t.createdByUser ? (
                              <Chip
                                size="small"
                                icon={<PersonOutlineIcon fontSize="small" />}
                                label={`Criado por ${t.createdByUser.name}`}
                                component={Link}
                                to={`/perfil/${t.createdByUser.id}`}
                                clickable
                                sx={{
                                  backgroundColor: isDark ? 'rgba(90, 166, 226, 0.12)' : 'rgba(90, 166, 226, 0.15)',
                                  color: PALETTE_COLORS.secondary,
                                  fontWeight: 600,
                                }}
                              />
                            ) : (
                              <Chip size="small" label="Oficial da Plataforma" variant="outlined" />
                            )}
                          </Stack>
                        </CardContent>

                        <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
                          <Button
                            size="small"
                            variant="outlined"
                            component={Link}
                            to={`/provas/${t.id}`}
                            sx={{ borderRadius: 2, fontWeight: 700 }}
                          >
                            Ver Detalhes
                          </Button>

                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="Gerenciar questões da prova">
                              <IconButton size="small" onClick={() => setManagingQuestionsTest(t)}>
                                <FormatListNumberedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Editar prova">
                              <IconButton size="small" onClick={() => setEditingTest(t)}>
                                <EditOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Excluir prova">
                              <IconButton
                                size="small"
                                onClick={() => setDeletingTest(t)}
                                sx={{ color: 'text.secondary', '&:hover': { color: PALETTE_COLORS.danger } }}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </CardActions>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        )}

        {/* ========================================== */}
        {/* TAB 3: ATALHOS & CRIAÇÕES RÁPIDAS */}
        {/* ========================================== */}
        {currentTab === 3 && (
          <Box>
            <Grid container spacing={3}>
              {/* Card 1: Nova Questão */}
              <Grid item xs={12} sm={6} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': { borderColor: PALETTE_COLORS.primary },
                  }}
                >
                  <Box>
                    <Avatar sx={{ bgcolor: 'rgba(217, 183, 99, 0.15)', color: PALETTE_COLORS.primary, width: 48, height: 48, mb: 2 }}>
                      <QuizIcon fontSize="medium" />
                    </Avatar>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                      Cadastrar Questão
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Adicione uma nova questão com alternativas, imagens, anulação e vinculação com bancas, áreas e provas.
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => setModalCreateQuestionOpen(true)}
                    sx={{ borderRadius: 2, fontWeight: 700 }}
                  >
                    Abrir Formulário de Questão
                  </Button>
                </Paper>
              </Grid>

              {/* Card 2: Nova Prova */}
              <Grid item xs={12} sm={6} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': { borderColor: PALETTE_COLORS.secondary },
                  }}
                >
                  <Box>
                    <Avatar sx={{ bgcolor: 'rgba(90, 166, 226, 0.15)', color: PALETTE_COLORS.secondary, width: 48, height: 48, mb: 2 }}>
                      <MenuBookIcon fontSize="medium" />
                    </Avatar>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                      Cadastrar Prova / Simulado
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Crie um caderno de prova padrão para agrupar questões por ano, banca e área de conhecimento.
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="secondary"
                    fullWidth
                    onClick={() => setModalCreateTestOpen(true)}
                    sx={{ borderRadius: 2, fontWeight: 700 }}
                  >
                    Abrir Cadastro de Prova
                  </Button>
                </Paper>
              </Grid>

              {/* Card 3: Assistente Completo de Prova */}
              <Grid item xs={12} sm={6} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    background: isDark
                      ? 'linear-gradient(135deg, rgba(217, 183, 99, 0.08) 0%, rgba(20, 24, 30, 0.6) 100%)'
                      : 'linear-gradient(135deg, rgba(217, 183, 99, 0.1) 0%, #ffffff 100%)',
                    '&:hover': { borderColor: PALETTE_COLORS.primary },
                  }}
                >
                  <Box>
                    <Avatar sx={{ bgcolor: PALETTE_COLORS.primary, color: '#1a1e24', width: 48, height: 48, mb: 2 }}>
                      <AutoAwesomeIcon fontSize="medium" />
                    </Avatar>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                      Assistente OCR / Importação
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Criação em lote e importação automatizada de cadernos de questões com gabarito.
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => setModalCreateTestWizardOpen(true)}
                    sx={{ borderRadius: 2, fontWeight: 700 }}
                  >
                    Iniciar Assistente Wizard
                  </Button>
                </Paper>
              </Grid>

              {/* Card 4: Nova Banca */}
              <Grid item xs={12} sm={6} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': { borderColor: PALETTE_COLORS.primary },
                  }}
                >
                  <Box>
                    <Avatar sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)', color: 'text.primary', width: 48, height: 48, mb: 2 }}>
                      <AccountBalanceIcon fontSize="medium" />
                    </Avatar>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                      Cadastrar Banca / Origem
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Adicione instituições e bancas examinadoras (ex: CESPE, FGV, FCC, VUNESP).
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => setModalCreateOriginOpen(true)}
                    sx={{ borderRadius: 2, fontWeight: 700 }}
                  >
                    + Nova Banca
                  </Button>
                </Paper>
              </Grid>

              {/* Card 5: Nova Área */}
              <Grid item xs={12} sm={6} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': { borderColor: PALETTE_COLORS.primary },
                  }}
                >
                  <Box>
                    <Avatar sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)', color: 'text.primary', width: 48, height: 48, mb: 2 }}>
                      <CategoryIcon fontSize="medium" />
                    </Avatar>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                      Cadastrar Área de Estudo
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Adicione grandes áreas do conhecimento (ex: Tecnologia da Informação, Direito, Saúde).
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => setModalCreateAreaOpen(true)}
                    sx={{ borderRadius: 2, fontWeight: 700 }}
                  >
                    + Nova Área
                  </Button>
                </Paper>
              </Grid>

              {/* Card 6: Nova Matéria */}
              <Grid item xs={12} sm={6} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': { borderColor: PALETTE_COLORS.primary },
                  }}
                >
                  <Box>
                    <Avatar sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)', color: 'text.primary', width: 48, height: 48, mb: 2 }}>
                      <SubjectIcon fontSize="medium" />
                    </Avatar>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                      Cadastrar Disciplina / Matéria
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Adicione disciplinas vinculadas a áreas existentes (ex: Redes de Computadores, Direito Constitucional).
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => setModalCreateSubjectOpen(true)}
                    sx={{ borderRadius: 2, fontWeight: 700 }}
                  >
                    + Nova Matéria
                  </Button>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* ========================================== */}
        {/* MODAIS GLOBAIS DE CRIAÇÃO & EDIÇÃO */}
        {/* ========================================== */}
        <CreateQuestionModal
          open={modalCreateQuestionOpen}
          onClose={() => setModalCreateQuestionOpen(false)}
          onCreated={() => {
            showToast('Questão criada com sucesso.');
            if (currentTab === 1) fetchQuestions();
          }}
        />

        <CreateTestModal
          open={modalCreateTestOpen}
          onClose={() => setModalCreateTestOpen(false)}
          onCreated={() => {
            showToast('Prova criada com sucesso.');
            if (currentTab === 2) fetchTests();
          }}
        />

        <CreateTestWizardModal
          open={modalCreateTestWizardOpen}
          onClose={() => setModalCreateTestWizardOpen(false)}
          onCreated={() => {
            showToast('Prova criada via assistente com sucesso.');
            if (currentTab === 2) fetchTests();
          }}
        />

        <CreateOriginModal
          open={modalCreateOriginOpen}
          onClose={() => setModalCreateOriginOpen(false)}
          onCreated={() => showToast('Banca criada com sucesso.')}
        />

        <CreateAreaModal
          open={modalCreateAreaOpen}
          onClose={() => setModalCreateAreaOpen(false)}
          onCreated={() => showToast('Área criada com sucesso.')}
        />

        <CreateSubjectModal
          open={modalCreateSubjectOpen}
          onClose={() => setModalCreateSubjectOpen(false)}
          onCreated={() => showToast('Matéria criada com sucesso.')}
        />

        {/* Edit Test Modal */}
        <EditTestModal
          open={Boolean(editingTest)}
          test={editingTest}
          onClose={() => setEditingTest(null)}
          onUpdated={() => {
            showToast('Prova atualizada com sucesso.');
            fetchTests();
          }}
        />

        {/* Manage Test Questions Modal */}
        <TestQuestionsManagerModal
          open={Boolean(managingQuestionsTest)}
          test={managingQuestionsTest}
          onClose={() => setManagingQuestionsTest(null)}
          onUpdated={() => {
            showToast('Questões da prova atualizadas com sucesso.');
            fetchTests();
          }}
        />

        {/* Delete User Confirmation Dialog */}
        <Dialog open={Boolean(userToDelete)} onClose={() => !isDeletingUser && setUserToDelete(null)}>
          <DialogTitle sx={{ fontWeight: 700 }}>Excluir Usuário</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Tem certeza que deseja excluir permanentemente o usuário{' '}
              <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {userToDelete?.name} ({userToDelete?.email})
              </Box>
              ? Esta ação removerá os dados de acesso e tentativas deste usuário.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setUserToDelete(null)} disabled={isDeletingUser} sx={{ color: 'text.secondary' }}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleConfirmDeleteUser}
              disabled={isDeletingUser}
              sx={{ fontWeight: 700 }}
            >
              {isDeletingUser ? 'Excluindo...' : 'Excluir Permanentemente'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Test Confirmation Dialog */}
        <Dialog open={Boolean(deletingTest)} onClose={() => !isDeletingTest && setDeletingTest(null)}>
          <DialogTitle sx={{ fontWeight: 700 }}>Excluir Prova</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Tem certeza que deseja excluir a prova{' '}
              <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {deletingTest?.name}
              </Box>
              ? Esta ação não pode ser desfeita.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDeletingTest(null)} disabled={isDeletingTest} sx={{ color: 'text.secondary' }}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleConfirmDeleteTest}
              disabled={isDeletingTest}
              sx={{ fontWeight: 700 }}
            >
              {isDeletingTest ? 'Excluindo...' : 'Excluir Prova'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Toast Feedback */}
        <Snackbar
          open={toastOpen}
          autoHideDuration={4000}
          onClose={() => setToastOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setToastOpen(false)} severity={toastSeverity} sx={{ width: '100%', fontWeight: 600 }}>
            {toastMessage}
          </Alert>
        </Snackbar>
    </Box>
  );
};
