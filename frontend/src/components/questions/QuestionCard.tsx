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
  Snackbar,
  Collapse,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Link } from 'react-router-dom';
import { DifficultyLevel, Question } from '../../types';
import { PALETTE_COLORS } from '../../theme/theme';
import { useAppTheme } from '../../theme/ThemeContext';
import { submitQuestionAttempt } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface QuestionCardProps {
  question: Question;
  onBookmarkClick?: (question: Question) => void;
  isSavedInAnyFolder?: boolean;
  showViewDetails?: boolean;
}

const getSessionId = (): string => {
  let sId = sessionStorage.getItem('omq_session_id');
  if (!sId) {
    sId = 'session_' + Math.random().toString(36).substring(2, 12);
    sessionStorage.setItem('omq_session_id', sId);
  }
  return sId;
};

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onBookmarkClick,
  isSavedInAnyFolder = false,
  showViewDetails = true,
}) => {
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';
  const { attemptedQuestionIds, markQuestionAttempted } = useAuth();

  const [selectedAlternativeId, setSelectedAlternativeId] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [localBookmarked, setLocalBookmarked] = useState<boolean>(false);
  const [hasAttemptedBefore, setHasAttemptedBefore] = useState<boolean>(false);
  const [copiedToastOpen, setCopiedToastOpen] = useState<boolean>(false);
  const [showTextualReference, setShowTextualReference] = useState<boolean>(false);

  const isAttemptedByCurrentUser = attemptedQuestionIds.has(question.id);

  const handleShare = () => {
    const questionUrl = `${window.location.origin}/questoes/${question.id}`;
    navigator.clipboard.writeText(questionUrl);
    setCopiedToastOpen(true);
  };

  // Dynamic statistics state
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevel>(
    question.difficultyLevel || 'SEM_DADOS'
  );
  const [accuracyPercentage, setAccuracyPercentage] = useState<number>(
    question.accuracyPercentage || 0
  );
  const [totalAttempts, setTotalAttempts] = useState<number>(question.totalAttempts || 0);

  const isBookmarked = isSavedInAnyFolder || localBookmarked;

  // Determina se a alternativa selecionada está correta
  const isCorrectAnswer = Boolean(
    selectedAlternativeId &&
      question.alternatives.find((a) => a.id === selectedAlternativeId)?.isCorrect
  );

  const handleSelect = (id?: number) => {
    if (isAnswered || id === undefined) return;
    setSelectedAlternativeId(id);
  };

  const handleVerify = async () => {
    if (selectedAlternativeId === null) return;
    setIsAnswered(true);

    try {
      const response = await submitQuestionAttempt(question.id, {
        selectedAlternativeId,
        isFirstAttempt: !hasAttemptedBefore,
        sessionId: getSessionId(),
      });
      setHasAttemptedBefore(true);
      markQuestionAttempted(question.id);
      if (response.difficultyLevel) {
        setDifficultyLevel(response.difficultyLevel);
      }
      if (response.accuracyPercentage !== undefined) {
        setAccuracyPercentage(response.accuracyPercentage);
      }
      if (response.totalAttempts !== undefined) {
        setTotalAttempts(response.totalAttempts);
      }
    } catch (err) {
      console.warn('Erro ao registrar tentativa da questão:', err);
    }
  };

  const handleReset = () => {
    setSelectedAlternativeId(null);
    setIsAnswered(false);
  };

  const renderDifficultyBadge = (diff: DifficultyLevel) => {
    switch (diff) {
      case 'FACIL':
        return (
          <Chip
            size="small"
            label="Fácil (≥ 80%)"
            sx={{
              backgroundColor: isDark ? 'rgba(75, 241, 81, 0.15)' : 'rgba(75, 241, 81, 0.2)',
              color: PALETTE_COLORS.success,
              fontWeight: 700,
              border: `1px solid ${PALETTE_COLORS.success}`,
            }}
          />
        );
      case 'MEDIA':
        return (
          <Chip
            size="small"
            label="Média (50% - 79%)"
            sx={{
              backgroundColor: isDark ? 'rgba(243, 255, 61, 0.15)' : 'rgba(243, 255, 61, 0.25)',
              color: isDark ? PALETTE_COLORS.warning : '#7a7000',
              fontWeight: 700,
              border: `1px solid ${PALETTE_COLORS.warning}`,
            }}
          />
        );
      case 'DIFICIL':
        return (
          <Chip
            size="small"
            label="Difícil (< 50%)"
            sx={{
              backgroundColor: isDark ? 'rgba(250, 66, 75, 0.15)' : 'rgba(250, 66, 75, 0.2)',
              color: PALETTE_COLORS.danger,
              fontWeight: 700,
              border: `1px solid ${PALETTE_COLORS.danger}`,
            }}
          />
        );
      default:
        return (
          <Chip
            size="small"
            label="Sem dados"
            sx={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              color: 'text.secondary',
              fontWeight: 500,
              border: '1px solid',
              borderColor: 'divider',
            }}
          />
        );
    }
  };

  return (
    <Paper
      elevation={4}
      sx={{
        p: { xs: 2.5, md: 3.5 },
        mb: 3,
        transition: 'all 0.2s ease-in-out',
        position: 'relative',
        borderRadius: 3,
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
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ gap: 0.8 }}>
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

          {isAttemptedByCurrentUser && (
            <Chip
              label="Já respondida"
              size="small"
              icon={<CheckCircleOutlineIcon style={{ color: PALETTE_COLORS.success }} />}
              sx={{
                backgroundColor: isDark ? 'rgba(75, 241, 81, 0.15)' : 'rgba(75, 241, 81, 0.2)',
                color: PALETTE_COLORS.success,
                fontWeight: 700,
                border: `1px solid ${PALETTE_COLORS.success}`,
              }}
            />
          )}

          {renderDifficultyBadge(difficultyLevel)}

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

          {question.createdByUser && (
            <Typography
              component={Link}
              to={`/perfil/${question.createdByUser.id}`}
              variant="caption"
              sx={{
                color: PALETTE_COLORS.secondary,
                fontWeight: 600,
                textDecoration: 'none',
                ml: 1,
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Adicionado por {question.createdByUser.name}
            </Typography>
          )}
        </Stack>

        {/* Actions: View Details, Bookmark and Share */}
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          {showViewDetails && (
            <Tooltip title="Visualizar questão em detalhes">
              <IconButton
                size="small"
                component={Link}
                to={`/questoes/${question.id}`}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: PALETTE_COLORS.primary,
                    backgroundColor: isDark ? 'rgba(255, 230, 0, 0.08)' : 'rgba(255, 230, 0, 0.15)',
                  },
                }}
              >
                <VisibilityOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title={isBookmarked ? 'Gerenciar pastas salvas' : 'Salvar em uma pasta'}>
            <IconButton
              size="small"
              onClick={() => {
                if (onBookmarkClick) {
                  onBookmarkClick(question);
                } else {
                  setLocalBookmarked(!localBookmarked);
                }
              }}
              sx={{
                '&:hover': { color: PALETTE_COLORS.primary },
              }}
            >
              {isBookmarked ? (
                <BookmarkIcon fontSize="small" sx={{ color: PALETTE_COLORS.primary }} />
              ) : (
                <BookmarkBorderIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              )}
            </IconButton>
          </Tooltip>

          <Tooltip title="Compartilhar questão (copiar link)">
            <IconButton
              size="small"
              onClick={handleShare}
              sx={{
                color: 'text.secondary',
                '&:hover': { color: PALETTE_COLORS.secondary },
              }}
            >
              <ShareOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Metrics Bar */}
      {totalAttempts > 0 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            mb: 2,
            p: 1,
            px: 1.5,
            borderRadius: 2,
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
          }}
        >
          <TrendingUpIcon fontSize="small" sx={{ color: PALETTE_COLORS.primary }} />
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            {accuracyPercentage.toFixed(0)}% de acerto na 1ª tentativa ({totalAttempts} {totalAttempts === 1 ? 'tentativa' : 'tentativas'})
          </Typography>
        </Box>
      )}

      {/* Textual Reference (Texto de Apoio) */}
      {question.textualReference && (
        <Box
          sx={{
            mb: 2.5,
            border: `1px solid ${isDark ? 'rgba(217, 183, 99, 0.3)' : 'rgba(217, 183, 99, 0.4)'}`,
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: isDark ? 'rgba(217, 183, 99, 0.04)' : 'rgba(217, 183, 99, 0.05)',
          }}
        >
          <Box
            onClick={() => setShowTextualReference(!showTextualReference)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1.25,
              px: 2,
              cursor: 'pointer',
              backgroundColor: isDark ? 'rgba(217, 183, 99, 0.08)' : 'rgba(217, 183, 99, 0.1)',
              transition: 'background-color 0.15s',
              '&:hover': {
                backgroundColor: isDark ? 'rgba(217, 183, 99, 0.15)' : 'rgba(217, 183, 99, 0.18)',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <MenuBookIcon sx={{ color: PALETTE_COLORS.primary, fontSize: '1.2rem' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                Texto de Apoio: {question.textualReference.title || question.textualReference.subtitle || 'Referência Textual'}
              </Typography>
            </Box>
            <Button
              size="small"
              variant="text"
              sx={{
                color: PALETTE_COLORS.primary,
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.82rem',
              }}
            >
              {showTextualReference ? 'Ocultar Texto' : 'Ver Texto'}
            </Button>
          </Box>

          <Collapse in={showTextualReference}>
            <Box sx={{ p: 2, pt: 1.5, borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}` }}>
              {question.textualReference.subtitle && (
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontStyle: 'italic',
                    fontWeight: 600,
                    color: 'text.secondary',
                    mb: 1,
                  }}
                >
                  {question.textualReference.subtitle}
                </Typography>
              )}

              {question.textualReference.caption && (
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    fontWeight: 600,
                    color: PALETTE_COLORS.secondary,
                    mb: 1.5,
                  }}
                >
                  {question.textualReference.caption}
                </Typography>
              )}

              {question.textualReference.content && (
                <Typography
                  variant="body2"
                  sx={{
                    lineHeight: 1.75,
                    color: 'text.primary',
                    whiteSpace: 'pre-line',
                    maxHeight: 380,
                    overflowY: 'auto',
                    pr: 1,
                    mb: 1.5,
                  }}
                >
                  {question.textualReference.content}
                </Typography>
              )}

              {/* Author & Reference / Source Link */}
              {(question.textualReference.author || question.textualReference.reference || question.textualReference.source) && (
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                  sx={{
                    mt: 1,
                    pt: 1,
                    borderTop: `1px dashed ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
                  }}
                >
                  {question.textualReference.author && (
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                      Autor: <strong>{question.textualReference.author}</strong>
                    </Typography>
                  )}

                  {(question.textualReference.reference || question.textualReference.source) && (() => {
                    const refUrl = question.textualReference.reference || question.textualReference.source || '';
                    const isUrl = refUrl.startsWith('http://') || refUrl.startsWith('https://') || refUrl.startsWith('www.');
                    const fullUrl = refUrl.startsWith('www.') ? `https://${refUrl}` : refUrl;

                    return isUrl ? (
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Fonte / Referência:
                        </Typography>
                        <Typography
                          component="a"
                          href={fullUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="caption"
                          sx={{
                            color: PALETTE_COLORS.primary,
                            textDecoration: 'underline',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.3,
                            fontWeight: 600,
                          }}
                        >
                          {refUrl.length > 50 ? refUrl.substring(0, 50) + '...' : refUrl}
                          <OpenInNewIcon sx={{ fontSize: '0.85rem' }} />
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                        Fonte: {refUrl}
                      </Typography>
                    );
                  })()}
                </Stack>
              )}
            </Box>
          </Collapse>
        </Box>
      )}

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
              borderColor = PALETTE_COLORS.success;
              backgroundColor = isDark ? 'rgba(75, 241, 81, 0.12)' : 'rgba(75, 241, 81, 0.15)';
              letterBg = PALETTE_COLORS.success;
              letterColor = '#0f2910';
            } else if (isSelected && !isCorrect) {
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

      <Snackbar
        open={copiedToastOpen}
        autoHideDuration={3000}
        onClose={() => setCopiedToastOpen(false)}
        message="Link da questão copiado para a área de transferência!"
      />
    </Paper>
  );
};
