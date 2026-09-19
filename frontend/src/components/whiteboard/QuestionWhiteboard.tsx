import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Stack,
  Button,
  IconButton,
  Tooltip,
  Typography,
  Chip,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import BrushIcon from '@mui/icons-material/Brush';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import SquareIcon from '@mui/icons-material/Square';
import ChangeHistoryIcon from '@mui/icons-material/ChangeHistory';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveIcon from '@mui/icons-material/Save';
import GridOnIcon from '@mui/icons-material/GridOn';
import GridOffIcon from '@mui/icons-material/GridOff';
import CloudDoneOutlinedIcon from '@mui/icons-material/CloudDoneOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import {
  BoardElement,
  BoardPoint,
  BoardTool,
} from '../../types';
import { getQuestionBoard, saveQuestionBoard } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../theme/ThemeContext';
import { PALETTE_COLORS } from '../../theme/theme';

interface QuestionWhiteboardProps {
  questionId: number;
}

const SYSTEM_PALETTE = [
  { label: 'Amarelo Primário', color: PALETTE_COLORS.primary },
  { label: 'Azul Secundário', color: PALETTE_COLORS.secondary },
  { label: 'Verde Sucesso', color: PALETTE_COLORS.success },
  { label: 'Amarelo Alerta', color: PALETTE_COLORS.warning },
  { label: 'Vermelho Perigo', color: PALETTE_COLORS.danger },
  { label: 'Branco', color: '#FFFFFF' },
  { label: 'Preto / Escuro', color: '#1A1E24' },
  { label: 'Cinza', color: '#9E9E9E' },
];

const STROKE_WIDTHS = [
  { label: 'Fino', value: 2 },
  { label: 'Médio', value: 4 },
  { label: 'Grosso', value: 6 },
  { label: 'Extra', value: 10 },
];

// Serializa array de elementos para XML
export const boardToXml = (elements: BoardElement[]): string => {
  const parts: string[] = ['<?xml version="1.0" encoding="UTF-8"?>', '<board version="1.0">'];

  for (const el of elements) {
    switch (el.type) {
      case 'brush': {
        const pts = el.points.map((p) => `${Math.round(p.x)},${Math.round(p.y)}`).join(';');
        parts.push(`  <brush color="${el.color}" width="${el.width}" points="${pts}" />`);
        break;
      }
      case 'rectangle': {
        parts.push(
          `  <rectangle color="${el.color}" width="${el.width}" x="${Math.round(el.x)}" y="${Math.round(el.y)}" w="${Math.round(el.w)}" h="${Math.round(el.h)}" />`
        );
        break;
      }
      case 'square': {
        parts.push(
          `  <square color="${el.color}" width="${el.width}" x="${Math.round(el.x)}" y="${Math.round(el.y)}" size="${Math.round(el.size)}" />`
        );
        break;
      }
      case 'triangle': {
        parts.push(
          `  <triangle color="${el.color}" width="${el.width}" x1="${Math.round(el.x1)}" y1="${Math.round(el.y1)}" x2="${Math.round(el.x2)}" y2="${Math.round(el.y2)}" x3="${Math.round(el.x3)}" y3="${Math.round(el.y3)}" />`
        );
        break;
      }
      case 'circle': {
        parts.push(
          `  <circle color="${el.color}" width="${el.width}" cx="${Math.round(el.cx)}" cy="${Math.round(el.cy)}" r="${Math.round(el.radius)}" />`
        );
        break;
      }
      case 'star': {
        parts.push(
          `  <star color="${el.color}" width="${el.width}" cx="${Math.round(el.cx)}" cy="${Math.round(el.cy)}" outerRadius="${Math.round(el.outerRadius)}" innerRadius="${Math.round(el.innerRadius)}" spikes="${el.spikes}" />`
        );
        break;
      }
      case 'text': {
        const sanitized = el.text.replace(/]]>/g, ']]&gt;');
        parts.push(
          `  <text color="${el.color}" fontSize="${el.fontSize}" x="${Math.round(el.x)}" y="${Math.round(el.y)}"><![CDATA[${sanitized}]]></text>`
        );
        break;
      }
    }
  }

  parts.push('</board>');
  return parts.join('\n');
};

