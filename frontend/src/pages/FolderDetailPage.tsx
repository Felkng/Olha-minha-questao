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
  IconButton,
  Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShareIcon from '@mui/icons-material/Share';
import FolderSpecialOutlinedIcon from '@mui/icons-material/FolderSpecialOutlined';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FlipCameraAndroidIcon from '@mui/icons-material/FlipCameraAndroid';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PublicIcon from '@mui/icons-material/Public';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useParams, useNavigate } from 'react-router-dom';
import { Flashcard, Folder, Question, TestCard } from '../types';
import {
  deleteFlashcard,
  getFolderById,
  getFlashcardsInFolder,
  getQuestionsInFolder,
  getTestsInFolder,
  toggleFlashcardVisibility,
} from '../services/api';
import { QuestionCard } from '../components/questions/QuestionCard';
import { PALETTE_COLORS } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../theme/ThemeContext';
import { SaveFlashcardToFolderModal } from '../components/folders/SaveFlashcardToFolderModal';
import { EditFlashcardModal } from '../components/crud/EditFlashcardModal';

interface FolderDetailPageProps {
  onBookmarkQuestion?: (question: Question) => void;
}

export const FolderDetailPage: React.FC<FolderDetailPageProps> = ({
  onBookmarkQuestion,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';

  const [folder, setFolder] = useState<Folder | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [tests, setTests] = useState<TestCard[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toastOpen, setToastOpen] = useState<boolean>(false);

  // Flashcards state
  const [flippedCardIds, setFlippedCardIds] = useState<Set<number>>(new Set());
  const [saveToFolderOpen, setSaveToFolderOpen] = useState<boolean>(false);
  const [selectedCardForFolder, setSelectedCardForFolder] = useState<Flashcard | null>(null);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [cardToEdit, setCardToEdit] = useState<Flashcard | null>(null);

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
      } else if (folderData.folderType === 'FLASHCARD') {
        const fList = await getFlashcardsInFolder(fId);
        setFlashcards(fList);
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

  const toggleCardFlip = (cardId: number) => {
    setFlippedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  };

  const handleToggleFlashcardVisibility = async (cardId: number) => {
    try {
      await toggleFlashcardVisibility(cardId);
      if (id) loadFolderData(Number(id));
    } catch (err) {
      console.error('Erro ao alterar visibilidade do flashcard:', err);
    }
  };

  const handleDeleteFlashcard = async (cardId: number) => {
    if (window.confirm('Tem certeza que deseja excluir este flashcard?')) {
      try {
        await deleteFlashcard(cardId);
        if (id) loadFolderData(Number(id));
      } catch (err) {
        console.error('Erro ao excluir flashcard:', err);
      }
    }
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
  const isFlashcardFolder = folder.folderType === 'FLASHCARD';

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

        <Stack direction="row" spacing={1.5}>
          {isFlashcardFolder && (
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={() => navigate(`/flashcards/estudo?folderId=${folder.id}`)}
              disabled={flashcards.length === 0}
              sx={{
                borderRadius: 2,
                fontWeight: 700,
                backgroundColor: PALETTE_COLORS.success,
                color: '#0f2910',
              }}
            >
              Praticar Deck ({flashcards.length})
            </Button>
          )}

          <Button
            variant="outlined"
            startIcon={<ShareIcon />}
            onClick={handleShare}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Compartilhar Pasta
          </Button>
        </Stack>
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
            label={
              isTestFolder
                ? 'Caderno de Provas'
                : isFlashcardFolder
                ? 'Deck de Flashcards'
                : 'Caderno de Questões'
            }
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
            : isFlashcardFolder
            ? `${flashcards.length} flashcards organizados neste deck`
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
                    <Chip size="small" icon={<QuizOutlinedIcon fontSize="small" />} label={`${t.questionCount ?? 0} q.`} />
                  </Stack>
                  <Button variant="outlined" fullWidth endIcon={<ArrowForwardIcon />}>
                    Visualizar Prova
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )
      ) : isFlashcardFolder ? (
        flashcards.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Nenhum flashcard salvo neste deck ainda.
          </Alert>
        ) : (
          <Grid container spacing={2.5}>
            {flashcards.map((card) => {
              const isFlipped = flippedCardIds.has(card.id);
              const isOwner = user?.id && card.createdByUser?.id === user.id;
              const canEdit = isOwner || isAdmin;
              const canDelete = isOwner || (isAdmin && card.isPublic);

              return (
                <Grid item xs={12} sm={6} md={4} key={card.id}>
                  <Paper
                    elevation={3}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: '1px solid',
                      borderColor: isFlipped ? PALETTE_COLORS.primary : 'divider',
                      backgroundColor: isFlipped
                        ? isDark
                          ? 'rgba(217, 183, 99, 0.06)'
                          : 'rgba(217, 183, 99, 0.08)'
                        : 'background.paper',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Box>
                      {/* Top Metadata & Actions */}
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2, gap: 1 }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, alignItems: 'center', flex: 1, minWidth: 0 }}>
                          {card.areaName && (
                            <Chip
                              size="small"
                              label={card.areaName}
                              sx={{
                                fontWeight: 700,
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                              }}
                            />
                          )}
                          {card.subjectName && (
                            <Chip
                              size="small"
                              label={card.subjectName}
                              variant="outlined"
                              sx={{ fontWeight: 600 }}
                            />
                          )}
                        </Box>

                        <Stack direction="row" spacing={0.5} alignItems="center">
                          {/* Salvar / Mover para Pasta */}
                          <Tooltip title={card.folderId ? `Salvo na pasta "${card.folderName}" (Clique para alterar)` : 'Salvar em Pasta / Deck'}>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedCardForFolder(card);
                                setSaveToFolderOpen(true);
                              }}
                            >
                              {card.folderId ? (
                                <BookmarkIcon fontSize="small" sx={{ color: card.folderColor || PALETTE_COLORS.primary }} />
                              ) : (
                                <BookmarkBorderIcon fontSize="small" />
                              )}
                            </IconButton>
                          </Tooltip>

                          <Tooltip title={card.isPublic ? 'Público' : 'Privado'}>
                            <IconButton
                              size="small"
                              onClick={() => isOwner && handleToggleFlashcardVisibility(card.id)}
                              disabled={!isOwner}
                              sx={{ cursor: isOwner ? 'pointer' : 'default' }}
                            >
                              {card.isPublic ? (
                                <PublicIcon fontSize="small" sx={{ color: PALETTE_COLORS.success }} />
                              ) : (
                                <LockOutlinedIcon fontSize="small" sx={{ color: PALETTE_COLORS.primary }} />
                              )}
                            </IconButton>
                          </Tooltip>

                          {canEdit && (
                            <Tooltip title="Editar flashcard">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setCardToEdit(card);
                                  setEditModalOpen(true);
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {canDelete && (
                            <Tooltip title={isAdmin && !isOwner ? 'Excluir como Moderador Admin' : 'Excluir flashcard'}>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteFlashcard(card.id)}
                                sx={{ color: 'text.secondary', '&:hover': { color: PALETTE_COLORS.danger } }}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </Box>

                      {/* Content Section */}
                      <Box sx={{ my: 2 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 800,
                            color: isFlipped ? PALETTE_COLORS.primary : 'text.secondary',
                            display: 'block',
                            mb: 0.5,
                          }}
                        >
                          {isFlipped ? 'VERSO (RESPOSTA):' : 'FRENTE (PERGUNTA):'}
                        </Typography>

                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: isFlipped ? 500 : 700,
                            minHeight: 64,
                            lineHeight: 1.5,
                          }}
                        >
                          {isFlipped ? card.back : card.front}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Bottom Actions */}
                    <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Button
                        size="small"
                        startIcon={<FlipCameraAndroidIcon />}
                        onClick={() => toggleCardFlip(card.id)}
                        sx={{ fontWeight: 700, textTransform: 'none' }}
                      >
                        {isFlipped ? 'Ver Pergunta' : 'Revelar Resposta'}
                      </Button>

                      {card.createdByUser && (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Por: {card.createdByUser.name}
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
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

      {/* Modais de Edição e Salvar em Pasta */}
      <SaveFlashcardToFolderModal
        open={saveToFolderOpen}
        flashcard={selectedCardForFolder}
        onClose={() => {
          setSaveToFolderOpen(false);
          setSelectedCardForFolder(null);
        }}
        onSavedStatusChange={() => {
          if (id) loadFolderData(Number(id));
        }}
      />

      <EditFlashcardModal
        open={editModalOpen}
        flashcard={cardToEdit}
        onClose={() => {
          setEditModalOpen(false);
          setCardToEdit(null);
        }}
        onUpdated={() => {
          if (id) loadFolderData(Number(id));
        }}
      />

      <Snackbar
        open={toastOpen}
        autoHideDuration={3000}
        onClose={() => setToastOpen(false)}
        message="Link da pasta copiado para a área de transferência!"
      />
    </Box>
  );
};
