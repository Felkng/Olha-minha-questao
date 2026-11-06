import React, { useEffect, useState, useCallback } from 'react';
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
  Stack,
} from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import { useLocation, useNavigate } from 'react-router-dom';
import { ActiveTestSession, QuestionSession, TestSession } from '../../types';
import {
  deleteQuestionSession,
  deleteTestSession,
  getUserQuestionSessions,
  getUserTestSessions,
} from '../../services/api';
import { PALETTE_COLORS } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../theme/ThemeContext';

const formatDuration = (seconds: number) => {
  const safe = Math.max(0, seconds || 0);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const ActiveTestBanner: React.FC = () => {
  const { user } = useAuth();
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';
  const location = useLocation();
  const navigate = useNavigate();

  const [localTestSession, setLocalTestSession] = useState<ActiveTestSession | null>(null);
  const [serverTestSession, setServerTestSession] = useState<TestSession | null>(null);
  const [serverQuestionSession, setServerQuestionSession] = useState<QuestionSession | null>(null);

  const [discardTarget, setDiscardTarget] = useState<'test' | 'question' | null>(null);

  const loadLocalSession = useCallback(() => {
    try {
      const stored = localStorage.getItem('omq_active_test_session');
      if (stored) {
        const parsed: ActiveTestSession = JSON.parse(stored);
        if (parsed && parsed.testId) {
          setLocalTestSession(parsed);
          return;
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar sessão de simulado local:', err);
    }
    setLocalTestSession(null);
  }, []);

  const loadServerSessions = useCallback(async () => {
    if (!user?.id) {
      setServerTestSession(null);
      setServerQuestionSession(null);
      return;
    }
    try {
      const [tSessions, qSessions] = await Promise.all([
        getUserTestSessions(),
        getUserQuestionSessions(),
      ]);
      const activeTest = tSessions.find((s) => !s.completed) || null;
      const activeQuestion = qSessions.find((s) => !s.completed) || null;
      setServerTestSession(activeTest);
      setServerQuestionSession(activeQuestion);
    } catch (err) {
      console.warn('Erro ao consultar sessões ativas no servidor:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    loadLocalSession();
    loadServerSessions();

    const handleSessionChange = () => {
      loadLocalSession();
      loadServerSessions();
    };

    window.addEventListener('storage', handleSessionChange);
    window.addEventListener('omq_session_updated', handleSessionChange);

    const localInterval = setInterval(loadLocalSession, 2500);
    const serverInterval = setInterval(loadServerSessions, 20000);

    return () => {
      window.removeEventListener('storage', handleSessionChange);
      window.removeEventListener('omq_session_updated', handleSessionChange);
      clearInterval(localInterval);
      clearInterval(serverInterval);
    };
  }, [loadLocalSession, loadServerSessions, location.pathname]);

  // Consolidate active test session (prefer live local metrics when matching same test, else server session for cross-hardware)
  const effectiveTest = (() => {
    if (localTestSession && (!serverTestSession || serverTestSession.testId === localTestSession.testId)) {
      return {
        sessionId: localTestSession.sessionId ?? serverTestSession?.id,
        testId: localTestSession.testId,
        testName: localTestSession.testName || serverTestSession?.testName || `Prova #${localTestSession.testId}`,
        answeredCount: Object.keys(localTestSession.answers || {}).length,
        totalCount: localTestSession.totalQuestions || serverTestSession?.totalQuestions || 0,
        timeSpent: localTestSession.timeSpent || 0,
      };
    }
    if (serverTestSession) {
      return {
        sessionId: serverTestSession.id,
        testId: serverTestSession.testId,
        testName: serverTestSession.testName || `Prova #${serverTestSession.testId}`,
        answeredCount: serverTestSession.answeredCount ?? (serverTestSession.items?.length || 0),
        totalCount: serverTestSession.totalQuestions || (serverTestSession.questionIds?.length || 0),
        timeSpent: serverTestSession.timeSpentSeconds || 0,
      };
    }
    return null;
  })();

  const showTestBanner =
    Boolean(effectiveTest) &&
    location.pathname !== `/provas/${effectiveTest?.testId}/avaliacao`;

  const showQuestionBanner =
    Boolean(serverQuestionSession) &&
    !location.pathname.startsWith('/questoes/estudo') &&
    !location.pathname.startsWith('/questoes/estudar');

  if (!showTestBanner && !showQuestionBanner) return null;

  const handleDiscardConfirm = async () => {
    if (discardTarget === 'test' && effectiveTest) {
      if (effectiveTest.sessionId && user?.id) {
        try {
          await deleteTestSession(effectiveTest.sessionId);
        } catch (err) {
          console.warn('Erro ao remover sessão de simulado do servidor:', err);
        }
      }
      localStorage.removeItem('omq_active_test_session');
      setLocalTestSession(null);
      setServerTestSession(null);
      window.dispatchEvent(new Event('omq_session_updated'));
    } else if (discardTarget === 'question' && serverQuestionSession) {
      try {
        await deleteQuestionSession(serverQuestionSession.id);
      } catch (err) {
        console.warn('Erro ao remover sessão de estudo de questões:', err);
      }
      setServerQuestionSession(null);
      window.dispatchEvent(new Event('omq_session_updated'));
    }
    setDiscardTarget(null);
  };

  return (
    <>
      <Stack spacing={1.5} sx={{ mb: 3 }}>
        {showTestBanner && effectiveTest && (
          <Paper
            elevation={6}
            sx={{
              p: { xs: 1.5, sm: 2 },
              borderRadius: 2.5,
              border: '1.5px solid',
              borderColor: PALETTE_COLORS.primary,
              backgroundColor: isDark ? 'rgba(217, 183, 99, 0.1)' : 'rgba(217, 183, 99, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
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
                    Simulado em Andamento:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: PALETTE_COLORS.primary }}>
                    {effectiveTest.testName}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                  <Chip
                    icon={<TimerOutlinedIcon sx={{ fontSize: '0.9rem !important' }} />}
                    label={formatDuration(effectiveTest.timeSpent)}
                    size="small"
                    sx={{ fontWeight: 700, fontSize: '0.75rem', height: 22 }}
                  />
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    {effectiveTest.answeredCount} de {effectiveTest.totalCount} questões preenchidas
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<PlayCircleOutlineIcon />}
                onClick={() =>
                  navigate(
                    effectiveTest.sessionId
                      ? `/provas/${effectiveTest.testId}/avaliacao?sessionId=${effectiveTest.sessionId}`
                      : `/provas/${effectiveTest.testId}/avaliacao`
                  )
                }
                sx={{
                  backgroundColor: PALETTE_COLORS.primary,
                  color: '#1a1e24',
                  fontWeight: 800,
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 2,
                  py: 0.8,
                  '&:hover': { backgroundColor: '#c4a251' },
                }}
              >
                Continuar Simulado
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<DeleteOutlineIcon />}
                onClick={() => setDiscardTarget('test')}
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
        )}

        {showQuestionBanner && serverQuestionSession && (
          <Paper
            elevation={4}
            sx={{
              p: { xs: 1.5, sm: 2 },
              borderRadius: 2.5,
              border: '1.5px solid',
              borderColor: PALETTE_COLORS.secondary,
              backgroundColor: isDark ? 'rgba(90, 166, 226, 0.1)' : 'rgba(90, 166, 226, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 260 }}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2,
                  backgroundColor: PALETTE_COLORS.secondary,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <MenuBookOutlinedIcon fontSize="medium" />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                    Sessão de Questões Pausada:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: PALETTE_COLORS.secondary }}>
                    {serverQuestionSession.title ||
                      serverQuestionSession.folderName ||
                      serverQuestionSession.subjectName ||
                      serverQuestionSession.areaName ||
                      'Estudo de Questões'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                  <Chip
                    icon={<TimerOutlinedIcon sx={{ fontSize: '0.9rem !important' }} />}
                    label={formatDuration(serverQuestionSession.timeSpentSeconds)}
                    size="small"
                    sx={{ fontWeight: 700, fontSize: '0.75rem', height: 22 }}
                  />
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    {(serverQuestionSession.items?.length ||
                      serverQuestionSession.correctCount +
                        serverQuestionSession.wrongCount +
                        serverQuestionSession.skippedCount)}{' '}
                    de {serverQuestionSession.totalQuestions} questões praticadas
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<PlayCircleOutlineIcon />}
                onClick={() => navigate(`/questoes/estudo?sessionId=${serverQuestionSession.id}`)}
                sx={{
                  backgroundColor: PALETTE_COLORS.secondary,
                  color: '#ffffff',
                  fontWeight: 800,
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 2,
                  py: 0.8,
                }}
              >
                Retomar Estudo
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<DeleteOutlineIcon />}
                onClick={() => setDiscardTarget('question')}
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
        )}
      </Stack>

      {/* Modal de Confirmação de Descarte */}
      <Dialog open={Boolean(discardTarget)} onClose={() => setDiscardTarget(null)}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {discardTarget === 'test'
            ? 'Descartar Simulado em Andamento?'
            : 'Descartar Sessão de Estudo de Questões?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {discardTarget === 'test' && effectiveTest
              ? `Você possui um simulado em andamento (${effectiveTest.testName}) com ${effectiveTest.answeredCount} questões preenchidas e ${formatDuration(effectiveTest.timeSpent)} decorridos. Deseja realmente descartar este rascunho?`
              : `Você possui uma sessão de estudo de questões em andamento. Deseja realmente descartar o progresso desta sessão?`}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDiscardTarget(null)} sx={{ color: 'text.secondary' }}>
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
