import { Question } from '../types';

export interface CSVResultRow {
  questao: string;
  acerto: string;
  alternativaMarcada: string;
  alternativaCorreta: string;
}

export interface DetailedResultItem {
  questionId: number;
  selectedAlternativeId?: number;
  correctAlternativeId?: number;
  isCorrect: boolean;
}

/**
 * Builds array of CSVResultRow from questions and detailedResults or answers
 */
export const buildCSVResultRows = (
  questions: Question[],
  detailedResults?: DetailedResultItem[],
  answers?: Record<number, number>
): CSVResultRow[] => {
  return questions.map((q, idx) => {
    const detail = detailedResults?.find((d) => d.questionId === q.id);
    const userSelectedId = answers ? answers[q.id] : detail?.selectedAlternativeId;
    const fallbackCorrectAlt = q.alternatives.find((a) => a.isCorrect);
    const correctAltId = detail?.correctAlternativeId ?? fallbackCorrectAlt?.id;

    const isCorrect = detail?.isCorrect !== undefined
      ? detail.isCorrect
      : Boolean(userSelectedId && correctAltId && userSelectedId === correctAltId);

    const selectedAlt = q.alternatives.find((a) => a.id === userSelectedId);
    const correctAlt = q.alternatives.find((a) => a.id === correctAltId);

    const questaoStr = q.identifier ? `${idx + 1} (${q.identifier})` : String(idx + 1);

    let acertoStr = 'NÃO';
    if (isCorrect) {
      acertoStr = 'SIM';
    } else if (!userSelectedId) {
      acertoStr = 'NÃO (Não respondida)';
    }

    const alternativaMarcadaStr = selectedAlt?.identifier || '-';
    const alternativaCorretaStr = correctAlt?.identifier || '-';

    return {
      questao: questaoStr,
      acerto: acertoStr,
      alternativaMarcada: alternativaMarcadaStr,
      alternativaCorreta: alternativaCorretaStr,
    };
  });
};

/**
 * Escapes a cell value for standard CSV format.
 */
const escapeCSVCell = (cell: string): string => {
  if (cell.includes(',') || cell.includes('"') || cell.includes('\n') || cell.includes(';')) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
};

/**
 * Generates formatted CSV string with headers: questao,acerto,alternativa marcada,alternativa correta
 */
export const generateSimulationCSV = (rows: CSVResultRow[]): string => {
  const headers = ['questao', 'acerto', 'alternativa marcada', 'alternativa correta'];
  const headerLine = headers.join(',');

  const lines = rows.map((r) =>
    [
      escapeCSVCell(r.questao),
      escapeCSVCell(r.acerto),
      escapeCSVCell(r.alternativaMarcada),
      escapeCSVCell(r.alternativaCorreta),
    ].join(',')
  );

  return [headerLine, ...lines].join('\n');
};

/**
 * Downloads a CSV string as a file with UTF-8 BOM.
 */
export const downloadCSV = (filename: string, csvContent: string): void => {
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Copies text content to clipboard.
 */
export const copyTextToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Falha ao copiar para o clipboard:', err);
    return false;
  }
};

/**
 * Native Web Share API if supported.
 */
export const shareCSVData = async (
  title: string,
  text: string,
  filename: string,
  csvContent: string
): Promise<boolean> => {
  try {
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const file = new File([blob], filename.endsWith('.csv') ? filename : `${filename}.csv`, {
      type: 'text/csv;charset=utf-8;',
    });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title,
        text,
        files: [file],
      });
      return true;
    }

    if (navigator.share) {
      await navigator.share({
        title,
        text: `${text}\n\n${csvContent}`,
      });
      return true;
    }

    return false;
  } catch (err) {
    if ((err as any).name !== 'AbortError') {
      console.warn('Erro ao compartilhar:', err);
    }
    return false;
  }
};
