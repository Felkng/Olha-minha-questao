import React, { useEffect, useState, useRef } from 'react';
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
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useParams, useNavigate } from 'react-router-dom';
import { TestEvaluation, TestSubmissionResponse } from '../types';
import { getTestEvaluation, submitTest } from '../services/api';
import { PALETTE_COLORS } from '../theme/theme';
import { useAppTheme } from '../theme/ThemeContext';

export const TestEvaluationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';

  const [evaluation, setEvaluation] = useState<TestEvaluation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Configuration state
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [timerMinutes, setTimerMinutes] = useState<number>(30); // 0 = Free Time
  const [timeRemaining, setTimeRemaining] = useState<number>(30 * 60);
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Answers state: questionId -> selectedAlternativeId
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);

  // Finish confirmation & results
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<TestSubmissionResponse | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (id) {
      loadEvaluation(Number(id));
    }
  }, [id]);

  const loadEvaluation = async (testId: number) => {
    setLoading(true);
    try {
      const data = await getTestEvaluation(testId);
      setEvaluation(data);
    } catch (err) {
      console.error('Erro ao carregar avaliação:', err);
    } finally {
      setLoading(false);
    }
  };

  // Timer interval logic
  useEffect(() => {
    if (!isStarted || isPaused || result) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeSpent((prev) => prev + 1);

      if (timerMinutes > 0) {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleTimeExpired();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isStarted, isPaused, result, timerMinutes]);

  const handleStart = () => {
    if (timerMinutes > 0) {
      setTimeRemaining(timerMinutes * 60);
    }
    setTimeSpent(0);
    setIsStarted(true);
    setIsPaused(false);
  };

  const handleTimeExpired = () => {
    handleFinalSubmit();
  };

  const handleSelectAlternative = (questionId: number, alternativeId: number) => {
    if (result) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: alternativeId,
    }));
  };

  const handleFinalSubmit = async () => {
    if (!evaluation) return;
    setConfirmOpen(false);
    setSubmitting(true);

    try {
      const formattedAnswers = evaluation.questions.map((q) => ({
        questionId: q.id,
        selectedAlternativeId: answers[q.id],
        timeSpentSeconds: Math.round(timeSpent / Math.max(evaluation.questions.length, 1)),
      }));

      const response = await submitTest(evaluation.id, {
        timeSpentSeconds: timeSpent,
        sessionId: `session-test-${Date.now()}`,
        answers: formattedAnswers,
      });

      setResult(response);
    } catch (err) {
      console.error('Erro ao submeter prova:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestart = () => {
    setResult(null);
    setAnswers({});
    setIsStarted(false);
    setActiveQuestionIndex(0);
    setTimeSpent(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: PALETTE_COLORS.primary }} />
      </Box>
    );
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
          onClick={() => navigate('/provas')}
          sx={{ mb: 2, color: 'text.secondary' }}
        >
          Voltar para Provas
        </Button>

        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
          {evaluation.name}
        </Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1, mb: 3 }}>
          <Chip label={`Ano ${evaluation.year}`} variant="outlined" />
          {evaluation.originName && <Chip label={evaluation.originName} color="info" variant="outlined" />}
          {evaluation.areaName && <Chip label={evaluation.areaName} variant="outlined" />}
          <Chip label={`${evaluation.questionCount} Questões`} sx={{ fontWeight: 700 }} />
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Configurar Cronômetro da Avaliação
        </Typography>

        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          Escolha o tempo limite desejado para realizar a prova. Ao esgotar o tempo, a prova será submetida automaticamente.
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 4 }}>
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
              variant={timerMinutes === item.val ? 'contained' : 'outlined'}
              onClick={() => setTimerMinutes(item.val)}
              sx={{
                borderRadius: 2,
                px: 2.5,
                py: 1,
                fontWeight: 600,
                borderColor: timerMinutes === item.val ? PALETTE_COLORS.primary : 'divider',
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        <Alert severity="info" sx={{ mb: 4, borderRadius: 2 }}>
          Durante a prova você poderá navegar livremente entre as questões e pausar o cronômetro caso necessário.
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

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="outlined"
              startIcon={<RestartAltIcon />}
              onClick={handleRestart}
              sx={{ px: 3, py: 1.2, fontWeight: 700 }}
            >
              Refazer Avaliação
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/provas')}
              sx={{ px: 3, py: 1.2, fontWeight: 700 }}
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
          const isCorrect = detail ? detail.isCorrect : false;
          const userSelectedId = answers[q.id];

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

              <Typography variant="body1" sx={{ mb: 2.5, lineHeight: 1.6 }}>
                {q.enunciado}
              </Typography>

              <Stack spacing={1}>
                {q.alternatives.map((alt) => {
                  const isUserSelection = userSelectedId === alt.id;
                  const isCorrectAlt = detail ? detail.correctAlternativeId === alt.id : alt.isCorrect;

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
                      {isUserSelection && !isCorrect && (
                        <Chip size="small" label="Sua Escolha" color="error" sx={{ fontWeight: 600 }} />
                      )}
                    </Box>
                  );
                })}
              </Stack>
            </Paper>
          );
        })}
      </Box>
    );
  }

  // SCREEN 2: Active Evaluation Screen (Questions + Countdown Timer)
  const currentQuestion = evaluation.questions[activeQuestionIndex];
  const isTimeCritical = timerMinutes > 0 && timeRemaining <= 300; // < 5 min
  const isTimeUrgent = timerMinutes > 0 && timeRemaining <= 60; // < 1 min

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', my: 2 }}>
      {/* Sticky Top Timer Bar */}
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
        {/* Timer Display */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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

          <Tooltip title={isPaused ? 'Continuar Prova' : 'Pausar Cronômetro'}>
            <IconButton onClick={() => setIsPaused(!isPaused)} sx={{ ml: 1 }}>
              {isPaused ? (
                <PlayCircleOutlineIcon sx={{ color: PALETTE_COLORS.success, fontSize: '2rem' }} />
              ) : (
                <PauseCircleOutlineIcon sx={{ color: 'text.secondary', fontSize: '2rem' }} />
              )}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Question Progress & Submit Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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

      {/* Paused Overlay Alert */}
      {isPaused && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          A prova está pausada. Clique no botão de continuar no topo para retomar.
        </Alert>
      )}

      {/* Questions Navigator Grid (1..N) */}
      <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2.5 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, mb: 1.5, display: 'block' }}>
          NAVEGADOR DE QUESTÕES
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {evaluation.questions.map((q, idx) => {
            const isAnswered = answers[q.id] !== undefined;
            const isCurrent = activeQuestionIndex === idx;

            return (
              <Button
                key={q.id}
                size="small"
                variant={isCurrent ? 'contained' : isAnswered ? 'outlined' : 'text'}
                onClick={() => setActiveQuestionIndex(idx)}
                sx={{
                  minWidth: 40,
                  height: 38,
                  borderRadius: 1.5,
                  fontWeight: 700,
                  backgroundColor: isCurrent
                    ? PALETTE_COLORS.primary
                    : isAnswered
                    ? isDark
                      ? 'rgba(217, 183, 99, 0.15)'
                      : 'rgba(217, 183, 99, 0.12)'
                    : undefined,
                  color: isCurrent ? '#1a1e24' : isAnswered ? PALETTE_COLORS.primary : 'text.secondary',
                  borderColor: isAnswered ? PALETTE_COLORS.primary : 'divider',
                }}
              >
                {idx + 1}
              </Button>
            );
          })}
        </Box>
      </Paper>

      {/* Active Question Paper */}
      {currentQuestion && (
        <Paper elevation={4} sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Chip
              label={`Questão ${activeQuestionIndex + 1} de ${evaluation.questions.length}`}
              sx={{ backgroundColor: PALETTE_COLORS.primary, color: '#1a1e24', fontWeight: 700 }}
            />
            {currentQuestion.originName && (
              <Chip label={currentQuestion.originName} size="small" variant="outlined" />
            )}
          </Box>

          <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.7, mb: 3 }}>
            {currentQuestion.enunciado}
          </Typography>

          <Divider sx={{ mb: 2.5 }} />

          <Stack spacing={1.5} sx={{ mb: 3 }}>
            {currentQuestion.alternatives.map((alt) => {
              const isSelected = answers[currentQuestion.id] === alt.id;

              return (
                <Box
                  key={alt.id}
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
                  <Typography variant="body2" sx={{ flexGrow: 1, lineHeight: 1.5 }}>
                    {alt.text}
                  </Typography>
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

      {/* Confirmation Dialog */}
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
            onClick={handleFinalSubmit}
            disabled={submitting}
            sx={{ fontWeight: 700 }}
          >
            {submitting ? 'Enviando...' : 'Confirmar e Finalizar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
