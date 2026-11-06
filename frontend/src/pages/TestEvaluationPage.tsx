import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  Radio,
  Stack,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
} from '@mui/material';
import { DetailPageSkeleton } from '../components/skeletons';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import BorderColorIcon from '@mui/icons-material/BorderColor';
import ShareIcon from '@mui/icons-material/Share';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { TestEvaluation, TestSession, TestSubmissionResponse, TextualReference } from '../types';
import {
  getTestEvaluation,
  submitTest,
  startOrGetTestSession,
  getActiveTestSession,
  getTestSessionById,
  updateTestSession,
  deleteTestSession,
} from '../services/api';
import { PALETTE_COLORS } from '../theme/theme';
import { useAppTheme } from '../theme/ThemeContext';
import { TextualReferenceDrawer } from '../components/questions/TextualReferenceDrawer';
import { FormattedText } from '../components/common/FormattedText';
import { ZoomableImage } from '../components/common/ZoomableImage';
import { TestQuestionsNavigator } from '../components/questions/TestQuestionsNavigator';
import { QuestionWhiteboard } from '../components/whiteboard/QuestionWhiteboard';
import { ShareResultsModal } from '../components/simulations/ShareResultsModal';
import { useAuth } from '../context/AuthContext';
import { sortQuestionsByIdentifier } from '../utils/questionUtils';

