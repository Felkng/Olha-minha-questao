import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CategoryIcon from '@mui/icons-material/Category';
import ClassIcon from '@mui/icons-material/Class';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import BarChartIcon from '@mui/icons-material/BarChart';
import SortIcon from '@mui/icons-material/Sort';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import FolderSpecialOutlinedIcon from '@mui/icons-material/FolderSpecialOutlined';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SearchIcon from '@mui/icons-material/Search';

import {
  getUserProfile,
  promoteUserToAdmin,
  getQuestions,
  deleteQuestion,
  getTests,
  deleteTest,
  getFolders,
  createFolder,
  deleteFolder,
  getOrigins,
  deleteOrigin,
  getAreas,
  deleteArea,
  getSubjects,
  deleteSubject,
} from '../services/api';
import {
  Area,
  CategoryPerformance,
  Folder,
  FolderType,
  Origin,
  Question,
  Subject,
  Test,
  TestCard,
  UserProfile,
} from '../types';
import { useAuth } from '../context/AuthContext';
import { PALETTE_COLORS } from '../theme/theme';

// Modais CRUD
import { CreateQuestionModal } from '../components/crud/CreateQuestionModal';
import { EditQuestionModal } from '../components/crud/EditQuestionModal';
import { CreateTestWizardModal } from '../components/crud/CreateTestWizardModal';
import { EditTestModal } from '../components/crud/EditTestModal';
import { TestQuestionsManagerModal } from '../components/crud/TestQuestionsManagerModal';
import { CreateOriginModal } from '../components/crud/CreateOriginModal';
import { EditOriginModal } from '../components/crud/EditOriginModal';
import { CreateAreaModal } from '../components/crud/CreateAreaModal';
import { EditAreaModal } from '../components/crud/EditAreaModal';
import { CreateSubjectModal } from '../components/crud/CreateSubjectModal';
import { EditSubjectModal } from '../components/crud/EditSubjectModal';

type ProfileTab =
  | 'visao_geral'
  | 'minhas_questoes'
  | 'minhas_provas'
  | 'minhas_pastas'
  | 'admin_bancas'
  | 'admin_areas'
  | 'admin_materias';

