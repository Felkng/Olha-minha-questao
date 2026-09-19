import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Stack,
} from '@mui/material';
import FolderSpecialOutlinedIcon from '@mui/icons-material/FolderSpecialOutlined';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import { Folder, Question } from '../types';
import {
  createFolder,
  deleteFolder,
  getFolders,
  getQuestionsInFolder,
} from '../services/api';
import { QuestionCard } from '../components/questions/QuestionCard';
import { PALETTE_COLORS } from '../theme/theme';

interface FoldersPageProps {
  onOpenSaveModal: (question: Question) => void;
}

const COLOR_OPTIONS = [
  { hex: PALETTE_COLORS.primary, label: 'Ocre' },
  { hex: PALETTE_COLORS.secondary, label: 'Azul' },
  { hex: PALETTE_COLORS.success, label: 'Verde' },
  { hex: PALETTE_COLORS.danger, label: 'Vermelho' },
  { hex: PALETTE_COLORS.warning, label: 'Amarelo' },
  { hex: '#b388ff', label: 'Roxo' },
  { hex: '#ff80ab', label: 'Rosa' },
];

export const FoldersPage: React.FC<FoldersPageProps> = ({ onOpenSaveModal }) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [folderQuestions, setFolderQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState<boolean>(false);

  // Modal para criar nova pasta
  const [openCreateDialog, setOpenCreateDialog] = useState<boolean>(false);
  const [folderName, setFolderName] = useState<string>('');
  const [folderDesc, setFolderDesc] = useState<string>('');
  const [folderColor, setFolderColor] = useState<string>(PALETTE_COLORS.primary);
  const [saving, setSaving] = useState<boolean>(false);

  const loadFolders = async () => {
    setLoading(true);
    try {
      const data = await getFolders();
      setFolders(data);
    } catch (err) {
      console.error('Erro ao carregar pastas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFolders();
  }, []);

  const handleOpenFolder = async (folder: Folder) => {
    setSelectedFolder(folder);
    setLoadingQuestions(true);
    try {
      const questions = await getQuestionsInFolder(folder.id);
      setFolderQuestions(questions);
    } catch (err) {
      console.error('Erro ao carregar questões da pasta:', err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleBackToFolders = () => {
    setSelectedFolder(null);
    setFolderQuestions([]);
    loadFolders();
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    setSaving(true);
    try {
      await createFolder({
        name: folderName.trim(),
        description: folderDesc.trim(),
        color: folderColor,
      });
      setFolderName('');
      setFolderDesc('');
      setOpenCreateDialog(false);
      loadFolders();
    } catch (err) {
      console.error('Erro ao criar pasta:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFolder = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir esta pasta?')) {
      try {
        await deleteFolder(id);
        if (selectedFolder?.id === id) {
          setSelectedFolder(null);
        }
        loadFolders();
      } catch (err) {
        console.error('Erro ao excluir pasta:', err);
      }
    }
  };

  return (
    <Box>
      {/* Visualização de Questões dentro de uma Pasta Selecionada */}
      {selectedFolder ? (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleBackToFolders}
              variant="outlined"
              size="small"
              sx={{ borderRadius: 2 }}
            >
              Voltar para Pastas
            </Button>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
              <Box
                sx={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  backgroundColor: selectedFolder.color,
                }}
              />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {selectedFolder.name}
              </Typography>
              <Chip
                label={`${folderQuestions.length} questões`}
                size="small"
                sx={{
                  backgroundColor: `${selectedFolder.color}25`,
                  color: selectedFolder.color,
                  fontWeight: 700,
                }}
              />
            </Box>
          </Box>

          {selectedFolder.description && (
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              {selectedFolder.description}
            </Typography>
          )}

          {loadingQuestions ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress sx={{ color: selectedFolder.color }} />
            </Box>
          ) : folderQuestions.length > 0 ? (
            <Stack spacing={0}>
              {folderQuestions.map((q) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  onBookmarkClick={onOpenSaveModal}
                  isSavedInAnyFolder={true}
                />
              ))}
            </Stack>
          ) : (
            <Paper elevation={4} sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
              <MenuBookOutlinedIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Nenhuma questão nesta pasta
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                Navegue pelo Banco de Questões e clique no ícone de bookmark para salvar questões nesta pasta.
              </Typography>
            </Paper>
          )}
        </Box>
      ) : (
        /* Visualização da Lista de Pastas */
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Minhas Pastas & Cadernos de Estudo
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Organize suas questões salvas em pastas personalizadas com cores exclusivas
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setOpenCreateDialog(true)}
              sx={{ fontWeight: 700 }}
            >
              Nova Pasta
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress sx={{ color: PALETTE_COLORS.primary }} />
            </Box>
          ) : folders.length > 0 ? (
            <Grid container spacing={2.5}>
              {folders.map((folder) => (
                <Grid item xs={12} sm={6} md={4} key={folder.id}>
                  <Paper
                    elevation={4}
                    onClick={() => handleOpenFolder(folder)}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      cursor: 'pointer',
                      position: 'relative',
                      borderLeft: `6px solid ${folder.color}`,
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FolderSpecialOutlinedIcon sx={{ color: folder.color, fontSize: 26 }} />
                        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                          {folder.name}
                        </Typography>
                      </Box>
                      <Tooltip title="Excluir pasta">
                        <IconButton
                          size="small"
                          onClick={(e) => handleDeleteFolder(e, folder.id)}
                          sx={{ color: 'text.secondary', '&:hover': { color: PALETTE_COLORS.danger } }}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        mb: 2,
                        minHeight: 40,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {folder.description || 'Sem descrição.'}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Chip
                        label={`${folder.questionCount ?? 0} questões`}
                        size="small"
                        sx={{
                          backgroundColor: `${folder.color}20`,
                          color: folder.color,
                          fontWeight: 700,
                        }}
                      />
                      <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
                        Abrir caderno &rarr;
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper elevation={4} sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
              <FolderSpecialOutlinedIcon sx={{ fontSize: 52, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Nenhuma pasta criada ainda
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                Crie pastas personalizadas para organizar suas questões de simulados, revisões ou matérias favoritas.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setOpenCreateDialog(true)}
                sx={{ fontWeight: 700 }}
              >
                Criar Primeira Pasta
              </Button>
            </Paper>
          )}
        </Box>
      )}

      {/* Dialog para Criar Nova Pasta */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Criar Nova Pasta</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            label="Nome da Pasta (ex: Revisão Física)"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />

          <TextField
            fullWidth
            label="Descrição (opcional)"
            value={folderDesc}
            onChange={(e) => setFolderDesc(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 1 }}>
            COR PERSONALIZADA DA PASTA:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
            {COLOR_OPTIONS.map((c) => {
              const isSelected = folderColor === c.hex;
              return (
                <Chip
                  key={c.hex}
                  label={c.label}
                  onClick={() => setFolderColor(c.hex)}
                  sx={{
                    backgroundColor: c.hex,
                    color: '#1a1e24',
                    fontWeight: 700,
                    border: isSelected ? '2px solid #ffffff' : '1px solid rgba(0,0,0,0.1)',
                    boxShadow: isSelected ? `0 0 0 2px ${c.hex}` : 'none',
                  }}
                />
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenCreateDialog(false)} sx={{ color: 'text.secondary' }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateFolder}
            disabled={!folderName.trim() || saving}
            sx={{
              backgroundColor: folderColor,
              color: '#1a1e24',
              fontWeight: 700,
              '&:hover': { filter: 'brightness(0.9)' },
            }}
          >
            {saving ? 'Criar...' : 'Criar Pasta'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
