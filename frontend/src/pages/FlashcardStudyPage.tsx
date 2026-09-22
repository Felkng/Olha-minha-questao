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
  CircularProgress,
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
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Flashcard, FlashcardItemStatus, FlashcardSessionItem } from '../types';
import { getFlashcards, getFlashcardsInFolder, submitFlashcardSession } from '../services/api';
import { PALETTE_COLORS } from '../theme/theme';
import { useAppTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';

export const FlashcardStudyPage: React.FC = () => {
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const folderIdParam = searchParams.get('folderId');
  const areaIdParam = searchParams.get('areaId');
  const subjectIdParam = searchParams.get('subjectId');
  const folderId = folderIdParam ? Number(folderIdParam) : undefined;

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  // Session State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionResults, setSessionResults] = useState<
    { card: Flashcard; status: FlashcardItemStatus }[]
  >([]);
  const [isFinished, setIsFinished] = useState(false);
  const [submittingSession, setSubmittingSession] = useState(false);

  // Load cards for study
  const loadCards = async () => {
    setLoading(true);
    try {
      if (folderId) {
        const folderCards = await getFlashcardsInFolder(folderId);
        setCards(folderCards);
      } else {
        const res = await getFlashcards({
          areaId: areaIdParam ? Number(areaIdParam) : '',
          subjectId: subjectIdParam ? Number(subjectIdParam) : '',
          size: 100,
        });
        setCards(res.content);
      }
    } catch (err) {
      console.error('Erro ao carregar flashcards para estudo:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, [folderIdParam, areaIdParam, subjectIdParam]);

  const currentCard = cards[currentIndex];

  const handleNextCard = (status: FlashcardItemStatus) => {
    if (!currentCard) return;

    const newResults = [...sessionResults, { card: currentCard, status }];
    setSessionResults(newResults);
    setIsFlipped(false);

    if (currentIndex + 1 < cards.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishSession(newResults);
    }
  };

  const finishSession = async (
    finalResults: { card: Flashcard; status: FlashcardItemStatus }[]
  ) => {
    setIsFinished(true);
    if (user?.id) {
      setSubmittingSession(true);
      try {
        const items: FlashcardSessionItem[] = finalResults.map((r) => ({
          flashcardId: r.card.id,
          status: r.status,
        }));
        await submitFlashcardSession({
          folderId,
          items,
        });
      } catch (err) {
        console.error('Erro ao salvar sessão de estudo:', err);
      } finally {
        setSubmittingSession(false);
      }
    }
  };

  // Keyboard navigation (apenas tecla Espaço para virar/revelar)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isFinished || !currentCard) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      }
    },
    [isFinished, currentCard]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleRestartFull = () => {
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

    setCards(missedCards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionResults([]);
    setIsFinished(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress sx={{ color: PALETTE_COLORS.primary }} />
      </Box>
    );
  }

  if (cards.length === 0) {
    return (
      <Box sx={{ mb: 6, maxWidth: 800, mx: 'auto', textAlign: 'center', py: 6 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/flashcards')}
          sx={{ mb: 3, color: 'text.secondary', fontWeight: 600 }}
        >
          Voltar para Flashcards
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
            onClick={() => navigate('/flashcards')}
            sx={{ fontWeight: 700, backgroundColor: PALETTE_COLORS.primary }}
          >
            Ir para Flashcards
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
          onClick={() => navigate('/flashcards')}
          sx={{ mb: 3, color: 'text.secondary', fontWeight: 600 }}
        >
          Voltar para Flashcards
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
            <Grid item xs={6} sm={3}>
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
                <Typography variant="h4" sx={{ fontWeight: 800, color: PALETTE_COLORS.primary }}>
                  {accuracy}%
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                  TAXA DE ACERTO
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={6} sm={3}>
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
                <Typography variant="h4" sx={{ fontWeight: 800, color: PALETTE_COLORS.success }}>
                  {correctCount}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: PALETTE_COLORS.success }}>
                  ACERTOS
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={6} sm={3}>
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
                <Typography variant="h4" sx={{ fontWeight: 800, color: PALETTE_COLORS.danger }}>
                  {wrongCount}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: PALETTE_COLORS.danger }}>
                  ERROS
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={6} sm={3}>
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
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.secondary' }}>
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
              onClick={() => navigate('/flashcards')}
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

              <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                {card.front}
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                <strong>Resposta:</strong> {card.back}
              </Typography>
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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/flashcards')}
          sx={{ color: 'text.secondary', fontWeight: 600 }}
        >
          Sair do Estudo
        </Button>

        <Stack direction="row" spacing={1.5} alignItems="center">
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

      {/* 3D Flip Card Container */}
      <Box
        sx={{
          perspective: '1200px',
          width: '100%',
          minHeight: 380,
          mb: 3,
        }}
      >
        <Box
          onClick={() => setIsFlipped(!isFlipped)}
          sx={{
            position: 'relative',
            width: '100%',
            minHeight: 380,
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
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              borderRadius: 4,
              p: { xs: 3, sm: 5 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxSizing: 'border-box',
              border: '2px solid',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              backgroundColor: isDark ? '#1e242c' : '#ffffff',
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Chip
                  label="FRENTE (PERGUNTA)"
                  size="small"
                  sx={{
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    backgroundColor: isDark ? 'rgba(217, 183, 99, 0.15)' : 'rgba(217, 183, 99, 0.2)',
                    color: PALETTE_COLORS.primary,
                  }}
                />

                <Stack direction="row" spacing={1}>
                  {currentCard.areaName && (
                    <Chip size="small" label={currentCard.areaName} variant="outlined" />
                  )}
                  {currentCard.subjectName && (
                    <Chip size="small" label={currentCard.subjectName} variant="outlined" />
                  )}
                  {currentCard.folderName && (
                    <Chip
                      size="small"
                      icon={<FolderSpecialOutlinedIcon style={{ color: currentCard.folderColor || PALETTE_COLORS.primary }} />}
                      label={currentCard.folderName}
                      sx={{ fontWeight: 600 }}
                    />
                  )}
                </Stack>
              </Box>

              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  lineHeight: 1.5,
                  mt: 3,
                  fontSize: { xs: '1.2rem', sm: '1.45rem' },
                  color: 'text.primary',
                }}
              >
                {currentCard.front}
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                mt: 4,
                color: 'text.secondary',
                userSelect: 'none',
              }}
            >
              <FlipCameraAndroidIcon sx={{ fontSize: '1.2rem', color: PALETTE_COLORS.primary }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Clique no card ou aperte <kbd style={{ padding: '2px 6px', background: isDark ? '#333' : '#eee', borderRadius: '4px' }}>Espaço</kbd> para virar e ver a resposta
              </Typography>
            </Box>
          </Paper>

          {/* Back Face (Verso / Resposta) */}
          <Paper
            elevation={6}
            sx={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              borderRadius: 4,
              p: { xs: 3, sm: 5 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxSizing: 'border-box',
              border: '2px solid',
              borderColor: PALETTE_COLORS.primary,
              backgroundColor: isDark ? '#1a222d' : '#fffdfa',
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Chip
                  label="VERSO (RESPOSTA)"
                  size="small"
                  sx={{
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    backgroundColor: PALETTE_COLORS.primary,
                    color: '#1a1e24',
                  }}
                />

                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Resposta Revelada
                </Typography>
              </Box>

              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  lineHeight: 1.6,
                  mt: 3,
                  fontSize: { xs: '1.1rem', sm: '1.3rem' },
                  color: 'text.primary',
                }}
              >
                {currentCard.back}
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                mt: 4,
                color: 'text.secondary',
                userSelect: 'none',
              }}
            >
              <FlipCameraAndroidIcon sx={{ fontSize: '1.2rem' }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
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
          <KeyboardIcon fontSize="small" /> Atalho: Espaço para {!isFlipped ? 'revelar' : 'ocultar'} a resposta
        </Typography>
      </Box>
    </Box>
  );
};
