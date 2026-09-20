import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Tooltip,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { PALETTE_COLORS } from '../../theme/theme';
import { useAppTheme } from '../../theme/ThemeContext';

interface TestQuestionsNavigatorProps {
  totalQuestions: number;
  activeIndex: number;
  isQuestionAnswered: (index: number) => boolean;
  onSelectQuestion: (index: number) => void;
  questionIdentifiers?: (string | number)[];
  title?: string;
}

export const TestQuestionsNavigator: React.FC<TestQuestionsNavigatorProps> = ({
  totalQuestions,
  activeIndex,
  isQuestionAnswered,
  onSelectQuestion,
  questionIdentifiers,
  title = 'Navegador de Questões',
}) => {
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';

  // Calculate answered count
  let answeredCount = 0;
  for (let i = 0; i < totalQuestions; i++) {
    if (isQuestionAnswered(i)) {
      answeredCount++;
    }
  }
  const percentage = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return (
    <Paper
      elevation={3}
      sx={{
        p: { xs: 2, md: 2.5 },
        mb: 3,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: isDark ? '#1a1e24' : '#ffffff',
      }}
    >
      {/* Top Header with Title and Summary */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1.5,
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
            {title}
          </Typography>
          <Chip
            size="small"
            label={`${answeredCount} de ${totalQuestions} respondidas (${percentage}%)`}
            sx={{
              fontWeight: 700,
              backgroundColor: isDark ? 'rgba(217, 183, 99, 0.15)' : 'rgba(217, 183, 99, 0.2)',
              color: isDark ? PALETTE_COLORS.primary : '#7a7000',
              border: `1px solid ${PALETTE_COLORS.primary}`,
            }}
          />
        </Box>

        {/* Legend */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: PALETTE_COLORS.primary,
              }}
            />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Atual
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: isDark ? 'rgba(75, 241, 81, 0.2)' : 'rgba(75, 241, 81, 0.3)',
                border: `1.5px solid ${PALETTE_COLORS.success}`,
              }}
            />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Respondida
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                border: '1.5px solid',
                borderColor: 'divider',
                backgroundColor: 'transparent',
              }}
            />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Não respondida
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Grid of Question Buttons (Random Access) */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0.8,
          maxHeight: 220,
          overflowY: 'auto',
          pr: 0.5,
        }}
      >
        {Array.from({ length: totalQuestions }, (_, idx) => {
          const isAnswered = isQuestionAnswered(idx);
          const isCurrent = activeIndex === idx;
          const identifier = questionIdentifiers ? questionIdentifiers[idx] : idx + 1;

          let bgColor = 'transparent';
          let textColor = 'text.secondary';
          let borderCol = 'divider';

          if (isCurrent) {
            bgColor = PALETTE_COLORS.primary;
            textColor = '#1a1e24';
            borderCol = PALETTE_COLORS.primary;
          } else if (isAnswered) {
            bgColor = isDark ? 'rgba(75, 241, 81, 0.12)' : 'rgba(75, 241, 81, 0.15)';
            textColor = isDark ? PALETTE_COLORS.success : '#1e7e34';
            borderCol = PALETTE_COLORS.success;
          }

          return (
            <Tooltip
              key={idx}
              title={`Questão ${identifier}: ${isCurrent ? 'Em foco' : isAnswered ? 'Respondida' : 'Não respondida'}`}
            >
              <Button
                size="small"
                onClick={() => onSelectQuestion(idx)}
                sx={{
                  minWidth: 42,
                  height: 36,
                  p: 0,
                  borderRadius: 1.5,
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  backgroundColor: bgColor,
                  color: textColor,
                  border: '1.5px solid',
                  borderColor: borderCol,
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  '&:hover': {
                    backgroundColor: isCurrent
                      ? PALETTE_COLORS.primary
                      : isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.06)',
                    borderColor: isCurrent ? PALETTE_COLORS.primary : PALETTE_COLORS.secondary,
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                {idx + 1}
                {isAnswered && !isCurrent && (
                  <CheckIcon
                    sx={{
                      fontSize: '0.75rem',
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      color: PALETTE_COLORS.success,
                    }}
                  />
                )}
              </Button>
            </Tooltip>
          );
        })}
      </Box>
    </Paper>
  );
};
