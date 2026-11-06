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
import { ZoomableImage } from './ZoomableImage';

export interface FormattedTextProps {
  text: string;
  fontSize?: string | number;
  lineHeight?: string | number;
  fontWeight?: string | number;
  color?: string;
  inline?: boolean;
  renderInlineImages?: boolean;
  hideInlineImages?: boolean;
  sx?: SxProps<Theme>;
}

export interface RichTextStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  code?: boolean;
  sup?: boolean;
  sub?: boolean;
  mark?: boolean;
}

export interface RichTextLeaf extends RichTextStyle {
  text: string;
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

const ALLOWED_HTML_TAGS = new Set([
  'u',
  'ins',
  'b',
  'strong',
  'i',
  'em',
  's',
  'del',
  'strike',
  'sup',
  'sub',
  'mark',
  'code',
]);

const INLINE_IMAGE_REGEX = /!\s*\[([^\]]*)\]\((data:image\/[^)]+|https?:\/\/[^)\s]+|\/[^)\s]+)\)/g;

/**
 * Remove marcações Markdown e HTML inline para exibição em resumos curtos / prévias truncadas.
 */
export function stripRichTextMarkup(rawText?: string | null): string {
  if (!rawText) return '';
  return rawText
    .replace(/```[a-zA-Z0-9_-]*\n([\s\S]*?)```/g, '$1')
    .replace(INLINE_IMAGE_REGEX, (_, alt) => (alt ? `[${alt}]` : ''))
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?(u|ins|b|strong|i|em|s|del|strike|sup|sub|mark|code)\b[^>]*>/gi, '')
    .replace(/\*\*\*(?!\s)([\s\S]+?)(?<!\s)\*\*\*/g, '$1')
    .replace(/\*\*(?!\s)([\s\S]+?)(?<!\s)\*\*/g, '$1')
    .replace(/(^|[^\w])__(?!\s)([\s\S]+?)(?<!\s)__(?![\w])/g, '$1$2')
    .replace(/\*(?!\s|\*)([^*\n]+?)(?<!\s|\*)\*/g, '$1')
    .replace(/(^|[^\w])_(?!\s|_)([^_\n]+?)(?<!\s|_)_(?![\w])/g, '$1$2')
    .replace(/~~(?!\s)([\s\S]+?)(?<!\s)~~/g, '$1')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

interface InlineTokenMatch {
  index: number;
  length: number;
  kind:
    | 'code'
    | 'br'
    | 'image'
    | 'boldItalic'
    | 'bold'
    | 'italic'
    | 'underline'
    | 'strike'
    | 'sup'
    | 'sub'
    | 'mark';
  inner?: string;
  alt?: string;
  src?: string;
}

function findMatchingHtmlClose(str: string, tagName: string, contentStart: number): { innerEnd: number; fullEnd: number } | null {
  const tagPattern = new RegExp(`<(\\/?)(${tagName})\\b[^>]*>`, 'gi');
  tagPattern.lastIndex = contentStart;
  let depth = 1;
  let m: RegExpExecArray | null;
  while ((m = tagPattern.exec(str)) !== null) {
    const isClosing = m[1] === '/';
    if (isClosing) {
      depth -= 1;
      if (depth === 0) {
        return { innerEnd: m.index, fullEnd: tagPattern.lastIndex };
      }
    } else if (!m[0].endsWith('/>')) {
      depth += 1;
    }
  }
  return null;
}

function htmlTagToKind(tag: string): InlineTokenMatch['kind'] {
  switch (tag.toLowerCase()) {
    case 'u':
    case 'ins':
      return 'underline';
    case 'b':
    case 'strong':
      return 'bold';
    case 'i':
    case 'em':
      return 'italic';
    case 's':
    case 'del':
    case 'strike':
      return 'strike';
    case 'sup':
      return 'sup';
    case 'sub':
      return 'sub';
    case 'mark':
      return 'mark';
    case 'code':
      return 'code';
    default:
      return 'bold';
  }
}

