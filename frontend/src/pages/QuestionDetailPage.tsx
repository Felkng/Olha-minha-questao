import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useParams, useNavigate } from 'react-router-dom';
import { Question } from '../types';
import { getQuestionById } from '../services/api';
import { QuestionCard } from '../components/questions/QuestionCard';
import { QuestionWhiteboard } from '../components/whiteboard/QuestionWhiteboard';
import { PALETTE_COLORS } from '../theme/theme';

interface QuestionDetailPageProps {
  onBookmarkClick?: (question: Question) => void;
}

export const QuestionDetailPage: React.FC<QuestionDetailPageProps> = ({
  onBookmarkClick,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (id) {
      loadQuestion(Number(id));
    }
  }, [id]);

  const loadQuestion = async (qId: number) => {
    setLoading(true);
    try {
      const data = await getQuestionById(qId);
      setQuestion(data);
    } catch (err) {
      console.error('Erro ao carregar questão:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: PALETTE_COLORS.primary }} />
      </Box>
    );
  }

  if (!question) {
    return (
      <Box sx={{ mb: 6 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/questoes')}
          sx={{ mb: 3, color: 'text.secondary', fontWeight: 600 }}
        >
          Voltar para Banco de Questões
        </Button>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Questão não encontrada no sistema.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 6 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/questoes')}
          sx={{ color: 'text.secondary', fontWeight: 600 }}
        >
          Voltar para Questões
        </Button>
      </Box>

      {/* Card da Questão */}
      <QuestionCard
        question={question}
        onBookmarkClick={onBookmarkClick}
        showViewDetails={false}
      />

      {/* Lousa de Raciocínio Interativa */}
      <QuestionWhiteboard questionId={question.id} />
    </Box>
  );
};

