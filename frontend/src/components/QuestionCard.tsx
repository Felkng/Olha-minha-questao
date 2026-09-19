import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  Radio,
  Alert,
  Stack,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { Question } from '../types';
import { PALETTE_COLORS } from '../theme/theme';
import { useAppTheme } from '../theme/ThemeContext';

interface QuestionCardProps {
  question: Question;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question }) => {
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';

  const [selectedAlternativeId, setSelectedAlternativeId] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);

  // Determina se a alternativa selecionada está correta
  const isCorrectAnswer = Boolean(
    selectedAlternativeId &&
      question.alternatives.find((a) => a.id === selectedAlternativeId)?.isCorrect
  );

  const handleSelect = (id?: number) => {
    if (isAnswered || id === undefined) return;
    setSelectedAlternativeId(id);
  };

  const handleVerify = () => {
    if (selectedAlternativeId !== null) {
      setIsAnswered(true);
    }
  };

  const handleReset = () => {
    setSelectedAlternativeId(null);
    setIsAnswered(false);
  };

  return (
    <Paper
      elevation={4}
      sx={{
        p: { xs: 2.5, md: 3.5 },
        mb: 3,
        transition: 'all 0.2s ease-in-out',
        position: 'relative',
      }}
    >
      {/* Header: Identifier and Metadata Chips */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          mb: 2,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          {/* Question Identifier Badge */}
          <Chip
            label={`Questão ${question.identifier}`}
            sx={{
              backgroundColor: PALETTE_COLORS.primary,
              color: '#1a1e24',
              fontWeight: 700,
              fontSize: '0.85rem',
              height: 28,
            }}
          />

          {question.originName && (
            <Chip
              label={question.originName}
              variant="outlined"
              size="small"
              sx={{
                borderColor: PALETTE_COLORS.secondary,
                color: PALETTE_COLORS.secondary,
                fontWeight: 600,
              }}
            />
          )}

          {question.year && (
            <Chip
              label={question.year}
              variant="outlined"
              size="small"
              sx={{ borderColor: 'divider', color: 'text.secondary' }}
            />
          )}

          {question.areaName && (
            <Chip
              label={question.areaName}
              size="small"
              sx={{
                backgroundColor: isDark ? 'rgba(90, 166, 226, 0.15)' : 'rgba(90, 166, 226, 0.1)',
                color: PALETTE_COLORS.secondary,
                fontWeight: 500,
              }}
            />
          )}

          {question.testName && (
            <Chip
              label={question.testName}
              size="small"
              sx={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                color: 'text.secondary',
              }}
            />
          )}
        </Stack>

        {/* Actions: Bookmark and Share */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title={isBookmarked ? 'Remover dos favoritos' : 'Salvar questão'}>
            <IconButton size="small" onClick={() => setIsBookmarked(!isBookmarked)}>
              {isBookmarked ? (
                <BookmarkIcon fontSize="small" sx={{ color: PALETTE_COLORS.primary }} />
              ) : (
                <BookmarkBorderIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              )}
            </IconButton>
          </Tooltip>
          <Tooltip title="Compartilhar questão">
            <IconButton size="small">
              <ShareOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Question Statement (Enunciado) */}
      <Typography
        variant="body1"
        sx={{
          fontSize: '1.05rem',
          lineHeight: 1.7,
          color: 'text.primary',
          mb: 3,
          fontWeight: 400,
        }}
      >
        {question.enunciado}
      </Typography>

      <Divider sx={{ mb: 2.5 }} />

      {/* Alternatives List */}
      <Stack spacing={1.5} sx={{ mb: 3 }}>
        {question.alternatives.map((alt) => {
          const isSelected = selectedAlternativeId === alt.id;
          const isCorrect = Boolean(alt.isCorrect);

          // Cores condicionais pós-resposta (sem gradientes)
          let borderColor = 'divider';
          let backgroundColor = 'transparent';
          let letterBg = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';
          let letterColor = 'text.primary';

          if (!isAnswered) {
            if (isSelected) {
              borderColor = PALETTE_COLORS.primary;
              backgroundColor = isDark ? 'rgba(217, 183, 99, 0.1)' : 'rgba(217, 183, 99, 0.12)';
              letterBg = PALETTE_COLORS.primary;
              letterColor = '#1a1e24';
            }
          } else {
            if (isCorrect) {
              // Alternativa correta destacada com success (#4bf151)
              borderColor = PALETTE_COLORS.success;
              backgroundColor = isDark ? 'rgba(75, 241, 81, 0.12)' : 'rgba(75, 241, 81, 0.15)';
              letterBg = PALETTE_COLORS.success;
              letterColor = '#0f2910';
            } else if (isSelected && !isCorrect) {
              // Seleção incorreta destacada com danger (#fa424b)
              borderColor = PALETTE_COLORS.danger;
              backgroundColor = isDark ? 'rgba(250, 66, 75, 0.12)' : 'rgba(250, 66, 75, 0.15)';
              letterBg = PALETTE_COLORS.danger;
              letterColor = '#ffffff';
            }
          }

          return (
            <Box
              key={alt.id ?? alt.identifier}
              onClick={() => handleSelect(alt.id)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: 1.5,
                px: 2,
                borderRadius: 2.5,
                border: '1.5px solid',
                borderColor,
                backgroundColor,
                cursor: isAnswered ? 'default' : 'pointer',
                transition: 'all 0.15s ease-in-out',
                '&:hover': {
                  borderColor: isAnswered ? borderColor : PALETTE_COLORS.primary,
                  backgroundColor: isAnswered
                    ? backgroundColor
                    : isDark
                    ? 'rgba(255, 255, 255, 0.03)'
                    : 'rgba(0, 0, 0, 0.02)',
                },
              }}
            >
              {/* Radio Indicator */}
              <Radio
                checked={isSelected}
                disabled={isAnswered}
                size="small"
                sx={{
                  mr: 1,
                  p: 0.5,
                  color: isAnswered && isCorrect ? PALETTE_COLORS.success : undefined,
                  '&.Mui-checked': {
                    color: isAnswered
                      ? isCorrect
                        ? PALETTE_COLORS.success
                        : PALETTE_COLORS.danger
                      : PALETTE_COLORS.primary,
                  },
                }}
              />

              {/* Letter identifier badge */}
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: 1.5,
                  backgroundColor: letterBg,
                  color: letterColor,
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                {alt.identifier}
              </Box>

              {/* Alternative Text */}
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.95rem',
                  color: 'text.primary',
                  flexGrow: 1,
                  lineHeight: 1.5,
                }}
              >
                {alt.text}
              </Typography>

              {/* Post-answer feedback icon */}
              {isAnswered && isCorrect && (
                <CheckCircleOutlineIcon sx={{ color: PALETTE_COLORS.success, ml: 1 }} />
              )}
              {isAnswered && isSelected && !isCorrect && (
                <HighlightOffIcon sx={{ color: PALETTE_COLORS.danger, ml: 1 }} />
              )}
            </Box>
          );
        })}
      </Stack>

      {/* Answer feedback banner */}
      {isAnswered && (
        <Alert
          severity={isCorrectAnswer ? 'success' : 'error'}
          icon={isCorrectAnswer ? <CheckCircleOutlineIcon /> : <HighlightOffIcon />}
          sx={{
            mb: 2.5,
            borderRadius: 2,
            border: '1px solid',
            borderColor: isCorrectAnswer ? PALETTE_COLORS.success : PALETTE_COLORS.danger,
            backgroundColor: isDark
              ? isCorrectAnswer
                ? 'rgba(75, 241, 81, 0.1)'
                : 'rgba(250, 66, 75, 0.1)'
              : undefined,
          }}
        >
          {isCorrectAnswer ? (
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Parabéns! Você acertou a questão. A alternativa {question.correctAlternativeIdentifier} é a correta.
            </Typography>
          ) : (
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Resposta incorreta. A alternativa correta é a letra {question.correctAlternativeIdentifier}.
            </Typography>
          )}
        </Alert>
      )}

      {/* Footer Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
        {isAnswered ? (
          <Button
            variant="outlined"
            startIcon={<RestartAltIcon />}
            onClick={handleReset}
            sx={{ borderColor: 'divider', color: 'text.secondary' }}
          >
            Refazer Questão
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            disabled={selectedAlternativeId === null}
            onClick={handleVerify}
            sx={{
              px: 3,
              fontWeight: 700,
            }}
          >
            Responder
          </Button>
        )}
      </Box>
    </Paper>
  );
};
