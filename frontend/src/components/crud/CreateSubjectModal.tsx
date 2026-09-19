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
} from '@mui/material';
import { Area } from '../../types';
import { createSubject, getAreas } from '../../services/api';
import { PALETTE_COLORS } from '../../theme/theme';

interface CreateSubjectModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export const CreateSubjectModal: React.FC<CreateSubjectModalProps> = ({
  open,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [areaId, setAreaId] = useState<number | ''>('');
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadAreas();
    }
  }, [open]);

  const loadAreas = async () => {
    try {
      const data = await getAreas();
      setAreas(data);
    } catch (err) {
      console.error('Erro ao carregar áreas:', err);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !areaId) return;
    setLoading(true);
    try {
      await createSubject({
        name: name.trim(),
        description: description.trim(),
        areaId: Number(areaId),
      });
      setName('');
      setDescription('');
      setAreaId('');
      onClose();
      if (onCreated) onCreated();
    } catch (err) {
      console.error('Erro ao criar matéria:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>Cadastrar Nova Matéria / Disciplina</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <FormControl fullWidth required size="small">
            <InputLabel>Área Vinculada</InputLabel>
            <Select
              value={areaId}
              label="Área Vinculada"
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
            label="Nome da Matéria (ex: Física Quântica, Álgebra Linear)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            size="small"
          />

          <TextField
            label="Descrição (opcional)"
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
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!name.trim() || !areaId || loading}
          sx={{ fontWeight: 700, backgroundColor: PALETTE_COLORS.primary }}
        >
          {loading ? 'Salvando...' : 'Cadastrar Matéria'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
