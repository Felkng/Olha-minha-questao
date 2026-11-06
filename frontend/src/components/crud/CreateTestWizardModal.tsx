import React, { useEffect, useState, useRef } from 'react';
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
  Stepper,
  Step,
  StepLabel,
  Box,
  Paper,
  IconButton,
  Alert,
  CircularProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Tooltip,
  Switch,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ImageIcon from '@mui/icons-material/Image';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import { ZoomableImage } from '../common/ZoomableImage';
import { Area, Origin, TextualReference, AvailableProvaOption } from '../../types';
import {
  getAreas,
  getOrigins,
  createTestWithQuestions,
  parseExamPdf,
  parseAnswerKeyPdf,
} from '../../services/api';
import { PALETTE_COLORS } from '../../theme/theme';
import { useAppTheme } from '../../theme/ThemeContext';
import { CreateOriginModal } from './CreateOriginModal';
import { CreateAreaModal } from './CreateAreaModal';
import { sortQuestionsByIdentifier } from '../../utils/questionUtils';
import { stripRichTextMarkup } from '../common/FormattedText';

interface CreateTestWizardModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

interface QuestionAltForm {
  identifier: string;
  text: string;
  images?: string[];
  isCorrect?: boolean;
}

interface QuestionForm {
  id: string; // temp unique client id
  identifier: string;
  originalIdentifier?: string;
  section?: string;
  enunciado: string;
  images?: string[];
  textualReferenceIndex?: number | null;
  alternatives: QuestionAltForm[];
}

const STEPS = [
  'Dados da Prova',
  'Questões',
  'Gabarito Oficial',
  'Revisão Final',
];

