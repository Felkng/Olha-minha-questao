import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Stack,
  Chip,
  Skeleton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import { useParams, useNavigate } from 'react-router-dom';
import { Question } from '../types';
import { getOriginQuestions, getAreaQuestions, getOrigins, getAreas } from '../services/api';
import { QuestionCard } from '../components/questions/QuestionCard';
import { QuestionSkeleton } from '../components/skeletons';
import { PALETTE_COLORS } from '../theme/theme';

interface CategoryQuestionsPageProps {
  type: 'origin' | 'area';
  onBookmarkClick?: (question: Question) => void;
  savedQuestionIds?: Set<number>;
}

export const CategoryQuestionsPage: React.FC<CategoryQuestionsPageProps> = ({
  type,
  onBookmarkClick,
  savedQuestionIds = new Set(),
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [categoryName, setCategoryName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (id) {
      loadData(Number(id));
    }
  }, [id, type]);

  const loadData = async (catId: number) => {
    setLoading(true);
    try {
      if (type === 'origin') {
        const [qList, origins] = await Promise.all([
          getOriginQuestions(catId),
          getOrigins(),
        ]);
        setQuestions(qList);
        const origin = origins.find((o) => o.id === catId);
        setCategoryName(origin ? origin.name : `Banca #${catId}`);
      } else {
        const [qList, areas] = await Promise.all([
          getAreaQuestions(catId),
          getAreas(),
        ]);
        setQuestions(qList);
        const area = areas.find((a) => a.id === catId);
        setCategoryName(area ? area.name : `Área #${catId}`);
      }
    } catch (err) {
      console.error('Erro ao carregar questões da categoria:', err);
    } finally {
      setLoading(false);
    }
  };

  const backRoute = type === 'origin' ? '/bancas' : '/areas';
  const backLabel = type === 'origin' ? 'Voltar para Bancas' : 'Voltar para Áreas';
  const titlePrefix = type === 'origin' ? 'Banca' : 'Área';

  if (loading) {
    return (
      <Box sx={{ mb: 6 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(backRoute)}
          sx={{ mb: 3, color: 'text.secondary', fontWeight: 600 }}
        >
          {backLabel}
        </Button>
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" width={280} height={40} sx={{ mb: 1 }} />
          <Skeleton variant="text" width={380} height={20} />
        </Box>
        <QuestionSkeleton />
        <QuestionSkeleton />
        <QuestionSkeleton />
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 6 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(backRoute)}
        sx={{ mb: 3, color: 'text.secondary', fontWeight: 600 }}
      >
        {backLabel}
      </Button>

      <Box sx={{ mb: 4 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            {titlePrefix}: {categoryName}
          </Typography>
          <Chip
            icon={<WhatshotIcon sx={{ color: `${PALETTE_COLORS.danger} !important` }} />}
            label="Mais Respondidas"
            sx={{
              backgroundColor: 'rgba(250, 66, 75, 0.12)',
              color: PALETTE_COLORS.danger,
              fontWeight: 700,
            }}
          />
        </Stack>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Exibindo {questions.length} questões ordenadas pelo maior número de resoluções e data decrescente.
        </Typography>
      </Box>

      {questions.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Nenhuma questão cadastrada para esta {type === 'origin' ? 'banca' : 'área'}.
        </Alert>
      ) : (
        <Box>
          {questions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              onBookmarkClick={onBookmarkClick}
              isSavedInAnyFolder={savedQuestionIds.has(q.id)}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};
