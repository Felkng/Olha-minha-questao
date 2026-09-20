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
import { Area, Origin, Test, TestCard } from '../../types';
import { getAreas, getOrigins, updateTest } from '../../services/api';
import { PALETTE_COLORS } from '../../theme/theme';

interface EditTestModalProps {
  open: boolean;
  test: Test | TestCard | null;
  onClose: () => void;
  onUpdated?: () => void;
}

export const EditTestModal: React.FC<EditTestModalProps> = ({
  open,
  test,
  onClose,
  onUpdated,
}) => {
  const [name, setName] = useState('');
  const [year, setYear] = useState<number | ''>(new Date().getFullYear());
  const [originId, setOriginId] = useState<number | ''>('');
  const [areaId, setAreaId] = useState<number | ''>('');
  const [description, setDescription] = useState('');

  const [origins, setOrigins] = useState<Origin[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open && test) {
      setName(test.name || '');
      setYear(test.year || new Date().getFullYear());
      setOriginId(test.originId || '');
      setAreaId(test.areaId || '');
      setDescription((test as any).description || '');
      setErrorMessage(null);
      loadOptions();
    }
  }, [open, test]);

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
    if (!test) return;
    if (!name.trim() || !year) {
      setErrorMessage('Preencha os campos obrigatórios: Nome da Prova e Ano.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      await updateTest(test.id, {
        name: name.trim(),
        year: Number(year),
        originId: originId ? Number(originId) : undefined,
        areaId: areaId ? Number(areaId) : undefined,
        description: description.trim() || undefined,
      });

      if (onUpdated) onUpdated();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || 'Erro ao atualizar prova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Editar Prova #{test?.id}
      </DialogTitle>
      <DialogContent dividers>
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        )}

        <Stack spacing={2.5}>
          <TextField
            label="Nome da Prova"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            size="small"
          />

          <TextField
            label="Ano"
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value ? Number(e.target.value) : '')}
            fullWidth
            required
            size="small"
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Banca (Opcional)</InputLabel>
              <Select
                value={originId}
                label="Banca (Opcional)"
                onChange={(e) => setOriginId(e.target.value as number)}
              >
                <MenuItem value="">
                  <em>Nenhuma</em>
                </MenuItem>
                {origins.map((o) => (
                  <MenuItem key={o.id} value={o.id}>
                    {o.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Área (Opcional)</InputLabel>
              <Select
                value={areaId}
                label="Área (Opcional)"
                onChange={(e) => setAreaId(e.target.value as number)}
              >
                <MenuItem value="">
                  <em>Nenhuma</em>
                </MenuItem>
                {areas.map((a) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

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
