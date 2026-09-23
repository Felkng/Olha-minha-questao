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
  FormControlLabel,
  Switch,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PublicIcon from '@mui/icons-material/Public';
import { Area, Folder, Subject } from '../../types';
import {
  createFlashcard,
  getAreas,
  getFolders,
  getSubjectsByArea,
} from '../../services/api';
import { PALETTE_COLORS } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';

interface CreateFlashcardModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  initialFolderId?: number;
}

export const CreateFlashcardModal: React.FC<CreateFlashcardModalProps> = ({
  open,
  onClose,
  onCreated,
  initialFolderId,
}) => {
  const { user } = useAuth();

  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [areaId, setAreaId] = useState<number | ''>('');
  const [subjectId, setSubjectId] = useState<number | ''>('');
  const [folderId, setFolderId] = useState<number | ''>(initialFolderId || '');
  const [isPublic, setIsPublic] = useState<boolean>(true);

  const [areas, setAreas] = useState<Area[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadOptions();
      if (initialFolderId) {
        setFolderId(initialFolderId);
      }
    }
  }, [open, initialFolderId, user?.id]);

  const loadOptions = async () => {
    try {
      const [aList, fList] = await Promise.all([
        getAreas(),
        getFolders('FLASHCARD', user?.id),
      ]);
      setAreas(aList);
      setFolders(fList);
    } catch (err) {
      console.error('Erro ao carregar opções para o flashcard:', err);
    }
  };

  const handleAreaChange = async (newAreaId: number | '') => {
    setAreaId(newAreaId);
    setSubjectId('');
    if (newAreaId) {
      try {
        const sList = await getSubjectsByArea(newAreaId);
        setSubjects(sList);
      } catch (err) {
        console.error('Erro ao carregar matérias:', err);
      }
    } else {
      setSubjects([]);
    }
  };

  const handleSubmit = async () => {
    if (!front.trim() || !back.trim()) return;

    setLoading(true);
    try {
      await createFlashcard({
        front: front.trim(),
        back: back.trim(),
        areaId: areaId ? Number(areaId) : undefined,
        subjectId: subjectId ? Number(subjectId) : undefined,
        folderId: folderId ? Number(folderId) : undefined,
        isPublic,
      });

      setFront('');
      setBack('');
      setAreaId('');
      setSubjectId('');
      setFolderId(initialFolderId || '');
      setIsPublic(true);
      onClose();
      if (onCreated) onCreated();
    } catch (err) {
      console.error('Erro ao criar flashcard:', err);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = front.trim().length > 0 && back.trim().length > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>Novo Flashcard</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label="Frente do Flashcard (Pergunta / Conceito)"
            value={front}
            onChange={(e) => setFront(e.target.value)}
            fullWidth
            required
            multiline
            rows={3}
            placeholder="Ex: O que é a Primeira Lei de Newton?"
          />

          <TextField
            label="Verso do Flashcard (Resposta / Explicação)"
            value={back}
            onChange={(e) => setBack(e.target.value)}
            fullWidth
            required
            multiline
            rows={4}
            placeholder="Ex: Todo corpo permanece em seu estado de repouso ou de movimento retilíneo uniforme, a menos que seja compelido a mudar esse estado por forças aplicadas sobre ele."
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Área (Opcional)</InputLabel>
              <Select
                value={areaId}
                label="Área (Opcional)"
                onChange={(e) => handleAreaChange(e.target.value as number | '')}
              >
                <MenuItem value="">Nenhuma Área</MenuItem>
                {areas.map((a) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small" disabled={!areaId}>
              <InputLabel>Matéria (Opcional)</InputLabel>
              <Select
                value={subjectId}
                label="Matéria (Opcional)"
                onChange={(e) => setSubjectId(e.target.value as number | '')}
              >
                <MenuItem value="">Nenhuma Matéria</MenuItem>
                {subjects.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <FormControl fullWidth size="small">
            <InputLabel>Pasta de Flashcards (Opcional)</InputLabel>
            <Select
              value={folderId}
              label="Pasta de Flashcards (Opcional)"
              onChange={(e) => setFolderId(e.target.value as number | '')}
            >
              <MenuItem value="">Nenhuma Pasta (Flashcard Avulso)</MenuItem>
              {folders.map((f) => (
                <MenuItem key={f.id} value={f.id}>
                  {f.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Privacy Switch */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1.5,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: isPublic ? 'rgba(75, 241, 81, 0.05)' : 'rgba(217, 183, 99, 0.05)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isPublic ? (
                <PublicIcon sx={{ color: PALETTE_COLORS.success }} />
              ) : (
                <LockOutlinedIcon sx={{ color: PALETTE_COLORS.primary }} />
              )}
              <Box>
                <Typography variant="body2" fontWeight={700}>
                  {isPublic ? 'Flashcard Público' : 'Flashcard Privado'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {isPublic
                    ? 'Visível para todos os estudantes da comunidade.'
                    : 'Visível apenas para você em sua conta.'}
                </Typography>
              </Box>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  color="success"
                />
              }
              label=""
              sx={{ mr: 0 }}
            />
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!isFormValid || loading}
          sx={{ fontWeight: 700, backgroundColor: PALETTE_COLORS.primary }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Criar Flashcard'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
