import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Checkbox,
  Stack,
  TextField,
  CircularProgress,
  Divider,
  Paper,
  Chip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import FolderSpecialOutlinedIcon from '@mui/icons-material/FolderSpecialOutlined';
import PublicIcon from '@mui/icons-material/Public';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Flashcard, Folder } from '../../types';
import {
  addFlashcardToFolder,
  createFolder,
  getFolderIdsForFlashcard,
  getFolders,
  removeFlashcardFromFolder,
} from '../../services/api';
import { PALETTE_COLORS } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';

interface SaveFlashcardToFolderModalProps {
  open: boolean;
  onClose: () => void;
  flashcard: Flashcard | null;
  onSavedStatusChange?: () => void;
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

export const SaveFlashcardToFolderModal: React.FC<SaveFlashcardToFolderModalProps> = ({
  open,
  onClose,
  flashcard,
  onSavedStatusChange,
}) => {
  const { user } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [savedFolderIds, setSavedFolderIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState<boolean>(false);

  // Formulário inline para nova pasta / deck
  const [showCreateFolder, setShowCreateFolder] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [newFolderDesc, setNewFolderDesc] = useState<string>('');
  const [newFolderColor, setNewFolderColor] = useState<string>(PALETTE_COLORS.primary);
  const [newFolderIsPublic, setNewFolderIsPublic] = useState<boolean>(true);
  const [creatingFolder, setCreatingFolder] = useState<boolean>(false);

  useEffect(() => {
    if (open && flashcard) {
      loadFoldersAndStatus();
    }
  }, [open, flashcard]);

  const loadFoldersAndStatus = async () => {
    if (!flashcard) return;
    setLoading(true);
    try {
      const [allFolders, activeFolderIds] = await Promise.all([
        getFolders('FLASHCARD', user?.id),
        getFolderIdsForFlashcard(flashcard.id),
      ]);
      setFolders(allFolders);
      setSavedFolderIds(new Set(activeFolderIds));
    } catch (err) {
      console.error('Erro ao carregar pastas de flashcards:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFolder = async (folderId: number) => {
    if (!flashcard) return;

    const isCurrentlySaved = savedFolderIds.has(folderId);
    const newSavedSet = new Set(savedFolderIds);

    if (isCurrentlySaved) {
      newSavedSet.delete(folderId);
      setSavedFolderIds(newSavedSet);
      try {
        await removeFlashcardFromFolder(folderId, flashcard.id);
        if (onSavedStatusChange) onSavedStatusChange();
      } catch (err) {
        console.error('Erro ao remover flashcard da pasta:', err);
        newSavedSet.add(folderId);
        setSavedFolderIds(newSavedSet);
      }
    } else {
      newSavedSet.add(folderId);
      setSavedFolderIds(newSavedSet);
      try {
        await addFlashcardToFolder(folderId, flashcard.id);
        if (onSavedStatusChange) onSavedStatusChange();
      } catch (err) {
        console.error('Erro ao adicionar flashcard na pasta:', err);
        newSavedSet.delete(folderId);
        setSavedFolderIds(newSavedSet);
      }
    }
  };

  const handleCreateFolderInline = async () => {
    if (!newFolderName.trim() || !flashcard) return;
    setCreatingFolder(true);
    try {
      const created = await createFolder({
        name: newFolderName.trim(),
        description: newFolderDesc.trim() || undefined,
        color: newFolderColor,
        folderType: 'FLASHCARD',
        isPublic: newFolderIsPublic,
      });
      setFolders((prev) => [...prev, created]);
      setNewFolderName('');
      setNewFolderDesc('');
      setShowCreateFolder(false);

      // Associa o flashcard à nova pasta criada
      await handleToggleFolder(created.id);
    } catch (err) {
      console.error('Erro ao criar deck de flashcard:', err);
    } finally {
      setCreatingFolder(false);
    }
  };

  if (!flashcard) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        Salvar Flashcard em Pastas / Decks (N:N)
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          Marque as pastas nas quais deseja incluir este flashcard. Ele pode pertencer a múltiplos decks simultaneamente.
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {folders.map((folder) => {
              const isSaved = savedFolderIds.has(folder.id);
              return (
                <Paper
                  key={folder.id}
                  variant="outlined"
                  onClick={() => handleToggleFolder(folder.id)}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderLeft: `5px solid ${folder.color || PALETTE_COLORS.primary}`,
                    borderColor: isSaved ? PALETTE_COLORS.primary : 'divider',
                    backgroundColor: isSaved
                      ? 'rgba(217, 183, 99, 0.08)'
                      : 'background.paper',
                    '&:hover': {
                      borderColor: PALETTE_COLORS.primary,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1 }}>
                    <Checkbox
                      checked={isSaved}
                      onChange={() => handleToggleFolder(folder.id)}
                      onClick={(e) => e.stopPropagation()}
                      sx={{
                        color: PALETTE_COLORS.primary,
                        '&.Mui-checked': {
                          color: PALETTE_COLORS.primary,
                        },
                      }}
                    />
                    <FolderSpecialOutlinedIcon
                      sx={{ color: folder.color || PALETTE_COLORS.primary, flexShrink: 0 }}
                    />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                        {folder.name}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          {folder.flashcardCount ?? 0} cards
                        </Typography>
                        <Chip
                          size="small"
                          icon={folder.isPublic ? <PublicIcon fontSize="inherit" /> : <LockOutlinedIcon fontSize="inherit" />}
                          label={folder.isPublic ? 'Público' : 'Privado'}
                          sx={{ height: 18, fontSize: '0.65rem' }}
                        />
                      </Stack>
                    </Box>
                  </Box>
                  {isSaved && (
                    <CheckIcon sx={{ color: PALETTE_COLORS.primary, fontSize: 20 }} />
                  )}
                </Paper>
              );
            })}

            {folders.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                Você ainda não possui nenhuma pasta de flashcards.
              </Typography>
            )}
          </Stack>
        )}