export const CreateTestWizardModal: React.FC<CreateTestWizardModalProps> = ({
  open,
  onClose,
  onCreated,
}) => {
  // Wizard state
  const [activeStep, setActiveStep] = useState(0);

  // Step 0: Test info
  const [name, setName] = useState('');
  const [year, setYear] = useState<number | ''>(new Date().getFullYear());
  const [originId, setOriginId] = useState<number | ''>('');
  const [areaId, setAreaId] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [creationMode, setCreationMode] = useState<'manual' | 'pdf'>('manual');
  const [examPdfFile, setExamPdfFile] = useState<File | null>(null);

  // Submodals for creating origin and area
  const [openCreateOrigin, setOpenCreateOrigin] = useState(false);
  const [openCreateArea, setOpenCreateArea] = useState(false);

  // Step 1: Questions
  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const [parsingExam, setParsingExam] = useState(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(null);
  const [draggingQuestionIndex, setDraggingQuestionIndex] = useState<number | null>(null);
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const altFileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Step 2: Answer key
  const [answerKeyPdfFile, setAnswerKeyPdfFile] = useState<File | null>(null);
  const [parsingAnswerKey, setParsingAnswerKey] = useState(false);
  const [matchedCount, setMatchedCount] = useState<number | null>(null);
  const [availableProvas, setAvailableProvas] = useState<AvailableProvaOption[]>([]);
  const [selectedProvaId, setSelectedProvaId] = useState<string>('');

  // Textual References state
  const [textualReferences, setTextualReferences] = useState<TextualReference[]>([]);
  const [openTextualRefDialog, setOpenTextualRefDialog] = useState(false);
  const [editingRefIndex, setEditingRefIndex] = useState<number | null>(null);
  const [refTitle, setRefTitle] = useState('');
  const [refSubtitle, setRefSubtitle] = useState('');
  const [refAuthor, setRefAuthor] = useState('');
  const [refReference, setRefReference] = useState('');
  const [refCaption, setRefCaption] = useState('');
  const [refContent, setRefContent] = useState('');

  const { mode } = useAppTheme();
  const isDark = mode === 'dark';

  // Options
  const [origins, setOrigins] = useState<Origin[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);

  // Submitting
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadOptions();
      resetForm();
    }
  }, [open]);

  const loadOptions = async () => {
    try {
      const [oList, aList] = await Promise.all([
        getOrigins(),
        getAreas(),
      ]);
      setOrigins(oList);
      setAreas(aList);
    } catch (err) {
      console.error('Erro ao carregar opções:', err);
    }
  };

  const resetForm = () => {
    setActiveStep(0);
    setName('');
    setYear(new Date().getFullYear());
    setOriginId('');
    setAreaId('');
    setDescription('');
    setCreationMode('manual');
    setExamPdfFile(null);
    setQuestions([]);
    setTextualReferences([]);
    setAvailableProvas([]);
    setSelectedProvaId('');
    setAnswerKeyPdfFile(null);
    setMatchedCount(null);
    setErrorMessage(null);
    setSubmitting(false);
  };

  // Find duplicate identifiers
  const getDuplicateIdentifiers = (): string[] => {
    const counts: Record<string, number> = {};
    questions.forEach((q) => {
      const iden = (q.identifier || '').trim().toLowerCase();
      if (iden) {
        counts[iden] = (counts[iden] || 0) + 1;
      }
    });
    return Object.keys(counts).filter((iden) => counts[iden] > 1);
  };

  const duplicates = getDuplicateIdentifiers();

  const [filterOnlyDuplicates, setFilterOnlyDuplicates] = useState(false);

  // Sections that actually contain duplicated/conflicting questions
  const conflictingSections = React.useMemo(() => {
    const s = new Set<string>();
    questions.forEach((q) => {
      const norm = (q.identifier || '').trim().toLowerCase();
      if (duplicates.includes(norm) && q.section && q.section.trim()) {
        s.add(q.section.trim());
      }
    });
    return Array.from(s);
  }, [questions, duplicates]);

  // Resolution 1: Keep only 1 conflicting section
  const handleKeepOnlySection = (sectionToKeep: string) => {
    const updated = questions.filter((q) => {
      const norm = (q.identifier || '').trim().toLowerCase();
      if (duplicates.includes(norm)) {
        return q.section === sectionToKeep;
      }
      return true;
    });
    setQuestions(updated);
  };

  // Resolution 2: Reindex duplicate occurrences sequentially at the end
  const handleReindexDuplicatesSequentially = () => {
    const highestNum = questions.reduce((max, q) => {
      const n = parseInt(q.identifier, 10);
      return !isNaN(n) ? Math.max(max, n) : max;
    }, 0);
    let nextId = highestNum + 1;
    const seen = new Set<string>();
    const updated = questions.map((q) => {
      const norm = (q.identifier || '').trim().toLowerCase();
      if (seen.has(norm)) {
        const oldId = q.identifier;
        const newId = `${nextId++}`;
        return {
          ...q,
          originalIdentifier: q.originalIdentifier || oldId,
          identifier: newId,
        };
      }
      seen.add(norm);
      return q;
    });
    setQuestions(updated);
  };

  // Resolution 3: Differentiate duplicates with section suffix
  const handleDifferentiateWithSectionSuffix = () => {
    const seen = new Set<string>();
    const updated = questions.map((q) => {
      const norm = (q.identifier || '').trim().toLowerCase();
      if (duplicates.includes(norm)) {
        let suffix = '';
        if (q.section) {
          if (q.section.toLowerCase().includes('ingl')) suffix = '-ING';
          else if (q.section.toLowerCase().includes('espanh')) suffix = '-ESP';
          else if (q.section.toLowerCase().includes('franc')) suffix = '-FRA';
          else suffix = `-${q.section.substring(0, 3).toUpperCase()}`;
        } else {
          suffix = seen.has(norm) ? '-2' : '-1';
        }
        seen.add(norm);
        return {
          ...q,
          originalIdentifier: q.originalIdentifier || q.identifier,
          identifier: `${q.identifier}${suffix}`,
        };
      }
      return q;
    });
    setQuestions(updated);
  };

  // Handlers for Step 0 -> Step 1
  const handleProceedFromStep0 = async () => {
    if (!name.trim() || !year) {
      setErrorMessage('Preencha o nome e o ano da prova.');
      return;
    }
    setErrorMessage(null);

    if (creationMode === 'pdf' && examPdfFile) {
      setParsingExam(true);
      try {
        const parsed = await parseExamPdf(examPdfFile);
        const parsedQuestions = parsed.questions || [];
        if (parsedQuestions.length === 0) {
          setErrorMessage('Nenhuma questão pôde ser identificada no PDF. Verifique o arquivo ou prossiga manualmente.');
          setParsingExam(false);
          return;
        }

        setTextualReferences(parsed.textualReferences || []);

        const formattedQuestions: QuestionForm[] = parsedQuestions.map((pq, idx) => ({
          id: `q_${Date.now()}_${idx}`,
          identifier: pq.identifier || `${idx + 1}`,
          originalIdentifier: pq.identifier || `${idx + 1}`,
          section: pq.section,
          enunciado: pq.enunciado || '',
          images: pq.images || [],
          textualReferenceIndex: pq.textualReferenceIndex !== undefined && pq.textualReferenceIndex !== null ? pq.textualReferenceIndex : null,
          alternatives: (pq.alternatives && pq.alternatives.length > 0)
            ? pq.alternatives.map((alt) => {
                const extractedImages: string[] = [];
                const cleanText = (alt.text || '')
                  .replace(/!\[.*?\]\((data:image\/[^)]+|https?:\/\/[^)]+)\)/g, (_, url) => {
                    extractedImages.push(url);
                    return '';
                  })
                  .trim();
                const combinedImages = [...((alt as any).images || []), ...extractedImages];
                return {
                  identifier: alt.identifier,
                  text: cleanText,
                  images: combinedImages,
                  isCorrect: false,
                };
              })
            : [
                { identifier: 'A', text: '', images: [], isCorrect: false },
                { identifier: 'B', text: '', images: [], isCorrect: false },
                { identifier: 'C', text: '', images: [], isCorrect: false },
                { identifier: 'D', text: '', images: [], isCorrect: false },
                { identifier: 'E', text: '', images: [], isCorrect: false },
              ],
        }));

        setQuestions(formattedQuestions);
        setActiveStep(1);
      } catch (err: any) {
        console.error('Erro ao processar PDF da prova:', err);
        setErrorMessage('Falha ao processar o PDF da prova. Verifique se o Worker está ativo e o formato do PDF é legível.');
      } finally {
        setParsingExam(false);
      }
    } else {
      // If manual mode and no questions yet, create 1 empty question template
      if (questions.length === 0) {
        handleAddManualQuestion();
      }
      setActiveStep(1);
    }
  };

  // Add a manual question
  const handleAddManualQuestion = () => {
    const nextNum = questions.length + 1;
    const newQ: QuestionForm = {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      identifier: `${nextNum}`,
      enunciado: '',
      images: [],
      alternatives: [
        { identifier: 'A', text: '', images: [], isCorrect: false },
        { identifier: 'B', text: '', images: [], isCorrect: false },
        { identifier: 'C', text: '', images: [], isCorrect: false },
        { identifier: 'D', text: '', images: [], isCorrect: false },
        { identifier: 'E', text: '', images: [], isCorrect: false },
      ],
    };
    setQuestions((prev) => [...prev, newQ]);
    setActiveQuestionIndex(questions.length);
  };

  // Remove question
  const handleRemoveQuestion = (index: number) => {
    const updated = [...questions];
    updated.splice(index, 1);
    setQuestions(updated);
    if (activeQuestionIndex === index) {
      setActiveQuestionIndex(null);
    } else if (activeQuestionIndex !== null && activeQuestionIndex > index) {
      setActiveQuestionIndex(activeQuestionIndex - 1);
    }
  };

  // Update question field
  const handleUpdateQuestion = (index: number, field: 'identifier' | 'enunciado' | 'textualReferenceIndex', val: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: val };
    setQuestions(updated);
  };

  // Remove question image
  const handleRemoveQuestionImage = (qIndex: number, imgIndex: number) => {
    const updated = [...questions];
    const currentImgs = [...(updated[qIndex].images || [])];
    currentImgs.splice(imgIndex, 1);
    updated[qIndex] = { ...updated[qIndex], images: currentImgs };
    setQuestions(updated);
  };

  // Add images to a question
  const handleAddQuestionImages = (qIndex: number, files: FileList | File[]) => {
    const fileList = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileList.length === 0) return;

    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const dataUrl = e.target.result as string;
          setQuestions((prev) => {
            const copy = [...prev];
            if (!copy[qIndex]) return prev;
            const currentImages = copy[qIndex].images || [];
            copy[qIndex] = {
              ...copy[qIndex],
              images: [...currentImages, dataUrl],
            };
            return copy;
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const extractAndAddQuestionImages = (qIndex: number, data: DataTransfer | null): boolean => {
    if (!data) return false;
    const imageFiles: File[] = [];

    if (data.files && data.files.length > 0) {
      for (let i = 0; i < data.files.length; i++) {
        const file = data.files[i];
        if (file.type.startsWith('image/')) {
          imageFiles.push(file);
        }
      }
    }

    if (imageFiles.length === 0 && data.items && data.items.length > 0) {
      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        }
      }
    }

    if (imageFiles.length > 0) {
      handleAddQuestionImages(qIndex, imageFiles);
      return true;
    }
    return false;
  };

  const handleQuestionPaste = (qIndex: number, e: React.ClipboardEvent) => {
    const hadImages = extractAndAddQuestionImages(qIndex, e.clipboardData);
    if (hadImages) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Remove alternative image
  const handleRemoveAlternativeImage = (qIndex: number, altIndex: number, imgIndex: number) => {
    setQuestions((prev) => {
      const copy = [...prev];
      if (!copy[qIndex] || !copy[qIndex].alternatives[altIndex]) return prev;
      const alts = [...copy[qIndex].alternatives];
      const currentImgs = [...(alts[altIndex].images || [])];
      currentImgs.splice(imgIndex, 1);
      alts[altIndex] = { ...alts[altIndex], images: currentImgs };
      copy[qIndex] = { ...copy[qIndex], alternatives: alts };
      return copy;
    });
  };

  // Add images to alternative
  const handleAddAlternativeImages = (qIndex: number, altIndex: number, files: FileList | File[]) => {
    const fileList = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileList.length === 0) return;

    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const dataUrl = e.target.result as string;
          setQuestions((prev) => {
            const copy = [...prev];
            if (!copy[qIndex] || !copy[qIndex].alternatives[altIndex]) return prev;
            const alts = [...copy[qIndex].alternatives];
            const currentImages = alts[altIndex].images || [];
            alts[altIndex] = {
              ...alts[altIndex],
              images: [...currentImages, dataUrl],
            };
            copy[qIndex] = { ...copy[qIndex], alternatives: alts };
            return copy;
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const extractAndAddAlternativeImages = (qIndex: number, altIndex: number, data: DataTransfer | null): boolean => {
    if (!data) return false;
    const imageFiles: File[] = [];

    if (data.files && data.files.length > 0) {
      for (let i = 0; i < data.files.length; i++) {
        const file = data.files[i];
        if (file.type.startsWith('image/')) {
          imageFiles.push(file);
        }
      }
    }

    if (imageFiles.length === 0 && data.items && data.items.length > 0) {
      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        }
      }
    }

    if (imageFiles.length > 0) {
      handleAddAlternativeImages(qIndex, altIndex, imageFiles);
      return true;
    }
    return false;
  };

  const handleAlternativePaste = (qIndex: number, altIndex: number, e: React.ClipboardEvent) => {
    const hadImages = extractAndAddAlternativeImages(qIndex, altIndex, e.clipboardData);
    if (hadImages) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  useEffect(() => {
    if (!open || activeStep !== 1) return;

    const handleWindowPaste = (e: ClipboardEvent) => {
      // Don't intercept paste if active element is an input, textarea or contentEditable
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable)
      ) {
        return;
      }

      const targetIndex =
        activeQuestionIndex !== null && activeQuestionIndex >= 0 && activeQuestionIndex < questions.length
          ? activeQuestionIndex
          : questions.length === 1
          ? 0
          : null;

      if (targetIndex === null) return;

      const hadImages = extractAndAddQuestionImages(targetIndex, e.clipboardData);
      if (hadImages) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('paste', handleWindowPaste);
    return () => {
      window.removeEventListener('paste', handleWindowPaste);
    };
  }, [open, activeStep, activeQuestionIndex, questions.length]);

  // Update alternative text
  const handleUpdateAltText = (qIndex: number, altIndex: number, text: string) => {
    const updated = [...questions];
    const alts = [...updated[qIndex].alternatives];
    alts[altIndex] = { ...alts[altIndex], text };
    updated[qIndex] = { ...updated[qIndex], alternatives: alts };
    setQuestions(updated);
  };

  // Add alternative to a question
  const handleAddAlternative = (qIndex: number) => {
    const updated = [...questions];
    const alts = [...updated[qIndex].alternatives];
    const nextIdentifier = String.fromCharCode(65 + alts.length); // A, B, C...
    alts.push({ identifier: nextIdentifier, text: '', images: [], isCorrect: false });
    updated[qIndex] = { ...updated[qIndex], alternatives: alts };
    setQuestions(updated);
  };

  // Remove alternative from question
  const handleRemoveAlternative = (qIndex: number, altIndex: number) => {
    const updated = [...questions];
    const alts = [...updated[qIndex].alternatives];
    if (alts.length <= 2) return; // Mínimo 2 alternativas
    alts.splice(altIndex, 1);
    updated[qIndex] = { ...updated[qIndex], alternatives: alts };
    setQuestions(updated);
  };

  // Set correct alternative for question
  const handleSetCorrectAlternative = (qIndex: number, altIdentifier: string) => {
    const updated = [...questions];
    const alts = updated[qIndex].alternatives.map((alt) => ({
      ...alt,
      isCorrect: alt.identifier.toUpperCase() === altIdentifier.toUpperCase(),
    }));
    updated[qIndex] = { ...updated[qIndex], alternatives: alts };
    setQuestions(updated);
  };

  // Toggle annulled state for question (all alternatives correct)
  const handleToggleAnnulled = (qIndex: number) => {
    const updated = [...questions];
    const q = updated[qIndex];
    const isCurrentlyAnnulled = q.alternatives.length > 0 && q.alternatives.every((a) => a.isCorrect);
    const alts = q.alternatives.map((alt) => ({
      ...alt,
      isCorrect: !isCurrentlyAnnulled,
    }));
    updated[qIndex] = { ...q, alternatives: alts };
    setQuestions(updated);
  };

  // Parse answer key PDF
  const handleUploadAnswerKeyPdf = async (file: File, provaToSelect?: string, isNewFile: boolean = false) => {
    setParsingAnswerKey(true);
    setErrorMessage(null);
    try {
      const targetProva = isNewFile ? undefined : (provaToSelect || selectedProvaId || undefined);
      const res = await parseAnswerKeyPdf(file, targetProva);
      const answers = res.answers || [];
      const provas = res.availableProvas || [];
      setAvailableProvas(provas);
      if (res.selectedProva) {
        setSelectedProvaId(res.selectedProva);
      } else if (provas.length > 0) {
        setSelectedProvaId(provas[0].id);
      } else {
        setSelectedProvaId('');
      }

      if (!answers || answers.length === 0) {
        setErrorMessage('Não foi possível identificar correspondências de gabarito no PDF.');
        setParsingAnswerKey(false);
        return;
      }

      // Map answers by normalized identifier
      const ansMap: Record<string, string> = {};
      answers.forEach((ans) => {
        const iden = (ans.identifier || '').trim().toLowerCase();
        if (iden) {
          ansMap[iden] = ans.correctAlternative.toUpperCase();
        }
      });

      const sectionAnswers = res.sectionAnswers || {};

      let matches = 0;
      const updated = questions.map((q) => {
        const qIden = (q.identifier || '').trim().toLowerCase();
        const origIden = (q.originalIdentifier || q.identifier || '').trim().toLowerCase();

        let correctLetter: string | undefined = undefined;

        // 1. Tenta encontrar a resposta pela seção da questão (ex: LÍNGUA ESTRANGEIRA - INGLÊS / ESPANHOL)
        if (q.section && Object.keys(sectionAnswers).length > 0) {
          const qSecLower = q.section.toLowerCase();
          for (const [secKey, sList] of Object.entries(sectionAnswers)) {
            const secKeyLower = secKey.toLowerCase();
            if (
              secKeyLower === qSecLower ||
              (qSecLower.includes('ingl') && secKeyLower.includes('ingl')) ||
              (qSecLower.includes('espanh') && secKeyLower.includes('espanh')) ||
              (qSecLower.includes('franc') && secKeyLower.includes('franc'))
            ) {
              const found = sList.find(
                (item) =>
                  (item.identifier || '').trim().toLowerCase() === origIden ||
                  (item.identifier || '').trim().toLowerCase() === qIden
              );
              if (found) {
                correctLetter = found.correctAlternative.toUpperCase();
                break;
              }
            }
          }
        }

        // 2. Fallback para ansMap geral por originalIdentifier ou identifier
        if (!correctLetter) {
          correctLetter = ansMap[origIden] || ansMap[qIden];
        }

        if (correctLetter) {
          matches++;
          const isAnnulled = correctLetter === 'X' || correctLetter === 'ANULADA';
          return {
            ...q,
            alternatives: q.alternatives.map((alt) => ({
              ...alt,
              isCorrect: isAnnulled ? true : alt.identifier.toUpperCase() === correctLetter,
            })),
          };
        }
        // Se trocou de gabarito e a questão não está no novo gabarito, desmarca alternativas antigas
        return {
          ...q,
          alternatives: q.alternatives.map((alt) => ({
            ...alt,
            isCorrect: false,
          })),
        };
      });

      setQuestions(updated);
      setMatchedCount(matches);
    } catch (err: any) {
      console.error('Erro ao processar gabarito:', err);
      const serverMsg = err.response?.data?.message || err.message;
      setErrorMessage(serverMsg ? `Falha ao processar o PDF do gabarito: ${serverMsg}` : 'Falha ao processar o PDF do gabarito.');
    } finally {
      setParsingAnswerKey(false);
    }
  };

  // Submit test with all questions
  const handleSubmitAll = async () => {
    if (!name.trim() || !year) {
      setErrorMessage('Nome e ano da prova são obrigatórios.');
      return;
    }
    if (questions.length === 0) {
      setErrorMessage('A prova deve ter pelo menos 1 questão.');
      return;
    }
    if (duplicates.length > 0) {
      setErrorMessage(`Existem identificadores duplicados (${duplicates.join(', ')}). Corrija-os antes de salvar.`);
      return;
    }

    // Validate minimum alternatives
    for (let i = 0; i < questions.length; i++) {
      if (questions[i].alternatives.length < 2) {
        setErrorMessage(`A questão ${questions[i].identifier || i + 1} deve conter no mínimo 2 alternativas.`);
        return;
      }
      if (!questions[i].enunciado.trim()) {
        setErrorMessage(`A questão ${questions[i].identifier || i + 1} possui enunciado em branco.`);
        return;
      }
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const sortedQuestions = sortQuestionsByIdentifier(questions);
      await createTestWithQuestions({
        name: name.trim(),
        year: Number(year),
        originId: originId ? Number(originId) : null,
        areaId: areaId ? Number(areaId) : null,
        description: description.trim() || undefined,
        isPublic,
        textualReferences: textualReferences.map((ref) => {
          const cleanRef = (ref.reference || ref.source || '')
            .replace(/!\[.*?\]\([^)]+\)/g, '')
            .trim() || undefined;
          const cleanSource = (ref.source || ref.reference || '')
            .replace(/!\[.*?\]\([^)]+\)/g, '')
            .trim() || undefined;
          return {
            title: ref.title?.trim() || undefined,
            subtitle: ref.subtitle?.trim() || undefined,
            content: ref.content?.trim() || undefined,
            author: ref.author?.trim() || undefined,
            reference: cleanRef,
            caption: ref.caption?.trim() || undefined,
            source: cleanSource,
            mediaUrl: ref.mediaUrl?.trim() || undefined,
          };
        }),
        questions: sortedQuestions.map((q) => ({
          identifier: q.identifier.trim(),
          enunciado: q.enunciado.trim(),
          images: q.images || [],
          year: Number(year),
          originId: originId ? Number(originId) : null,
          areaId: areaId ? Number(areaId) : null,
          textualReferenceIndex:
            q.textualReferenceIndex !== undefined && q.textualReferenceIndex !== null
              ? Number(q.textualReferenceIndex)
              : null,
          alternatives: q.alternatives.map((alt) => {
            const cleanText = (alt.text || '').trim();
            const existingImages = new Set<string>();
            const regex = /!\[.*?\]\((data:image\/[^)]+|https?:\/\/[^)]+)\)/g;
            let match;
            while ((match = regex.exec(cleanText)) !== null) {
              existingImages.add(match[1]);
            }
            const newMdImages = (alt.images || [])
              .filter((img) => !existingImages.has(img))
              .map((img) => `![Imagem](${img})`)
              .join('\n');
            const combined = [cleanText, newMdImages].filter(Boolean).join('\n');
            return {
              identifier: alt.identifier.trim(),
              text: combined || (alt.images && alt.images.length > 0 ? '[Imagem]' : `[Opção ${alt.identifier.trim()}]`),
              isCorrect: Boolean(alt.isCorrect),
            };
          }),
        })),
      });

      onClose();
      if (onCreated) onCreated();
    } catch (err: any) {
      console.error('Erro ao salvar prova com questões:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Erro ao cadastrar a prova.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
        Cadastrar Nova Prova / Simulado
      </DialogTitle>

      <Box sx={{ px: 3, pt: 1, pb: 2 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <DialogContent dividers sx={{ minHeight: 420, maxHeight: '65vh', overflowY: 'auto', overflowX: 'hidden' }}>
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        )}

        {/* STEP 0: DADOS DA PROVA */}
        {activeStep === 0 && (
          <Stack spacing={2.5}>
            <TextField
              label="Nome da Prova (ex: ENEM 2024 - Caderno Azul)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              required
              size="small"
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <TextField
                label="Ano"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value ? Number(e.target.value) : '')}
                sx={{ width: { xs: '100%', sm: '140px' } }}
                required
                size="small"
              />

              <Box sx={{ display: 'flex', gap: 0.5, flex: 1, width: '100%', alignItems: 'center' }}>
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
                <Tooltip title="Cadastrar nova Banca">
                  <IconButton
                    color="primary"
                    onClick={() => setOpenCreateOrigin(true)}
                    sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: '7px' }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              <Box sx={{ display: 'flex', gap: 0.5, flex: 1, width: '100%', alignItems: 'center' }}>
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
                <Tooltip title="Cadastrar nova Área">
                  <IconButton
                    color="primary"
                    onClick={() => setOpenCreateArea(true)}
                    sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: '7px' }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Stack>

            <TextField
              label="Descrição (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
              size="small"
            />

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

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                Como deseja adicionar as questões desta prova?
              </Typography>
              <RadioGroup
                value={creationMode}
                onChange={(e) => setCreationMode(e.target.value as 'manual' | 'pdf')}
              >
                <FormControlLabel
                  value="manual"
                  control={<Radio size="small" />}
                  label="Criar ou digitar as questões manualmente na próxima etapa"
                />
                <FormControlLabel
                  value="pdf"
                  control={<Radio size="small" />}
                  label="Importar questões automaticamente de um arquivo PDF da prova"
                />
              </RadioGroup>

              {creationMode === 'pdf' && (
                <Box sx={{ mt: 2, p: 2, border: '1px dashed #ccc', borderRadius: 2, textAlign: 'center' }}>
                  <input
                    type="file"
                    accept=".pdf"
                    id="exam-pdf-upload"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setExamPdfFile(e.target.files[0]);
                      }
                    }}
                  />
                  <label htmlFor="exam-pdf-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<UploadFileIcon />}
                      size="small"
                      sx={{ mb: 1 }}
                    >
                      {examPdfFile ? 'Alterar Arquivo PDF' : 'Selecionar Arquivo PDF da Prova'}
                    </Button>
                  </label>
                  {examPdfFile && (
                    <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                      Arquivo selecionado: {examPdfFile.name} ({(examPdfFile.size / 1024 / 1024).toFixed(2)} MB)
                    </Typography>
                  )}
                </Box>
              )}
            </Paper>

            {parsingExam && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                <CircularProgress size={24} />
                <Typography variant="body2" color="text.secondary">
                  Processando o PDF da prova e extraindo questões... Por favor, aguarde.
                </Typography>
              </Box>
            )}
          </Stack>
        )}

        {/* STEP 1: QUESTÕES */}
        {activeStep === 1 && (
          <Stack spacing={2} sx={{ minWidth: 0, width: '100%' }}>
            {duplicates.length > 0 && (
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  border: `1.5px solid ${PALETTE_COLORS.primary}`,
                  backgroundColor: isDark ? 'rgba(217, 183, 99, 0.08)' : 'rgba(217, 183, 99, 0.12)',
                }}
              >
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <WarningAmberIcon sx={{ color: PALETTE_COLORS.primary, fontSize: 30, mt: 0.3 }} />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: PALETTE_COLORS.primary, fontSize: '1rem' }}>
                        Conflito de Questões com Mesmo Identificador ({duplicates.length} repetidas)
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.5 }}>
                        Identificadores duplicados: <strong>{duplicates.join(', ')}</strong>. Comum em provas com múltiplos idiomas (ex: Inglês e Espanhol).
                        Cada questão na prova deve possuir uma numeração única. Resolva em lote abaixo ou altere individualmente:
                      </Typography>
                    </Box>
                  </Box>

                  {conflictingSections.length > 1 && (
                    <Box sx={{ pt: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Manter apenas questões da seção:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                        {conflictingSections.map((sec) => (
                          <Button
                            key={sec}
                            size="small"
                            variant="contained"
                            onClick={() => handleKeepOnlySection(sec)}
                            sx={{
                              backgroundColor: PALETTE_COLORS.primary,
                              color: '#1a1e26',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              textTransform: 'none',
                              px: 2,
                              py: 0.8,
                              borderRadius: 2,
                              boxShadow: 'none',
                              '&:hover': {
                                backgroundColor: '#c4a350',
                                boxShadow: 'none',
                              },
                            }}
                          >
                            {sec}
                          </Button>
                        ))}
                      </Box>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', pt: 1, borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={handleReindexDuplicatesSequentially}
                      sx={{
                        borderColor: PALETTE_COLORS.secondary,
                        color: PALETTE_COLORS.secondary,
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        textTransform: 'none',
                        px: 2,
                        py: 0.6,
                        borderRadius: 2,
                        '&:hover': {
                          borderColor: PALETTE_COLORS.secondary,
                          backgroundColor: 'rgba(90, 166, 226, 0.08)',
                        },
                      }}
                    >
                      Reindexar Duplicadas ao Final
                    </Button>

                    <Button
                      size="small"
                      variant="outlined"
                      onClick={handleDifferentiateWithSectionSuffix}
                      sx={{
                        borderColor: PALETTE_COLORS.secondary,
                        color: PALETTE_COLORS.secondary,
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        textTransform: 'none',
                        px: 2,
                        py: 0.6,
                        borderRadius: 2,
                        '&:hover': {
                          borderColor: PALETTE_COLORS.secondary,
                          backgroundColor: 'rgba(90, 166, 226, 0.08)',
                        },
                      }}
                    >
                      Diferenciar com Sufixo da Seção
                    </Button>

                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={filterOnlyDuplicates}
                          onChange={(e) => setFilterOnlyDuplicates(e.target.checked)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: PALETTE_COLORS.secondary,
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: PALETTE_COLORS.secondary,
                            },
                          }}
                        />
                      }
                      label={
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                          Exibir apenas conflitantes
                        </Typography>
                      }
                      sx={{ ml: 'auto' }}
                    />
                  </Box>
                </Stack>
              </Paper>
            )}

            {/* Gerenciamento de Textos de Apoio / Referências Textuais */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: isDark ? 'background.paper' : '#fbfbfb', minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, flex: 1, mr: 1 }}>
                  <MenuBookIcon color="primary" sx={{ flexShrink: 0 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
                    Textos de Apoio / Referências Textuais ({textualReferences.length})
                  </Typography>
                </Stack>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  sx={{ flexShrink: 0 }}
                  onClick={() => {
                    setEditingRefIndex(null);
                    setRefTitle('');
                    setRefSubtitle('');
                    setRefAuthor('');
                    setRefReference('');
                    setRefCaption('');
                    setRefContent('');
                    setOpenTextualRefDialog(true);
                  }}
                >
                  Adicionar Texto
                </Button>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Textos de interpretação identificados no PDF ou cadastrados manualmente. Cada questão abaixo pode ser associada a um desses textos através do seletor.
              </Typography>

              {textualReferences.length === 0 ? (
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block' }}>
                  Nenhum texto de apoio adicionado. Se a prova possui textos longos de leitura ou interpretação, adicione-os aqui.
                </Typography>
              ) : (
                <Stack spacing={1} sx={{ minWidth: 0, width: '100%' }}>
                  {textualReferences.map((ref, rIdx) => (
                    <Accordion
                      key={rIdx}
                      disableGutters
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: '8px !important',
                        mb: 1,
                        width: '100%',
                        maxWidth: '100%',
                        minWidth: 0,
                        overflow: 'hidden',
                        '&:before': { display: 'none' },
                        bgcolor: 'background.default',
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ flexShrink: 0 }} />}
                        sx={{
                          minHeight: 52,
                          maxWidth: '100%',
                          minWidth: 0,
                          overflow: 'hidden',
                          '& .MuiAccordionSummary-content': {
                            my: 0.5,
                            alignItems: 'center',
                            minWidth: 0,
                            maxWidth: '100%',
                            overflow: 'hidden',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', minWidth: 0, pr: 1 }}>
                          <Box sx={{ flex: 1, minWidth: 0, mr: 2, overflow: 'hidden' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                              {ref.title || ref.subtitle || `Texto ${rIdx + 1}`}
                            </Typography>
                            {ref.subtitle && ref.title && (
                              <Typography variant="caption" sx={{ fontStyle: 'italic', display: 'block', color: 'text.secondary' }} noWrap>
                                {ref.subtitle}
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                              {[
                                ref.author,
                                ref.reference || ref.source,
                                ref.caption ? `Legenda: ${ref.caption}` : null,
                              ]
                                .filter(Boolean)
                                .join(' • ') || (ref.content ? ref.content.substring(0, 80) + '...' : 'Sem conteúdo adicional')}
                            </Typography>
                          </Box>

                          <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                            <Tooltip title="Editar Referência">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setEditingRefIndex(rIdx);
                                  setRefTitle(ref.title || '');
                                  setRefSubtitle(ref.subtitle || '');
                                  setRefAuthor(ref.author || '');
                                  setRefReference(ref.reference || ref.source || '');
                                  setRefCaption(ref.caption || '');
                                  setRefContent(ref.content || '');
                                  setOpenTextualRefDialog(true);
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Excluir Referência">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  const updated = textualReferences.filter((_, i) => i !== rIdx);
                                  setTextualReferences(updated);
                                  setQuestions((prev) =>
                                    prev.map((q) => {
                                      if (q.textualReferenceIndex === rIdx) {
                                        return { ...q, textualReferenceIndex: null };
                                      } else if (q.textualReferenceIndex !== undefined && q.textualReferenceIndex !== null && q.textualReferenceIndex > rIdx) {
                                        return { ...q, textualReferenceIndex: q.textualReferenceIndex - 1 };
                                      }
                                      return q;
                                    })
                                  );
                                }}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Box>
                      </AccordionSummary>

                      <AccordionDetails sx={{ pt: 1, pb: 2, px: 2, borderTop: '1px solid', borderColor: 'divider', minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>
                        {ref.subtitle && (
                          <Typography variant="subtitle2" sx={{ fontStyle: 'italic', fontWeight: 600, color: 'text.secondary', mb: 1, wordBreak: 'break-word' }}>
                            {ref.subtitle}
                          </Typography>
                        )}

                        {ref.caption && (
                          <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: PALETTE_COLORS.secondary, mb: 1, wordBreak: 'break-word' }}>
                            {ref.caption}
                          </Typography>
                        )}

                        {ref.content && (
                          <Paper variant="outlined" sx={{ p: 2, bgcolor: isDark ? 'rgba(0,0,0,0.2)' : '#fff', borderRadius: 1.5, maxHeight: 300, overflowY: 'auto', wordBreak: 'break-word' }}>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.7, wordBreak: 'break-word' }}>
                              {ref.content}
                            </Typography>
                          </Paper>
                        )}

                        {(ref.author || ref.reference || ref.source) && (
                          <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px dashed', borderColor: 'divider', wordBreak: 'break-word' }}>
                            {ref.author && (
                              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', wordBreak: 'break-word' }}>
                                <strong>Autor:</strong> {ref.author}
                              </Typography>
                            )}
                            {(ref.reference || ref.source) && (
                              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.5, wordBreak: 'break-all' }}>
                                <strong>Fonte / Referência:</strong>{' '}
                                {(() => {
                                  const url = ref.reference || ref.source || '';
                                  const isUrl = url.startsWith('http://') || url.startsWith('https://') || url.startsWith('www.');
                                  const fullUrl = url.startsWith('www.') ? `https://${url}` : url;
                                  return isUrl ? (
                                    <a href={fullUrl} target="_blank" rel="noopener noreferrer" style={{ color: PALETTE_COLORS.primary, textDecoration: 'underline', wordBreak: 'break-all' }}>
                                      {url}
                                    </a>
                                  ) : (
                                    url
                                  );
                                })()}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Stack>
              )}
            </Paper>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Questões da Prova ({questions.length})
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddManualQuestion}
              >
                Adicionar Questão
              </Button>
            </Box>

            {(filterOnlyDuplicates
              ? questions.filter((q) => duplicates.includes((q.identifier || '').trim().toLowerCase()))
              : questions
            ).map((q) => {
              const qIndex = questions.findIndex((item) => item.id === q.id);
              const isDuplicate = duplicates.includes((q.identifier || '').trim().toLowerCase());
              return (
                <Accordion
                  key={q.id}
                  disableGutters
                  onChange={(_, isExpanded) => {
                    if (isExpanded) {
                      setActiveQuestionIndex(qIndex);
                    } else if (activeQuestionIndex === qIndex) {
                      setActiveQuestionIndex(null);
                    }
                  }}
                  onFocus={() => setActiveQuestionIndex(qIndex)}
                  sx={{
                    border: isDuplicate ? '1.5px solid #f44336' : '1px solid',
                    borderColor: isDuplicate ? 'error.main' : 'divider',
                    borderRadius: '8px !important',
                    mb: 1.5,
                    width: '100%',
                    maxWidth: '100%',
                    minWidth: 0,
                    overflow: 'hidden',
                    '&:before': { display: 'none' },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ flexShrink: 0 }} />}
                    sx={{
                      minHeight: 52,
                      height: 52,
                      maxWidth: '100%',
                      minWidth: 0,
                      overflow: 'hidden',
                      '&.Mui-expanded': { minHeight: 52, height: 52 },
                      px: 2,
                      '& .MuiAccordionSummary-content': {
                        m: 0,
                        alignItems: 'center',
                        minWidth: 0,
                        maxWidth: '100%',
                        overflow: 'hidden',
                      },
                      '& .MuiAccordionSummary-content.Mui-expanded': {
                        m: 0,
                        minWidth: 0,
                        maxWidth: '100%',
                        overflow: 'hidden',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        gap: 1.5,
                        overflow: 'hidden',
                      }}
                    >
                      {/* Fixed width question identifier chip */}
                      <Chip
                        label={`#${q.identifier || qIndex + 1}`}
                        color={isDuplicate ? 'error' : 'primary'}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          minWidth: 50,
                          maxWidth: 75,
                          height: 28,
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      />

                      {q.section && (
                        <Chip
                          label={q.section}
                          variant="outlined"
                          size="small"
                          sx={{
                            fontWeight: 600,
                            height: 24,
                            fontSize: '0.72rem',
                            flexShrink: 0,
                          }}
                        />
                      )}

                      {isDuplicate && (
                        <Chip
                          label="Duplicada"
                          color="error"
                          size="small"
                          sx={{
                            fontWeight: 700,
                            height: 24,
                            fontSize: '0.72rem',
                            flexShrink: 0,
                          }}
                        />
                      )}

                      {/* Truncated Enunciado */}
                      <Typography
                        variant="body2"
                        sx={{
                          flex: 1,
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: 'text.primary',
                        }}
                      >
                        {q.enunciado ? stripRichTextMarkup(q.enunciado).substring(0, 100) + '...' : 'Questão sem enunciado'}
                      </Typography>

                      {/* Quick Textual Reference Selector in Header */}
                      {textualReferences.length > 0 && (
                        <Box
                          onClick={(e) => e.stopPropagation()}
                          sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 0.5 }}
                        >
                          <FormControl size="small" sx={{ minWidth: 140, maxWidth: 200 }}>
                            <Select
                              value={q.textualReferenceIndex !== undefined && q.textualReferenceIndex !== null ? q.textualReferenceIndex : ''}
                              displayEmpty
                              size="small"
                              sx={{
                                height: 30,
                                fontSize: '0.78rem',
                                borderRadius: '8px',
                                bgcolor: q.textualReferenceIndex != null
                                  ? (isDark ? 'rgba(217, 183, 99, 0.15)' : 'rgba(217, 183, 99, 0.2)')
                                  : 'action.hover',
                                fontWeight: q.textualReferenceIndex != null ? 700 : 500,
                                '& .MuiSelect-select': {
                                  py: 0.5,
                                  pr: '24px !important',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                },
                              }}
                              onChange={(e) => {
                                const val = e.target.value;
                                handleUpdateQuestion(qIndex, 'textualReferenceIndex', val === '' ? null : Number(val));
                              }}
                              renderValue={(selected) => {
                                if (typeof selected !== 'number') {
                                  return (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                                      <MenuBookIcon sx={{ fontSize: '0.95rem' }} />
                                      <span style={{ fontSize: '0.75rem' }}>+ Texto</span>
                                    </Box>
                                  );
                                }
                                const ref = textualReferences[selected];
                                return (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: PALETTE_COLORS.primary }}>
                                    <MenuBookIcon sx={{ fontSize: '0.95rem' }} />
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
                                      {ref?.title || ref?.subtitle || `Texto ${Number(selected) + 1}`}
                                    </span>
                                  </Box>
                                );
                              }}
                            >
                              <MenuItem value="" sx={{ fontSize: '0.8rem' }}>
                                <em>Nenhum texto de apoio</em>
                              </MenuItem>
                              {textualReferences.map((ref, rIdx) => (
                                <MenuItem key={rIdx} value={rIdx} sx={{ fontSize: '0.8rem' }}>
                                  {ref.title || ref.subtitle || `Texto ${rIdx + 1}`}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>
                      )}

                      {/* Alternatives count chip */}
                      <Chip
                        label={`${q.alternatives.length} alts`}
                        size="small"
                        variant="outlined"
                        sx={{ flexShrink: 0, minWidth: 60, height: 24 }}
                      />

                      {/* Delete question button */}
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveQuestion(qIndex);
                        }}
                        sx={{ flexShrink: 0, p: 0.5 }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails onPaste={(e) => handleQuestionPaste(qIndex, e)}>
                    <Stack spacing={2}>
                      <TextField
                        label="Número / Identificador da Questão"
                        value={q.identifier}
                        onChange={(e) => handleUpdateQuestion(qIndex, 'identifier', e.target.value)}
                        size="small"
                        sx={{ maxWidth: 200 }}
                        error={isDuplicate}
                        helperText={isDuplicate ? 'Identificador duplicado' : ''}
                      />

                      <TextField
                        label="Enunciado da Questão"
                        value={q.enunciado}
                        onChange={(e) => handleUpdateQuestion(qIndex, 'enunciado', e.target.value)}
                        onPaste={(e) => handleQuestionPaste(qIndex, e)}
                        multiline
                        rows={3}
                        fullWidth
                        size="small"
                        placeholder="Digite o enunciado da questão (ou cole texto/imagens com Ctrl+V)..."
                      />

                      {/* Seção de Inserção e Pré-visualização de Imagens */}
                      <Box sx={{ mt: 0.5, mb: 1 }}>
                        <input
                          type="file"
                          ref={(el) => {
                            fileInputRefs.current[qIndex] = el;
                          }}
                          accept="image/*"
                          multiple
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            if (e.target.files) {
                              handleAddQuestionImages(qIndex, e.target.files);
                              e.target.value = '';
                            }
                          }}
                        />

                        {/* Drop & Paste Zone */}
                        <Paper
                          elevation={0}
                          tabIndex={0}
                          onPaste={(e) => handleQuestionPaste(qIndex, e)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDraggingQuestionIndex(qIndex);
                          }}
                          onDragLeave={() => setDraggingQuestionIndex(null)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setDraggingQuestionIndex(null);
                            if (e.dataTransfer.files) {
                              handleAddQuestionImages(qIndex, e.dataTransfer.files);
                            }
                          }}
                          onClick={() => fileInputRefs.current[qIndex]?.click()}
                          sx={{
                            p: 1.5,
                            textAlign: 'center',
                            cursor: 'pointer',
                            borderRadius: 2,
                            border: '2px dashed',
                            borderColor: draggingQuestionIndex === qIndex ? PALETTE_COLORS.primary : 'divider',
                            backgroundColor: draggingQuestionIndex === qIndex
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
                            <CloudUploadOutlinedIcon sx={{ color: PALETTE_COLORS.primary, fontSize: 24 }} />
                            <Box sx={{ textAlign: 'left' }}>
                              <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.85rem' }}>
                                Clique para anexar imagens, arraste arquivos aqui ou cole com <Box component="span" sx={{ color: PALETTE_COLORS.primary }}>Ctrl+V</Box>
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Suporta imagens em PNG, JPG, WEBP e colagens diretas da área de transferência
                              </Typography>
                            </Box>
                          </Stack>
                        </Paper>

                        {/* Gallery de imagens anexadas */}
                        {q.images && q.images.length > 0 && (
                          <Box sx={{ mt: 1.5, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'action.hover' }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1 }}>
                              Imagens / Diagramas anexados ({q.images.length}):
                            </Typography>
                            <Stack direction="row" spacing={1.5} flexWrap="wrap">
                              {q.images.map((imgUrl, imgIdx) => (
                                <Box
                                  key={imgIdx}
                                  sx={{
                                    position: 'relative',
                                    display: 'inline-block',
                                    borderRadius: 1.5,
                                    overflow: 'hidden',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    bgcolor: 'background.paper',
                                  }}
                                >
                                  <ZoomableImage
                                    src={imgUrl}
                                    alt={`Diagrama ${imgIdx + 1} da Questão ${q.identifier}`}
                                    maxHeight={140}
                                    maxWidth={260}
                                  />
                                  <Chip
                                    size="small"
                                    label={`Figura ${imgIdx + 1}`}
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
                                    onClick={() => handleRemoveQuestionImage(qIndex, imgIdx)}
                                    sx={{
                                      position: 'absolute',
                                      top: 6,
                                      right: 6,
                                      bgcolor: 'rgba(0,0,0,0.65)',
                                      color: '#fff',
                                      p: 0.4,
                                      zIndex: 2,
                                      '&:hover': { bgcolor: 'error.main' },
                                    }}
                                    title="Remover imagem"
                                  >
                                    <DeleteOutlineIcon sx={{ fontSize: '1rem' }} />
                                  </IconButton>
                                </Box>
                              ))}
                            </Stack>
                          </Box>
                        )}
                      </Box>

                      {/* Textual Reference Selector */}
                      {textualReferences.length > 0 && (
                        <Box sx={{ mt: 1, mb: 1 }}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Texto de Apoio / Referência Textual (Opcional)</InputLabel>
                            <Select
                              value={q.textualReferenceIndex !== undefined && q.textualReferenceIndex !== null ? q.textualReferenceIndex : ''}
                              label="Texto de Apoio / Referência Textual (Opcional)"
                              onChange={(e) => {
                                const val = e.target.value;
                                handleUpdateQuestion(qIndex, 'textualReferenceIndex', val === '' ? null : Number(val));
                              }}
                            >
                              <MenuItem value="">
                                <em>Nenhum texto de apoio</em>
                              </MenuItem>
                              {textualReferences.map((ref, rIdx) => (
                                <MenuItem key={rIdx} value={rIdx}>
                                  {ref.title || `Texto ${rIdx + 1}`}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          {q.textualReferenceIndex !== undefined && q.textualReferenceIndex !== null && textualReferences[q.textualReferenceIndex] && (
                            <Paper variant="outlined" sx={{ p: 1.5, mt: 1, bgcolor: 'action.hover', borderRadius: 1.5 }}>
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                <MenuBookIcon fontSize="small" color="primary" />
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                  {textualReferences[q.textualReferenceIndex].title || `Texto ${q.textualReferenceIndex + 1}`}
                                </Typography>
                              </Stack>
                              <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {textualReferences[q.textualReferenceIndex].content}
                              </Typography>
                            </Paper>
                          )}
                        </Box>
                      )}

                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1 }}>
                          Alternativas (mínimo 2):
                        </Typography>
                        <Stack spacing={1}>
                          {q.alternatives.map((alt, aIndex) => {
                            const fileInputKey = `${qIndex}_${aIndex}`;
                            return (
                              <Paper
                                key={aIndex}
                                variant="outlined"
                                sx={{
                                  p: 1,
                                  borderRadius: 1.5,
                                  bgcolor: 'background.paper',
                                  borderColor: 'divider',
                                  transition: 'border-color 0.2s',
                                  '&:focus-within': {
                                    borderColor: PALETTE_COLORS.primary,
                                  },
                                }}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                    handleAddAlternativeImages(qIndex, aIndex, e.dataTransfer.files);
                                  }
                                }}
                              >
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Chip
                                    label={alt.identifier}
                                    size="small"
                                    sx={{ minWidth: 32, fontWeight: 700 }}
                                  />
                                  <TextField
                                    value={alt.text}
                                    onChange={(e) => handleUpdateAltText(qIndex, aIndex, e.target.value)}
                                    onPaste={(e) => handleAlternativePaste(qIndex, aIndex, e)}
                                    placeholder={`Texto da alternativa ${alt.identifier} (ou cole imagem com Ctrl+V)`}
                                    size="small"
                                    fullWidth
                                  />
                                  <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    ref={(el) => {
                                      altFileInputRefs.current[fileInputKey] = el;
                                    }}
                                    style={{ display: 'none' }}
                                    onClick={(e) => {
                                      (e.target as HTMLInputElement).value = '';
                                    }}
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files.length > 0) {
                                        handleAddAlternativeImages(qIndex, aIndex, e.target.files);
                                      }
                                    }}
                                  />
                                  <Tooltip title="Anexar imagem (ou cole com Ctrl+V)">
                                    <IconButton
                                      size="small"
                                      color={alt.images && alt.images.length > 0 ? 'primary' : 'default'}
                                      onClick={() => {
                                        altFileInputRefs.current[fileInputKey]?.click();
                                      }}
                                    >
                                      <ImageIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <IconButton
                                    size="small"
                                    disabled={q.alternatives.length <= 2}
                                    onClick={() => handleRemoveAlternative(qIndex, aIndex)}
                                  >
                                    <DeleteOutlineIcon fontSize="small" />
                                  </IconButton>
                                </Stack>

                                {alt.images && alt.images.length > 0 && (
                                  <Box sx={{ mt: 1, pl: 5 }}>
                                    <Stack direction="row" spacing={1} flexWrap="wrap">
                                      {alt.images.map((imgUrl, imgIdx) => (
                                        <Box
                                          key={imgIdx}
                                          sx={{
                                            position: 'relative',
                                            display: 'inline-block',
                                            borderRadius: 1,
                                            overflow: 'hidden',
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            bgcolor: 'background.default',
                                          }}
                                        >
                                          <ZoomableImage
                                            src={imgUrl}
                                            alt={`Figura ${imgIdx + 1} da Alternativa ${alt.identifier}`}
                                            maxHeight={80}
                                            maxWidth={160}
                                          />
                                          <IconButton
                                            size="small"
                                            onClick={() => handleRemoveAlternativeImage(qIndex, aIndex, imgIdx)}
                                            sx={{
                                              position: 'absolute',
                                              top: 2,
                                              right: 2,
                                              bgcolor: 'rgba(0,0,0,0.65)',
                                              color: '#fff',
                                              p: 0.3,
                                              zIndex: 2,
                                              '&:hover': { bgcolor: 'error.main' },
                                            }}
                                            title="Remover imagem da alternativa"
                                          >
                                            <DeleteOutlineIcon sx={{ fontSize: '0.85rem' }} />
                                          </IconButton>
                                        </Box>
                                      ))}
                                    </Stack>
                                  </Box>
                                )}
                              </Paper>
                            );
                          })}
                        </Stack>
                        <Button
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => handleAddAlternative(qIndex)}
                          sx={{ mt: 1 }}
                        >
                          Adicionar Alternativa
                        </Button>
                      </Box>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Stack>
        )}

        {/* STEP 2: GABARITO OFICIAL */}
        {activeStep === 2 && (
          <Stack spacing={2.5}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Importação Automática do Gabarito (Opcional)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Faça o upload do arquivo PDF do gabarito oficial. O sistema identificará os números das questões e associará automaticamente as alternativas corretas.
              </Typography>

              <Stack direction="row" spacing={2} alignItems="center">
                <input
                  type="file"
                  accept=".pdf"
                  id="answer-key-pdf-upload"
                  style={{ display: 'none' }}
                  onClick={(e) => {
                    (e.target as HTMLInputElement).value = '';
                  }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setAnswerKeyPdfFile(file);
                      setSelectedProvaId('');
                      setAvailableProvas([]);
                      setMatchedCount(null);
                      handleUploadAnswerKeyPdf(file, undefined, true);
                    }
                  }}
                />
                <label htmlFor="answer-key-pdf-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<UploadFileIcon />}
                    size="small"
                    disabled={parsingAnswerKey}
                  >
                    {answerKeyPdfFile ? 'Alterar PDF do Gabarito' : 'Upload PDF do Gabarito'}
                  </Button>
                </label>
                {parsingAnswerKey && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={18} />
                    <Typography variant="caption" color="text.secondary">
                      Extraindo respostas...
                    </Typography>
                  </Stack>
                )}
                {matchedCount !== null && (
                  <Alert severity="success" sx={{ py: 0.5, px: 1.5 }}>
                    {matchedCount} questões associadas ao gabarito!
                  </Alert>
                )}
              </Stack>

              {availableProvas.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Caderno / Cargo Identificado no Gabarito</InputLabel>
                    <Select
                      value={selectedProvaId}
                      label="Caderno / Cargo Identificado no Gabarito"
                      onChange={(e) => {
                        const val = e.target.value as string;
                        setSelectedProvaId(val);
                        if (answerKeyPdfFile) {
                          handleUploadAnswerKeyPdf(answerKeyPdfFile, val);
                        }
                      }}
                    >
                      {availableProvas.map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    O gabarito possui múltiplos cadernos/cargos. Selecione o correto para associar as respostas.
                  </Typography>
                </Box>
              )}
            </Paper>

            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Atribuição das Respostas Corretas:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Selecione a alternativa correta clicando na letra correspondente para cada questão:
            </Typography>

            <Stack spacing={1.5}>
              {questions.map((q, qIndex) => {
                const isAnnulled = q.alternatives.length > 0 && q.alternatives.every((a) => a.isCorrect);
                const correctAlt = isAnnulled ? null : q.alternatives.find((a) => a.isCorrect);
                return (
                  <Paper
                    key={q.id}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 1.5,
                    }}
                  >
                    <Box sx={{ minWidth: 140 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Questão #{q.identifier || qIndex + 1}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200, display: 'block' }}>
                        {q.enunciado ? q.enunciado.substring(0, 30) + '...' : 'Sem enunciado'}
                      </Typography>
                    </Box>

                    {/* Quick Selection Buttons for Correct Alternative */}
                    <Stack direction="row" spacing={1} alignItems="center">
                      {q.alternatives.map((alt) => {
                        const isSelected = !isAnnulled && Boolean(alt.isCorrect);
                        return (
                          <Button
                            key={alt.identifier}
                            variant={isSelected ? 'contained' : 'outlined'}
                            size="small"
                            onClick={() => handleSetCorrectAlternative(qIndex, alt.identifier)}
                            sx={{
                              minWidth: 38,
                              height: 38,
                              fontWeight: 700,
                              borderRadius: '50%',
                              p: 0,
                              backgroundColor: isSelected ? PALETTE_COLORS.primary : 'transparent',
                              color: isSelected ? '#fff' : 'text.primary',
                            }}
                          >
                            {alt.identifier}
                          </Button>
                        );
                      })}
                      <Button
                        variant={isAnnulled ? 'contained' : 'outlined'}
                        size="small"
                        color="warning"
                        onClick={() => handleToggleAnnulled(qIndex)}
                        sx={{
                          height: 38,
                          fontWeight: 700,
                          borderRadius: 2,
                          px: 1.5,
                          textTransform: 'none',
                          backgroundColor: isAnnulled ? PALETTE_COLORS.warning : 'transparent',
                          color: isAnnulled ? '#1a1e24' : PALETTE_COLORS.warning,
                          borderColor: PALETTE_COLORS.warning,
                        }}
                      >
                        Anulada
                      </Button>
                    </Stack>

                    <Box sx={{ minWidth: 150, textAlign: 'right' }}>
                      {isAnnulled ? (
                        <Chip
                          label="Anulada (Pontuada)"
                          color="warning"
                          size="small"
                          sx={{ fontWeight: 700, color: '#1a1e24' }}
                        />
                      ) : correctAlt ? (
                        <Chip
                          icon={<CheckCircleIcon fontSize="small" />}
                          label={`Correta: ${correctAlt.identifier}`}
                          color="success"
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        <Chip
                          label="Não definida"
                          size="small"
                          color="default"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Paper>
                );
              })}
            </Stack>
          </Stack>
        )}

        {/* STEP 3: REVISÃO FINAL */}
        {activeStep === 3 && (
          <Stack spacing={2.5}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Resumo da Prova
              </Typography>
              <Stack spacing={0.5}>
                <Typography variant="body2">
                  <strong>Nome:</strong> {name}
                </Typography>
                <Typography variant="body2">
                  <strong>Ano:</strong> {year}
                </Typography>
                {originId && (
                  <Typography variant="body2">
                    <strong>Banca:</strong> {origins.find((o) => o.id === originId)?.name || originId}
                  </Typography>
                )}
                {areaId && (
                  <Typography variant="body2">
                    <strong>Área:</strong> {areas.find((a) => a.id === areaId)?.name || areaId}
                  </Typography>
                )}
                <Typography variant="body2">
                  <strong>Textos de Apoio:</strong> {textualReferences.length} cadastrado(s)
                </Typography>
                <Typography variant="body2">
                  <strong>Total de Questões:</strong> {questions.length}
                </Typography>
                <Typography variant="body2">
                  <strong>Questões com Gabarito Definido:</strong>{' '}
                  {questions.filter((q) => q.alternatives.some((a) => a.isCorrect)).length} / {questions.length}
                </Typography>
                {questions.filter((q) => q.alternatives.length > 0 && q.alternatives.every((a) => a.isCorrect)).length > 0 && (
                  <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 600 }}>
                    <strong>Questões Anuladas:</strong>{' '}
                    {questions.filter((q) => q.alternatives.length > 0 && q.alternatives.every((a) => a.isCorrect)).length}
                  </Typography>
                )}
              </Stack>
            </Paper>

            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Lista de Questões a Serem Cadastradas:
            </Typography>

            <Stack spacing={1}>
              {questions.map((q, idx) => {
                const isAnnulled = q.alternatives.length > 0 && q.alternatives.every((a) => a.isCorrect);
                const correct = isAnnulled ? null : q.alternatives.find((a) => a.isCorrect);
                return (
                  <Paper key={q.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Chip label={`#${q.identifier || idx + 1}`} size="small" sx={{ fontWeight: 700 }} />
                      <Typography variant="body2" sx={{ flex: 1 }} noWrap>
                        {q.enunciado ? q.enunciado.substring(0, 100) + '...' : 'Sem enunciado'}
                      </Typography>
                      {(() => {
                        const totalAltImgs = q.alternatives.reduce((acc, a) => acc + (a.images?.length || 0), 0);
                        const totalImgs = (q.images?.length || 0) + totalAltImgs;
                        return totalImgs > 0 ? (
                          <Chip
                            icon={<ImageIcon fontSize="small" />}
                            label={`${totalImgs} fig.`}
                            size="small"
                            variant="outlined"
                          />
                        ) : null;
                      })()}
                      {q.textualReferenceIndex !== undefined && q.textualReferenceIndex !== null && textualReferences[q.textualReferenceIndex] && (
                        <Chip
                          icon={<MenuBookIcon fontSize="small" />}
                          label={textualReferences[q.textualReferenceIndex].title || 'Texto'}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      )}
                      {isAnnulled ? (
                        <Chip
                          label="Anulada"
                          size="small"
                          color="warning"
                          sx={{ fontWeight: 700, color: '#1a1e24' }}
                        />
                      ) : correct ? (
                        <Chip
                          label={`Gabarito: ${correct.identifier}`}
                          size="small"
                          color="success"
                        />
                      ) : (
                        <Chip label="Sem gabarito" size="small" variant="outlined" color="warning" />
                      )}
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Button
          onClick={activeStep === 0 ? onClose : () => setActiveStep((prev) => prev - 1)}
          startIcon={activeStep > 0 ? <ArrowBackIcon /> : undefined}
          sx={{ color: 'text.secondary' }}
          disabled={submitting || parsingExam}
        >
          {activeStep === 0 ? 'Cancelar' : 'Voltar'}
        </Button>

        <Stack direction="row" spacing={1}>
          {activeStep < 3 ? (
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={() => {
                if (activeStep === 0) {
                  handleProceedFromStep0();
                } else if (activeStep === 1) {
                  if (duplicates.length > 0) {
                    setErrorMessage(`Existem identificadores duplicados (${duplicates.join(', ')}). Corrija-os.`);
                    return;
                  }
                  setErrorMessage(null);
                  setQuestions((prev) => sortQuestionsByIdentifier(prev));
                  setActiveStep(2);
                } else if (activeStep === 2) {
                  setActiveStep(3);
                }
              }}
              disabled={parsingExam || (activeStep === 0 && (!name.trim() || !year))}
              sx={{ fontWeight: 700, backgroundColor: PALETTE_COLORS.primary }}
            >
              {parsingExam ? 'Processando PDF...' : 'Próximo'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleSubmitAll}
              disabled={submitting || questions.length === 0 || duplicates.length > 0}
              sx={{ fontWeight: 700, backgroundColor: PALETTE_COLORS.primary }}
            >
              {submitting ? 'Salvando Prova e Questões...' : 'Finalizar e Criar Prova'}
            </Button>
          )}
        </Stack>
      </DialogActions>
    </Dialog>

    <CreateOriginModal
      open={openCreateOrigin}
      onClose={() => setOpenCreateOrigin(false)}
      onCreated={(newOrigin) => {
        if (newOrigin) {
          setOrigins((prev) => [...prev, newOrigin]);
          setOriginId(newOrigin.id);
        }
        setOpenCreateOrigin(false);
      }}
    />

    <CreateAreaModal
      open={openCreateArea}
      onClose={() => setOpenCreateArea(false)}
      onCreated={(newArea) => {
        if (newArea) {
          setAreas((prev) => [...prev, newArea]);
          setAreaId(newArea.id);
        }
        setOpenCreateArea(false);
      }}
    />

    <Dialog
      open={openTextualRefDialog}
      onClose={() => setOpenTextualRefDialog(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: 800 }}>
        {editingRefIndex !== null ? 'Editar Referência Textual' : 'Adicionar Referência Textual'}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="Título (opcional)"
            placeholder="ex: Texto I - À moda brasileira"
            value={refTitle}
            onChange={(e) => setRefTitle(e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Subtítulo (opcional)"
            placeholder="ex: Crônica sobre costumes e linguagem"
            value={refSubtitle}
            onChange={(e) => setRefSubtitle(e.target.value)}
            fullWidth
            size="small"
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Autor (opcional)"
              placeholder="ex: TELLES, Lygia Fagundes"
              value={refAuthor}
              onChange={(e) => setRefAuthor(e.target.value)}
              fullWidth
              size="small"
            />
            <TextField
              label="Referência / URL (opcional)"
              placeholder="ex: https://site.com/artigo ou Fonte bibliográfica"
              value={refReference}
              onChange={(e) => setRefReference(e.target.value)}
              fullWidth
              size="small"
            />
          </Stack>
          <TextField
            label="Legenda (opcional)"
            placeholder="ex: Figura 1: Emissões de metano detectadas por satélite"
            value={refCaption}
            onChange={(e) => setRefCaption(e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Conteúdo do Texto (opcional)"
            value={refContent}
            onChange={(e) => setRefContent(e.target.value)}
            fullWidth
            multiline
            rows={8}
            placeholder="Cole ou digite o texto de apoio aqui..."
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={() => setOpenTextualRefDialog(false)} sx={{ color: 'text.secondary' }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            if (
              !refTitle.trim() &&
              !refSubtitle.trim() &&
              !refAuthor.trim() &&
              !refReference.trim() &&
              !refCaption.trim() &&
              !refContent.trim()
            ) {
              alert('Preencha ao menos um dos campos da referência textual.');
              return;
            }

            const refData: TextualReference = {
              title: refTitle.trim() || undefined,
              subtitle: refSubtitle.trim() || undefined,
              author: refAuthor.trim() || undefined,
              reference: refReference.trim() || undefined,
              caption: refCaption.trim() || undefined,
              content: refContent.trim() || undefined,
              source: refReference.trim() || undefined,
            };

            if (editingRefIndex !== null) {
              const updated = [...textualReferences];
              updated[editingRefIndex] = {
                ...updated[editingRefIndex],
                ...refData,
              };
              setTextualReferences(updated);
            } else {
              setTextualReferences([...textualReferences, refData]);
            }
            setOpenTextualRefDialog(false);
          }}
          sx={{ fontWeight: 700, backgroundColor: PALETTE_COLORS.primary }}
        >
          Salvar Referência
        </Button>
      </DialogActions>
    </Dialog>
  </>
  );
};
