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
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  Chip,
  IconButton,
  CircularProgress,
  Collapse,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import FolderIcon from '@mui/icons-material/Folder';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Folder, Question } from '../types';
import {
  addQuestionToFolder,
  createFolder,
  getFolderIdsForQuestion,
  getFolders,
  removeQuestionFromFolder,
} from '../services/api';
import { PALETTE_COLORS } from '../theme/theme';

interface SaveToFolderModalProps {
  open: boolean;
  onClose: () => void;
  question: Question | null;
  onSavedChanged?: () => void;
}

const AVAILABLE_COLORS = [
  { hex: PALETTE_COLORS.primary, label: 'Ocre' },
  { hex: PALETTE_COLORS.secondary, label: 'Azul' },
  { hex: PALETTE_COLORS.success, label: 'Verde' },
  { hex: PALETTE_COLORS.danger, label: 'Vermelho' },
  { hex: PALETTE_COLORS.warning, label: 'Amarelo' },
  { hex: '#b388ff', label: 'Roxo' },
  { hex: '#ff80ab', label: 'Rosa' },
];

export const SaveToFolderModal: React.FC<SaveToFolderModalProps> = ({
  open,
  onClose,
  question,
  onSavedChanged,
}) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [savedFolderIds, setSavedFolderIds] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Formulário de criação de nova pasta
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [newFolderDescription, setNewFolderDescription] = useState<string>('');
  const [newFolderColor, setNewFolderColor] = useState<string>(PALETTE_COLORS.primary);
  const [creating, setCreating] = useState<boolean>(false);

  useEffect(() => {
    if (!open || !question) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [allFolders, activeIds] = await Promise.all([
          getFolders(),
          getFolderIdsForQuestion(question.id),
        ]);
        setFolders(allFolders);
        setSavedFolderIds(activeIds);
      } catch (err) {
        console.error('Erro ao carregar pastas:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    setShowCreateForm(false);
    setNewFolderName('');
    setNewFolderDescription('');
    setNewFolderColor(PALETTE_COLORS.primary);
  }, [open, question]);

  const handleToggleFolder = async (folderId: number) => {
    if (!question) return;
    const isSaved = savedFolderIds.includes(folderId);

    try {
      if (isSaved) {
        await removeQuestionFromFolder(folderId, question.id);
        setSavedFolderIds((prev) => prev.filter((id) => id !== folderId));
      } else {
        await addQuestionToFolder(folderId, question.id);
        setSavedFolderIds((prev) => [...prev, folderId]);
      }
      onSavedChanged?.();
    } catch (err) {
      console.error('Erro ao alternar pasta:', err);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !question) return;

    setCreating(true);
    try {
      const created = await createFolder({
        name: newFolderName.trim(),
        description: newFolderDescription.trim(),
        color: newFolderColor,
      });

      // Salva automaticamente a questão na pasta recém-criada
      await addQuestionToFolder(created.id, question.id);

      setFolders((prev) => [...prev, created]);
      setSavedFolderIds((prev) => [...prev, created.id]);

      setNewFolderName('');
      setNewFolderDescription('');
      setShowCreateForm(false);
      onSavedChanged?.();
    } catch (err) {
      console.error('Erro ao criar pasta:', err);
    } finally {
      setCreating(false);
    }
  };

  if (!question) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Salvar em Pastas
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Questão {question.identifier} • {question.originName || 'Geral'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2.5 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} sx={{ color: PALETTE_COLORS.primary }} />
          </Box>
        ) : (
          <>
            {/* Lista de Pastas Existentes */}
            {folders.length === 0 && !showCreateForm ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <FolderIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                  Você ainda não possui nenhuma pasta de salvamento.
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setShowCreateForm(true)}
                  sx={{ borderColor: PALETTE_COLORS.primary, color: PALETTE_COLORS.primary }}
                >
                  Criar Primeira Pasta
                </Button>
              </Box>
            ) : (
              <List disablePadding sx={{ mb: 2 }}>
                {folders.map((folder) => {
                  const isChecked = savedFolderIds.includes(folder.id);
                  return (
                    <ListItem key={folder.id} disablePadding sx={{ mb: 0.5 }}>
                      <ListItemButton
                        onClick={() => handleToggleFolder(folder.id)}
                        sx={{
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: isChecked ? folder.color : 'divider',
                          backgroundColor: isChecked ? `${folder.color}15` : 'transparent',
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <Checkbox
                            edge="start"
                            checked={isChecked}
                            tabIndex={-1}
                            disableRipple
                            sx={{
                              p: 0,
                              color: folder.color,
                              '&.Mui-checked': { color: folder.color },
                            }}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: '50%',
                                  backgroundColor: folder.color,
                                  flexShrink: 0,
                                }}
                              />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {folder.name}
                              </Typography>
                            </Box>
                          }
                          secondary={folder.description}
                        />
                        {isChecked && (
                          <CheckCircleIcon sx={{ color: folder.color, fontSize: 18 }} />
                        )}
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            )}

            {/* Botão para abrir formulário de nova pasta */}
            {!showCreateForm && folders.length > 0 && (
              <Button
                fullWidth
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setShowCreateForm(true)}
                sx={{
                  borderRadius: 2,
                  borderColor: 'divider',
                  color: 'text.secondary',
                  py: 1,
                  '&:hover': {
                    borderColor: PALETTE_COLORS.primary,
                    color: PALETTE_COLORS.primary,
                  },
                }}
              >
                Criar Nova Pasta
              </Button>
            )}

            {/* Formulário de Criação de Pasta */}
            <Collapse in={showCreateForm}>
              <Box
                sx={{
                  p: 2,
                  mt: 1,
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: 'background.paper',
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Nova Pasta de Questões
                </Typography>

                <TextField
                  fullWidth
                  size="small"
                  label="Nome da Pasta (ex: Revisar Biologia)"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  sx={{ mb: 1.5 }}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Descrição (opcional)"
                  value={newFolderDescription}
                  onChange={(e) => setNewFolderDescription(e.target.value)}
                  sx={{ mb: 2 }}
                />

                {/* Seletor de Cores */}
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 1 }}>
                  COR DA PASTA:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {AVAILABLE_COLORS.map((c) => {
                    const isSelected = newFolderColor === c.hex;
                    return (
                      <Chip
                        key={c.hex}
                        label={c.label}
                        onClick={() => setNewFolderColor(c.hex)}
                        sx={{
                          backgroundColor: c.hex,
                          color: '#1a1e24',
                          fontWeight: 700,
                          border: isSelected ? '2px solid' : '1px solid rgba(0,0,0,0.1)',
                          borderColor: isSelected ? '#ffffff' : 'transparent',
                          boxShadow: isSelected ? '0 0 0 2px ' + c.hex : 'none',
                        }}
                      />
                    );
                  })}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button
                    size="small"
                    onClick={() => setShowCreateForm(false)}
                    sx={{ color: 'text.secondary' }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleCreateFolder}
                    disabled={!newFolderName.trim() || creating}
                    sx={{
                      backgroundColor: newFolderColor,
                      color: '#1a1e24',
                      fontWeight: 700,
                      '&:hover': {
                        filter: 'brightness(0.9)',
                      },
                    }}
                  >
                    {creating ? 'Salvando...' : 'Criar e Salvar'}
                  </Button>
                </Box>
              </Box>
            </Collapse>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained" color="primary">
          Concluir
        </Button>
      </DialogActions>
    </Dialog>
  );
};