function findEarliestInlineToken(str: string, allowImages: boolean): InlineTokenMatch | null {
  let best: InlineTokenMatch | null = null;

  const consider = (candidate: InlineTokenMatch | null) => {
    if (!candidate) return;
    if (!best || candidate.index < best.index) {
      best = candidate;
    }
  };

  const getBestIndex = (): number => (best ? (best as InlineTokenMatch).index : Infinity);

  // 1. Inline backtick code `...`
  const codeMatch = /`([^`\n]+)`/.exec(str);
  if (codeMatch) {
    consider({
      index: codeMatch.index,
      length: codeMatch[0].length,
      kind: 'code',
      inner: codeMatch[1],
    });
  }

  // 2. <br> / <br/>
  const brMatch = /<br\s*\/?>/i.exec(str);
  if (brMatch) {
    consider({
      index: brMatch.index,
      length: brMatch[0].length,
      kind: 'br',
    });
  }

  // 3. Inline Markdown image ![alt](src)
  if (allowImages) {
    const imgRegex = /!\s*\[([^\]]*)\]\((data:image\/[^)]+|https?:\/\/[^)\s]+|\/[^)\s]+)\)/;
    const imgMatch = imgRegex.exec(str);
    if (imgMatch) {
      consider({
        index: imgMatch.index,
        length: imgMatch[0].length,
        kind: 'image',
        alt: imgMatch[1],
        src: imgMatch[2],
      });
    }
  }

  // 4. Allowed paired HTML inline tags: <u>, <b>, <strong>, <i>, <em>, <s>, <sup>, <sub>, <mark>, <code>
  const htmlOpenRegex = /<([a-zA-Z]+)\b[^>]*>/g;
  let htmlOpen: RegExpExecArray | null;
  while ((htmlOpen = htmlOpenRegex.exec(str)) !== null) {
    const tag = htmlOpen[1].toLowerCase();
    if (!ALLOWED_HTML_TAGS.has(tag)) continue;
    if (htmlOpen.index >= getBestIndex()) break;
    const closeInfo = findMatchingHtmlClose(str, tag, htmlOpenRegex.lastIndex);
    if (closeInfo) {
      consider({
        index: htmlOpen.index,
        length: closeInfo.fullEnd - htmlOpen.index,
        kind: htmlTagToKind(tag),
        inner: str.slice(htmlOpenRegex.lastIndex, closeInfo.innerEnd),
      });
      break;
    }
  }

  // 5. Bold + Italic ***...***
  const boldItalicMatch = /\*\*\*(?!\s)([\s\S]+?)(?<!\s)\*\*\*/.exec(str);
  if (boldItalicMatch) {
    consider({
      index: boldItalicMatch.index,
      length: boldItalicMatch[0].length,
      kind: 'boldItalic',
      inner: boldItalicMatch[1],
    });
  }

  // 6. Bold **...**
  const boldAstMatch = /\*\*(?!\s)([\s\S]+?)(?<!\s)\*\*/.exec(str);
  if (boldAstMatch) {
    consider({
      index: boldAstMatch.index,
      length: boldAstMatch[0].length,
      kind: 'bold',
      inner: boldAstMatch[1],
    });
  }

  // 7. Bold __...__ (word-boundary safe)
  const boldUndRegex = /__(?!\s)([\s\S]+?)(?<!\s)__(?![a-zA-Z0-9_])/g;
  let boldUnd: RegExpExecArray | null;
  while ((boldUnd = boldUndRegex.exec(str)) !== null) {
    if (boldUnd.index >= getBestIndex()) break;
    const prevChar = boldUnd.index > 0 ? str[boldUnd.index - 1] : '';
    if (!prevChar || !/[a-zA-Z0-9_]/.test(prevChar)) {
      consider({
        index: boldUnd.index,
        length: boldUnd[0].length,
        kind: 'bold',
        inner: boldUnd[1],
      });
      break;
    }
  }

  // 8. Italic *...*
  const italicAstRegex = /\*(?!\s|\*)([^*\n]+?)(?<!\s|\*)\*(?!\*)/g;
  let italicAst: RegExpExecArray | null;
  while ((italicAst = italicAstRegex.exec(str)) !== null) {
    if (italicAst.index >= getBestIndex()) break;
    const prevChar = italicAst.index > 0 ? str[italicAst.index - 1] : '';
    if (prevChar !== '*') {
      consider({
        index: italicAst.index,
        length: italicAst[0].length,
        kind: 'italic',
        inner: italicAst[1],
      });
      break;
    }
  }

  // 9. Italic _..._ (word-boundary safe so snake_case identifiers stay untouched)
  const italicUndRegex = /_(?!\s|_)([^_\n]+?)(?<!\s|_)_(?![a-zA-Z0-9_])/g;
  let italicUnd: RegExpExecArray | null;
  while ((italicUnd = italicUndRegex.exec(str)) !== null) {
    if (italicUnd.index >= getBestIndex()) break;
    const prevChar = italicUnd.index > 0 ? str[italicUnd.index - 1] : '';
    if (!prevChar || !/[a-zA-Z0-9_]/.test(prevChar)) {
      consider({
        index: italicUnd.index,
        length: italicUnd[0].length,
        kind: 'italic',
        inner: italicUnd[1],
      });
      break;
    }
  }

  // 10. Strikethrough ~~...~~
  const strikeMatch = /~~(?!\s)([\s\S]+?)(?<!\s)~~/.exec(str);
  if (strikeMatch) {
    consider({
      index: strikeMatch.index,
      length: strikeMatch[0].length,
      kind: 'strike',
      inner: strikeMatch[1],
    });
  }

  return best;
}

/**
 * Converte texto com Markdown/HTML inline em folhas planas com estilo acumulado.
 * Útil para componentes que aplicam seleção/grifo por offset de caractere (ex.: TextualReferenceDrawer).
 */
export function flattenRichTextLeaves(
  input: string,
  inheritedStyle: RichTextStyle = {},
  depth = 0
): RichTextLeaf[] {
  if (!input) return [];
  if (depth > 12) return [{ text: input, ...inheritedStyle }];

  const leaves: RichTextLeaf[] = [];
  let remaining = input;

  while (remaining.length > 0) {
    const token = findEarliestInlineToken(remaining, false);
    if (!token) {
      leaves.push({ text: remaining, ...inheritedStyle });
      break;
    }

    if (token.index > 0) {
      leaves.push({ text: remaining.slice(0, token.index), ...inheritedStyle });
    }

    if (token.kind === 'br') {
      leaves.push({ text: '\n', ...inheritedStyle });
    } else if (token.kind === 'code') {
      leaves.push({ text: token.inner || '', ...inheritedStyle, code: true });
    } else {
      const nextStyle: RichTextStyle = { ...inheritedStyle };
      if (token.kind === 'boldItalic') {
        nextStyle.bold = true;
        nextStyle.italic = true;
      } else if (token.kind === 'bold') {
        nextStyle.bold = true;
      } else if (token.kind === 'italic') {
        nextStyle.italic = true;
      } else if (token.kind === 'underline') {
        nextStyle.underline = true;
      } else if (token.kind === 'strike') {
        nextStyle.strike = true;
      } else if (token.kind === 'sup') {
        nextStyle.sup = true;
      } else if (token.kind === 'sub') {
        nextStyle.sub = true;
      } else if (token.kind === 'mark') {
        nextStyle.mark = true;
      }
      leaves.push(...flattenRichTextLeaves(token.inner || '', nextStyle, depth + 1));
    }

    remaining = remaining.slice(token.index + token.length);
  }

  return leaves;
}

function parseInlineRichText(
  input: string,
  options: { isDark: boolean; allowImages: boolean; inline: boolean },
  keyPrefix = 'rt',
  depth = 0
): React.ReactNode[] {
  if (!input) return [];
  if (depth > 12) return [input];

  const nodes: React.ReactNode[] = [];
  let remaining = input;
  let step = 0;

  while (remaining.length > 0) {
    const token = findEarliestInlineToken(remaining, options.allowImages);
    if (!token) {
      nodes.push(remaining);
      break;
    }

    if (token.index > 0) {
      nodes.push(remaining.slice(0, token.index));
    }

    const key = `${keyPrefix}_${step++}`;
    const children =
      token.inner !== undefined && token.kind !== 'code'
        ? parseInlineRichText(token.inner, options, key, depth + 1)
        : token.inner;

    switch (token.kind) {
      case 'br':
        nodes.push(<br key={key} />);
        break;
      case 'image':
        if (token.src) {
          nodes.push(
            <Box
              key={key}
              component="span"
              sx={{
                display: options.inline ? 'inline-flex' : 'flex',
                justifyContent: options.inline ? 'flex-start' : 'center',
                my: options.inline ? 0.5 : 1.5,
                maxWidth: '100%',
              }}
            >
              <ZoomableImage
                src={token.src}
                alt={token.alt || 'Figura'}
                maxHeight={options.inline ? 260 : 420}
              />
            </Box>
          );
        }
        break;
      case 'code':
        nodes.push(
          <Box
            key={key}
            component="code"
            sx={{
              fontFamily: '"Fira Code", "Consolas", "Courier New", monospace',
              fontSize: '0.9em',
              px: 0.6,
              py: 0.15,
              borderRadius: 1,
              backgroundColor: options.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
              border: '1px solid',
              borderColor: options.isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.1)',
            }}
          >
            {token.inner}
          </Box>
        );
        break;
      case 'boldItalic':
        nodes.push(
          <Box key={key} component="strong" sx={{ fontWeight: 700, fontStyle: 'italic' }}>
            {children}
          </Box>
        );
        break;
      case 'bold':
        nodes.push(
          <Box key={key} component="strong" sx={{ fontWeight: 700 }}>
            {children}
          </Box>
        );
        break;
      case 'italic':
        nodes.push(
          <Box key={key} component="em" sx={{ fontStyle: 'italic' }}>
            {children}
          </Box>
        );
        break;
      case 'underline':
        nodes.push(
          <Box
            key={key}
            component="u"
            sx={{
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
              textDecorationThickness: '1.5px',
            }}
          >
            {children}
          </Box>
        );
        break;
      case 'strike':
        nodes.push(
          <Box key={key} component="s" sx={{ textDecoration: 'line-through' }}>
            {children}
          </Box>
        );
        break;
      case 'sup':
        nodes.push(<sup key={key}>{children}</sup>);
        break;
      case 'sub':
        nodes.push(<sub key={key}>{children}</sub>);
        break;
      case 'mark':
        nodes.push(
          <Box
            key={key}
            component="mark"
            sx={{
              backgroundColor: options.isDark ? 'rgba(255, 230, 0, 0.28)' : 'rgba(255, 230, 0, 0.45)',
              color: 'inherit',
              px: 0.4,
              borderRadius: 0.5,
            }}
          >
            {children}
          </Box>
        );
        break;
    }

    remaining = remaining.slice(token.index + token.length);
  }

  return nodes;
}

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
  fontWeight,
  color = 'text.primary',
  inline = false,
  renderInlineImages = true,
  hideInlineImages = false,
  sx,
}) => {
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!text) return null;

  const processedInput = hideInlineImages
    ? text.replace(INLINE_IMAGE_REGEX, '').replace(/\n{3,}/g, '\n\n').trim()
    : text;

  if (!processedInput) return null;

  const inlineOptions = {
    isDark,
    allowImages: renderInlineImages && !hideInlineImages,
    inline,
  };

  if (inline && !processedInput.includes('```') && !processedInput.includes('\n|')) {
    return (
      <Typography
        component="span"
        sx={[
          {
            fontSize,
            lineHeight,
            fontWeight,
            color,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {parseInlineRichText(processedInput, inlineOptions, 'inl')}
      </Typography>
    );
  }

  // 1. Parse markdown code blocks ```lang\ncode\n```
  const rawSegments: ({ type: 'text'; content: string } | { type: 'code'; language?: string; content: string })[] = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(processedInput)) !== null) {
    if (match.index > lastIndex) {
      const textChunk = processedInput.substring(lastIndex, match.index);
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

  if (lastIndex < processedInput.length) {
    const textChunk = processedInput.substring(lastIndex);
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
    <Box sx={[{ display: 'flex', flexDirection: 'column', gap: inline ? 0.75 : 1.5 }, ...(Array.isArray(sx) ? sx : [sx])]}>
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
                        {parseInlineRichText(h, inlineOptions, `th_${idx}_${hIdx}`)}
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
                          {parseInlineRichText(cell, inlineOptions, `td_${idx}_${rIdx}_${cIdx}`)}
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
              fontWeight,
              color,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {parseInlineRichText(seg.content, inlineOptions, `p_${idx}`)}
          </Typography>
        );
      })}
    </Box>
  );
};
