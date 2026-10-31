import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  SxProps,
  Theme,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import { useAppTheme } from '../../theme/ThemeContext';

interface FormattedTextProps {
  text: string;
  fontSize?: string | number;
  lineHeight?: string | number;
  color?: string;
  sx?: SxProps<Theme>;
}

interface TableSegment {
  type: 'table';
  headers: string[];
  alignments: ('left' | 'center' | 'right')[];
  rows: string[][];
}

type ContentSegment =
  | { type: 'text'; content: string }
  | { type: 'code'; language?: string; content: string }
  | TableSegment;

function isSeparatorRow(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes('|')) return false;
  let inner = trimmed;
  if (inner.startsWith('|')) inner = inner.substring(1);
  if (inner.endsWith('|')) inner = inner.substring(0, inner.length - 1);
  const cells = inner.split('|').map((c) => c.trim());
  if (cells.length === 0) return false;
  return cells.every((c) => /^:?-+:?$/.test(c));
}

function parseCells(line: string): string[] {
  let inner = line.trim();
  if (inner.startsWith('|')) inner = inner.substring(1);
  if (inner.endsWith('|')) inner = inner.substring(0, inner.length - 1);
  return inner.split('|').map((c) => c.trim());
}

function parseTableBlock(lines: string[]): {
  headers: string[];
  alignments: ('left' | 'center' | 'right')[];
  rows: string[][];
} | null {
  const pipeLines = lines.filter((l) => l.trim().length > 0);
  if (pipeLines.length < 2) return null;

  let headerIndex = -1;
  let sepIndex = -1;
  for (let i = 0; i < pipeLines.length - 1; i++) {
    if (isSeparatorRow(pipeLines[i + 1])) {
      headerIndex = i;
      sepIndex = i + 1;
      break;
    }
  }
  if (sepIndex === -1) return null;

  const headers = parseCells(pipeLines[headerIndex]);
  const sepCells = parseCells(pipeLines[sepIndex]);
  const alignments: ('left' | 'center' | 'right')[] = headers.map((_, idx) => {
    const c = sepCells[idx] ? sepCells[idx].trim() : '';
    if (c.startsWith(':') && c.endsWith(':')) return 'center';
    if (c.endsWith(':')) return 'right';
    return 'left';
  });

  const rows: string[][] = [];
  for (let i = sepIndex + 1; i < pipeLines.length; i++) {
    const rowCells = parseCells(pipeLines[i]);
    if (rowCells.some((c) => c.length > 0)) {
      while (rowCells.length < headers.length) {
        rowCells.push('');
      }
      rows.push(rowCells);
    }
  }
  return { headers, alignments, rows };
}

function parseTextAndTables(rawText: string): (
  | { type: 'text'; content: string }
  | TableSegment
)[] {
  const lines = rawText.split('\n');
  const segments: (
    | { type: 'text'; content: string }
    | TableSegment
  )[] = [];
  let currentTextLines: string[] = [];
  let currentTableLines: string[] = [];
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isPipeLine = line.trim().startsWith('|') || (line.trim().includes('|') && line.trim().endsWith('|'));
    const isBlank = line.trim().length === 0;

    if (isPipeLine) {
      if (!inTable) {
        let lookAheadSep = false;
        for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
          if (isSeparatorRow(lines[j])) {
            lookAheadSep = true;
            break;
          }
          if (lines[j].trim().length > 0 && !lines[j].trim().includes('|')) break;
        }

        if (lookAheadSep) {
          if (currentTextLines.length > 0) {
            segments.push({ type: 'text', content: currentTextLines.join('\n') });
            currentTextLines = [];
          }
          inTable = true;
          currentTableLines = [line];
        } else {
          currentTextLines.push(line);
        }
      } else {
        currentTableLines.push(line);
      }
    } else if (isBlank && inTable) {
      let nextIsPipe = false;
      for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
        if (lines[j].trim().length > 0) {
          if (lines[j].trim().includes('|')) nextIsPipe = true;
          break;
        }
      }
      if (nextIsPipe) {
        currentTableLines.push(line);
      } else {
        const table = parseTableBlock(currentTableLines);
        if (table) {
          segments.push({ type: 'table', ...table });
        } else {
          segments.push({ type: 'text', content: currentTableLines.join('\n') });
        }
        currentTableLines = [];
        inTable = false;
      }
    } else {
      if (inTable) {
        const table = parseTableBlock(currentTableLines);
        if (table) {
          segments.push({ type: 'table', ...table });
        } else {
          segments.push({ type: 'text', content: currentTableLines.join('\n') });
        }
        currentTableLines = [];
        inTable = false;
      }
      currentTextLines.push(line);
    }
  }

  if (inTable && currentTableLines.length > 0) {
    const table = parseTableBlock(currentTableLines);
    if (table) {
      segments.push({ type: 'table', ...table });
    } else {
      currentTextLines.push(...currentTableLines);
    }
  }

  if (currentTextLines.length > 0) {
    segments.push({ type: 'text', content: currentTextLines.join('\n') });
  }

  return segments;
}

