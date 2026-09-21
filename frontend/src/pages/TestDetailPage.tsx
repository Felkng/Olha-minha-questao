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
  Snackbar,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ShareIcon from '@mui/icons-material/Share';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CategoryIcon from '@mui/icons-material/Category';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Question, Test } from '../types';
import { getTestById, getTestEvaluation } from '../services/api';
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
  const { attemptedQuestionIds } = useAuth();

  const initialQ = Number(searchParams.get('q'));
  const initialMode = searchParams.get('mode') as 'single' | 'all' | null;

  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(
    initialQ > 0 ? initialQ - 1 : 0
  );
  const [viewMode, setViewMode] = useState<'single' | 'all'>(
    initialMode === 'all' ? 'all' : 'single'
  );

  const [saveModalOpen, setSaveModalOpen] = useState<boolean>(false);
  const [toastOpen, setToastOpen] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      loadTest(Number(id));
    }
  }, [id]);

  const loadTest = async (tId: number) => {
    setLoading(true);
    try {
      const [testData, evalData] = await Promise.all([
        getTestById(tId),
        getTestEvaluation(tId),
      ]);
      setTest(testData);
      setQuestions(evalData.questions || []);
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
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: PALETTE_COLORS.primary }} />
      </Box>
    );
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
            </Stack>
          </Box>

          <Stack direction="row" spacing={1.5}>
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
    </Box>
  );
};
