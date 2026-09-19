import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
  Stack,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShareIcon from '@mui/icons-material/Share';
import FolderSpecialOutlinedIcon from '@mui/icons-material/FolderSpecialOutlined';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useParams, useNavigate } from 'react-router-dom';
import { Folder, Question, TestCard } from '../types';
import {
  getFolderById,
  getQuestionsInFolder,
  getTestsInFolder,
} from '../services/api';
import { QuestionCard } from '../components/questions/QuestionCard';
import { PALETTE_COLORS } from '../theme/theme';

interface FolderDetailPageProps {
  onBookmarkQuestion?: (question: Question) => void;
}

export const FolderDetailPage: React.FC<FolderDetailPageProps> = ({
  onBookmarkQuestion,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [folder, setFolder] = useState<Folder | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [tests, setTests] = useState<TestCard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toastOpen, setToastOpen] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      loadFolderData(Number(id));
    }
  }, [id]);

  const loadFolderData = async (fId: number) => {
    setLoading(true);
    try {
      const folderData = await getFolderById(fId);
      setFolder(folderData);

      if (folderData.folderType === 'TEST') {
        const tList = await getTestsInFolder(fId);
        setTests(tList);
      } else {
        const qList = await getQuestionsInFolder(fId);
        setQuestions(qList);
      }
    } catch (err) {
      console.error('Erro ao carregar dados da pasta:', err);
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

  if (!folder) {
    return (
      <Box sx={{ mb: 6 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/pastas')}
          sx={{ mb: 3, color: 'text.secondary', fontWeight: 600 }}
        >
          Voltar para Pastas
        </Button>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Pasta não encontrada no sistema.
        </Alert>
      </Box>
    );
  }

  const isTestFolder = folder.folderType === 'TEST';

  return (
    <Box sx={{ mb: 6 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/pastas')}
          sx={{ color: 'text.secondary', fontWeight: 600 }}
        >
          Voltar para Pastas
        </Button>

        <Button
          variant="outlined"
          startIcon={<ShareIcon />}
          onClick={handleShare}
          sx={{ borderRadius: 2, fontWeight: 700 }}
        >
          Compartilhar Pasta
        </Button>
      </Box>

      {/* Header da Pasta */}
      <Paper
        elevation={4}
        sx={{
          p: 4,
          borderRadius: 3,
          mb: 4,
          borderLeft: `8px solid ${folder.color}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
          <FolderSpecialOutlinedIcon sx={{ color: folder.color, fontSize: 36 }} />
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            {folder.name}
          </Typography>
          <Chip
            label={isTestFolder ? 'Caderno de Provas' : 'Caderno de Questões'}
            size="small"
            sx={{
              backgroundColor: `${folder.color}25`,
              color: folder.color,
              fontWeight: 800,
            }}
          />
        </Box>

        {folder.description && (
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
            {folder.description}
          </Typography>
        )}

        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
          {isTestFolder
            ? `${tests.length} provas organizadas nesta pasta`
            : `${questions.length} questões organizadas nesta pasta`}
        </Typography>
      </Paper>

      {/* Conteúdo da Pasta */}
      {isTestFolder ? (
        tests.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Nenhuma prova salva nesta pasta ainda.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {tests.map((t) => (
              <Grid item xs={12} sm={6} md={4} key={t.id}>
                <Paper
                  elevation={4}
                  onClick={() => navigate(`/provas/${t.id}`)}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-3px)' },
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    {t.name}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <Chip size="small" label={`Ano: ${t.year}`} />
                    <Chip size="small" icon={<QuizOutlinedIcon fontSize="small" />} label={`${t.questionCount} q.`} />
                  </Stack>
                  <Button variant="outlined" fullWidth endIcon={<ArrowForwardIcon />}>
                    Visualizar Prova
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )
      ) : (
        questions.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Nenhuma questão salva nesta pasta ainda.
          </Alert>
        ) : (
          questions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              onBookmarkClick={onBookmarkQuestion}
              isSavedInAnyFolder={true}
            />
          ))
        )
      )}

      <Snackbar
        open={toastOpen}
        autoHideDuration={3000}
        onClose={() => setToastOpen(false)}
        message="Link da pasta copiado para a área de transferência!"
      />
    </Box>
  );
};