export const FormattedText: React.FC<FormattedTextProps> = ({
  text,
  fontSize = '1.05rem',
  lineHeight = 1.7,
  color = 'text.primary',
  sx,
}) => {
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!text) return null;

  // 1. Parse markdown code blocks ```lang\ncode\n```
  const rawSegments: ({ type: 'text'; content: string } | { type: 'code'; language?: string; content: string })[] = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const textChunk = text.substring(lastIndex, match.index);
      if (textChunk.trim()) {
        rawSegments.push({ type: 'text', content: textChunk });
      }
    }
    rawSegments.push({
      type: 'code',
      language: match[1] || undefined,
      content: match[2].replace(/\n+$/, ''),
    });
    lastIndex = codeBlockRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    const textChunk = text.substring(lastIndex);
    if (textChunk.trim()) {
      rawSegments.push({ type: 'text', content: textChunk });
    }
  }

  // 2. Further split text segments into text and markdown tables
  const segments: ContentSegment[] = [];
  for (const seg of rawSegments) {
    if (seg.type === 'code') {
      segments.push(seg);
    } else {
      const subSegments = parseTextAndTables(seg.content);
      segments.push(...subSegments);
    }
  }

  const handleCopy = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  return (
    <Box sx={[{ display: 'flex', flexDirection: 'column', gap: 1.5 }, ...(Array.isArray(sx) ? sx : [sx])]}>
      {segments.map((seg, idx) => {
        if (seg.type === 'code') {
          return (
            <Box
              key={idx}
              sx={{
                position: 'relative',
                borderRadius: 2,
                overflow: 'hidden',
                backgroundColor: isDark ? '#0d1117' : '#1e1e1e',
                color: '#e6edf3',
                border: '1px solid',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.2)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                my: 1,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  px: 2,
                  py: 0.75,
                  backgroundColor: isDark ? '#161b22' : '#2d333b',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    color: '#8b949e',
                  }}
                >
                  {seg.language || 'código'}
                </Typography>
                <Tooltip title={copiedIndex === idx ? 'Copiado!' : 'Copiar código'}>
                  <IconButton
                    size="small"
                    onClick={() => handleCopy(seg.content, idx)}
                    sx={{ color: '#8b949e', '&:hover': { color: '#ffffff' }, p: 0.5 }}
                  >
                    {copiedIndex === idx ? (
                      <CheckIcon sx={{ fontSize: 16, color: '#3fb950' }} />
                    ) : (
                      <ContentCopyIcon sx={{ fontSize: 16 }} />
                    )}
                  </IconButton>
                </Tooltip>
              </Box>

              <Box
                component="pre"
                sx={{
                  m: 0,
                  p: 2,
                  fontFamily: '"Fira Code", "Consolas", "Courier New", monospace',
                  fontSize: '0.92rem',
                  lineHeight: 1.6,
                  overflowX: 'auto',
                  whiteSpace: 'pre',
                }}
              >
                <code>{seg.content}</code>
              </Box>
            </Box>
          );
        }

        if (seg.type === 'table') {
          return (
            <TableContainer
              key={idx}
              component={Paper}
              variant="outlined"
              sx={{
                my: 1.5,
                borderRadius: 2,
                overflowX: 'auto',
                border: '1px solid',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.015)' : '#ffffff',
                boxShadow: 'none',
              }}
            >
              <Table size="small" sx={{ minWidth: 400 }}>
                <TableHead>
                  <TableRow
                    sx={{
                      backgroundColor: isDark ? 'rgba(217, 183, 99, 0.12)' : 'rgba(217, 183, 99, 0.08)',
                    }}
                  >
                    {seg.headers.map((h, hIdx) => (
                      <TableCell
                        key={hIdx}
                        align={seg.alignments[hIdx] || 'left'}
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          color: isDark ? '#f0f6fc' : '#1a1e24',
                          borderBottom: '1px solid',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
                          py: 1.2,
                          px: 1.5,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {seg.rows.map((row, rIdx) => (
                    <TableRow
                      key={rIdx}
                      sx={{
                        backgroundColor:
                          rIdx % 2 === 1
                            ? isDark
                              ? 'rgba(255, 255, 255, 0.025)'
                              : 'rgba(0, 0, 0, 0.02)'
                            : 'transparent',
                        '&:hover': {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.035)',
                        },
                      }}
                    >
                      {row.map((cell, cIdx) => (
                        <TableCell
                          key={cIdx}
                          align={seg.alignments[cIdx] || 'left'}
                          sx={{
                            fontSize: '0.88rem',
                            color: color,
                            py: 1,
                            px: 1.5,
                            borderBottom:
                              rIdx === seg.rows.length - 1
                                ? 'none'
                                : `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
                          }}
                        >
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          );
        }

        return (
          <Typography
            key={idx}
            component="div"
            sx={{
              fontSize,
              lineHeight,
              color,
              whiteSpace: 'pre-wrap',
            }}
          >
            {seg.content}
          </Typography>
        );
      })}
    </Box>
  );
};
