import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Paper,
  Typography,
  Stack,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShareIcon from '@mui/icons-material/Share';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';
import { useParams, useNavigate } from 'react-router-dom';
import { Question } from '../types';
import { getQuestionById } from '../services/api';
import { QuestionCard } from '../components/questions/QuestionCard';
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
  const [toastOpen, setToastOpen] = useState<boolean>(false);

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/questoes')}
          sx={{ color: 'text.secondary', fontWeight: 600 }}
        >
          Voltar para Questões
        </Button>

        <Button
          variant="outlined"
          startIcon={<ShareIcon />}
          onClick={handleShare}
          sx={{ borderRadius: 2, fontWeight: 700 }}
        >
          Compartilhar Questão
        </Button>
      </Box>

      {/* URL Banner info */}
      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          px: 2,
          mb: 3,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
          backgroundColor: 'background.paper',
          borderColor: 'divider',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ overflow: 'hidden' }}>
          <LinkIcon sx={{ color: PALETTE_COLORS.primary, fontSize: 20 }} />
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            URL da Questão:
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'monospace',
              color: PALETTE_COLORS.primary,
              fontWeight: 600,
              wordBreak: 'break-all',
            }}
          >
            {window.location.href}
          </Typography>
        </Stack>
        <Button
          size="small"
          startIcon={<ContentCopyIcon fontSize="small" />}
          onClick={handleShare}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Copiar Link
        </Button>
      </Paper>

      <QuestionCard
        question={question}
        onBookmarkClick={onBookmarkClick}
        showViewDetails={false}
      />

      <Snackbar
        open={toastOpen}
        autoHideDuration={3000}
        onClose={() => setToastOpen(false)}
        message="Link da questão copiado para a área de transferência!"
      />
    </Box>
  );
};
