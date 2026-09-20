import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
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
import { getUserProfile, promoteUserToAdmin } from '../services/api';
import { CategoryPerformance, UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { PALETTE_COLORS } from '../theme/theme';

export const UserProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const userId = id ? Number(id) : null;
  const { user: currentUser, login } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promoting, setPromoting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Tabs de Categoria: 0 = Área, 1 = Matéria, 2 = Banca
  const [categoryTab, setCategoryTab] = useState<number>(0);
  const [categorySortBy, setCategorySortBy] = useState<'resolved' | 'accuracy'>('resolved');

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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress color="secondary" />
      </Box>
    );
  }

  if (error || !profile) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Usuário não encontrado.'}</Alert>
      </Box>
    );
  }

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

  // Prepara dados para as tabs de categoria com ordenação
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
    <Box sx={{ maxWidth: 1100, mx: 'auto', py: 4, px: 2 }}>
      {actionSuccess && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setActionSuccess(null)}>
          {actionSuccess}
        </Alert>
      )}

      {/* Header do Perfil */}
      <Paper elevation={4} sx={{ p: { xs: 3, md: 4 }, mb: 4, borderRadius: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'secondary.main',
                fontSize: 32,
                fontWeight: 'bold',
                boxShadow: 2,
              }}
            >
              {profile.name.charAt(0).toUpperCase()}
            </Avatar>
          </Grid>
          <Grid item xs>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
              <Typography variant="h4" fontWeight="bold">
                {profile.name}
              </Typography>
              <Chip
                label={profile.role}
                color={profile.role === 'ADMIN' ? 'error' : 'secondary'}
                size="small"
                icon={profile.role === 'ADMIN' ? <AdminPanelSettingsIcon /> : <PersonIcon />}
                sx={{ fontWeight: 'bold' }}
              />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {profile.email} • Membro desde {new Date(profile.createdAt).toLocaleDateString()}
            </Typography>
          </Grid>

          {currentUser?.role === 'ADMIN' && profile.role === 'GENERAL' && (
            <Grid item>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<AdminPanelSettingsIcon />}
                onClick={handlePromote}
                disabled={promoting}
                sx={{ fontWeight: 'bold', borderRadius: 2 }}
              >
                {promoting ? 'Promovendo...' : 'Tornar ADMIN'}
              </Button>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Card de Desempenho Competitivo (Top % dos Estudantes) */}
      {comparison && (
        <Paper
          elevation={5}
          sx={{
            p: { xs: 3, md: 4 },
            mb: 4,
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
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
        Visão Geral de Desempenho
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
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

      {/* Painel Interativo de Análise por Categorias (Áreas / Matérias / Bancas) */}
      <Paper elevation={4} sx={{ p: { xs: 2.5, md: 4 }, mb: 4, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <BarChartIcon color="secondary" />
              <Typography variant="h6" fontWeight="bold">
                Análise Interativa de Desempenho
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Acompanhe sua taxa de acerto detalhada agrupada por área do conhecimento, matéria ou banca examinadora.
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
            Nenhuma questão resolvida nesta categoria até o momento. Resolva mais questões para visualizar estatísticas detalhadas.
          </Alert>
        ) : (
          <Stack spacing={2.5}>
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

      {/* Histórico Diário (Heatmap no estilo GitHub) */}
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

        <Stack direction="row" alignItems="center" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Menos
          </Typography>
          <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: getHeatmapColor(0) }} />
          <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: getHeatmapColor(1) }} />
          <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: getHeatmapColor(4) }} />
          <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: getHeatmapColor(8) }} />
          <Typography variant="caption" color="text.secondary">
            Mais
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
};
