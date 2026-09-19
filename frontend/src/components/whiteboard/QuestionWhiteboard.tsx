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
import NearMeIcon from '@mui/icons-material/NearMe';
import PanToolIcon from '@mui/icons-material/PanTool';
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
import RotateRightIcon from '@mui/icons-material/RotateRight';
import FlipIcon from '@mui/icons-material/Flip';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
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

const generateId = () => 'el_' + Math.random().toString(36).substring(2, 10);

// Calcula centro e dimensões de qualquer elemento para rotação e inversão
export const getElementBounds = (el: BoardElement): { cx: number; cy: number; width: number; height: number; minX: number; minY: number; maxX: number; maxY: number } => {
  switch (el.type) {
    case 'brush': {
      if (el.points.length === 0) return { cx: 0, cy: 0, width: 0, height: 0, minX: 0, minY: 0, maxX: 0, maxY: 0 };
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const p of el.points) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
      return {
        cx: (minX + maxX) / 2,
        cy: (minY + maxY) / 2,
        width: Math.max(10, maxX - minX),
        height: Math.max(10, maxY - minY),
        minX, minY, maxX, maxY,
      };
    }
    case 'rectangle': {
      return {
        cx: el.x + el.w / 2,
        cy: el.y + el.h / 2,
        width: Math.abs(el.w),
        height: Math.abs(el.h),
        minX: el.x,
        minY: el.y,
        maxX: el.x + el.w,
        maxY: el.y + el.h,
      };
    }
    case 'square': {
      return {
        cx: el.x + el.size / 2,
        cy: el.y + el.size / 2,
        width: Math.abs(el.size),
        height: Math.abs(el.size),
        minX: el.x,
        minY: el.y,
        maxX: el.x + el.size,
        maxY: el.y + el.size,
      };
    }
    case 'triangle': {
      const minX = Math.min(el.x1, el.x2, el.x3);
      const maxX = Math.max(el.x1, el.x2, el.x3);
      const minY = Math.min(el.y1, el.y2, el.y3);
      const maxY = Math.max(el.y1, el.y2, el.y3);
      return {
        cx: (el.x1 + el.x2 + el.x3) / 3,
        cy: (el.y1 + el.y2 + el.y3) / 3,
        width: Math.max(10, maxX - minX),
        height: Math.max(10, maxY - minY),
        minX, minY, maxX, maxY,
      };
    }
    case 'circle': {
      return {
        cx: el.cx,
        cy: el.cy,
        width: el.radius * 2,
        height: el.radius * 2,
        minX: el.cx - el.radius,
        minY: el.cy - el.radius,
        maxX: el.cx + el.radius,
        maxY: el.cy + el.radius,
      };
    }
    case 'star': {
      return {
        cx: el.cx,
        cy: el.cy,
        width: el.outerRadius * 2,
        height: el.outerRadius * 2,
        minX: el.cx - el.outerRadius,
        minY: el.cy - el.outerRadius,
        maxX: el.cx + el.outerRadius,
        maxY: el.cy + el.outerRadius,
      };
    }
    case 'text': {
      const textWidth = Math.max(20, el.text.length * (el.fontSize * 0.6));
      const textHeight = el.fontSize * 1.2;
      return {
        cx: el.x + textWidth / 2,
        cy: el.y - textHeight / 2,
        width: textWidth,
        height: textHeight,
        minX: el.x,
        minY: el.y - textHeight,
        maxX: el.x + textWidth,
        maxY: el.y,
      };
    }
  }
};

