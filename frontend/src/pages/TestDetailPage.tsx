import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Stack,
  Alert,
  Snackbar,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { DetailPageSkeleton } from '../components/skeletons';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ShareIcon from '@mui/icons-material/Share';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CategoryIcon from '@mui/icons-material/Category';
import HistoryIcon from '@mui/icons-material/History';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import PublicIcon from '@mui/icons-material/Public';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Question, Test, TestAttemptSummary } from '../types';
import { getTestById, getTestEvaluation, getTestAttempts, deleteTest, toggleTestVisibility } from '../services/api';
import { QuestionCard } from '../components/questions/QuestionCard';
import { QuestionWhiteboard } from '../components/whiteboard/QuestionWhiteboard';
import { TestQuestionsNavigator } from '../components/questions/TestQuestionsNavigator';
import { SaveTestToFolderModal } from '../components/folders/SaveTestToFolderModal';
import { PALETTE_COLORS } from '../theme/theme';
import { useAuth } from '../context/AuthContext';

interface TestDetailPageProps {
  onBookmarkQuestion?: (question: Question) => void;
}

export const TestDetailPage: React.FC<TestDetailPageProps> = ({
  onBookmarkQuestion,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAdmin, attemptedQuestionIds } = useAuth();

  const initialQ = Number(searchParams.get('q'));
  const initialMode = searchParams.get('mode') as 'single' | 'all' | null;

  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempts, setAttempts] = useState<TestAttemptSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(
    initialQ > 0 ? initialQ - 1 : 0
  );
  const [viewMode, setViewMode] = useState<'single' | 'all'>(
    initialMode === 'all' ? 'all' : 'single'
  );

  const [saveModalOpen, setSaveModalOpen] = useState<boolean>(false);
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      loadTest(Number(id));
    }
  }, [id, user?.id]);

  const loadTest = async (tId: number) => {
    setLoading(true);
    try {
      const userId = user?.id || 1;
      const [testData, evalData, attemptsData] = await Promise.all([
        getTestById(tId),
        getTestEvaluation(tId),
        getTestAttempts(tId, userId).catch(() => []),
      ]);
      setTest(testData);
      setQuestions(evalData.questions || []);
      setAttempts(attemptsData || []);
    } catch (err) {
      console.error('Erro ao carregar dados da prova:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuestion = (idx: number) => {
    setActiveQuestionIndex(idx);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('q', String(idx + 1));
        return next;
      },
      { replace: true }
    );
  };

  const handleViewModeChange = (modeVal: 'single' | 'all') => {
    setViewMode(modeVal);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('mode', modeVal);
        return next;
      },
      { replace: true }
    );
  };

  useEffect(() => {
    const qParam = Number(searchParams.get('q'));
    if (qParam > 0 && qParam - 1 !== activeQuestionIndex && qParam - 1 < questions.length) {
      setActiveQuestionIndex(qParam - 1);
    }
  }, [searchParams, questions.length]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setToastOpen(true);
  };

  if (loading) {
    return <DetailPageSkeleton />;
  }

  if (!test) {
    return (
      <Box sx={{ mb: 6 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/provas')}
          sx={{ mb: 3, color: 'text.secondary', fontWeight: 600 }}
        >
          Voltar para Provas
        </Button>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Prova não encontrada no sistema.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 6 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/provas')}
        sx={{ mb: 3, color: 'text.secondary', fontWeight: 600 }}
      >
        Voltar para Lista de Provas
      </Button>

      {/* Header Card da Prova */}
      <Paper elevation={4} sx={{ p: 4, borderRadius: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
              {test.name}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              <Chip
                icon={<CalendarTodayIcon fontSize="small" />}
                label={`Ano: ${test.year}`}
                size="small"
                variant="outlined"
              />
              {test.originName && (
                <Chip
                  icon={<AccountBalanceIcon fontSize="small" />}
                  label={`Banca: ${test.originName}`}
                  size="small"
                  variant="outlined"
                />
              )}
              {test.areaName && (
                <Chip
                  icon={<CategoryIcon fontSize="small" />}
                  label={`Área: ${test.areaName}`}
                  size="small"
                  variant="outlined"
                />
              )}
              <Chip
                icon={<MenuBookOutlinedIcon fontSize="small" />}
                label={`${test.questionCount ?? questions.length ?? 0} questões`}
                size="small"
                sx={{ backgroundColor: 'rgba(217, 183, 99, 0.15)', color: PALETTE_COLORS.primary, fontWeight: 700 }}
              />
              <Tooltip title={user?.id === test.createdByUser?.id ? "Clique para alternar visibilidade (Pública/Privada)" : (test.isPublic !== false ? "Prova pública" : "Prova privada")}>
                <Chip
                  size="small"
                  icon={test.isPublic !== false ? <PublicIcon fontSize="inherit" /> : <LockOutlinedIcon fontSize="inherit" />}
                  label={test.isPublic !== false ? 'Pública' : 'Privada'}
                  onClick={user?.id === test.createdByUser?.id ? async () => {
                    try {
                      const updated = await toggleTestVisibility(test.id);
                      setTest({ ...test, isPublic: updated.isPublic });
                    } catch (e) {
                      console.error('Erro ao alternar visibilidade:', e);
                    }
                  } : undefined}
                  clickable={user?.id === test.createdByUser?.id}
                  sx={{
                    backgroundColor: test.isPublic !== false
                      ? 'rgba(75, 241, 81, 0.15)'
                      : 'rgba(250, 66, 75, 0.15)',
                    color: test.isPublic !== false ? PALETTE_COLORS.success : PALETTE_COLORS.danger,
                    border: '1px solid',
                    borderColor: test.isPublic !== false ? PALETTE_COLORS.success : PALETTE_COLORS.danger,
                    fontWeight: 700,
                    cursor: user?.id === test.createdByUser?.id ? 'pointer' : 'default',
                  }}
                />
              </Tooltip>
            </Stack>
          </Box>

          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<BookmarkBorderIcon />}
              onClick={() => setSaveModalOpen(true)}
              sx={{ fontWeight: 700, borderRadius: 2 }}
            >
              Salvar Prova
            </Button>
            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
              onClick={handleShare}
              sx={{ fontWeight: 700, borderRadius: 2 }}
            >
              Compartilhar
            </Button>
            {(user?.id === test.createdByUser?.id || (isAdmin && (test.isPublic !== false))) && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteOutlineIcon />}
                onClick={() => setDeleteDialogOpen(true)}
                sx={{ fontWeight: 700, borderRadius: 2 }}
              >
                {isAdmin && user?.id !== test.createdByUser?.id ? 'Moderar (Excluir)' : 'Excluir'}
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={() => navigate(`/provas/${test.id}/avaliacao`)}
              sx={{ fontWeight: 800, borderRadius: 2, backgroundColor: PALETTE_COLORS.primary }}
            >
              Iniciar Simulado
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Seção de Tentativas Anteriores no Simulado */}
      {attempts.length > 0 && (
        <Paper
          elevation={2}
          sx={{
            p: 3,
            borderRadius: 3,
            mb: 4,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <HistoryIcon sx={{ color: PALETTE_COLORS.primary }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Suas Tentativas Anteriores neste Simulado ({attempts.length})
            </Typography>
          </Box>
          <Stack spacing={1.5}>
            {attempts.map((att) => {
              const formattedDate = att.createdAt
                ? new Date(att.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Data não informada';
              const min = Math.floor(att.timeSpentSeconds / 60);
              const sec = att.timeSpentSeconds % 60;
              const formattedTime = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
              const isPassed = att.scorePercentage >= 60;

              return (
                <Paper
                  key={att.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<CheckCircleOutlineIcon fontSize="small" />}
                      label={`${Math.round(att.scorePercentage)}% (${att.correctAnswers}/${att.totalQuestions})`}
                      color={isPassed ? 'success' : 'warning'}
                      sx={{ fontWeight: 800 }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                      <TimerOutlinedIcon fontSize="small" />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formattedTime}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {formattedDate}
                    </Typography>
                  </Box>

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate(`/provas/${test.id}/tentativas/${att.id}`)}
                    sx={{
                      fontWeight: 700,
                      borderRadius: 2,
                      borderColor: PALETTE_COLORS.primary,
                      color: PALETTE_COLORS.primary,
                      '&:hover': {
                        borderColor: PALETTE_COLORS.primary,
                        backgroundColor: 'rgba(217, 183, 99, 0.1)',
                      },
                    }}
                  >
                    Rever Gabarito
                  </Button>
                </Paper>
              );
            })}
          </Stack>
        </Paper>
      )}

      {/* View Mode Toggle and Section Title */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          mb: 2.5,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Questões da Prova ({questions.length})
        </Typography>

        {questions.length > 1 && (
          <ToggleButtonGroup
            size="small"
            value={viewMode}
            exclusive
            onChange={(_, val) => val && handleViewModeChange(val)}
          >
            <ToggleButton value="single" sx={{ px: 2, fontWeight: 700, textTransform: 'none' }}>
              Questão a Questão (Foco)
            </ToggleButton>
            <ToggleButton value="all" sx={{ px: 2, fontWeight: 700, textTransform: 'none' }}>
              Ver Todas em Lista
            </ToggleButton>
          </ToggleButtonGroup>
        )}
      </Box>

      {/* Top Navigator */}
      {questions.length > 0 && (
        <TestQuestionsNavigator
          totalQuestions={questions.length}
          activeIndex={activeQuestionIndex}
          isQuestionAnswered={(idx) => Boolean(questions[idx] && attemptedQuestionIds.has(questions[idx].id))}
          onSelectQuestion={(idx) => {
            handleSelectQuestion(idx);
          }}
          questionIdentifiers={questions.map((q) => q.identifier)}
        />
      )}

      {/* Single Question View Mode */}
      {viewMode === 'single' && questions.length > 0 && questions[activeQuestionIndex] && (
        <Box>
          <QuestionCard
            question={questions[activeQuestionIndex]}
            onBookmarkClick={onBookmarkQuestion}
          />

          {/* Lousa de Raciocínio Interativa da Questão */}
          <Box sx={{ mt: 3 }}>
            <QuestionWhiteboard
              key={questions[activeQuestionIndex].id}
              questionId={questions[activeQuestionIndex].id}
            />
          </Box>

          {/* Navigation Controls: Previous & Next (Free to navigate without requiring answer) */}
          <Paper
            elevation={2}
            sx={{
              p: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              mt: 3,
            }}
          >
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              disabled={activeQuestionIndex === 0}
              onClick={() => {
                const nextIdx = Math.max(0, activeQuestionIndex - 1);
                handleSelectQuestion(nextIdx);
                window.scrollTo({ top: 250, behavior: 'smooth' });
              }}
              sx={{ fontWeight: 700, px: 2.5, borderRadius: 2 }}
            >
              Questão Anterior
            </Button>

            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              Questão {activeQuestionIndex + 1} de {questions.length}
            </Typography>

            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              disabled={activeQuestionIndex === questions.length - 1}
              onClick={() => {
                const nextIdx = Math.min(questions.length - 1, activeQuestionIndex + 1);
                handleSelectQuestion(nextIdx);
                window.scrollTo({ top: 250, behavior: 'smooth' });
              }}
              sx={{
                fontWeight: 700,
                px: 2.5,
                borderRadius: 2,
                backgroundColor: PALETTE_COLORS.primary,
                color: '#1a1e24',
              }}
            >
              Próxima Questão
            </Button>
          </Paper>
        </Box>
      )}

      {/* All Questions View Mode */}
      {viewMode === 'all' && (
        <Box>
          {questions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              onBookmarkClick={onBookmarkQuestion}
            />
          ))}
        </Box>
      )}

      <SaveTestToFolderModal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        test={test}
      />

      <Snackbar
        open={toastOpen}
        autoHideDuration={3000}
        onClose={() => setToastOpen(false)}
        message="Link da prova copiado para a área de transferência!"
      />

      <Dialog
        open={deleteDialogOpen}
        onClose={() => !isDeleting && setDeleteDialogOpen(false)}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {isAdmin && test?.createdByUser?.id !== user?.id
            ? 'Moderação: Excluir Prova Pública'
            : 'Excluir Prova'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {isAdmin && test?.createdByUser?.id !== user?.id
              ? `Como Administrador, você está prestes a remover a prova pública "${test?.name}" criada por outro usuário. Deseja continuar?`
              : `Tem certeza que deseja excluir a prova "${test?.name}"? Esta ação removerá a prova e suas vinculações.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={isDeleting}
            sx={{ color: 'text.secondary' }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              if (!test) return;
              setIsDeleting(true);
              try {
                await deleteTest(test.id);
                setDeleteDialogOpen(false);
                navigate('/provas');
              } catch (err) {
                console.error('Erro ao excluir prova:', err);
              } finally {
                setIsDeleting(false);
              }
            }}
            disabled={isDeleting}
            sx={{ fontWeight: 700 }}
          >
            {isDeleting ? 'Excluindo...' : 'Excluir Prova'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