export const TestEvaluationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';
  const { user } = useAuth();

  const sessionIdParam = searchParams.get('sessionId');

  const [evaluation, setEvaluation] = useState<TestEvaluation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeDrawerRef, setActiveDrawerRef] = useState<TextualReference | null>(null);
  const [activeDrawerQuestionId, setActiveDrawerQuestionId] = useState<string | undefined>(undefined);

  // Persistent session ID on backend
  const [activeTestSessionId, setActiveTestSessionId] = useState<number | null>(
    sessionIdParam ? Number(sessionIdParam) : null
  );

  // Configuration & Timer state
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [timerMinutes, setTimerMinutes] = useState<number>(30); // 0 = Free Time
  const [isCustomTimer, setIsCustomTimer] = useState<boolean>(false);
  const [customHours, setCustomHours] = useState<number>(1);
  const [customMinutes, setCustomMinutes] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(30 * 60);
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Answers state: questionId -> selectedAlternativeId
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);

  // Dialogs & submission
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [exitDialogOpen, setExitDialogOpen] = useState<boolean>(false);
  const [savingExit, setSavingExit] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<TestSubmissionResponse | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState<boolean>(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const timeSpentRef = useRef<number>(0);
  const answersRef = useRef<Record<number, number>>({});
  const activeIdxRef = useRef<number>(0);
  const timerMinutesRef = useRef<number>(30);

  useEffect(() => {
    timeSpentRef.current = timeSpent;
  }, [timeSpent]);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  useEffect(() => {
    activeIdxRef.current = activeQuestionIndex;
  }, [activeQuestionIndex]);
  useEffect(() => {
    timerMinutesRef.current = timerMinutes;
  }, [timerMinutes]);

  const applyRestoredSession = (
    sortedEval: TestEvaluation,
    serverSession: TestSession
  ) => {
    let orderedQuestions = sortedEval.questions;
    if (serverSession.questionIds && serverSession.questionIds.length > 0) {
      const qMap = new Map(sortedEval.questions.map((q) => [q.id, q]));
      const mapped = serverSession.questionIds.map((qId) => qMap.get(qId)).filter(Boolean);
      if (mapped.length === sortedEval.questions.length) {
        orderedQuestions = mapped as typeof sortedEval.questions;
      }
    }

    const restoredAnswers: Record<number, number> = {};
    (serverSession.items || []).forEach((item) => {
      if (item.questionId && item.selectedAlternativeId) {
        restoredAnswers[item.questionId] = item.selectedAlternativeId;
      }
    });

    const savedMins = serverSession.timerMinutes ?? 0;
    const savedSpent = serverSession.timeSpentSeconds ?? 0;
    const savedIdx = Math.min(
      Math.max(0, serverSession.activeQuestionIndex ?? 0),
      Math.max(0, orderedQuestions.length - 1)
    );

    setEvaluation({ ...sortedEval, questions: orderedQuestions });
    setActiveTestSessionId(serverSession.id);
    setAnswers(restoredAnswers);
    setTimerMinutes(savedMins);
    setTimeSpent(savedSpent);
    startTimeRef.current = Date.now() - savedSpent * 1000;
    if (savedMins > 0) {
      setTimeRemaining(Math.max(1, savedMins * 60 - savedSpent));
    } else {
      setTimeRemaining(0);
    }
    setActiveQuestionIndex(savedIdx);
    setIsStarted(true);
    setIsPaused(false);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('sessionId', String(serverSession.id));
    setSearchParams(nextParams, { replace: true });
  };

  useEffect(() => {
    if (id) {
      loadEvaluation(Number(id));
    }
  }, [id, user?.id]);

  const loadEvaluation = async (testId: number) => {
    setLoading(true);
    try {
      const data = await getTestEvaluation(testId);
      const sortedData: TestEvaluation = {
        ...data,
        questions: sortQuestionsByIdentifier(data.questions || []),
      };

      // 1. Try restoring from backend session if authenticated
      if (user?.id) {
        try {
          let serverSession: TestSession | null = null;
          if (sessionIdParam) {
            const byId = await getTestSessionById(Number(sessionIdParam));
            if (byId && !byId.completed && byId.testId === testId) {
              serverSession = byId;
            }
          }
          if (!serverSession) {
            serverSession = await getActiveTestSession(testId);
          }
          if (serverSession && !serverSession.completed) {
            applyRestoredSession(sortedData, serverSession);
            return;
          }
        } catch (sessionErr) {
          console.warn('Não foi possível restaurar sessão do servidor, tentando local:', sessionErr);
        }
      }

      setEvaluation(sortedData);

      // 2. Fallback: Check localStorage active session
      const stored = localStorage.getItem('omq_active_test_session');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.testId === testId) {
            const savedSpent = parsed.timeSpent || 0;
            const savedMins = parsed.timerMinutes !== undefined ? parsed.timerMinutes : 0;
            setAnswers(parsed.answers || {});
            setTimeSpent(savedSpent);
            setTimerMinutes(savedMins);
            startTimeRef.current = Date.now() - savedSpent * 1000;
            if (savedMins > 0) {
              setTimeRemaining(Math.max(1, savedMins * 60 - savedSpent));
            } else {
              setTimeRemaining(0);
            }
            setActiveQuestionIndex(parsed.activeQuestionIndex || 0);
            if (parsed.sessionId) {
              setActiveTestSessionId(parsed.sessionId);
            }
            setIsStarted(true);
          }
        } catch (e) {
          console.warn('Erro ao restaurar sessão ativa local:', e);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar avaliação:', err);
    } finally {
      setLoading(false);
    }
  };

  const buildSessionPayload = useCallback(
    (overrideSeconds?: number, completed = false) => {
      const currentEval = evaluation;
      const currentAnswers = answersRef.current;
      const spent = overrideSeconds ?? timeSpentRef.current;
      const qList = currentEval?.questions || [];
      return {
        questionIds: qList.map((q) => q.id),
        timerMinutes: timerMinutesRef.current,
        timeSpentSeconds: spent,
        activeQuestionIndex: activeIdxRef.current,
        completed,
        items: Object.entries(currentAnswers).map(([qId, altId]) => ({
          questionId: Number(qId),
          selectedAlternativeId: Number(altId),
        })),
      };
    },
    [evaluation]
  );

  const persistSessionToServer = useCallback(
    async (overrideSeconds?: number) => {
      if (!user?.id || !evaluation || result) return;
      const payload = buildSessionPayload(overrideSeconds, false);
      try {
        if (activeTestSessionId) {
          await updateTestSession(activeTestSessionId, payload);
        } else {
          const created = await startOrGetTestSession(evaluation.id, payload);
          setActiveTestSessionId(created.id);
          const nextParams = new URLSearchParams(searchParams);
          nextParams.set('sessionId', String(created.id));
          setSearchParams(nextParams, { replace: true });
        }
        window.dispatchEvent(new Event('omq_session_updated'));
      } catch (err) {
        console.warn('Falha ao sincronizar sessão de simulado com o servidor:', err);
      }
    },
    [user?.id, evaluation, result, activeTestSessionId, buildSessionPayload, searchParams, setSearchParams]
  );

  // Sync active test session to localStorage in real time
  useEffect(() => {
    if (isStarted && evaluation && !result) {
      const session = {
        sessionId: activeTestSessionId ?? undefined,
        testId: evaluation.id,
        testName: evaluation.name,
        answers,
        timeSpent,
        timerMinutes,
        activeQuestionIndex,
        totalQuestions: evaluation.questions.length,
        lastUpdatedTimestamp: Date.now(),
      };
      localStorage.setItem('omq_active_test_session', JSON.stringify(session));
      window.dispatchEvent(new Event('omq_session_updated'));
    }
  }, [isStarted, evaluation, result, answers, timeSpent, timerMinutes, activeQuestionIndex, activeTestSessionId]);

  // Auto-sync answers & activeQuestionIndex changes to server (debounced)
  useEffect(() => {
    if (!isStarted || !user?.id || !activeTestSessionId || result) return;
    const timeout = setTimeout(() => {
      persistSessionToServer();
    }, 600);
    return () => clearTimeout(timeout);
  }, [answers, activeQuestionIndex, isStarted, user?.id, activeTestSessionId, result, persistSessionToServer]);

  // Periodic background checkpoint every 15s while running
  useEffect(() => {
    if (!isStarted || isPaused || !user?.id || !activeTestSessionId || result) return;
    const checkpoint = setInterval(() => {
      persistSessionToServer();
    }, 15000);
    return () => clearInterval(checkpoint);
  }, [isStarted, isPaused, user?.id, activeTestSessionId, result, persistSessionToServer]);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => {
      const next = !prev;
      if (next) {
        const cur = Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000));
        setTimeSpent(cur);
        timeSpentRef.current = cur;
        if (timerRef.current) clearInterval(timerRef.current);
        persistSessionToServer(cur);
      } else {
        startTimeRef.current = Date.now() - timeSpentRef.current * 1000;
      }
      return next;
    });
  }, [persistSessionToServer]);

  // Keyboard shortcut: 'P' to pause/resume (ignoring text inputs)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isStarted || Boolean(result) || confirmOpen || exitDialogOpen) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        togglePause();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isStarted, result, confirmOpen, exitDialogOpen, togglePause]);

  // Wall-clock anchored timer interval logic
  useEffect(() => {
    if (!isStarted || isPaused || result) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    startTimeRef.current = Date.now() - timeSpentRef.current * 1000;

    timerRef.current = setInterval(() => {
      const elapsed = Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000));
      setTimeSpent(elapsed);
      timeSpentRef.current = elapsed;

      if (timerMinutes > 0) {
        const rem = timerMinutes * 60 - elapsed;
        if (rem <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          setTimeRemaining(0);
          handleFinalSubmit(elapsed);
        } else {
          setTimeRemaining(rem);
        }
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isStarted, isPaused, result, timerMinutes]);

  const handleStart = async () => {
    let effectiveMins = timerMinutes;
    if (isCustomTimer) {
      effectiveMins = Math.max(0, customHours * 60 + customMinutes);
      setTimerMinutes(effectiveMins);
    }
    timerMinutesRef.current = effectiveMins;

    if (effectiveMins > 0) {
      setTimeRemaining(effectiveMins * 60);
    } else {
      setTimeRemaining(0);
    }
    setTimeSpent(0);
    timeSpentRef.current = 0;
    startTimeRef.current = Date.now();
    setIsStarted(true);
    setIsPaused(false);

    if (user?.id && evaluation) {
      try {
        const created = await startOrGetTestSession(evaluation.id, {
          questionIds: evaluation.questions.map((q) => q.id),
          timerMinutes: effectiveMins,
          timeSpentSeconds: 0,
          activeQuestionIndex: 0,
          completed: false,
          items: [],
        });
        setActiveTestSessionId(created.id);
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('sessionId', String(created.id));
        setSearchParams(nextParams, { replace: true });
        window.dispatchEvent(new Event('omq_session_updated'));
      } catch (err) {
        console.warn('Não foi possível iniciar sessão persistida no servidor:', err);
      }
    }
  };

  const handleSelectAlternative = (questionId: number, alternativeId: number) => {
    if (result || isPaused) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: alternativeId,
    }));
  };

  const handleOpenExitDialog = () => {
    if (!isPaused) {
      const cur = Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000));
      setTimeSpent(cur);
      timeSpentRef.current = cur;
      setIsPaused(true);
    }
    setExitDialogOpen(true);
  };

  const handleSaveAndExit = async () => {
    setSavingExit(true);
    try {
      await persistSessionToServer(timeSpentRef.current);
    } finally {
      setSavingExit(false);
      setExitDialogOpen(false);
      navigate(`/provas/${evaluation?.id ?? ''}`);
    }
  };

  const handleDiscardSession = async () => {
    setSavingExit(true);
    try {
      if (activeTestSessionId && user?.id) {
        await deleteTestSession(activeTestSessionId);
      }
    } catch (err) {
      console.warn('Erro ao descartar sessão de simulado:', err);
    } finally {
      localStorage.removeItem('omq_active_test_session');
      window.dispatchEvent(new Event('omq_session_updated'));
      setSavingExit(false);
      setExitDialogOpen(false);
      navigate(`/provas/${evaluation?.id ?? ''}`);
    }
  };

  const handleFinalSubmit = async (overrideSpent?: number) => {
    if (!evaluation) return;
    setConfirmOpen(false);
    setSubmitting(true);

    const finalSpent = overrideSpent ?? timeSpentRef.current;

    try {
      const currentAnswers = answersRef.current;
      const formattedAnswers = evaluation.questions
        .filter((q) => currentAnswers[q.id] !== undefined)
        .map((q) => ({
          questionId: q.id,
          selectedAlternativeId: currentAnswers[q.id],
          timeSpentSeconds: Math.round(finalSpent / Math.max(evaluation.questions.length, 1)),
        }));

      const response = await submitTest(evaluation.id, {
        ...(user?.id ? { userId: user.id } : {}),
        ...(activeTestSessionId ? { testSessionId: activeTestSessionId } : {}),
        timeSpentSeconds: finalSpent,
        sessionId: activeTestSessionId ? `test-session-${activeTestSessionId}` : `session-test-${Date.now()}`,
        answers: formattedAnswers,
      });

      setResult(response);
      setActiveTestSessionId(null);
      localStorage.removeItem('omq_active_test_session');
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('sessionId');
      setSearchParams(nextParams, { replace: true });
      window.dispatchEvent(new Event('omq_session_updated'));
    } catch (err) {
      console.error('Erro ao submeter prova:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestart = () => {
    setResult(null);
    setAnswers({});
    setTimeSpent(0);
    timeSpentRef.current = 0;
    setActiveQuestionIndex(0);
    setActiveTestSessionId(null);
    setIsStarted(false);
    setIsPaused(false);
    localStorage.removeItem('omq_active_test_session');
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('sessionId');
    setSearchParams(nextParams, { replace: true });
    window.dispatchEvent(new Event('omq_session_updated'));
  };

  const formatTime = (seconds: number) => {
    const safeSecs = Math.max(0, seconds);
    const hours = Math.floor(safeSecs / 3600);
    const mins = Math.floor((safeSecs % 3600) / 60);
    const secs = safeSecs % 60;
    if (hours > 0) {
      return `${hours}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <DetailPageSkeleton />;
  }

  if (!evaluation) {
    return (
      <Alert severity="error" sx={{ my: 4 }}>
        Prova não encontrada.
      </Alert>
    );
  }

  // SCREEN 1: Configuration / Pre-start Screen
  if (!isStarted && !result) {
    return (
      <Paper elevation={4} sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, maxWidth: 800, mx: 'auto', my: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/provas/${evaluation.id}`)}
          sx={{ mb: 2, color: 'text.secondary' }}
        >
          Voltar para a Prova
        </Button>

        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
          {evaluation.name}
        </Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1, mb: 3 }}>
          <Chip label={`Ano ${evaluation.year}`} variant="outlined" />
          {evaluation.originName && <Chip label={evaluation.originName} color="info" variant="outlined" />}
          {evaluation.areaName && <Chip label={evaluation.areaName} variant="outlined" />}
          <Chip label={`${evaluation.questionCount ?? evaluation.questions?.length ?? 0} Questões`} sx={{ fontWeight: 700 }} />
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Configurar Cronômetro da Avaliação
        </Typography>

        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          Escolha o tempo limite desejado para realizar a prova ou defina um horário personalizado. Você poderá pausar o simulado, sair e retomá-lo em qualquer dispositivo a qualquer momento.
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
          {[
            { label: '15 minutos', val: 15 },
            { label: '30 minutos', val: 30 },
            { label: '45 minutos', val: 45 },
            { label: '1 hora', val: 60 },
            { label: '1h 30min', val: 90 },
            { label: '2 horas', val: 120 },
            { label: 'Tempo Livre (sem limite)', val: 0 },
          ].map((item) => (
            <Button
              key={item.val}
              variant={!isCustomTimer && timerMinutes === item.val ? 'contained' : 'outlined'}
              onClick={() => {
                setIsCustomTimer(false);
                setTimerMinutes(item.val);
              }}
              sx={{
                borderRadius: 2,
                px: 2.5,
                py: 1,
                fontWeight: 600,
                borderColor: !isCustomTimer && timerMinutes === item.val ? PALETTE_COLORS.primary : 'divider',
              }}
            >
              {item.label}
            </Button>
          ))}
          <Button
            variant={isCustomTimer ? 'contained' : 'outlined'}
            startIcon={<EditOutlinedIcon />}
            onClick={() => {
              setIsCustomTimer(true);
              setTimerMinutes(customHours * 60 + customMinutes);
            }}
            sx={{
              borderRadius: 2,
              px: 2.5,
              py: 1,
              fontWeight: 600,
              borderColor: isCustomTimer ? PALETTE_COLORS.primary : 'divider',
            }}
          >
            Personalizado
          </Button>
        </Box>

        {isCustomTimer && (
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mb: 3,
              borderRadius: 2,
              border: '1.5px solid',
              borderColor: PALETTE_COLORS.primary,
              backgroundColor: isDark ? 'rgba(217, 183, 99, 0.08)' : 'rgba(217, 183, 99, 0.06)',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Definir Tempo Personalizado da Prova:
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <TextField
                label="Horas"
                type="number"
                size="small"
                value={customHours}
                onChange={(e) => {
                  const h = Math.max(0, Math.min(24, Number(e.target.value) || 0));
                  setCustomHours(h);
                  setTimerMinutes(h * 60 + customMinutes);
                }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">h</InputAdornment>,
                  inputProps: { min: 0, max: 24 },
                }}
                sx={{ width: { xs: '100%', sm: 140 } }}
              />
              <TextField
                label="Minutos"
                type="number"
                size="small"
                value={customMinutes}
                onChange={(e) => {
                  const m = Math.max(0, Math.min(59, Number(e.target.value) || 0));
                  setCustomMinutes(m);
                  setTimerMinutes(customHours * 60 + m);
                }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">min</InputAdornment>,
                  inputProps: { min: 0, max: 59 },
                }}
                sx={{ width: { xs: '100%', sm: 140 } }}
              />
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                Tempo Total: {customHours * 60 + customMinutes > 0 ? `${customHours}h ${customMinutes}min (${customHours * 60 + customMinutes} minutos)` : '0 min (Tempo Livre)'}
              </Typography>
            </Stack>
          </Paper>
        )}

        <Alert severity="info" sx={{ mb: 4, borderRadius: 2 }}>
          Durante o simulado você poderá navegar livremente entre as questões, pausar o cronômetro (atalho <strong>P</strong>) e clicar em <strong>Salvar e Sair</strong> para retomar depois em qualquer computador ou celular.
        </Alert>

        <Button
          variant="contained"
          color="primary"
          size="large"
          fullWidth
          startIcon={<PlayCircleOutlineIcon />}
          onClick={handleStart}
          sx={{ py: 1.5, fontWeight: 700, fontSize: '1.1rem', borderRadius: 2.5 }}
        >
          Iniciar Simulado Agora
        </Button>
      </Paper>
    );
  }

  // SCREEN 3: Results & Review Screen
  if (result) {
    const isSuccess = result.scorePercentage >= 70;

    return (
      <Box sx={{ maxWidth: 900, mx: 'auto', my: 4 }}>
        <Paper
          elevation={4}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 3,
            mb: 4,
            textAlign: 'center',
            borderTop: `6px solid ${isSuccess ? PALETTE_COLORS.success : PALETTE_COLORS.danger}`,
          }}
        >
          <EmojiEventsOutlinedIcon
            sx={{
              fontSize: 64,
              color: isSuccess ? PALETTE_COLORS.success : PALETTE_COLORS.primary,
              mb: 2,
            }}
          />

          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Avaliação Concluída!
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
            Confira seu desempenho detalhado no simulado {evaluation.name}.
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' },
              gap: 2,
              mb: 4,
            }}
          >
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                APROVEITAMENTO
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: PALETTE_COLORS.primary, mt: 0.5 }}>
                {result.scorePercentage.toFixed(0)}%
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                ACERTOS
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: PALETTE_COLORS.success, mt: 0.5 }}>
                {result.correctAnswers} / {result.totalQuestions}
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                TEMPO GASTO
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                {formatTime(result.timeSpentSeconds)}
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                DIFICULDADE
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Chip
                  label={result.difficultyLevel === 'FACIL' ? 'Fácil' : result.difficultyLevel === 'MEDIA' ? 'Média' : 'Difícil'}
                  sx={{
                    fontWeight: 700,
                    backgroundColor:
                      result.difficultyLevel === 'FACIL'
                        ? 'rgba(75, 241, 81, 0.2)'
                        : result.difficultyLevel === 'MEDIA'
                        ? 'rgba(243, 255, 61, 0.2)'
                        : 'rgba(250, 66, 75, 0.2)',
                    color:
                      result.difficultyLevel === 'FACIL'
                        ? PALETTE_COLORS.success
                        : result.difficultyLevel === 'MEDIA'
                        ? isDark ? PALETTE_COLORS.warning : '#7a7000'
                        : PALETTE_COLORS.danger,
                  }}
                />
              </Box>
            </Paper>
          </Box>

          <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" gap={1.5}>
            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
              onClick={() => setShareModalOpen(true)}
              sx={{
                px: 3,
                py: 1.2,
                fontWeight: 800,
                borderColor: PALETTE_COLORS.primary,
                color: PALETTE_COLORS.primary,
                borderRadius: 2,
                '&:hover': {
                  borderColor: PALETTE_COLORS.primary,
                  backgroundColor: 'rgba(217, 183, 99, 0.1)',
                },
              }}
            >
              Compartilhar Resultados (CSV)
            </Button>
            <Button
              variant="outlined"
              startIcon={<RestartAltIcon />}
              onClick={handleRestart}
              sx={{ px: 3, py: 1.2, fontWeight: 700, borderRadius: 2 }}
            >
              Refazer Avaliação
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/provas')}
              sx={{ px: 3, py: 1.2, fontWeight: 700, borderRadius: 2 }}
            >
              Ver Outras Provas
            </Button>
          </Stack>
        </Paper>

        {/* Detailed Question by Question Review */}
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
          Gabarito & Revisão Questão a Questão
        </Typography>

        {evaluation.questions.map((q, idx) => {
          const detail = result.detailedResults.find((d) => d.questionId === q.id);
          const userSelectedId = answers[q.id];
          const isAnnulled = Boolean(q.alternatives && q.alternatives.length > 0 && q.alternatives.every((a) => a.isCorrect));
          const fallbackCorrectAlt = q.alternatives.find((a) => a.isCorrect);
          const correctAltId = detail?.correctAlternativeId ?? fallbackCorrectAlt?.id;
          const isCorrect = isAnnulled || (detail?.isCorrect !== undefined
            ? detail.isCorrect
            : Boolean(userSelectedId && correctAltId && userSelectedId === correctAltId));

          return (
            <Paper
              key={q.id}
              elevation={4}
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 3,
                border: '1.5px solid',
                borderColor: isAnnulled ? PALETTE_COLORS.warning : isCorrect ? PALETTE_COLORS.success : PALETTE_COLORS.danger,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Chip
                  label={`Questão ${idx + 1} (${q.identifier})`}
                  sx={{
                    fontWeight: 700,
                    backgroundColor: isAnnulled ? PALETTE_COLORS.warning : isCorrect ? PALETTE_COLORS.success : PALETTE_COLORS.danger,
                    color: isAnnulled ? '#1a1e24' : isCorrect ? '#0f2910' : '#ffffff',
                  }}
                />
                {isAnnulled ? (
                  <Chip
                    label="Anulada (Pontuada para todos)"
                    color="warning"
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                  />
                ) : (
                  <Chip
                    icon={isCorrect ? <CheckCircleOutlineIcon /> : <HighlightOffIcon />}
                    label={isCorrect ? 'Acertou' : userSelectedId ? 'Errou' : 'Não Respondida'}
                    variant="outlined"
                    color={isCorrect ? 'success' : 'error'}
                  />
                )}
              </Box>

              {q.textualReference && (
                <Box sx={{ mb: 2 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<MenuBookIcon />}
                    onClick={() => {
                      setActiveDrawerRef(q.textualReference!);
                      setActiveDrawerQuestionId(q.identifier);
                    }}
                    sx={{
                      fontWeight: 700,
                      borderColor: PALETTE_COLORS.primary,
                      color: PALETTE_COLORS.primary,
                      borderRadius: 1.5,
                      textTransform: 'none',
                    }}
                  >
                    Ver Texto de Apoio: {q.textualReference.title || q.textualReference.subtitle || 'Referência'}
                  </Button>
                </Box>
              )}

              <FormattedText
                text={q.enunciado}
                hideInlineImages={Boolean(q.images && q.images.length > 0)}
                sx={{ mb: 2.5, lineHeight: 1.6 }}
              />

              {q.images && q.images.length > 0 && (
                <Box
                  sx={{
                    mb: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    alignItems: 'center',
                  }}
                >
                  {q.images.map((imgUrl, imgIdx) => (
                    <ZoomableImage
                      key={imgIdx}
                      src={imgUrl}
                      alt={`Imagem ${imgIdx + 1} da Questão ${q.identifier}`}
                    />
                  ))}
                </Box>
              )}

              <Stack spacing={1}>
                {q.alternatives.map((alt) => {
                  const isUserSelection = userSelectedId === alt.id;
                  const isCorrectAlt = isAnnulled ? false : (correctAltId ? correctAltId === alt.id : alt.isCorrect);

                  let bgColor = 'transparent';
                  let borderCol = 'divider';

                  if (isAnnulled) {
                    if (isUserSelection) {
                      bgColor = isDark ? 'rgba(255, 152, 0, 0.12)' : 'rgba(255, 152, 0, 0.15)';
                      borderCol = PALETTE_COLORS.warning;
                    }
                  } else if (isCorrectAlt) {
                    bgColor = isDark ? 'rgba(75, 241, 81, 0.12)' : 'rgba(75, 241, 81, 0.15)';
                    borderCol = PALETTE_COLORS.success;
                  } else if (isUserSelection && !isCorrect) {
                    bgColor = isDark ? 'rgba(250, 66, 75, 0.12)' : 'rgba(250, 66, 75, 0.15)';
                    borderCol = PALETTE_COLORS.danger;
                  }

                  return (
                    <Box
                      key={alt.id}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: borderCol,
                        backgroundColor: bgColor,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                      }}
                    >
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: 1,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          backgroundColor: isAnnulled
                            ? isUserSelection
                              ? PALETTE_COLORS.warning
                              : 'divider'
                            : isCorrectAlt
                            ? PALETTE_COLORS.success
                            : isUserSelection
                            ? PALETTE_COLORS.danger
                            : 'divider',
                          color: isAnnulled
                            ? isUserSelection
                              ? '#1a1e24'
                              : 'text.secondary'
                            : isCorrectAlt
                            ? '#0f2910'
                            : isUserSelection
                            ? '#ffffff'
                            : 'text.secondary',
                        }}
                      >
                        {alt.identifier}
                      </Box>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <FormattedText
                          text={alt.text}
                          inline
                          renderInlineImages
                          fontSize="0.875rem"
                          lineHeight={1.5}
                        />
                      </Box>
                      {!isAnnulled && isCorrectAlt && (
                        <Chip size="small" label="Correta" color="success" sx={{ fontWeight: 600 }} />
                      )}
                      {isUserSelection && (
                        <Chip
                          size="small"
                          label={isAnnulled ? 'Sua Escolha (+1 ponto)' : isCorrect ? 'Sua Escolha' : 'Sua Escolha (Incorreta)'}
                          color={isAnnulled ? 'warning' : isCorrect ? 'success' : 'error'}
                          sx={{ fontWeight: 600 }}
                        />
                      )}
                    </Box>
                  );
                })}
              </Stack>
            </Paper>
          );
        })}

        <TextualReferenceDrawer
          open={Boolean(activeDrawerRef)}
          onClose={() => {
            setActiveDrawerRef(null);
            setActiveDrawerQuestionId(undefined);
          }}
          reference={activeDrawerRef}
          questionIdentifier={activeDrawerQuestionId}
        />

        <ShareResultsModal
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          testName={evaluation.name}
          testYear={evaluation.year}
          scorePercentage={result.scorePercentage}
          correctAnswers={result.correctAnswers}
          totalQuestions={result.totalQuestions || evaluation.questions.length}
          timeSpentSeconds={result.timeSpentSeconds || timeSpent}
          questions={evaluation.questions}
          detailedResults={result.detailedResults}
          answers={answers}
        />
      </Box>
    );
  }

  // SCREEN 2: Active Evaluation Screen (Questions + Countdown Timer + Pause Overlay)
  const currentQuestion = evaluation.questions[activeQuestionIndex];
  const isTimeCritical = timerMinutes > 0 && timeRemaining <= 300; // < 5 min
  const isTimeUrgent = timerMinutes > 0 && timeRemaining <= 60; // < 1 min

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', my: 2 }}>
      {/* Sticky Top Timer & Controls Bar */}
      <Paper
        elevation={4}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          position: 'sticky',
          top: 80,
          zIndex: 10,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          backgroundColor: isDark ? '#1a1e24' : '#ffffff',
          border: '1px solid',
          borderColor: isTimeUrgent
            ? PALETTE_COLORS.danger
            : isTimeCritical
            ? PALETTE_COLORS.warning
            : 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleOpenExitDialog}
            sx={{
              fontWeight: 700,
              borderRadius: 2,
              textTransform: 'none',
              borderColor: 'divider',
              color: 'text.secondary',
            }}
          >
            Salvar / Sair
          </Button>

          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />

          <TimerOutlinedIcon
            sx={{
              color: isTimeUrgent
                ? PALETTE_COLORS.danger
                : isTimeCritical
                ? PALETTE_COLORS.warning
                : PALETTE_COLORS.primary,
              fontSize: '1.8rem',
            }}
          />
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              {timerMinutes > 0 ? 'TEMPO RESTANTE' : 'TEMPO DECORRIDO'}
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                fontFamily: 'monospace',
                color: isTimeUrgent
                  ? PALETTE_COLORS.danger
                  : isTimeCritical
                  ? PALETTE_COLORS.warning
                  : 'text.primary',
              }}
            >
              {timerMinutes > 0 ? formatTime(timeRemaining) : formatTime(timeSpent)}
            </Typography>
          </Box>

          <Tooltip title={isPaused ? 'Continuar Simulado (P)' : 'Pausar Simulado (P)'}>
            <IconButton onClick={togglePause} sx={{ ml: 0.5 }}>
              {isPaused ? (
                <PlayCircleOutlineIcon sx={{ color: PALETTE_COLORS.success, fontSize: '2rem' }} />
              ) : (
                <PauseCircleOutlineIcon sx={{ color: 'text.secondary', fontSize: '2rem' }} />
              )}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Question Progress & Submit Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Respondidas: {Object.keys(answers).length} / {evaluation.questions.length}
          </Typography>

          <Button
            variant="contained"
            color="primary"
            onClick={() => setConfirmOpen(true)}
            sx={{ fontWeight: 700, px: 3, borderRadius: 2 }}
          >
            Finalizar Prova
          </Button>
        </Box>
      </Paper>

      {/* Pause Overlay (hides question & alternatives while paused, matching Flashcards) */}
      {isPaused ? (
        <Paper
          elevation={4}
          sx={{
            p: { xs: 4, sm: 6 },
            my: 3,
            borderRadius: 4,
            textAlign: 'center',
            border: '2px dashed',
            borderColor: PALETTE_COLORS.primary,
            backgroundColor: isDark ? 'rgba(217, 183, 99, 0.05)' : 'rgba(217, 183, 99, 0.03)',
            minHeight: { xs: 360, sm: 420 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Stack spacing={2.5} alignItems="center" sx={{ maxWidth: 520 }}>
            <PauseCircleOutlineIcon sx={{ fontSize: 64, color: PALETTE_COLORS.primary }} />
            <Box>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Simulado Pausado
              </Typography>
              <Typography variant="body1" color="text.secondary">
                O cronômetro está parado em{' '}
                <strong>{timerMinutes > 0 ? `${formatTime(timeRemaining)} restantes` : `${formatTime(timeSpent)} decorridos`}</strong>.
                Suas <strong>{Object.keys(answers).length}</strong> respostas preenchidas até agora estão seguras.
              </Typography>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                variant="outlined"
                startIcon={<SaveOutlinedIcon />}
                onClick={handleSaveAndExit}
                disabled={savingExit}
                sx={{ px: 3, py: 1.4, fontWeight: 700, borderRadius: 3, textTransform: 'none' }}
              >
                Salvar e Retomar Depois
              </Button>
              <Button
                variant="contained"
                size="large"
                startIcon={<PlayArrowIcon />}
                onClick={togglePause}
                sx={{
                  px: 4.5,
                  py: 1.4,
                  fontWeight: 800,
                  fontSize: '1.02rem',
                  borderRadius: 3,
                  backgroundColor: PALETTE_COLORS.primary,
                  color: '#1a1e24',
                  '&:hover': { backgroundColor: '#c4a251' },
                }}
              >
                Continuar Simulado (P)
              </Button>
            </Stack>
          </Stack>
        </Paper>
      ) : (
        <>
          {/* Questions Navigator */}
          <TestQuestionsNavigator
            totalQuestions={evaluation.questions.length}
            activeIndex={activeQuestionIndex}
            isQuestionAnswered={(idx) => answers[evaluation.questions[idx].id] !== undefined}
            onSelectQuestion={(idx) => setActiveQuestionIndex(idx)}
            questionIdentifiers={evaluation.questions.map((q) => q.identifier)}
          />

          {/* Active Question Paper */}
          {currentQuestion && (
            <Paper elevation={4} sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    label={`Questão ${activeQuestionIndex + 1} de ${evaluation.questions.length} (#${currentQuestion.identifier})`}
                    sx={{ backgroundColor: PALETTE_COLORS.primary, color: '#1a1e24', fontWeight: 700 }}
                  />
                  {currentQuestion.originName && (
                    <Chip label={currentQuestion.originName} size="small" variant="outlined" />
                  )}
                </Stack>

                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <KeyboardIcon fontSize="small" /> Atalho: <kbd style={{ padding: '1px 5px', background: isDark ? '#333' : '#eee', borderRadius: '4px' }}>P</kbd> pausar
                </Typography>
              </Box>

              {currentQuestion.textualReference && (
                <Paper
                  elevation={0}
                  onClick={() => {
                    setActiveDrawerRef(currentQuestion.textualReference!);
                    setActiveDrawerQuestionId(currentQuestion.identifier);
                  }}
                  sx={{
                    p: 1.5,
                    px: 2,
                    mb: 2.5,
                    borderRadius: 2,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1.5,
                    border: '1.5px solid',
                    borderColor: PALETTE_COLORS.primary,
                    backgroundColor: isDark ? 'rgba(217, 183, 99, 0.1)' : 'rgba(217, 183, 99, 0.08)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: isDark ? 'rgba(217, 183, 99, 0.18)' : 'rgba(217, 183, 99, 0.15)',
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <MenuBookIcon sx={{ color: PALETTE_COLORS.primary, fontSize: '1.4rem' }} />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                        Texto de Apoio: {currentQuestion.textualReference.title || currentQuestion.textualReference.subtitle || 'Referência Textual'}
                      </Typography>
                      {currentQuestion.textualReference.subtitle && currentQuestion.textualReference.title && (
                        <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary', display: 'block' }}>
                          {currentQuestion.textualReference.subtitle}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<BorderColorIcon sx={{ fontSize: '0.9rem' }} />}
                    sx={{
                      backgroundColor: PALETTE_COLORS.primary,
                      color: '#1a1e24',
                      fontWeight: 700,
                      textTransform: 'none',
                      borderRadius: '6px',
                      px: 1.8,
                      py: 0.6,
                    }}
                  >
                    Abrir no Drawer Lateral (Anotações)
                  </Button>
                </Paper>
              )}

              <FormattedText
                text={currentQuestion.enunciado}
                hideInlineImages={Boolean(currentQuestion.images && currentQuestion.images.length > 0)}
                sx={{ fontSize: '1.05rem', lineHeight: 1.7, mb: 2.5 }}
              />

              {currentQuestion.images && currentQuestion.images.length > 0 && (
                <Box
                  sx={{
                    mb: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    alignItems: 'center',
                  }}
                >
                  {currentQuestion.images.map((imgUrl, imgIdx) => (
                    <ZoomableImage
                      key={imgIdx}
                      src={imgUrl}
                      alt={`Imagem ${imgIdx + 1} da Questão ${currentQuestion.identifier}`}
                    />
                  ))}
                </Box>
              )}

              <Divider sx={{ mb: 2.5 }} />

              <Stack spacing={1.5} sx={{ mb: 3 }}>
                {currentQuestion.alternatives.map((alt) => {
                  const isSelected = answers[currentQuestion.id] === alt.id;

                  return (
                    <Box
                      key={alt.id ?? alt.identifier}
                      onClick={() => handleSelectAlternative(currentQuestion.id, alt.id!)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: 1.5,
                        px: 2,
                        borderRadius: 2.5,
                        border: '1.5px solid',
                        borderColor: isSelected ? PALETTE_COLORS.primary : 'divider',
                        backgroundColor: isSelected
                          ? isDark
                            ? 'rgba(217, 183, 99, 0.1)'
                            : 'rgba(217, 183, 99, 0.12)'
                          : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease-in-out',
                        '&:hover': {
                          borderColor: PALETTE_COLORS.primary,
                        },
                      }}
                    >
                      <Radio
                        checked={isSelected}
                        size="small"
                        sx={{
                          mr: 1,
                          '&.Mui-checked': { color: PALETTE_COLORS.primary },
                        }}
                      />
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: 1.5,
                          backgroundColor: isSelected ? PALETTE_COLORS.primary : 'divider',
                          color: isSelected ? '#1a1e24' : 'text.primary',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                          flexShrink: 0,
                        }}
                      >
                        {alt.identifier}
                      </Box>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <FormattedText
                          text={alt.text}
                          inline
                          renderInlineImages
                          fontSize="0.95rem"
                          lineHeight={1.5}
                        />
                      </Box>
                    </Box>
                  );
                })}
              </Stack>

              {/* Question Navigation Next / Prev */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                  disabled={activeQuestionIndex === 0}
                  onClick={() => setActiveQuestionIndex((prev) => prev - 1)}
                  sx={{ fontWeight: 600 }}
                >
                  Questão Anterior
                </Button>
                <Button
                  disabled={activeQuestionIndex === evaluation.questions.length - 1}
                  variant="outlined"
                  onClick={() => setActiveQuestionIndex((prev) => prev + 1)}
                  sx={{ fontWeight: 600 }}
                >
                  Próxima Questão
                </Button>
              </Box>
            </Paper>
          )}

          {/* Lousa de Raciocínio da Questão Atual no Simulado */}
          {currentQuestion && (
            <Box sx={{ mt: 3, mb: 4 }}>
              <QuestionWhiteboard
                key={currentQuestion.id}
                questionId={currentQuestion.id}
              />
            </Box>
          )}
        </>
      )}

      {/* Exit / Save for Later Dialog */}
      <Dialog
        open={exitDialogOpen}
        onClose={() => {
          setExitDialogOpen(false);
          startTimeRef.current = Date.now() - timeSpentRef.current * 1000;
          setIsPaused(false);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Sair do Simulado?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.secondary', mb: 2 }}>
            Você marcou <strong>{Object.keys(answers).length}</strong> de{' '}
            <strong>{evaluation.questions.length}</strong> questões ({formatTime(timeSpent)} decorridos).
            {user?.id
              ? ' Ao clicar em Salvar e Sair, todo o seu progresso e tempo ficam gravados na sua conta para retomar de onde parou em qualquer dispositivo.'
              : ' Seu progresso ficará salvo neste navegador para você retomar depois.'}
          </DialogContentText>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            As estatísticas oficiais da prova só serão contabilizadas quando você finalizar o simulado.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Button
            color="error"
            startIcon={<DeleteOutlineIcon />}
            onClick={handleDiscardSession}
            disabled={savingExit}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Descartar Simulado
          </Button>

          <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
            <Button
              variant="outlined"
              onClick={() => {
                setExitDialogOpen(false);
                startTimeRef.current = Date.now() - timeSpentRef.current * 1000;
                setIsPaused(false);
              }}
              disabled={savingExit}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
            >
              Continuar Respondendo
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveAndExit}
              disabled={savingExit}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2,
                backgroundColor: PALETTE_COLORS.primary,
                color: '#1a1e24',
                '&:hover': { backgroundColor: '#c4a251' },
              }}
            >
              {savingExit ? 'Salvando...' : 'Salvar e Sair'}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>

      {/* Final Submit Confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Finalizar Avaliação?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Você respondeu {Object.keys(answers).length} de {evaluation.questions.length} questões.
            {Object.keys(answers).length < evaluation.questions.length && (
              <Box component="span" sx={{ color: PALETTE_COLORS.danger, display: 'block', mt: 1, fontWeight: 600 }}>
                Atenção: Existem questões em branco que serão contabilizadas como incorretas.
              </Box>
            )}
            Deseja submeter suas respostas agora?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} sx={{ color: 'text.secondary' }}>
            Continuar Respondendo
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleFinalSubmit()}
            disabled={submitting}
            sx={{ fontWeight: 700 }}
          >
            {submitting ? 'Enviando...' : 'Confirmar e Finalizar'}
          </Button>
        </DialogActions>
      </Dialog>

      <TextualReferenceDrawer
        open={Boolean(activeDrawerRef)}
        onClose={() => {
          setActiveDrawerRef(null);
          setActiveDrawerQuestionId(undefined);
        }}
        reference={activeDrawerRef}
        questionIdentifier={activeDrawerQuestionId}
      />
    </Box>
  );
};
