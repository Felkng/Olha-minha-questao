import React, { useEffect, useState, useCallback } from 'react';
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
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FlipCameraAndroidIcon from '@mui/icons-material/FlipCameraAndroid';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import ReplayIcon from '@mui/icons-material/Replay';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FolderSpecialOutlinedIcon from '@mui/icons-material/FolderSpecialOutlined';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Flashcard, FlashcardItemStatus, FlashcardSessionItem } from '../types';
import {
  getFlashcards,
  getFlashcardsInFolder,
  getFlashcardSession,
  submitFlashcardSession,
  updateFlashcardSession,
  deleteFlashcardSession,
} from '../services/api';
import { PALETTE_COLORS } from '../theme/theme';
import { useAppTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { FormattedText } from '../components/common/FormattedText';

const shuffleArray = <T,>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const formatSeconds = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours}h ${remMins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const FlashcardStudyPage: React.FC = () => {
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const folderIdParam = searchParams.get('folderId');
  const areaIdParam = searchParams.get('areaId');
  const subjectIdParam = searchParams.get('subjectId');
  const searchParam = searchParams.get('search');
  const sessionIdParam = searchParams.get('sessionId');
  const shuffleParam = searchParams.get('shuffle') === 'true' || searchParams.get('random') === 'true';
  const folderId = folderIdParam ? Number(folderIdParam) : undefined;

  const stateFrom = (location.state as { from?: string; fromTitle?: string } | null)?.from;
  const stateFromTitle = (location.state as { from?: string; fromTitle?: string } | null)?.fromTitle;

  const handleBack = () => {
    if (stateFrom) {
      navigate(stateFrom);
    } else if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else if (folderIdParam) {
      navigate(`/pastas/${folderIdParam}`);
    } else {
      navigate('/flashcards');
    }
  };

  const backLabel =
    stateFromTitle ||
    (folderIdParam ? 'Voltar para o Deck' : 'Voltar para Flashcards');

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [originalCards, setOriginalCards] = useState<Flashcard[]>([]);
  const [isRandomMode, setIsRandomMode] = useState<boolean>(shuffleParam);
  const [loading, setLoading] = useState(true);

  // Active Session tracking
  const [activeSessionId, setActiveSessionId] = useState<number | null>(
    sessionIdParam ? Number(sessionIdParam) : null
  );

  // Timer & Pause State
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const startTimeRef = React.useRef<number>(Date.now());
  const timerIntervalRef = React.useRef<any>(null);

  // Exit dialog
  const [exitDialogOpen, setExitDialogOpen] = useState<boolean>(false);

  // Session State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionResults, setSessionResults] = useState<
    { card: Flashcard; status: FlashcardItemStatus }[]
  >([]);
  const [isFinished, setIsFinished] = useState(false);
  const [submittingSession, setSubmittingSession] = useState(false);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => {
      const next = !prev;
      if (next) {
        // Pausando
        const cur = Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000));
        setElapsedSeconds(cur);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      } else {
        // Retomando
        startTimeRef.current = Date.now() - elapsedSeconds * 1000;
      }
      return next;
    });
  }, [elapsedSeconds]);

  useEffect(() => {
    if (!loading && !isFinished && !isPaused && cards.length > 0) {
      startTimeRef.current = Date.now() - elapsedSeconds * 1000;
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [loading, isFinished, isPaused, cards.length]);

  // Load cards for study (or resume session)
  const loadCards = async () => {
    setLoading(true);
    try {
      if (sessionIdParam) {
        const session = await getFlashcardSession(Number(sessionIdParam));
        setActiveSessionId(session.id);
        const savedSeconds = session.timeSpentSeconds || 0;
        setElapsedSeconds(savedSeconds);
        startTimeRef.current = Date.now() - savedSeconds * 1000;

        let fetchedCards: Flashcard[] = [];
        if (session.cardIds && session.cardIds.length > 0) {
          const res = await getFlashcards({
            ids: session.cardIds,
            size: 1000,
          });
          const cardMap = new Map(res.content.map((c) => [c.id, c]));
          fetchedCards = session.cardIds
            .map((id) => cardMap.get(id))
            .filter(Boolean) as Flashcard[];
        } else if (session.folderId) {
          fetchedCards = await getFlashcardsInFolder(session.folderId);
        } else {
          const res = await getFlashcards({
            areaId: session.areaId ?? '',
            subjectId: session.subjectId ?? '',
            size: 1000,
          });
          fetchedCards = res.content;
        }

        setOriginalCards(fetchedCards);
        setCards(fetchedCards);

        // Restaurar respostas prévias
        const cardMap = new Map(fetchedCards.map((c) => [c.id, c]));
        const restoredResults = (session.items || []).map((item) => {
          const cardObj = cardMap.get(item.flashcardId) || ({
            id: item.flashcardId,
            front: item.flashcardFront || '',
            back: item.flashcardBack || '',
            areaName: item.areaName,
            subjectName: item.subjectName,
          } as Flashcard);
          return {
            card: cardObj,
            status: item.status,
          };
        });

        setSessionResults(restoredResults);
        const nextIndex = restoredResults.length;
        setCurrentIndex(nextIndex);
        if (nextIndex >= fetchedCards.length && fetchedCards.length > 0) {
          setIsFinished(true);
        }
      } else {
        let fetchedCards: Flashcard[] = [];
        if (folderId) {
          fetchedCards = await getFlashcardsInFolder(folderId, {
            areaId: areaIdParam ? Number(areaIdParam) : undefined,
            subjectId: subjectIdParam ? Number(subjectIdParam) : undefined,
            search: searchParam || undefined,
          });
        } else {
          const res = await getFlashcards({
            areaId: areaIdParam ? Number(areaIdParam) : '',
            subjectId: subjectIdParam ? Number(subjectIdParam) : '',
            search: searchParam || undefined,
            size: 1000,
            sort: 'updatedAt,desc',
          });
          fetchedCards = res.content;
        }
        setOriginalCards(fetchedCards);
        setCards(isRandomMode ? shuffleArray(fetchedCards) : fetchedCards);
      }
    } catch (err) {
      console.error('Erro ao carregar flashcards para estudo:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, [folderIdParam, areaIdParam, subjectIdParam, searchParam, sessionIdParam]);

  const toggleRandomMode = () => {
    const nextRandom = !isRandomMode;
    setIsRandomMode(nextRandom);

    // Update URL param without refreshing
    const newParams = new URLSearchParams(searchParams);
    if (nextRandom) {
      newParams.set('shuffle', 'true');
    } else {
      newParams.delete('shuffle');
      newParams.delete('random');
    }
    setSearchParams(newParams, { replace: true });

    // Reset and apply shuffling or original order
    const baseCards = originalCards.length > 0 ? originalCards : cards;
    setCards(nextRandom ? shuffleArray(baseCards) : baseCards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionResults([]);
    setIsFinished(false);
  };

  const currentCard = cards[currentIndex];

  const handleNextCard = (status: FlashcardItemStatus) => {
    if (!currentCard || isPaused) return;

    const newResults = [...sessionResults, { card: currentCard, status }];
    setSessionResults(newResults);
    setIsFlipped(false);

    const isLast = currentIndex + 1 >= cards.length;
    const currentSeconds = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));
    setElapsedSeconds(currentSeconds);

    if (user?.id) {
      const itemsPayload: FlashcardSessionItem[] = newResults.map((r) => ({
        flashcardId: r.card.id,
        status: r.status,
      }));

      if (!activeSessionId) {
        submitFlashcardSession({
          folderId,
          areaId: areaIdParam ? Number(areaIdParam) : undefined,
          subjectId: subjectIdParam ? Number(subjectIdParam) : undefined,
          totalCards: cards.length,
          completed: isLast,
          cardIds: cards.map((c) => c.id),
          timeSpentSeconds: currentSeconds,
          items: itemsPayload,
        })
          .then((saved) => {
            setActiveSessionId(saved.id);
            const newParams = new URLSearchParams(searchParams);
            newParams.set('sessionId', String(saved.id));
            setSearchParams(newParams, { replace: true });
          })
          .catch((err) => console.error('Erro ao salvar sessão inicial:', err));
      } else {
        updateFlashcardSession(activeSessionId, {
          folderId,
          areaId: areaIdParam ? Number(areaIdParam) : undefined,
          subjectId: subjectIdParam ? Number(subjectIdParam) : undefined,
          totalCards: cards.length,
          completed: isLast,
          cardIds: cards.map((c) => c.id),
          timeSpentSeconds: currentSeconds,
          items: itemsPayload,
        }).catch((err) => console.error('Erro ao atualizar sessão:', err));
      }
    }

    if (!isLast) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishSession(newResults, currentSeconds);
    }
  };

  const finishSession = async (
    finalResults: { card: Flashcard; status: FlashcardItemStatus }[],
    finalSecondsInput?: number
  ) => {
    setIsFinished(true);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    const finalSeconds = finalSecondsInput ?? Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));
    setElapsedSeconds(finalSeconds);

    if (user?.id) {
      setSubmittingSession(true);
      try {
        const items: FlashcardSessionItem[] = finalResults.map((r) => ({
          flashcardId: r.card.id,
          status: r.status,
        }));
        if (activeSessionId) {
          await updateFlashcardSession(activeSessionId, {
            folderId,
            areaId: areaIdParam ? Number(areaIdParam) : undefined,
            subjectId: subjectIdParam ? Number(subjectIdParam) : undefined,
            totalCards: cards.length,
            completed: true,
            cardIds: cards.map((c) => c.id),
            timeSpentSeconds: finalSeconds,
            items,
          });
        } else {
          const saved = await submitFlashcardSession({
            folderId,
            areaId: areaIdParam ? Number(areaIdParam) : undefined,
            subjectId: subjectIdParam ? Number(subjectIdParam) : undefined,
            totalCards: cards.length,
            completed: true,
            cardIds: cards.map((c) => c.id),
            timeSpentSeconds: finalSeconds,
            items,
          });
          setActiveSessionId(saved.id);
        }
      } catch (err) {
        console.error('Erro ao salvar sessão de estudo concluída:', err);
      } finally {
        setSubmittingSession(false);
      }
    }
  };

  const handleExitRequest = () => {
    if (isFinished || sessionResults.length === 0) {
      handleBack();
      return;
    }
    // Pausa o cronômetro enquanto decide sair
    setIsPaused(true);
    setExitDialogOpen(true);
  };

  const handleConfirmSaveAndExit = async () => {
    const currentSeconds = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));
    if (activeSessionId && user?.id) {
      try {
        const itemsPayload: FlashcardSessionItem[] = sessionResults.map((r) => ({
          flashcardId: r.card.id,
          status: r.status,
        }));
        await updateFlashcardSession(activeSessionId, {
          folderId,
          areaId: areaIdParam ? Number(areaIdParam) : undefined,
          subjectId: subjectIdParam ? Number(subjectIdParam) : undefined,
          totalCards: cards.length,
          completed: false,
          cardIds: cards.map((c) => c.id),
          timeSpentSeconds: currentSeconds,
          items: itemsPayload,
        });
      } catch (err) {
        console.error('Erro ao salvar estado ao sair:', err);
      }
    }
    setExitDialogOpen(false);
    handleBack();
  };

  const handleDiscardSession = async () => {
    if (activeSessionId) {
      try {
        await deleteFlashcardSession(activeSessionId);
      } catch (err) {
        console.error('Erro ao descartar sessão:', err);
      }
    }
    setExitDialogOpen(false);
    handleBack();
  };

  // Keyboard navigation (Espaço para virar, P para pausar)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isFinished || !currentCard) return;

      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        togglePause();
        return;
      }

      if (isPaused) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      }
    },
    [isFinished, currentCard, isPaused, togglePause]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleRestartFull = () => {
    if (isRandomMode && originalCards.length > 0) {
      setCards(shuffleArray(originalCards));
    }
    setElapsedSeconds(0);
    startTimeRef.current = Date.now();
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionResults([]);
    setIsFinished(false);
  };

  const handleReviewMissed = () => {
    const missedCards = sessionResults
      .filter((r) => r.status === 'WRONG')
      .map((r) => r.card);
    if (missedCards.length === 0) return;

    setCards(isRandomMode ? shuffleArray(missedCards) : missedCards);
    setElapsedSeconds(0);
    startTimeRef.current = Date.now();
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionResults([]);
    setIsFinished(false);
  };

  if (loading) {
    return (
      <Box sx={{ mb: 6, maxWidth: 800, mx: 'auto' }}>
        <Skeleton variant="rounded" width={160} height={36} sx={{ mb: 3, borderRadius: 2 }} />
        <Paper elevation={4} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Skeleton variant="rounded" width={100} height={24} sx={{ borderRadius: 1.5 }} />
            <Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: 1.5 }} />
          </Box>
          <Skeleton variant="rounded" height={8} sx={{ borderRadius: 4, mb: 4 }} />
          <Box sx={{ minHeight: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3 }}>
            <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
            <Skeleton variant="text" width="80%" height={24} />
            <Skeleton variant="text" width="70%" height={24} />
          </Box>
        </Paper>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Skeleton variant="rounded" width={140} height={44} sx={{ borderRadius: 2.5 }} />
          <Skeleton variant="rounded" width={140} height={44} sx={{ borderRadius: 2.5 }} />
        </Box>
      </Box>
    );
  }

  if (cards.length === 0) {
    return (
      <Box sx={{ mb: 6, maxWidth: 800, mx: 'auto', textAlign: 'center', py: 6 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 3, color: 'text.secondary', fontWeight: 600 }}
        >
          {backLabel}
        </Button>
        <Paper elevation={4} sx={{ p: 6, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Nenhum flashcard encontrado para estudo
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Crie novos flashcards ou selecione outra pasta com flashcards cadastrados.
          </Typography>
          <Button
            variant="contained"
            onClick={handleBack}
            sx={{ fontWeight: 700, backgroundColor: PALETTE_COLORS.primary }}
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
      <Box sx={{ maxWidth: 850, mx: 'auto', mb: 6 }}>
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
            position: 'relative',
            overflow: 'hidden',
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
            Sessão de Flashcards Concluída!
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: submittingSession ? 1 : 4 }}>
            Você revisou todos os <strong>{total}</strong> flashcards desta sessão.
          </Typography>
          {submittingSession && (
            <Typography variant="caption" sx={{ color: PALETTE_COLORS.primary, fontWeight: 700, display: 'block', mb: 3 }}>
              Salvando estatísticas da sua sessão...
            </Typography>
          )}

          {/* Metrics Grid */}
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
                  PULADOS
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Action Buttons */}
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
                Revisar os que Errei ({wrongCount})
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
              sx={{ fontWeight: 700, borderRadius: 2, backgroundColor: PALETTE_COLORS.primary }}
            >
              Finalizar Estudo
            </Button>
          </Stack>
        </Paper>

        {/* Detailed Card Breakdown */}
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
          Detalhamento dos Flashcards da Sessão:
        </Typography>

        <Stack spacing={2}>
          {sessionResults.map(({ card, status }, idx) => (
            <Paper
              key={card.id || idx}
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
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                  Carta #{idx + 1}
                </Typography>
                <Chip
                  size="small"
                  label={
                    status === 'CORRECT'
                      ? 'Acerto'
                      : status === 'WRONG'
                      ? 'Erro'
                      : 'Pulado'
                  }
                  sx={{
                    fontWeight: 700,
                    backgroundColor:
                      status === 'CORRECT'
                        ? `${PALETTE_COLORS.success}20`
                        : status === 'WRONG'
                        ? `${PALETTE_COLORS.danger}20`
                        : 'rgba(0,0,0,0.08)',
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
                text={card.front}
                fontWeight={600}
                fontSize="1rem"
                sx={{ mb: 1 }}
              />
              <Divider sx={{ my: 1 }} />
              <Box sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                <strong>Resposta:</strong>{' '}
                <FormattedText
                  text={card.back}
                  inline
                  fontSize="0.875rem"
                  color="text.secondary"
                />
              </Box>
            </Paper>
          ))}
        </Stack>
      </Box>
    );
  }

  const progressPercentage = ((currentIndex + 1) / cards.length) * 100;
  const currentCorrect = sessionResults.filter((r) => r.status === 'CORRECT').length;
  const currentWrong = sessionResults.filter((r) => r.status === 'WRONG').length;

  return (
    <Box sx={{ maxWidth: 850, mx: 'auto', mb: 6 }}>
      {/* Header & Controls */}
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
            Sair do Estudo
          </Button>

          <Tooltip title={isRandomMode ? 'Modo aleatório ativado. Clique para desativar' : 'Ativar modo aleatório (embaralhar cards)'}>
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
              Modo Aleatório: {isRandomMode ? 'Ativado' : 'Desativado'}
            </Button>
          </Tooltip>
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Chip
            size="small"
            icon={<AccessTimeIcon fontSize="small" sx={{ color: `${PALETTE_COLORS.primary} !important` }} />}
            label={formatSeconds(elapsedSeconds)}
            sx={{
              fontWeight: 700,
              backgroundColor: isDark ? 'rgba(217, 183, 99, 0.1)' : 'rgba(217, 183, 99, 0.15)',
              color: PALETTE_COLORS.primary,
            }}
          />

          <Tooltip title={isPaused ? 'Continuar Estudo (P)' : 'Pausar Estudo (P)'}>
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
                '&:hover': {
                  backgroundColor: isPaused
                    ? isDark
                      ? 'rgba(75, 241, 81, 0.25)'
                      : 'rgba(75, 241, 81, 0.2)'
                    : 'action.hover',
                },
              }}
            >
              {isPaused ? <PlayArrowIcon fontSize="small" /> : <PauseIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Chip
            size="small"
            icon={<CheckCircleIcon style={{ color: PALETTE_COLORS.success }} />}
            label={`${currentCorrect} acertos`}
            sx={{ fontWeight: 700, backgroundColor: 'transparent' }}
          />
          <Chip
            size="small"
            icon={<CancelIcon style={{ color: PALETTE_COLORS.danger }} />}
            label={`${currentWrong} erros`}
            sx={{ fontWeight: 700, backgroundColor: 'transparent' }}
          />
        </Stack>
      </Box>

      {/* Progress Bar */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
            FLASHCARD {currentIndex + 1} DE {cards.length}
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, color: PALETTE_COLORS.primary }}>
            {Math.round(progressPercentage)}%
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

      {/* Pause Screen Overlay or Active Card */}
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
                Estudo Pausado
              </Typography>
              <Typography variant="body1" color="text.secondary">
                O cronômetro está parado em <strong>{formatSeconds(elapsedSeconds)}</strong>. Respire fundo e retome quando estiver pronto para continuar.
              </Typography>
            </Box>

            <Button
              variant="contained"
              size="large"
              startIcon={<PlayArrowIcon />}
              onClick={togglePause}
              sx={{
                px: 5,
                py: 1.5,
                fontWeight: 800,
                fontSize: '1.05rem',
                borderRadius: 3,
                backgroundColor: PALETTE_COLORS.primary,
                color: '#1a1e24',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: '#c4a251',
                  boxShadow: 'none',
                },
              }}
            >
              Continuar Estudo (P)
            </Button>
          </Stack>
        </Paper>
      ) : (
        <>
          {/* 3D Flip Card Container */}
      <Box
        sx={{
          perspective: '1200px',
          width: '100%',
          minHeight: { xs: 360, sm: 400 },
          height: { xs: 380, sm: 420 },
          mb: 3,
        }}
      >
        <Box
          onClick={() => setIsFlipped(!isFlipped)}
          sx={{
            position: 'relative',
            width: '100%',
            height: '100%',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            cursor: 'pointer',
          }}
        >
          {/* Front Face (Frente / Pergunta) */}
          <Paper
            elevation={6}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              borderRadius: 4,
              p: { xs: 2.5, sm: 4 },
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              border: '2px solid',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              backgroundColor: isDark ? '#1e242c' : '#ffffff',
              overflow: 'hidden',
            }}
          >
            {/* Top metadata / chips with flex-wrap and responsive handling */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                mb: 1.5,
                flexWrap: 'wrap',
                gap: 1,
                flexShrink: 0,
                width: '100%',
              }}
            >
              <Chip
                label="FRENTE (PERGUNTA)"
                size="small"
                sx={{
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  backgroundColor: isDark ? 'rgba(217, 183, 99, 0.15)' : 'rgba(217, 183, 99, 0.2)',
                  color: PALETTE_COLORS.primary,
                  flexShrink: 0,
                }}
              />

              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 0.8,
                  alignItems: 'center',
                  justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                  maxWidth: '100%',
                }}
              >
                {currentCard.areaName && (
                  <Chip
                    size="small"
                    label={currentCard.areaName}
                    variant="outlined"
                    sx={{
                      maxWidth: '100%',
                      '& .MuiChip-label': {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      },
                    }}
                  />
                )}
                {currentCard.subjectName && (
                  <Chip
                    size="small"
                    label={currentCard.subjectName}
                    variant="outlined"
                    sx={{
                      maxWidth: '100%',
                      '& .MuiChip-label': {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      },
                    }}
                  />
                )}
                {currentCard.folderName && (
                  <Chip
                    size="small"
                    icon={<FolderSpecialOutlinedIcon style={{ color: currentCard.folderColor || PALETTE_COLORS.primary, fontSize: 16 }} />}
                    label={currentCard.folderName}
                    sx={{
                      fontWeight: 600,
                      maxWidth: '100%',
                      '& .MuiChip-label': {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      },
                    }}
                  />
                )}
              </Box>
            </Box>

            {/* Question Text Area with Vertical Scroll Support */}
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                my: 1,
                overflowY: 'auto',
                pr: 1,
                display: 'flex',
                alignItems: 'flex-start',
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '3px',
                },
              }}
            >
              <Box sx={{ width: '100%' }}>
                <FormattedText
                  text={currentCard.front}
                  fontWeight={700}
                  lineHeight={1.55}
                  sx={{ fontSize: { xs: '1.08rem', sm: '1.35rem' } }}
                />
              </Box>
            </Box>

            {/* Bottom Hint */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                mt: 1.5,
                pt: 1,
                borderTop: '1px dashed',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                color: 'text.secondary',
                userSelect: 'none',
                flexShrink: 0,
              }}
            >
              <FlipCameraAndroidIcon sx={{ fontSize: '1.2rem', color: PALETTE_COLORS.primary }} />
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.78rem', sm: '0.875rem' }, textAlign: 'center' }}>
                Clique no card ou aperte <kbd style={{ padding: '2px 6px', background: isDark ? '#333' : '#eee', borderRadius: '4px' }}>Espaço</kbd> para virar e ver a resposta
              </Typography>
            </Box>
          </Paper>

          {/* Back Face (Verso / Resposta) */}
          <Paper
            elevation={6}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              borderRadius: 4,
              p: { xs: 2.5, sm: 4 },
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              border: '2px solid',
              borderColor: PALETTE_COLORS.primary,
              backgroundColor: isDark ? '#1a222d' : '#fffdfa',
              overflow: 'hidden',
            }}
          >
            {/* Top metadata / chips with flex-wrap */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 1.5,
                flexWrap: 'wrap',
                gap: 1,
                flexShrink: 0,
                width: '100%',
              }}
            >
              <Chip
                label="VERSO (RESPOSTA)"
                size="small"
                sx={{
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  backgroundColor: PALETTE_COLORS.primary,
                  color: '#1a1e24',
                  flexShrink: 0,
                }}
              />

              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Resposta Revelada
              </Typography>
            </Box>

            {/* Answer Text Area with Vertical Scroll Support */}
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                my: 1,
                overflowY: 'auto',
                pr: 1,
                display: 'flex',
                alignItems: 'flex-start',
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '3px',
                },
              }}
            >
              <Box sx={{ width: '100%' }}>
                <FormattedText
                  text={currentCard.back}
                  fontWeight={600}
                  lineHeight={1.6}
                  sx={{ fontSize: { xs: '1.02rem', sm: '1.25rem' } }}
                />
              </Box>
            </Box>

            {/* Bottom Hint */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                mt: 1.5,
                pt: 1,
                borderTop: '1px dashed',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                color: 'text.secondary',
                userSelect: 'none',
                flexShrink: 0,
              }}
            >
              <FlipCameraAndroidIcon sx={{ fontSize: '1.2rem' }} />
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.78rem', sm: '0.875rem' }, textAlign: 'center' }}>
                Clique para voltar para a pergunta
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Control Buttons */}
      {!isFlipped ? (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems="center"
          justifyContent="center"
          sx={{ width: '100%' }}
        >
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<SkipNextIcon />}
            onClick={() => handleNextCard('SKIPPED')}
            sx={{
              py: 1.4,
              px: 3.5,
              borderRadius: 3,
              fontWeight: 700,
              borderColor: 'divider',
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            Pular Flashcard
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={<VisibilityIcon />}
            onClick={() => setIsFlipped(true)}
            sx={{
              py: 1.4,
              px: 5,
              borderRadius: 3,
              fontWeight: 800,
              backgroundColor: PALETTE_COLORS.primary,
              color: '#1a1e24',
              fontSize: '1.05rem',
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: '#c4a251',
                boxShadow: 'none',
              },
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            Revelar Resposta (Espaço)
          </Button>
        </Stack>
      ) : (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
          sx={{ width: '100%' }}
        >
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<SkipNextIcon />}
            onClick={() => handleNextCard('SKIPPED')}
            sx={{
              py: 1.4,
              px: 3.5,
              borderRadius: 3,
              fontWeight: 700,
              borderColor: 'divider',
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            Pular
          </Button>

          <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <Button
              variant="contained"
              color="error"
              startIcon={<CancelIcon />}
              onClick={() => handleNextCard('WRONG')}
              sx={{
                py: 1.4,
                px: 4,
                borderRadius: 3,
                fontWeight: 800,
                backgroundColor: PALETTE_COLORS.danger,
                minWidth: 140,
                flex: { xs: 1, sm: 'initial' },
              }}
            >
              Errei
            </Button>

            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={() => handleNextCard('CORRECT')}
              sx={{
                py: 1.4,
                px: 4,
                borderRadius: 3,
                fontWeight: 800,
                backgroundColor: PALETTE_COLORS.success,
                color: '#0f2910',
                minWidth: 140,
                flex: { xs: 1, sm: 'initial' },
              }}
            >
              Acertei
            </Button>
          </Stack>
        </Stack>
      )}

          {/* Quick helper */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
              <KeyboardIcon fontSize="small" /> Atalhos: <kbd style={{ padding: '2px 6px', background: isDark ? '#333' : '#eee', borderRadius: '4px' }}>Espaço</kbd> para {!isFlipped ? 'revelar' : 'ocultar'} • <kbd style={{ padding: '2px 6px', background: isDark ? '#333' : '#eee', borderRadius: '4px' }}>P</kbd> para pausar/despausar
            </Typography>
          </Box>
        </>
      )}

      {/* Exit Confirmation Dialog */}
      <Dialog
        open={exitDialogOpen}
        onClose={() => {
          setExitDialogOpen(false);
          setIsPaused(false);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Sair da Sessão de Estudo?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.secondary', mb: 2 }}>
            Você praticou <strong>{sessionResults.length}</strong> de <strong>{cards.length}</strong> flashcards.
            Seu progresso foi registrado para suas métricas e você poderá retomar o estudo a qualquer momento pela aba <strong>Sessões de Estudo</strong> no seu Perfil.
          </DialogContentText>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            O tempo de estudo e os acertos/erros até aqui estão seguros. Nada será perdido!
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
                '&:hover': {
                  backgroundColor: '#c4a251',
                },
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
