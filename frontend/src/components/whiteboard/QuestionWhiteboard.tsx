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
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from '@mui/material';
import KeyboardIcon from '@mui/icons-material/Keyboard';
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
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
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

// Cursor personalizado para rotação livre
const ROTATE_CURSOR =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0 0 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 0 0 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z' fill='%23000000' stroke='%23ffffff' stroke-width='1.5' stroke-linejoin='round'/%3E%3C/svg%3E\") 12 12, crosshair";

// Cursores para resize handles
const RESIZE_CURSORS: Record<string, string> = {
  nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize',
  w: 'w-resize',                   e: 'e-resize',
  sw: 'sw-resize', s: 's-resize', se: 'se-resize',
};

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

// Retorna bounds englobando múltiplos elementos
const getMultiBounds = (els: BoardElement[]) => {
  if (els.length === 0) return null;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const el of els) {
    const b = getElementBounds(el);
    if (b.minX < minX) minX = b.minX;
    if (b.maxX > maxX) maxX = b.maxX;
    if (b.minY < minY) minY = b.minY;
    if (b.maxY > maxY) maxY = b.maxY;
  }
  return { minX, maxX, minY, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, width: maxX - minX, height: maxY - minY };
};

// Aplica delta de posição a um elemento
const moveElement = (el: BoardElement, dx: number, dy: number): BoardElement => {
  switch (el.type) {
    case 'brush':
      return { ...el, points: el.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
    case 'rectangle':
    case 'square':
      return { ...el, x: el.x + dx, y: el.y + dy };
    case 'triangle':
      return { ...el, x1: el.x1 + dx, y1: el.y1 + dy, x2: el.x2 + dx, y2: el.y2 + dy, x3: el.x3 + dx, y3: el.y3 + dy };
    case 'circle':
    case 'star':
      return { ...el, cx: el.cx + dx, cy: el.cy + dy };
    case 'text':
      return { ...el, x: el.x + dx, y: el.y + dy };
  }
};

// Aplica escala a um elemento em relação a um ponto de âncora
const scaleElement = (el: BoardElement, sx: number, sy: number, anchorX: number, anchorY: number): BoardElement => {
  switch (el.type) {
    case 'brush': {
      const newPoints = el.points.map((p) => ({
        x: anchorX + (p.x - anchorX) * sx,
        y: anchorY + (p.y - anchorY) * sy,
      }));
      return { ...el, points: newPoints };
    }
    case 'rectangle': {
      const newX = anchorX + (el.x - anchorX) * sx;
      const newY = anchorY + (el.y - anchorY) * sy;
      return { ...el, x: newX, y: newY, w: el.w * sx, h: el.h * sy };
    }
    case 'square': {
      const newX = anchorX + (el.x - anchorX) * sx;
      const newY = anchorY + (el.y - anchorY) * sy;
      const newSize = el.size * Math.max(Math.abs(sx), Math.abs(sy));
      return { ...el, x: newX, y: newY, size: newSize };
    }
    case 'triangle': {
      return {
        ...el,
        x1: anchorX + (el.x1 - anchorX) * sx, y1: anchorY + (el.y1 - anchorY) * sy,
        x2: anchorX + (el.x2 - anchorX) * sx, y2: anchorY + (el.y2 - anchorY) * sy,
        x3: anchorX + (el.x3 - anchorX) * sx, y3: anchorY + (el.y3 - anchorY) * sy,
      };
    }
    case 'circle': {
      const newCx = anchorX + (el.cx - anchorX) * sx;
      const newCy = anchorY + (el.cy - anchorY) * sy;
      const newRadius = el.radius * Math.max(Math.abs(sx), Math.abs(sy));
      return { ...el, cx: newCx, cy: newCy, radius: Math.max(5, newRadius) };
    }
    case 'star': {
      const newCx = anchorX + (el.cx - anchorX) * sx;
      const newCy = anchorY + (el.cy - anchorY) * sy;
      const factor = Math.max(Math.abs(sx), Math.abs(sy));
      return { ...el, cx: newCx, cy: newCy, outerRadius: Math.max(5, el.outerRadius * factor), innerRadius: Math.max(2, el.innerRadius * factor) };
    }
    case 'text': {
      const newX = anchorX + (el.x - anchorX) * sx;
      const newY = anchorY + (el.y - anchorY) * sy;
      const newFontSize = Math.max(8, el.fontSize * Math.max(Math.abs(sx), Math.abs(sy)));
      return { ...el, x: newX, y: newY, fontSize: Math.round(newFontSize) };
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

// --- Tipos de resize handle ---
type ResizeHandle = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se';

export const QuestionWhiteboard: React.FC<QuestionWhiteboardProps> = ({ questionId }) => {
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';
  const { user } = useAuth();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inlineTextareaRef = useRef<HTMLTextAreaElement | null>(null);

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

  // Multi-selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Rubber-band (box selection) state
  const [isBoxSelecting, setIsBoxSelecting] = useState<boolean>(false);
  const [boxSelectStart, setBoxSelectStart] = useState<BoardPoint | null>(null);
  const [boxSelectCurrent, setBoxSelectCurrent] = useState<BoardPoint | null>(null);

  // Single element interaction (rotate / drag — applied to whole selection)
  const [isDraggingElement, setIsDraggingElement] = useState<boolean>(false);
  const [isRotatingElement, setIsRotatingElement] = useState<boolean>(false);
  const [dragStartPoint, setDragStartPoint] = useState<BoardPoint | null>(null);
  const [isHoveringRotationHandle, setIsHoveringRotationHandle] = useState<boolean>(false);
  const [isHoveringSelectedElement, setIsHoveringSelectedElement] = useState<boolean>(false);

  // Resize state
  const [activeResizeHandle, setActiveResizeHandle] = useState<ResizeHandle | null>(null);
  const [resizeStartBounds, setResizeStartBounds] = useState<{ minX: number; maxX: number; minY: number; maxY: number } | null>(null);
  const [resizeStartElements, setResizeStartElements] = useState<BoardElement[]>([]);
  const [isHoveringResizeHandle, setIsHoveringResizeHandle] = useState<ResizeHandle | null>(null);

  // Drawing state
  const [elements, setElements] = useState<BoardElement[]>([]);
  const [undoStack, setUndoStack] = useState<BoardElement[][]>([]);
  const [redoStack, setRedoStack] = useState<BoardElement[][]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [startPoint, setStartPoint] = useState<BoardPoint | null>(null);
  const [currentPreviewElement, setCurrentPreviewElement] = useState<BoardElement | null>(null);

  // Inline text editing state (no modal)
  const [inlineTextState, setInlineTextState] = useState<{
    elementId: string | null;  // null = new element being created
    position: BoardPoint;      // world coords (x, y baseline)
    text: string;
    color: string;
    fontSize: number;
  } | null>(null);

  // Shortcuts Dialog State
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState<boolean>(false);

  // Persistence status
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Canvas Dimensions
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number }>({
    width: 900,
    height: 520,
  });

  // Helper: single selected element (for single-selection operations like rotate)
  const singleSelectedId = selectedIds.size === 1 ? [...selectedIds][0] : null;
  const selectedElements = elements.filter((e) => selectedIds.has(e.id));

  // Atualiza cor padrão se o tema mudar
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

  // Ajusta dimensões do Canvas com base no container e modo tela cheia
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measureSize = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(
        300,
        Math.floor(rect.width || container.clientWidth || (isFullscreen ? window.innerWidth : 900))
      );
      const height = isFullscreen
        ? Math.max(300, Math.floor(rect.height || container.clientHeight || (window.innerHeight - 135)))
        : 520;

      if (width > 0 && height > 0) {
        setCanvasDimensions((prev) => {
          if (prev.width === width && prev.height === height) return prev;
          return { width, height };
        });
      }
    };

    measureSize();

    const resizeObserver = new ResizeObserver(() => {
      measureSize();
    });
    resizeObserver.observe(container);

    const rafId = requestAnimationFrame(measureSize);
    const t1 = setTimeout(measureSize, 50);
    const t2 = setTimeout(measureSize, 200);

    window.addEventListener('resize', measureSize);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(rafId);
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', measureSize);
    };
  }, [isFullscreen]);

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

  const worldToScreen = useCallback(
    (worldX: number, worldY: number): BoardPoint => {
      return {
        x: worldX * zoom + viewportOffset.x,
        y: worldY * zoom + viewportOffset.y,
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

  // Calcula os 8 resize handles em coordenadas de mundo para a multi-seleção
  const getResizeHandlesWorld = useCallback((bounds: { minX: number; maxX: number; minY: number; maxY: number }): Record<ResizeHandle, BoardPoint> => {
    const { minX, maxX, minY, maxY } = bounds;
    const mx = (minX + maxX) / 2;
    const my = (minY + maxY) / 2;
    return {
      nw: { x: minX, y: minY }, n: { x: mx, y: minY }, ne: { x: maxX, y: minY },
      w:  { x: minX, y: my  },                           e: { x: maxX, y: my  },
      sw: { x: minX, y: maxY }, s: { x: mx, y: maxY }, se: { x: maxX, y: maxY },
    };
  }, []);

  // Detecta se worldPt está sobre um resize handle
  const findResizeHandleAtPoint = useCallback((worldPt: BoardPoint, bounds: { minX: number; maxX: number; minY: number; maxY: number }): ResizeHandle | null => {
    const handles = getResizeHandlesWorld(bounds);
    const hitRadius = 8 / zoom;
    for (const [key, pt] of Object.entries(handles) as [ResizeHandle, BoardPoint][]) {
      if (Math.hypot(worldPt.x - pt.x, worldPt.y - pt.y) <= hitRadius) {
        return key;
      }
    }
    return null;
  }, [zoom, getResizeHandlesWorld]);

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

    // 1. Limpa e recorta estritamente a área visível do canvas
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.clip();

    const bgColor = isDark ? '#161a20' : '#FFFFFF';
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // 2. Desenha grade infinita
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
          // Não renderizar o texto que está sendo editado inline (o textarea cobre)
          if (inlineTextState && inlineTextState.elementId === el.id) break;
          ctx.font = `600 ${el.fontSize}px Inter, sans-serif`;
          ctx.fillText(el.text, el.x, el.y);
          break;
        }
      }

      ctx.restore();
    }

    // 4. Desenha bounding boxes de seleção para cada elemento selecionado individualmente
    for (const el of selectedElements) {
      if (inlineTextState && inlineTextState.elementId === el.id) continue;
      const bounds = getElementBounds(el);
      const padding = 4 / zoom;

      ctx.save();
      ctx.translate(bounds.cx, bounds.cy);
      if (el.rotation) {
        ctx.rotate((el.rotation * Math.PI) / 180);
      }
      ctx.translate(-bounds.cx, -bounds.cy);

      ctx.strokeStyle = PALETTE_COLORS.secondary + '88';
      ctx.lineWidth = 1 / zoom;
      ctx.setLineDash([3 / zoom, 3 / zoom]);
      ctx.strokeRect(
        bounds.minX - padding,
        bounds.minY - padding,
        bounds.width + padding * 2,
        bounds.height + padding * 2
      );
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 5. Desenha bounding box global da multi-seleção + handles de resize + handle de rotação
    if (selectedIds.size > 0 && !inlineTextState) {
      const multiBounds = getMultiBounds(selectedElements);
      if (multiBounds) {
        const padding = 8 / zoom;
        const mMinX = multiBounds.minX - padding;
        const mMinY = multiBounds.minY - padding;
        const mW = multiBounds.width + padding * 2;
        const mH = multiBounds.height + padding * 2;

        // Bounding box tracejada principal
        ctx.save();
        ctx.strokeStyle = PALETTE_COLORS.secondary;
        ctx.lineWidth = 1.5 / zoom;
        ctx.setLineDash([4 / zoom, 4 / zoom]);
        ctx.strokeRect(mMinX, mMinY, mW, mH);
        ctx.setLineDash([]);

        // Handle de rotação (apenas para seleção de 1 elemento)
        if (selectedIds.size === 1) {
          const rotHandleY = mMinY - 22 / zoom;
          ctx.beginPath();
          ctx.moveTo(multiBounds.cx, mMinY);
          ctx.lineTo(multiBounds.cx, rotHandleY);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(multiBounds.cx, rotHandleY, 6 / zoom, 0, Math.PI * 2);
          ctx.fillStyle = PALETTE_COLORS.primary;
          ctx.fill();
          ctx.strokeStyle = '#1a1e24';
          ctx.lineWidth = 1.5 / zoom;
          ctx.stroke();
        }

        // Resize handles (8 pontos)
        const handleSize = 8 / zoom;
        const handles = getResizeHandlesWorld({ minX: mMinX, maxX: mMinX + mW, minY: mMinY, maxY: mMinY + mH });
        for (const [key, pt] of Object.entries(handles) as [ResizeHandle, BoardPoint][]) {
          const isHovered = isHoveringResizeHandle === key;
          ctx.beginPath();
          ctx.rect(pt.x - handleSize / 2, pt.y - handleSize / 2, handleSize, handleSize);
          ctx.fillStyle = isHovered ? PALETTE_COLORS.primary : '#ffffff';
          ctx.fill();
          ctx.strokeStyle = PALETTE_COLORS.secondary;
          ctx.lineWidth = 1.5 / zoom;
          ctx.stroke();
        }

        ctx.restore();
      }
    }

    // 6. Desenha rubber-band box de seleção
    if (isBoxSelecting && boxSelectStart && boxSelectCurrent) {
      const x = Math.min(boxSelectStart.x, boxSelectCurrent.x);
      const y = Math.min(boxSelectStart.y, boxSelectCurrent.y);
      const w = Math.abs(boxSelectCurrent.x - boxSelectStart.x);
      const h = Math.abs(boxSelectCurrent.y - boxSelectStart.y);

      ctx.save();
      ctx.strokeStyle = PALETTE_COLORS.secondary;
      ctx.lineWidth = 1.5 / zoom;
      ctx.setLineDash([4 / zoom, 4 / zoom]);
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = PALETTE_COLORS.secondary + '22';
      ctx.fillRect(x, y, w, h);
      ctx.setLineDash([]);
      ctx.restore();
    }

    ctx.restore(); // Restaura transform da câmera
    ctx.restore(); // Restaura clipping
  }, [
    canvasDimensions, elements, currentPreviewElement, isDark, showGrid,
    viewportOffset, zoom, selectedIds, selectedElements, isBoxSelecting,
    boxSelectStart, boxSelectCurrent, isHoveringResizeHandle, inlineTextState,
    getResizeHandlesWorld,
  ]);

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
  const addElement = (newEl: BoardElement, selectIt: boolean = false) => {
    setUndoStack((prev) => [...prev, elements]);
    setRedoStack([]);
    setElements((prev) => [...prev, newEl]);
    if (selectIt) {
      setSelectedIds(new Set([newEl.id]));
    }
    setHasUnsavedChanges(true);
  };

  // Atualiza elementos por ids com um updater
  const updateElementsByIds = (ids: Set<string>, updater: (prev: BoardElement) => BoardElement) => {
    setUndoStack((prev) => [...prev, elements]);
    setRedoStack([]);
    setElements((prev) => prev.map((el) => ids.has(el.id) ? updater(el) : el));
    setHasUnsavedChanges(true);
  };

  // Undo & Redo
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev, elements]);
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setElements(previous);
    setSelectedIds(new Set());
    setHasUnsavedChanges(true);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, elements]);
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setElements(next);
    setSelectedIds(new Set());
    setHasUnsavedChanges(true);
  };

  const handleClear = () => {
    if (elements.length === 0) return;
    setUndoStack((prev) => [...prev, elements]);
    setRedoStack([]);
    setElements([]);
    setSelectedIds(new Set());
    setHasUnsavedChanges(true);
  };

  // Funções de Transformação para seleção (aplica a todos os selecionados)
  const handleRotateSelected = (deltaDegrees: number) => {
    updateElementsByIds(selectedIds, (el) => ({
      ...el,
      rotation: ((el.rotation || 0) + deltaDegrees + 360) % 360,
    }));
  };

  const handleFlipSelected = (axis: 'x' | 'y') => {
    updateElementsByIds(selectedIds, (el) => ({
      ...el,
      flipX: axis === 'x' ? !el.flipX : el.flipX,
      flipY: axis === 'y' ? !el.flipY : el.flipY,
    }));
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    setUndoStack((prev) => [...prev, elements]);
    setRedoStack([]);
    setElements((prev) => prev.filter((el) => !selectedIds.has(el.id)));
    setSelectedIds(new Set());
    setHasUnsavedChanges(true);
  };

  const handleDuplicateSelected = () => {
    if (selectedIds.size === 0) return;
    const targets = elements.filter((el) => selectedIds.has(el.id));
    const offset = 25;
    const newEls: BoardElement[] = [];
    const newIds = new Set<string>();

    for (const target of targets) {
      let duplicated: BoardElement;
      const newId = generateId();

      switch (target.type) {
        case 'brush':
          duplicated = { ...target, id: newId, points: target.points.map((p) => ({ x: p.x + offset, y: p.y + offset })) };
          break;
        case 'rectangle':
          duplicated = { ...target, id: newId, x: target.x + offset, y: target.y + offset };
          break;
        case 'square':
          duplicated = { ...target, id: newId, x: target.x + offset, y: target.y + offset };
          break;
        case 'triangle':
          duplicated = { ...target, id: newId, x1: target.x1 + offset, y1: target.y1 + offset, x2: target.x2 + offset, y2: target.y2 + offset, x3: target.x3 + offset, y3: target.y3 + offset };
          break;
        case 'circle':
        case 'star':
          duplicated = { ...target, id: newId, cx: target.cx + offset, cy: target.cy + offset };
          break;
        case 'text':
          duplicated = { ...target, id: newId, x: target.x + offset, y: target.y + offset };
          break;
      }

      newEls.push(duplicated);
      newIds.add(newId);
    }

    setUndoStack((prev) => [...prev, elements]);
    setRedoStack([]);
    setElements((prev) => [...prev, ...newEls]);
    setSelectedIds(newIds);
    setHasUnsavedChanges(true);
  };

  // Alterar Cor dos elementos selecionados ou da ferramenta ativa
  const handleColorChange = (newColor: string) => {
    setSelectedColor(newColor);
    if (selectedIds.size > 0) {
      updateElementsByIds(selectedIds, (el) => ({ ...el, color: newColor }));
    }
  };

  // Alterar Espessura do traço dos elementos selecionados ou da ferramenta ativa
  const handleStrokeWidthChange = (newWidth: number) => {
    setStrokeWidth(newWidth);
    if (selectedIds.size > 0) {
      updateElementsByIds(selectedIds, (el) => ('width' in el ? { ...el, width: newWidth } : el));
    }
  };

  // Navegação: Zoom In, Zoom Out, Reset
  const handleZoom = useCallback((delta: number, focalPoint?: BoardPoint) => {
    setZoom((prevZoom) => {
      const nextZoom = Math.max(0.3, Math.min(3.0, prevZoom + delta));
      const roundedZoom = Math.round(nextZoom * 10) / 10;
      if (roundedZoom === prevZoom) return prevZoom;

      if (focalPoint) {
        setViewportOffset((prevOffset) => {
          const worldX = (focalPoint.x - prevOffset.x) / prevZoom;
          const worldY = (focalPoint.y - prevOffset.y) / prevZoom;
          return {
            x: Math.round(focalPoint.x - worldX * roundedZoom),
            y: Math.round(focalPoint.y - worldY * roundedZoom),
          };
        });
      }
      return roundedZoom;
    });
  }, []);

  const handleResetView = () => {
    setViewportOffset({ x: 0, y: 0 });
    setZoom(1.0);
  };

  // Movimento fino com as setas do teclado (nudge) — aplicado a todos os selecionados
  const moveSelectedBy = useCallback((dx: number, dy: number) => {
    if (selectedIds.size === 0) return;
    setElements((prev) =>
      prev.map((item) => selectedIds.has(item.id) ? moveElement(item, dx, dy) : item)
    );
    setHasUnsavedChanges(true);
  }, [selectedIds]);

  // Confirma edição de texto inline
  const commitInlineText = useCallback(() => {
    if (!inlineTextState) return;
    const trimmed = inlineTextState.text.trim();

    if (inlineTextState.elementId) {
      // Editando elemento existente
      if (trimmed) {
        setUndoStack((prev) => [...prev, elements]);
        setRedoStack([]);
        setElements((prev) =>
          prev.map((el) =>
            el.id === inlineTextState.elementId
              ? { ...el, text: trimmed, color: inlineTextState.color, fontSize: inlineTextState.fontSize } as BoardElement
              : el
          )
        );
        setHasUnsavedChanges(true);
      } else {
        // Texto vazio: remove o elemento
        setUndoStack((prev) => [...prev, elements]);
        setRedoStack([]);
        setElements((prev) => prev.filter((el) => el.id !== inlineTextState.elementId));
        setSelectedIds(new Set());
        setHasUnsavedChanges(true);
      }
    } else {
      // Novo elemento de texto
      if (trimmed) {
        addElement({
          id: generateId(),
          type: 'text',
          color: inlineTextState.color,
          fontSize: inlineTextState.fontSize,
          x: inlineTextState.position.x,
          y: inlineTextState.position.y,
          text: trimmed,
        });
      }
    }

    setInlineTextState(null);
  }, [inlineTextState, elements]);

  // Foca o textarea ao abrir edição inline
  useEffect(() => {
    if (inlineTextState) {
      requestAnimationFrame(() => {
        const el = inlineTextareaRef.current;
        if (!el) return;
        el.focus();
        // Ao editar texto existente, posiciona o cursor no final
        // Ao criar novo texto, apenas foca (sem selecionar, para não sobrescrever ao digitar)
        const len = el.value.length;
        el.setSelectionRange(len, len);
      });
    }
  }, [inlineTextState]);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Se está editando texto inline, só permite Esc (para cancelar) ou Enter sem Shift (para confirmar)
      if (inlineTextState) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setInlineTextState(null);
        }
        // Enter confirma (Shift+Enter é nova linha)
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          commitInlineText();
        }
        return;
      }

      if (shortcutsDialogOpen) {
        if (e.key === 'Escape') {
          setShortcutsDialogOpen(false);
        }
        return;
      }

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.closest('.MuiInputBase-root'))
      ) {
        return;
      }

      // Ajuda
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShortcutsDialogOpen(true);
        return;
      }

      // Exclusão
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.size > 0) {
          e.preventDefault();
          handleDeleteSelected();
        }
        return;
      }

      // Ctrl / Cmd
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault();
          if (e.shiftKey) { handleRedo(); } else { handleUndo(); }
          return;
        }
        if (e.key.toLowerCase() === 'y') {
          e.preventDefault();
          handleRedo();
          return;
        }
        if (e.key.toLowerCase() === 'd') {
          e.preventDefault();
          handleDuplicateSelected();
          return;
        }
        if (e.key.toLowerCase() === 'a') {
          e.preventDefault();
          setSelectedIds(new Set(elements.map((el) => el.id)));
          return;
        }
      }

      // Escape
      if (e.key === 'Escape') {
        if (selectedIds.size > 0) {
          e.preventDefault();
          setSelectedIds(new Set());
          return;
        }
        if (isFullscreen) {
          e.preventDefault();
          setIsFullscreen(false);
          return;
        }
      }

      // Nudge com setas
      if (selectedIds.size > 0 && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 2;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        moveSelectedBy(dx, dy);
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Atalhos de Ferramentas
      const key = e.key.toLowerCase();
      switch (key) {
        case 'v': case '1': setActiveTool('select'); break;
        case 'h': case '2': setActiveTool('pan'); setSelectedIds(new Set()); break;
        case 'b': case '3': setActiveTool('brush'); setSelectedIds(new Set()); break;
        case 'e': case '4': setActiveTool('eraser'); setSelectedIds(new Set()); break;
        case 't': case '5': setActiveTool('text'); setSelectedIds(new Set()); break;
        case 'r': case '6': setActiveTool('rectangle'); setSelectedIds(new Set()); break;
        case 's': case '7': setActiveTool('square'); setSelectedIds(new Set()); break;
        case 'c': case '8': setActiveTool('circle'); setSelectedIds(new Set()); break;
        case 'g': case '9': setActiveTool('triangle'); setSelectedIds(new Set()); break;
        case 'x': case '0': setActiveTool('star'); setSelectedIds(new Set()); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedIds, shortcutsDialogOpen, isFullscreen, inlineTextState,
    handleDeleteSelected, handleUndo, handleRedo, handleDuplicateSelected,
    moveSelectedBy, commitInlineText, elements,
  ]);

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
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      const bounds = getElementBounds(el);
      const hitPadding = 12;

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

  // Encontra elementos dentro de um rect de rubber-band (coords de mundo)
  const findElementsInRect = (r1: BoardPoint, r2: BoardPoint): BoardElement[] => {
    const minX = Math.min(r1.x, r2.x);
    const maxX = Math.max(r1.x, r2.x);
    const minY = Math.min(r1.y, r2.y);
    const maxY = Math.max(r1.y, r2.y);
    return elements.filter((el) => {
      const b = getElementBounds(el);
      return b.cx >= minX && b.cx <= maxX && b.cy >= minY && b.cy <= maxY;
    });
  };

  // Testa se o clique foi no manipulador de rotação do elemento selecionado (apenas 1 seleção)
  const isClickOnRotationHandle = (worldPt: BoardPoint): boolean => {
    if (selectedIds.size !== 1) return false;
    const el = elements.find((e) => e.id === [...selectedIds][0]);
    if (!el) return false;
    const bounds = getElementBounds(el);
    const rotHandleDist = 22 / zoom;
    const padding = 8 / zoom;

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

    const handlePt = { x: bounds.cx, y: bounds.minY - padding - rotHandleDist };
    return Math.hypot(testPt.x - handlePt.x, testPt.y - handlePt.y) <= 12 / zoom;
  };

  // Handlers de Interação do Canvas
  const handleStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    // Commit inline text se estiver aberto
    if (inlineTextState) {
      commitInlineText();
      return;
    }

    const screenPt = getScreenPoint(e);
    const worldPt = screenToWorld(screenPt.x, screenPt.y);
    const isShift = 'shiftKey' in e && e.shiftKey;

    // Ferramenta de Navegação (Pan) ou clique com botão do meio
    if (activeTool === 'pan' || ('button' in e && e.button === 1)) {
      setIsPanning(true);
      setPanStart(screenPt);
      return;
    }

    // Ferramenta de Seleção
    if (activeTool === 'select') {
      // Checa rotation handle primeiro (só quando 1 selecionado)
      if (isClickOnRotationHandle(worldPt)) {
        setIsRotatingElement(true);
        setDragStartPoint(worldPt);
        return;
      }

      // Checa resize handles
      if (selectedIds.size > 0) {
        const multiBounds = getMultiBounds(selectedElements);
        if (multiBounds) {
          const padding = 8 / zoom;
          const paddedBounds = {
            minX: multiBounds.minX - padding,
            maxX: multiBounds.maxX + padding,
            minY: multiBounds.minY - padding,
            maxY: multiBounds.maxY + padding,
          };
          const rHandle = findResizeHandleAtPoint(worldPt, paddedBounds);
          if (rHandle) {
            setActiveResizeHandle(rHandle);
            setResizeStartBounds(paddedBounds);
            setResizeStartElements([...selectedElements]);
            setDragStartPoint(worldPt);
            return;
          }
        }
      }

      const hit = findElementAtPoint(worldPt);

      if (hit) {
        if (isShift) {
          // Shift+click: toggle no set de seleção
          setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(hit.id)) {
              next.delete(hit.id);
            } else {
              next.add(hit.id);
            }
            return next;
          });
        } else {
          if (!selectedIds.has(hit.id)) {
            // Clique sem Shift em elemento fora da seleção: seleciona só ele
            setSelectedIds(new Set([hit.id]));
          }
          // Inicia drag de todos os selecionados
          setIsDraggingElement(true);
          setDragStartPoint(worldPt);
        }
      } else {
        if (!isShift) {
          setSelectedIds(new Set());
        }
        // Inicia rubber-band box select
        setIsBoxSelecting(true);
        setBoxSelectStart(worldPt);
        setBoxSelectCurrent(worldPt);
      }
      return;
    }

    // Desmarca qualquer elemento selecionado ao usar ferramentas que não sejam de seleção
    if (selectedIds.size > 0) {
      setSelectedIds(new Set());
    }

    // Ferramenta de Texto (inline)
    if (activeTool === 'text') {
      const fontSize = Math.max(14, strokeWidth * 4);
      setInlineTextState({
        elementId: null,
        position: { x: worldPt.x, y: worldPt.y },
        text: '',
        color: selectedColor,
        fontSize,
      });
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

    // Hover detection (selection tool, não arrastando)
    if (activeTool === 'select' && !isDraggingElement && !isRotatingElement && !isDrawing && !isPanning && !isBoxSelecting && !activeResizeHandle) {
      // Resize handle hover
      if (selectedIds.size > 0) {
        const multiBounds = getMultiBounds(selectedElements);
        if (multiBounds) {
          const padding = 8 / zoom;
          const paddedBounds = {
            minX: multiBounds.minX - padding,
            maxX: multiBounds.maxX + padding,
            minY: multiBounds.minY - padding,
            maxY: multiBounds.maxY + padding,
          };
          const rHandle = findResizeHandleAtPoint(worldPt, paddedBounds);
          setIsHoveringResizeHandle(rHandle);

          if (rHandle) {
            setIsHoveringRotationHandle(false);
            setIsHoveringSelectedElement(false);
            return;
          }
        }
      }

      // Rotation handle hover (1 selecionado)
      if (isClickOnRotationHandle(worldPt)) {
        setIsHoveringRotationHandle(true);
        setIsHoveringSelectedElement(false);
        setIsHoveringResizeHandle(null);
        return;
      }

      setIsHoveringRotationHandle(false);
      setIsHoveringResizeHandle(null);
      const hit = findElementAtPoint(worldPt);
      setIsHoveringSelectedElement(hit !== null && selectedIds.has(hit.id));
      return;
    } else {
      if (!isRotatingElement) setIsHoveringRotationHandle(false);
      if (!activeResizeHandle) setIsHoveringResizeHandle(null);
      if (!isDraggingElement) setIsHoveringSelectedElement(false);
    }

    // Navegação (Pan)
    if (isPanning) {
      const dx = screenPt.x - panStart.x;
      const dy = screenPt.y - panStart.y;
      setViewportOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setPanStart(screenPt);
      return;
    }

    // Rubber-band box select
    if (isBoxSelecting && boxSelectStart) {
      setBoxSelectCurrent(worldPt);
      return;
    }

    // Rotação do elemento selecionado (apenas 1)
    if (isRotatingElement && singleSelectedId) {
      const el = elements.find((item) => item.id === singleSelectedId);
      if (el) {
        const bounds = getElementBounds(el);
        const angleRad = Math.atan2(worldPt.y - bounds.cy, worldPt.x - bounds.cx);
        const degrees = ((angleRad * 180) / Math.PI + 90 + 360) % 360;
        setElements((prev) =>
          prev.map((item) => (item.id === singleSelectedId ? { ...item, rotation: Math.round(degrees) } : item))
        );
        setHasUnsavedChanges(true);
      }
      return;
    }

    // Resize de elementos selecionados
    if (activeResizeHandle && resizeStartBounds && dragStartPoint && resizeStartElements.length > 0) {
      const { minX: bMinX, maxX: bMaxX, minY: bMinY, maxY: bMaxY } = resizeStartBounds;
      const bW = bMaxX - bMinX;
      const bH = bMaxY - bMinY;

      let newMinX = bMinX, newMaxX = bMaxX, newMinY = bMinY, newMaxY = bMaxY;

      const h = activeResizeHandle;
      if (h.includes('w')) newMinX = Math.min(worldPt.x, bMaxX - 10);
      if (h.includes('e')) newMaxX = Math.max(worldPt.x, bMinX + 10);
      if (h.includes('n')) newMinY = Math.min(worldPt.y, bMaxY - 10);
      if (h.includes('s')) newMaxY = Math.max(worldPt.y, bMinY + 10);

      const newW = newMaxX - newMinX;
      const newH = newMaxY - newMinY;

      const scaleX = bW > 0 ? newW / bW : 1;
      const scaleY = bH > 0 ? newH / bH : 1;

      // Âncora: canto oposto ao handle
      const anchorX = h.includes('w') ? bMaxX : bMinX;
      const anchorY = h.includes('n') ? bMaxY : bMinY;

      const updatedEls = resizeStartElements.map((el) =>
        scaleElement(el, scaleX, scaleY, anchorX, anchorY)
      );

      setElements((prev) => {
        const updatedMap = new Map(updatedEls.map((el) => [el.id, el]));
        return prev.map((el) => updatedMap.get(el.id) ?? el);
      });
      setHasUnsavedChanges(true);
      return;
    }

    // Movimentação / Drag dos elementos selecionados
    if (isDraggingElement && selectedIds.size > 0 && dragStartPoint) {
      const dx = worldPt.x - dragStartPoint.x;
      const dy = worldPt.y - dragStartPoint.y;

      setElements((prev) =>
        prev.map((item) => selectedIds.has(item.id) ? moveElement(item, dx, dy) : item)
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
          return { ...prev, points: [...prev.points, worldPt] };
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
      setCurrentPreviewElement({ id: generateId(), type: 'rectangle', color: selectedColor, width: strokeWidth, x, y, w, h });
    } else if (activeTool === 'square') {
      const size = Math.max(Math.abs(worldPt.x - startPoint.x), Math.abs(worldPt.y - startPoint.y));
      const x = worldPt.x < startPoint.x ? startPoint.x - size : startPoint.x;
      const y = worldPt.y < startPoint.y ? startPoint.y - size : startPoint.y;
      setCurrentPreviewElement({ id: generateId(), type: 'square', color: selectedColor, width: strokeWidth, x, y, size });
    } else if (activeTool === 'circle') {
      const radius = Math.hypot(worldPt.x - startPoint.x, worldPt.y - startPoint.y);
      setCurrentPreviewElement({ id: generateId(), type: 'circle', color: selectedColor, width: strokeWidth, cx: startPoint.x, cy: startPoint.y, radius });
    } else if (activeTool === 'triangle') {
      const x1 = startPoint.x;
      const y1 = worldPt.y;
      const x2 = (startPoint.x + worldPt.x) / 2;
      const y2 = startPoint.y;
      const x3 = worldPt.x;
      const y3 = worldPt.y;
      setCurrentPreviewElement({ id: generateId(), type: 'triangle', color: selectedColor, width: strokeWidth, x1, y1, x2, y2, x3, y3 });
    } else if (activeTool === 'star') {
      const outerRadius = Math.hypot(worldPt.x - startPoint.x, worldPt.y - startPoint.y);
      setCurrentPreviewElement({ id: generateId(), type: 'star', color: selectedColor, width: strokeWidth, cx: startPoint.x, cy: startPoint.y, outerRadius, innerRadius: outerRadius * 0.48, spikes: 5 });
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
      setIsHoveringRotationHandle(false);
      return;
    }

    if (activeResizeHandle) {
      setActiveResizeHandle(null);
      setResizeStartBounds(null);
      setResizeStartElements([]);
      setDragStartPoint(null);
      return;
    }

    if (isDraggingElement) {
      setIsDraggingElement(false);
      setDragStartPoint(null);
      setIsHoveringSelectedElement(false);
      return;
    }

    // Fim do rubber-band: seleciona elementos no rect
    if (isBoxSelecting && boxSelectStart && boxSelectCurrent) {
      const inRect = findElementsInRect(boxSelectStart, boxSelectCurrent);
      if (inRect.length > 0) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          for (const el of inRect) next.add(el.id);
          return next;
        });
      }
      setIsBoxSelecting(false);
      setBoxSelectStart(null);
      setBoxSelectCurrent(null);
      return;
    }

    setIsBoxSelecting(false);
    setBoxSelectStart(null);
    setBoxSelectCurrent(null);

    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentPreviewElement) {
      addElement(currentPreviewElement);
      setCurrentPreviewElement(null);
    }
    setStartPoint(null);
  };

  const handleMouseLeave = () => {
    handleEnd();
    setIsHoveringRotationHandle(false);
    setIsHoveringSelectedElement(false);
    setIsHoveringResizeHandle(null);
  };

  // Clique duplo no canvas: editar texto inline se elemento de texto for clicado, ou criar novo texto
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'select' && activeTool !== 'text') return;
    const screenPt = getScreenPoint(e);
    const worldPt = screenToWorld(screenPt.x, screenPt.y);
    const hit = findElementAtPoint(worldPt);
    if (hit && hit.type === 'text') {
      // Editar texto existente
      setSelectedIds(new Set([hit.id]));
      setInlineTextState({
        elementId: hit.id,
        position: { x: hit.x, y: hit.y },
        text: hit.text,
        color: hit.color,
        fontSize: hit.fontSize,
      });
    } else if (activeTool === 'select') {
      // Criar novo texto no local clicado com duplo clique
      const fontSize = Math.max(14, strokeWidth * 4);
      setInlineTextState({
        elementId: null,
        position: { x: worldPt.x, y: worldPt.y },
        text: '',
        color: selectedColor,
        fontSize,
      });
    }
  };

  // Bloqueia scroll da página durante o modo tela cheia
  useEffect(() => {
    if (isFullscreen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isFullscreen]);

  // Suporte a Zoom com a Roda do Mouse (sem propagar scroll para a página externa)
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas && !container) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const target = canvas || container;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 0.1 : -0.1;
      handleZoom(zoomFactor, { x: screenX, y: screenY });
    };

    if (canvas) canvas.addEventListener('wheel', onWheel, { passive: false });
    if (container) container.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      if (canvas) canvas.removeEventListener('wheel', onWheel);
      if (container) container.removeEventListener('wheel', onWheel);
    };
  }, [isFullscreen, handleZoom]);

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

  // Posição na tela do inline textarea (coords de tela, relativo ao container)
  const getInlineTextScreenPos = (): { left: number; top: number; fontSize: number } | null => {
    if (!inlineTextState || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const { x: sx, y: sy } = worldToScreen(inlineTextState.position.x, inlineTextState.position.y);
    // Offset relativo ao containerRef
    const container = containerRef.current;
    if (!container) return null;
    const cRect = container.getBoundingClientRect();
    return {
      left: rect.left - cRect.left + sx,
      top: rect.top - cRect.top + sy - inlineTextState.fontSize, // baseline offset
      fontSize: inlineTextState.fontSize * zoom,
    };
  };

  const inlineTextScreenPos = getInlineTextScreenPos();

  // Cursor do canvas dependendo do estado
  const getCanvasCursor = (): string => {
    if (inlineTextState) return 'text';
    if (isHoveringRotationHandle || isRotatingElement) return ROTATE_CURSOR;
    if (activeResizeHandle || isHoveringResizeHandle) {
      return RESIZE_CURSORS[activeResizeHandle || isHoveringResizeHandle!] || 'default';
    }
    if (activeTool === 'select') {
      if (isDraggingElement) return 'grabbing';
      if (isHoveringSelectedElement) return 'move';
      return 'default';
    }
    if (activeTool === 'pan') return isPanning ? 'grabbing' : 'grab';
    if (activeTool === 'brush') return 'crosshair';
    if (activeTool === 'text') return 'text';
    if (activeTool === 'eraser') return 'cell';
    return 'crosshair';
  };

  const selectedCount = selectedIds.size;
  const hasSelection = selectedCount > 0;

  const whiteboardBody = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        flex: 1,
        overflow: 'hidden',
        backgroundColor: 'background.paper',
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
            Lousa de Raciocínio {isFullscreen && '(Tela Cheia)'}
          </Typography>
          <Tooltip title="Ver lista completa de atalhos de teclado (?)">
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              startIcon={<KeyboardIcon fontSize="small" />}
              onClick={() => setShortcutsDialogOpen(true)}
              sx={{
                fontSize: '0.7rem',
                height: 22,
                px: 1,
                py: 0,
                textTransform: 'none',
                fontWeight: 600,
                borderColor: 'divider',
              }}
            >
              Atalhos (?)
            </Button>
          </Tooltip>
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

          {isFullscreen ? (
            <Tooltip title="Sair do modo Tela Cheia (Esc)">
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                startIcon={<FullscreenExitIcon />}
                onClick={() => setIsFullscreen(false)}
                sx={{
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  py: 0.5,
                  textTransform: 'none',
                }}
              >
                Sair
              </Button>
            </Tooltip>
          ) : (
            <Tooltip title="Expandir lousa em Tela Cheia">
              <Button
                size="small"
                variant="outlined"
                startIcon={<FullscreenIcon />}
                onClick={() => setIsFullscreen(true)}
                sx={{
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  py: 0.5,
                  textTransform: 'none',
                }}
              >
                Tela Cheia
              </Button>
            </Tooltip>
          )}
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
                setSelectedIds(new Set());
              }
            }
          }}
          aria-label="ferramenta de desenho"
        >
          <ToggleButton value="select" aria-label="cursor comum e seleção">
            <Tooltip title="Cursor Comum e Seleção (V ou 1)">
              <NearMeIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>

          <ToggleButton value="pan" aria-label="navegação e arrasto da lousa">
            <Tooltip title="Navegação / Mover Lousa (H ou 2)">
              <PanToolIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>

          <ToggleButton value="brush" aria-label="pincel livre">
            <Tooltip title="Pincel Livre (B ou 3)">
              <BrushIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>

          <ToggleButton value="rectangle" aria-label="retângulo">
            <Tooltip title="Retângulo (R ou 6)">
              <CropSquareIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>

          <ToggleButton value="square" aria-label="quadrado">
            <Tooltip title="Quadrado (S ou 7)">
              <SquareIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>

          <ToggleButton value="triangle" aria-label="triângulo">
            <Tooltip title="Triângulo (G ou 9)">
              <ChangeHistoryIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>

          <ToggleButton value="star" aria-label="estrela">
            <Tooltip title="Estrela de 5 pontas (X ou 0)">
              <StarBorderIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>

          <ToggleButton value="circle" aria-label="bola / círculo">
            <Tooltip title="Bola / Círculo (C ou 8)">
              <RadioButtonUncheckedIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>

          <ToggleButton value="text" aria-label="texto">
            <Tooltip title="Adicionar Texto (T ou 5) — clique duplo para editar">
              <TextFieldsIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>

          <ToggleButton value="eraser" aria-label="borracha">
            <Tooltip title="Borracha (E ou 4)">
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

          <Tooltip title="Desfazer (Ctrl+Z)">
            <span>
              <IconButton size="small" onClick={handleUndo} disabled={undoStack.length === 0}>
                <UndoIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Refazer (Ctrl+Y ou Ctrl+Shift+Z)">
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

      {/* Canvas Area with Clipping */}
      <Box
        ref={containerRef}
        sx={{
          position: 'relative',
          width: '100%',
          height: isFullscreen ? '100%' : 520,
          flex: isFullscreen ? '1 1 0px' : undefined,
          minHeight: isFullscreen ? 0 : 520,
          cursor: getCanvasCursor(),
          overflow: 'hidden',
          userSelect: 'none',
          touchAction: 'none',
          overscrollBehavior: 'contain',
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
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          onDoubleClick={handleDoubleClick}
        />

        {/* Barra de transformação flutuante — sobrepõe a lousa sem empurrá-la */}
        {hasSelection && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 20,
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 0.75,
              px: 1.5,
              py: 0.75,
              borderRadius: '4px',
              minWidth: 'max-content',
              backgroundColor: isDark ? 'rgba(22, 26, 32, 0.94)' : 'rgba(255, 255, 255, 0.94)',
              backdropFilter: 'blur(8px)',
              border: '1px solid',
              borderColor: isDark ? 'rgba(90, 166, 226, 0.35)' : 'rgba(90, 166, 226, 0.4)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
              pointerEvents: 'auto',
            }}
            // Impede que cliques na barra propaguem para o canvas e desfaçam a seleção
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, color: PALETTE_COLORS.secondary, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              {selectedCount === 1
                ? `(${selectedElements[0]?.type})`
                : `${selectedCount} obj.`}
            </Typography>

            <Tooltip title="Rotacionar 90° no sentido horário">
              <Button
                size="small"
                variant="outlined"
                startIcon={<RotateRightIcon fontSize="small" />}
                onClick={() => handleRotateSelected(90)}
                sx={{ textTransform: 'none', py: 0.3, fontSize: '0.75rem', whiteSpace: 'nowrap' }}
              >
                +90°
              </Button>
            </Tooltip>

            <Tooltip title="Inverter Horizontalmente">
              <Button
                size="small"
                variant="outlined"
                startIcon={<FlipIcon fontSize="small" />}
                onClick={() => handleFlipSelected('x')}
                sx={{ textTransform: 'none', py: 0.3, fontSize: '0.75rem', whiteSpace: 'nowrap' }}
              >
                Horiz.
              </Button>
            </Tooltip>

            <Tooltip title="Inverter Verticalmente">
              <Button
                size="small"
                variant="outlined"
                startIcon={<FlipIcon fontSize="small" sx={{ transform: 'rotate(90deg)' }} />}
                onClick={() => handleFlipSelected('y')}
                sx={{ textTransform: 'none', py: 0.3, fontSize: '0.75rem', whiteSpace: 'nowrap' }}
              >
                Vert.
              </Button>
            </Tooltip>

            <Tooltip title="Duplicar Objeto(s) (Ctrl+D)">
              <Button
                size="small"
                variant="outlined"
                startIcon={<ContentCopyIcon fontSize="small" />}
                onClick={handleDuplicateSelected}
                sx={{ textTransform: 'none', py: 0.3, fontSize: '0.75rem', whiteSpace: 'nowrap' }}
              >
                Duplicar
              </Button>
            </Tooltip>

            <Tooltip title="Excluir Objeto(s) Selecionado(s) (Delete ou Backspace)">
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<DeleteOutlineIcon fontSize="small" />}
                onClick={handleDeleteSelected}
                sx={{ textTransform: 'none', py: 0.3, fontSize: '0.75rem', whiteSpace: 'nowrap' }}
              >
                Excluir
              </Button>
            </Tooltip>
          </Box>
        )}

        {/* Inline Text Textarea sobreposto no canvas */}
        {inlineTextState && inlineTextScreenPos && (
          <textarea
            ref={inlineTextareaRef}
            value={inlineTextState.text}
            onChange={(ev) => setInlineTextState((prev) => prev ? { ...prev, text: ev.target.value } : prev)}
            onBlur={commitInlineText}
            onKeyDown={(ev) => {
              if (ev.key === 'Escape') {
                ev.preventDefault();
                setInlineTextState(null);
              } else if (ev.key === 'Enter' && !ev.shiftKey) {
                ev.preventDefault();
                commitInlineText();
              }
            }}
            style={{
              position: 'absolute',
              left: inlineTextScreenPos.left,
              top: inlineTextScreenPos.top,
              fontSize: `${inlineTextScreenPos.fontSize}px`,
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              color: inlineTextState.color,
              background: 'transparent',
              border: `1px dashed ${inlineTextState.color}`,
              borderRadius: 3,
              outline: 'none',
              resize: 'none',
              padding: '2px 4px',
              minWidth: 80,
              minHeight: inlineTextScreenPos.fontSize + 8,
              lineHeight: 1.2,
              zIndex: 10,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              caretColor: inlineTextState.color,
            }}
            rows={1}
          />
        )}
      </Box>

      {/* Modal de Lista de Atalhos de Teclado */}
      <Dialog
        open={shortcutsDialogOpen}
        onClose={() => setShortcutsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: isDark ? '#1a1e24' : '#ffffff',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <KeyboardIcon sx={{ color: PALETTE_COLORS.primary }} />
            <span>Atalhos de Teclado da Lousa</span>
          </Stack>
          <Chip label="Dica: pressione '?' para abrir" size="small" variant="outlined" sx={{ fontSize: '0.75rem' }} />
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2.5 }}>
          <Stack spacing={2.5}>
            {/* Seção 1: Ferramentas e Desenho */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: PALETTE_COLORS.primary }}>
                Ferramentas e Desenho
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableBody>
                    {[
                      { action: 'Cursor Comum e Seleção', keys: ['V', '1'] },
                      { action: 'Navegação / Mover Lousa (Mãozinha)', keys: ['H', '2'] },
                      { action: 'Pincel Livre', keys: ['B', '3'] },
                      { action: 'Borracha', keys: ['E', '4'] },
                      { action: 'Inserir Texto (clique na lousa)', keys: ['T', '5'] },
                      { action: 'Retângulo', keys: ['R', '6'] },
                      { action: 'Quadrado', keys: ['S', '7'] },
                      { action: 'Círculo / Bola', keys: ['C', '8'] },
                      { action: 'Triângulo', keys: ['G', '9'] },
                      { action: 'Estrela (5 pontas)', keys: ['X', '0'] },
                    ].map((row) => (
                      <TableRow key={row.action}>
                        <TableCell sx={{ py: 0.8, fontSize: '0.85rem' }}>{row.action}</TableCell>
                        <TableCell align="right" sx={{ py: 0.8 }}>
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            {row.keys.map((k) => (
                              <Chip
                                key={k}
                                label={k}
                                size="small"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                  height: 22,
                                  minWidth: 24,
                                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                }}
                              />
                            ))}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {/* Seção 2: Edição e Manipulação */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: PALETTE_COLORS.secondary }}>
                Edição de Objetos e Histórico
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableBody>
                    {[
                      { action: 'Selecionar todos os objetos', keys: ['Ctrl + A'] },
                      { action: 'Adicionar à seleção (Shift+clique)', keys: ['Shift + Clique'] },
                      { action: 'Selecionar por área (rubber-band)', keys: ['Arrastar em área vazia'] },
                      { action: 'Editar texto (duplo clique)', keys: ['Duplo Clique'] },
                      { action: 'Excluir objeto(s) selecionado(s)', keys: ['Delete', 'Backspace'] },
                      { action: 'Duplicar objeto(s) selecionado(s)', keys: ['Ctrl + D'] },
                      { action: 'Desfazer ação (Undo)', keys: ['Ctrl + Z'] },
                      { action: 'Refazer ação (Redo)', keys: ['Ctrl + Y', 'Ctrl + Shift + Z'] },
                      { action: 'Desmarcar seleção / Fechar modal', keys: ['Esc'] },
                    ].map((row) => (
                      <TableRow key={row.action}>
                        <TableCell sx={{ py: 0.8, fontSize: '0.85rem' }}>{row.action}</TableCell>
                        <TableCell align="right" sx={{ py: 0.8 }}>
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            {row.keys.map((k) => (
                              <Chip
                                key={k}
                                label={k}
                                size="small"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                  height: 22,
                                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                }}
                              />
                            ))}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {/* Seção 3: Navegação e Ajustes */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: PALETTE_COLORS.success }}>
                Navegação e Ajuste Fino
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableBody>
                    {[
                      { action: 'Ajuste fino de posição (Nudge)', keys: ['↑', '↓', '←', '→ (2px)'] },
                      { action: 'Deslocamento rápido de posição', keys: ['Shift + Setas (10px)'] },
                      { action: 'Zoom focado no cursor', keys: ['Scroll do mouse'] },
                      { action: 'Girar objeto livremente (1 selecionado)', keys: ['Arrastar manipulador superior'] },
                      { action: 'Redimensionar elemento(s)', keys: ['Arrastar alças de resize'] },
                    ].map((row) => (
                      <TableRow key={row.action}>
                        <TableCell sx={{ py: 0.8, fontSize: '0.85rem' }}>{row.action}</TableCell>
                        <TableCell align="right" sx={{ py: 0.8 }}>
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            {row.keys.map((k) => (
                              <Chip
                                key={k}
                                label={k}
                                size="small"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                  height: 22,
                                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                }}
                              />
                            ))}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setShortcutsDialogOpen(false)}
            sx={{ fontWeight: 700, textTransform: 'none' }}
          >
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  return (
    <>
      {isFullscreen && (
        <Paper
          elevation={1}
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 3,
            border: '1px dashed',
            borderColor: PALETTE_COLORS.primary,
            backgroundColor: isDark ? 'rgba(255, 230, 0, 0.03)' : 'rgba(255, 230, 0, 0.05)',
            mb: 4,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
            A Lousa de Raciocínio está aberta em Tela Cheia
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Pressione Esc ou clique no botão 'Sair' no canto superior direito para retornar.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<FullscreenExitIcon />}
            onClick={() => setIsFullscreen(false)}
            sx={{ fontWeight: 700, textTransform: 'none' }}
          >
            Sair da Tela Cheia
          </Button>
        </Paper>
      )}

      <Paper
        elevation={isFullscreen ? 24 : 3}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: 'background.paper',
          ...(isFullscreen
            ? {
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 1400,
                borderRadius: 0,
                border: 'none',
                m: 0,
              }
            : {
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                mb: 4,
              }),
        }}
      >
        {whiteboardBody}
      </Paper>
    </>
  );
};
