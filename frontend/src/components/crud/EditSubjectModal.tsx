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
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import { getAreas, updateSubject } from '../../services/api';
import { PALETTE_COLORS } from '../../theme/theme';
import { Area, Subject } from '../../types';

interface EditSubjectModalProps {
  open: boolean;
  subject: Subject | null;
  onClose: () => void;
  onUpdated?: () => void;
}

export const EditSubjectModal: React.FC<EditSubjectModalProps> = ({
  open,
  subject,
  onClose,
  onUpdated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [areaId, setAreaId] = useState<number | ''>('');
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open && subject) {
      setName(subject.name || '');
      setDescription(subject.description || '');
      setAreaId(subject.areaId || '');
      setErrorMessage(null);
      getAreas().then(setAreas).catch(console.error);
    }
  }, [open, subject]);

  const handleSubmit = async () => {
    if (!subject) return;
    if (!name.trim() || !areaId) {
      setErrorMessage('Nome da matéria e Área vinculada são obrigatórios.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      await updateSubject(subject.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        areaId: Number(areaId),
      });
      if (onUpdated) onUpdated();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || 'Erro ao atualizar matéria.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Editar Matéria #{subject?.id}</DialogTitle>
      <DialogContent dividers>
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        )}
        <Stack spacing={2.5}>
          <TextField
            label="Nome da Matéria (Ex: História do Brasil)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            size="small"
          />

          <FormControl fullWidth size="small" required>
            <InputLabel>Área do Conhecimento</InputLabel>
            <Select
              value={areaId}
              label="Área do Conhecimento"
              onChange={(e) => setAreaId(e.target.value as number)}
            >
              {areas.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Descrição (Opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
            size="small"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading} sx={{ color: 'text.secondary' }}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{ fontWeight: 700, backgroundColor: PALETTE_COLORS.primary }}
        >
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
