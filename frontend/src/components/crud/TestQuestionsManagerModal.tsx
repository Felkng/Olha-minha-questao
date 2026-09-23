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
  TextField,
  InputAdornment,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import { Question, Test, TestCard } from '../../types';
import {
  addQuestionToTest,
  deleteQuestion,
  getQuestions,
  getTestEvaluation,
  removeQuestionFromTest,
} from '../../services/api';
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

  // Diálogo de vincular questão existente (N:N)
  const [openLinkExistingDialog, setOpenLinkExistingDialog] = useState(false);
  const [existingSearch, setExistingSearch] = useState('');
  const [existingQuestions, setExistingQuestions] = useState<Question[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [linkingQuestionId, setLinkingQuestionId] = useState<number | null>(null);

  // Confirmação de exclusão
  const [deleteConfirmQuestionId, setDeleteConfirmQuestionId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadQuestions = async () => {
    if (!test) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await getTestEvaluation(test.id);
      setQuestions(res.questions || []);
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

  const handleSearchExistingQuestions = async () => {
    setLoadingExisting(true);
    try {
      const res = await getQuestions({
        search: existingSearch.trim() || undefined,
        size: 20,
      });
      setExistingQuestions(res.content || []);
    } catch (err) {
      console.error('Erro ao buscar questões existentes:', err);
    } finally {
      setLoadingExisting(false);
    }
  };

  useEffect(() => {
    if (openLinkExistingDialog) {
      handleSearchExistingQuestions();
    }
  }, [openLinkExistingDialog]);

  const handleLinkQuestion = async (qId: number) => {
    if (!test) return;
    setLinkingQuestionId(qId);
    try {
      await addQuestionToTest(test.id, qId);
      await loadQuestions();
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error('Erro ao vincular questão à prova:', err);
    } finally {
      setLinkingQuestionId(null);
    }
  };

  const handleUnlinkFromTest = async (q: Question) => {
    if (!test) return;
    try {
      await removeQuestionFromTest(test.id, q.id);
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

  const currentQuestionIds = new Set(questions.map((q) => q.id));

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Box>
            Gerenciar Questões da Prova: {test?.name} ({test?.year})
            <Typography variant="body2" color="text.secondary">
              Total de questões: {questions.length}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<BookmarkAddIcon />}
              onClick={() => setOpenLinkExistingDialog(true)}
              sx={{ fontWeight: 700, textTransform: 'none' }}
            >
              Vincular Questão Existente
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setOpenCreateQuestion(true)}
              sx={{ fontWeight: 700, backgroundColor: PALETTE_COLORS.primary, color: '#1a1e24', textTransform: 'none' }}
            >
              Nova Questão
            </Button>
          </Stack>
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

                    <Tooltip title="Desvincular questão desta prova (mantém no repositório)">
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

      {/* Modal para Vincular Questões Existentes (N:N) */}
      <Dialog
        open={openLinkExistingDialog}
        onClose={() => setOpenLinkExistingDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Vincular Questão Existente ao Simulado / Prova
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Buscar por texto do enunciado ou identificador..."
              value={existingSearch}
              onChange={(e) => setExistingSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchExistingQuestions()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              onClick={handleSearchExistingQuestions}
              disabled={loadingExisting}
              sx={{ backgroundColor: PALETTE_COLORS.primary, color: '#1a1e24', fontWeight: 700 }}
            >
              Buscar
            </Button>
          </Box>

          {loadingExisting ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : existingQuestions.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              Nenhuma questão encontrada. Digite um termo e clique em Buscar.
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {existingQuestions.map((eq) => {
                const isAlreadyLinked = currentQuestionIds.has(eq.id);
                return (
                  <Paper
                    key={eq.id}
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {eq.identifier ? `Questão ${eq.identifier}` : `Questão #${eq.id}`}
                        {eq.areaName && ` • ${eq.areaName}`}
                        {eq.subjectName && ` / ${eq.subjectName}`}
                        {eq.year && ` (${eq.year})`}
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
                        {eq.enunciado}
                      </Typography>
                    </Box>

                    <Button
                      size="small"
                      variant={isAlreadyLinked ? 'outlined' : 'contained'}
                      disabled={isAlreadyLinked || linkingQuestionId === eq.id}
                      onClick={() => handleLinkQuestion(eq.id)}
                      sx={{
                        fontWeight: 700,
                        textTransform: 'none',
                        ...(isAlreadyLinked
                          ? {}
                          : { backgroundColor: PALETTE_COLORS.primary, color: '#1a1e24' }),
                      }}
                    >
                      {isAlreadyLinked ? 'Já Vinculada' : linkingQuestionId === eq.id ? 'Vinculando...' : 'Vincular'}
                    </Button>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenLinkExistingDialog(false)}>
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