// Desserializa XML para array de elementos
export const xmlToBoard = (xml: string): BoardElement[] => {
  if (!xml || !xml.trim()) return [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    const board = doc.querySelector('board');
    if (!board) return [];

    const elements: BoardElement[] = [];

    for (const child of Array.from(board.children)) {
      const tag = child.tagName.toLowerCase();
      const color = child.getAttribute('color') || '#FFE600';
      const width = parseFloat(child.getAttribute('width') || '3');

      switch (tag) {
        case 'brush': {
          const rawPts = child.getAttribute('points') || '';
          const points: BoardPoint[] = rawPts
            .split(';')
            .map((pair) => {
              const [x, y] = pair.split(',').map(Number);
              return !isNaN(x) && !isNaN(y) ? { x, y } : null;
            })
            .filter((p): p is BoardPoint => p !== null);

          if (points.length > 0) {
            elements.push({ type: 'brush', color, width, points });
          }
          break;
        }
        case 'rectangle': {
          const x = parseFloat(child.getAttribute('x') || '0');
          const y = parseFloat(child.getAttribute('y') || '0');
          const w = parseFloat(child.getAttribute('w') || '0');
          const h = parseFloat(child.getAttribute('h') || '0');
          elements.push({ type: 'rectangle', color, width, x, y, w, h });
          break;
        }
        case 'square': {
          const x = parseFloat(child.getAttribute('x') || '0');
          const y = parseFloat(child.getAttribute('y') || '0');
          const size = parseFloat(child.getAttribute('size') || '0');
          elements.push({ type: 'square', color, width, x, y, size });
          break;
        }
        case 'triangle': {
          const x1 = parseFloat(child.getAttribute('x1') || '0');
          const y1 = parseFloat(child.getAttribute('y1') || '0');
          const x2 = parseFloat(child.getAttribute('x2') || '0');
          const y2 = parseFloat(child.getAttribute('y2') || '0');
          const x3 = parseFloat(child.getAttribute('x3') || '0');
          const y3 = parseFloat(child.getAttribute('y3') || '0');
          elements.push({ type: 'triangle', color, width, x1, y1, x2, y2, x3, y3 });
          break;
        }
        case 'circle': {
          const cx = parseFloat(child.getAttribute('cx') || '0');
          const cy = parseFloat(child.getAttribute('cy') || '0');
          const radius = parseFloat(child.getAttribute('r') || '0');
          elements.push({ type: 'circle', color, width, cx, cy, radius });
          break;
        }
        case 'star': {
          const cx = parseFloat(child.getAttribute('cx') || '0');
          const cy = parseFloat(child.getAttribute('cy') || '0');
          const outerRadius = parseFloat(child.getAttribute('outerRadius') || '40');
          const innerRadius = parseFloat(child.getAttribute('innerRadius') || '20');
          const spikes = parseInt(child.getAttribute('spikes') || '5', 10);
          elements.push({ type: 'star', color, width, cx, cy, outerRadius, innerRadius, spikes });
          break;
        }
        case 'text': {
          const x = parseFloat(child.getAttribute('x') || '0');
          const y = parseFloat(child.getAttribute('y') || '0');
          const fontSize = parseFloat(child.getAttribute('fontSize') || '16');
          const text = child.textContent || '';
          elements.push({ type: 'text', color, fontSize, x, y, text });
          break;
        }
      }
    }

    return elements;
  } catch (err) {
    console.error('Erro ao fazer parse do XML da lousa:', err);
    return [];
  }
};

