import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
} from '@mui/material';
import { createOrigin } from '../../services/api';
import { PALETTE_COLORS } from '../../theme/theme';

interface CreateOriginModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export const CreateOriginModal: React.FC<CreateOriginModalProps> = ({
  open,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createOrigin({ name: name.trim(), description: description.trim() });
      setName('');
      setDescription('');
      onClose();
      if (onCreated) onCreated();
    } catch (err) {
      console.error('Erro ao criar banca:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>Cadastrar Nova Banca Examinadora</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Nome da Banca (ex: CESPE / Cebraspe, VUNESP)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Descrição (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!name.trim() || loading}
          sx={{ fontWeight: 700, backgroundColor: PALETTE_COLORS.primary }}
        >
          {loading ? 'Salvando...' : 'Cadastrar Banca'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
