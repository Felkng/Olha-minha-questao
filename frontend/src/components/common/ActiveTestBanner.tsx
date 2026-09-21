import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
} from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import { useLocation, useNavigate } from 'react-router-dom';
import { ActiveTestSession } from '../../types';
import { PALETTE_COLORS } from '../../theme/theme';

export const ActiveTestBanner: React.FC = () => {
  const [activeSession, setActiveSession] = useState<ActiveTestSession | null>(null);
  const [discardDialogOpen, setDiscardDialogOpen] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();

  const loadActiveSession = () => {
    try {
      const stored = localStorage.getItem('omq_active_test_session');
      if (stored) {
        const parsed: ActiveTestSession = JSON.parse(stored);
        if (parsed && parsed.testId) {
          setActiveSession(parsed);
          return;
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar sessão de simulado ativo:', err);
    }
    setActiveSession(null);
  };

  useEffect(() => {
    loadActiveSession();

    const handleStorageChange = () => {
      loadActiveSession();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('omq_session_updated', handleStorageChange);
    const interval = setInterval(loadActiveSession, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('omq_session_updated', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  if (!activeSession) return null;

  // Não exibe o banner se o usuário já estiver na tela de avaliação da mesma prova
  if (location.pathname === `/provas/${activeSession.testId}/avaliacao`) {
    return null;
  }

  const answeredCount = Object.keys(activeSession.answers || {}).length;
  const totalCount = activeSession.totalQuestions || 0;
  const minutes = Math.floor(activeSession.timeSpent / 60);
  const seconds = activeSession.timeSpent % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleContinue = () => {
    navigate(`/provas/${activeSession.testId}/avaliacao`);
  };

  const handleDiscardConfirm = () => {
    localStorage.removeItem('omq_active_test_session');
    setActiveSession(null);
    setDiscardDialogOpen(false);
    window.dispatchEvent(new Event('omq_session_updated'));
  };

  return (
    <>
      <Paper
        elevation={6}
        sx={{
          p: { xs: 1.5, sm: 2 },
          mb: 3,
          borderRadius: 2.5,
          border: '1.5px solid',
          borderColor: PALETTE_COLORS.primary,
          background: 'linear-gradient(90deg, rgba(217, 183, 99, 0.15) 0%, rgba(26, 30, 36, 0.95) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          animation: 'fadeIn 0.3s ease-in-out',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 260 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              backgroundColor: PALETTE_COLORS.primary,
              color: '#1a1e24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <QuizOutlinedIcon fontSize="medium" />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                Simulado em Execução:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: PALETTE_COLORS.primary }}>
                {activeSession.testName || `Prova #${activeSession.testId}`}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
              <Chip
                icon={<TimerOutlinedIcon sx={{ fontSize: '0.9rem !important' }} />}
                label={timeFormatted}
                size="small"
                sx={{ fontWeight: 700, fontSize: '0.75rem', height: 22 }}
              />
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                {answeredCount} de {totalCount} questões preenchidas
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<PlayCircleOutlineIcon />}
            onClick={handleContinue}
            sx={{
              backgroundColor: PALETTE_COLORS.primary,
              color: '#1a1e24',
              fontWeight: 800,
              textTransform: 'none',
              borderRadius: 2,
              px: 2,
              py: 0.8,
              '&:hover': {
                backgroundColor: '#c4a251',
              },
            }}
          >
            Continuar Simulado
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<DeleteOutlineIcon />}
            onClick={() => setDiscardDialogOpen(true)}
            sx={{
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: 2,
              px: 1.5,
              py: 0.8,
            }}
          >
            Descartar
          </Button>
        </Box>
      </Paper>

      {/* Modal de Confirmação de Descarte */}
      <Dialog open={discardDialogOpen} onClose={() => setDiscardDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Descartar Simulado em Andamento?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Você possui um simulado em andamento ({activeSession.testName}) com {answeredCount} questões preenchidas e {timeFormatted} decorridos.
            Se descartar, seu progresso não salvo nesta tentativa será perdido. Deseja realmente descartar?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDiscardDialogOpen(false)} sx={{ color: 'text.secondary' }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDiscardConfirm}
            sx={{ fontWeight: 700 }}
          >
            Sim, Descartar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