export const QuestionWhiteboard: React.FC<QuestionWhiteboardProps> = ({ questionId }) => {
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';
  const { user } = useAuth();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Tools & Styling State
  const [activeTool, setActiveTool] = useState<BoardTool>('brush');
  const [selectedColor, setSelectedColor] = useState<string>(
    isDark ? PALETTE_COLORS.primary : PALETTE_COLORS.secondary
  );
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Drawing state
  const [elements, setElements] = useState<BoardElement[]>([]);
  const [undoStack, setUndoStack] = useState<BoardElement[][]>([]);
  const [redoStack, setRedoStack] = useState<BoardElement[][]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [startPoint, setStartPoint] = useState<BoardPoint | null>(null);
  const [currentPreviewElement, setCurrentPreviewElement] = useState<BoardElement | null>(null);

  // Text Dialog State
  const [textDialogOpen, setTextDialogOpen] = useState<boolean>(false);
  const [textInput, setTextInput] = useState<string>('');
  const [textPosition, setTextPosition] = useState<BoardPoint | null>(null);

  // Persistence status
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Canvas Dimensions
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number }>({
    width: 900,
    height: 500,
  });

  // Atualiza cor padrão se o tema mudar e a cor atual for de baixo contraste
  useEffect(() => {
    if (isDark && selectedColor === '#1A1E24') {
      setSelectedColor(PALETTE_COLORS.primary);
    } else if (!isDark && selectedColor === '#FFFFFF') {
      setSelectedColor('#1A1E24');
    }
  }, [isDark]);

  // Carrega a lousa ao montar ou quando questionId mudar
  useEffect(() => {
    let isMounted = true;

    const loadBoard = async () => {
      if (user) {
        try {
          const res = await getQuestionBoard(questionId);
          if (isMounted && res && res.xmlContent) {
            const parsed = xmlToBoard(res.xmlContent);
            setElements(parsed);
            setUndoStack([]);
            setRedoStack([]);
            setHasUnsavedChanges(false);
            if (res.updatedAt) {
              setLastSavedTime(new Date(res.updatedAt));
            }
            return;
          }
        } catch (err) {
          console.warn('Erro ao carregar lousa da API:', err);
        }
      }

      // Fallback para localStorage
      const localXml = localStorage.getItem(`omq_board_q_${questionId}`);
      if (isMounted && localXml) {
        const parsed = xmlToBoard(localXml);
        setElements(parsed);
        setUndoStack([]);
        setRedoStack([]);
        setHasUnsavedChanges(false);
      } else if (isMounted) {
        setElements([]);
        setUndoStack([]);
        setRedoStack([]);
      }
    };

    loadBoard();

    return () => {
      isMounted = false;
    };
  }, [questionId, user?.id]);

  // Ajusta dimensões do Canvas com base no container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const width = Math.max(300, Math.floor(rect.width));
        setCanvasDimensions({ width, height: 500 });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Função para desenhar uma estrela
  const drawStar = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number
  ) => {
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
      let x = cx + Math.cos(rot) * outerRadius;
      let y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.stroke();
  };

  // Renderiza todos os elementos no canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvasDimensions;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // 1. Limpa fundo
    const bgColor = isDark ? '#161a20' : '#FFFFFF';
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // 2. Desenha grade se ativada
    if (showGrid) {
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 25;

      ctx.beginPath();
      for (let x = gridSize; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = gridSize; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
    }

    // 3. Renderiza elementos
    const allElements = currentPreviewElement ? [...elements, currentPreviewElement] : elements;

    for (const el of allElements) {
      ctx.strokeStyle = el.color;
      ctx.fillStyle = el.color;
      if ('width' in el) {
        ctx.lineWidth = el.width;
      }
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      switch (el.type) {
        case 'brush': {
          if (el.points.length < 2) break;
          ctx.beginPath();
          ctx.moveTo(el.points[0].x, el.points[0].y);
          for (let i = 1; i < el.points.length; i++) {
            ctx.lineTo(el.points[i].x, el.points[i].y);
          }
          ctx.stroke();
          break;
        }
        case 'rectangle': {
          ctx.strokeRect(el.x, el.y, el.w, el.h);
          break;
        }
        case 'square': {
          ctx.strokeRect(el.x, el.y, el.size, el.size);
          break;
        }
        case 'triangle': {
          ctx.beginPath();
          ctx.moveTo(el.x1, el.y1);
          ctx.lineTo(el.x2, el.y2);
          ctx.lineTo(el.x3, el.y3);
          ctx.closePath();
          ctx.stroke();
          break;
        }
        case 'circle': {
          ctx.beginPath();
          ctx.arc(el.cx, el.cy, Math.max(1, el.radius), 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
        case 'star': {
          drawStar(ctx, el.cx, el.cy, el.spikes || 5, el.outerRadius, el.innerRadius);
          break;
        }
        case 'text': {
          ctx.font = `600 ${el.fontSize}px Inter, sans-serif`;
          ctx.fillText(el.text, el.x, el.y);
          break;
        }
      }
    }
  }, [canvasDimensions, elements, currentPreviewElement, isDark, showGrid]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Função para salvar a lousa
  const handleSave = async () => {
    const xml = boardToXml(elements);
    setIsSaving(true);

    try {
      if (user) {
        await saveQuestionBoard(questionId, xml);
      }
      // Sempre salva também em localStorage como cache
      localStorage.setItem(`omq_board_q_${questionId}`, xml);
      setLastSavedTime(new Date());
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Erro ao salvar lousa:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save com debounce de 2 segundos quando há alterações não salvas
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const timer = setTimeout(() => {
      handleSave();
    }, 2000);

    return () => clearTimeout(timer);
  }, [elements, hasUnsavedChanges]);

  // Adiciona novo elemento ao histórico
  const addElement = (newEl: BoardElement) => {
    setUndoStack((prev) => [...prev, elements]);
    setRedoStack([]);
    setElements((prev) => [...prev, newEl]);
    setHasUnsavedChanges(true);
  };

  // Undo & Redo
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev, elements]);
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setElements(previous);
    setHasUnsavedChanges(true);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, elements]);
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setElements(next);
    setHasUnsavedChanges(true);
  };

  const handleClear = () => {
    if (elements.length === 0) return;
    setUndoStack((prev) => [...prev, elements]);
    setRedoStack([]);
    setElements([]);
    setHasUnsavedChanges(true);
  };

  // Mouse & Touch coordinates helpers
  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): BoardPoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  // Handlers para início de desenho
  const handleStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const pt = getCanvasPoint(e);

    if (activeTool === 'text') {
      setTextPosition(pt);
      setTextInput('');
      setTextDialogOpen(true);
      return;
    }

    setIsDrawing(true);
    setStartPoint(pt);

    if (activeTool === 'brush') {
      setCurrentPreviewElement({
        type: 'brush',
        color: selectedColor,
        width: strokeWidth,
        points: [pt],
      });
    } else if (activeTool === 'eraser') {
      // Borracha: remove elementos próximos ao ponto
      eraseNearPoint(pt);
    }
  };

  // Handlers para movimento do mouse/touch
  const handleMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return;
    const currentPt = getCanvasPoint(e);

    if (activeTool === 'brush') {
      setCurrentPreviewElement((prev) => {
        if (prev && prev.type === 'brush') {
          return {
            ...prev,
            points: [...prev.points, currentPt],
          };
        }
        return prev;
      });
    } else if (activeTool === 'eraser') {
      eraseNearPoint(currentPt);
    } else if (activeTool === 'rectangle') {
      const x = Math.min(startPoint.x, currentPt.x);
      const y = Math.min(startPoint.y, currentPt.y);
      const w = Math.abs(currentPt.x - startPoint.x);
      const h = Math.abs(currentPt.y - startPoint.y);
      setCurrentPreviewElement({
        type: 'rectangle',
        color: selectedColor,
        width: strokeWidth,
        x,
        y,
        w,
        h,
      });
    } else if (activeTool === 'square') {
      const dx = currentPt.x - startPoint.x;
      const dy = currentPt.y - startPoint.y;
      const size = Math.max(Math.abs(dx), Math.abs(dy));
      const x = dx >= 0 ? startPoint.x : startPoint.x - size;
      const y = dy >= 0 ? startPoint.y : startPoint.y - size;
      setCurrentPreviewElement({
        type: 'square',
        color: selectedColor,
        width: strokeWidth,
        x,
        y,
        size,
      });
    } else if (activeTool === 'circle') {
      const radius = Math.hypot(currentPt.x - startPoint.x, currentPt.y - startPoint.y);
      setCurrentPreviewElement({
        type: 'circle',
        color: selectedColor,
        width: strokeWidth,
        cx: startPoint.x,
        cy: startPoint.y,
        radius,
      });
    } else if (activeTool === 'triangle') {
      const x1 = startPoint.x;
      const y1 = currentPt.y;
      const x2 = (startPoint.x + currentPt.x) / 2;
      const y2 = startPoint.y;
      const x3 = currentPt.x;
      const y3 = currentPt.y;
      setCurrentPreviewElement({
        type: 'triangle',
        color: selectedColor,
        width: strokeWidth,
        x1,
        y1,
        x2,
        y2,
        x3,
        y3,
      });
    } else if (activeTool === 'star') {
      const outerRadius = Math.hypot(currentPt.x - startPoint.x, currentPt.y - startPoint.y);
      setCurrentPreviewElement({
        type: 'star',
        color: selectedColor,
        width: strokeWidth,
        cx: startPoint.x,
        cy: startPoint.y,
        outerRadius,
        innerRadius: outerRadius * 0.48,
        spikes: 5,
      });
    }
  };

  // Handlers para finalização do desenho
  const handleEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentPreviewElement) {
      addElement(currentPreviewElement);
      setCurrentPreviewElement(null);
    }
    setStartPoint(null);
  };

  // Lógica da borracha: remove o elemento mais próximo do clique/rastro
  const eraseNearPoint = (pt: BoardPoint) => {
    setElements((prev) => {
      const threshold = 18;
      const filtered = prev.filter((el) => {
        if (el.type === 'brush') {
          return !el.points.some((p) => Math.hypot(p.x - pt.x, p.y - pt.y) < threshold);
        }
        if (el.type === 'rectangle') {
          return !(pt.x >= el.x && pt.x <= el.x + el.w && pt.y >= el.y && pt.y <= el.y + el.h);
        }
        if (el.type === 'square') {
          return !(pt.x >= el.x && pt.x <= el.x + el.size && pt.y >= el.y && pt.y <= el.y + el.size);
        }
        if (el.type === 'circle') {
          return Math.hypot(el.cx - pt.x, el.cy - pt.y) > el.radius + threshold;
        }
        if (el.type === 'star') {
          return Math.hypot(el.cx - pt.x, el.cy - pt.y) > el.outerRadius + threshold;
        }
        if (el.type === 'text') {
          return Math.hypot(el.x - pt.x, el.y - pt.y) > 25;
        }
        return true;
      });

      if (filtered.length !== prev.length) {
        setHasUnsavedChanges(true);
      }
      return filtered;
    });
  };

  // Submete o texto digitado no modal
  const handleConfirmText = () => {
    if (textInput.trim() && textPosition) {
      addElement({
        type: 'text',
        color: selectedColor,
        fontSize: Math.max(14, strokeWidth * 4),
        x: textPosition.x,
        y: textPosition.y,
        text: textInput.trim(),
      });
    }
    setTextDialogOpen(false);
    setTextInput('');
    setTextPosition(null);
  };

  return (
    <Paper
      elevation={3}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        backgroundColor: 'background.paper',
        mb: 4,
      }}
    >
      {/* Whiteboard Header / Status Bar */}
      <Box
        sx={{
          p: 1.5,
          px: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <BrushIcon fontSize="small" sx={{ color: PALETTE_COLORS.primary }} />
            Lousa de Raciocínio
          </Typography>
          <Chip
            size="small"
            label="Persistência XML"
            variant="outlined"
            sx={{ fontSize: '0.7rem', height: 20 }}
          />
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          {isSaving ? (
            <Chip
              size="small"
              icon={<CircularProgress size={14} sx={{ color: PALETTE_COLORS.secondary }} />}
              label="Salvando na nuvem..."
              sx={{ backgroundColor: 'transparent', fontSize: '0.75rem' }}
            />
          ) : user ? (
            <Chip
              size="small"
              icon={<CloudDoneOutlinedIcon fontSize="small" sx={{ color: `${PALETTE_COLORS.success} !important` }} />}
              label={
                lastSavedTime
                  ? `Salvo às ${lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Salvo na nuvem'
              }
              sx={{
                backgroundColor: isDark ? 'rgba(75, 241, 81, 0.1)' : 'rgba(75, 241, 81, 0.15)',
                color: PALETTE_COLORS.success,
                fontWeight: 600,
                fontSize: '0.75rem',
              }}
            />
          ) : (
            <Chip
              size="small"
              icon={<CloudUploadOutlinedIcon fontSize="small" />}
              label="Salvo localmente (faça login para nuvem)"
              sx={{ fontSize: '0.75rem', color: 'text.secondary' }}
            />
          )}

          <Button
            size="small"
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={isSaving}
            sx={{
              fontWeight: 700,
              fontSize: '0.75rem',
              py: 0.5,
              textTransform: 'none',
            }}
          >
            Salvar
          </Button>
        </Stack>
      </Box>

      {/* Whiteboard Toolbar */}
      <Box
        sx={{
          p: 1.5,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.01)' : 'rgba(0, 0, 0, 0.01)',
        }}
      >
        {/* Tool Selectors */}
        <ToggleButtonGroup
          size="small"
          value={activeTool}
          exclusive
          onChange={(_e, newTool) => {
            if (newTool) setActiveTool(newTool);
          }}
          aria-label="ferramenta de desenho"
        >
          <ToggleButton value="brush" aria-label="pincel livre">
            <Tooltip title="Pincel Livre">
              <BrushIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>

          <ToggleButton value="rectangle" aria-label="retângulo">
            <Tooltip title="Retângulo">
              <CropSquareIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>

          <ToggleButton value="square" aria-label="quadrado">
            <Tooltip title="Quadrado">
              <SquareIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>

          <ToggleButton value="triangle" aria-label="triângulo">
            <Tooltip title="Triângulo">
              <ChangeHistoryIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>

          <ToggleButton value="star" aria-label="estrela">
            <Tooltip title="Estrela (5 pontas)">
              <StarBorderIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>

          <ToggleButton value="circle" aria-label="bola / círculo">
            <Tooltip title="Bola / Círculo">
              <RadioButtonUncheckedIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>

          <ToggleButton value="text" aria-label="texto">
            <Tooltip title="Adicionar Texto (clique no quadro)">
              <TextFieldsIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>

          <ToggleButton value="eraser" aria-label="borracha">
            <Tooltip title="Borracha">
              <CleaningServicesIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Stroke Width Selector */}
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mr: 0.5 }}>
            Traço:
          </Typography>
          {STROKE_WIDTHS.map((sw) => (
            <Button
              key={sw.value}
              size="small"
              variant={strokeWidth === sw.value ? 'contained' : 'outlined'}
              onClick={() => setStrokeWidth(sw.value)}
              sx={{
                minWidth: 32,
                px: 1,
                py: 0.2,
                fontSize: '0.75rem',
                fontWeight: 700,
                color: strokeWidth === sw.value ? '#1a1e24' : 'text.primary',
                backgroundColor: strokeWidth === sw.value ? PALETTE_COLORS.primary : 'transparent',
              }}
            >
              {sw.value}px
            </Button>
          ))}
        </Stack>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Color Palette Chips */}
        <Stack direction="row" spacing={0.8} alignItems="center">
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mr: 0.5 }}>
            Cor:
          </Typography>
          {SYSTEM_PALETTE.map((p) => {
            const isSelected = selectedColor.toUpperCase() === p.color.toUpperCase();
            return (
              <Tooltip key={p.color} title={p.label}>
                <Box
                  onClick={() => setSelectedColor(p.color)}
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    backgroundColor: p.color,
                    cursor: 'pointer',
                    border: isSelected
                      ? `2px solid ${isDark ? '#FFFFFF' : '#000000'}`
                      : '1px solid rgba(0,0,0,0.2)',
                    boxShadow: isSelected ? '0 0 0 2px ' + PALETTE_COLORS.primary : 'none',
                    transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 0.15s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.2)',
                    },
                  }}
                />
              </Tooltip>
            );
          })}
        </Stack>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Grid and History Actions */}
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Tooltip title={showGrid ? 'Ocultar grade' : 'Mostrar grade'}>
            <IconButton size="small" onClick={() => setShowGrid(!showGrid)} color={showGrid ? 'primary' : 'default'}>
              {showGrid ? <GridOnIcon fontSize="small" /> : <GridOffIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Desfazer (Undo)">
            <span>
              <IconButton size="small" onClick={handleUndo} disabled={undoStack.length === 0}>
                <UndoIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Refazer (Redo)">
            <span>
              <IconButton size="small" onClick={handleRedo} disabled={redoStack.length === 0}>
                <RedoIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Limpar Lousa">
            <span>
              <IconButton size="small" onClick={handleClear} disabled={elements.length === 0} color="error">
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Box>

      {/* Canvas Area */}
      <Box
        ref={containerRef}
        sx={{
          position: 'relative',
          width: '100%',
          height: 500,
          cursor:
            activeTool === 'brush'
              ? 'crosshair'
              : activeTool === 'text'
              ? 'text'
              : activeTool === 'eraser'
              ? 'cell'
              : 'crosshair',
          overflow: 'hidden',
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: canvasDimensions.width,
            height: canvasDimensions.height,
            display: 'block',
          }}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />
      </Box>

      {/* Inline Text Modal */}
      <Dialog open={textDialogOpen} onClose={() => setTextDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>Inserir Texto na Lousa</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label="Digite seu texto, fórmula ou anotação"
            variant="outlined"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleConfirmText();
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setTextDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmText}
            disabled={!textInput.trim()}
            sx={{ fontWeight: 700, textTransform: 'none' }}
          >
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
