import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Chip,
  Snackbar,
  Alert,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShareIcon from '@mui/icons-material/Share';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import { Question } from '../../types';
import {
  buildCSVResultRows,
  generateSimulationCSV,
  downloadCSV,
  copyTextToClipboard,
  shareCSVData,
  DetailedResultItem,
} from '../../utils/csvExport';
import { PALETTE_COLORS } from '../../theme/theme';
import { useAppTheme } from '../../theme/ThemeContext';

interface ShareResultsModalProps {
  open: boolean;
  onClose: () => void;
  testName: string;
  testYear?: number;
  scorePercentage?: number;
  correctAnswers?: number;
  totalQuestions?: number;
  timeSpentSeconds?: number;
  questions: Question[];
  detailedResults?: DetailedResultItem[];
  answers?: Record<number, number>;
}

export const ShareResultsModal: React.FC<ShareResultsModalProps> = ({
  open,
  onClose,
  testName,
  testYear,
  scorePercentage,
  correctAnswers,
  totalQuestions,
  timeSpentSeconds,
  questions,
  detailedResults,
  answers,
}) => {
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const rows = useMemo(() => {
    return buildCSVResultRows(questions, detailedResults, answers);
  }, [questions, detailedResults, answers]);

  const csvContent = useMemo(() => {
    return generateSimulationCSV(rows);
  }, [rows]);

  const sanitizedFileName = useMemo(() => {
    const cleanName = (testName || 'simulado')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    return `resultado_${cleanName}_${dateStr}.csv`;
  }, [testName]);

  const handleDownload = () => {
    downloadCSV(sanitizedFileName, csvContent);
    setToastMessage('Arquivo CSV baixado com sucesso!');
  };

  const handleCopy = async () => {
    const success = await copyTextToClipboard(csvContent);
    if (success) {
      setToastMessage('Tabela CSV copiada para a área de transferência!');
    } else {
      setToastMessage('Não foi possível copiar o texto automaticamente.');
    }
  };

  const handleShare = async () => {
    const title = `Resultados: ${testName}`;
    const text = `Confira meus resultados no simulado "${testName}"${
      scorePercentage !== undefined ? ` - Acertos: ${Math.round(scorePercentage)}%` : ''
    }`;
    const success = await shareCSVData(title, text, sanitizedFileName, csvContent);
    if (success) {
      setToastMessage('Compartilhado com sucesso!');
    } else {
      // Fallback to copy if native share was aborted or unsupported
      handleCopy();
    }
  };

  const minutes = Math.floor((timeSpentSeconds || 0) / 60);
  const seconds = (timeSpentSeconds || 0) % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
            backgroundImage: 'none',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 1,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Compartilhar / Exportar Resultados (CSV)
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {testName} {testYear ? `(${testYear})` : ''}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 2.5 }}>
          {/* Summary Chips */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1.5,
              mb: 3,
              p: 2,
              borderRadius: 2,
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            {scorePercentage !== undefined && (
              <Chip
                icon={<CheckCircleOutlineIcon fontSize="small" />}
                label={`Desempenho: ${Math.round(scorePercentage)}%`}
                color={scorePercentage >= 60 ? 'success' : 'warning'}
                sx={{ fontWeight: 800 }}
              />
            )}
            {correctAnswers !== undefined && totalQuestions !== undefined && (
              <Chip
                label={`Acertos: ${correctAnswers} de ${totalQuestions}`}
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
            )}
            {timeSpentSeconds !== undefined && (
              <Chip
                label={`Tempo: ${timeFormatted}`}
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
            )}
            <Chip
              label={`${rows.length} questões na tabela`}
              size="small"
              sx={{ ml: 'auto', fontWeight: 600, color: 'text.secondary' }}
            />
          </Box>

          {/* Quick Action Buttons */}
          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              flexWrap: 'wrap',
              mb: 3,
            }}
          >
            <Button
              variant="contained"
              startIcon={<FileDownloadIcon />}
              onClick={handleDownload}
              sx={{
                backgroundColor: PALETTE_COLORS.primary,
                color: '#1a1e24',
                fontWeight: 800,
                borderRadius: 2,
                px: 2.5,
                '&:hover': {
                  backgroundColor: '#c4a251',
                },
              }}
            >
              Baixar Arquivo CSV
            </Button>

            <Button
              variant="outlined"
              startIcon={<ContentCopyIcon />}
              onClick={handleCopy}
              sx={{
                fontWeight: 700,
                borderRadius: 2,
                px: 2,
                borderColor: PALETTE_COLORS.primary,
                color: PALETTE_COLORS.primary,
              }}
            >
              Copiar Tabela CSV
            </Button>

            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <Button
                variant="outlined"
                startIcon={<ShareIcon />}
                onClick={handleShare}
                sx={{
                  fontWeight: 700,
                  borderRadius: 2,
                  px: 2,
                }}
              >
                Compartilhar
              </Button>
            )}
          </Box>

          {/* Table Preview */}
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Pré-visualização da Tabela (Colunas do CSV):
          </Typography>

          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{
              maxHeight: 340,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, backgroundColor: isDark ? '#232830' : '#f0f2f5' }}>
                    questao
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, backgroundColor: isDark ? '#232830' : '#f0f2f5' }}>
                    acerto
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, backgroundColor: isDark ? '#232830' : '#f0f2f5' }}>
                    alternativa marcada
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, backgroundColor: isDark ? '#232830' : '#f0f2f5' }}>
                    alternativa correta
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, idx) => {
                  const isSim = row.acerto === 'SIM';
                  return (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{row.questao}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          icon={isSim ? <CheckCircleOutlineIcon /> : <HighlightOffIcon />}
                          label={row.acerto}
                          color={isSim ? 'success' : 'error'}
                          variant="outlined"
                          sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        <Chip
                          size="small"
                          label={row.alternativaMarcada}
                          sx={{
                            fontWeight: 800,
                            minWidth: 28,
                            backgroundColor:
                              row.alternativaMarcada !== '-'
                                ? isSim
                                  ? 'rgba(75, 241, 81, 0.15)'
                                  : 'rgba(250, 66, 75, 0.15)'
                                : undefined,
                            color:
                              row.alternativaMarcada !== '-'
                                ? isSim
                                  ? PALETTE_COLORS.success
                                  : PALETTE_COLORS.danger
                                : 'text.secondary',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        <Chip
                          size="small"
                          label={row.alternativaCorreta}
                          sx={{
                            fontWeight: 800,
                            minWidth: 28,
                            backgroundColor: 'rgba(75, 241, 81, 0.15)',
                            color: PALETTE_COLORS.success,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>

        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Formato UTF-8 com BOM compatível com Excel, Planilhas Google e Notion.
          </Typography>
          <Button onClick={onClose} sx={{ fontWeight: 700 }}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={3000}
        onClose={() => setToastMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToastMessage(null)}
          severity="success"
          sx={{ width: '100%', fontWeight: 700, borderRadius: 2 }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </>
  );
};
