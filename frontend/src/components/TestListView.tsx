import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  Grid,
  CircularProgress,
  Stack,
  Alert,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useNavigate } from 'react-router-dom';
import { TestCard } from '../types';
import { getTestCards } from '../services/api';
import { PALETTE_COLORS } from '../theme/theme';
import { useAppTheme } from '../theme/ThemeContext';

export const TestListView: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';

  const [tests, setTests] = useState<TestCard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    setLoading(true);
    try {
      const data = await getTestCards();
      setTests(data);
    } catch (err) {
      console.error('Erro ao carregar provas:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'FACIL':
        return (
          <Chip
            size="small"
            label="Fácil (≥ 80%)"
            sx={{
              backgroundColor: isDark ? 'rgba(75, 241, 81, 0.15)' : 'rgba(75, 241, 81, 0.2)',
              color: PALETTE_COLORS.success,
              fontWeight: 700,
              border: `1px solid ${PALETTE_COLORS.success}`,
            }}
          />
        );
      case 'MEDIA':
        return (
          <Chip
            size="small"
            label="Média (50% - 79%)"
            sx={{
              backgroundColor: isDark ? 'rgba(243, 255, 61, 0.15)' : 'rgba(243, 255, 61, 0.25)',
              color: isDark ? PALETTE_COLORS.warning : '#7a7000',
              fontWeight: 700,
              border: `1px solid ${PALETTE_COLORS.warning}`,
            }}
          />
        );
      case 'DIFICIL':
        return (
          <Chip
            size="small"
            label="Difícil (< 50%)"
            sx={{
              backgroundColor: isDark ? 'rgba(250, 66, 75, 0.15)' : 'rgba(250, 66, 75, 0.2)',
              color: PALETTE_COLORS.danger,
              fontWeight: 700,
              border: `1px solid ${PALETTE_COLORS.danger}`,
            }}
          />
        );
      default:
        return (
          <Chip
            size="small"
            label="Sem dados"
            sx={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              color: 'text.secondary',
              fontWeight: 500,
              border: '1px solid',
              borderColor: 'divider',
            }}
          />
        );
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: PALETTE_COLORS.primary }} />
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 6 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
          Provas & Simulados
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Selecione uma prova para iniciar a avaliação com cronômetro personalizado e feedback de desempenho.
        </Typography>
      </Box>

      {tests.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Nenhuma prova encontrada cadastrada no sistema.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {tests.map((test) => (
            <Grid item xs={12} md={6} key={test.id}>
              <Paper
                elevation={4}
                sx={{
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: 3,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: 6,
                  },
                }}
              >
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5, gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                      {test.name}
                    </Typography>
                    {getDifficultyBadge(test.difficultyLevel)}
                  </Box>

                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 0.8, mb: 2 }}>
                    <Chip
                      size="small"
                      label={`Ano ${test.year}`}
                      variant="outlined"
                      sx={{ borderColor: 'divider', color: 'text.secondary' }}
                    />
                    {test.originName && (
                      <Chip
                        size="small"
                        label={test.originName}
                        sx={{
                          backgroundColor: isDark ? 'rgba(90, 166, 226, 0.15)' : 'rgba(90, 166, 226, 0.12)',
                          color: PALETTE_COLORS.secondary,
                          fontWeight: 600,
                        }}
                      />
                    )}
                    {test.areaName && (
                      <Chip
                        size="small"
                        label={test.areaName}
                        variant="outlined"
                        sx={{ borderColor: PALETTE_COLORS.secondary, color: PALETTE_COLORS.secondary }}
                      />
                    )}
                    <Chip
                      size="small"
                      icon={<MenuBookIcon fontSize="small" />}
                      label={`${test.questionCount} questões`}
                      sx={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
                    />
                  </Stack>

                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      mb: 2.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <TrendingUpIcon fontSize="small" sx={{ color: PALETTE_COLORS.primary }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Média de Acertos:{' '}
                        <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          {test.averageScore > 0 ? `${test.averageScore.toFixed(1)}%` : '—'}
                        </Box>
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <CheckCircleOutlineIcon fontSize="small" sx={{ color: PALETTE_COLORS.secondary }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Resoluções:{' '}
                        <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          {test.totalAttempts}
                        </Box>
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  startIcon={<PlayArrowIcon />}
                  onClick={() => navigate(`/provas/${test.id}`)}
                  sx={{ fontWeight: 700, py: 1.2, borderRadius: 2 }}
                >
                  Iniciar Avaliação
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};
