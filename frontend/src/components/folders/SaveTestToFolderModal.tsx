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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import { Folder, Test, TestCard } from '../../types';
import {
  addTestToFolder,
  createFolder,
  getFolderIdsForTest,
  getFolders,
  removeTestFromFolder,
} from '../../services/api';
import { PALETTE_COLORS } from '../../theme/theme';

interface SaveTestToFolderModalProps {
  open: boolean;
  onClose: () => void;
  test: Test | TestCard | null;
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

export const SaveTestToFolderModal: React.FC<SaveTestToFolderModalProps> = ({
  open,
  onClose,
  test,
  onSavedStatusChange,
}) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [savedFolderIds, setSavedFolderIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  const [showCreateFolder, setShowCreateFolder] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [newFolderDesc, setNewFolderDesc] = useState<string>('');
  const [newFolderColor, setNewFolderColor] = useState<string>(PALETTE_COLORS.primary);
  const [creatingFolder, setCreatingFolder] = useState<boolean>(false);

  useEffect(() => {
    if (open && test) {
      loadFoldersAndStatus();
    }
  }, [open, test]);

  const loadFoldersAndStatus = async () => {
    if (!test) return;
    setLoading(true);
    try {
      const [allFolders, activeFolderIds] = await Promise.all([
        getFolders('TEST'),
        getFolderIdsForTest(test.id),
      ]);
      setFolders(allFolders);
      setSavedFolderIds(new Set(activeFolderIds));
    } catch (err) {
      console.error('Erro ao carregar pastas de provas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFolder = async (folderId: number) => {
    if (!test) return;

    const isCurrentlySaved = savedFolderIds.has(folderId);
    const newSavedSet = new Set(savedFolderIds);

    if (isCurrentlySaved) {
      newSavedSet.delete(folderId);
      setSavedFolderIds(newSavedSet);
      try {
        await removeTestFromFolder(folderId, test.id);
        if (onSavedStatusChange) onSavedStatusChange();
      } catch (err) {
        console.error('Erro ao remover prova da pasta:', err);
        newSavedSet.add(folderId);
        setSavedFolderIds(newSavedSet);
      }
    } else {
      newSavedSet.add(folderId);
      setSavedFolderIds(newSavedSet);
      try {
        await addTestToFolder(folderId, test.id, notes);
        if (onSavedStatusChange) onSavedStatusChange();
      } catch (err) {
        console.error('Erro ao adicionar prova na pasta:', err);
        newSavedSet.delete(folderId);
        setSavedFolderIds(newSavedSet);
      }
    }
  };

  const handleCreateFolderInline = async () => {
    if (!newFolderName.trim()) return;
    setCreatingFolder(true);
    try {
      const created = await createFolder({
        name: newFolderName.trim(),
        description: newFolderDesc.trim(),
        color: newFolderColor,
        folderType: 'TEST',
      });
      setFolders((prev) => [...prev, created]);
      setNewFolderName('');
      setNewFolderDesc('');
      setShowCreateFolder(false);

      if (test) {
        await handleToggleFolder(created.id);
      }
    } catch (err) {
      console.error('Erro ao criar pasta de provas:', err);
    } finally {
      setCreatingFolder(false);
    }
  };

  if (!test) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        Salvar Prova em Pastas Personalizadas
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          Selecione uma ou mais pastas exclusivas de provas para guardar a **Prova {test.name}**.
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} sx={{ color: PALETTE_COLORS.primary }} />
          </Box>
        ) : (
          <Box>
            <Stack spacing={1} sx={{ mb: 3, maxHeight: 220, overflowY: 'auto' }}>
              {folders.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', py: 1 }}>
                  Você ainda não possui pastas de provas criadas. Crie sua primeira pasta de provas abaixo!
                </Typography>
              ) : (
                folders.map((folder) => {
                  const isChecked = savedFolderIds.has(folder.id);
                  return (
                    <Paper
                      key={folder.id}
                      elevation={0}
                      onClick={() => handleToggleFolder(folder.id)}
                      sx={{
                        p: 1.5,
                        px: 2,
                        borderRadius: 2,
                        border: '1.5px solid',
                        borderColor: isChecked ? folder.color : 'divider',
                        backgroundColor: isChecked ? `${folder.color}15` : 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            backgroundColor: folder.color,
                          }}
                        />
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {folder.name}
                          </Typography>
                          {folder.description && (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {folder.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <Checkbox checked={isChecked} readOnly size="small" />
                    </Paper>
                  );
                })
              )}
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <TextField
              fullWidth
              size="small"
              label="Anotação Pessoal (opcional)"
              placeholder="Ex: Simulado para fazer no final de semana..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              sx={{ mb: 2 }}
            />

            {!showCreateFolder ? (
              <Button
                startIcon={<AddIcon />}
                onClick={() => setShowCreateFolder(true)}
                sx={{ color: PALETTE_COLORS.primary, fontWeight: 600 }}
              >
                Criar Nova Pasta de Provas
              </Button>
            ) : (
              <Paper elevation={0} sx={{ p: 2, borderRadius: 2, backgroundColor: 'action.hover' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Nova Pasta de Provas
                </Typography>
                <Stack spacing={1.5}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Nome da Pasta"
                    placeholder="Ex: Simulados Medicina 2024..."
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                  />
                  <TextField
                    size="small"
                    fullWidth
                    label="Descrição (opcional)"
                    value={newFolderDesc}
                    onChange={(e) => setNewFolderDesc(e.target.value)}
                  />

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pt: 0.5 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>
                      Cor:
                    </Typography>
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
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: newFolderColor === c.hex ? '2px solid #ffffff' : 'none',
                          boxShadow: newFolderColor === c.hex ? '0 0 0 2px ' + c.hex : 'none',
                        }}
                      >
                        {newFolderColor === c.hex && <CheckIcon sx={{ fontSize: 14, color: '#ffffff' }} />}
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', pt: 1 }}>
                    <Button size="small" onClick={() => setShowCreateFolder(false)}>
                      Cancelar
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={handleCreateFolderInline}
                      disabled={creatingFolder || !newFolderName.trim()}
                    >
                      {creatingFolder ? 'Criando...' : 'Criar e Salvar'}
                    </Button>
                  </Box>
                </Stack>
              </Paper>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button variant="contained" onClick={onClose} sx={{ px: 3, fontWeight: 700 }}>
          Concluído
        </Button>
      </DialogActions>
    </Dialog>
  );
};
