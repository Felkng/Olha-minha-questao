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
  FormHelperText,
  Alert,
  Switch,
  Box,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Area, Origin, Question, Subject, Test } from '../../types';
import {
  getAreas,
  getOrigins,
  getSubjectsByArea,
  getTests,
  updateQuestion,
} from '../../services/api';
import { PALETTE_COLORS } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';

interface EditQuestionModalProps {
  open: boolean;
  question: Question | null;
  onClose: () => void;
  onUpdated?: () => void;
}

interface AltInput {
  id?: number;
  identifier: string;
  text: string;
}

export const EditQuestionModal: React.FC<EditQuestionModalProps> = ({
  open,
  question,
  onClose,
  onUpdated,
}) => {
  const { user, isAdmin } = useAuth();

  const [enunciado, setEnunciado] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [year, setYear] = useState<number | ''>(new Date().getFullYear());
  const [originId, setOriginId] = useState<number | ''>('');
  const [areaId, setAreaId] = useState<number | ''>('');
  const [subjectId, setSubjectId] = useState<number | ''>('');
  const [testId, setTestId] = useState<number | ''>('');
  const [textualReferenceId, setTextualReferenceId] = useState<number | ''>('');
  const [isPublic, setIsPublic] = useState<boolean>(true);

  const [alternatives, setAlternatives] = useState<AltInput[]>([]);
  const [correctAltIndex, setCorrectAltIndex] = useState<number>(0);

  const [origins, setOrigins] = useState<Origin[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open && question) {
      setEnunciado(question.enunciado || '');
      setIdentifier(question.identifier || '');
      setYear(question.year || new Date().getFullYear());
      setOriginId(question.originId || '');
      setAreaId(question.areaId || '');
      setSubjectId(question.subjectId || '');
      setTestId(question.testId || '');
      setTextualReferenceId(question.textualReferenceId || question.textualReference?.id ? Number(question.textualReferenceId || question.textualReference?.id) : '');
      setIsPublic(question.isPublic !== undefined ? question.isPublic : true);

      const alts: AltInput[] = (question.alternatives || []).map((a) => ({
        id: a.id,
        identifier: a.identifier,
        text: a.text,
      }));
      setAlternatives(alts);

      const correctIdx = (question.alternatives || []).findIndex(
        (a) => a.id === question.correctAlternativeId || a.isCorrect
      );
      setCorrectAltIndex(correctIdx >= 0 ? correctIdx : 0);

      loadOptions();
      setErrorMessage(null);
    }
  }, [open, question]);

  useEffect(() => {
    if (areaId) {
      getSubjectsByArea(Number(areaId))
        .then(setSubjects)
        .catch(console.error);
    } else {
      setSubjects([]);
      setSubjectId('');
    }
  }, [areaId]);

  const loadOptions = async () => {
    try {
      const promises: [Promise<Origin[]>, Promise<Area[]>, Promise<Test[]>] = [
        getOrigins(),
        getAreas(),
        isAdmin
          ? getTests()
          : user?.id
          ? getTests({ createdByUserId: user.id })
          : Promise.resolve([]),
      ];
      const [oList, aList, tList] = await Promise.all(promises);
      setOrigins(oList);
      setAreas(aList);
      setTests(tList);
    } catch (err) {
      console.error('Erro ao carregar opções:', err);
    }
  };

  const handleAltChange = (index: number, text: string) => {
    const updated = [...alternatives];
    updated[index].text = text;
    setAlternatives(updated);
  };

  const handleAddAlternative = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nextIdentifier = letters[alternatives.length % letters.length] || `Alt ${alternatives.length + 1}`;
    setAlternatives([...alternatives, { identifier: nextIdentifier, text: '' }]);
  };

  const handleRemoveAlternative = (index: number) => {
    if (alternatives.length <= 2) return;
    const updated = alternatives.filter((_, i) => i !== index);
    setAlternatives(updated);
    if (correctAltIndex === index) {
      setCorrectAltIndex(0);
    } else if (correctAltIndex > index) {
      setCorrectAltIndex(correctAltIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!question) return;
    if (!enunciado.trim() || !areaId || !year) {
      setErrorMessage('Preencha os campos obrigatórios: Enunciado, Ano e Área.');
      return;
    }

    const emptyAlts = alternatives.some((a) => !a.text.trim());
    if (emptyAlts) {
      setErrorMessage('Preencha o texto de todas as alternativas.');
      return;
    }

    if (alternatives.length < 2) {
      setErrorMessage('A questão deve conter no mínimo 2 alternativas.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const formattedAlternatives = alternatives.map((a, idx) => ({
        identifier: a.identifier,
        text: a.text,
        isCorrect: idx === correctAltIndex,
      }));

      await updateQuestion(question.id, {
        enunciado,
        identifier: identifier.trim() || undefined,
        year: Number(year),
        originId: originId ? Number(originId) : undefined,
        areaId: Number(areaId),
        subjectId: subjectId ? Number(subjectId) : undefined,
        testId: testId ? Number(testId) : undefined,
        textualReferenceId: textualReferenceId ? Number(textualReferenceId) : null,
        isPublic,
        alternatives: formattedAlternatives,
      });

      if (onUpdated) onUpdated();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || 'Erro ao atualizar questão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Editar Questão #{question?.id} {question?.identifier ? `(${question.identifier})` : ''}
      </DialogTitle>
      <DialogContent dividers>
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        )}

        <Stack spacing={2.5}>
          <TextField
            label="Enunciado da Questão"
            value={enunciado}
            onChange={(e) => setEnunciado(e.target.value)}
            multiline
            rows={4}
            fullWidth
            required
            size="small"
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Identificador (Ex: 01, Q1)"
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
            <FormControl fullWidth size="small">
              <InputLabel>Banca (Opcional)</InputLabel>
              <Select
                value={originId}
                label="Banca (Opcional)"
                onChange={(e) => setOriginId(e.target.value as number)}
              >
                <MenuItem value="">
                  <em>Nenhuma (Avulsa)</em>
                </MenuItem>
                {origins.map((o) => (
                  <MenuItem key={o.id} value={o.id}>
                    {o.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

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
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl fullWidth size="small" disabled={!areaId}>
              <InputLabel>Matéria (Opcional)</InputLabel>
              <Select
                value={subjectId}
                label="Matéria (Opcional)"
                onChange={(e) => setSubjectId(e.target.value as number)}
              >
                <MenuItem value="">
                  <em>Nenhuma</em>
                </MenuItem>
                {subjects.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Prova / Simulado (Opcional)</InputLabel>
              <Select
                value={testId}
                label="Prova / Simulado (Opcional)"
                onChange={(e) => setTestId(e.target.value as number)}
              >
                <MenuItem value="">
                  <em>Nenhuma</em>
                </MenuItem>
                {tests.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name} ({t.year})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          {(() => {
            const selectedTest = tests.find((t) => t.id === Number(testId));
            const availableReferences = [...(selectedTest?.textualReferences || [])];
            if (
              question?.textualReference &&
              !availableReferences.some((r) => r.id === question.textualReference?.id)
            ) {
              availableReferences.push(question.textualReference);
            }
            if (availableReferences.length === 0) return null;

            return (
              <FormControl fullWidth size="small">
                <InputLabel>Texto de Apoio / Referência Textual (Opcional)</InputLabel>
                <Select
                  value={textualReferenceId}
                  label="Texto de Apoio / Referência Textual (Opcional)"
                  onChange={(e) => setTextualReferenceId(e.target.value as number | '')}
                >
                  <MenuItem value="">
                    <em>Nenhum texto de apoio</em>
                  </MenuItem>
                  {availableReferences.map((ref) => (
                    <MenuItem key={ref.id} value={ref.id}>
                      {ref.title || ref.subtitle || `Texto #${ref.id}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            );
          })()}

          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Visibilidade: {isPublic ? 'Pública' : 'Privada'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {isPublic
                  ? 'Visível para todos os usuários da plataforma'
                  : 'Visível apenas para você'}
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  color="primary"
                />
              }
              label={isPublic ? 'Pública' : 'Privada'}
              sx={{ m: 0 }}
            />
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Alternativas (Selecione a Correta)
            </Typography>
            <FormHelperText sx={{ mb: 2 }}>
              Marque o botão redondo correspondente à alternativa gabarito. Mínimo de 2 alternativas.
            </FormHelperText>

            <RadioGroup
              value={correctAltIndex}
              onChange={(e) => setCorrectAltIndex(Number(e.target.value))}
            >
              <Stack spacing={1.5}>
                {alternatives.map((alt, index) => (
                  <Stack key={index} direction="row" spacing={1.5} alignItems="center">
                    <FormControlLabel
                      value={index}
                      control={<Radio size="small" color="primary" />}
                      label={alt.identifier}
                      sx={{ m: 0, minWidth: 50 }}
                    />
                    <TextField
                      placeholder={`Texto da alternativa ${alt.identifier}`}
                      value={alt.text}
                      onChange={(e) => handleAltChange(index, e.target.value)}
                      fullWidth
                      size="small"
                      required
                    />
                    {alternatives.length > 2 && (
                      <Button
                        color="error"
                        onClick={() => handleRemoveAlternative(index)}
                        sx={{ minWidth: 40, p: 0.5 }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </Button>
                    )}
                  </Stack>
                ))}
              </Stack>
            </RadioGroup>

            <Button
              startIcon={<AddIcon />}
              onClick={handleAddAlternative}
              size="small"
              sx={{ mt: 2, textTransform: 'none' }}
            >
              Adicionar Alternativa
            </Button>
          </Paper>
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
