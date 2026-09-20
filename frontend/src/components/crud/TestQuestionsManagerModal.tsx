import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Paper,
  Box,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import AddIcon from '@mui/icons-material/Add';
import { Question, Test, TestCard } from '../../types';
import { deleteQuestion, getQuestions, updateQuestion } from '../../services/api';
import { PALETTE_COLORS } from '../../theme/theme';
import { EditQuestionModal } from './EditQuestionModal';
import { CreateQuestionModal } from './CreateQuestionModal';

interface TestQuestionsManagerModalProps {
  open: boolean;
  test: Test | TestCard | null;
  onClose: () => void;
  onUpdated?: () => void;
}

export const TestQuestionsManagerModal: React.FC<TestQuestionsManagerModalProps> = ({
  open,
  test,
  onClose,
  onUpdated,
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Submodais
  const [selectedQuestionForEdit, setSelectedQuestionForEdit] = useState<Question | null>(null);
  const [openCreateQuestion, setOpenCreateQuestion] = useState(false);

  // Confirmação de exclusão
  const [deleteConfirmQuestionId, setDeleteConfirmQuestionId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadQuestions = async () => {
    if (!test) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await getQuestions({ testId: test.id, size: 100 });
      setQuestions(res.content || []);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Erro ao carregar questões da prova.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && test) {
      loadQuestions();
    }
  }, [open, test]);

  const handleUnlinkFromTest = async (q: Question) => {
    try {
      await updateQuestion(q.id, {
        enunciado: q.enunciado,
        identifier: q.identifier,
        year: q.year || new Date().getFullYear(),
        originId: q.originId,
        areaId: q.areaId || 1,
        subjectId: q.subjectId,
        testId: undefined, // desvincula da prova
        alternatives: q.alternatives.map((a) => ({
          identifier: a.identifier,
          text: a.text,
          isCorrect: a.isCorrect || a.id === q.correctAlternativeId,
        })),
      });
      loadQuestions();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Erro ao desvincular questão da prova.');
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    setDeleting(true);
    try {
      await deleteQuestion(id);
      setDeleteConfirmQuestionId(null);
      loadQuestions();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Erro ao excluir questão.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            Gerenciar Questões da Prova: {test?.name} ({test?.year})
            <Typography variant="body2" color="text.secondary">
              Total de questões: {questions.length}
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateQuestion(true)}
            sx={{ fontWeight: 700, backgroundColor: PALETTE_COLORS.primary, color: '#1a1e24' }}
          >
            Nova Questão nesta Prova
          </Button>
        </DialogTitle>

        <DialogContent dividers sx={{ minHeight: 350, maxHeight: '60vh', overflowY: 'auto' }}>
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage(null)}>
              {errorMessage}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={32} />
            </Box>
          ) : questions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography color="text.secondary">
                Nenhuma questão associada a esta prova até o momento.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1.5}>
              {questions.map((q, idx) => (
                <Paper
                  key={q.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: 1.5,
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {q.identifier ? `Questão ${q.identifier}` : `Item #${idx + 1}`}
                      {q.areaName && ` • ${q.areaName}`}
                      {q.subjectName && ` / ${q.subjectName}`}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        mt: 0.5,
                      }}
                    >
                      {q.enunciado}
                    </Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                      {q.alternatives?.length || 0} alternativas
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={0.5} sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}>
                    <Tooltip title="Editar questão e alternativas">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => setSelectedQuestionForEdit(q)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Desvincular questão desta prova (mantém como avulsa)">
                      <IconButton
                        size="small"
                        color="warning"
                        onClick={() => handleUnlinkFromTest(q)}
                      >
                        <LinkOffIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Excluir questão permanentemente">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteConfirmQuestionId(q.id)}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} sx={{ color: 'text.secondary' }}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Edição de Questão */}
      <EditQuestionModal
        open={Boolean(selectedQuestionForEdit)}
        question={selectedQuestionForEdit}
        onClose={() => setSelectedQuestionForEdit(null)}
        onUpdated={() => {
          loadQuestions();
          if (onUpdated) onUpdated();
        }}
      />

      {/* Modal de Criação de Questão preenchida com esta prova */}
      <CreateQuestionModal
        open={openCreateQuestion}
        onClose={() => setOpenCreateQuestion(false)}
        onCreated={() => {
          setOpenCreateQuestion(false);
          loadQuestions();
          if (onUpdated) onUpdated();
        }}
      />

      {/* Diálogo de confirmação de exclusão */}
      <Dialog
        open={Boolean(deleteConfirmQuestionId)}
        onClose={() => setDeleteConfirmQuestionId(null)}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir permanentemente esta questão? Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmQuestionId(null)} disabled={deleting}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => deleteConfirmQuestionId && handleDeleteQuestion(deleteConfirmQuestionId)}
            disabled={deleting}
          >
            {deleting ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
