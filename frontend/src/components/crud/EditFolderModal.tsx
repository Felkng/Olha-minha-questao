import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Switch,
  Typography,
} from '@mui/material';
import { Folder } from '../../types';
import { updateFolder } from '../../services/api';
import { PALETTE_COLORS } from '../../theme/theme';

interface EditFolderModalProps {
  open: boolean;
  folder: Folder | null;
  onClose: () => void;
  onUpdated?: (updatedFolder: Folder) => void;
}

const COLOR_OPTIONS = [
  PALETTE_COLORS.primary,
  PALETTE_COLORS.secondary,
  PALETTE_COLORS.success,
  PALETTE_COLORS.danger,
  PALETTE_COLORS.warning,
  '#b388ff',
  '#ff80ab',
];

export const EditFolderModal: React.FC<EditFolderModalProps> = ({
  open,
  folder,
  onClose,
  onUpdated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PALETTE_COLORS.primary);
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && folder) {
      setName(folder.name || '');
      setDescription(folder.description || '');
      setColor(folder.color || PALETTE_COLORS.primary);
      setIsPublic(folder.isPublic !== false);
    }
  }, [open, folder]);

  const handleSubmit = async () => {
    if (!folder || !name.trim()) return;
    setSaving(true);
    try {
      const updated = await updateFolder(folder.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        folderType: folder.folderType,
        isPublic,
      });
      if (onUpdated) {
        onUpdated(updated);
      }
      onClose();
    } catch (err) {
      console.error('Erro ao editar pasta:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!folder) return null;

  const typeLabel =
    folder.folderType === 'FLASHCARD'
      ? 'Deck de Flashcards'
      : folder.folderType === 'TEST'
      ? 'Pasta de Provas'
      : 'Pasta de Questões';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Editar {typeLabel}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <TextField
            label="Nome da Pasta"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            size="small"
          />
          <TextField
            label="Descrição (Opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={2}
            size="small"
          />
          <FormControl size="small">
            <Typography variant="caption" sx={{ mb: 1, fontWeight: 'bold' }}>
              Cor da Pasta
            </Typography>
            <RadioGroup
              row
              value={color}
              onChange={(e) => setColor(e.target.value)}
            >
              {COLOR_OPTIONS.map((c) => (
                <FormControlLabel
                  key={c}
                  value={c}
                  control={
                    <Radio
                      size="small"
                      sx={{
                        color: c,
                        '&.Mui-checked': { color: c },
                      }}
                    />
                  }
                  label=""
                  sx={{ m: 0, mr: 1 }}
                />
              ))}
            </RadioGroup>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={isPublic}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsPublic(e.target.checked)}
                color="success"
              />
            }
            label={
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {isPublic ? 'Pública (visível na comunidade)' : 'Privada (apenas para você)'}
              </Typography>
            }
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving || !name.trim()}
          sx={{ fontWeight: 700, backgroundColor: PALETTE_COLORS.primary }}
        >
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