export const UserProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const userId = id ? Number(id) : null;
  const navigate = useNavigate();
  const { user: currentUser, login } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [activeNavTab, setActiveNavTab] = useState<ProfileTab>('visao_geral');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promoting, setPromoting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Tabs de Categoria em Estatísticas: 0 = Área, 1 = Matéria, 2 = Banca
  const [categoryTab, setCategoryTab] = useState<number>(0);
  const [categorySortBy, setCategorySortBy] = useState<'resolved' | 'accuracy'>('resolved');

  // Dados de Minhas Questões
  const [myQuestions, setMyQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionSearch, setQuestionSearch] = useState('');

  // Dados de Minhas Provas
  const [myTests, setMyTests] = useState<Test[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [testSearch, setTestSearch] = useState('');

  // Dados de Minhas Pastas
  const [myFolders, setMyFolders] = useState<Folder[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [folderTypeTab, setFolderTypeTab] = useState<FolderType>('QUESTION');
  const [openCreateFolderDialog, setOpenCreateFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(PALETTE_COLORS.primary);
  const [savingFolder, setSavingFolder] = useState(false);

  // Dados de Administração (ADMIN)
  const [allOrigins, setAllOrigins] = useState<Origin[]>([]);
  const [loadingOrigins, setLoadingOrigins] = useState(false);
  const [originSearch, setOriginSearch] = useState('');

  const [allAreas, setAllAreas] = useState<Area[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [areaSearch, setAreaSearch] = useState('');

  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [subjectAreaFilter, setSubjectAreaFilter] = useState<number | ''>('');

  // Modais de Criação & Edição
  const [openCreateQuestion, setOpenCreateQuestion] = useState(false);
  const [selectedQuestionForEdit, setSelectedQuestionForEdit] = useState<Question | null>(null);

  const [openCreateTestWizard, setOpenCreateTestWizard] = useState(false);
  const [selectedTestForEdit, setSelectedTestForEdit] = useState<Test | TestCard | null>(null);
  const [selectedTestForManager, setSelectedTestForManager] = useState<Test | TestCard | null>(null);

  const [openCreateOrigin, setOpenCreateOrigin] = useState(false);
  const [selectedOriginForEdit, setSelectedOriginForEdit] = useState<Origin | null>(null);

  const [openCreateArea, setOpenCreateArea] = useState(false);
  const [selectedAreaForEdit, setSelectedAreaForEdit] = useState<Area | null>(null);

  const [openCreateSubject, setOpenCreateSubject] = useState(false);
  const [selectedSubjectForEdit, setSelectedSubjectForEdit] = useState<Subject | null>(null);

  // Confirmação de Exclusão Genérica
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: async () => {},
  });
  const [deleting, setDeleting] = useState(false);

  const isOwner = currentUser?.id === userId;
  const isAdmin = currentUser?.role === 'ADMIN';

  const fetchProfile = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getUserProfile(userId);
      setProfile(data);
    } catch (err: any) {
      setError('Não foi possível carregar o perfil do usuário.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  // Carregamento sob demanda das abas selecionadas
  useEffect(() => {
    if (!userId) return;
    if (activeNavTab === 'minhas_questoes') {
      loadMyQuestions();
    } else if (activeNavTab === 'minhas_provas') {
      loadMyTests();
    } else if (activeNavTab === 'minhas_pastas') {
      loadMyFolders();
    } else if (activeNavTab === 'admin_bancas' && isAdmin) {
      loadAllOrigins();
    } else if (activeNavTab === 'admin_areas' && isAdmin) {
      loadAllAreas();
    } else if (activeNavTab === 'admin_materias' && isAdmin) {
      loadAllSubjects();
      loadAllAreas();
    }
  }, [activeNavTab, userId, folderTypeTab]);

  const loadMyQuestions = async () => {
    if (!userId) return;
    setLoadingQuestions(true);
    try {
      const res = await getQuestions({ createdByUserId: userId, size: 100 });
      setMyQuestions(res.content || []);
    } catch (err) {
      console.error('Erro ao carregar questões do usuário:', err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const loadMyTests = async () => {
    if (!userId) return;
    setLoadingTests(true);
    try {
      const res = await getTests({ createdByUserId: userId });
      setMyTests(res);
    } catch (err) {
      console.error('Erro ao carregar provas do usuário:', err);
    } finally {
      setLoadingTests(false);
    }
  };

  const loadMyFolders = async () => {
    if (!userId) return;
    setLoadingFolders(true);
    try {
      const res = await getFolders(folderTypeTab, userId);
      setMyFolders(res);
    } catch (err) {
      console.error('Erro ao carregar pastas do usuário:', err);
    } finally {
      setLoadingFolders(false);
    }
  };

  const loadAllOrigins = async () => {
    setLoadingOrigins(true);
    try {
      const res = await getOrigins();
      setAllOrigins(res);
    } catch (err) {
      console.error('Erro ao carregar bancas:', err);
    } finally {
      setLoadingOrigins(false);
    }
  };

  const loadAllAreas = async () => {
    setLoadingAreas(true);
    try {
      const res = await getAreas();
      setAllAreas(res);
    } catch (err) {
      console.error('Erro ao carregar áreas:', err);
    } finally {
      setLoadingAreas(false);
    }
  };

  const loadAllSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const res = await getSubjects();
      setAllSubjects(res);
    } catch (err) {
      console.error('Erro ao carregar matérias:', err);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handlePromote = async () => {
    if (!userId) return;
    setPromoting(true);
    setActionSuccess(null);
    try {
      const updatedUser = await promoteUserToAdmin(userId);
      setActionSuccess(`${updatedUser.name} agora é um usuário ADMIN!`);
      if (currentUser && currentUser.id === updatedUser.id) {
        login(updatedUser);
      }
      fetchProfile();
    } catch (err: any) {
      setError('Falha ao promover usuário.');
    } finally {
      setPromoting(false);
    }
  };

  const handleCreateFolderSubmit = async () => {
    if (!newFolderName.trim()) return;
    setSavingFolder(true);
    try {
      await createFolder({
        name: newFolderName.trim(),
        description: newFolderDesc.trim() || undefined,
        color: newFolderColor,
        folderType: folderTypeTab,
      });
      setNewFolderName('');
      setNewFolderDesc('');
      setOpenCreateFolderDialog(false);
      loadMyFolders();
    } catch (err) {
      console.error('Erro ao criar pasta:', err);
    } finally {
      setSavingFolder(false);
    }
  };

  const handleDeleteItem = (title: string, message: string, onConfirm: () => Promise<void>) => {
    setDeleteDialog({
      open: true,
      title,
      message,
      onConfirm,
    });
  };

  const confirmDeleteAction = async () => {
    setDeleting(true);
    try {
      await deleteDialog.onConfirm();
      setDeleteDialog((prev) => ({ ...prev, open: false }));
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Erro ao excluir item.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress color="secondary" />
      </Box>
    );
  }

  if (error && !profile) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Usuário não encontrado.'}</Alert>
      </Box>
    );
  }

  if (!profile) return null;

  // Visualizador do Heatmap de 35 dias
  const activities = profile.dailyActivities || (profile as any).dailyActivity || [];
  const activityMap = new Map(activities.map((a: any) => [a.date, a.count]));

  const today = new Date();
  const days: { dateStr: string; count: number }[] = [];
  for (let i = 34; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({
      dateStr,
      count: activityMap.get(dateStr) || 0,
    });
  }

  const getHeatmapColor = (count: number) => {
    if (count === 0) return isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    if (count <= 2) return 'rgba(90, 166, 226, 0.35)';
    if (count <= 5) return 'rgba(90, 166, 226, 0.70)';
    return '#5aa6e2';
  };

  const getAccuracyColor = (acc: number) => {
    if (acc >= 70) return '#4bf151';
    if (acc >= 50) return '#d9b763';
    return '#fa424b';
  };

  const getSortedCategories = (items: CategoryPerformance[] = []) => {
    const copy = [...items];
    if (categorySortBy === 'accuracy') {
      return copy.sort((a, b) => b.accuracyPercentage - a.accuracyPercentage || b.totalQuestions - a.totalQuestions);
    }
    return copy.sort((a, b) => b.totalQuestions - a.totalQuestions || b.accuracyPercentage - a.accuracyPercentage);
  };

  const currentCategoryList =
    categoryTab === 0
      ? getSortedCategories(profile.performanceByArea)
      : categoryTab === 1
      ? getSortedCategories(profile.performanceBySubject)
      : getSortedCategories(profile.performanceByOrigin);

  const comparison = profile.comparison;

  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto', py: 3, px: { xs: 1, sm: 2 } }}>
      {actionSuccess && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setActionSuccess(null)}>
          {actionSuccess}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* ========================================================= */}
        {/* COLUNA LATERAL ESQUERDA: PERFIL & NAVEGAÇÃO */}
        {/* ========================================================= */}
        <Grid item xs={12} md={3.5} lg={3}>
          <Stack spacing={2.5}>
            {/* Card de Informações do Usuário */}
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 72,
                  height: 72,
                  mx: 'auto',
                  mb: 1.5,
                  bgcolor: 'secondary.main',
                  fontSize: 30,
                  fontWeight: 'bold',
                  boxShadow: 2,
                }}
              >
                {profile.name.charAt(0).toUpperCase()}
              </Avatar>

              <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                {profile.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {profile.email}
              </Typography>

              <Chip
                label={profile.role}
                color={profile.role === 'ADMIN' ? 'error' : 'secondary'}
                size="small"
                icon={profile.role === 'ADMIN' ? <AdminPanelSettingsIcon /> : <PersonIcon />}
                sx={{ fontWeight: 'bold', mb: 1.5 }}
              />

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Cadastrado em {new Date(profile.createdAt).toLocaleDateString()}
              </Typography>

              {currentUser?.role === 'ADMIN' && profile.role === 'GENERAL' && (
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  startIcon={<AdminPanelSettingsIcon />}
                  onClick={handlePromote}
                  disabled={promoting}
                  sx={{ mt: 2, fontWeight: 'bold', borderRadius: 2 }}
                  fullWidth
                >
                  {promoting ? 'Promovendo...' : 'Tornar ADMIN'}
                </Button>
              )}
            </Paper>

            {/* Menu de Navegação Lateral */}
            <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <List component="nav" sx={{ p: 1 }}>
                <ListItemButton
                  selected={activeNavTab === 'visao_geral'}
                  onClick={() => setActiveNavTab('visao_geral')}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    '&.Mui-selected': {
                      backgroundColor: isDark ? 'rgba(217, 183, 99, 0.15)' : 'rgba(217, 183, 99, 0.12)',
                      color: PALETTE_COLORS.primary,
                      fontWeight: 700,
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: activeNavTab === 'visao_geral' ? PALETTE_COLORS.primary : 'inherit' }}>
                    <BarChartIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Visão Geral" primaryTypographyProps={{ fontWeight: activeNavTab === 'visao_geral' ? 700 : 500 }} />
                </ListItemButton>

                {(isOwner || isAdmin) && (
                  <>
                    <ListItemButton
                      selected={activeNavTab === 'minhas_questoes'}
                      onClick={() => setActiveNavTab('minhas_questoes')}
                      sx={{
                        borderRadius: 2,
                        mb: 0.5,
                        '&.Mui-selected': {
                          backgroundColor: isDark ? 'rgba(217, 183, 99, 0.15)' : 'rgba(217, 183, 99, 0.12)',
                          color: PALETTE_COLORS.primary,
                          fontWeight: 700,
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, color: activeNavTab === 'minhas_questoes' ? PALETTE_COLORS.primary : 'inherit' }}>
                        <QuizOutlinedIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Minhas Questões" primaryTypographyProps={{ fontWeight: activeNavTab === 'minhas_questoes' ? 700 : 500 }} />
                    </ListItemButton>

                    <ListItemButton
                      selected={activeNavTab === 'minhas_provas'}
                      onClick={() => setActiveNavTab('minhas_provas')}
                      sx={{
                        borderRadius: 2,
                        mb: 0.5,
                        '&.Mui-selected': {
                          backgroundColor: isDark ? 'rgba(217, 183, 99, 0.15)' : 'rgba(217, 183, 99, 0.12)',
                          color: PALETTE_COLORS.primary,
                          fontWeight: 700,
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, color: activeNavTab === 'minhas_provas' ? PALETTE_COLORS.primary : 'inherit' }}>
                        <MenuBookOutlinedIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Minhas Provas" primaryTypographyProps={{ fontWeight: activeNavTab === 'minhas_provas' ? 700 : 500 }} />
                    </ListItemButton>

                    <ListItemButton
                      selected={activeNavTab === 'minhas_pastas'}
                      onClick={() => setActiveNavTab('minhas_pastas')}
                      sx={{
                        borderRadius: 2,
                        mb: 0.5,
                        '&.Mui-selected': {
                          backgroundColor: isDark ? 'rgba(217, 183, 99, 0.15)' : 'rgba(217, 183, 99, 0.12)',
                          color: PALETTE_COLORS.primary,
                          fontWeight: 700,
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, color: activeNavTab === 'minhas_pastas' ? PALETTE_COLORS.primary : 'inherit' }}>
                        <FolderSpecialOutlinedIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Minhas Pastas" primaryTypographyProps={{ fontWeight: activeNavTab === 'minhas_pastas' ? 700 : 500 }} />
                    </ListItemButton>
                  </>
                )}

                {/* Seção de Administração - Apenas para ADMIN */}
                {isAdmin && (
                  <>
                    <Divider sx={{ my: 1.5 }} />
                    <ListSubheader
                      sx={{
                        backgroundColor: 'transparent',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        letterSpacing: 1.2,
                        color: 'text.secondary',
                        lineHeight: '28px',
                      }}
                    >
                      ADMINISTRAÇÃO
                    </ListSubheader>

                    <ListItemButton
                      selected={activeNavTab === 'admin_bancas'}
                      onClick={() => setActiveNavTab('admin_bancas')}
                      sx={{
                        borderRadius: 2,
                        mb: 0.5,
                        '&.Mui-selected': {
                          backgroundColor: isDark ? 'rgba(217, 183, 99, 0.15)' : 'rgba(217, 183, 99, 0.12)',
                          color: PALETTE_COLORS.primary,
                          fontWeight: 700,
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, color: activeNavTab === 'admin_bancas' ? PALETTE_COLORS.primary : 'inherit' }}>
                        <AccountBalanceIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Gerenciar Bancas" primaryTypographyProps={{ fontWeight: activeNavTab === 'admin_bancas' ? 700 : 500 }} />
                    </ListItemButton>

                    <ListItemButton
                      selected={activeNavTab === 'admin_areas'}
                      onClick={() => setActiveNavTab('admin_areas')}
                      sx={{
                        borderRadius: 2,
                        mb: 0.5,
                        '&.Mui-selected': {
                          backgroundColor: isDark ? 'rgba(217, 183, 99, 0.15)' : 'rgba(217, 183, 99, 0.12)',
                          color: PALETTE_COLORS.primary,
                          fontWeight: 700,
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, color: activeNavTab === 'admin_areas' ? PALETTE_COLORS.primary : 'inherit' }}>
                        <CategoryIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Gerenciar Áreas" primaryTypographyProps={{ fontWeight: activeNavTab === 'admin_areas' ? 700 : 500 }} />
                    </ListItemButton>

                    <ListItemButton
                      selected={activeNavTab === 'admin_materias'}
                      onClick={() => setActiveNavTab('admin_materias')}
                      sx={{
                        borderRadius: 2,
                        mb: 0.5,
                        '&.Mui-selected': {
                          backgroundColor: isDark ? 'rgba(217, 183, 99, 0.15)' : 'rgba(217, 183, 99, 0.12)',
                          color: PALETTE_COLORS.primary,
                          fontWeight: 700,
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, color: activeNavTab === 'admin_materias' ? PALETTE_COLORS.primary : 'inherit' }}>
                        <ClassIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Gerenciar Matérias" primaryTypographyProps={{ fontWeight: activeNavTab === 'admin_materias' ? 700 : 500 }} />
                    </ListItemButton>
                  </>
                )}
              </List>
            </Paper>
          </Stack>
        </Grid>

        {/* ========================================================= */}
        {/* COLUNA PRINCIPAL DIREITA: CONTEÚDO DA ABA ATIVA */}
        {/* ========================================================= */}
        <Grid item xs={12} md={8.5} lg={9}>
          {/* ABA 0: VISÃO GERAL & ESTATÍSTICAS */}
          {activeNavTab === 'visao_geral' && (
            <Stack spacing={3}>
              {/* Card de Desempenho Competitivo (Top % dos Estudantes) */}
              {comparison && (
                <Paper
                  elevation={5}
                  sx={{
                    p: { xs: 3, md: 4 },
                    borderRadius: 3,
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1.5px solid',
                    borderColor: PALETTE_COLORS.primary,
                    background: isDark
                      ? 'linear-gradient(135deg, rgba(217, 183, 99, 0.12) 0%, rgba(22, 26, 32, 0.95) 100%)'
                      : 'linear-gradient(135deg, rgba(217, 183, 99, 0.15) 0%, rgba(255, 255, 255, 0.95) 100%)',
                  }}
                >
                  <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={7}>
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(217, 183, 99, 0.2)',
                            color: PALETTE_COLORS.primary,
                          }}
                        >
                          <EmojiEventsIcon fontSize="large" />
                        </Box>
                        <Box>
                          <Typography variant="overline" sx={{ fontWeight: 800, color: PALETTE_COLORS.primary, letterSpacing: 1.2 }}>
                            POSICIONAMENTO GLOBAL NA PLATAFORMA
                          </Typography>
                          <Typography variant="h5" fontWeight="bold">
                            Você está no{' '}
                            <Box component="span" sx={{ color: PALETTE_COLORS.primary, fontWeight: 900 }}>
                              Top {comparison.topPercentage}%
                            </Box>{' '}
                            dos estudantes
                          </Typography>
                        </Box>
                      </Stack>

                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                        Seu desempenho supera <strong>{comparison.percentileRank}%</strong> de todos os estudantes cadastrados. Posição no ranking:{' '}
                        <strong>#{comparison.userRank}</strong> de <strong>{comparison.totalUsers}</strong> usuários.
                      </Typography>

                      {/* Barra de Percentil */}
                      <Box sx={{ width: '100%', mr: 1, mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" fontWeight="bold" color="text.secondary">
                            0% (Iniciante)
                          </Typography>
                          <Typography variant="caption" fontWeight="bold" sx={{ color: PALETTE_COLORS.primary }}>
                            Percentil {comparison.percentileRank}%
                          </Typography>
                          <Typography variant="caption" fontWeight="bold" color="text.secondary">
                            Top 1% (Elite)
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(100, Math.max(5, comparison.percentileRank))}
                          sx={{
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: PALETTE_COLORS.primary,
                              borderRadius: 5,
                            },
                          }}
                        />
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={5}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2.5,
                          borderRadius: 2.5,
                          border: '1px solid',
                          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                          backgroundColor: isDark ? 'rgba(26, 30, 36, 0.7)' : 'rgba(255, 255, 255, 0.8)',
                        }}
                      >
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TrendingUpIcon color="secondary" fontSize="small" /> Comparativo com a Média da Plataforma
                        </Typography>

                        <Stack spacing={2}>
                          <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2" color="text.secondary">
                                Sua Taxa de Acerto:
                              </Typography>
                              <Typography variant="body2" fontWeight="bold" sx={{ color: getAccuracyColor(comparison.userAccuracy) }}>
                                {comparison.userAccuracy.toFixed(1)}%
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                Média Global dos Usuários:
                              </Typography>
                              <Typography variant="caption" fontWeight="bold" color="text.secondary">
                                {comparison.globalAverageAccuracy.toFixed(1)}%
                              </Typography>
                            </Box>
                          </Box>

                          <Divider />

                          <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2" color="text.secondary">
                                Suas Questões Resolvidas:
                              </Typography>
                              <Typography variant="body2" fontWeight="bold" color="primary">
                                {comparison.userTotalResolved}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                Média de Questões por Usuário:
                              </Typography>
                              <Typography variant="caption" fontWeight="bold" color="text.secondary">
                                {comparison.globalAverageResolved.toFixed(1)}
                              </Typography>
                            </Box>
                          </Box>
                        </Stack>
                      </Paper>
                    </Grid>
                  </Grid>
                </Paper>
              )}

              {/* Cards de Estatísticas Gerais */}
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card elevation={3} sx={{ textAlign: 'center', py: 2, borderRadius: 2.5, height: '100%' }}>
                    <CardContent>
                      <Typography variant="h3" fontWeight="bold" color="primary">
                        {profile.totalResolved ?? 0}
                      </Typography>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Questões Resolvidas
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {profile.totalCorrectAnswers ?? 0} acertos no total
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card elevation={3} sx={{ textAlign: 'center', py: 2, borderRadius: 2.5, height: '100%' }}>
                    <CardContent>
                      <Typography variant="h3" fontWeight="bold" sx={{ color: '#4bf151' }}>
                        {(profile.easyAccuracy ?? 0).toFixed(1)}%
                      </Typography>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Acerto em Fáceis
                      </Typography>
                      <Box sx={{ width: '80%', mx: 'auto', mt: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={profile.easyAccuracy ?? 0}
                          sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(75, 241, 81, 0.15)', '& .MuiLinearProgress-bar': { bgcolor: '#4bf151' } }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card elevation={3} sx={{ textAlign: 'center', py: 2, borderRadius: 2.5, height: '100%' }}>
                    <CardContent>
                      <Typography variant="h3" fontWeight="bold" sx={{ color: '#f3ff3d' }}>
                        {(profile.mediumAccuracy ?? 0).toFixed(1)}%
                      </Typography>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Acerto em Médias
                      </Typography>
                      <Box sx={{ width: '80%', mx: 'auto', mt: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={profile.mediumAccuracy ?? 0}
                          sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(243, 255, 61, 0.15)', '& .MuiLinearProgress-bar': { bgcolor: '#f3ff3d' } }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card elevation={3} sx={{ textAlign: 'center', py: 2, borderRadius: 2.5, height: '100%' }}>
                    <CardContent>
                      <Typography variant="h3" fontWeight="bold" sx={{ color: '#fa424b' }}>
                        {(profile.hardAccuracy ?? 0).toFixed(1)}%
                      </Typography>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Acerto em Difíceis
                      </Typography>
                      <Box sx={{ width: '80%', mx: 'auto', mt: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={profile.hardAccuracy ?? 0}
                          sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(250, 66, 75, 0.15)', '& .MuiLinearProgress-bar': { bgcolor: '#fa424b' } }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Painel Interativo de Análise por Categorias */}
              <Paper elevation={4} sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <BarChartIcon color="secondary" />
                      <Typography variant="h6" fontWeight="bold">
                        Análise Interativa de Desempenho
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      Acompanhe sua taxa de acerto detalhada agrupada por área, matéria ou banca.
                    </Typography>
                  </Box>

                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<SortIcon />}
                    onClick={() => setCategorySortBy((prev) => (prev === 'resolved' ? 'accuracy' : 'resolved'))}
                    sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
                  >
                    Ordenar: {categorySortBy === 'resolved' ? 'Mais Resolvidas' : 'Maior Taxa de Acerto'}
                  </Button>
                </Box>

                <Tabs
                  value={categoryTab}
                  onChange={(_, val) => setCategoryTab(val)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    mb: 3,
                    borderBottom: 1,
                    borderColor: 'divider',
                    '& .MuiTab-root': { fontWeight: 'bold', textTransform: 'none', fontSize: '0.95rem' },
                  }}
                >
                  <Tab icon={<CategoryIcon fontSize="small" />} iconPosition="start" label={`Áreas (${profile.performanceByArea?.length ?? 0})`} />
                  <Tab icon={<ClassIcon fontSize="small" />} iconPosition="start" label={`Matérias (${profile.performanceBySubject?.length ?? 0})`} />
                  <Tab icon={<AccountBalanceIcon fontSize="small" />} iconPosition="start" label={`Bancas (${profile.performanceByOrigin?.length ?? 0})`} />
                </Tabs>

                {currentCategoryList.length === 0 ? (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Nenhuma questão resolvida nesta categoria até o momento.
                  </Alert>
                ) : (
                  <Stack spacing={2}>
                    {currentCategoryList.map((cat) => {
                      const accColor = getAccuracyColor(cat.accuracyPercentage);
                      return (
                        <Box
                          key={cat.id || cat.name}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: PALETTE_COLORS.secondary,
                              backgroundColor: isDark ? 'rgba(90, 166, 226, 0.05)' : 'rgba(90, 166, 226, 0.03)',
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {cat.name}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip
                                size="small"
                                label={`${cat.totalQuestions} resolvida(s)`}
                                variant="outlined"
                                sx={{ fontWeight: 600 }}
                              />
                              <Chip
                                size="small"
                                label={`${cat.correctAnswers} acerto(s)`}
                                sx={{ fontWeight: 600, bgcolor: 'rgba(75, 241, 81, 0.15)', color: '#4bf151' }}
                              />
                              <Typography variant="h6" fontWeight="900" sx={{ color: accColor, minWidth: 65, textAlign: 'right' }}>
                                {cat.accuracyPercentage.toFixed(1)}%
                              </Typography>
                            </Stack>
                          </Box>

                          <Tooltip title={`Acurácia: ${cat.accuracyPercentage.toFixed(1)}% (${cat.correctAnswers}/${cat.totalQuestions})`} arrow>
                            <LinearProgress
                              variant="determinate"
                              value={cat.accuracyPercentage}
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: accColor,
                                  borderRadius: 4,
                                },
                              }}
                            />
                          </Tooltip>
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </Paper>

              {/* Histórico Diário (Heatmap) */}
              <Paper elevation={4} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <CheckCircleOutlineIcon color="secondary" />
                  <Typography variant="h6" fontWeight="bold">
                    Frequência Diária de Estudos
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Exibindo a frequência de resolução dos últimos 35 dias.
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'flex-start' }}>
                  {days.map((d) => (
                    <Tooltip
                      key={d.dateStr}
                      title={`${d.dateStr}: ${d.count} questão(ões) resolvida(s)`}
                      arrow
                    >
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: 0.5,
                          backgroundColor: getHeatmapColor(d.count),
                          border: `1px solid ${theme.palette.divider}`,
                          transition: 'transform 0.1s',
                          '&:hover': {
                            transform: 'scale(1.2)',
                            borderColor: '#5aa6e2',
                          },
                        }}
                      />
                    </Tooltip>
                  ))}
                </Box>
              </Paper>
            </Stack>
          )}

          {/* ABA 1: MINHAS QUESTÕES */}
          {activeNavTab === 'minhas_questoes' && (
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    Minhas Questões
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total de questões criadas: {myQuestions.length}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenCreateQuestion(true)}
                  sx={{ fontWeight: 700, backgroundColor: PALETTE_COLORS.primary, color: '#1a1e24' }}
                >
                  Nova Questão
                </Button>
              </Box>

              <TextField
                placeholder="Buscar em minhas questões..."
                size="small"
                fullWidth
                value={questionSearch}
                onChange={(e) => setQuestionSearch(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{ mb: 3 }}
              />

              {loadingQuestions ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress size={32} />
                </Box>
              ) : myQuestions.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    Você ainda não cadastrou nenhuma questão.
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenCreateQuestion(true)}
                  >
                    Cadastrar Primeira Questão
                  </Button>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {myQuestions
                    .filter((q) =>
                      questionSearch
                        ? q.enunciado.toLowerCase().includes(questionSearch.toLowerCase()) ||
                          (q.identifier && q.identifier.toLowerCase().includes(questionSearch.toLowerCase()))
                        : true
                    )
                    .map((q) => (
                      <Paper
                        key={q.id}
                        variant="outlined"
                        sx={{
                          p: 2.5,
                          borderRadius: 2,
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          justifyContent: 'space-between',
                          alignItems: { xs: 'flex-start', sm: 'center' },
                          gap: 2,
                          '&:hover': {
                            borderColor: PALETTE_COLORS.primary,
                          },
                        }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                            <Chip
                              label={q.identifier ? `Questão ${q.identifier}` : `#${q.id}`}
                              size="small"
                              color="primary"
                              sx={{ fontWeight: 'bold' }}
                            />
                            {q.areaName && <Chip label={q.areaName} size="small" variant="outlined" />}
                            {q.originName && <Chip label={q.originName} size="small" variant="outlined" />}
                            {q.subjectName && <Chip label={q.subjectName} size="small" variant="outlined" />}
                            <Chip label={String(q.year)} size="small" variant="outlined" />
                          </Stack>

                          <Typography
                            variant="body1"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              mt: 1,
                              fontWeight: 500,
                            }}
                          >
                            {q.enunciado}
                          </Typography>

                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            {q.alternatives?.length || 0} alternativas cadastradas
                          </Typography>
                        </Box>

                        <Stack direction="row" spacing={1} sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}>
                          <Tooltip title="Visualizar questão">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/questoes/${q.id}`, { state: { from: '/perfil', fromTitle: 'Voltar para o Perfil' } })}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Editar questão e alternativas">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => setSelectedQuestionForEdit(q)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Excluir questão">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                handleDeleteItem(
                                  'Excluir Questão',
                                  `Tem certeza que deseja excluir a questão #${q.id}? Esta ação não pode ser desfeita.`,
                                  async () => {
                                    await deleteQuestion(q.id);
                                    loadMyQuestions();
                                  }
                                )
                              }
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Paper>
                    ))}
                </Stack>
              )}
            </Paper>
          )}

          {/* ABA 2: MINHAS PROVAS */}
          {activeNavTab === 'minhas_provas' && (
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    Minhas Provas & Simulados
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total de provas criadas: {myTests.length}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenCreateTestWizard(true)}
                  sx={{ fontWeight: 700, backgroundColor: PALETTE_COLORS.primary, color: '#1a1e24' }}
                >
                  Nova Prova
                </Button>
              </Box>

              <TextField
                placeholder="Buscar em minhas provas..."
                size="small"
                fullWidth
                value={testSearch}
                onChange={(e) => setTestSearch(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{ mb: 3 }}
              />

              {loadingTests ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress size={32} />
                </Box>
              ) : myTests.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    Você ainda não cadastrou nenhuma prova.
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenCreateTestWizard(true)}
                  >
                    Cadastrar Primeira Prova
                  </Button>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {myTests
                    .filter((t) =>
                      testSearch
                        ? t.name.toLowerCase().includes(testSearch.toLowerCase()) ||
                          String(t.year).includes(testSearch)
                        : true
                    )
                    .map((t) => (
                      <Paper
                        key={t.id}
                        variant="outlined"
                        sx={{
                          p: 2.5,
                          borderRadius: 2,
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          justifyContent: 'space-between',
                          alignItems: { xs: 'flex-start', sm: 'center' },
                          gap: 2,
                          '&:hover': {
                            borderColor: PALETTE_COLORS.primary,
                          },
                        }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="h6" fontWeight="bold">
                            {t.name} ({t.year})
                          </Typography>

                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                            {t.originName && <Chip label={`Banca: ${t.originName}`} size="small" variant="outlined" />}
                            {t.areaName && <Chip label={`Área: ${t.areaName}`} size="small" variant="outlined" />}
                            <Chip label={`Ano: ${t.year}`} size="small" variant="outlined" />
                          </Stack>

                          {(t as any).description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              {(t as any).description}
                            </Typography>
                          )}
                        </Box>

                        <Stack direction="row" spacing={1} sx={{ alignSelf: { xs: 'flex-end', sm: 'center' }, flexWrap: 'wrap' }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<ListAltIcon fontSize="small" />}
                            onClick={() => setSelectedTestForManager(t)}
                            sx={{ textTransform: 'none', fontWeight: 600 }}
                          >
                            Gerenciar Questões
                          </Button>

                          <Tooltip title="Acessar / Resolver Prova">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/provas/${t.id}`)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Editar informações da prova">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => setSelectedTestForEdit(t)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Excluir prova">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                handleDeleteItem(
                                  'Excluir Prova',
                                  `Tem certeza que deseja excluir a prova "${t.name}"? As questões associadas permanecerão no sistema como avulsas.`,
                                  async () => {
                                    await deleteTest(t.id);
                                    loadMyTests();
                                  }
                                )
                              }
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Paper>
                    ))}
                </Stack>
              )}
            </Paper>
          )}

          {/* ABA 3: MINHAS PASTAS */}
          {activeNavTab === 'minhas_pastas' && (
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    Minhas Pastas Salvas
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Organize suas questões e provas favoritas em pastas personalizadas.
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenCreateFolderDialog(true)}
                  sx={{ fontWeight: 700, backgroundColor: PALETTE_COLORS.primary, color: '#1a1e24' }}
                >
                  Nova Pasta
                </Button>
              </Box>

              <Tabs
                value={folderTypeTab}
                onChange={(_, val) => setFolderTypeTab(val)}
                sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab value="QUESTION" label="Pastas de Questões" icon={<QuizOutlinedIcon fontSize="small" />} iconPosition="start" />
                <Tab value="TEST" label="Pastas de Provas" icon={<MenuBookOutlinedIcon fontSize="small" />} iconPosition="start" />
              </Tabs>

              {loadingFolders ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress size={32} />
                </Box>
              ) : myFolders.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    Nenhuma pasta encontrada nesta categoria.
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenCreateFolderDialog(true)}
                  >
                    Criar Pasta
                  </Button>
                </Box>
              ) : (
                <Grid container spacing={2.5}>
                  {myFolders.map((folder) => (
                    <Grid item xs={12} sm={6} md={4} key={folder.id}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2.5,
                          borderRadius: 2.5,
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          borderTop: `4px solid ${folder.color || PALETTE_COLORS.primary}`,
                          '&:hover': {
                            boxShadow: 3,
                          },
                        }}
                      >
                        <Box>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Typography variant="h6" fontWeight="bold">
                              {folder.name}
                            </Typography>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                handleDeleteItem(
                                  'Excluir Pasta',
                                  `Tem certeza que deseja excluir a pasta "${folder.name}"? Os itens salvos nela não serão apagados do sistema.`,
                                  async () => {
                                    await deleteFolder(folder.id);
                                    loadMyFolders();
                                  }
                                )
                              }
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Stack>

                          {folder.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              {folder.description}
                            </Typography>
                          )}
                        </Box>

                        <Box sx={{ mt: 2, pt: 1, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            {folder.folderType === 'QUESTION' ? 'Questões' : 'Provas'}
                          </Typography>
                          <Button
                            size="small"
                            onClick={() => navigate(`/pastas/${folder.id}`)}
                            sx={{ textTransform: 'none', fontWeight: 600 }}
                          >
                            Abrir Pasta
                          </Button>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          )}

          {/* ABA 4: GERENCIAR BANCAS (ADMIN) */}
          {activeNavTab === 'admin_bancas' && isAdmin && (
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    Gerenciar Bancas Examinadoras
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total de bancas cadastradas: {allOrigins.length}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenCreateOrigin(true)}
                  sx={{ fontWeight: 700, backgroundColor: PALETTE_COLORS.primary, color: '#1a1e24' }}
                >
                  Nova Banca
                </Button>
              </Box>

              <TextField
                placeholder="Buscar banca..."
                size="small"
                fullWidth
                value={originSearch}
                onChange={(e) => setOriginSearch(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{ mb: 3 }}
              />

              {loadingOrigins ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress size={32} />
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {allOrigins
                    .filter((o) =>
                      originSearch ? o.name.toLowerCase().includes(originSearch.toLowerCase()) : true
                    )
                    .map((origin) => (
                      <Paper
                        key={origin.id}
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 2,
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {origin.name}
                          </Typography>
                          {origin.description && (
                            <Typography variant="body2" color="text.secondary">
                              {origin.description}
                            </Typography>
                          )}
                        </Box>

                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Editar banca">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => setSelectedOriginForEdit(origin)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Excluir banca">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                handleDeleteItem(
                                  'Excluir Banca',
                                  `Tem certeza que deseja excluir a banca "${origin.name}"?`,
                                  async () => {
                                    await deleteOrigin(origin.id);
                                    loadAllOrigins();
                                  }
                                )
                              }
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Paper>
                    ))}
                </Stack>
              )}
            </Paper>
          )}

          {/* ABA 5: GERENCIAR ÁREAS (ADMIN) */}
          {activeNavTab === 'admin_areas' && isAdmin && (
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    Gerenciar Áreas do Conhecimento
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total de áreas cadastradas: {allAreas.length}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenCreateArea(true)}
                  sx={{ fontWeight: 700, backgroundColor: PALETTE_COLORS.primary, color: '#1a1e24' }}
                >
                  Nova Área
                </Button>
              </Box>

              <TextField
                placeholder="Buscar área..."
                size="small"
                fullWidth
                value={areaSearch}
                onChange={(e) => setAreaSearch(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{ mb: 3 }}
              />

              {loadingAreas ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress size={32} />
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {allAreas
                    .filter((a) =>
                      areaSearch ? a.name.toLowerCase().includes(areaSearch.toLowerCase()) : true
                    )
                    .map((area) => (
                      <Paper
                        key={area.id}
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 2,
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {area.name}
                          </Typography>
                          {area.description && (
                            <Typography variant="body2" color="text.secondary">
                              {area.description}
                            </Typography>
                          )}
                        </Box>

                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Editar área">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => setSelectedAreaForEdit(area)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Excluir área">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                handleDeleteItem(
                                  'Excluir Área',
                                  `Tem certeza que deseja excluir a área "${area.name}"?`,
                                  async () => {
                                    await deleteArea(area.id);
                                    loadAllAreas();
                                  }
                                )
                              }
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Paper>
                    ))}
                </Stack>
              )}
            </Paper>
          )}

          {/* ABA 6: GERENCIAR MATÉRIAS (ADMIN) */}
          {activeNavTab === 'admin_materias' && isAdmin && (
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    Gerenciar Matérias
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total de matérias cadastradas: {allSubjects.length}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenCreateSubject(true)}
                  sx={{ fontWeight: 700, backgroundColor: PALETTE_COLORS.primary, color: '#1a1e24' }}
                >
                  Nova Matéria
                </Button>
              </Box>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                <TextField
                  placeholder="Buscar matéria..."
                  size="small"
                  fullWidth
                  value={subjectSearch}
                  onChange={(e) => setSubjectSearch(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />

                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Filtrar por Área</InputLabel>
                  <Select
                    value={subjectAreaFilter}
                    label="Filtrar por Área"
                    onChange={(e) => setSubjectAreaFilter(e.target.value as number | '')}
                  >
                    <MenuItem value="">
                      <em>Todas as Áreas</em>
                    </MenuItem>
                    {allAreas.map((a) => (
                      <MenuItem key={a.id} value={a.id}>
                        {a.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              {loadingSubjects ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress size={32} />
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {allSubjects
                    .filter((s) => {
                      const matchSearch = subjectSearch
                        ? s.name.toLowerCase().includes(subjectSearch.toLowerCase())
                        : true;
                      const matchArea = subjectAreaFilter ? s.areaId === subjectAreaFilter : true;
                      return matchSearch && matchArea;
                    })
                    .map((subject) => (
                      <Paper
                        key={subject.id}
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 2,
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {subject.name}
                            </Typography>
                            {subject.areaName && (
                              <Chip label={subject.areaName} size="small" variant="outlined" />
                            )}
                          </Stack>
                          {subject.description && (
                            <Typography variant="body2" color="text.secondary">
                              {subject.description}
                            </Typography>
                          )}
                        </Box>

                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Editar matéria">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => setSelectedSubjectForEdit(subject)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Excluir matéria">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                handleDeleteItem(
                                  'Excluir Matéria',
                                  `Tem certeza que deseja excluir a matéria "${subject.name}"?`,
                                  async () => {
                                    await deleteSubject(subject.id);
                                    loadAllSubjects();
                                  }
                                )
                              }
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Paper>
                    ))}
                </Stack>
              )}
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* ========================================================= */}
      {/* SUBMODAIS DE CRIAÇÃO E EDIÇÃO */}
      {/* ========================================================= */}

      {/* Questões */}
      <CreateQuestionModal
        open={openCreateQuestion}
        onClose={() => setOpenCreateQuestion(false)}
        onCreated={() => {
          setOpenCreateQuestion(false);
          loadMyQuestions();
        }}
      />
      <EditQuestionModal
        open={Boolean(selectedQuestionForEdit)}
        question={selectedQuestionForEdit}
        onClose={() => setSelectedQuestionForEdit(null)}
        onUpdated={() => loadMyQuestions()}
      />

      {/* Provas */}
      <CreateTestWizardModal
        open={openCreateTestWizard}
        onClose={() => setOpenCreateTestWizard(false)}
        onCreated={() => {
          setOpenCreateTestWizard(false);
          loadMyTests();
        }}
      />
      <EditTestModal
        open={Boolean(selectedTestForEdit)}
        test={selectedTestForEdit}
        onClose={() => setSelectedTestForEdit(null)}
        onUpdated={() => loadMyTests()}
      />
      <TestQuestionsManagerModal
        open={Boolean(selectedTestForManager)}
        test={selectedTestForManager}
        onClose={() => setSelectedTestForManager(null)}
        onUpdated={() => loadMyTests()}
      />

      {/* Bancas (ADMIN) */}
      <CreateOriginModal
        open={openCreateOrigin}
        onClose={() => setOpenCreateOrigin(false)}
        onCreated={() => {
          setOpenCreateOrigin(false);
          loadAllOrigins();
        }}
      />
      <EditOriginModal
        open={Boolean(selectedOriginForEdit)}
        origin={selectedOriginForEdit}
        onClose={() => setSelectedOriginForEdit(null)}
        onUpdated={() => loadAllOrigins()}
      />

      {/* Áreas (ADMIN) */}
      <CreateAreaModal
        open={openCreateArea}
        onClose={() => setOpenCreateArea(false)}
        onCreated={() => {
          setOpenCreateArea(false);
          loadAllAreas();
        }}
      />
      <EditAreaModal
        open={Boolean(selectedAreaForEdit)}
        area={selectedAreaForEdit}
        onClose={() => setSelectedAreaForEdit(null)}
        onUpdated={() => loadAllAreas()}
      />

      {/* Matérias (ADMIN) */}
      <CreateSubjectModal
        open={openCreateSubject}
        onClose={() => setOpenCreateSubject(false)}
        onCreated={() => {
          setOpenCreateSubject(false);
          loadAllSubjects();
        }}
      />
      <EditSubjectModal
        open={Boolean(selectedSubjectForEdit)}
        subject={selectedSubjectForEdit}
        onClose={() => setSelectedSubjectForEdit(null)}
        onUpdated={() => loadAllSubjects()}
      />

      {/* Diálogo de Criação de Pasta */}
      <Dialog
        open={openCreateFolderDialog}
        onClose={() => setOpenCreateFolderDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Criar Nova Pasta ({folderTypeTab === 'QUESTION' ? 'Questões' : 'Provas'})
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <TextField
              label="Nome da Pasta"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              fullWidth
              required
              size="small"
            />
            <TextField
              label="Descrição (Opcional)"
              value={newFolderDesc}
              onChange={(e) => setNewFolderDesc(e.target.value)}
              fullWidth
              multiline
              rows={2}
              size="small"
            />
            <FormControl size="small">
              <Typography variant="caption" sx={{ mb: 1, fontWeight: 'bold' }}>
                Cor da Pasta
              </Typography>
              <RadioGroup
                row
                value={newFolderColor}
                onChange={(e) => setNewFolderColor(e.target.value)}
              >
                {[
                  PALETTE_COLORS.primary,
                  PALETTE_COLORS.secondary,
                  PALETTE_COLORS.success,
                  PALETTE_COLORS.danger,
                  PALETTE_COLORS.warning,
                  '#b388ff',
                  '#ff80ab',
                ].map((color) => (
                  <FormControlLabel
                    key={color}
                    value={color}
                    control={
                      <Radio
                        size="small"
                        sx={{
                          color,
                          '&.Mui-checked': { color },
                        }}
                      />
                    }
                    label=""
                    sx={{ m: 0, mr: 1 }}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenCreateFolderDialog(false)} disabled={savingFolder}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateFolderSubmit}
            disabled={savingFolder || !newFolderName.trim()}
            sx={{ fontWeight: 700, backgroundColor: PALETTE_COLORS.primary }}
          >
            {savingFolder ? 'Criando...' : 'Criar Pasta'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo Genérico de Confirmação de Exclusão */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog((prev) => ({ ...prev, open: false }))}>
        <DialogTitle sx={{ fontWeight: 700 }}>{deleteDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{deleteDialog.message}</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialog((prev) => ({ ...prev, open: false }))} disabled={deleting}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDeleteAction}
            disabled={deleting}
          >
            {deleting ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
