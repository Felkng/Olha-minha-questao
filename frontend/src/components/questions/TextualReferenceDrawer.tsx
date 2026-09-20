import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  Tooltip,
  Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import BorderColorIcon from '@mui/icons-material/BorderColor';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatClearIcon from '@mui/icons-material/FormatClear';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { TextualReference } from '../../types';
import { PALETTE_COLORS } from '../../theme/theme';
import { useAppTheme } from '../../theme/ThemeContext';

export interface TextAnnotation {
  id: string;
  start: number;
  end: number;
  type: 'highlight' | 'underline';
}

interface TextualReferenceDrawerProps {
  open: boolean;
  onClose: () => void;
  reference: TextualReference | null;
  questionIdentifier?: string;
}

export const TextualReferenceDrawer: React.FC<TextualReferenceDrawerProps> = ({
  open,
  onClose,
  reference,
  questionIdentifier,
}) => {
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';

  const [annotations, setAnnotations] = useState<TextAnnotation[]>([]);
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number; text: string } | null>(null);
  const [floatingMenuPos, setFloatingMenuPos] = useState<{ top: number; left: number } | null>(null);

  const textContainerRef = useRef<HTMLDivElement>(null);

  // Storage key based on reference ID or title
  const storageKey = useMemo(() => {
    if (!reference) return null;
    const identifier = reference.id ? `id_${reference.id}` : `title_${encodeURIComponent(reference.title || 'ref')}`;
    return `textual_ref_annotations_${identifier}`;
  }, [reference]);

  // Load annotations from localStorage when reference changes or drawer opens
  useEffect(() => {
    if (!open || !storageKey) {
      setAnnotations([]);
      setSelectedRange(null);
      setFloatingMenuPos(null);
      return;
    }

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setAnnotations(parsed);
        }
      } else {
        setAnnotations([]);
      }
    } catch (err) {
      console.error('Erro ao carregar anotações do localStorage:', err);
      setAnnotations([]);
    }
    setSelectedRange(null);
    setFloatingMenuPos(null);
  }, [open, storageKey]);

  // Save annotations to localStorage
  const saveAnnotations = (newAnnotations: TextAnnotation[]) => {
    setAnnotations(newAnnotations);
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(newAnnotations));
      } catch (err) {
        console.error('Erro ao salvar anotações no localStorage:', err);
      }
    }
  };

  // Helper to calculate character offset within the text container
  const getSelectionCharacterOffsets = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !textContainerRef.current) return null;

    const range = sel.getRangeAt(0);
    const container = textContainerRef.current;

    // Verify selection is within our container
    if (!container.contains(range.commonAncestorContainer)) return null;

    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(container);
    preCaretRange.setEnd(range.startContainer, range.startOffset);
    const start = preCaretRange.toString().length;
    const text = range.toString();
    const end = start + text.length;

    if (start === end || text.trim().length === 0) return null;

    // Get position for floating toolbar
    const rect = range.getBoundingClientRect();
    return {
      start,
      end,
      text,
      rect: {
        top: rect.top - 50,
        left: rect.left + rect.width / 2,
      },
    };
  };

  const handleMouseUp = () => {
    const selInfo = getSelectionCharacterOffsets();
    if (selInfo) {
      setSelectedRange({ start: selInfo.start, end: selInfo.end, text: selInfo.text });
      setFloatingMenuPos({
        top: Math.max(10, selInfo.rect.top),
        left: selInfo.rect.left,
      });
    } else {
      setSelectedRange(null);
      setFloatingMenuPos(null);
    }
  };

  const applyAnnotation = (type: 'highlight' | 'underline') => {
    if (!selectedRange) return;

    const newAnnotation: TextAnnotation = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      start: Math.min(selectedRange.start, selectedRange.end),
      end: Math.max(selectedRange.start, selectedRange.end),
      type,
    };

    // Remove overlapping annotations of same type or merge
    const updated = [...annotations, newAnnotation];
    saveAnnotations(updated);

    // Clear selection
    window.getSelection()?.removeAllRanges();
    setSelectedRange(null);
    setFloatingMenuPos(null);
  };

  const removeAnnotationsInRange = () => {
    if (!selectedRange) return;
    const selStart = Math.min(selectedRange.start, selectedRange.end);
    const selEnd = Math.max(selectedRange.start, selectedRange.end);

    const filtered = annotations.filter((a) => {
      // Check if annotation overlaps with selection
      const overlaps = Math.max(a.start, selStart) < Math.min(a.end, selEnd);
      return !overlaps;
    });

    saveAnnotations(filtered);
    window.getSelection()?.removeAllRanges();
    setSelectedRange(null);
    setFloatingMenuPos(null);
  };

  const clearAllAnnotations = () => {
    saveAnnotations([]);
    setSelectedRange(null);
    setFloatingMenuPos(null);
  };

  // Render text with annotations using an interval-slicing algorithm
  const renderedText = useMemo(() => {
    const rawContent = reference?.content || '';
    if (!rawContent) return null;

    if (annotations.length === 0) {
      return (
        <Typography
          variant="body1"
          sx={{
            lineHeight: 1.85,
            fontSize: '1rem',
            whiteSpace: 'pre-line',
            color: 'text.primary',
            userSelect: 'text',
          }}
        >
          {rawContent}
        </Typography>
      );
    }

    // Collect all boundary points
    const pointsSet = new Set<number>([0, rawContent.length]);
    annotations.forEach((a) => {
      if (a.start >= 0 && a.start <= rawContent.length) pointsSet.add(a.start);
      if (a.end >= 0 && a.end <= rawContent.length) pointsSet.add(a.end);
    });

    const points = Array.from(pointsSet).sort((a, b) => a - b);
    const slices: { text: string; isHighlight: boolean; isUnderline: boolean; key: string }[] = [];

    for (let i = 0; i < points.length - 1; i++) {
      const pStart = points[i];
      const pEnd = points[i + 1];
      const sliceText = rawContent.slice(pStart, pEnd);

      // Check active annotations for this interval
      const activeAnns = annotations.filter((a) => a.start <= pStart && a.end >= pEnd);
      const isHighlight = activeAnns.some((a) => a.type === 'highlight');
      const isUnderline = activeAnns.some((a) => a.type === 'underline');

      slices.push({
        text: sliceText,
        isHighlight,
        isUnderline,
        key: `slice_${pStart}_${pEnd}`,
      });
    }

    return (
      <Typography
        component="div"
        variant="body1"
        sx={{
          lineHeight: 1.85,
          fontSize: '1rem',
          whiteSpace: 'pre-line',
          color: 'text.primary',
          userSelect: 'text',
        }}
      >
        {slices.map((s) => {
          let style: React.CSSProperties = {};
          if (s.isHighlight) {
            style.backgroundColor = isDark ? 'rgba(255, 230, 0, 0.35)' : 'rgba(255, 230, 0, 0.45)';
            style.borderRadius = '3px';
            style.padding = '1px 2px';
          }
          if (s.isUnderline) {
            style.textDecoration = 'underline';
            style.textDecorationThickness = '2.5px';
            style.textDecorationColor = PALETTE_COLORS.secondary;
          }

          return (
            <span key={s.key} style={style}>
              {s.text}
            </span>
          );
        })}
      </Typography>
    );
  }, [reference?.content, annotations, isDark]);

  const handleScroll = () => {
    if (floatingMenuPos) {
      setFloatingMenuPos(null);
      setSelectedRange(null);
    }
  };

  if (!reference) return null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100vw', sm: 540, md: 640 },
          backgroundColor: isDark ? '#1a1e24' : '#ffffff',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
        },
      }}
    >
      {/* 1. Fixed Header Section */}
      <Box sx={{ p: { xs: 2.5, md: 3 }, pb: 1.5, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <MenuBookIcon sx={{ color: PALETTE_COLORS.primary, fontSize: '1.6rem' }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                Texto de Apoio
              </Typography>
              {questionIdentifier && (
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Referenciado na Questão {questionIdentifier}
                </Typography>
              )}
            </Box>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        {/* Toolbar / Actions Bar */}
        <Paper
          elevation={0}
          sx={{
            p: 1.25,
            px: 1.5,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            💡 <strong>Dica:</strong> Selecione um trecho com o mouse para destacar ou sublinhar.
          </Typography>

          {annotations.length > 0 && (
            <Tooltip title="Remover todos os destaques e sublinhados deste texto">
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                startIcon={<DeleteOutlineIcon sx={{ fontSize: '1rem' }} />}
                onClick={clearAllAnnotations}
                sx={{
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  py: 0.25,
                  px: 1.2,
                  borderRadius: 1.5,
                  borderColor: 'divider',
                }}
              >
                Limpar Anotações ({annotations.length})
              </Button>
            </Tooltip>
          )}
        </Paper>
      </Box>

      {/* Floating Toolbar upon text selection */}
      {floatingMenuPos && selectedRange && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            top: floatingMenuPos.top,
            left: Math.max(10, Math.min(window.innerWidth - 260, floatingMenuPos.left - 120)),
            zIndex: 1500,
            p: 0.5,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            backgroundColor: isDark ? '#262d37' : '#ffffff',
            border: `1.5px solid ${PALETTE_COLORS.primary}`,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}
        >
          <Tooltip title="Destacar (Marca-texto)">
            <IconButton
              size="small"
              onClick={() => applyAnnotation('highlight')}
              sx={{
                color: isDark ? '#ffe600' : '#b89400',
                '&:hover': { backgroundColor: 'rgba(255, 230, 0, 0.15)' },
              }}
            >
              <BorderColorIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Sublinhar">
            <IconButton
              size="small"
              onClick={() => applyAnnotation('underline')}
              sx={{
                color: PALETTE_COLORS.secondary,
                '&:hover': { backgroundColor: 'rgba(90, 166, 226, 0.15)' },
              }}
            >
              <FormatUnderlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Remover anotações do trecho">
            <IconButton
              size="small"
              onClick={removeAnnotationsInRange}
              sx={{
                color: 'text.secondary',
                '&:hover': { color: PALETTE_COLORS.danger },
              }}
            >
              <FormatClearIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Paper>
      )}

      {/* 2. Scrollable Content Body */}
      <Box
        onScroll={handleScroll}
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: { xs: 2.5, md: 3 },
          py: 1,
        }}
      >
        {/* Reference Title & Subtitle */}
        {reference.title && (
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5, color: 'text.primary' }}>
            {reference.title}
          </Typography>
        )}

        {reference.subtitle && (
          <Typography
            variant="subtitle1"
            sx={{
              fontStyle: 'italic',
              fontWeight: 600,
              color: 'text.secondary',
              mb: 1.5,
            }}
          >
            {reference.subtitle}
          </Typography>
        )}

        {reference.caption && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              fontWeight: 600,
              color: PALETTE_COLORS.secondary,
              mb: 2,
            }}
          >
            {reference.caption}
          </Typography>
        )}

        {/* Reference Content Area - fully wraps 100% of text without overflowing */}
        <Box
          ref={textContainerRef}
          onMouseUp={handleMouseUp}
          sx={{
            mb: 2.5,
            p: 2.5,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)',
            cursor: 'text',
          }}
        >
          {renderedText}
        </Box>

        {/* Reference Footer: Author & Source */}
        {(reference.author || reference.reference || reference.source) && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
            }}
          >
            {reference.author && (
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                <strong>Autor:</strong> {reference.author}
              </Typography>
            )}

            {(reference.reference || reference.source) && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                <strong>Fonte:</strong>{' '}
                {(() => {
                  const url = reference.reference || reference.source || '';
                  if (url.startsWith('http://') || url.startsWith('https://')) {
                    return (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: PALETTE_COLORS.secondary,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          wordBreak: 'break-all',
                        }}
                      >
                        {url} <OpenInNewIcon sx={{ fontSize: '0.85rem' }} />
                      </a>
                    );
                  }
                  return url;
                })()}
              </Typography>
            )}
          </Paper>
        )}
      </Box>

      {/* 3. Docked Bottom Footer (Separated by border, never overlaps text) */}
      <Box
        sx={{
          p: { xs: 2, md: 2.5 },
          borderTop: '1px solid',
          borderColor: 'divider',
          backgroundColor: isDark ? '#1a1e24' : '#ffffff',
          flexShrink: 0,
          textAlign: 'right',
        }}
      >
        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            fontWeight: 700,
            borderRadius: 2,
            px: 3.5,
            py: 1,
            backgroundColor: isDark ? PALETTE_COLORS.primary : undefined,
            color: isDark ? '#1a1e24' : undefined,
          }}
        >
          Fechar Leitura
        </Button>
      </Box>
    </Drawer>
  );
};