// Serializa array de elementos para XML com suporte a id, rotação e inversão
export const boardToXml = (elements: BoardElement[]): string => {
  const parts: string[] = ['<?xml version="1.0" encoding="UTF-8"?>', '<board version="1.0">'];

  for (const el of elements) {
    const rot = el.rotation || 0;
    const fx = Boolean(el.flipX);
    const fy = Boolean(el.flipY);
    const id = el.id || generateId();

    switch (el.type) {
      case 'brush': {
        const pts = el.points.map((p) => `${Math.round(p.x)},${Math.round(p.y)}`).join(';');
        parts.push(`  <brush id="${id}" color="${el.color}" width="${el.width}" rotation="${rot}" flipX="${fx}" flipY="${fy}" points="${pts}" />`);
        break;
      }
      case 'rectangle': {
        parts.push(
          `  <rectangle id="${id}" color="${el.color}" width="${el.width}" x="${Math.round(el.x)}" y="${Math.round(el.y)}" w="${Math.round(el.w)}" h="${Math.round(el.h)}" rotation="${rot}" flipX="${fx}" flipY="${fy}" />`
        );
        break;
      }
      case 'square': {
        parts.push(
          `  <square id="${id}" color="${el.color}" width="${el.width}" x="${Math.round(el.x)}" y="${Math.round(el.y)}" size="${Math.round(el.size)}" rotation="${rot}" flipX="${fx}" flipY="${fy}" />`
        );
        break;
      }
      case 'triangle': {
        parts.push(
          `  <triangle id="${id}" color="${el.color}" width="${el.width}" x1="${Math.round(el.x1)}" y1="${Math.round(el.y1)}" x2="${Math.round(el.x2)}" y2="${Math.round(el.y2)}" x3="${Math.round(el.x3)}" y3="${Math.round(el.y3)}" rotation="${rot}" flipX="${fx}" flipY="${fy}" />`
        );
        break;
      }
      case 'circle': {
        parts.push(
          `  <circle id="${id}" color="${el.color}" width="${el.width}" cx="${Math.round(el.cx)}" cy="${Math.round(el.cy)}" r="${Math.round(el.radius)}" rotation="${rot}" flipX="${fx}" flipY="${fy}" />`
        );
        break;
      }
      case 'star': {
        parts.push(
          `  <star id="${id}" color="${el.color}" width="${el.width}" cx="${Math.round(el.cx)}" cy="${Math.round(el.cy)}" outerRadius="${Math.round(el.outerRadius)}" innerRadius="${Math.round(el.innerRadius)}" spikes="${el.spikes}" rotation="${rot}" flipX="${fx}" flipY="${fy}" />`
        );
        break;
      }
      case 'text': {
        const sanitized = el.text.replace(/]]>/g, ']]&gt;');
        parts.push(
          `  <text id="${id}" color="${el.color}" fontSize="${el.fontSize}" x="${Math.round(el.x)}" y="${Math.round(el.y)}" rotation="${rot}" flipX="${fx}" flipY="${fy}"><![CDATA[${sanitized}]]></text>`
        );
        break;
      }
    }
  }

  parts.push('</board>');
  return parts.join('\n');
};

