import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Alert,
} from '@mui/material';
import { updateOrigin } from '../../services/api';
import { PALETTE_COLORS } from '../../theme/theme';
import { Origin } from '../../types';

interface EditOriginModalProps {
  open: boolean;
  origin: Origin | null;
  onClose: () => void;
  onUpdated?: () => void;
}

export const EditOriginModal: React.FC<EditOriginModalProps> = ({
  open,
  origin,
  onClose,
  onUpdated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open && origin) {
      setName(origin.name || '');
      setDescription(origin.description || '');
      setErrorMessage(null);
    }
  }, [open, origin]);

  const handleSubmit = async () => {
    if (!origin) return;
    if (!name.trim()) {
      setErrorMessage('O nome da banca é obrigatório.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      await updateOrigin(origin.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      if (onUpdated) onUpdated();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || 'Erro ao atualizar banca.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Editar Banca #{origin?.id}</DialogTitle>
      <DialogContent dividers>
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        )}
        <Stack spacing={2.5}>
          <TextField
            label="Nome da Banca (Ex: CESPE / Cebraspe)"
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