        <Divider sx={{ my: 2.5 }} />

        {/* Criação Rápida de Nova Pasta */}
        {!showCreateFolder ? (
          <Button
            startIcon={<AddIcon />}
            onClick={() => setShowCreateFolder(true)}
            sx={{ fontWeight: 700, textTransform: 'none' }}
          >
            Criar Nova Pasta de Flashcards
          </Button>
        ) : (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, backgroundColor: 'background.default' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Nova Pasta / Deck
            </Typography>
            <Stack spacing={2}>
              <TextField
                size="small"
                fullWidth
                label="Nome do Deck / Pasta"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                autoFocus
              />
              <TextField
                size="small"
                fullWidth
                label="Descrição (opcional)"
                value={newFolderDesc}
                onChange={(e) => setNewFolderDesc(e.target.value)}
              />

              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Cor do Deck:
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                  {COLOR_OPTIONS.map((c) => (
                    <Box
                      key={c.hex}
                      onClick={() => setNewFolderColor(c.hex)}
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: c.hex,
                        cursor: 'pointer',
                        border:
                          newFolderColor === c.hex
                            ? '2px solid #fff'
                            : '2px solid transparent',
                        boxShadow:
                          newFolderColor === c.hex ? `0 0 0 2px ${c.hex}` : 'none',
                      }}
                    />
                  ))}
                </Stack>
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={newFolderIsPublic}
                    onChange={(e) => setNewFolderIsPublic(e.target.checked)}
                    color="success"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {newFolderIsPublic ? 'Deck Público (visível na comunidade)' : 'Deck Privado (apenas para você)'}
                  </Typography>
                }
              />

              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  size="small"
                  onClick={() => setShowCreateFolder(false)}
                  disabled={creatingFolder}
                >
                  Cancelar
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleCreateFolderInline}
                  disabled={creatingFolder || !newFolderName.trim()}
                  sx={{
                    backgroundColor: PALETTE_COLORS.primary,
                    fontWeight: 700,
                  }}
                >
                  {creatingFolder ? 'Criando...' : 'Criar e Salvar'}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ fontWeight: 600 }}>
          Concluir
        </Button>
      </DialogActions>
    </Dialog>
  );
};
