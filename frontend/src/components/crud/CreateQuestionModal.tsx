import React, { useEffect, useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Box,
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
  Switch,
  IconButton,
  Chip,
  Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { Area, Origin, Subject, Test } from '../../types';
import {
  createQuestion,
  getAreas,
  getOrigins,
  getSubjectsByArea,
  getTests,
} from '../../services/api';
import { PALETTE_COLORS } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';

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
  const { user, isAdmin } = useAuth();

  const [enunciado, setEnunciado] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [year, setYear] = useState<number | ''>(new Date().getFullYear());
  const [originId, setOriginId] = useState<number | ''>('');
  const [areaId, setAreaId] = useState<number | ''>('');
  const [subjectId, setSubjectId] = useState<number | ''>('');
  const [testId, setTestId] = useState<number | ''>('');
  const [isPublic, setIsPublic] = useState<boolean>(true);

  // Images state & upload/paste refs
  const [images, setImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [alternatives, setAlternatives] = useState<AltInput[]>([
    { identifier: 'A', text: '' },
    { identifier: 'B', text: '' },
    { identifier: 'C', text: '' },
    { identifier: 'D', text: '' },
    { identifier: 'E', text: '' },
  ]);
  const [correctAltIndex, setCorrectAltIndex] = useState<number>(0);
  const [isAnnulled, setIsAnnulled] = useState<boolean>(false);

  const [origins, setOrigins] = useState<Origin[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadOptions();
    }
  }, [open, isAdmin, user?.id]);

  const loadOptions = async () => {
    try {
      const promises: [Promise<Origin[]>, Promise<Area[]>, Promise<Test[]>] = [
        isAdmin ? getOrigins() : Promise.resolve([]),
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

  const handleFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setImages((prev) => [...prev, e.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length > 0) {
      handleFiles(imageFiles);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async () => {
    if (!enunciado.trim() || !year || !areaId) return;
    const validAlts = alternatives.filter((a) => a.text.trim().length > 0);
    if (validAlts.length < 2) {
      alert('Informe pelo menos 2 alternativas preenchidas com texto!');
      return;
    }

    setLoading(true);
    try {
      const finalAlternatives = alternatives.map((a, idx) => ({
        identifier: a.identifier,
        text: a.text.trim(),
        isCorrect: isAnnulled ? true : idx === correctAltIndex,
      }));

      await createQuestion({
        enunciado: enunciado.trim(),
        identifier: identifier.trim() || `Q-${Date.now().toString().slice(-4)}`,
        year: Number(year),
        originId: isAdmin && originId ? Number(originId) : undefined,
        areaId: Number(areaId),
        subjectId: subjectId ? Number(subjectId) : undefined,
        testId: testId ? Number(testId) : undefined,
        isPublic,
        images: images.length > 0 ? images : undefined,
        alternatives: finalAlternatives,
      });

      setEnunciado('');
      setIdentifier('');
      setOriginId('');
      setAreaId('');
      setSubjectId('');
      setTestId('');
      setImages([]);
      setIsPublic(true);
      setIsAnnulled(false);
      onClose();
      if (onCreated) onCreated();
    } catch (err) {
      console.error('Erro ao criar questão:', err);
    } finally {
      setLoading(false);
    }
  };

  const validAlternativesCount = alternatives.filter((a) => a.text.trim().length > 0).length;
  const isFormValid =
    enunciado.trim().length > 0 &&
    Boolean(year) &&
    Boolean(areaId) &&
    validAlternativesCount >= 2;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth onPaste={handlePaste}>
      <DialogTitle sx={{ fontWeight: 800 }}>Cadastrar Nova Questão</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label="Enunciado da Questão"
            value={enunciado}
            onChange={(e) => setEnunciado(e.target.value)}
            onPaste={handlePaste}
            fullWidth
            required
            multiline
            rows={4}
            placeholder="Digite o enunciado completo da questão (ou cole texto/imagens com Ctrl+V)..."
          />

          {/* Seção de Inserção e Pré-visualização de Imagens */}
          <Box>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files) {
                  handleFiles(e.target.files);
                  e.target.value = '';
                }
              }}
            />

            {/* Drop & Paste Zone */}
            <Paper
              elevation={0}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files) {
                  handleFiles(e.dataTransfer.files);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                p: 2,
                textAlign: 'center',
                cursor: 'pointer',
                borderRadius: 2,
                border: '2px dashed',
                borderColor: isDragging ? PALETTE_COLORS.primary : 'divider',
                backgroundColor: isDragging
                  ? 'rgba(217, 183, 99, 0.08)'
                  : 'rgba(0, 0, 0, 0.02)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: PALETTE_COLORS.primary,
                  backgroundColor: 'rgba(217, 183, 99, 0.05)',
                },
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
                <CloudUploadOutlinedIcon sx={{ color: PALETTE_COLORS.primary, fontSize: 28 }} />
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="body2" fontWeight={700}>
                    Clique para selecionar imagens, arraste arquivos aqui ou cole com <Box component="span" sx={{ color: PALETTE_COLORS.primary }}>Ctrl+V</Box>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Suporta imagens em PNG, JPG, WEBP e colagens diretas da área de transferência
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            {/* Gallery Preview */}
            {images.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: 'block', mb: 1 }}>
                  Imagens anexadas ({images.length}):
                </Typography>
                <Grid container spacing={1.5}>
                  {images.map((imgSrc, idx) => (
                    <Grid item xs={6} sm={4} md={3} key={idx}>
                      <Paper
                        elevation={0}
                        sx={{
                          position: 'relative',
                          borderRadius: 2,
                          overflow: 'hidden',
                          border: '1px solid',
                          borderColor: 'divider',
                          backgroundColor: 'background.paper',
                        }}
                      >
                        <Box
                          component="img"
                          src={imgSrc}
                          alt={`Imagem ${idx + 1}`}
                          sx={{
                            width: '100%',
                            height: 120,
                            objectFit: 'contain',
                            p: 0.5,
                            backgroundColor: 'rgba(0, 0, 0, 0.02)',
                          }}
                        />
                        <Chip
                          size="small"
                          label={`Figura ${idx + 1}`}
                          sx={{
                            position: 'absolute',
                            bottom: 6,
                            left: 6,
                            height: 20,
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            color: '#ffffff',
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(idx);
                          }}
                          sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            backgroundColor: 'rgba(0, 0, 0, 0.65)',
                            color: '#ffffff',
                            p: 0.4,
                            '&:hover': {
                              backgroundColor: 'error.main',
                            },
                          }}
                        >
                          <CloseIcon fontSize="small" sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Box>

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
            {isAdmin && (
              <FormControl fullWidth size="small">
                <InputLabel>Banca (Opcional - Admin)</InputLabel>
                <Select
                  value={originId}
                  label="Banca (Opcional - Admin)"
                  onChange={(e) => setOriginId(e.target.value as number)}
                >
                  <MenuItem value="">Nenhuma Banca (Questão Avulsa)</MenuItem>
                  {origins.map((o) => (
                    <MenuItem key={o.id} value={o.id}>
                      {o.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

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
            <InputLabel>
              {isAdmin ? 'Prova Vinculada (Opcional)' : 'Minhas Provas Vinculadas (Opcional)'}
            </InputLabel>
            <Select
              value={testId}
              label={isAdmin ? 'Prova Vinculada (Opcional)' : 'Minhas Provas Vinculadas (Opcional)'}
              onChange={(e) => setTestId(e.target.value as number)}
            >
              <MenuItem value="">Nenhuma Prova (Questão Avulsa)</MenuItem>
              {tests.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name} ({t.year})
                </MenuItem>
              ))}
            </Select>
            {!isAdmin && tests.length === 0 && (
              <FormHelperText>
                Você ainda não criou nenhuma prova. Questões criadas ficarão como questões avulsas ou crie uma prova primeiro.
              </FormHelperText>
            )}
          </FormControl>

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

          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: '1px solid',
              borderColor: isAnnulled ? PALETTE_COLORS.warning : 'divider',
              backgroundColor: isAnnulled ? 'rgba(255, 152, 0, 0.08)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: isAnnulled ? 'warning.main' : 'text.primary' }}>
                Questão Anulada
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {isAnnulled
                  ? 'Todas as alternativas são corretas e qualquer resposta pontua no simulado'
                  : 'Marcar esta questão como anulada pela banca'}
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={isAnnulled}
                  onChange={(e) => setIsAnnulled(e.target.checked)}
                  color="warning"
                />
              }
              label={isAnnulled ? 'Anulada' : 'Normal'}
              sx={{ m: 0 }}
            />
          </Paper>

          <Typography variant="subtitle2" sx={{ fontWeight: 800, pt: 1 }}>
            ALTERNATIVAS DA QUESTÃO {isAnnulled ? '(Questão Anulada: todas pontuam)' : '(Mínimo de 2 alternativas fechadas. Selecione a opção correta no botão de rádio):'}
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
                    borderColor: isAnnulled
                      ? PALETTE_COLORS.warning
                      : correctAltIndex === idx
                      ? PALETTE_COLORS.success
                      : 'divider',
                    backgroundColor: isAnnulled
                      ? 'rgba(255, 152, 0, 0.05)'
                      : correctAltIndex === idx
                      ? 'rgba(75, 241, 81, 0.08)'
                      : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <FormControlLabel
                    value={idx}
                    disabled={isAnnulled}
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
          disabled={!isFormValid || loading}
          sx={{ fontWeight: 700, backgroundColor: PALETTE_COLORS.primary }}
        >
          {loading ? 'Cadastrando...' : 'Cadastrar Questão'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
