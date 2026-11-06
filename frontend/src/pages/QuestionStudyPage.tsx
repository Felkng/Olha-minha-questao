import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Stack,
  Chip,
  LinearProgress,
  Divider,
  Grid,
  Skeleton,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Radio,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import CancelIcon from '@mui/icons-material/Cancel';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import ReplayIcon from '@mui/icons-material/Replay';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import BorderColorIcon from '@mui/icons-material/BorderColor';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  Question,
  QuestionSessionItemStatus,
  TextualReference,
} from '../types';
import {
  getQuestions,
  getQuestionsInFolder,
  getQuestionSession,
  createQuestionSession,
  updateQuestionSession,
  deleteQuestionSession,
  submitQuestionAttempt,
} from '../services/api';
import { PALETTE_COLORS } from '../theme/theme';
import { useAppTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { FormattedText } from '../components/common/FormattedText';
import { ZoomableImage } from '../components/common/ZoomableImage';
import { TextualReferenceDrawer } from '../components/questions/TextualReferenceDrawer';
import { QuestionWhiteboard } from '../components/whiteboard/QuestionWhiteboard';

interface QuestionStudyPageProps {
  onBookmarkClick?: (question: Question) => void;
}

interface SessionResultEntry {
  question: Question;
  selectedAlternativeId?: number;
  status: QuestionSessionItemStatus;
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const formatSeconds = (seconds: number): string => {
  const safe = Math.max(0, seconds || 0);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours}h ${remMins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const QuestionStudyPage: React.FC<QuestionStudyPageProps> = ({
  onBookmarkClick,
}) => {
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, markQuestionAttempted } = useAuth();

  const sessionIdParam = searchParams.get('sessionId');
  const folderIdParam = searchParams.get('folderId');
  const originIdParam = searchParams.get('originId');
  const areaIdParam = searchParams.get('areaId');
  const subjectIdParam = searchParams.get('subjectId');
  const testIdParam = searchParams.get('testId');
  const yearParam = searchParams.get('year');
  const difficultyParam = searchParams.get('difficulty');
  const searchParam = searchParams.get('search');
  const standaloneParam = searchParams.get('standaloneOnly') === 'true';
  const shuffleParam = searchParams.get('shuffle') === 'true' || searchParams.get('random') === 'true';
  const titleParam = searchParams.get('title');
  const limitParam = searchParams.get('limit') ? Number(searchParams.get('limit')) : 100;

  const folderId = folderIdParam ? Number(folderIdParam) : undefined;
  const originId = originIdParam ? Number(originIdParam) : undefined;
  const areaId = areaIdParam ? Number(areaIdParam) : undefined;
  const subjectId = subjectIdParam ? Number(subjectIdParam) : undefined;

  const stateFrom = (location.state as { from?: string; fromTitle?: string } | null)?.from;
  const stateFromTitle = (location.state as { from?: string; fromTitle?: string } | null)?.fromTitle;

  const handleBack = () => {
    if (stateFrom) {
      navigate(stateFrom);
    } else if (folderIdParam) {
      navigate(`/pastas/${folderIdParam}`);
    } else {
      navigate('/questoes');
    }
  };

  const backLabel =
    stateFromTitle ||
    (folderIdParam ? 'Voltar para a Pasta' : 'Voltar para Questões');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [originalQuestions, setOriginalQuestions] = useState<Question[]>([]);
  const [isRandomMode, setIsRandomMode] = useState<boolean>(shuffleParam);
  const [sessionTitle, setSessionTitle] = useState<string>(titleParam || '');
  const [loading, setLoading] = useState<boolean>(true);

  const [activeSessionId, setActiveSessionId] = useState<number | null>(
    sessionIdParam ? Number(sessionIdParam) : null
  );

  // Timer & Pause state
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const startTimeRef = useRef<number>(Date.now());
  const elapsedRef = useRef<number>(0);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Active question resolution state
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAlternativeId, setSelectedAlternativeId] = useState<number | null>(null);
  const [isCurrentVerified, setIsCurrentVerified] = useState<boolean>(false);
  const [sessionResults, setSessionResults] = useState<SessionResultEntry[]>([]);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [submittingSession, setSubmittingSession] = useState<boolean>(false);

  // Drawer & Exit Dialog
  const [activeDrawerRef, setActiveDrawerRef] = useState<TextualReference | null>(null);
  const [activeDrawerQuestionId, setActiveDrawerQuestionId] = useState<string | undefined>(undefined);
  const [exitDialogOpen, setExitDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    elapsedRef.current = elapsedSeconds;
  }, [elapsedSeconds]);

  const persistProgress = useCallback(
    async (
      resultsToSave: SessionResultEntry[],
      qList: Question[],
      seconds: number,
      completed: boolean
    ) => {
      if (!user?.id || qList.length === 0) return;

      const payload = {
        folderId,
        originId,
        areaId,
        subjectId,
        title:
          sessionTitle ||
          (standaloneParam ? 'Questões Avulsas' : undefined),
        questionIds: qList.map((q) => q.id),
        totalQuestions: qList.length,
        timeSpentSeconds: seconds,
        completed,
        items: resultsToSave.map((r) => ({
          questionId: r.question.id,
          selectedAlternativeId: r.selectedAlternativeId,
          status: r.status,
        })),
      };

      try {
        if (activeSessionId) {
          await updateQuestionSession(activeSessionId, payload);
        } else {
          const created = await createQuestionSession(payload);
          setActiveSessionId(created.id);
          const nextParams = new URLSearchParams(searchParams);
          nextParams.set('sessionId', String(created.id));
          setSearchParams(nextParams, { replace: true });
        }
        window.dispatchEvent(new Event('omq_session_updated'));
      } catch (err) {
        console.error('Erro ao persistir sessão de estudo de questões:', err);
      }
    },
    [
      user?.id,
      folderId,
      originId,
      areaId,
      subjectId,
      sessionTitle,
      standaloneParam,
      activeSessionId,
      searchParams,
      setSearchParams,
    ]
  );

  const togglePause = useCallback(() => {
    setIsPaused((prev) => {
      const next = !prev;
      if (next) {
        const cur = Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000));
        setElapsedSeconds(cur);
        elapsedRef.current = cur;
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        if (user?.id && questions.length > 0) {
          persistProgress(sessionResults, questions, cur, false);
        }
      } else {
        startTimeRef.current = Date.now() - elapsedRef.current * 1000;
      }
      return next;
    });
  }, [user?.id, questions, sessionResults, persistProgress]);

  // Timer tick
  useEffect(() => {
    if (!loading && !isFinished && !isPaused && questions.length > 0) {
      startTimeRef.current = Date.now() - elapsedRef.current * 1000;
      timerIntervalRef.current = setInterval(() => {
        const nextSec = Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000));
        setElapsedSeconds(nextSec);
        elapsedRef.current = nextSec;
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [loading, isFinished, isPaused, questions.length]);

  // Periodic background checkpoint every 20s when active session exists
  useEffect(() => {
    if (!user?.id || !activeSessionId || isPaused || isFinished || loading || questions.length === 0) {
      return;
    }
    const iv = setInterval(() => {
      persistProgress(sessionResults, questions, elapsedRef.current, false);
    }, 20000);
    return () => clearInterval(iv);
  }, [user?.id, activeSessionId, isPaused, isFinished, loading, questions, sessionResults, persistProgress]);

  const loadStudyQuestions = async () => {
    setLoading(true);
    try {
      if (sessionIdParam) {
        const session = await getQuestionSession(Number(sessionIdParam));
        setActiveSessionId(session.id);
        if (session.title) setSessionTitle(session.title);
        const savedSecs = session.timeSpentSeconds || 0;
        setElapsedSeconds(savedSecs);
        elapsedRef.current = savedSecs;
        startTimeRef.current = Date.now() - savedSecs * 1000;

        let fetched: Question[] = [];
        if (session.questionIds && session.questionIds.length > 0) {
          const res = await getQuestions({
            ids: session.questionIds,
            size: Math.max(session.questionIds.length, 100),
          });
          const qMap = new Map(res.content.map((q) => [q.id, q]));
          fetched = session.questionIds
            .map((idVal) => qMap.get(idVal))
            .filter(Boolean) as Question[];
        } else if (session.folderId) {
          fetched = await getQuestionsInFolder(session.folderId);
        } else {
          const res = await getQuestions({
            originId: session.originId ?? '',
            areaId: session.areaId ?? '',
            subjectId: session.subjectId ?? '',
            size: 100,
          });
          fetched = res.content;
        }

        setOriginalQuestions(fetched);
        setQuestions(fetched);

        const qMap = new Map(fetched.map((q) => [q.id, q]));
        const restored: SessionResultEntry[] = (session.items || []).map((item) => {
          const qObj =
            qMap.get(item.questionId) ||
            ({
              id: item.questionId,
              identifier: item.questionIdentifier || String(item.questionId),
              enunciado: item.questionEnunciado || '',
              areaName: item.areaName,
              subjectName: item.subjectName,
              alternatives: [],
            } as Question);
          return {
            question: qObj,
            selectedAlternativeId: item.selectedAlternativeId,
            status: item.status,
          };
        });

        setSessionResults(restored);
        const nextIdx = restored.length;
        setCurrentIndex(nextIdx);
        setSelectedAlternativeId(null);
        setIsCurrentVerified(false);
        if (session.completed || (nextIdx >= fetched.length && fetched.length > 0)) {
          setIsFinished(true);
        }
      } else {
        let fetched: Question[] = [];
        if (folderId) {
          fetched = await getQuestionsInFolder(folderId);
        } else {
          const res = await getQuestions({
            originId: originId ?? '',
            areaId: areaId ?? '',
            subjectId: subjectId ?? '',
            testId: testIdParam ? Number(testIdParam) : '',
            year: yearParam ? Number(yearParam) : '',
            difficulty: difficultyParam || undefined,
            standaloneOnly: standaloneParam || undefined,
            search: searchParam || undefined,
            size: Math.min(Math.max(limitParam || 100, 1), 300),
          });
          fetched = res.content;
        }
        setOriginalQuestions(fetched);
        const finalOrder = shuffleParam ? shuffleArray(fetched) : fetched;
        setQuestions(finalOrder);
        setCurrentIndex(0);
        setSelectedAlternativeId(null);
        setIsCurrentVerified(false);
        setSessionResults([]);
        setIsFinished(false);
      }
    } catch (err) {
      console.error('Erro ao carregar questões para sessão de estudo:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudyQuestions();
  }, [
    sessionIdParam,
    folderIdParam,
    originIdParam,
    areaIdParam,
    subjectIdParam,
    testIdParam,
    yearParam,
    difficultyParam,
    standaloneParam,
    searchParam,
  ]);

  const toggleRandomMode = () => {
    const nextRandom = !isRandomMode;
    setIsRandomMode(nextRandom);

    const newParams = new URLSearchParams(searchParams);
    if (nextRandom) {
      newParams.set('shuffle', 'true');
    } else {
      newParams.delete('shuffle');
      newParams.delete('random');
    }
    newParams.delete('sessionId');
    setSearchParams(newParams, { replace: true });

    const base = originalQuestions.length > 0 ? originalQuestions : questions;
    const reordered = nextRandom ? shuffleArray(base) : base;
    setQuestions(reordered);
    setActiveSessionId(null);
    setCurrentIndex(0);
    setSelectedAlternativeId(null);
    setIsCurrentVerified(false);
    setSessionResults([]);
    setIsFinished(false);
    setElapsedSeconds(0);
    elapsedRef.current = 0;
    startTimeRef.current = Date.now();
  };

  const currentQuestion = questions[currentIndex];

  const isAnnulled = Boolean(
    currentQuestion?.alternatives &&
      currentQuestion.alternatives.length > 0 &&
      currentQuestion.alternatives.every((a) => a.isCorrect)
  );

  const isSelectedCorrect = Boolean(
    isAnnulled ||
      (selectedAlternativeId &&
        currentQuestion?.alternatives.find((a) => a.id === selectedAlternativeId)?.isCorrect)
  );

  const handleVerifyAnswer = async () => {
    if (!currentQuestion || selectedAlternativeId === null || isCurrentVerified || isPaused) return;

    setIsCurrentVerified(true);
    const status: QuestionSessionItemStatus = isSelectedCorrect ? 'CORRECT' : 'WRONG';
    const updatedResults: SessionResultEntry[] = [
      ...sessionResults,
      {
        question: currentQuestion,
        selectedAlternativeId,
        status,
      },
    ];
    setSessionResults(updatedResults);

    const currentSeconds = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));
    setElapsedSeconds(currentSeconds);
    elapsedRef.current = currentSeconds;

    // Record individual question attempt statistics
    try {
      await submitQuestionAttempt(currentQuestion.id, {
        selectedAlternativeId,
        isFirstAttempt: true,
        timeSpentSeconds: Math.max(1, Math.round(currentSeconds / Math.max(updatedResults.length, 1))),
        sessionId: activeSessionId ? `qsession-${activeSessionId}` : `qsession-local-${Date.now()}`,
      });
      markQuestionAttempted(currentQuestion.id);
    } catch (err) {
      console.warn('Erro ao registrar tentativa individual da questão:', err);
    }

    // Persist session progress immediately (completed only when user finishes last question)
    await persistProgress(updatedResults, questions, currentSeconds, false);
  };

  const handleAdvanceAfterVerify = async () => {
    const isLast = currentIndex + 1 >= questions.length;
    if (!isLast) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAlternativeId(null);
      setIsCurrentVerified(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      await finishSession(sessionResults);
    }
  };

  const handleSkipQuestion = async () => {
    if (!currentQuestion || isPaused) return;

    const updatedResults: SessionResultEntry[] = isCurrentVerified
      ? sessionResults
      : [
          ...sessionResults,
          {
            question: currentQuestion,
            status: 'SKIPPED',
          },
        ];

    if (!isCurrentVerified) {
      setSessionResults(updatedResults);
    }

    const isLast = currentIndex + 1 >= questions.length;
    const currentSeconds = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));
    setElapsedSeconds(currentSeconds);
    elapsedRef.current = currentSeconds;

    if (!isLast) {
      await persistProgress(updatedResults, questions, currentSeconds, false);
      setCurrentIndex((prev) => prev + 1);
      setSelectedAlternativeId(null);
      setIsCurrentVerified(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      await finishSession(updatedResults, currentSeconds);
    }
  };

  const finishSession = async (
    finalResults: SessionResultEntry[],
    overrideSeconds?: number
  ) => {
    setIsFinished(true);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    const finalSecs =
      overrideSeconds ?? Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));
    setElapsedSeconds(finalSecs);
    elapsedRef.current = finalSecs;

    if (user?.id && questions.length > 0) {
      setSubmittingSession(true);
      try {
        await persistProgress(finalResults, questions, finalSecs, true);
      } finally {
        setSubmittingSession(false);
      }
    }
  };

  const handleExitRequest = () => {
    if (isFinished || questions.length === 0) {
      handleBack();
      return;
    }
    if (!isPaused) {
      const cur = Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000));
      setElapsedSeconds(cur);
      elapsedRef.current = cur;
      setIsPaused(true);
    }
    setExitDialogOpen(true);
  };

  const handleConfirmSaveAndExit = async () => {
    const currentSeconds = Math.max(1, elapsedRef.current);
    if (user?.id && questions.length > 0) {
      await persistProgress(sessionResults, questions, currentSeconds, false);
    }
    setExitDialogOpen(false);
    handleBack();
  };

  const handleDiscardSession = async () => {
    if (activeSessionId && user?.id) {
      try {
        await deleteQuestionSession(activeSessionId);
        window.dispatchEvent(new Event('omq_session_updated'));
      } catch (err) {
        console.error('Erro ao descartar sessão de estudo:', err);
      }
    }
    setExitDialogOpen(false);
    handleBack();
  };

  // Keyboard shortcuts: P to pause, Enter to verify/advance
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isFinished || !currentQuestion || exitDialogOpen) return;
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
        return;
      }

      if (isPaused) return;

      if (e.key === 'Enter') {
        if (!isCurrentVerified && selectedAlternativeId !== null) {
          e.preventDefault();
          handleVerifyAnswer();
        } else if (isCurrentVerified) {
          e.preventDefault();
          handleAdvanceAfterVerify();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    isFinished,
    currentQuestion,
    exitDialogOpen,
    isPaused,
    isCurrentVerified,
    selectedAlternativeId,
    togglePause,
  ]);

  const handleRestartFull = () => {
    const base = originalQuestions.length > 0 ? originalQuestions : questions;
    setQuestions(isRandomMode ? shuffleArray(base) : base);
    setActiveSessionId(null);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('sessionId');
    setSearchParams(nextParams, { replace: true });
    setElapsedSeconds(0);
    elapsedRef.current = 0;
    startTimeRef.current = Date.now();
    setCurrentIndex(0);
    setSelectedAlternativeId(null);
    setIsCurrentVerified(false);
    setSessionResults([]);
    setIsFinished(false);
  };

  const handleReviewMissed = () => {
    const missed = sessionResults
      .filter((r) => r.status === 'WRONG')
      .map((r) => r.question);
    if (missed.length === 0) return;

    setQuestions(isRandomMode ? shuffleArray(missed) : missed);
    setActiveSessionId(null);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('sessionId');
    setSearchParams(nextParams, { replace: true });
    setElapsedSeconds(0);
    elapsedRef.current = 0;
    startTimeRef.current = Date.now();
    setCurrentIndex(0);
    setSelectedAlternativeId(null);
    setIsCurrentVerified(false);
    setSessionResults([]);
    setIsFinished(false);
  };

  if (loading) {
    return (
      <Box sx={{ mb: 6, maxWidth: 920, mx: 'auto' }}>
        <Skeleton variant="rounded" width={180} height={36} sx={{ mb: 3, borderRadius: 2 }} />
        <Paper elevation={4} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, mb: 3 }}>
          <Skeleton variant="rounded" height={8} sx={{ borderRadius: 4, mb: 4 }} />
          <Skeleton variant="text" width="90%" height={28} />
          <Skeleton variant="text" width="80%" height={28} />
          <Skeleton variant="text" width="60%" height={28} sx={{ mb: 3 }} />
          <Stack spacing={1.5}>
            <Skeleton variant="rounded" height={52} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rounded" height={52} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rounded" height={52} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rounded" height={52} sx={{ borderRadius: 2 }} />
          </Stack>
        </Paper>
      </Box>
    );
  }

  if (questions.length === 0) {
    return (
      <Box sx={{ mb: 6, maxWidth: 850, mx: 'auto', textAlign: 'center', py: 6 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 3, color: 'text.secondary', fontWeight: 600 }}
        >
          {backLabel}
        </Button>
        <Paper elevation={4} sx={{ p: 6, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Nenhuma questão encontrada para esta sessão de estudo
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Ajuste os filtros selecionados ou cadastre novas questões para iniciar a prática.
          </Typography>
          <Button
            variant="contained"
            onClick={handleBack}
            sx={{ fontWeight: 700, backgroundColor: PALETTE_COLORS.primary, color: '#1a1e24' }}
          >
            {backLabel}
          </Button>
        </Paper>
      </Box>
    );
  }

  // Summary / Finish Screen
  if (isFinished) {
    const total = sessionResults.length;
    const correctCount = sessionResults.filter((r) => r.status === 'CORRECT').length;
    const wrongCount = sessionResults.filter((r) => r.status === 'WRONG').length;
    const skippedCount = sessionResults.filter((r) => r.status === 'SKIPPED').length;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    return (
      <Box sx={{ maxWidth: 920, mx: 'auto', mb: 6 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 3, color: 'text.secondary', fontWeight: 600 }}
        >
          {backLabel}
        </Button>

        <Paper
          elevation={6}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            textAlign: 'center',
            mb: 4,
          }}
        >
          <EmojiEventsIcon
            sx={{
              fontSize: 64,
              color: accuracy >= 70 ? PALETTE_COLORS.primary : PALETTE_COLORS.secondary,
              mb: 1.5,
            }}
          />
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Sessão de Estudo Concluída!
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: submittingSession ? 1 : 4 }}>
            Você concluiu a prática de <strong>{total}</strong> questões nesta sessão.
          </Typography>
          {submittingSession && (
            <Typography variant="caption" sx={{ color: PALETTE_COLORS.primary, fontWeight: 700, display: 'block', mb: 3 }}>
              Salvando estatísticas da sua sessão...
            </Typography>
          )}

          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={6} sm={2.4}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: PALETTE_COLORS.primary,
                  backgroundColor: isDark ? 'rgba(217, 183, 99, 0.08)' : 'rgba(217, 183, 99, 0.1)',
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 800, color: PALETTE_COLORS.primary }}>
                  {formatSeconds(elapsedSeconds)}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                  TEMPO TOTAL
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={6} sm={2.4}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 800, color: PALETTE_COLORS.primary }}>
                  {accuracy}%
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                  APROVEITAMENTO
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={4} sm={2.4}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: PALETTE_COLORS.success,
                  backgroundColor: isDark ? 'rgba(75, 241, 81, 0.08)' : 'rgba(75, 241, 81, 0.1)',
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 800, color: PALETTE_COLORS.success }}>
                  {correctCount}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: PALETTE_COLORS.success }}>
                  ACERTOS
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={4} sm={2.4}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: PALETTE_COLORS.danger,
                  backgroundColor: isDark ? 'rgba(250, 66, 75, 0.08)' : 'rgba(250, 66, 75, 0.1)',
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 800, color: PALETTE_COLORS.danger }}>
                  {wrongCount}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: PALETTE_COLORS.danger }}>
                  ERROS
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={4} sm={2.4}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                  {skippedCount}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                  PULADAS
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
            sx={{ mb: 2 }}
          >
            {wrongCount > 0 && (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<ReplayIcon />}
                onClick={handleReviewMissed}
                sx={{ fontWeight: 700, borderRadius: 2 }}
              >
                Refazer as que Errei ({wrongCount})
              </Button>
            )}

            <Button
              variant="outlined"
              startIcon={<ReplayIcon />}
              onClick={handleRestartFull}
              sx={{ fontWeight: 700, borderRadius: 2 }}
            >
              Refazer Sessão Completa
            </Button>

            <Button
              variant="contained"
              onClick={handleBack}
              sx={{ fontWeight: 700, borderRadius: 2, backgroundColor: PALETTE_COLORS.primary, color: '#1a1e24' }}
            >
              Finalizar Estudo
            </Button>
          </Stack>
        </Paper>

        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
          Revisão das Questões Praticadas:
        </Typography>

        <Stack spacing={2.5}>
          {sessionResults.map(({ question: q, selectedAlternativeId: selId, status }, idx) => {
            const correctAlt = q.alternatives?.find((a) => a.isCorrect);
            const selectedAlt = q.alternatives?.find((a) => a.id === selId);

            return (
              <Paper
                key={`${q.id}_${idx}`}
                elevation={2}
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  borderLeft: `6px solid ${
                    status === 'CORRECT'
                      ? PALETTE_COLORS.success
                      : status === 'WRONG'
                      ? PALETTE_COLORS.danger
                      : 'gray'
                  }`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      #{idx + 1} • Questão {q.identifier}
                    </Typography>
                    {q.originName && <Chip size="small" label={q.originName} variant="outlined" />}
                    {q.areaName && <Chip size="small" label={q.areaName} />}
                  </Stack>

                  <Chip
                    size="small"
                    label={
                      status === 'CORRECT'
                        ? 'Acerto'
                        : status === 'WRONG'
                        ? 'Erro'
                        : 'Pulada'
                    }
                    sx={{
                      fontWeight: 700,
                      backgroundColor:
                        status === 'CORRECT'
                          ? `${PALETTE_COLORS.success}20`
                          : status === 'WRONG'
                          ? `${PALETTE_COLORS.danger}20`
                          : 'rgba(128,128,128,0.15)',
                      color:
                        status === 'CORRECT'
                          ? PALETTE_COLORS.success
                          : status === 'WRONG'
                          ? PALETTE_COLORS.danger
                          : 'text.secondary',
                    }}
                  />
                </Box>

                <FormattedText
                  text={q.enunciado}
                  hideInlineImages={Boolean(q.images && q.images.length > 0)}
                  fontSize="0.96rem"
                  sx={{ mb: 1.5 }}
                />

                {(selectedAlt || correctAlt) && (
                  <>
                    <Divider sx={{ my: 1.2 }} />
                    <Stack spacing={0.5}>
                      {selectedAlt && (
                        <Typography variant="body2" sx={{ color: status === 'CORRECT' ? PALETTE_COLORS.success : PALETTE_COLORS.danger, fontWeight: 600 }}>
                          Sua resposta: ({selectedAlt.identifier}){' '}
                          <FormattedText text={selectedAlt.text} inline fontSize="0.875rem" />
                        </Typography>
                      )}
                      {correctAlt && status !== 'CORRECT' && (
                        <Typography variant="body2" sx={{ color: PALETTE_COLORS.success, fontWeight: 600 }}>
                          Gabarito: ({correctAlt.identifier}){' '}
                          <FormattedText text={correctAlt.text} inline fontSize="0.875rem" />
                        </Typography>
                      )}
                    </Stack>
                  </>
                )}
              </Paper>
            );
          })}
        </Stack>
      </Box>
    );
  }

  const progressPercentage = ((currentIndex + (isCurrentVerified ? 1 : 0)) / questions.length) * 100;
  const currentCorrect = sessionResults.filter((r) => r.status === 'CORRECT').length;
  const currentWrong = sessionResults.filter((r) => r.status === 'WRONG').length;
  const currentSkipped = sessionResults.filter((r) => r.status === 'SKIPPED').length;

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', mb: 6 }}>
      {/* Top Session Controls & Timer */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleExitRequest}
            sx={{ color: 'text.secondary', fontWeight: 600 }}
          >
            Salvar / Sair do Estudo
          </Button>

          <Tooltip title={isRandomMode ? 'Modo aleatório ativado. Clique para ordem original' : 'Embaralhar ordem das questões'}>
            <Button
              size="small"
              variant={isRandomMode ? 'contained' : 'outlined'}
              startIcon={<ShuffleIcon />}
              onClick={toggleRandomMode}
              sx={{
                borderRadius: 2,
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.82rem',
                borderColor: 'divider',
                ...(isRandomMode
                  ? { backgroundColor: PALETTE_COLORS.primary, color: '#1a1e24' }
                  : { color: 'text.secondary' }),
              }}
            >
              Aleatório: {isRandomMode ? 'Ativo' : 'Inativo'}
            </Button>
          </Tooltip>
        </Stack>

        <Stack direction="row" spacing={1.2} alignItems="center" flexWrap="wrap">
          <Chip
            size="small"
            icon={<AccessTimeIcon fontSize="small" sx={{ color: `${PALETTE_COLORS.primary} !important` }} />}
            label={formatSeconds(elapsedSeconds)}
            sx={{
              fontWeight: 700,
              fontFamily: 'monospace',
              fontSize: '0.88rem',
              backgroundColor: isDark ? 'rgba(217, 183, 99, 0.12)' : 'rgba(217, 183, 99, 0.16)',
              color: PALETTE_COLORS.primary,
            }}
          />

          <Tooltip title={isPaused ? 'Continuar Estudo (P)' : 'Pausar Cronômetro (P)'}>
            <IconButton
              size="small"
              onClick={togglePause}
              sx={{
                color: isPaused ? PALETTE_COLORS.success : 'text.secondary',
                border: '1px solid',
                borderColor: isPaused ? PALETTE_COLORS.success : 'divider',
                backgroundColor: isPaused
                  ? isDark
                    ? 'rgba(75, 241, 81, 0.15)'
                    : 'rgba(75, 241, 81, 0.1)'
                  : 'transparent',
              }}
            >
              {isPaused ? <PlayArrowIcon fontSize="small" /> : <PauseIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          <Chip
            size="small"
            icon={<CheckCircleIcon style={{ color: PALETTE_COLORS.success }} />}
            label={`${currentCorrect}`}
            title="Acertos"
            sx={{ fontWeight: 700, backgroundColor: 'transparent' }}
          />
          <Chip
            size="small"
            icon={<CancelIcon style={{ color: PALETTE_COLORS.danger }} />}
            label={`${currentWrong}`}
            title="Erros"
            sx={{ fontWeight: 700, backgroundColor: 'transparent' }}
          />
          {currentSkipped > 0 && (
            <Chip
              size="small"
              icon={<SkipNextIcon />}
              label={`${currentSkipped}`}
              title="Puladas"
              sx={{ fontWeight: 700, backgroundColor: 'transparent', color: 'text.secondary' }}
            />
          )}
        </Stack>
      </Box>

      {/* Progress Bar */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
            QUESTÃO {currentIndex + 1} DE {questions.length}
            {standaloneParam ? ' • APENAS AVULSAS' : ''}
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, color: PALETTE_COLORS.primary }}>
            {Math.round(progressPercentage)}% concluído
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progressPercentage}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: PALETTE_COLORS.primary,
              borderRadius: 4,
            },
          }}
        />
      </Box>

      {/* Pause Overlay OR Active Question */}
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
            minHeight: { xs: 360, sm: 400 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Stack spacing={2.5} alignItems="center" sx={{ maxWidth: 480 }}>
            <PauseCircleOutlineIcon sx={{ fontSize: 64, color: PALETTE_COLORS.primary }} />
            <Box>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Estudo de Questões Pausado
              </Typography>
              <Typography variant="body1" color="text.secondary">
                O contador está pausado em <strong>{formatSeconds(elapsedSeconds)}</strong>. Seu progresso até aqui já está salvo para retomar quando quiser.
              </Typography>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button
                variant="outlined"
                onClick={handleConfirmSaveAndExit}
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
                Continuar Estudo (P)
              </Button>
            </Stack>
          </Stack>
        </Paper>
      ) : currentQuestion ? (
        <>
          <Paper elevation={4} sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3, mb: 3 }}>
            {/* Question Metadata Header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1,
                mb: 2,
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ gap: 0.8 }}>
                <Chip
                  label={`Questão ${currentQuestion.identifier}`}
                  sx={{
                    backgroundColor: PALETTE_COLORS.primary,
                    color: '#1a1e24',
                    fontWeight: 700,
                  }}
                />
                {isAnnulled && (
                  <Chip
                    size="small"
                    label="Anulada"
                    color="warning"
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                  />
                )}
                {currentQuestion.originName && (
                  <Chip
                    size="small"
                    label={currentQuestion.originName}
                    variant="outlined"
                    sx={{ borderColor: PALETTE_COLORS.secondary, color: PALETTE_COLORS.secondary, fontWeight: 600 }}
                  />
                )}
                {currentQuestion.year && (
                  <Chip size="small" label={currentQuestion.year} variant="outlined" />
                )}
                {currentQuestion.areaName && (
                  <Chip size="small" label={currentQuestion.areaName} />
                )}
                {currentQuestion.subjectName && (
                  <Chip size="small" label={currentQuestion.subjectName} variant="outlined" />
                )}
                {currentQuestion.testName && (
                  <Chip size="small" label={currentQuestion.testName} />
                )}
              </Stack>

              {onBookmarkClick && (
                <Tooltip title="Salvar questão em pasta">
                  <IconButton size="small" onClick={() => onBookmarkClick(currentQuestion)}>
                    <BookmarkBorderIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            {/* Textual Reference Banner */}
            {currentQuestion.textualReference && (
              <Box
                onClick={() => {
                  setActiveDrawerRef(currentQuestion.textualReference!);
                  setActiveDrawerQuestionId(currentQuestion.identifier);
                }}
                sx={{
                  mb: 2.5,
                  p: 1.25,
                  px: 2,
                  border: `1px solid ${isDark ? 'rgba(217, 183, 99, 0.3)' : 'rgba(217, 183, 99, 0.4)'}`,
                  borderRadius: '8px',
                  backgroundColor: isDark ? 'rgba(217, 183, 99, 0.08)' : 'rgba(217, 183, 99, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  flexWrap: 'wrap',
                  gap: 1.5,
                  '&:hover': { borderColor: PALETTE_COLORS.primary },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MenuBookIcon sx={{ color: PALETTE_COLORS.primary, fontSize: '1.2rem' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Texto de Apoio:{' '}
                    {currentQuestion.textualReference.title ||
                      currentQuestion.textualReference.subtitle ||
                      'Referência Textual'}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<BorderColorIcon sx={{ fontSize: '0.9rem' }} />}
                  sx={{
                    backgroundColor: PALETTE_COLORS.primary,
                    color: '#1a1e24',
                    fontWeight: 700,
                    textTransform: 'none',
                    fontSize: '0.8rem',
                  }}
                >
                  Abrir Texto de Apoio
                </Button>
              </Box>
            )}

            {/* Statement */}
            <FormattedText
              text={currentQuestion.enunciado}
              hideInlineImages={Boolean(currentQuestion.images && currentQuestion.images.length > 0)}
              sx={{ fontSize: '1.05rem', lineHeight: 1.7, mb: 2.5 }}
            />

            {/* Images */}
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

            {/* Alternatives */}
            <Stack spacing={1.5} sx={{ mb: 3 }}>
              {currentQuestion.alternatives.map((alt) => {
                const isSelected = selectedAlternativeId === alt.id;
                const isCorrect = Boolean(alt.isCorrect);

                let borderColor = 'divider';
                let backgroundColor = 'transparent';
                let letterBg = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';
                let letterColor = 'text.primary';

                if (!isCurrentVerified) {
                  if (isSelected) {
                    borderColor = PALETTE_COLORS.primary;
                    backgroundColor = isDark ? 'rgba(217, 183, 99, 0.1)' : 'rgba(217, 183, 99, 0.12)';
                    letterBg = PALETTE_COLORS.primary;
                    letterColor = '#1a1e24';
                  }
                } else {
                  if (isCorrect) {
                    borderColor = PALETTE_COLORS.success;
                    backgroundColor = isDark ? 'rgba(75, 241, 81, 0.12)' : 'rgba(75, 241, 81, 0.15)';
                    letterBg = PALETTE_COLORS.success;
                    letterColor = '#0f2910';
                  } else if (isSelected && !isCorrect) {
                    borderColor = PALETTE_COLORS.danger;
                    backgroundColor = isDark ? 'rgba(250, 66, 75, 0.12)' : 'rgba(250, 66, 75, 0.15)';
                    letterBg = PALETTE_COLORS.danger;
                    letterColor = '#ffffff';
                  }
                }

                return (
                  <Box
                    key={alt.id ?? alt.identifier}
                    onClick={() => {
                      if (!isCurrentVerified && alt.id !== undefined) {
                        setSelectedAlternativeId(alt.id);
                      }
                    }}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 1.5,
                      px: 2,
                      borderRadius: 2.5,
                      border: '1.5px solid',
                      borderColor,
                      backgroundColor,
                      cursor: isCurrentVerified ? 'default' : 'pointer',
                      transition: 'all 0.15s ease-in-out',
                      '&:hover': {
                        borderColor: isCurrentVerified ? borderColor : PALETTE_COLORS.primary,
                      },
                    }}
                  >
                    <Radio
                      checked={isSelected}
                      disabled={isCurrentVerified}
                      size="small"
                      sx={{
                        mr: 1,
                        p: 0.5,
                        '&.Mui-checked': {
                          color: isCurrentVerified
                            ? isCorrect
                              ? PALETTE_COLORS.success
                              : PALETTE_COLORS.danger
                            : PALETTE_COLORS.primary,
                        },
                      }}
                    />

                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: 1.5,
                        backgroundColor: letterBg,
                        color: letterColor,
                        fontWeight: 700,
                        fontSize: '0.85rem',
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

                    {isCurrentVerified && isCorrect && (
                      <CheckCircleOutlineIcon sx={{ color: PALETTE_COLORS.success, ml: 1 }} />
                    )}
                    {isCurrentVerified && isSelected && !isCorrect && (
                      <HighlightOffIcon sx={{ color: PALETTE_COLORS.danger, ml: 1 }} />
                    )}
                  </Box>
                );
              })}
            </Stack>

            {/* Answer Feedback */}
            {isCurrentVerified && (
              <Alert
                severity={isAnnulled ? 'warning' : isSelectedCorrect ? 'success' : 'error'}
                sx={{ mb: 2.5, borderRadius: 2 }}
              >
                {isAnnulled ? (
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Questão Anulada: pontuada positivamente para todos.
                  </Typography>
                ) : isSelectedCorrect ? (
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Parabéns! Você acertou. Alternativa correta:{' '}
                    {currentQuestion.correctAlternativeIdentifier ||
                      currentQuestion.alternatives.find((a) => a.isCorrect)?.identifier}
                    .
                  </Typography>
                ) : (
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Resposta incorreta. O gabarito correto é a alternativa{' '}
                    {currentQuestion.correctAlternativeIdentifier ||
                      currentQuestion.alternatives.find((a) => a.isCorrect)?.identifier}
                    .
                  </Typography>
                )}
              </Alert>
            )}

            {/* Action Bar */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              justifyContent="space-between"
              alignItems="center"
            >
              {!isCurrentVerified ? (
                <>
                  <Button
                    variant="outlined"
                    color="inherit"
                    startIcon={<SkipNextIcon />}
                    onClick={handleSkipQuestion}
                    sx={{
                      py: 1.2,
                      px: 3,
                      borderRadius: 2.5,
                      fontWeight: 700,
                      borderColor: 'divider',
                      width: { xs: '100%', sm: 'auto' },
                    }}
                  >
                    Pular Questão
                  </Button>

                  <Button
                    variant="contained"
                    disabled={selectedAlternativeId === null}
                    onClick={handleVerifyAnswer}
                    sx={{
                      py: 1.2,
                      px: 4.5,
                      borderRadius: 2.5,
                      fontWeight: 800,
                      backgroundColor: PALETTE_COLORS.primary,
                      color: '#1a1e24',
                      '&:hover': { backgroundColor: '#c4a251' },
                      width: { xs: '100%', sm: 'auto' },
                    }}
                  >
                    Responder Questão
                  </Button>
                </>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                  <Button
                    variant="contained"
                    endIcon={<ArrowForwardIcon />}
                    onClick={handleAdvanceAfterVerify}
                    sx={{
                      py: 1.2,
                      px: 4.5,
                      borderRadius: 2.5,
                      fontWeight: 800,
                      backgroundColor: PALETTE_COLORS.primary,
                      color: '#1a1e24',
                      '&:hover': { backgroundColor: '#c4a251' },
                      width: { xs: '100%', sm: 'auto' },
                    }}
                  >
                    {currentIndex + 1 >= questions.length ? 'Ver Resumo da Sessão' : 'Próxima Questão'}
                  </Button>
                </Box>
              )}
            </Stack>
          </Paper>

          {/* Interactive Whiteboard */}
          <Box sx={{ mt: 2, mb: 3 }}>
            <QuestionWhiteboard
              key={currentQuestion.id}
              questionId={currentQuestion.id}
            />
          </Box>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}
            >
              <KeyboardIcon fontSize="small" /> Atalhos:{' '}
              <kbd style={{ padding: '2px 6px', background: isDark ? '#333' : '#eee', borderRadius: '4px' }}>Enter</kbd>{' '}
              para confirmar/avançar •{' '}
              <kbd style={{ padding: '2px 6px', background: isDark ? '#333' : '#eee', borderRadius: '4px' }}>P</kbd>{' '}
              para pausar/continuar
            </Typography>
          </Box>
        </>
      ) : null}

      {/* Textual Reference Drawer */}
      <TextualReferenceDrawer
        open={Boolean(activeDrawerRef)}
        onClose={() => {
          setActiveDrawerRef(null);
          setActiveDrawerQuestionId(undefined);
        }}
        reference={activeDrawerRef}
        questionIdentifier={activeDrawerQuestionId}
      />

      {/* Exit Confirmation Dialog */}
      <Dialog
        open={exitDialogOpen}
        onClose={() => {
          setExitDialogOpen(false);
          startTimeRef.current = Date.now() - elapsedRef.current * 1000;
          setIsPaused(false);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Sair da Sessão de Estudo de Questões?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.secondary', mb: 2 }}>
            Você praticou <strong>{sessionResults.length}</strong> de{' '}
            <strong>{questions.length}</strong> questões ({formatSeconds(elapsedSeconds)} decorridos).
            {user?.id
              ? ' Ao salvar e sair, toda a lista de questões, suas respostas e o contador de tempo ficam persistidos na sua conta para retomar de qualquer dispositivo.'
              : ' Faça login para salvar sessões e retomá-las em outros dispositivos.'}
          </DialogContentText>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Você poderá retomar exatamente da questão atual pelo banner superior ou pela aba Sessões de Estudo no seu Perfil.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          {activeSessionId && (
            <Button
              color="error"
              startIcon={<DeleteOutlineIcon />}
              onClick={handleDiscardSession}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Descartar Sessão
            </Button>
          )}
          <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
            <Button
              variant="outlined"
              onClick={() => {
                setExitDialogOpen(false);
                startTimeRef.current = Date.now() - elapsedRef.current * 1000;
                setIsPaused(false);
              }}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
            >
              Continuar Estudando
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirmSaveAndExit}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2,
                backgroundColor: PALETTE_COLORS.primary,
                color: '#1a1e24',
                '&:hover': { backgroundColor: '#c4a251' },
              }}
            >
              Salvar e Sair
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