// Desserializa XML para array de elementos com suporte a id, rotação e inversão
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
      const id = child.getAttribute('id') || generateId();
      const color = child.getAttribute('color') || '#FFE600';
      const width = parseFloat(child.getAttribute('width') || '3');
      const rotation = parseFloat(child.getAttribute('rotation') || '0');
      const flipX = child.getAttribute('flipX') === 'true';
      const flipY = child.getAttribute('flipY') === 'true';

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
            elements.push({ id, type: 'brush', color, width, points, rotation, flipX, flipY });
          }
          break;
        }
        case 'rectangle': {
          const x = parseFloat(child.getAttribute('x') || '0');
          const y = parseFloat(child.getAttribute('y') || '0');
          const w = parseFloat(child.getAttribute('w') || '0');
          const h = parseFloat(child.getAttribute('h') || '0');
          elements.push({ id, type: 'rectangle', color, width, x, y, w, h, rotation, flipX, flipY });
          break;
        }
        case 'square': {
          const x = parseFloat(child.getAttribute('x') || '0');
          const y = parseFloat(child.getAttribute('y') || '0');
          const size = parseFloat(child.getAttribute('size') || '0');
          elements.push({ id, type: 'square', color, width, x, y, size, rotation, flipX, flipY });
          break;
        }
        case 'triangle': {
          const x1 = parseFloat(child.getAttribute('x1') || '0');
          const y1 = parseFloat(child.getAttribute('y1') || '0');
          const x2 = parseFloat(child.getAttribute('x2') || '0');
          const y2 = parseFloat(child.getAttribute('y2') || '0');
          const x3 = parseFloat(child.getAttribute('x3') || '0');
          const y3 = parseFloat(child.getAttribute('y3') || '0');
          elements.push({ id, type: 'triangle', color, width, x1, y1, x2, y2, x3, y3, rotation, flipX, flipY });
          break;
        }
        case 'circle': {
          const cx = parseFloat(child.getAttribute('cx') || '0');
          const cy = parseFloat(child.getAttribute('cy') || '0');
          const radius = parseFloat(child.getAttribute('r') || '0');
          elements.push({ id, type: 'circle', color, width, cx, cy, radius, rotation, flipX, flipY });
          break;
        }
        case 'star': {
          const cx = parseFloat(child.getAttribute('cx') || '0');
          const cy = parseFloat(child.getAttribute('cy') || '0');
          const outerRadius = parseFloat(child.getAttribute('outerRadius') || '40');
          const innerRadius = parseFloat(child.getAttribute('innerRadius') || '20');
          const spikes = parseInt(child.getAttribute('spikes') || '5', 10);
          elements.push({ id, type: 'star', color, width, cx, cy, outerRadius, innerRadius, spikes, rotation, flipX, flipY });
          break;
        }
        case 'text': {
          const x = parseFloat(child.getAttribute('x') || '0');
          const y = parseFloat(child.getAttribute('y') || '0');
          const fontSize = parseFloat(child.getAttribute('fontSize') || '16');
          const text = child.textContent || '';
          elements.push({ id, type: 'text', color, fontSize, x, y, text, rotation, flipX, flipY });
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
  const [activeTool, setActiveTool] = useState<BoardTool>('select');
  const [selectedColor, setSelectedColor] = useState<string>(
    isDark ? PALETTE_COLORS.primary : PALETTE_COLORS.secondary
  );
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Viewport / Navigation State (Pan & Zoom)
  const [viewportOffset, setViewportOffset] = useState<BoardPoint>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1.0);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<BoardPoint>({ x: 0, y: 0 });

  // Selection & Transform State
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isDraggingElement, setIsDraggingElement] = useState<boolean>(false);
  const [isRotatingElement, setIsRotatingElement] = useState<boolean>(false);
  const [dragStartPoint, setDragStartPoint] = useState<BoardPoint | null>(null);

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
    height: 520,
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
        setCanvasDimensions({ width, height: 520 });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Conversões de Coordenadas: Tela <-> Mundo
  const screenToWorld = useCallback(
    (screenX: number, screenY: number): BoardPoint => {
      return {
        x: (screenX - viewportOffset.x) / zoom,
        y: (screenY - viewportOffset.y) / zoom,
      };
    },
    [viewportOffset, zoom]
  );

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

  // Renderiza todos os elementos no canvas com clipping rigoroso e transformações
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

    // 1. Limpa e recorta estritamente a área visível do canvas
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.clip(); // CLIPPING RIGOROSO DE CENA

    const bgColor = isDark ? '#161a20' : '#FFFFFF';
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // 2. Desenha grade infinita ajustada ao deslocamento e zoom
    if (showGrid) {
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 25 * zoom;
      const startX = (viewportOffset.x % gridSize);
      const startY = (viewportOffset.y % gridSize);

      ctx.beginPath();
      for (let x = startX; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = startY; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
    }

    // 3. Aplica transformação da câmera / viewport
    ctx.save();
    ctx.translate(viewportOffset.x, viewportOffset.y);
    ctx.scale(zoom, zoom);

    // Renderiza elementos
    const allElements = currentPreviewElement ? [...elements, currentPreviewElement] : elements;

    for (const el of allElements) {
      ctx.save();
      const bounds = getElementBounds(el);

      // Aplica transformações do elemento (rotação e espelhamento no centro do objeto)
      ctx.translate(bounds.cx, bounds.cy);
      if (el.rotation) {
        ctx.rotate((el.rotation * Math.PI) / 180);
      }
      if (el.flipX || el.flipY) {
        ctx.scale(el.flipX ? -1 : 1, el.flipY ? -1 : 1);
      }
      ctx.translate(-bounds.cx, -bounds.cy);

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

      ctx.restore();
    }

    // 4. Desenha caixa de seleção e manipulador de rotação no elemento selecionado
    if (selectedElementId) {
      const selectedEl = elements.find((e) => e.id === selectedElementId);
      if (selectedEl) {
        const bounds = getElementBounds(selectedEl);
        const padding = 8 / zoom;

        ctx.save();
        ctx.translate(bounds.cx, bounds.cy);
        if (selectedEl.rotation) {
          ctx.rotate((selectedEl.rotation * Math.PI) / 180);
        }
        ctx.translate(-bounds.cx, -bounds.cy);

        // Bounding box tracejada
        ctx.strokeStyle = PALETTE_COLORS.secondary;
        ctx.lineWidth = 1.5 / zoom;
        ctx.setLineDash([4 / zoom, 4 / zoom]);
        ctx.strokeRect(
          bounds.minX - padding,
          bounds.minY - padding,
          bounds.width + padding * 2,
          bounds.height + padding * 2
        );

        // Manipulador de rotação (haste e círculo no topo)
        const rotHandleY = bounds.minY - padding - 22 / zoom;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(bounds.cx, bounds.minY - padding);
        ctx.lineTo(bounds.cx, rotHandleY);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(bounds.cx, rotHandleY, 6 / zoom, 0, Math.PI * 2);
        ctx.fillStyle = PALETTE_COLORS.primary;
        ctx.fill();
        ctx.strokeStyle = '#1a1e24';
        ctx.lineWidth = 1.5 / zoom;
        ctx.stroke();

        ctx.restore();
      }
    }

    ctx.restore(); // Restaura transform da câmera
    ctx.restore(); // Restaura clipping
  }, [canvasDimensions, elements, currentPreviewElement, isDark, showGrid, viewportOffset, zoom, selectedElementId]);

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
    setSelectedElementId(newEl.id);
    setHasUnsavedChanges(true);
  };

  // Atualiza elemento selecionado
  const updateSelectedElement = (updater: (prev: BoardElement) => BoardElement) => {
    if (!selectedElementId) return;
    setUndoStack((prev) => [...prev, elements]);
    setRedoStack([]);
    setElements((prev) =>
      prev.map((el) => (el.id === selectedElementId ? updater(el) : el))
    );
    setHasUnsavedChanges(true);
  };

  // Undo & Redo
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev, elements]);
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setElements(previous);
    setSelectedElementId(null);
    setHasUnsavedChanges(true);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, elements]);
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setElements(next);
    setSelectedElementId(null);
    setHasUnsavedChanges(true);
  };

  const handleClear = () => {
    if (elements.length === 0) return;
    setUndoStack((prev) => [...prev, elements]);
    setRedoStack([]);
    setElements([]);
    setSelectedElementId(null);
    setHasUnsavedChanges(true);
  };

  // Funções de Transformação no Elemento Selecionado
  const handleRotateSelected = (deltaDegrees: number) => {
    updateSelectedElement((el) => ({
      ...el,
      rotation: ((el.rotation || 0) + deltaDegrees + 360) % 360,
    }));
  };

  const handleFlipSelected = (axis: 'x' | 'y') => {
    updateSelectedElement((el) => ({
      ...el,
      flipX: axis === 'x' ? !el.flipX : el.flipX,
      flipY: axis === 'y' ? !el.flipY : el.flipY,
    }));
  };

  const handleDeleteSelected = () => {
    if (!selectedElementId) return;
    setUndoStack((prev) => [...prev, elements]);
    setRedoStack([]);
    setElements((prev) => prev.filter((el) => el.id !== selectedElementId));
    setSelectedElementId(null);
    setHasUnsavedChanges(true);
  };

  const handleDuplicateSelected = () => {
    if (!selectedElementId) return;
    const target = elements.find((el) => el.id === selectedElementId);
    if (!target) return;

    const offset = 25;
    let duplicated: BoardElement;

    switch (target.type) {
      case 'brush':
        duplicated = {
          ...target,
          id: generateId(),
          points: target.points.map((p) => ({ x: p.x + offset, y: p.y + offset })),
        };
        break;
      case 'rectangle':
        duplicated = { ...target, id: generateId(), x: target.x + offset, y: target.y + offset };
        break;
      case 'square':
        duplicated = { ...target, id: generateId(), x: target.x + offset, y: target.y + offset };
        break;
      case 'triangle':
        duplicated = {
          ...target,
          id: generateId(),
          x1: target.x1 + offset,
          y1: target.y1 + offset,
          x2: target.x2 + offset,
          y2: target.y2 + offset,
          x3: target.x3 + offset,
          y3: target.y3 + offset,
        };
        break;
      case 'circle':
      case 'star':
        duplicated = { ...target, id: generateId(), cx: target.cx + offset, cy: target.cy + offset };
        break;
      case 'text':
        duplicated = { ...target, id: generateId(), x: target.x + offset, y: target.y + offset };
        break;
    }

    addElement(duplicated);
  };

  // Alterar Cor do elemento selecionado ou da ferramenta ativa
  const handleColorChange = (newColor: string) => {
    setSelectedColor(newColor);
    if (selectedElementId) {
      updateSelectedElement((el) => ({ ...el, color: newColor }));
    }
  };

  // Alterar Espessura do traço do elemento selecionado ou da ferramenta ativa
  const handleStrokeWidthChange = (newWidth: number) => {
    setStrokeWidth(newWidth);
    if (selectedElementId) {
      updateSelectedElement((el) => ('width' in el ? { ...el, width: newWidth } : el));
    }
  };

  // Navegação: Zoom In, Zoom Out, Reset
  const handleZoom = (delta: number) => {
    setZoom((prev) => {
      const next = Math.max(0.3, Math.min(3.0, prev + delta));
      return Math.round(next * 10) / 10;
    });
  };

  const handleResetView = () => {
    setViewportOffset({ x: 0, y: 0 });
    setZoom(1.0);
  };

  // Helper de coordenadas relativas ao Canvas na tela
  const getScreenPoint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): BoardPoint => {
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

  // Detecção de colisão / Hit Test para seleção de objetos
  const findElementAtPoint = (worldPt: BoardPoint): BoardElement | null => {
    // Procura de trás para frente (elementos superiores primeiro)
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      const bounds = getElementBounds(el);
      const hitPadding = 12;

      // Se rotacionado, faz teste rotacionando o ponto em torno do centro do objeto
      let testPt = worldPt;
      if (el.rotation) {
        const rad = (-el.rotation * Math.PI) / 180;
        const dx = worldPt.x - bounds.cx;
        const dy = worldPt.y - bounds.cy;
        testPt = {
          x: bounds.cx + dx * Math.cos(rad) - dy * Math.sin(rad),
          y: bounds.cy + dx * Math.sin(rad) + dy * Math.cos(rad),
        };
      }

      if (
        testPt.x >= bounds.minX - hitPadding &&
        testPt.x <= bounds.maxX + hitPadding &&
        testPt.y >= bounds.minY - hitPadding &&
        testPt.y <= bounds.maxY + hitPadding
      ) {
        return el;
      }
    }
    return null;
  };

  // Testa se o clique foi no manipulador de rotação do elemento selecionado
  const isClickOnRotationHandle = (worldPt: BoardPoint, el: BoardElement): boolean => {
    const bounds = getElementBounds(el);
    const rotHandleDist = 22 / zoom;

    let testPt = worldPt;
    if (el.rotation) {
      const rad = (-el.rotation * Math.PI) / 180;
      const dx = worldPt.x - bounds.cx;
      const dy = worldPt.y - bounds.cy;
      testPt = {
        x: bounds.cx + dx * Math.cos(rad) - dy * Math.sin(rad),
        y: bounds.cy + dx * Math.sin(rad) + dy * Math.cos(rad),
      };
    }

    const handlePt = { x: bounds.cx, y: bounds.minY - 8 / zoom - rotHandleDist };
    return Math.hypot(testPt.x - handlePt.x, testPt.y - handlePt.y) <= 12 / zoom;
  };

  // Handlers de Interação do Canvas
  const handleStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const screenPt = getScreenPoint(e);
    const worldPt = screenToWorld(screenPt.x, screenPt.y);

    // Ferramenta de Navegação (Pan) ou clique com botão do meio
    if (activeTool === 'pan' || ('button' in e && e.button === 1)) {
      setIsPanning(true);
      setPanStart(screenPt);
      return;
    }

    // Ferramenta de Seleção / Cursor Comum
    if (activeTool === 'select') {
      if (selectedElementId) {
        const selectedEl = elements.find((el) => el.id === selectedElementId);
        if (selectedEl && isClickOnRotationHandle(worldPt, selectedEl)) {
          setIsRotatingElement(true);
          setDragStartPoint(worldPt);
          return;
        }
      }

      const hit = findElementAtPoint(worldPt);
      if (hit) {
        setSelectedElementId(hit.id);
        setIsDraggingElement(true);
        setDragStartPoint(worldPt);
      } else {
        setSelectedElementId(null);
      }
      return;
    }

    // Ferramenta de Texto
    if (activeTool === 'text') {
      setTextPosition(worldPt);
      setTextInput('');
      setTextDialogOpen(true);
      return;
    }

    // Ferramentas de Desenho
    setIsDrawing(true);
    setStartPoint(worldPt);

    if (activeTool === 'brush') {
      setCurrentPreviewElement({
        id: generateId(),
        type: 'brush',
        color: selectedColor,
        width: strokeWidth,
        points: [worldPt],
      });
    } else if (activeTool === 'eraser') {
      eraseNearPoint(worldPt);
    }
  };

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const screenPt = getScreenPoint(e);
    const worldPt = screenToWorld(screenPt.x, screenPt.y);

    // Navegação (Pan)
    if (isPanning) {
      const dx = screenPt.x - panStart.x;
      const dy = screenPt.y - panStart.y;
      setViewportOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setPanStart(screenPt);
      return;
    }

    // Rotação do elemento selecionado
    if (isRotatingElement && selectedElementId) {
      const el = elements.find((item) => item.id === selectedElementId);
      if (el) {
        const bounds = getElementBounds(el);
        const angleRad = Math.atan2(worldPt.y - bounds.cy, worldPt.x - bounds.cx);
        // O manipulador fica a -90 graus (topo)
        const degrees = ((angleRad * 180) / Math.PI + 90 + 360) % 360;
        setElements((prev) =>
          prev.map((item) => (item.id === selectedElementId ? { ...item, rotation: Math.round(degrees) } : item))
        );
        setHasUnsavedChanges(true);
      }
      return;
    }

    // Movimentação / Drag do elemento selecionado
    if (isDraggingElement && selectedElementId && dragStartPoint) {
      const dx = worldPt.x - dragStartPoint.x;
      const dy = worldPt.y - dragStartPoint.y;

      setElements((prev) =>
        prev.map((item) => {
          if (item.id !== selectedElementId) return item;
          switch (item.type) {
            case 'brush':
              return {
                ...item,
                points: item.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
              };
            case 'rectangle':
            case 'square':
              return { ...item, x: item.x + dx, y: item.y + dy };
            case 'triangle':
              return {
                ...item,
                x1: item.x1 + dx,
                y1: item.y1 + dy,
                x2: item.x2 + dx,
                y2: item.y2 + dy,
                x3: item.x3 + dx,
                y3: item.y3 + dy,
              };
            case 'circle':
            case 'star':
              return { ...item, cx: item.cx + dx, cy: item.cy + dy };
            case 'text':
              return { ...item, x: item.x + dx, y: item.y + dy };
          }
        })
      );
      setDragStartPoint(worldPt);
      setHasUnsavedChanges(true);
      return;
    }

    // Ferramentas de Desenho
    if (!isDrawing || !startPoint) return;

    if (activeTool === 'brush') {
      setCurrentPreviewElement((prev) => {
        if (prev && prev.type === 'brush') {
          return {
            ...prev,
            points: [...prev.points, worldPt],
          };
        }
        return prev;
      });
    } else if (activeTool === 'eraser') {
      eraseNearPoint(worldPt);
    } else if (activeTool === 'rectangle') {
      const x = Math.min(startPoint.x, worldPt.x);
      const y = Math.min(startPoint.y, worldPt.y);
      const w = Math.abs(worldPt.x - startPoint.x);
      const h = Math.abs(worldPt.y - startPoint.y);
      setCurrentPreviewElement({
        id: generateId(),
        type: 'rectangle',
        color: selectedColor,
        width: strokeWidth,
        x,
        y,
        w,
        h,
      });
    } else if (activeTool === 'square') {
      const dx = worldPt.x - startPoint.x;
      const dy = worldPt.y - startPoint.y;
      const size = Math.max(Math.abs(dx), Math.abs(dy));
      const x = dx >= 0 ? startPoint.x : startPoint.x - size;
      const y = dy >= 0 ? startPoint.y : startPoint.y - size;
      setCurrentPreviewElement({
        id: generateId(),
        type: 'square',
        color: selectedColor,
        width: strokeWidth,
        x,
        y,
        size,
      });
    } else if (activeTool === 'circle') {
      const radius = Math.hypot(worldPt.x - startPoint.x, worldPt.y - startPoint.y);
      setCurrentPreviewElement({
        id: generateId(),
        type: 'circle',
        color: selectedColor,
        width: strokeWidth,
        cx: startPoint.x,
        cy: startPoint.y,
        radius,
      });
    } else if (activeTool === 'triangle') {
      const x1 = startPoint.x;
      const y1 = worldPt.y;
      const x2 = (startPoint.x + worldPt.x) / 2;
      const y2 = startPoint.y;
      const x3 = worldPt.x;
      const y3 = worldPt.y;
      setCurrentPreviewElement({
        id: generateId(),
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
      const outerRadius = Math.hypot(worldPt.x - startPoint.x, worldPt.y - startPoint.y);
      setCurrentPreviewElement({
        id: generateId(),
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

  const handleEnd = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isRotatingElement) {
      setIsRotatingElement(false);
      setDragStartPoint(null);
      return;
    }

    if (isDraggingElement) {
      setIsDraggingElement(false);
      setDragStartPoint(null);
      return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentPreviewElement) {
      addElement(currentPreviewElement);
      setCurrentPreviewElement(null);
    }
    setStartPoint(null);
  };

  // Suporte a Zoom com a Roda do Mouse
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.1 : -0.1;
    handleZoom(zoomFactor);
  };

  // Lógica da borracha
  const eraseNearPoint = (worldPt: BoardPoint) => {
    setElements((prev) => {
      const threshold = 18 / zoom;
      const filtered = prev.filter((el) => {
        const bounds = getElementBounds(el);
        return Math.hypot(bounds.cx - worldPt.x, bounds.cy - worldPt.y) > bounds.width / 2 + threshold;
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
        id: generateId(),
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

  const selectedElement = elements.find((e) => e.id === selectedElementId);

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
          {/* Zoom controls */}
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mr: 1 }}>
            <Tooltip title="Diminuir Zoom">
              <IconButton size="small" onClick={() => handleZoom(-0.1)}>
                <ZoomOutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'center', fontWeight: 700 }}>
              {Math.round(zoom * 100)}%
            </Typography>
            <Tooltip title="Aumentar Zoom">
              <IconButton size="small" onClick={() => handleZoom(0.1)}>
                <ZoomInIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Centralizar / Resetar Visão">
              <IconButton size="small" onClick={handleResetView}>
                <CenterFocusStrongIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>

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

      {/* Whiteboard Primary Toolbar */}
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
            if (newTool) {
              setActiveTool(newTool);
              if (newTool !== 'select') {
                setSelectedElementId(null);
              }
            }
          }}
          aria-label="ferramenta de desenho"
        >
          <ToggleButton value="select" aria-label="cursor comum e seleção">
            <Tooltip title="Cursor Comum (Selecionar, Mover, Girar, Inverter)">
              <NearMeIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>

          <ToggleButton value="pan" aria-label="navegação e arrasto da lousa">
            <Tooltip title="Navegação / Mover Lousa (Arrastar tela)">
              <PanToolIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>

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
              onClick={() => handleStrokeWidthChange(sw.value)}
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
                  onClick={() => handleColorChange(p.color)}
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

      {/* Selected Element Quick Transformation Bar */}
      {selectedElement && (
        <Box
          sx={{
            py: 1,
            px: 2,
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1.5,
            backgroundColor: isDark ? 'rgba(90, 166, 226, 0.12)' : 'rgba(90, 166, 226, 0.08)',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 700, color: PALETTE_COLORS.secondary, textTransform: 'uppercase' }}>
            Objeto Selecionado ({selectedElement.type}):
          </Typography>

          <Tooltip title="Rotacionar 90° no sentido horário">
            <Button
              size="small"
              variant="outlined"
              startIcon={<RotateRightIcon fontSize="small" />}
              onClick={() => handleRotateSelected(90)}
              sx={{ textTransform: 'none', py: 0.3, fontSize: '0.75rem' }}
            >
              Girar +90°
            </Button>
          </Tooltip>

          <Tooltip title="Inverter Horizontalmente">
            <Button
              size="small"
              variant="outlined"
              startIcon={<FlipIcon fontSize="small" />}
              onClick={() => handleFlipSelected('x')}
              sx={{ textTransform: 'none', py: 0.3, fontSize: '0.75rem' }}
            >
              Inverter Horiz.
            </Button>
          </Tooltip>

          <Tooltip title="Inverter Verticalmente">
            <Button
              size="small"
              variant="outlined"
              startIcon={<FlipIcon fontSize="small" sx={{ transform: 'rotate(90deg)' }} />}
              onClick={() => handleFlipSelected('y')}
              sx={{ textTransform: 'none', py: 0.3, fontSize: '0.75rem' }}
            >
              Inverter Vert.
            </Button>
          </Tooltip>

          <Tooltip title="Duplicar Objeto">
            <Button
              size="small"
              variant="outlined"
              startIcon={<ContentCopyIcon fontSize="small" />}
              onClick={handleDuplicateSelected}
              sx={{ textTransform: 'none', py: 0.3, fontSize: '0.75rem' }}
            >
              Duplicar
            </Button>
          </Tooltip>

          <Tooltip title="Excluir Objeto Selecionado">
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<DeleteOutlineIcon fontSize="small" />}
              onClick={handleDeleteSelected}
              sx={{ textTransform: 'none', py: 0.3, fontSize: '0.75rem' }}
            >
              Excluir
            </Button>
          </Tooltip>
        </Box>
      )}

      {/* Canvas Area with Clipping */}
      <Box
        ref={containerRef}
        sx={{
          position: 'relative',
          width: '100%',
          height: 520,
          cursor:
            activeTool === 'select'
              ? isDraggingElement
                ? 'grabbing'
                : 'default'
              : activeTool === 'pan'
              ? isPanning
                ? 'grabbing'
                : 'grab'
              : activeTool === 'brush'
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
          onWheel={handleWheel}
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
