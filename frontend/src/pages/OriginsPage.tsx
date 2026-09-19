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
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';
import { OriginCard } from '../types';
import { getOriginCards } from '../services/api';
import { PALETTE_COLORS } from '../theme/theme';
import { useAppTheme } from '../theme/ThemeContext';

export const OriginsPage: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';

  const [origins, setOrigins] = useState<OriginCard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadOrigins();
  }, []);

  const loadOrigins = async () => {
    setLoading(true);
    try {
      const data = await getOriginCards();
      setOrigins(data);
    } catch (err) {
      console.error('Erro ao carregar bancas:', err);
    } finally {
      setLoading(false);
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
          Bancas Examinadoras
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Explore as questões e provas organizadas por banca organizadora em ordem alfabética. Selecione uma banca para visualizar suas questões mais respondidas.
        </Typography>
      </Box>

      {origins.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Nenhuma banca encontrada cadastrada no sistema.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {origins.map((origin) => (
            <Grid item xs={12} sm={6} md={4} key={origin.id}>
              <Paper
                elevation={4}
                onClick={() => navigate(`/bancas/${origin.id}`)}
                sx={{
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: 3,
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: 6,
                    borderColor: PALETTE_COLORS.primary,
                  },
                }}
              >
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2,
                        backgroundColor: isDark ? 'rgba(90, 166, 226, 0.15)' : 'rgba(90, 166, 226, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: PALETTE_COLORS.secondary,
                      }}
                    >
                      <AccountBalanceIcon />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                        {origin.name}
                      </Typography>
                    </Box>
                  </Box>

                  {origin.description && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        mb: 2.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {origin.description}
                    </Typography>
                  )}

                  <Stack direction="row" spacing={1} sx={{ mb: 2.5 }}>
                    <Chip
                      size="small"
                      icon={<QuizOutlinedIcon fontSize="small" />}
                      label={`${origin.questionCount} questões`}
                      sx={{
                        backgroundColor: isDark ? 'rgba(217, 183, 99, 0.15)' : 'rgba(217, 183, 99, 0.15)',
                        color: PALETTE_COLORS.primary,
                        fontWeight: 600,
                      }}
                    />
                    <Chip
                      size="small"
                      icon={<MenuBookOutlinedIcon fontSize="small" />}
                      label={`${origin.testCount} provas`}
                      variant="outlined"
                      sx={{ borderColor: 'divider', color: 'text.secondary' }}
                    />
                  </Stack>
                </Box>

                <Button
                  variant="outlined"
                  fullWidth
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    fontWeight: 600,
                    borderRadius: 2,
                    borderColor: 'divider',
                    color: 'text.primary',
                  }}
                >
                  Ver Questões
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};
