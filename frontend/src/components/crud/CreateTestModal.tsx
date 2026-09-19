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
import { Area, Origin } from '../../types';
import { createTest, getAreas, getOrigins } from '../../services/api';
import { PALETTE_COLORS } from '../../theme/theme';

interface CreateTestModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export const CreateTestModal: React.FC<CreateTestModalProps> = ({
  open,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [year, setYear] = useState<number | ''>(new Date().getFullYear());
  const [originId, setOriginId] = useState<number | ''>('');
  const [areaId, setAreaId] = useState<number | ''>('');
  const [description, setDescription] = useState('');

  const [origins, setOrigins] = useState<Origin[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadOptions();
    }
  }, [open]);

  const loadOptions = async () => {
    try {
      const [oList, aList] = await Promise.all([getOrigins(), getAreas()]);
      setOrigins(oList);
      setAreas(aList);
    } catch (err) {
      console.error('Erro ao carregar opções:', err);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !year || !originId || !areaId) return;
    setLoading(true);
    try {
      await createTest({
        name: name.trim(),
        year: Number(year),
        originId: Number(originId),
        areaId: Number(areaId),
        description: description.trim(),
      });
      setName('');
      setDescription('');
      setOriginId('');
      setAreaId('');
      onClose();
      if (onCreated) onCreated();
    } catch (err) {
      console.error('Erro ao criar prova:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>Cadastrar Nova Prova / Simulado</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Nome da Prova (ex: ENEM 2024 - Caderno Azul)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            size="small"
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Ano"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value ? Number(e.target.value) : '')}
              fullWidth
              required
              size="small"
            />

            <FormControl fullWidth required size="small">
              <InputLabel>Banca</InputLabel>
              <Select
                value={originId}
                label="Banca"
                onChange={(e) => setOriginId(e.target.value as number)}
              >
                {origins.map((o) => (
                  <MenuItem key={o.id} value={o.id}>
                    {o.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required size="small">
              <InputLabel>Área</InputLabel>
              <Select
                value={areaId}
                label="Área"
                onChange={(e) => setAreaId(e.target.value as number)}
              >
                {areas.map((a) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

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
          disabled={!name.trim() || !year || !originId || !areaId || loading}
          sx={{ fontWeight: 700, backgroundColor: PALETTE_COLORS.primary }}
        >
          {loading ? 'Salvando...' : 'Cadastrar Prova'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
