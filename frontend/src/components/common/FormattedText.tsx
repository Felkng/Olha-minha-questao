import React, { useState } from 'react';
import { Box, Typography, IconButton, Tooltip, SxProps, Theme } from '@mui/material';
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

interface TextSegment {
  type: 'text' | 'code';
  content: string;
  language?: string;
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

  // Parse markdown code blocks ```lang\ncode\n```
  const segments: TextSegment[] = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const textChunk = text.substring(lastIndex, match.index);
      if (textChunk.trim()) {
        segments.push({ type: 'text', content: textChunk });
      }
    }
    segments.push({
      type: 'code',
      language: match[1] || undefined,
      content: match[2].replace(/\n+$/, ''),
    });
    lastIndex = codeBlockRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    const textChunk = text.substring(lastIndex);
    if (textChunk.trim()) {
      segments.push({ type: 'text', content: textChunk });
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
              {/* Code Header with language and copy button */}
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

              {/* Code Content */}
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
