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
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Area, Origin, Subject, Test } from '../../types';
import {
  createQuestion,
  getAreas,
  getOrigins,
  getSubjectsByArea,
  getTests,
} from '../../services/api';
import { PALETTE_COLORS } from '../../theme/theme';

interface CreateQuestionModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

interface AltInput {
  identifier: string;
  text: string;
}

export const CreateQuestionModal: React.FC<CreateQuestionModalProps> = ({
  open,
  onClose,
  onCreated,
}) => {
  const [enunciado, setEnunciado] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [year, setYear] = useState<number | ''>(new Date().getFullYear());
  const [originId, setOriginId] = useState<number | ''>('');
  const [areaId, setAreaId] = useState<number | ''>('');
  const [subjectId, setSubjectId] = useState<number | ''>('');
  const [testId, setTestId] = useState<number | ''>('');

  const [alternatives, setAlternatives] = useState<AltInput[]>([
    { identifier: 'A', text: '' },
    { identifier: 'B', text: '' },
    { identifier: 'C', text: '' },
    { identifier: 'D', text: '' },
    { identifier: 'E', text: '' },
  ]);
  const [correctAltIndex, setCorrectAltIndex] = useState<number>(0);

  const [origins, setOrigins] = useState<Origin[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadOptions();
    }
  }, [open]);

  const loadOptions = async () => {
    try {
      const [oList, aList, tList] = await Promise.all([
        getOrigins(),
        getAreas(),
        getTests(),
      ]);
      setOrigins(oList);
      setAreas(aList);
      setTests(tList);
    } catch (err) {
      console.error('Erro ao carregar opções:', err);
    }
  };

  const handleAreaChange = async (newAreaId: number) => {
    setAreaId(newAreaId);
    setSubjectId('');
    try {
      const sList = await getSubjectsByArea(newAreaId);
      setSubjects(sList);
    } catch (err) {
      console.error('Erro ao carregar matérias:', err);
    }
  };

  const handleAltTextChange = (index: number, text: string) => {
    const updated = [...alternatives];
    updated[index].text = text;
    setAlternatives(updated);
  };

  const handleAddAlt = () => {
    const nextIdentifier = String.fromCharCode(65 + alternatives.length); // A, B, C, D, E, F...
    setAlternatives([...alternatives, { identifier: nextIdentifier, text: '' }]);
  };

  const handleRemoveAlt = (index: number) => {
    if (alternatives.length <= 2) return;
    const updated = alternatives.filter((_, i) => i !== index);
    setAlternatives(updated);
    if (correctAltIndex >= updated.length) {
      setCorrectAltIndex(0);
    }
  };

  const handleSubmit = async () => {
    if (!enunciado.trim() || !year || !originId || !areaId) return;
    const validAlts = alternatives.filter((a) => a.text.trim().length > 0);
    if (validAlts.length < 2) {
      alert('Informe pelo menos 2 alternativas com texto!');
      return;
    }

    setLoading(true);
    try {
      const finalAlternatives = alternatives.map((a, idx) => ({
        identifier: a.identifier,
        text: a.text.trim(),
        isCorrect: idx === correctAltIndex,
      }));

      await createQuestion({
        enunciado: enunciado.trim(),
        identifier: identifier.trim() || `Q-${Date.now().toString().slice(-4)}`,
        year: Number(year),
        originId: Number(originId),
        areaId: Number(areaId),
        subjectId: subjectId ? Number(subjectId) : undefined,
        testId: testId ? Number(testId) : undefined,
        alternatives: finalAlternatives,
      });

      setEnunciado('');
      setIdentifier('');
      setOriginId('');
      setAreaId('');
      setSubjectId('');
      setTestId('');
      onClose();
      if (onCreated) onCreated();
    } catch (err) {
      console.error('Erro ao criar questão:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>Cadastrar Nova Questão</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label="Enunciado da Questão"
            value={enunciado}
            onChange={(e) => setEnunciado(e.target.value)}
            fullWidth
            required
            multiline
            rows={4}
            placeholder="Digite o enunciado completo da questão..."
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Identificador (ex: Q-101)"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              fullWidth
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
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
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
                onChange={(e) => handleAreaChange(e.target.value as number)}
              >
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
                onChange={(e) => setSubjectId(e.target.value as number)}
              >
                {subjects.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <FormControl fullWidth size="small">
            <InputLabel>Prova Vinculada (Opcional)</InputLabel>
            <Select
              value={testId}
              label="Prova Vinculada (Opcional)"
              onChange={(e) => setTestId(e.target.value as number)}
            >
              <MenuItem value="">Nenhuma Prova (Questão Avulsa)</MenuItem>
              {tests.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name} ({t.year})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="subtitle2" sx={{ fontWeight: 800, pt: 1 }}>
            ALTERNATIVAS DA QUESTÃO (Selecione a opção correta no botão de rádio):
          </Typography>

          <RadioGroup
            value={correctAltIndex}
            onChange={(e) => setCorrectAltIndex(Number(e.target.value))}
          >
            <Stack spacing={1.5}>
              {alternatives.map((alt, idx) => (
                <Paper
                  key={idx}
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: correctAltIndex === idx ? PALETTE_COLORS.success : 'divider',
                    backgroundColor: correctAltIndex === idx ? 'rgba(75, 241, 81, 0.08)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <FormControlLabel
                    value={idx}
                    control={<Radio color="success" />}
                    label={alt.identifier}
                    sx={{ mr: 0 }}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    placeholder={`Texto da Alternativa (${alt.identifier})`}
                    value={alt.text}
                    onChange={(e) => handleAltTextChange(idx, e.target.value)}
                  />
                  {alternatives.length > 2 && (
                    <Button
                      color="error"
                      size="small"
                      onClick={() => handleRemoveAlt(idx)}
                      sx={{ minWidth: 40 }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </Button>
                  )}
                </Paper>
              ))}
            </Stack>
          </RadioGroup>

          <Button
            startIcon={<AddIcon />}
            onClick={handleAddAlt}
            sx={{ alignSelf: 'flex-start', fontWeight: 700 }}
          >
            Adicionar Alternativa
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!enunciado.trim() || !year || !originId || !areaId || loading}
          sx={{ fontWeight: 700, backgroundColor: PALETTE_COLORS.primary }}
        >
          {loading ? 'Cadastrando...' : 'Cadastrar Questão'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
