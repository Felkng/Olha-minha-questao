import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Stack,
  CircularProgress,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useParams, useNavigate } from 'react-router-dom';
import { TestAttemptDetail, TestEvaluation, TextualReference } from '../types';
import { getTestAttemptDetail, getTestEvaluation } from '../services/api';
import { PALETTE_COLORS } from '../theme/theme';
import { useAppTheme } from '../theme/ThemeContext';
import { TextualReferenceDrawer } from '../components/questions/TextualReferenceDrawer';

export const TestAttemptReviewPage: React.FC = () => {
  const { testId, attemptId } = useParams<{ testId: string; attemptId: string }>();
  const navigate = useNavigate();
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';

  const [attempt, setAttempt] = useState<TestAttemptDetail | null>(null);
  const [evaluation, setEvaluation] = useState<TestEvaluation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [activeDrawerRef, setActiveDrawerRef] = useState<TextualReference | null>(null);
  const [activeDrawerQuestionId, setActiveDrawerQuestionId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (attemptId && testId) {
      loadData(Number(testId), Number(attemptId));
    }
  }, [testId, attemptId]);

  const loadData = async (tId: number, aId: number) => {
    setLoading(true);
    setError(null);
    try {
      const [attemptData, evalData] = await Promise.all([
        getTestAttemptDetail(aId),
        getTestEvaluation(tId),
      ]);
      setAttempt(attemptData);
      setEvaluation(evalData);
    } catch (err: any) {
      console.error('Erro ao carregar detalhes da tentativa:', err);
      setError('Não foi possível carregar os dados desta tentativa.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress sx={{ color: PALETTE_COLORS.primary }} />
      </Box>
    );
  }

  if (error || !attempt || !evaluation) {
    return (
      <Box sx={{ mb: 6 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Tentativa de simulado não encontrada.'}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ fontWeight: 700 }}
        >
          Voltar
        </Button>
      </Box>
    );
  }

  const minutes = Math.floor((attempt.timeSpentSeconds || 0) / 60);
  const seconds = (attempt.timeSpentSeconds || 0) % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const formattedDate = attempt.createdAt
    ? new Date(attempt.createdAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <Box sx={{ mb: 8 }}>
      {/* Botão de Voltar */}
      <Button
        variant="text"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3, fontWeight: 700, color: 'text.secondary' }}
      >
        Voltar para a Prova / Histórico
      </Button>

      {/* Scorecard Paper */}
      <Paper
        elevation={6}
        sx={{
          p: { xs: 3, md: 5 },
          mb: 4,
          borderRadius: 3,
          textAlign: 'center',
          border: '1.5px solid',
          borderColor: attempt.scorePercentage >= 60 ? PALETTE_COLORS.success : PALETTE_COLORS.primary,
          background: isDark
            ? 'linear-gradient(180deg, rgba(217, 183, 99, 0.08) 0%, rgba(26, 30, 36, 0.95) 100%)'
            : 'linear-gradient(180deg, rgba(217, 183, 99, 0.12) 0%, #ffffff 100%)',
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: PALETTE_COLORS.primary,
            color: '#1a1e24',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
          }}
        >
          <EmojiEventsIcon sx={{ fontSize: 36 }} />
        </Box>

        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          Revisão de Simulado Realizado
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
          {attempt.testName} {attempt.testYear ? `(${attempt.testYear})` : ''} • Realizado em {formattedDate}
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr' },
            gap: 2,
            maxWidth: 680,
            mx: 'auto',
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: 'background.paper',
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 0.5 }}>
              APROVEITAMENTO
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: attempt.scorePercentage >= 60 ? PALETTE_COLORS.success : PALETTE_COLORS.primary,
              }}
            >
              {attempt.scorePercentage}%
            </Typography>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: 'background.paper',
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 0.5 }}>
              ACERTOS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
              {attempt.correctAnswers} / {attempt.totalQuestions}
            </Typography>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: 'background.paper',
              gridColumn: { xs: 'span 2', sm: 'span 1' },
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 0.5 }}>
              TEMPO GASTO
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
              {timeFormatted}
            </Typography>
          </Paper>
        </Box>
      </Paper>

      {/* Detailed Question Review */}
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
        Gabarito & Respostas do Simulado
      </Typography>

      {evaluation.questions.map((q, idx) => {
        const detail = attempt.detailedResults.find((d) => d.questionId === q.id);
        const userSelectedId = detail?.selectedAlternativeId;
        const fallbackCorrectAlt = q.alternatives.find((a) => a.isCorrect);
        const correctAltId = detail?.correctAlternativeId ?? fallbackCorrectAlt?.id;
        const isCorrect = detail?.isCorrect !== undefined
          ? detail.isCorrect
          : Boolean(userSelectedId && correctAltId && userSelectedId === correctAltId);

        return (
          <Paper
            key={q.id}
            elevation={4}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              border: '1.5px solid',
              borderColor: isCorrect ? PALETTE_COLORS.success : PALETTE_COLORS.danger,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Chip
                label={`Questão ${idx + 1} (${q.identifier})`}
                sx={{
                  fontWeight: 700,
                  backgroundColor: isCorrect ? PALETTE_COLORS.success : PALETTE_COLORS.danger,
                  color: isCorrect ? '#0f2910' : '#ffffff',
                }}
              />
              <Chip
                icon={isCorrect ? <CheckCircleOutlineIcon /> : <HighlightOffIcon />}
                label={isCorrect ? 'Acertou' : userSelectedId ? 'Errou' : 'Não Respondida'}
                variant="outlined"
                color={isCorrect ? 'success' : 'error'}
              />
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

            <Typography variant="body1" sx={{ mb: 2.5, lineHeight: 1.6 }}>
              {q.enunciado}
            </Typography>

            <Stack spacing={1}>
              {q.alternatives.map((alt) => {
                const isUserSelection = userSelectedId === alt.id;
                const isCorrectAlt = correctAltId ? correctAltId === alt.id : alt.isCorrect;

                let bgColor = 'transparent';
                let borderCol = 'divider';

                if (isCorrectAlt) {
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
                        backgroundColor: isCorrectAlt
                          ? PALETTE_COLORS.success
                          : isUserSelection
                          ? PALETTE_COLORS.danger
                          : 'divider',
                        color: isCorrectAlt ? '#0f2910' : isUserSelection ? '#ffffff' : 'text.secondary',
                      }}
                    >
                      {alt.identifier}
                    </Box>
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      {alt.text}
                    </Typography>
                    {isCorrectAlt && (
                      <Chip size="small" label="Correta" color="success" sx={{ fontWeight: 600 }} />
                    )}
                    {isUserSelection && (
                      <Chip
                        size="small"
                        label={isCorrect ? 'Sua Escolha' : 'Sua Escolha (Incorreta)'}
                        color={isCorrect ? 'success' : 'error'}
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

      {/* Drawer lateral para textos de apoio */}
      <TextualReferenceDrawer
        open={Boolean(activeDrawerRef)}
        onClose={() => setActiveDrawerRef(null)}
        reference={activeDrawerRef}
        questionIdentifier={activeDrawerQuestionId}
      />
    </Box>
  );
};
