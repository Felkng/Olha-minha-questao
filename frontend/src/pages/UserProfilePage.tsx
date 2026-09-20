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
  Grid,
  Paper,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { getUserProfile, promoteUserToAdmin } from '../services/api';
import { UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';

export const UserProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const userId = id ? Number(id) : null;
  const { user: currentUser, login } = useAuth();
  const theme = useTheme();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promoting, setPromoting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

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

  // Visualizador do Heatmap de 35 dias (ou dias com atividades)
  const activities = profile.dailyActivities || (profile as any).dailyActivity || [];
  const activityMap = new Map(activities.map((a: any) => [a.date, a.count]));

  // Gera os últimos 35 dias (5 semanas)
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
    if (count === 0) return theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    if (count <= 2) return 'rgba(90, 166, 226, 0.35)';
    if (count <= 5) return 'rgba(90, 166, 226, 0.70)';
    return '#5aa6e2'; // Cor secundária pura
  };

  return (
    <Box sx={{ maxW: 1000, mx: 'auto', py: 4, px: 2 }}>
      {actionSuccess && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setActionSuccess(null)}>
          {actionSuccess}
        </Alert>
      )}

      {/* Header do Perfil */}
      <Paper elevation={4} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'secondary.main',
                fontSize: 32,
                fontWeight: 'bold',
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
              >
                {promoting ? 'Promovendo...' : 'Tornar ADMIN'}
              </Button>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Estatísticas Gerais */}
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
        Estatísticas de Resolução
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={3}>
          <Card elevation={3} sx={{ textAlign: 'center', py: 2 }}>
            <CardContent>
              <Typography variant="h3" fontWeight="bold" color="primary">
                {profile.totalResolved ?? 0}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Questões Resolvidas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card elevation={3} sx={{ textAlign: 'center', py: 2 }}>
            <CardContent>
              <Typography variant="h3" fontWeight="bold" sx={{ color: '#4bf151' }}>
                {(profile.easyAccuracy ?? 0).toFixed(1)}%
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Acerto Questões Fáceis
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card elevation={3} sx={{ textAlign: 'center', py: 2 }}>
            <CardContent>
              <Typography variant="h3" fontWeight="bold" sx={{ color: '#f3ff3d' }}>
                {(profile.mediumAccuracy ?? 0).toFixed(1)}%
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Acerto Questões Médias
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card elevation={3} sx={{ textAlign: 'center', py: 2 }}>
            <CardContent>
              <Typography variant="h3" fontWeight="bold" sx={{ color: '#fa424b' }}>
                {(profile.hardAccuracy ?? 0).toFixed(1)}%
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Acerto Questões Difíceis
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Histórico Diário (Heatmap no estilo GitHub com cor secundária #5aa6e2) */}
      <Paper elevation={4} sx={{ p: 4, borderRadius: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <CheckCircleOutlineIcon color="secondary" />
          <Typography variant="h6" fontWeight="bold">
            Histórico Diário de Resolução de Questões
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
