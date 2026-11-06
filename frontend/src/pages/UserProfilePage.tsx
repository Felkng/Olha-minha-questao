import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Checkbox,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  Switch,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { ProfileSkeleton, ListItemsSkeleton, CardGridSkeleton } from '../components/skeletons';
import PersonIcon from '@mui/icons-material/Person';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CategoryIcon from '@mui/icons-material/Category';
import ClassIcon from '@mui/icons-material/Class';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import BarChartIcon from '@mui/icons-material/BarChart';
import SortIcon from '@mui/icons-material/Sort';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import StyleOutlinedIcon from '@mui/icons-material/StyleOutlined';
import FolderSpecialOutlinedIcon from '@mui/icons-material/FolderSpecialOutlined';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SearchIcon from '@mui/icons-material/Search';
import ShareIcon from '@mui/icons-material/Share';
import HistoryIcon from '@mui/icons-material/History';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FlipCameraAndroidIcon from '@mui/icons-material/FlipCameraAndroid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PublicIcon from '@mui/icons-material/Public';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';

import {
  getUserProfile,
  promoteUserToAdmin,
  getQuestions,
  deleteQuestion,
  getTests,
  deleteTest,
  getFolders,
  createFolder,
  deleteFolder,
  getOrigins,
  deleteOrigin,
  getAreas,
  deleteArea,
  getSubjects,
  deleteSubject,
  getUserTestAttempts,
  getTestAttemptDetail,
  getTestEvaluation,
  getUserQuestionAttempts,
  getFlashcards,
  deleteFlashcard,
  getUserFlashcardSessions,
  deleteFlashcardSession,
  getUserTestSessions,
  deleteTestSession,
  getUserQuestionSessions,
  deleteQuestionSession,
} from '../services/api';
import {
  Area,
  CategoryPerformance,
  DailyActivity,
  Flashcard,
  FlashcardSession,
  Folder,
  FolderType,
  Origin,
  Question,
  QuestionAttemptHistory,
  QuestionSession,
  Subject,
  Test,
  TestCard,
  TestAttemptSummary,
  TestAttemptDetail,
  TestEvaluation,
  TestSession,
  UserProfile,
  UserSummary,
} from '../types';
import { stripRichTextMarkup } from '../components/common/FormattedText';
import { PALETTE_COLORS } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { ShareResultsModal } from '../components/simulations/ShareResultsModal';

// Modais CRUD
import { CreateQuestionModal } from '../components/crud/CreateQuestionModal';
import { EditQuestionModal } from '../components/crud/EditQuestionModal';
import { CreateTestWizardModal } from '../components/crud/CreateTestWizardModal';
import { EditTestModal } from '../components/crud/EditTestModal';
import { TestQuestionsManagerModal } from '../components/crud/TestQuestionsManagerModal';
import { CreateOriginModal } from '../components/crud/CreateOriginModal';
import { EditOriginModal } from '../components/crud/EditOriginModal';
import { CreateAreaModal } from '../components/crud/CreateAreaModal';
import { EditAreaModal } from '../components/crud/EditAreaModal';
import { CreateSubjectModal } from '../components/crud/CreateSubjectModal';
import { EditSubjectModal } from '../components/crud/EditSubjectModal';
import { EditFolderModal } from '../components/crud/EditFolderModal';
import { EditProfileModal } from '../components/profile/EditProfileModal';
import { CreateFlashcardModal } from '../components/crud/CreateFlashcardModal';
import { EditFlashcardModal } from '../components/crud/EditFlashcardModal';
import { SaveFlashcardToFolderModal } from '../components/folders/SaveFlashcardToFolderModal';

type ProfileTab =
  | 'visao_geral'
  | 'questoes_respondidas'
  | 'meus_simulados'
  | 'sessoes_estudo'
  | 'minhas_questoes'
  | 'minhas_provas'
  | 'minhas_pastas'
  | 'meus_flashcards'
  | 'admin_bancas'
  | 'admin_areas'
  | 'admin_materias';

interface StudySessionLineChartProps {
  sessions: FlashcardSession[];
  isDark: boolean;
  formatStudyDuration: (seconds?: number, includeSeconds?: boolean) => string;
}

export const StudySessionLineChart: React.FC<StudySessionLineChartProps> = ({
  sessions,
  isDark,
  formatStudyDuration,
}) => {
  const [period, setPeriod] = useState<'30days' | '12months'>('30days');
  const [metric, setMetric] = useState<'time' | 'cards'>('time');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, FlashcardSession[]>();
    for (const s of sessions) {
      if (!s.createdAt) continue;
      const key = new Date(s.createdAt).toLocaleDateString('en-CA');
      const arr = map.get(key) || [];
      arr.push(s);
      map.set(key, arr);
    }
    return map;
  }, [sessions]);

  const chartData = useMemo(() => {
    const today = new Date();
    if (period === '30days') {
      const list = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = d.toLocaleDateString('en-CA');
        const daySessions = sessionsByDate.get(key) || [];
        const seconds = daySessions.reduce((acc, s) => acc + (s.timeSpentSeconds || 0), 0);
        const cards = daySessions.reduce((acc, s) => acc + (s.totalCards || 0), 0);
        const correct = daySessions.reduce((acc, s) => acc + (s.correctCount || 0), 0);
        const wrong = daySessions.reduce((acc, s) => acc + (s.wrongCount || 0), 0);
        const dayNum = String(d.getDate()).padStart(2, '0');
        const monthNum = String(d.getMonth() + 1).padStart(2, '0');

        list.push({
          key,
          label: `${dayNum}/${monthNum}`,
          fullDate: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
          seconds,
          minutes: Math.round(seconds / 60),
          cards,
          correct,
          wrong,
          accuracy: cards > 0 ? (correct / cards) * 100 : 0,
        });
      }
      return list;
    } else {
      const list = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const year = d.getFullYear();
        const month = d.getMonth();
        const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        const fullDate = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

        const monthSessions = sessions.filter((s) => {
          if (!s.createdAt) return false;
          const sDate = new Date(s.createdAt);
          return sDate.getFullYear() === year && sDate.getMonth() === month;
        });

        const seconds = monthSessions.reduce((acc, s) => acc + (s.timeSpentSeconds || 0), 0);
        const cards = monthSessions.reduce((acc, s) => acc + (s.totalCards || 0), 0);
        const correct = monthSessions.reduce((acc, s) => acc + (s.correctCount || 0), 0);
        const wrong = monthSessions.reduce((acc, s) => acc + (s.wrongCount || 0), 0);

        list.push({
          key: monthKey,
          label,
          fullDate,
          seconds,
          minutes: Math.round(seconds / 60),
          cards,
          correct,
          wrong,
          accuracy: cards > 0 ? (correct / cards) * 100 : 0,
        });
      }
      return list;
    }
  }, [period, sessionsByDate, sessions]);

  const totalPeriodSeconds = useMemo(() => chartData.reduce((acc, d) => acc + d.seconds, 0), [chartData]);
  const totalPeriodCards = useMemo(() => chartData.reduce((acc, d) => acc + d.cards, 0), [chartData]);
  const activeCount = useMemo(() => chartData.filter((d) => d.seconds > 0).length, [chartData]);

  const svgWidth = 850;
  const svgHeight = 380;
  const padLeft = 65;
  const padRight = 35;
  const padTop = 45;
  const padBottom = 55;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const rawMax = Math.max(...chartData.map((d) => (metric === 'time' ? d.minutes : d.cards)), 0);
  const maxY = rawMax === 0 ? 10 : Math.ceil(rawMax * 1.2);

  const points = chartData.map((d, i) => {
    const val = metric === 'time' ? d.minutes : d.cards;
    const x = padLeft + (i / Math.max(1, chartData.length - 1)) * plotWidth;
    const y = padTop + plotHeight - (val / maxY) * plotHeight;
    return { ...d, x, y, val };
  });

  const pathD = points.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = arr[i - 1];
    const cpX = (prev.x + pt.x) / 2;
    return `${acc} C ${cpX} ${prev.y}, ${cpX} ${pt.y}, ${pt.x} ${pt.y}`;
  }, '');

  const areaD = points.length > 0 ? `${pathD} L ${points[points.length - 1].x} ${padTop + plotHeight} L ${points[0].x} ${padTop + plotHeight} Z` : '';

  const hoveredPoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null;

  const yTicks = [0, Math.round(maxY * 0.33), Math.round(maxY * 0.66), maxY];

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 3,
        bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
        borderColor: 'divider',
        mb: 3,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <ShowChartIcon sx={{ color: PALETTE_COLORS.primary }} />
            <Typography variant="subtitle1" fontWeight="bold">
              Gráfico de Linhas: Evolução do Estudo
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Visualização contínua de {metric === 'time' ? 'tempo dedicado' : 'cards respondidos'} ao longo do tempo.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <ButtonGroup size="small" variant="outlined" sx={{ borderRadius: 2 }}>
            <Button
              onClick={() => setMetric('time')}
              variant={metric === 'time' ? 'contained' : 'outlined'}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                ...(metric === 'time' ? { bgcolor: PALETTE_COLORS.primary, color: '#1a1e24', '&:hover': { bgcolor: '#c4a251' } } : {}),
              }}
            >
              Tempo (min)
            </Button>
            <Button
              onClick={() => setMetric('cards')}
              variant={metric === 'cards' ? 'contained' : 'outlined'}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                ...(metric === 'cards' ? { bgcolor: PALETTE_COLORS.primary, color: '#1a1e24', '&:hover': { bgcolor: '#c4a251' } } : {}),
              }}
            >
              Cards
            </Button>
          </ButtonGroup>

          <ButtonGroup size="small" variant="outlined" sx={{ borderRadius: 2 }}>
            <Button
              onClick={() => { setPeriod('30days'); setHoverIndex(null); }}
              variant={period === '30days' ? 'contained' : 'outlined'}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                ...(period === '30days' ? { bgcolor: PALETTE_COLORS.primary, color: '#1a1e24', '&:hover': { bgcolor: '#c4a251' } } : {}),
              }}
            >
              30 Dias
            </Button>
            <Button
              onClick={() => { setPeriod('12months'); setHoverIndex(null); }}
              variant={period === '12months' ? 'contained' : 'outlined'}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                ...(period === '12months' ? { bgcolor: PALETTE_COLORS.primary, color: '#1a1e24', '&:hover': { bgcolor: '#c4a251' } } : {}),
              }}
            >
              12 Meses
            </Button>
          </ButtonGroup>
        </Stack>
      </Box>

      {/* Resumo do Período */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          p: 1.5,
          borderRadius: 2,
          bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          mb: 2,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Total no período: <b>{formatStudyDuration(totalPeriodSeconds)}</b>
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Cards praticados: <b>{totalPeriodCards}</b>
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {period === '30days' ? 'Dias com estudo' : 'Meses com estudo'}: <b>{activeCount}</b> de {chartData.length}
        </Typography>
      </Box>

      {/* Container SVG com altura expandida e sem corte de overflow */}
      <Box sx={{ width: '100%', position: 'relative', overflow: 'visible', minHeight: { xs: 300, sm: 380 } }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="studyChartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={PALETTE_COLORS.primary} stopOpacity={0.4} />
              <stop offset="100%" stopColor={PALETTE_COLORS.primary} stopOpacity={0.0} />
            </linearGradient>
          </defs>

          {yTicks.map((tickVal, idx) => {
            const yPos = padTop + plotHeight - (tickVal / maxY) * plotHeight;
            return (
              <g key={`ytick-${idx}`}>
                <line
                  x1={padLeft}
                  y1={yPos}
                  x2={padLeft + plotWidth}
                  y2={yPos}
                  stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}
                  strokeDasharray="4 4"
                />
                <text
                  x={padLeft - 10}
                  y={yPos + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
                >
                  {metric === 'time' ? `${tickVal}m` : tickVal}
                </text>
              </g>
            );
          })}

          {areaD && <path d={areaD} fill="url(#studyChartGradient)" />}

          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke={PALETTE_COLORS.primary}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {hoveredPoint && (
            <line
              x1={hoveredPoint.x}
              y1={padTop}
              x2={hoveredPoint.x}
              y2={padTop + plotHeight}
              stroke={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
              strokeDasharray="3 3"
            />
          )}

          {points.map((pt, i) => {
            const isHovered = hoverIndex === i;
            return (
              <g
                key={`pt-${i}`}
                onMouseEnter={() => setHoverIndex(i)}
                style={{ cursor: 'pointer' }}
              >
                <circle cx={pt.x} cy={pt.y} r={14} fill="transparent" />
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : pt.val > 0 ? 3.5 : 2}
                  fill={isHovered ? '#ffffff' : pt.val > 0 ? PALETTE_COLORS.primary : (isDark ? '#444' : '#ccc')}
                  stroke={PALETTE_COLORS.primary}
                  strokeWidth={isHovered ? 2.5 : 1.5}
                />
              </g>
            );
          })}

          {points.map((pt, i) => {
            if (period === '30days' && i % 5 !== 0 && i !== points.length - 1) return null;
            return (
              <text
                key={`xlabel-${i}`}
                x={pt.x}
                y={padTop + plotHeight + 20}
                textAnchor="middle"
                fontSize="11"
                fill={isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'}
                fontWeight={hoverIndex === i ? 700 : 400}
              >
                {pt.label}
              </text>
            );
          })}
        </svg>

        {hoveredPoint && (
          <Box
            sx={{
              position: 'absolute',
              top: `${(hoveredPoint.y / svgHeight) * 100}%`,
              left: `${Math.min(88, Math.max(12, (hoveredPoint.x / svgWidth) * 100))}%`,
              transform: hoveredPoint.y < svgHeight * 0.45 ? 'translate(-50%, 15px)' : 'translate(-50%, -100%) translateY(-15px)',
              bgcolor: isDark ? 'rgba(20, 24, 30, 0.96)' : 'rgba(255, 255, 255, 0.96)',
              border: '1px solid',
              borderColor: PALETTE_COLORS.primary,
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              borderRadius: 2,
              p: 1.5,
              pointerEvents: 'none',
              zIndex: 30,
              minWidth: 150,
            }}
          >
            <Typography variant="caption" fontWeight="bold" sx={{ display: 'block', color: PALETTE_COLORS.primary }}>
              {hoveredPoint.fullDate}
            </Typography>
            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
              <AccessTimeIcon sx={{ fontSize: 13, mr: 0.5, color: 'text.secondary' }} />
              <span>Tempo: <b>{formatStudyDuration(hoveredPoint.seconds)}</b></span>
            </Typography>
            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', mt: 0.3 }}>
              <StyleOutlinedIcon sx={{ fontSize: 13, mr: 0.5, color: 'text.secondary' }} />
              <span>Cards: <b>{hoveredPoint.cards}</b> ({hoveredPoint.correct} acertos)</span>
            </Typography>
            {hoveredPoint.cards > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Taxa: <b>{hoveredPoint.accuracy.toFixed(1)}%</b>
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

interface StudySessionCalendarProps {
  sessions: FlashcardSession[];
  isDark: boolean;
  formatStudyDuration: (seconds?: number, includeSeconds?: boolean) => string;
  onSelectSession?: (session: FlashcardSession) => void;
}

export const StudySessionCalendar: React.FC<StudySessionCalendarProps> = ({
  sessions,
  isDark,
  formatStudyDuration,
  onSelectSession,
}) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, FlashcardSession[]>();
    for (const s of sessions) {
      if (!s.createdAt) continue;
      const key = new Date(s.createdAt).toLocaleDateString('en-CA');
      const arr = map.get(key) || [];
      arr.push(s);
      map.set(key, arr);
    }
    return map;
  }, [sessions]);

  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const formattedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => setCurrentDate(new Date());

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const currentMonthSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (!s.createdAt) return false;
      const d = new Date(s.createdAt);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [sessions, year, month]);

  const monthTotalSeconds = currentMonthSessions.reduce((acc, s) => acc + (s.timeSpentSeconds || 0), 0);
  const monthTotalCards = currentMonthSessions.reduce((acc, s) => acc + (s.totalCards || 0), 0);
  const monthActiveDays = useMemo(() => {
    const set = new Set<string>();
    for (const s of currentMonthSessions) {
      if (s.createdAt) set.add(new Date(s.createdAt).toLocaleDateString('en-CA'));
    }
    return set.size;
  }, [currentMonthSessions]);

  const selectedDaySessions = selectedDateKey ? sessionsByDate.get(selectedDateKey) || [] : [];
  const selectedDaySeconds = selectedDaySessions.reduce((acc, s) => acc + (s.timeSpentSeconds || 0), 0);
  const selectedDayCards = selectedDaySessions.reduce((acc, s) => acc + (s.totalCards || 0), 0);
  const selectedDayCorrect = selectedDaySessions.reduce((acc, s) => acc + (s.correctCount || 0), 0);
  const selectedDayWrong = selectedDaySessions.reduce((acc, s) => acc + (s.wrongCount || 0), 0);
  const selectedDayAccuracy = selectedDayCards > 0 ? (selectedDayCorrect / selectedDayCards) * 100 : 0;

  const todayStr = new Date().toLocaleDateString('en-CA');

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 3,
        bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
        borderColor: 'divider',
        mb: 3,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <CalendarMonthIcon sx={{ color: PALETTE_COLORS.primary }} />
            <Typography variant="subtitle1" fontWeight="bold">
              Calendário de Estudos
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Navegue pelos dias para verificar as sessões e métricas detalhadas.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            size="small"
            variant="outlined"
            startIcon={<TodayIcon fontSize="small" />}
            onClick={handleToday}
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
          >
            Hoje
          </Button>
          <IconButton size="small" onClick={handlePrevMonth} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ minWidth: 140, textAlign: 'center' }}>
            {formattedMonthName}
          </Typography>
          <IconButton size="small" onClick={handleNextMonth} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      {/* Resumo do Mês */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          p: 1.5,
          borderRadius: 2,
          bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          mb: 2,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Tempo no mês: <b>{formatStudyDuration(monthTotalSeconds)}</b>
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Cards praticados: <b>{monthTotalCards}</b>
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Dias ativos: <b>{monthActiveDays}</b> de {daysInMonth}
        </Typography>
      </Box>

      {/* Grade do Calendário */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: { xs: 0.5, sm: 1 }, textAlign: 'center', mb: 2 }}>
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
          <Typography key={d} variant="caption" fontWeight="bold" color="text.secondary" sx={{ py: 0.5 }}>
            {d}
          </Typography>
        ))}

        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <Box key={`empty-${i}`} sx={{ minHeight: { xs: 48, sm: 64 } }} />
        ))}

        {daysArray.map((d) => {
          const dayKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const daySessions = sessionsByDate.get(dayKey) || [];
          const daySeconds = daySessions.reduce((acc, s) => acc + (s.timeSpentSeconds || 0), 0);
          const hasStudy = daySeconds > 0;
          const isSelected = selectedDateKey === dayKey;
          const isToday = dayKey === todayStr;

          return (
            <Paper
              key={d}
              onClick={() => setSelectedDateKey(isSelected ? null : dayKey)}
              variant="outlined"
              sx={{
                minHeight: { xs: 48, sm: 64 },
                p: 0.5,
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderColor: isSelected
                  ? PALETTE_COLORS.primary
                  : isToday
                  ? PALETTE_COLORS.secondary
                  : hasStudy
                  ? 'rgba(217, 183, 99, 0.4)'
                  : 'divider',
                borderWidth: isSelected || isToday ? 2 : 1,
                bgcolor: isSelected
                  ? isDark ? 'rgba(217, 183, 99, 0.15)' : 'rgba(217, 183, 99, 0.12)'
                  : hasStudy
                  ? isDark ? 'rgba(217, 183, 99, 0.08)' : 'rgba(217, 183, 99, 0.06)'
                  : 'transparent',
                '&:hover': {
                  borderColor: PALETTE_COLORS.primary,
                  bgcolor: isDark ? 'rgba(217, 183, 99, 0.12)' : 'rgba(217, 183, 99, 0.08)',
                },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', px: 0.5 }}>
                <Typography
                  variant="caption"
                  fontWeight={isToday || isSelected ? 800 : hasStudy ? 700 : 400}
                  color={isSelected ? PALETTE_COLORS.primary : isToday ? PALETTE_COLORS.secondary : 'text.primary'}
                >
                  {d}
                </Typography>
                {hasStudy && (
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: PALETTE_COLORS.primary,
                      mt: 0.5,
                    }}
                  />
                )}
              </Box>

              {hasStudy ? (
                <Chip
                  size="small"
                  label={formatStudyDuration(daySeconds)}
                  sx={{
                    height: 18,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    bgcolor: isDark ? 'rgba(217, 183, 99, 0.25)' : 'rgba(217, 183, 99, 0.2)',
                    color: isDark ? '#f4d88e' : '#8c6f21',
                    maxWidth: '100%',
                  }}
                />
              ) : (
                <Box sx={{ height: 18 }} />
              )}
            </Paper>
          );
        })}
      </Box>

      {/* Painel do Dia Selecionado */}
      {selectedDateKey && (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2.5,
            bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            borderColor: PALETTE_COLORS.primary,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <CalendarMonthIcon sx={{ fontSize: 18, color: PALETTE_COLORS.primary }} />
              <Typography variant="subtitle2" fontWeight="bold">
                Métricas do Dia:{' '}
                {(() => {
                  const parts = selectedDateKey.split('-');
                  return `${parts[2]}/${parts[1]}/${parts[0]}`;
                })()}
              </Typography>
            </Stack>
            <Button size="small" variant="text" onClick={() => setSelectedDateKey(null)} sx={{ textTransform: 'none', py: 0 }}>
              Fechar
            </Button>
          </Box>

          {selectedDaySessions.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Nenhuma sessão de estudo registrada neste dia.
            </Typography>
          ) : (
            <>
              <Grid container spacing={1.5} sx={{ mb: 2 }}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary">Tempo Estudado</Typography>
                    <Typography variant="h6" fontWeight="bold">{formatStudyDuration(selectedDaySeconds)}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary">Sessões Realizadas</Typography>
                    <Typography variant="h6" fontWeight="bold">{selectedDaySessions.length}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary">Cards Praticados</Typography>
                    <Typography variant="h6" fontWeight="bold">{selectedDayCards}</Typography>
                    <Typography variant="caption" color="text.secondary">{selectedDayCorrect} acertos • {selectedDayWrong} erros</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary">Taxa de Acerto</Typography>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: selectedDayAccuracy >= 70 ? PALETTE_COLORS.success : PALETTE_COLORS.primary }}>
                      {selectedDayAccuracy.toFixed(1)}%
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                SESSÕES DO DIA ({selectedDaySessions.length}):
              </Typography>
              <Stack spacing={1}>
                {selectedDaySessions.map((session) => {
                  const sTime = new Date(session.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  const total = session.totalCards || (session.correctCount + session.wrongCount + session.skippedCount);
                  const acc = session.accuracyPercentage != null ? Math.round(session.accuracyPercentage) : total > 0 ? Math.round((session.correctCount / total) * 100) : 0;
                  return (
                    <Paper
                      key={session.id}
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 1,
                        bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {session.folderName || 'Cards Avulsos'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {session.areaName ? `${session.areaName} • ` : ''}{session.subjectName || 'Geral'} • às {sTime}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip size="small" label={formatStudyDuration(session.timeSpentSeconds)} variant="outlined" />
                        <Chip size="small" label={`${total} cards`} />
                        <Chip
                          size="small"
                          label={`${acc}%`}
                          sx={{
                            fontWeight: 700,
                            bgcolor: acc >= 70 ? 'rgba(75, 241, 81, 0.15)' : 'rgba(217, 183, 99, 0.15)',
                            color: acc >= 70 ? '#4bf151' : PALETTE_COLORS.primary,
                          }}
                        />
                        {onSelectSession && (
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => onSelectSession(session)}
                            sx={{ textTransform: 'none', fontWeight: 600 }}
                          >
                            Detalhes
                          </Button>
                        )}
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            </>
          )}
        </Paper>
      )}
    </Paper>
  );
};

export const UserProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const userId = id ? Number(id) : null;
  const navigate = useNavigate();
  const { user: currentUser, login } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [searchParams] = useSearchParams();
  const [activeNavTab, setActiveNavTab] = useState<ProfileTab>('visao_geral');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promoting, setPromoting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Tabs de Categoria em Estatísticas: 0 = Área, 1 = Matéria, 2 = Banca
  const [categoryTab, setCategoryTab] = useState<number>(0);
  const [categorySortBy, setCategorySortBy] = useState<'resolved' | 'accuracy'>('resolved');

  // Tabs de Categoria em Sessões de Estudo (Flashcards): 0 = Área, 1 = Matéria, 2 = Deck
  const [studyCategoryTab, setStudyCategoryTab] = useState<number>(0);
  const [studyCategorySortBy, setStudyCategorySortBy] = useState<'studied' | 'accuracy'>('studied');
  const [overviewStudyVisualTab, setOverviewStudyVisualTab] = useState<number>(0);

  // Dados de Histórico de Questões Respondidas
  const [myQuestionAttempts, setMyQuestionAttempts] = useState<QuestionAttemptHistory[]>([]);
  const [loadingQuestionAttempts, setLoadingQuestionAttempts] = useState(false);
  const [questionAttemptSearch, setQuestionAttemptSearch] = useState('');
  const [questionAttemptFilter, setQuestionAttemptFilter] = useState<'ALL' | 'CORRECT' | 'WRONG'>('ALL');

  // Dados de Meus Simulados Realizados
  const [myTestAttempts, setMyTestAttempts] = useState<TestAttemptSummary[]>([]);
  const [loadingTestAttempts, setLoadingTestAttempts] = useState(false);
  const [testAttemptSearch, setTestAttemptSearch] = useState('');

  // Dados de Minhas Questões
  const [myQuestions, setMyQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionSearch, setQuestionSearch] = useState('');

  // Dados de Minhas Provas
  const [myTests, setMyTests] = useState<Test[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [testSearch, setTestSearch] = useState('');

  // Dados de Minhas Pastas
  const [myFolders, setMyFolders] = useState<Folder[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [folderTypeTab, setFolderTypeTab] = useState<FolderType>('QUESTION');
  const [openCreateFolderDialog, setOpenCreateFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(PALETTE_COLORS.primary);
  const [newFolderIsPublic, setNewFolderIsPublic] = useState(true);
  const [savingFolder, setSavingFolder] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [editFolderModalOpen, setEditFolderModalOpen] = useState(false);

  // Dados de Meus Flashcards
  const [myFlashcards, setMyFlashcards] = useState<Flashcard[]>([]);
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);
  const [myFlashcardFolders, setMyFlashcardFolders] = useState<Folder[]>([]);
  const [loadingFlashcardFolders, setLoadingFlashcardFolders] = useState(false);
  const [flashcardSessions, setFlashcardSessions] = useState<FlashcardSession[]>([]);
  const [loadingFlashcardSessions, setLoadingFlashcardSessions] = useState(false);
  const [testSessions, setTestSessions] = useState<TestSession[]>([]);
  const [, setLoadingTestSessions] = useState(false);
  const [questionSessions, setQuestionSessions] = useState<QuestionSession[]>([]);
  const [, setLoadingQuestionSessions] = useState(false);
  const [selectedSessionDetail, setSelectedSessionDetail] = useState<FlashcardSession | null>(null);
  const [sessionToDiscard, setSessionToDiscard] = useState<FlashcardSession | null>(null);
  const [flashcardSearch, setFlashcardSearch] = useState('');
  const [flashcardSessionSearch, setFlashcardSessionSearch] = useState('');
  const [flashcardSubTab, setFlashcardSubTab] = useState<'DECKS' | 'CARDS' | 'SESSIONS'>('DECKS');
  const [flippedProfileCards, setFlippedProfileCards] = useState<Record<number, boolean>>({});
  const [openCreateFlashcard, setOpenCreateFlashcard] = useState(false);
  const [selectedFlashcardForEdit, setSelectedFlashcardForEdit] = useState<Flashcard | null>(null);
  const [saveFlashcardFolderModalOpen, setSaveFlashcardFolderModalOpen] = useState(false);
  const [selectedFlashcardForFolder, setSelectedFlashcardForFolder] = useState<Flashcard | null>(null);

  // Dados de Administração (ADMIN)
  const [allOrigins, setAllOrigins] = useState<Origin[]>([]);
  const [loadingOrigins, setLoadingOrigins] = useState(false);
  const [originSearch, setOriginSearch] = useState('');

  const [allAreas, setAllAreas] = useState<Area[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [areaSearch, setAreaSearch] = useState('');

  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [subjectAreaFilter, setSubjectAreaFilter] = useState<number | ''>('');

  // Modais de Criação & Edição
  const [openCreateQuestion, setOpenCreateQuestion] = useState(false);
  const [selectedQuestionForEdit, setSelectedQuestionForEdit] = useState<Question | null>(null);

  const [openCreateTestWizard, setOpenCreateTestWizard] = useState(false);
  const [selectedTestForEdit, setSelectedTestForEdit] = useState<Test | TestCard | null>(null);
  const [selectedTestForManager, setSelectedTestForManager] = useState<Test | TestCard | null>(null);

  const [openCreateOrigin, setOpenCreateOrigin] = useState(false);
  const [selectedOriginForEdit, setSelectedOriginForEdit] = useState<Origin | null>(null);

  const [openCreateArea, setOpenCreateArea] = useState(false);
  const [selectedAreaForEdit, setSelectedAreaForEdit] = useState<Area | null>(null);

  const [openCreateSubject, setOpenCreateSubject] = useState(false);
  const [selectedSubjectForEdit, setSelectedSubjectForEdit] = useState<Subject | null>(null);

  // Confirmação de Exclusão Genérica
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: async () => {},
  });
  const [deleting, setDeleting] = useState(false);

  // Exclusão de Prova com Opção de Excluir Questões
  const [deletingTest, setDeletingTest] = useState<Test | null>(null);
  const [deleteQuestionsAlso, setDeleteQuestionsAlso] = useState<boolean>(false);
  const [isDeletingTest, setIsDeletingTest] = useState<boolean>(false);

  // Compartilhamento de Simulado CSV
  const [shareModalOpen, setShareModalOpen] = useState<boolean>(false);
  const [shareAttemptDetail, setShareAttemptDetail] = useState<TestAttemptDetail | null>(null);
  const [shareEvaluation, setShareEvaluation] = useState<TestEvaluation | null>(null);
  const [loadingShareAttemptId, setLoadingShareAttemptId] = useState<number | null>(null);

  const handleOpenShareAttempt = async (att: TestAttemptSummary) => {
    setLoadingShareAttemptId(att.id);
    try {
      const [detail, evalData] = await Promise.all([
        getTestAttemptDetail(att.id),
        getTestEvaluation(att.testId),
      ]);
      setShareAttemptDetail(detail);
      setShareEvaluation(evalData);
      setShareModalOpen(true);
    } catch (err) {
      console.error('Erro ao carregar detalhes para exportação CSV:', err);
    } finally {
      setLoadingShareAttemptId(null);
    }
  };

  const [openEditProfileModal, setOpenEditProfileModal] = useState<boolean>(false);

  const handleProfileUpdated = (updated: UserSummary) => {
    setProfile((prev) => (prev ? { ...prev, name: updated.name, email: updated.email } : null));
    if (isOwner && currentUser) {
      login({ ...currentUser, name: updated.name, email: updated.email });
    }
    setActionSuccess('Informações do perfil atualizadas com sucesso!');
  };

  const isOwner = currentUser?.id === userId;
  const isAdmin = currentUser?.role === 'ADMIN';

  const fetchProfile = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getUserProfile(userId);
      setProfile(data);
    } catch (err: any) {
      setError('Não foi possível carregar o perfil do usuário.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  // Sincronizar aba com parâmetros de URL (ex: ?tab=flashcards)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'flashcards' || tabParam === 'meus_flashcards') {
      setActiveNavTab('meus_flashcards');
    } else if (tabParam === 'sessoes' || tabParam === 'sessoes_estudo' || tabParam === 'estudo') {
      setActiveNavTab('sessoes_estudo');
    } else if (tabParam === 'simulados' || tabParam === 'meus_simulados') {
      setActiveNavTab('meus_simulados');
    } else if (tabParam === 'questoes' || tabParam === 'minhas_questoes') {
      setActiveNavTab('minhas_questoes');
    } else if (tabParam === 'pastas' || tabParam === 'minhas_pastas') {
      setActiveNavTab('minhas_pastas');
    } else if (tabParam === 'provas' || tabParam === 'minhas_provas') {
      setActiveNavTab('minhas_provas');
    } else if (tabParam === 'visao_geral') {
      setActiveNavTab('visao_geral');
    }
  }, [searchParams]);

  // Carregamento sob demanda das abas selecionadas
  useEffect(() => {
    if (!userId) return;
    if (activeNavTab === 'visao_geral') {
      loadMyFlashcardSessions();
    } else if (activeNavTab === 'questoes_respondidas') {
      loadMyQuestionAttempts();
    } else if (activeNavTab === 'meus_simulados') {
      loadMyTestAttempts();
      loadMyTestSessions();
    } else if (activeNavTab === 'sessoes_estudo') {
      loadMyFlashcardSessions();
      loadMyQuestionSessions();
    } else if (activeNavTab === 'minhas_questoes') {
      loadMyQuestions();
    } else if (activeNavTab === 'minhas_provas') {
      loadMyTests();
    } else if (activeNavTab === 'minhas_pastas') {
      loadMyFolders();
    } else if (activeNavTab === 'meus_flashcards') {
      loadMyFlashcards();
      loadMyFlashcardFolders();
      loadMyFlashcardSessions();
    } else if (activeNavTab === 'admin_bancas' && isAdmin) {
      loadAllOrigins();
    } else if (activeNavTab === 'admin_areas' && isAdmin) {
      loadAllAreas();
    } else if (activeNavTab === 'admin_materias' && isAdmin) {
      loadAllSubjects();
      loadAllAreas();
    }
  }, [activeNavTab, userId, folderTypeTab]);

  const loadMyQuestionAttempts = async () => {
    if (!userId) return;
    setLoadingQuestionAttempts(true);
    try {
      const res = await getUserQuestionAttempts(userId);
      setMyQuestionAttempts(res);
    } catch (err) {
      console.error('Erro ao carregar histórico de questões do usuário:', err);
    } finally {
      setLoadingQuestionAttempts(false);
    }
  };

  const loadMyTestAttempts = async () => {
    if (!userId) return;
    setLoadingTestAttempts(true);
    try {
      const res = await getUserTestAttempts(userId);
      setMyTestAttempts(res);
    } catch (err) {
      console.error('Erro ao carregar tentativas de simulados do usuário:', err);
    } finally {
      setLoadingTestAttempts(false);
    }
  };

  const loadMyQuestions = async () => {
    if (!userId) return;
    setLoadingQuestions(true);
    try {
      const res = await getQuestions({ createdByUserId: userId, size: 100 });
      setMyQuestions(res.content || []);
    } catch (err) {
      console.error('Erro ao carregar questões do usuário:', err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const loadMyTests = async () => {
    if (!userId) return;
    setLoadingTests(true);
    try {
      const res = await getTests({ createdByUserId: userId });
      setMyTests(res);
    } catch (err) {
      console.error('Erro ao carregar provas do usuário:', err);
    } finally {
      setLoadingTests(false);
    }
  };

  const loadMyFolders = async () => {
    if (!userId) return;
    setLoadingFolders(true);
    try {
      const res = await getFolders(folderTypeTab, userId);
      setMyFolders(res);
    } catch (err) {
      console.error('Erro ao carregar pastas do usuário:', err);
    } finally {
      setLoadingFolders(false);
    }
  };

  const loadMyFlashcards = async () => {
    if (!userId) return;
    setLoadingFlashcards(true);
    try {
      const res = await getFlashcards({ createdByUserId: userId, size: 100 });
      setMyFlashcards(res.content || []);
    } catch (err) {
      console.error('Erro ao carregar flashcards do usuário:', err);
    } finally {
      setLoadingFlashcards(false);
    }
  };

  const loadMyFlashcardFolders = async () => {
    if (!userId) return;
    setLoadingFlashcardFolders(true);
    try {
      const res = await getFolders('FLASHCARD', userId);
      setMyFlashcardFolders(res);
    } catch (err) {
      console.error('Erro ao carregar decks de flashcards:', err);
    } finally {
      setLoadingFlashcardFolders(false);
    }
  };

  const loadMyFlashcardSessions = async () => {
    setLoadingFlashcardSessions(true);
    try {
      const res = await getUserFlashcardSessions(userId || undefined);
      setFlashcardSessions(res);
    } catch (err) {
      console.error('Erro ao carregar histórico de sessões de flashcards:', err);
    } finally {
      setLoadingFlashcardSessions(false);
    }
  };

  const loadMyTestSessions = async () => {
    setLoadingTestSessions(true);
    try {
      const res = await getUserTestSessions(userId || undefined);
      setTestSessions(res);
    } catch (err) {
      console.error('Erro ao carregar sessões de simulado:', err);
    } finally {
      setLoadingTestSessions(false);
    }
  };

  const loadMyQuestionSessions = async () => {
    setLoadingQuestionSessions(true);
    try {
      const res = await getUserQuestionSessions(userId || undefined);
      setQuestionSessions(res);
    } catch (err) {
      console.error('Erro ao carregar sessões de estudo de questões:', err);
    } finally {
      setLoadingQuestionSessions(false);
    }
  };

  const formatStudyDuration = (seconds?: number, includeSeconds = false): string => {
    if (!seconds || seconds <= 0) return includeSeconds ? '0s' : '0m';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remMins = mins % 60;
      if (includeSeconds) {
        return `${hours}h ${remMins}m ${secs}s`;
      }
      return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`;
    }
    if (mins > 0) {
      if (includeSeconds) {
        return `${mins}m ${secs}s`;
      }
      return `${mins}m`;
    }
    if (includeSeconds) {
      return `${secs}s`;
    }
    return seconds > 0 ? '< 1m' : '0m';
  };

  const handleToggleProfileCardFlip = (cardId: number) => {
    setFlippedProfileCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  const loadAllOrigins = async () => {
    setLoadingOrigins(true);
    try {
      const res = await getOrigins();
      setAllOrigins(res);
    } catch (err) {
      console.error('Erro ao carregar bancas:', err);
    } finally {
      setLoadingOrigins(false);
    }
  };

  const loadAllAreas = async () => {
    setLoadingAreas(true);
    try {
      const res = await getAreas();
      setAllAreas(res);
    } catch (err) {
      console.error('Erro ao carregar áreas:', err);
    } finally {
      setLoadingAreas(false);
    }
  };

  const loadAllSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const res = await getSubjects();
      setAllSubjects(res);
    } catch (err) {
      console.error('Erro ao carregar matérias:', err);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handlePromote = async () => {
    if (!userId) return;
    setPromoting(true);
    setActionSuccess(null);
    try {
      const updatedUser = await promoteUserToAdmin(userId);
      setActionSuccess(`${updatedUser.name} agora é um usuário ADMIN!`);
      if (currentUser && currentUser.id === updatedUser.id) {
        login(updatedUser);
      }
      fetchProfile();
    } catch (err: any) {
      setError('Falha ao promover usuário.');
    } finally {
      setPromoting(false);
    }
  };

  const handleCreateFolderSubmit = async () => {
    if (!newFolderName.trim()) return;
    setSavingFolder(true);
    try {
      await createFolder({
        name: newFolderName.trim(),
        description: newFolderDesc.trim() || undefined,
        color: newFolderColor,
        folderType: folderTypeTab,
        isPublic: newFolderIsPublic,
      });
      setNewFolderName('');
      setNewFolderDesc('');
      setNewFolderIsPublic(true);
      setOpenCreateFolderDialog(false);
      loadMyFolders();
    } catch (err) {
      console.error('Erro ao criar pasta:', err);
    } finally {
      setSavingFolder(false);
    }
  };

  const handleDeleteItem = (title: string, message: string, onConfirm: () => Promise<void>) => {
    setDeleteDialog({
      open: true,
      title,
      message,
      onConfirm,
    });
  };

  const confirmDeleteAction = async () => {
    setDeleting(true);
    try {
      await deleteDialog.onConfirm();
      setDeleteDialog((prev) => ({ ...prev, open: false }));
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Erro ao excluir item.');
    } finally {
      setDeleting(false);
    }
  };

  // Desempenho e Gráficos de Avaliação para Sessões de Estudo (Flashcards)
  const studyAreaPerformance = useMemo(() => {
    const map = new Map<string, { id?: number; name: string; totalCards: number; correctCount: number; wrongCount: number; skippedCount: number }>();

    if (profile?.flashcardStats?.performanceByArea && profile.flashcardStats.performanceByArea.length > 0) {
      for (const p of profile.flashcardStats.performanceByArea) {
        map.set(p.name, {
          id: p.id,
          name: p.name,
          totalCards: p.totalQuestions,
          correctCount: p.correctAnswers,
          wrongCount: Math.max(0, p.totalQuestions - p.correctAnswers),
          skippedCount: 0,
        });
      }
    }

    for (const session of flashcardSessions) {
      if (session.areaName) {
        const entry = map.get(session.areaName) || {
          id: session.areaId,
          name: session.areaName,
          totalCards: 0,
          correctCount: 0,
          wrongCount: 0,
          skippedCount: 0,
        };
        if (!profile?.flashcardStats?.performanceByArea?.length) {
          entry.totalCards += session.totalCards || (session.correctCount + session.wrongCount + session.skippedCount);
          entry.correctCount += session.correctCount;
          entry.wrongCount += session.wrongCount;
          entry.skippedCount += session.skippedCount;
        }
        map.set(session.areaName, entry);
      }
      if (session.items) {
        for (const item of session.items) {
          if (item.areaName && !session.areaName && !profile?.flashcardStats?.performanceByArea?.length) {
            const entry = map.get(item.areaName) || {
              name: item.areaName,
              totalCards: 0,
              correctCount: 0,
              wrongCount: 0,
              skippedCount: 0,
            };
            entry.totalCards++;
            if (item.status === 'CORRECT') entry.correctCount++;
            else if (item.status === 'WRONG') entry.wrongCount++;
            else entry.skippedCount++;
            map.set(item.areaName, entry);
          }
        }
      }
    }

    return Array.from(map.values()).map((e) => ({
      ...e,
      accuracy: e.totalCards > 0 ? (e.correctCount / e.totalCards) * 100 : 0,
    }));
  }, [profile?.flashcardStats?.performanceByArea, flashcardSessions]);

  const studySubjectPerformance = useMemo(() => {
    const map = new Map<string, { id?: number; name: string; totalCards: number; correctCount: number; wrongCount: number; skippedCount: number }>();

    if (profile?.flashcardStats?.performanceBySubject && profile.flashcardStats.performanceBySubject.length > 0) {
      for (const p of profile.flashcardStats.performanceBySubject) {
        map.set(p.name, {
          id: p.id,
          name: p.name,
          totalCards: p.totalQuestions,
          correctCount: p.correctAnswers,
          wrongCount: Math.max(0, p.totalQuestions - p.correctAnswers),
          skippedCount: 0,
        });
      }
    }

    for (const session of flashcardSessions) {
      if (session.subjectName) {
        const entry = map.get(session.subjectName) || {
          id: session.subjectId,
          name: session.subjectName,
          totalCards: 0,
          correctCount: 0,
          wrongCount: 0,
          skippedCount: 0,
        };
        if (!profile?.flashcardStats?.performanceBySubject?.length) {
          entry.totalCards += session.totalCards || (session.correctCount + session.wrongCount + session.skippedCount);
          entry.correctCount += session.correctCount;
          entry.wrongCount += session.wrongCount;
          entry.skippedCount += session.skippedCount;
        }
        map.set(session.subjectName, entry);
      }
      if (session.items) {
        for (const item of session.items) {
          if (item.subjectName && !session.subjectName && !profile?.flashcardStats?.performanceBySubject?.length) {
            const entry = map.get(item.subjectName) || {
              name: item.subjectName,
              totalCards: 0,
              correctCount: 0,
              wrongCount: 0,
              skippedCount: 0,
            };
            entry.totalCards++;
            if (item.status === 'CORRECT') entry.correctCount++;
            else if (item.status === 'WRONG') entry.wrongCount++;
            else entry.skippedCount++;
            map.set(item.subjectName, entry);
          }
        }
      }
    }

    return Array.from(map.values()).map((e) => ({
      ...e,
      accuracy: e.totalCards > 0 ? (e.correctCount / e.totalCards) * 100 : 0,
    }));
  }, [profile?.flashcardStats?.performanceBySubject, flashcardSessions]);

  const studyFolderPerformance = useMemo(() => {
    const map = new Map<string, { id?: number; name: string; totalCards: number; correctCount: number; wrongCount: number; skippedCount: number }>();

    for (const session of flashcardSessions) {
      const folderKey = session.folderName || 'Cards Avulsos';
      const entry = map.get(folderKey) || {
        id: session.folderId,
        name: folderKey,
        totalCards: 0,
        correctCount: 0,
        wrongCount: 0,
        skippedCount: 0,
      };
      entry.totalCards += session.totalCards || (session.correctCount + session.wrongCount + session.skippedCount);
      entry.correctCount += session.correctCount;
      entry.wrongCount += session.wrongCount;
      entry.skippedCount += session.skippedCount;
      map.set(folderKey, entry);
    }

    return Array.from(map.values()).map((e) => ({
      ...e,
      accuracy: e.totalCards > 0 ? (e.correctCount / e.totalCards) * 100 : 0,
    }));
  }, [flashcardSessions]);

  const currentStudyCategoryList = useMemo(() => {
    const list =
      studyCategoryTab === 0
        ? [...studyAreaPerformance]
        : studyCategoryTab === 1
        ? [...studySubjectPerformance]
        : [...studyFolderPerformance];

    if (studyCategorySortBy === 'accuracy') {
      return list.sort((a, b) => b.accuracy - a.accuracy || b.totalCards - a.totalCards);
    }
    return list.sort((a, b) => b.totalCards - a.totalCards || b.accuracy - a.accuracy);
  }, [studyCategoryTab, studyCategorySortBy, studyAreaPerformance, studySubjectPerformance, studyFolderPerformance]);

  // Médias de Tempo de Estudo Diário e Semanal
  const studyTimeAverages = useMemo(() => {
    const totalSeconds = flashcardSessions.reduce((acc, s) => acc + (s.timeSpentSeconds || 0), 0);
    const dayMap = new Map<string, number>();
    const weekMap = new Map<string, number>();

    for (const session of flashcardSessions) {
      if (!session.createdAt) continue;
      const date = new Date(session.createdAt);
      const dayKey = date.toLocaleDateString('en-CA');
      dayMap.set(dayKey, (dayMap.get(dayKey) || 0) + (session.timeSpentSeconds || 0));

      const d = new Date(date);
      const dayOfWeek = d.getDay();
      d.setDate(d.getDate() - dayOfWeek);
      const weekKey = d.toLocaleDateString('en-CA');
      weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + (session.timeSpentSeconds || 0));
    }

    const activeDaysCount = dayMap.size;
    const activeWeeksCount = weekMap.size;

    const avgDailySeconds = activeDaysCount > 0 ? Math.round(totalSeconds / activeDaysCount) : 0;
    const avgWeeklySeconds = activeWeeksCount > 0 ? Math.round(totalSeconds / activeWeeksCount) : 0;

    return {
      totalSeconds,
      activeDaysCount,
      activeWeeksCount,
      avgDailySeconds,
      avgWeeklySeconds,
    };
  }, [flashcardSessions]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error && !profile) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Usuário não encontrado.'}</Alert>
      </Box>
    );
  }

  if (!profile) return null;

  // Visualizador do Heatmap de 35 dias (Frequência Ativa: Questões + Flashcards)
  const activities = profile.dailyActivities || (profile as any).dailyActivity || [];
  const activityMap = new Map<string, DailyActivity>(activities.map((a: any) => [a.date, a]));

  const today = new Date();
  const days: {
    dateStr: string;
    count: number;
    questionsCount: number;
    flashcardsCount: number;
    flashcardSessionsCount: number;
  }[] = [];
  for (let i = 34; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const act = activityMap.get(dateStr);
    days.push({
      dateStr,
      count: act?.count || 0,
      questionsCount: act?.questionsCount || 0,
      flashcardsCount: act?.flashcardsCount || 0,
      flashcardSessionsCount: act?.flashcardSessionsCount || 0,
    });
  }

  const getHeatmapColor = (count: number) => {
    if (count === 0) return isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    if (count <= 2) return 'rgba(90, 166, 226, 0.35)';
    if (count <= 5) return 'rgba(90, 166, 226, 0.70)';
    return '#5aa6e2';
  };

  const getAccuracyColor = (acc: number) => {
    if (acc >= 70) return '#4bf151';
    if (acc >= 50) return '#d9b763';
    return '#fa424b';
  };

  const getSortedCategories = (items: CategoryPerformance[] = []) => {
    const copy = [...items];
    if (categorySortBy === 'accuracy') {
      return copy.sort((a, b) => b.accuracyPercentage - a.accuracyPercentage || b.totalQuestions - a.totalQuestions);
    }
    return copy.sort((a, b) => b.totalQuestions - a.totalQuestions || b.accuracyPercentage - a.accuracyPercentage);
  };

  const currentCategoryList =
    categoryTab === 0
      ? getSortedCategories(profile.performanceByArea)
      : categoryTab === 1
      ? getSortedCategories(profile.performanceBySubject)
      : getSortedCategories(profile.performanceByOrigin);

  const comparison = profile.comparison;

  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto', py: 3, px: { xs: 1, sm: 2 } }}>
      {actionSuccess && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setActionSuccess(null)}>
          {actionSuccess}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* ========================================================= */}
        {/* COLUNA LATERAL ESQUERDA: PERFIL & NAVEGAÇÃO */}
        {/* ========================================================= */}
        <Grid item xs={12} md={3.5} lg={3}>
          <Stack spacing={2.5}>
            {/* Card de Informações do Usuário */}
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 72,
                  height: 72,
                  mx: 'auto',
                  mb: 1.5,
                  bgcolor: 'secondary.main',
                  fontSize: 30,
                  fontWeight: 'bold',
                  boxShadow: 2,
                }}
              >
                {profile.name.charAt(0).toUpperCase()}
              </Avatar>

              <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                {profile.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {profile.email}
              </Typography>

              <Chip
                label={profile.role}
                color={profile.role === 'ADMIN' ? 'error' : 'secondary'}
                size="small"
                icon={profile.role === 'ADMIN' ? <AdminPanelSettingsIcon /> : <PersonIcon />}
                sx={{ fontWeight: 'bold', mb: 1.5 }}
              />

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Cadastrado em {new Date(profile.createdAt).toLocaleDateString()}
              </Typography>

              {(isOwner || isAdmin) && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => setOpenEditProfileModal(true)}
                  sx={{
                    mt: 2,
                    fontWeight: 'bold',
                    borderRadius: 2,
                    borderColor: PALETTE_COLORS.primary,
                    color: PALETTE_COLORS.primary,
                    '&:hover': {
                      borderColor: PALETTE_COLORS.primary,
                      backgroundColor: 'rgba(217, 183, 99, 0.1)',
                    },
                  }}
                  fullWidth
                >
                  Editar Perfil
                </Button>
              )}

              {currentUser?.role === 'ADMIN' && profile.role === 'GENERAL' && !isOwner && (
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  startIcon={<AdminPanelSettingsIcon />}
                  onClick={handlePromote}
                  disabled={promoting}
                  sx={{ mt: 1.5, fontWeight: 'bold', borderRadius: 2 }}
                  fullWidth
                >
                  {promoting ? 'Promovendo...' : 'Tornar ADMIN'}
                </Button>
              )}
            </Paper>

            {/* Menu de Navegação Lateral */}
            <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <List component="nav" sx={{ p: 1 }}>
                <ListItemButton
                  selected={activeNavTab === 'visao_geral'}
                  onClick={() => setActiveNavTab('visao_geral')}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    '&.Mui-selected': {
                      backgroundColor: isDark ? 'rgba(217, 183, 99, 0.15)' : 'rgba(217, 183, 99, 0.12)',
                      color: PALETTE_COLORS.primary,
                      fontWeight: 700,
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: activeNavTab === 'visao_geral' ? PALETTE_COLORS.primary : 'inherit' }}>
                    <BarChartIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Visão Geral" primaryTypographyProps={{ fontWeight: activeNavTab === 'visao_geral' ? 700 : 500 }} />
                </ListItemButton>

                <ListItemButton
                  selected={activeNavTab === 'questoes_respondidas'}
                  onClick={() => setActiveNavTab('questoes_respondidas')}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    '&.Mui-selected': {
                      backgroundColor: isDark ? 'rgba(217, 183, 99, 0.15)' : 'rgba(217, 183, 99, 0.12)',
                      color: PALETTE_COLORS.primary,
                      fontWeight: 700,
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: activeNavTab === 'questoes_respondidas' ? PALETTE_COLORS.primary : 'inherit' }}>
                    <HistoryIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Questões Respondidas" primaryTypographyProps={{ fontWeight: activeNavTab === 'questoes_respondidas' ? 700 : 500 }} />
                </ListItemButton>

                <ListItemButton
                  selected={activeNavTab === 'meus_simulados'}
                  onClick={() => setActiveNavTab('meus_simulados')}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    '&.Mui-selected': {
                      backgroundColor: isDark ? 'rgba(217, 183, 99, 0.15)' : 'rgba(217, 183, 99, 0.12)',
                      color: PALETTE_COLORS.primary,
                      fontWeight: 700,
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: activeNavTab === 'meus_simulados' ? PALETTE_COLORS.primary : 'inherit' }}>
                    <EmojiEventsIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Simulados Realizados" primaryTypographyProps={{ fontWeight: activeNavTab === 'meus_simulados' ? 700 : 500 }} />
                </ListItemButton>

                <ListItemButton
                  selected={activeNavTab === 'sessoes_estudo'}
                  onClick={() => setActiveNavTab('sessoes_estudo')}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    '&.Mui-selected': {
                      backgroundColor: isDark ? 'rgba(217, 183, 99, 0.15)' : 'rgba(217, 183, 99, 0.12)',
                      color: PALETTE_COLORS.primary,
                      fontWeight: 700,
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: activeNavTab === 'sessoes_estudo' ? PALETTE_COLORS.primary : 'inherit' }}>
                    <AccessTimeIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Sessões de Estudo" primaryTypographyProps={{ fontWeight: activeNavTab === 'sessoes_estudo' ? 700 : 500 }} />
                </ListItemButton>

                {(isOwner || isAdmin) && (
                  <>
                    <ListItemButton
                      selected={activeNavTab === 'minhas_questoes'}
                      onClick={() => setActiveNavTab('minhas_questoes')}
                      sx={{
                        borderRadius: 2,
                        mb: 0.5,
                        '&.Mui-selected': {
                          backgroundColor: isDark ? 'rgba(217, 183, 99, 0.15)' : 'rgba(217, 183, 99, 0.12)',
                          color: PALETTE_COLORS.primary,
                          fontWeight: 700,
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, color: activeNavTab === 'minhas_questoes' ? PALETTE_COLORS.primary : 'inherit' }}>
                        <QuizOutlinedIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Minhas Questões" primaryTypographyProps={{ fontWeight: activeNavTab === 'minhas_questoes' ? 700 : 500 }} />
                    </ListItemButton>

                    <ListItemButton
                      selected={activeNavTab === 'minhas_provas'}
                      onClick={() => setActiveNavTab('minhas_provas')}
                      sx={{
                        borderRadius: 2,
                        mb: 0.5,
                        '&.Mui-selected': {
                          backgroundColor: isDark ? 'rgba(217, 183, 99, 0.15)' : 'rgba(217, 183, 99, 0.12)',
                          color: PALETTE_COLORS.primary,
                          fontWeight: 700,
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, color: activeNavTab === 'minhas_provas' ? PALETTE_COLORS.primary : 'inherit' }}>
                        <MenuBookOutlinedIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Minhas Provas" primaryTypographyProps={{ fontWeight: activeNavTab === 'minhas_provas' ? 700 : 500 }} />
                    </ListItemButton>

                    <ListItemButton
                      selected={activeNavTab === 'minhas_pastas'}
                      onClick={() => setActiveNavTab('minhas_pastas')}
                      sx={{
                        borderRadius: 2,
                        mb: 0.5,
                        '&.Mui-selected': {
                          backgroundColor: isDark ? 'rgba(217, 183, 99, 0.15)' : 'rgba(217, 183, 99, 0.12)',
                          color: PALETTE_COLORS.primary,
                          fontWeight: 700,
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, color: activeNavTab === 'minhas_pastas' ? PALETTE_COLORS.primary : 'inherit' }}>
                        <FolderSpecialOutlinedIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Minhas Pastas" primaryTypographyProps={{ fontWeight: activeNavTab === 'minhas_pastas' ? 700 : 500 }} />
                    </ListItemButton>

                    <ListItemButton
                      selected={activeNavTab === 'meus_flashcards'}
                      onClick={() => setActiveNavTab('meus_flashcards')}
                      sx={{
                        borderRadius: 2,
                        mb: 0.5,
                        '&.Mui-selected': {
                          backgroundColor: isDark ? 'rgba(217, 183, 99, 0.15)' : 'rgba(217, 183, 99, 0.12)',
                          color: PALETTE_COLORS.primary,
                          fontWeight: 700,
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, color: activeNavTab === 'meus_flashcards' ? PALETTE_COLORS.primary : 'inherit' }}>
                        <StyleOutlinedIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Meus Flashcards" primaryTypographyProps={{ fontWeight: activeNavTab === 'meus_flashcards' ? 700 : 500 }} />
                    </ListItemButton>
                  </>
                )}

                {/* Seção de Administração - Apenas para ADMIN */}
                {isAdmin && (
                  <>
                    <Divider sx={{ my: 1.5 }} />
                    <ListSubheader
                      sx={{
                        backgroundColor: 'transparent',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        letterSpacing: 1.2,
                        color: 'text.secondary',
                        lineHeight: '28px',
                      }}
                    >
                      ADMINISTRAÇÃO
                    </ListSubheader>

                    <ListItemButton
                      selected={activeNavTab === 'admin_bancas'}
                      onClick={() => setActiveNavTab('admin_bancas')}
                      sx={{
                        borderRadius: 2,
                        mb: 0.5,
                        '&.Mui-selected': {
                          backgroundColor: isDark ? 'rgba(217, 183, 99, 0.15)' : 'rgba(217, 183, 99, 0.12)',
                          color: PALETTE_COLORS.primary,
                          fontWeight: 700,
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, color: activeNavTab === 'admin_bancas' ? PALETTE_COLORS.primary : 'inherit' }}>
                        <AccountBalanceIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Gerenciar Bancas" primaryTypographyProps={{ fontWeight: activeNavTab === 'admin_bancas' ? 700 : 500 }} />
                    </ListItemButton>

                    <ListItemButton
                      selected={activeNavTab === 'admin_areas'}
                      onClick={() => setActiveNavTab('admin_areas')}
                      sx={{
                        borderRadius: 2,
                        mb: 0.5,
                        '&.Mui-selected': {
                          backgroundColor: isDark ? 'rgba(217, 183, 99, 0.15)' : 'rgba(217, 183, 99, 0.12)',
                          color: PALETTE_COLORS.primary,
                          fontWeight: 700,
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, color: activeNavTab === 'admin_areas' ? PALETTE_COLORS.primary : 'inherit' }}>
                        <CategoryIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Gerenciar Áreas" primaryTypographyProps={{ fontWeight: activeNavTab === 'admin_areas' ? 700 : 500 }} />
                    </ListItemButton>

                    <ListItemButton
                      selected={activeNavTab === 'admin_materias'}
                      onClick={() => setActiveNavTab('admin_materias')}
                      sx={{
                        borderRadius: 2,
                        mb: 0.5,
                        '&.Mui-selected': {
                          backgroundColor: isDark ? 'rgba(217, 183, 99, 0.15)' : 'rgba(217, 183, 99, 0.12)',
                          color: PALETTE_COLORS.primary,
                          fontWeight: 700,
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, color: activeNavTab === 'admin_materias' ? PALETTE_COLORS.primary : 'inherit' }}>
                        <ClassIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Gerenciar Matérias" primaryTypographyProps={{ fontWeight: activeNavTab === 'admin_materias' ? 700 : 500 }} />
                    </ListItemButton>
                  </>
                )}
              </List>
            </Paper>
          </Stack>
        </Grid>

        {/* ========================================================= */}
        {/* COLUNA PRINCIPAL DIREITA: CONTEÚDO DA ABA ATIVA */}
        {/* ========================================================= */}
        <Grid item xs={12} md={8.5} lg={9}>
          {/* ABA 0: VISÃO GERAL & ESTATÍSTICAS */}
          {activeNavTab === 'visao_geral' && (
            <Stack spacing={3}>
              {/* Card de Desempenho Competitivo (Top % dos Estudantes) */}
              {comparison && (
                <Paper
                  elevation={5}
                  sx={{
                    p: { xs: 3, md: 4 },
                    borderRadius: 3,
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1.5px solid',
                    borderColor: PALETTE_COLORS.primary,
                    background: isDark
                      ? 'linear-gradient(135deg, rgba(217, 183, 99, 0.12) 0%, rgba(22, 26, 32, 0.95) 100%)'
                      : 'linear-gradient(135deg, rgba(217, 183, 99, 0.15) 0%, rgba(255, 255, 255, 0.95) 100%)',
                  }}
                >
                  <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={7}>
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(217, 183, 99, 0.2)',
                            color: PALETTE_COLORS.primary,
                          }}
                        >
                          <EmojiEventsIcon fontSize="large" />
                        </Box>
                        <Box>
                          <Typography variant="overline" sx={{ fontWeight: 800, color: PALETTE_COLORS.primary, letterSpacing: 1.2 }}>
                            POSICIONAMENTO GLOBAL NA PLATAFORMA
                          </Typography>
                          <Typography variant="h5" fontWeight="bold">
                            Você está no{' '}
                            <Box component="span" sx={{ color: PALETTE_COLORS.primary, fontWeight: 900 }}>
                              Top {comparison.topPercentage}%
                            </Box>{' '}
                            dos estudantes
                          </Typography>
                        </Box>
                      </Stack>

                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                        Seu desempenho supera <strong>{comparison.percentileRank}%</strong> de todos os estudantes cadastrados. Posição no ranking:{' '}
                        <strong>#{comparison.userRank}</strong> de <strong>{comparison.totalUsers}</strong> usuários.
                      </Typography>

                      {/* Barra de Percentil */}
                      <Box sx={{ width: '100%', mr: 1, mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" fontWeight="bold" color="text.secondary">
                            0% (Iniciante)
                          </Typography>
                          <Typography variant="caption" fontWeight="bold" sx={{ color: PALETTE_COLORS.primary }}>
                            Percentil {comparison.percentileRank}%
                          </Typography>
                          <Typography variant="caption" fontWeight="bold" color="text.secondary">
                            Top 1% (Elite)
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(100, Math.max(5, comparison.percentileRank))}
                          sx={{
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: PALETTE_COLORS.primary,
                              borderRadius: 5,
                            },
                          }}
                        />
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={5}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2.5,
                          borderRadius: 2.5,
                          border: '1px solid',
                          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                          backgroundColor: isDark ? 'rgba(26, 30, 36, 0.7)' : 'rgba(255, 255, 255, 0.8)',
                        }}
                      >
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TrendingUpIcon color="secondary" fontSize="small" /> Comparativo com a Média da Plataforma
                        </Typography>

                        <Stack spacing={2}>
                          <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2" color="text.secondary">
                                Sua Taxa de Acerto:
                              </Typography>
                              <Typography variant="body2" fontWeight="bold" sx={{ color: getAccuracyColor(comparison.userAccuracy) }}>
                                {comparison.userAccuracy.toFixed(1)}%
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                Média Global dos Usuários:
                              </Typography>
                              <Typography variant="caption" fontWeight="bold" color="text.secondary">
                                {comparison.globalAverageAccuracy.toFixed(1)}%
                              </Typography>
                            </Box>
                          </Box>

                          <Divider />

                          <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2" color="text.secondary">
                                Suas Questões Resolvidas:
                              </Typography>
                              <Typography variant="body2" fontWeight="bold" color="primary">
                                {comparison.userTotalResolved}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                Média de Questões por Usuário:
                              </Typography>
                              <Typography variant="caption" fontWeight="bold" color="text.secondary">
                                {comparison.globalAverageResolved.toFixed(1)}
                              </Typography>
                            </Box>
                          </Box>
                        </Stack>
                      </Paper>
                    </Grid>
                  </Grid>
                </Paper>
              )}

              {/* Cards de Estatísticas Gerais - Alinhamento Perfeito com CSS Grid */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(4, 1fr)',
                  },
                  gap: 2.5,
                  width: '100%',
                }}
              >
                <Card elevation={3} sx={{ textAlign: 'center', py: 2, borderRadius: 2.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <CardContent sx={{ pb: '16px !important' }}>
                    <Typography variant="h3" fontWeight="bold" color="primary">
                      {profile.totalResolved ?? 0}
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Questões Resolvidas
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {profile.totalCorrectAnswers ?? 0} acertos no total
                    </Typography>
                  </CardContent>
                </Card>

                <Card elevation={3} sx={{ textAlign: 'center', py: 2, borderRadius: 2.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <CardContent sx={{ pb: '16px !important' }}>
                    <Typography variant="h3" fontWeight="bold" sx={{ color: '#4bf151' }}>
                      {(profile.easyAccuracy ?? 0).toFixed(1)}%
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Acerto em Fáceis
                    </Typography>
                    <Box sx={{ width: '80%', mx: 'auto', mt: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={profile.easyAccuracy ?? 0}
                        sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(75, 241, 81, 0.15)', '& .MuiLinearProgress-bar': { bgcolor: '#4bf151' } }}
                      />
                    </Box>
                  </CardContent>
                </Card>

                <Card elevation={3} sx={{ textAlign: 'center', py: 2, borderRadius: 2.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <CardContent sx={{ pb: '16px !important' }}>
                    <Typography variant="h3" fontWeight="bold" sx={{ color: '#f3ff3d' }}>
                      {(profile.mediumAccuracy ?? 0).toFixed(1)}%
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Acerto em Médias
                    </Typography>
                    <Box sx={{ width: '80%', mx: 'auto', mt: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={profile.mediumAccuracy ?? 0}
                        sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(243, 255, 61, 0.15)', '& .MuiLinearProgress-bar': { bgcolor: '#f3ff3d' } }}
                      />
                    </Box>
                  </CardContent>
                </Card>

                <Card elevation={3} sx={{ textAlign: 'center', py: 2, borderRadius: 2.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <CardContent sx={{ pb: '16px !important' }}>
                    <Typography variant="h3" fontWeight="bold" sx={{ color: '#fa424b' }}>
                      {(profile.hardAccuracy ?? 0).toFixed(1)}%
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Acerto em Difíceis
                    </Typography>
                    <Box sx={{ width: '80%', mx: 'auto', mt: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={profile.hardAccuracy ?? 0}
                        sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(250, 66, 75, 0.15)', '& .MuiLinearProgress-bar': { bgcolor: '#fa424b' } }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Box>

              {/* Painel de Métricas de Flashcards & Sessões de Estudo */}
              {(() => {
                const fcStats = profile.flashcardStats;
                const totalSessions = fcStats?.totalSessions ?? flashcardSessions.length;
                const totalSeconds = fcStats?.totalTimeSpentSeconds ?? flashcardSessions.reduce((acc, s) => acc + (s.timeSpentSeconds || 0), 0);
                const totalCards = fcStats?.totalCardsStudied ?? flashcardSessions.reduce((acc, s) => acc + (s.totalCards || 0), 0);
                const totalCorrect = fcStats?.totalCorrect ?? flashcardSessions.reduce((acc, s) => acc + (s.correctCount || 0), 0);
                const totalWrong = fcStats?.totalWrong ?? flashcardSessions.reduce((acc, s) => acc + (s.wrongCount || 0), 0);
                const totalSkipped = fcStats?.totalSkipped ?? flashcardSessions.reduce((acc, s) => acc + (s.skippedCount || 0), 0);
                const accuracy = fcStats?.generalAccuracyPercentage != null
                  ? fcStats.generalAccuracyPercentage
                  : totalCards > 0 ? Math.round((totalCorrect / totalCards) * 100) : 0;

                return (
                  <Paper elevation={4} sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <StyleOutlinedIcon color="primary" />
                          <Typography variant="h6" fontWeight="bold">
                            Sessões de Estudo & Flashcards
                          </Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          Métricas consolidadas de estudo ativo, tempo dedicado e taxa de aproveitamento em flashcards.
                        </Typography>
                      </Box>

                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<HistoryIcon />}
                          onClick={() => setActiveNavTab('sessoes_estudo')}
                          sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
                        >
                          Ver Histórico Completo
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<PlayArrowIcon />}
                          onClick={() => navigate('/flashcards')}
                          sx={{
                            textTransform: 'none',
                            borderRadius: 2,
                            fontWeight: 700,
                            backgroundColor: PALETTE_COLORS.primary,
                            color: '#1a1e24',
                            '&:hover': { backgroundColor: '#c4a251' },
                          }}
                        >
                          Praticar Flashcards
                        </Button>
                      </Stack>
                    </Box>

                    {/* 6 Cards com flex-wrap para responsividade e respiração */}
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 2,
                        width: '100%',
                        mb: 3,
                      }}
                    >
                      <Paper
                        variant="outlined"
                        sx={{
                          flex: {
                            xs: '1 1 100%',
                            sm: '1 1 calc(50% - 16px)',
                            md: '1 1 calc(33.333% - 16px)',
                            xl: '1 1 calc(16.666% - 16px)',
                          },
                          minWidth: { xs: '100%', sm: 180 },
                          p: 2.5,
                          borderRadius: 2.5,
                          backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          Sessões Realizadas
                        </Typography>
                        <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5, color: PALETTE_COLORS.primary }}>
                          {totalSessions}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          execuções finalizadas
                        </Typography>
                      </Paper>

                      <Paper
                        variant="outlined"
                        sx={{
                          flex: {
                            xs: '1 1 100%',
                            sm: '1 1 calc(50% - 16px)',
                            md: '1 1 calc(33.333% - 16px)',
                            xl: '1 1 calc(16.666% - 16px)',
                          },
                          minWidth: { xs: '100%', sm: 180 },
                          p: 2.5,
                          borderRadius: 2.5,
                          backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          Tempo Total Respondido
                        </Typography>
                        <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
                          {formatStudyDuration(totalSeconds)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          em estudo ativo
                        </Typography>
                      </Paper>

                      <Paper
                        variant="outlined"
                        sx={{
                          flex: {
                            xs: '1 1 100%',
                            sm: '1 1 calc(50% - 16px)',
                            md: '1 1 calc(33.333% - 16px)',
                            xl: '1 1 calc(16.666% - 16px)',
                          },
                          minWidth: { xs: '100%', sm: 180 },
                          p: 2.5,
                          borderRadius: 2.5,
                          backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          Média Diária
                        </Typography>
                        <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
                          {formatStudyDuration(studyTimeAverages.avgDailySeconds)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          por dia ativo
                        </Typography>
                      </Paper>

                      <Paper
                        variant="outlined"
                        sx={{
                          flex: {
                            xs: '1 1 100%',
                            sm: '1 1 calc(50% - 16px)',
                            md: '1 1 calc(33.333% - 16px)',
                            xl: '1 1 calc(16.666% - 16px)',
                          },
                          minWidth: { xs: '100%', sm: 180 },
                          p: 2.5,
                          borderRadius: 2.5,
                          backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          Média Semanal
                        </Typography>
                        <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
                          {formatStudyDuration(studyTimeAverages.avgWeeklySeconds)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          por semana ativa
                        </Typography>
                      </Paper>

                      <Paper
                        variant="outlined"
                        sx={{
                          flex: {
                            xs: '1 1 100%',
                            sm: '1 1 calc(50% - 16px)',
                            md: '1 1 calc(33.333% - 16px)',
                            xl: '1 1 calc(16.666% - 16px)',
                          },
                          minWidth: { xs: '100%', sm: 180 },
                          p: 2.5,
                          borderRadius: 2.5,
                          backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          Cards Praticados
                        </Typography>
                        <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
                          {totalCards}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {totalCorrect} acertos • {totalWrong} erros
                          {totalSkipped > 0 ? ` • ${totalSkipped} pulados` : ''}
                        </Typography>
                      </Paper>

                      <Paper
                        variant="outlined"
                        sx={{
                          flex: {
                            xs: '1 1 100%',
                            sm: '1 1 calc(50% - 16px)',
                            md: '1 1 calc(33.333% - 16px)',
                            xl: '1 1 calc(16.666% - 16px)',
                          },
                          minWidth: { xs: '100%', sm: 180 },
                          p: 2.5,
                          borderRadius: 2.5,
                          backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          Taxa Média de Acerto
                        </Typography>
                        <Typography
                          variant="h4"
                          fontWeight={800}
                          sx={{
                            mt: 0.5,
                            color: accuracy >= 70 ? PALETTE_COLORS.success : PALETTE_COLORS.primary,
                          }}
                        >
                          {accuracy.toFixed(1)}%
                        </Typography>
                        <Box sx={{ width: '100%', mt: 0.5 }}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(100, accuracy)}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: accuracy >= 70 ? PALETTE_COLORS.success : PALETTE_COLORS.primary,
                              },
                            }}
                          />
                        </Box>
                      </Paper>
                    </Box>

                    {/* Gráfico de Linhas e Calendário Integrados em Visão Geral */}
                    <Box sx={{ mt: 2 }}>
                      <Tabs
                        value={overviewStudyVisualTab}
                        onChange={(_, val) => setOverviewStudyVisualTab(val)}
                        sx={{
                          mb: 2,
                          borderBottom: 1,
                          borderColor: 'divider',
                          '& .MuiTab-root': { fontWeight: 'bold', textTransform: 'none', fontSize: '0.9rem' },
                        }}
                      >
                        <Tab icon={<ShowChartIcon fontSize="small" />} iconPosition="start" label="Evolução (Gráfico de Linhas)" />
                        <Tab icon={<CalendarMonthIcon fontSize="small" />} iconPosition="start" label="Calendário de Estudos" />
                      </Tabs>

                      {overviewStudyVisualTab === 0 ? (
                        <StudySessionLineChart
                          sessions={flashcardSessions}
                          isDark={isDark}
                          formatStudyDuration={formatStudyDuration}
                        />
                      ) : (
                        <StudySessionCalendar
                          sessions={flashcardSessions}
                          isDark={isDark}
                          formatStudyDuration={formatStudyDuration}
                          onSelectSession={(s) => setSelectedSessionDetail(s)}
                        />
                      )}
                    </Box>
                  </Paper>
                );
              })()}

              {/* Painel Interativo de Análise por Categorias */}
              <Paper elevation={4} sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <BarChartIcon color="secondary" />
                      <Typography variant="h6" fontWeight="bold">
                        Análise Interativa de Desempenho
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      Acompanhe sua taxa de acerto detalhada agrupada por área, matéria ou banca.
                    </Typography>
                  </Box>

                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<SortIcon />}
                    onClick={() => setCategorySortBy((prev) => (prev === 'resolved' ? 'accuracy' : 'resolved'))}
                    sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
                  >
                    Ordenar: {categorySortBy === 'resolved' ? 'Mais Resolvidas' : 'Maior Taxa de Acerto'}
                  </Button>
                </Box>

                <Tabs
                  value={categoryTab}
                  onChange={(_, val) => setCategoryTab(val)}
                  variant="scrollable"
                  scrollButtons="auto"
                  allowScrollButtonsMobile
                  sx={{
                    mb: 3,
                    borderBottom: 1,
                    borderColor: 'divider',
                    '& .MuiTab-root': { fontWeight: 'bold', textTransform: 'none', fontSize: '0.95rem' },
                  }}
                >
                  <Tab icon={<CategoryIcon fontSize="small" />} iconPosition="start" label={`Áreas (${profile.performanceByArea?.length ?? 0})`} />
                  <Tab icon={<ClassIcon fontSize="small" />} iconPosition="start" label={`Matérias (${profile.performanceBySubject?.length ?? 0})`} />
                  <Tab icon={<AccountBalanceIcon fontSize="small" />} iconPosition="start" label={`Bancas (${profile.performanceByOrigin?.length ?? 0})`} />
                </Tabs>

                {currentCategoryList.length === 0 ? (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Nenhuma questão resolvida nesta categoria até o momento.
                  </Alert>
                ) : (
                  <Stack spacing={2}>
                    {currentCategoryList.map((cat) => {
                      const accColor = getAccuracyColor(cat.accuracyPercentage);
                      return (
                        <Box
                          key={cat.id || cat.name}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: PALETTE_COLORS.secondary,
                              backgroundColor: isDark ? 'rgba(90, 166, 226, 0.05)' : 'rgba(90, 166, 226, 0.03)',
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {cat.name}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip
                                size="small"
                                label={`${cat.totalQuestions} resolvida(s)`}
                                variant="outlined"
                                sx={{ fontWeight: 600 }}
                              />
                              <Chip
                                size="small"
                                label={`${cat.correctAnswers} acerto(s)`}
                                sx={{ fontWeight: 600, bgcolor: 'rgba(75, 241, 81, 0.15)', color: '#4bf151' }}
                              />
                              <Typography variant="h6" fontWeight="900" sx={{ color: accColor, minWidth: 65, textAlign: 'right' }}>
                                {cat.accuracyPercentage.toFixed(1)}%
                              </Typography>
                            </Stack>
                          </Box>

                          <Tooltip title={`Acurácia: ${cat.accuracyPercentage.toFixed(1)}% (${cat.correctAnswers}/${cat.totalQuestions})`} arrow>
                            <LinearProgress
                              variant="determinate"
                              value={cat.accuracyPercentage}
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: accColor,
                                  borderRadius: 4,
                                },
                              }}
                            />
                          </Tooltip>
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </Paper>

              {/* Histórico Diário (Heatmap) */}
              <Paper elevation={4} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <CheckCircleOutlineIcon color="secondary" />
                  <Typography variant="h6" fontWeight="bold">
                    Frequência Diária de Estudos
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Exibindo a frequência de estudos dos últimos 35 dias (questões respondidas e sessões de flashcards).
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'flex-start' }}>
                  {days.map((d) => {
                    let tooltipTitle = `${d.dateStr}: Nenhuma atividade realizada`;
                    if (d.count > 0) {
                      const details: string[] = [];
                      if (d.questionsCount > 0) details.push(`${d.questionsCount} questão(ões)`);
                      if (d.flashcardsCount > 0) details.push(`${d.flashcardsCount} flashcard(s)`);
                      else if (d.flashcardSessionsCount > 0) details.push(`${d.flashcardSessionsCount} sessão(ões) de flashcard`);
                      tooltipTitle = `${d.dateStr}: ${d.count} atividade(s) realizada(s)` + (details.length > 0 ? ` (${details.join(', ')})` : '');
                    }
                    return (
                      <Tooltip
                        key={d.dateStr}
                        title={tooltipTitle}
                        arrow
                      >
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: 0.5,
                            backgroundColor: getHeatmapColor(d.count),
                            border: `1px solid ${theme.palette.divider}`,
                            transition: 'transform 0.1s',
                            '&:hover': {
                              transform: 'scale(1.2)',
                              borderColor: '#5aa6e2',
                            },
                          }}
                        />
                      </Tooltip>
                    );
                  })}
                </Box>
              </Paper>
            </Stack>
          )}

          {/* ABA: HISTÓRICO DE QUESTÕES RESPONDIDAS */}
          {activeNavTab === 'questoes_respondidas' && (
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    Questões Respondidas
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Histórico completo de tentativas, alternativas assinaladas, acertos e revisões de gabarito.
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  onClick={() => navigate('/questoes')}
                  sx={{ fontWeight: 700 }}
                >
                  Resolver Mais Questões
                </Button>
              </Box>

              {/* Filtros e Busca */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }} alignItems="center">
                <TextField
                  placeholder="Buscar por enunciado, matéria, área, banca ou ano..."
                  size="small"
                  fullWidth
                  value={questionAttemptSearch}
                  onChange={(e) => setQuestionAttemptSearch(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />

                <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                  <Chip
                    label={`Todas (${myQuestionAttempts.length})`}
                    clickable
                    color={questionAttemptFilter === 'ALL' ? 'primary' : 'default'}
                    variant={questionAttemptFilter === 'ALL' ? 'filled' : 'outlined'}
                    onClick={() => setQuestionAttemptFilter('ALL')}
                    sx={{ fontWeight: 700 }}
                  />
                  <Chip
                    label={`Acertos (${myQuestionAttempts.filter((a) => a.isCorrect).length})`}
                    clickable
                    color={questionAttemptFilter === 'CORRECT' ? 'success' : 'default'}
                    variant={questionAttemptFilter === 'CORRECT' ? 'filled' : 'outlined'}
                    onClick={() => setQuestionAttemptFilter('CORRECT')}
                    sx={{ fontWeight: 700 }}
                  />
                  <Chip
                    label={`Erros (${myQuestionAttempts.filter((a) => !a.isCorrect).length})`}
                    clickable
                    color={questionAttemptFilter === 'WRONG' ? 'error' : 'default'}
                    variant={questionAttemptFilter === 'WRONG' ? 'filled' : 'outlined'}
                    onClick={() => setQuestionAttemptFilter('WRONG')}
                    sx={{ fontWeight: 700 }}
                  />
                </Stack>
              </Stack>

              {loadingQuestionAttempts ? (
                <ListItemsSkeleton count={4} />
              ) : myQuestionAttempts.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    Nenhuma questão respondida até o momento.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/questoes')}
                    sx={{ backgroundColor: PALETTE_COLORS.primary, color: '#1a1e24', fontWeight: 700 }}
                  >
                    Ir para o Banco de Questões
                  </Button>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {myQuestionAttempts
                    .filter((att) => {
                      if (questionAttemptFilter === 'CORRECT' && !att.isCorrect) return false;
                      if (questionAttemptFilter === 'WRONG' && att.isCorrect) return false;

                      if (!questionAttemptSearch.trim()) return true;
                      const term = questionAttemptSearch.toLowerCase();
                      const matchEnunciado = att.questionEnunciado?.toLowerCase().includes(term);
                      const matchIdent = att.questionIdentifier?.toLowerCase().includes(term);
                      const matchOrigin = att.originName?.toLowerCase().includes(term);
                      const matchSubject = att.subjectName?.toLowerCase().includes(term);
                      const matchArea = att.areaName?.toLowerCase().includes(term);
                      const matchYear = att.year ? String(att.year).includes(term) : false;
                      return matchEnunciado || matchIdent || matchOrigin || matchSubject || matchArea || matchYear;
                    })
                    .map((att) => {
                      const mins = Math.floor((att.timeSpentSeconds || 0) / 60);
                      const secs = (att.timeSpentSeconds || 0) % 60;
                      const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                      const formattedDate = att.createdAt
                        ? new Date(att.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '';

                      return (
                        <Paper
                          key={att.id}
                          variant="outlined"
                          sx={{
                            p: 2.5,
                            borderRadius: 2.5,
                            borderLeft: `5px solid ${att.isCorrect ? PALETTE_COLORS.success : PALETTE_COLORS.danger}`,
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: PALETTE_COLORS.primary,
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1.5, mb: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {att.questionIdentifier ? `Questão ${att.questionIdentifier}` : `Questão #${att.questionId}`}
                              </Typography>
                              {att.year && (
                                <Chip label={att.year} size="small" variant="outlined" sx={{ height: 22, fontWeight: 600 }} />
                              )}
                              {att.originName && (
                                <Chip label={att.originName} size="small" sx={{ height: 22, fontWeight: 600, backgroundColor: 'action.hover' }} />
                              )}
                              {att.areaName && (
                                <Chip label={att.areaName} size="small" variant="outlined" sx={{ height: 22, fontWeight: 600 }} />
                              )}
                              {att.subjectName && (
                                <Chip label={att.subjectName} size="small" sx={{ height: 22, fontWeight: 600, backgroundColor: 'action.hover' }} />
                              )}
                            </Box>

                            <Chip
                              icon={att.isCorrect ? <CheckCircleOutlineIcon fontSize="inherit" /> : <CancelOutlinedIcon fontSize="inherit" />}
                              label={att.isCorrect ? 'Acertou' : 'Errou'}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                backgroundColor: att.isCorrect
                                  ? 'rgba(75, 241, 81, 0.15)'
                                  : 'rgba(250, 66, 75, 0.15)',
                                color: att.isCorrect
                                  ? PALETTE_COLORS.success
                                  : PALETTE_COLORS.danger,
                                border: '1px solid',
                                borderColor: att.isCorrect
                                  ? PALETTE_COLORS.success
                                  : PALETTE_COLORS.danger,
                              }}
                            />
                          </Box>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              mb: 2,
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: 1.6,
                            }}
                          >
                            {stripRichTextMarkup(att.questionEnunciado)}
                          </Typography>

                          {/* Comparativo de Resposta */}
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 1.5,
                              mb: 2,
                              borderRadius: 2,
                              backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                            }}
                          >
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 90 }}>
                                  Sua resposta:
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 600,
                                    color: att.isCorrect ? PALETTE_COLORS.success : PALETTE_COLORS.danger,
                                  }}
                                >
                                  {att.selectedAlternativeLetter
                                    ? `Alternativa (${att.selectedAlternativeLetter})`
                                    : 'Nenhuma selecionada'}{' '}
                                  {att.selectedAlternativeText && `— ${stripRichTextMarkup(att.selectedAlternativeText)}`}
                                </Typography>
                              </Box>

                              {!att.isCorrect && att.correctAlternativeLetter && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                  <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 90, color: PALETTE_COLORS.success }}>
                                    Gabarito correto:
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: PALETTE_COLORS.success }}>
                                    Alternativa ({att.correctAlternativeLetter})
                                    {att.correctAlternativeText && ` — ${stripRichTextMarkup(att.correctAlternativeText)}`}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Paper>

                          {/* Rodapé do Card */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                              <Typography variant="caption" color="text.secondary">
                                Respondida em: {formattedDate}
                              </Typography>
                              {att.timeSpentSeconds !== undefined && att.timeSpentSeconds !== null && (
                                <Typography variant="caption" color="text.secondary">
                                  • Tempo: {timeStr}
                                </Typography>
                              )}
                              {att.isFirstAttempt && (
                                <Chip label="1ª Tentativa" size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                              )}
                            </Box>

                            <Stack direction="row" spacing={1}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => navigate(`/questoes/${att.questionId}`)}
                                sx={{ textTransform: 'none', fontWeight: 600 }}
                              >
                                Ver no Banco de Questões
                              </Button>
                            </Stack>
                          </Box>
                        </Paper>
                      );
                    })}
                </Stack>
              )}
            </Paper>
          )}

          {/* ABA: MEUS SIMULADOS REALIZADOS */}
          {activeNavTab === 'meus_simulados' && (
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    Simulados Realizados
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Histórico de avaliações completas, notas, tempo gasto e revisão de gabarito.
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  onClick={() => navigate('/provas')}
                  sx={{ fontWeight: 700 }}
                >
                  Fazer Novo Simulado
                </Button>
              </Box>

              {/* Simulados em Andamento */}
              {(() => {
                const incompleteTestSessions = testSessions.filter((s) => !s.completed);
                if (incompleteTestSessions.length === 0) return null;
                return (
                  <Stack spacing={2} sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight={800} sx={{ color: PALETTE_COLORS.primary }}>
                      Simulados em Andamento ({incompleteTestSessions.length})
                    </Typography>
                    {incompleteTestSessions.map((session) => {
                      const answered = session.items?.filter((i) => i.selectedAlternativeId != null).length || 0;
                      const total = session.totalQuestions || (session.items?.length || 0);
                      const percent = total > 0 ? Math.round((answered / total) * 100) : 0;
                      return (
                        <Paper
                          key={session.id}
                          elevation={2}
                          sx={{
                            p: 2.5,
                            borderRadius: 2.5,
                            border: '1.5px solid',
                            borderColor: PALETTE_COLORS.primary,
                            background: isDark
                              ? 'linear-gradient(90deg, rgba(217, 183, 99, 0.12) 0%, rgba(26, 30, 36, 0.95) 100%)'
                              : 'linear-gradient(90deg, rgba(217, 183, 99, 0.15) 0%, rgba(255, 255, 255, 0.95) 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 2,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box
                              sx={{
                                p: 1.2,
                                borderRadius: '50%',
                                bgcolor: 'rgba(217, 183, 99, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <AccessTimeIcon sx={{ color: PALETTE_COLORS.primary, fontSize: 28 }} />
                            </Box>
                            <Box>
                              <Typography variant="subtitle1" fontWeight={800}>
                                {session.testName || `Simulado #${session.testId}`}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {answered} de {total} questões respondidas ({percent}%) • Tempo decorrido: {formatStudyDuration(session.timeSpentSeconds, true)}
                              </Typography>
                            </Box>
                          </Box>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Button
                              variant="contained"
                              startIcon={<PlayArrowIcon />}
                              onClick={() => navigate(`/provas/${session.testId}/avaliacao?sessionId=${session.id}`)}
                              sx={{
                                fontWeight: 700,
                                backgroundColor: PALETTE_COLORS.primary,
                                color: '#1a1e24',
                              }}
                            >
                              Continuar Simulado
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              startIcon={<DeleteOutlineIcon />}
                              onClick={async () => {
                                if (window.confirm('Deseja realmente descartar este simulado em andamento?')) {
                                  try {
                                    await deleteTestSession(session.id);
                                    loadMyTestSessions();
                                  } catch (e) {
                                    console.error('Erro ao descartar sessão de simulado:', e);
                                  }
                                }
                              }}
                              sx={{ fontWeight: 700 }}
                            >
                              Descartar
                            </Button>
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Stack>
                );
              })()}

              <TextField
                placeholder="Buscar por prova, banca ou ano..."
                size="small"
                fullWidth
                value={testAttemptSearch}
                onChange={(e) => setTestAttemptSearch(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{ mb: 3 }}
              />

              {loadingTestAttempts ? (
                <ListItemsSkeleton count={4} />
              ) : myTestAttempts.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    Nenhum simulado realizado até o momento.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/provas')}
                    sx={{ backgroundColor: PALETTE_COLORS.primary, color: '#1a1e24', fontWeight: 700 }}
                  >
                    Ir para Provas & Simulados
                  </Button>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {myTestAttempts
                    .filter((att) => {
                      if (!testAttemptSearch.trim()) return true;
                      const term = testAttemptSearch.toLowerCase();
                      const matchName = att.testName?.toLowerCase().includes(term);
                      const matchOrigin = att.originName?.toLowerCase().includes(term);
                      const matchArea = att.areaName?.toLowerCase().includes(term);
                      const matchYear = att.testYear ? String(att.testYear).includes(term) : false;
                      return matchName || matchOrigin || matchArea || matchYear;
                    })
                    .map((att) => {
                      const mins = Math.floor((att.timeSpentSeconds || 0) / 60);
                      const secs = (att.timeSpentSeconds || 0) % 60;
                      const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                      const formattedDate = att.createdAt
                        ? new Date(att.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '';

                      return (
                        <Paper
                          key={att.id}
                          variant="outlined"
                          sx={{
                            p: 2.5,
                            borderRadius: 2.5,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 2,
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: PALETTE_COLORS.primary,
                            },
                          }}
                        >
                          <Box sx={{ flexGrow: 1, minWidth: 240 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                              <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.05rem' }}>
                                {att.testName || `Prova #${att.testId}`}
                              </Typography>
                              {att.testYear && (
                                <Chip label={att.testYear} size="small" variant="outlined" sx={{ height: 22, fontWeight: 600 }} />
                              )}
                              {att.originName && (
                                <Chip label={att.originName} size="small" sx={{ height: 22, fontWeight: 600, backgroundColor: 'action.hover' }} />
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                              <Typography variant="caption" color="text.secondary">
                                Realizado em: {formattedDate}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                • Tempo: {timeStr}
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                {att.correctAnswers} / {att.totalQuestions} acertos
                              </Typography>
                              <Chip
                                label={`${att.scorePercentage}%`}
                                size="small"
                                sx={{
                                  fontWeight: 800,
                                  backgroundColor:
                                    att.scorePercentage >= 60
                                      ? 'rgba(75, 241, 81, 0.15)'
                                      : 'rgba(250, 66, 75, 0.15)',
                                  color:
                                    att.scorePercentage >= 60
                                      ? PALETTE_COLORS.success
                                      : PALETTE_COLORS.danger,
                                  border: '1px solid',
                                  borderColor:
                                    att.scorePercentage >= 60
                                      ? PALETTE_COLORS.success
                                      : PALETTE_COLORS.danger,
                                }}
                              />
                            </Box>

                            <Stack direction="row" spacing={1}>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={
                                  loadingShareAttemptId === att.id ? (
                                    <CircularProgress size={14} color="inherit" />
                                  ) : (
                                    <ShareIcon />
                                  )
                                }
                                disabled={loadingShareAttemptId === att.id}
                                onClick={() => handleOpenShareAttempt(att)}
                                sx={{
                                  borderColor: PALETTE_COLORS.primary,
                                  color: PALETTE_COLORS.primary,
                                  fontWeight: 700,
                                  textTransform: 'none',
                                  borderRadius: 2,
                                  px: 1.5,
                                  '&:hover': {
                                    borderColor: PALETTE_COLORS.primary,
                                    backgroundColor: 'rgba(217, 183, 99, 0.1)',
                                  },
                                }}
                              >
                                Exportar CSV
                              </Button>
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => navigate(`/provas/${att.testId}/tentativas/${att.id}`)}
                                sx={{
                                  backgroundColor: PALETTE_COLORS.primary,
                                  color: '#1a1e24',
                                  fontWeight: 800,
                                  textTransform: 'none',
                                  borderRadius: 2,
                                  px: 2,
                                  '&:hover': {
                                    backgroundColor: '#c4a251',
                                  },
                                }}
                              >
                                Rever Gabarito
                              </Button>
                            </Stack>
                          </Box>
                        </Paper>
                      );
                    })}
                </Stack>
              )}
            </Paper>
          )}

          {/* ABA: SESSÕES DE ESTUDO */}
          {activeNavTab === 'sessoes_estudo' && (
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    Sessões de Estudo
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Histórico completo de sessões de estudo de questões e flashcards, com tempo decorrido e desempenho.
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1.5} flexWrap="wrap">
                  <Button
                    variant="contained"
                    startIcon={<PlayArrowIcon />}
                    onClick={() => navigate('/questoes/estudo')}
                    sx={{
                      fontWeight: 700,
                      backgroundColor: PALETTE_COLORS.primary,
                      color: '#1a1e24',
                      textTransform: 'none',
                      borderRadius: 2,
                    }}
                  >
                    Estudar Questões
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<FlipCameraAndroidIcon />}
                    onClick={() => navigate('/flashcards')}
                    sx={{
                      fontWeight: 700,
                      textTransform: 'none',
                      borderRadius: 2,
                    }}
                  >
                    Praticar Flashcards
                  </Button>
                </Stack>
              </Box>

              {/* Banner de Sessão de Questões em Andamento */}
              {(() => {
                const incompleteQ = questionSessions.filter((s) => !s.completed);
                if (incompleteQ.length === 0) return null;
                const latest = incompleteQ[0];
                const answered = (latest.correctCount || 0) + (latest.wrongCount || 0) + (latest.skippedCount || 0);
                return (
                  <Paper
                    elevation={3}
                    sx={{
                      p: 2.5,
                      mb: 3,
                      borderRadius: 2.5,
                      border: '1.5px solid',
                      borderColor: PALETTE_COLORS.primary,
                      background: isDark
                        ? 'linear-gradient(90deg, rgba(217, 183, 99, 0.15) 0%, rgba(26, 30, 36, 0.95) 100%)'
                        : 'linear-gradient(90deg, rgba(217, 183, 99, 0.2) 0%, rgba(255, 255, 255, 0.95) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          p: 1.2,
                          borderRadius: '50%',
                          bgcolor: 'rgba(217, 183, 99, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <QuizOutlinedIcon sx={{ color: PALETTE_COLORS.primary, fontSize: 28 }} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={800}>
                          {incompleteQ.length === 1
                            ? 'Você possui 1 sessão de estudo de questões em andamento!'
                            : `Você possui ${incompleteQ.length} sessões de estudo de questões em andamento!`}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {latest.title || 'Estudo de Questões'} • {answered} de {latest.totalQuestions} questões praticadas ({formatStudyDuration(latest.timeSpentSeconds, true)})
                        </Typography>
                      </Box>
                    </Box>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Button
                        variant="contained"
                        startIcon={<PlayArrowIcon />}
                        onClick={() => navigate(`/questoes/estudo?sessionId=${latest.id}`)}
                        sx={{
                          fontWeight: 700,
                          backgroundColor: PALETTE_COLORS.primary,
                          color: '#1a1e24',
                        }}
                      >
                        Continuar Estudo
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteOutlineIcon />}
                        onClick={async () => {
                          if (window.confirm('Deseja descartar esta sessão de estudo de questões?')) {
                            try {
                              await deleteQuestionSession(latest.id);
                              loadMyQuestionSessions();
                            } catch (e) {
                              console.error('Erro ao descartar sessão de questões:', e);
                            }
                          }
                        }}
                        sx={{ fontWeight: 700 }}
                      >
                        Descartar
                      </Button>
                    </Stack>
                  </Paper>
                );
              })()}

              {/* Banner de Sessão em Andamento */}
              {(() => {
                const incompleteSessions = flashcardSessions.filter((s) => s.completed === false);
                if (incompleteSessions.length === 0) return null;
                const latestIncomplete = incompleteSessions[0];
                const answeredCount = (latestIncomplete.correctCount || 0) + (latestIncomplete.wrongCount || 0) + (latestIncomplete.skippedCount || 0);

                return (
                  <Paper
                    elevation={3}
                    sx={{
                      p: 2.5,
                      mb: 3,
                      borderRadius: 2.5,
                      border: '1.5px solid',
                      borderColor: PALETTE_COLORS.primary,
                      background: isDark
                        ? 'linear-gradient(90deg, rgba(217, 183, 99, 0.15) 0%, rgba(26, 30, 36, 0.95) 100%)'
                        : 'linear-gradient(90deg, rgba(217, 183, 99, 0.2) 0%, rgba(255, 255, 255, 0.95) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          p: 1.2,
                          borderRadius: '50%',
                          bgcolor: 'rgba(217, 183, 99, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <AccessTimeIcon sx={{ color: PALETTE_COLORS.primary, fontSize: 28 }} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={800}>
                          {incompleteSessions.length === 1
                            ? 'Você possui 1 estudo em andamento!'
                            : `Você possui ${incompleteSessions.length} estudos em andamento!`}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {latestIncomplete.folderName
                            ? `Deck: ${latestIncomplete.folderName}`
                            : latestIncomplete.subjectName
                            ? `Matéria: ${latestIncomplete.subjectName}`
                            : 'Cards Avulsos'}{' '}
                          • {answeredCount} de {latestIncomplete.totalCards} cards praticados ({formatStudyDuration(latestIncomplete.timeSpentSeconds)})
                        </Typography>
                      </Box>
                    </Box>

                    <Button
                      variant="contained"
                      startIcon={<PlayArrowIcon />}
                      onClick={() => navigate(`/flashcards/estudo?sessionId=${latestIncomplete.id}`)}
                      sx={{
                        fontWeight: 800,
                        backgroundColor: PALETTE_COLORS.primary,
                        color: '#1a1e24',
                        borderRadius: 2,
                        px: 3,
                        py: 1,
                        textTransform: 'none',
                        '&:hover': {
                          backgroundColor: '#c4a251',
                        },
                      }}
                    >
                      Retomar Estudo
                    </Button>
                  </Paper>
                );
              })()}

              {/* Cards de Resumo Métrico */}
              {(() => {
                const totalSessions = flashcardSessions.length;
                const totalSeconds = flashcardSessions.reduce((acc, s) => acc + (s.timeSpentSeconds || 0), 0);
                const totalCards = flashcardSessions.reduce(
                  (acc, s) =>
                    acc +
                    (s.completed !== false
                      ? s.totalCards || 0
                      : (s.correctCount || 0) + (s.wrongCount || 0) + (s.skippedCount || 0)),
                  0
                );
                const totalCorrect = flashcardSessions.reduce((acc, s) => acc + (s.correctCount || 0), 0);
                const totalWrong = flashcardSessions.reduce((acc, s) => acc + (s.wrongCount || 0), 0);
                const avgAccuracy = totalCards > 0 ? Math.round((totalCorrect / totalCards) * 100) : 0;

                return (
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 2,
                      width: '100%',
                      mb: 3,
                    }}
                  >
                    <Paper
                      variant="outlined"
                      sx={{
                        flex: {
                          xs: '1 1 100%',
                          sm: '1 1 calc(50% - 16px)',
                          md: '1 1 calc(33.333% - 16px)',
                          xl: '1 1 calc(16.666% - 16px)',
                        },
                        minWidth: { xs: '100%', sm: 180 },
                        p: 2.5,
                        borderRadius: 2.5,
                        backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Sessões Realizadas
                      </Typography>
                      <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5, color: PALETTE_COLORS.primary }}>
                        {totalSessions}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        execuções finalizadas
                      </Typography>
                    </Paper>

                    <Paper
                      variant="outlined"
                      sx={{
                        flex: {
                          xs: '1 1 100%',
                          sm: '1 1 calc(50% - 16px)',
                          md: '1 1 calc(33.333% - 16px)',
                          xl: '1 1 calc(16.666% - 16px)',
                        },
                        minWidth: { xs: '100%', sm: 180 },
                        p: 2.5,
                        borderRadius: 2.5,
                        backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Tempo Total Respondido
                      </Typography>
                      <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
                        {formatStudyDuration(totalSeconds)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        tempo em estudo ativo
                      </Typography>
                    </Paper>

                    <Paper
                      variant="outlined"
                      sx={{
                        flex: {
                          xs: '1 1 100%',
                          sm: '1 1 calc(50% - 16px)',
                          md: '1 1 calc(33.333% - 16px)',
                          xl: '1 1 calc(16.666% - 16px)',
                        },
                        minWidth: { xs: '100%', sm: 180 },
                        p: 2.5,
                        borderRadius: 2.5,
                        backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Média Diária
                      </Typography>
                      <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
                        {formatStudyDuration(studyTimeAverages.avgDailySeconds)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        por dia ativo
                      </Typography>
                    </Paper>

                    <Paper
                      variant="outlined"
                      sx={{
                        flex: {
                          xs: '1 1 100%',
                          sm: '1 1 calc(50% - 16px)',
                          md: '1 1 calc(33.333% - 16px)',
                          xl: '1 1 calc(16.666% - 16px)',
                        },
                        minWidth: { xs: '100%', sm: 180 },
                        p: 2.5,
                        borderRadius: 2.5,
                        backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Média Semanal
                      </Typography>
                      <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
                        {formatStudyDuration(studyTimeAverages.avgWeeklySeconds)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        por semana ativa
                      </Typography>
                    </Paper>

                    <Paper
                      variant="outlined"
                      sx={{
                        flex: {
                          xs: '1 1 100%',
                          sm: '1 1 calc(50% - 16px)',
                          md: '1 1 calc(33.333% - 16px)',
                          xl: '1 1 calc(16.666% - 16px)',
                        },
                        minWidth: { xs: '100%', sm: 180 },
                        p: 2.5,
                        borderRadius: 2.5,
                        backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Cards Praticados
                      </Typography>
                      <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
                        {totalCards}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {totalCorrect} acertos • {totalWrong} erros
                      </Typography>
                    </Paper>

                    <Paper
                      variant="outlined"
                      sx={{
                        flex: {
                          xs: '1 1 100%',
                          sm: '1 1 calc(50% - 16px)',
                          md: '1 1 calc(33.333% - 16px)',
                          xl: '1 1 calc(16.666% - 16px)',
                        },
                        minWidth: { xs: '100%', sm: 180 },
                        p: 2.5,
                        borderRadius: 2.5,
                        backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Taxa Média de Acerto
                      </Typography>
                      <Typography
                        variant="h5"
                        fontWeight={800}
                        sx={{
                          mt: 0.5,
                          color: avgAccuracy >= 70 ? PALETTE_COLORS.success : PALETTE_COLORS.primary,
                        }}
                      >
                        {avgAccuracy}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        aproveitamento global
                      </Typography>
                      <Box sx={{ width: '100%', mt: 0.5 }}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(100, avgAccuracy)}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: avgAccuracy >= 70 ? PALETTE_COLORS.success : PALETTE_COLORS.primary,
                            },
                          }}
                        />
                      </Box>
                    </Paper>
                  </Box>
                );
              })()}

              {/* Gráfico de Linhas: Evolução do Estudo */}
              <StudySessionLineChart
                sessions={flashcardSessions}
                isDark={isDark}
                formatStudyDuration={formatStudyDuration}
              />

              {/* Calendário de Estudos com Métricas Diárias */}
              <StudySessionCalendar
                sessions={flashcardSessions}
                isDark={isDark}
                formatStudyDuration={formatStudyDuration}
                onSelectSession={(s) => setSelectedSessionDetail(s)}
              />

              {/* Painel Interativo de Avaliação de Desempenho em Flashcards */}
              <Paper elevation={4} sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <BarChartIcon color="secondary" />
                      <Typography variant="h6" fontWeight="bold">
                        Avaliação Gráfica de Desempenho
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      Acompanhe sua taxa de retenção e acertos agrupados por área, matéria ou deck de flashcards.
                    </Typography>
                  </Box>

                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<SortIcon />}
                    onClick={() => setStudyCategorySortBy((prev) => (prev === 'studied' ? 'accuracy' : 'studied'))}
                    sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
                  >
                    Ordenar: {studyCategorySortBy === 'studied' ? 'Mais Praticados' : 'Maior Taxa de Acerto'}
                  </Button>
                </Box>

                {/* Barra de Distribuição de Retenção Global */}
                {(() => {
                  const totalCards = flashcardSessions.reduce((acc, s) => acc + (s.totalCards || 0), 0);
                  const totalCorrect = flashcardSessions.reduce((acc, s) => acc + (s.correctCount || 0), 0);
                  const totalWrong = flashcardSessions.reduce((acc, s) => acc + (s.wrongCount || 0), 0);
                  const totalSkipped = flashcardSessions.reduce((acc, s) => acc + (s.skippedCount || 0), 0);
                  const correctPct = totalCards > 0 ? (totalCorrect / totalCards) * 100 : 0;
                  const wrongPct = totalCards > 0 ? (totalWrong / totalCards) * 100 : 0;
                  const skippedPct = totalCards > 0 ? (totalSkipped / totalCards) * 100 : 0;

                  return (
                    <Box sx={{ mb: 4, p: 2, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                        <Typography variant="subtitle2" fontWeight={700}>
                          Distribuição Geral de Respostas
                        </Typography>
                        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: PALETTE_COLORS.success }} />
                            <Typography variant="caption" color="text.secondary">
                              Acertos: <b>{totalCorrect}</b> ({correctPct.toFixed(1)}%)
                            </Typography>
                          </Stack>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: '#f44336' }} />
                            <Typography variant="caption" color="text.secondary">
                              Erros: <b>{totalWrong}</b> ({wrongPct.toFixed(1)}%)
                            </Typography>
                          </Stack>
                          {totalSkipped > 0 && (
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: 'text.disabled' }} />
                              <Typography variant="caption" color="text.secondary">
                                Pulados: <b>{totalSkipped}</b> ({skippedPct.toFixed(1)}%)
                              </Typography>
                            </Stack>
                          )}
                        </Stack>
                      </Box>

                      {/* Segmented bar */}
                      <Tooltip
                        title={`Total: ${totalCards} cards | Acertos: ${totalCorrect} (${correctPct.toFixed(1)}%) | Erros: ${totalWrong} (${wrongPct.toFixed(1)}%) ${totalSkipped > 0 ? `| Pulados: ${totalSkipped} (${skippedPct.toFixed(1)}%)` : ''}`}
                        arrow
                      >
                        <Box
                          sx={{
                            height: 12,
                            borderRadius: 6,
                            overflow: 'hidden',
                            display: 'flex',
                            width: '100%',
                            bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                          }}
                        >
                          {totalCards === 0 ? (
                            <Box sx={{ width: '100%', height: '100%', bgcolor: 'action.disabledBackground' }} />
                          ) : (
                            <>
                              <Box sx={{ width: `${correctPct}%`, height: '100%', bgcolor: PALETTE_COLORS.success, transition: 'width 0.4s' }} />
                              <Box sx={{ width: `${wrongPct}%`, height: '100%', bgcolor: '#f44336', transition: 'width 0.4s' }} />
                              <Box sx={{ width: `${skippedPct}%`, height: '100%', bgcolor: 'rgba(160, 160, 160, 0.6)', transition: 'width 0.4s' }} />
                            </>
                          )}
                        </Box>
                      </Tooltip>
                    </Box>
                  );
                })()}

                <Tabs
                  value={studyCategoryTab}
                  onChange={(_, val) => setStudyCategoryTab(val)}
                  variant="scrollable"
                  scrollButtons="auto"
                  allowScrollButtonsMobile
                  sx={{
                    mb: 3,
                    borderBottom: 1,
                    borderColor: 'divider',
                    '& .MuiTab-root': { fontWeight: 'bold', textTransform: 'none', fontSize: '0.95rem' },
                  }}
                >
                  <Tab icon={<CategoryIcon fontSize="small" />} iconPosition="start" label={`Áreas (${studyAreaPerformance.length})`} />
                  <Tab icon={<ClassIcon fontSize="small" />} iconPosition="start" label={`Matérias (${studySubjectPerformance.length})`} />
                  <Tab icon={<FolderSpecialOutlinedIcon fontSize="small" />} iconPosition="start" label={`Decks (${studyFolderPerformance.length})`} />
                </Tabs>

                {currentStudyCategoryList.length === 0 ? (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Nenhuma sessão de estudo concluída nesta categoria até o momento.
                  </Alert>
                ) : (
                  <Stack spacing={2}>
                    {currentStudyCategoryList.map((cat) => {
                      const accColor = getAccuracyColor(cat.accuracy);
                      return (
                        <Box
                          key={cat.id || cat.name}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: PALETTE_COLORS.secondary,
                              backgroundColor: isDark ? 'rgba(90, 166, 226, 0.05)' : 'rgba(90, 166, 226, 0.03)',
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {cat.name}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip
                                size="small"
                                label={`${cat.totalCards} cards`}
                                variant="outlined"
                                sx={{ fontWeight: 600 }}
                              />
                              <Chip
                                size="small"
                                label={`${cat.correctCount} acertos`}
                                sx={{ fontWeight: 600, bgcolor: 'rgba(75, 241, 81, 0.15)', color: '#4bf151' }}
                              />
                              {cat.wrongCount > 0 && (
                                <Chip
                                  size="small"
                                  label={`${cat.wrongCount} erros`}
                                  sx={{ fontWeight: 600, bgcolor: 'rgba(244, 67, 54, 0.15)', color: '#f44336' }}
                                />
                              )}
                              <Typography variant="h6" fontWeight="900" sx={{ color: accColor, minWidth: 65, textAlign: 'right' }}>
                                {cat.accuracy.toFixed(1)}%
                              </Typography>
                            </Stack>
                          </Box>

                          <Tooltip title={`Aproveitamento: ${cat.accuracy.toFixed(1)}% (${cat.correctCount}/${cat.totalCards})`} arrow>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(100, cat.accuracy)}
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: accColor,
                                  borderRadius: 4,
                                },
                              }}
                            />
                          </Tooltip>
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </Paper>

              {/* Barra de Filtro e Busca */}
              <TextField
                placeholder="Buscar por pasta/deck, área ou matéria..."
                size="small"
                fullWidth
                value={flashcardSessionSearch}
                onChange={(e) => setFlashcardSessionSearch(e.target.value)}
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Lista de Sessões */}
              {loadingFlashcardSessions ? (
                <ListItemsSkeleton count={4} />
              ) : (
                (() => {
                  const filtered = flashcardSessions.filter((s) => {
                    if (!flashcardSessionSearch.trim()) return true;
                    const q = flashcardSessionSearch.toLowerCase();
                    const folderMatch = s.folderName ? s.folderName.toLowerCase().includes(q) : false;
                    const areaMatch = s.areaName ? s.areaName.toLowerCase().includes(q) : false;
                    const subjectMatch = s.subjectName ? s.subjectName.toLowerCase().includes(q) : false;
                    return folderMatch || areaMatch || subjectMatch;
                  });

                  if (filtered.length === 0) {
                    return (
                      <Box sx={{ textAlign: 'center', py: 6 }}>
                        <StyleOutlinedIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1, opacity: 0.5 }} />
                        <Typography color="text.secondary" sx={{ mb: 2 }}>
                          {flashcardSessionSearch.trim()
                            ? 'Nenhuma sessão encontrada para a busca informada.'
                            : 'Nenhuma sessão de estudo realizada ainda.'}
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<PlayArrowIcon />}
                          onClick={() => navigate('/flashcards')}
                          sx={{
                            fontWeight: 700,
                            backgroundColor: PALETTE_COLORS.primary,
                            color: '#1a1e24',
                            textTransform: 'none',
                            borderRadius: 2,
                          }}
                        >
                          Começar a Praticar Flashcards
                        </Button>
                      </Box>
                    );
                  }

                  return (
                    <Stack spacing={2}>
                      {filtered.map((session) => {
                        const isCompleted = session.completed !== false;
                        const answeredCount = (session.correctCount || 0) + (session.wrongCount || 0) + (session.skippedCount || 0);
                        const total = isCompleted ? (session.totalCards || answeredCount) : (session.totalCards || answeredCount);
                        const accuracy = session.accuracyPercentage != null
                          ? Math.round(session.accuracyPercentage)
                          : answeredCount > 0 ? Math.round(((session.correctCount || 0) / answeredCount) * 100) : 0;
                        const durationStr = formatStudyDuration(session.timeSpentSeconds);
                        const dateFormatted = new Date(session.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        return (
                          <Paper
                            key={session.id}
                            variant="outlined"
                            sx={{
                              p: 2.5,
                              borderRadius: 2.5,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: 2,
                              transition: 'all 0.2s',
                              borderColor: !isCompleted ? PALETTE_COLORS.primary : undefined,
                              backgroundColor: !isCompleted
                                ? (isDark ? 'rgba(217, 183, 99, 0.04)' : 'rgba(217, 183, 99, 0.03)')
                                : undefined,
                              '&:hover': {
                                boxShadow: 2,
                                borderColor: PALETTE_COLORS.primary,
                              },
                            }}
                          >
                            <Box sx={{ minWidth: 240 }}>
                              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 1, gap: 0.5 }}>
                                {!isCompleted ? (
                                  <Chip
                                    size="small"
                                    icon={<AccessTimeIcon fontSize="small" />}
                                    label="Em andamento"
                                    sx={{
                                      fontWeight: 800,
                                      backgroundColor: isDark ? 'rgba(217, 183, 99, 0.2)' : 'rgba(217, 183, 99, 0.25)',
                                      color: PALETTE_COLORS.primary,
                                      border: '1px solid',
                                      borderColor: PALETTE_COLORS.primary,
                                    }}
                                  />
                                ) : (
                                  <Chip
                                    size="small"
                                    icon={<CheckCircleIcon fontSize="small" />}
                                    label="Concluída"
                                    sx={{
                                      fontWeight: 700,
                                      backgroundColor: 'rgba(75, 241, 81, 0.12)',
                                      color: PALETTE_COLORS.success,
                                    }}
                                  />
                                )}
                                {session.folderName ? (
                                  <Chip
                                    size="small"
                                    icon={<FolderSpecialOutlinedIcon fontSize="small" />}
                                    label={session.folderName}
                                    sx={{
                                      fontWeight: 700,
                                      backgroundColor: 'rgba(217, 183, 99, 0.15)',
                                      color: PALETTE_COLORS.primary,
                                    }}
                                  />
                                ) : (
                                  <Chip
                                    size="small"
                                    icon={<StyleOutlinedIcon fontSize="small" />}
                                    label="Cards Avulsos"
                                    variant="outlined"
                                    sx={{ fontWeight: 700 }}
                                  />
                                )}
                                {session.areaName && (
                                  <Chip
                                    size="small"
                                    label={`Área: ${session.areaName}`}
                                    variant="outlined"
                                    sx={{
                                      fontWeight: 600,
                                      borderColor: PALETTE_COLORS.primary,
                                      color: PALETTE_COLORS.primary,
                                    }}
                                  />
                                )}
                                {session.subjectName && (
                                  <Chip
                                    size="small"
                                    label={`Matéria: ${session.subjectName}`}
                                    variant="outlined"
                                    sx={{ fontWeight: 600 }}
                                  />
                                )}
                                <Typography variant="caption" color="text.secondary">
                                  {dateFormatted}
                                </Typography>
                              </Stack>

                              <Typography
                                variant="body2"
                                sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.8 }}
                              >
                                <AccessTimeIcon fontSize="small" sx={{ fontSize: 16, color: PALETTE_COLORS.primary }} />
                                Tempo {!isCompleted ? 'Até o Momento' : 'Respondido'}: <strong>{durationStr}</strong>
                              </Typography>
                              {!isCompleted && (
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mt: 0.5 }}>
                                  Progresso: <strong>{answeredCount} de {total} cards respondidos ({total > 0 ? Math.round((answeredCount / total) * 100) : 0}%)</strong>
                                </Typography>
                              )}
                            </Box>

                            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                              <Chip
                                size="small"
                                label={`${isCompleted ? total : `${answeredCount}/${total}`} cards`}
                                sx={{ fontWeight: 600 }}
                              />
                              <Chip
                                size="small"
                                label={`${session.correctCount} acertos`}
                                sx={{
                                  fontWeight: 700,
                                  backgroundColor: 'rgba(75, 241, 81, 0.12)',
                                  color: PALETTE_COLORS.success,
                                }}
                              />
                              <Chip
                                size="small"
                                label={`${session.wrongCount} erros`}
                                sx={{
                                  fontWeight: 700,
                                  backgroundColor: 'rgba(250, 66, 75, 0.12)',
                                  color: PALETTE_COLORS.danger,
                                }}
                              />
                              {session.skippedCount > 0 && (
                                <Chip
                                  size="small"
                                  label={`${session.skippedCount} pulados`}
                                  variant="outlined"
                                  sx={{ fontWeight: 600 }}
                                />
                              )}
                              <Chip
                                size="small"
                                label={`${accuracy}% acerto`}
                                sx={{
                                  fontWeight: 800,
                                  backgroundColor:
                                    accuracy >= 70
                                      ? 'rgba(75, 241, 81, 0.15)'
                                      : 'rgba(217, 183, 99, 0.15)',
                                  color:
                                    accuracy >= 70
                                      ? PALETTE_COLORS.success
                                      : PALETTE_COLORS.primary,
                                }}
                              />

                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<VisibilityIcon fontSize="small" />}
                                onClick={() => setSelectedSessionDetail(session)}
                                sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                              >
                                Ver Detalhes
                              </Button>

                              {!isCompleted ? (
                                <>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    startIcon={<PlayArrowIcon fontSize="small" />}
                                    onClick={() => navigate(`/flashcards/estudo?sessionId=${session.id}`)}
                                    sx={{
                                      borderRadius: 2,
                                      fontWeight: 800,
                                      textTransform: 'none',
                                      backgroundColor: PALETTE_COLORS.primary,
                                      color: '#1a1e24',
                                      '&:hover': {
                                        backgroundColor: '#c4a251',
                                      },
                                    }}
                                  >
                                    Retomar Estudo
                                  </Button>

                                  <Tooltip title="Descartar estudo incompleto">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => setSessionToDiscard(session)}
                                      sx={{ border: '1px solid', borderColor: 'divider' }}
                                    >
                                      <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              ) : (
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<PlayArrowIcon fontSize="small" />}
                                  onClick={() => {
                                    const params = new URLSearchParams();
                                    if (session.folderId) params.set('folderId', session.folderId.toString());
                                    if (session.areaId) params.set('areaId', session.areaId.toString());
                                    if (session.subjectId) params.set('subjectId', session.subjectId.toString());
                                    navigate(`/flashcards/estudo?${params.toString()}`);
                                  }}
                                  sx={{
                                    borderRadius: 2,
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    backgroundColor: PALETTE_COLORS.primary,
                                    color: '#1a1e24',
                                    '&:hover': {
                                      backgroundColor: '#c4a251',
                                    },
                                  }}
                                >
                                  Estudar Novamente
                                </Button>
                              )}
                            </Stack>
                          </Paper>
                        );
                      })}
                    </Stack>
                  );
                })()
              )}
            </Paper>
          )}

          {/* ABA 1: MINHAS QUESTÕES */}
          {activeNavTab === 'minhas_questoes' && (
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    Minhas Questões
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total de questões criadas: {myQuestions.length}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenCreateQuestion(true)}
                  sx={{ fontWeight: 700, backgroundColor: PALETTE_COLORS.primary, color: '#1a1e24' }}
                >
                  Nova Questão
                </Button>
              </Box>

              <TextField
                placeholder="Buscar em minhas questões..."
                size="small"
                fullWidth
                value={questionSearch}
                onChange={(e) => setQuestionSearch(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{ mb: 3 }}
              />

              {loadingQuestions ? (
                <ListItemsSkeleton count={4} />
              ) : myQuestions.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    Você ainda não cadastrou nenhuma questão.
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenCreateQuestion(true)}
                  >
                    Cadastrar Primeira Questão
                  </Button>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {myQuestions
                    .filter((q) =>
                      questionSearch
                        ? q.enunciado.toLowerCase().includes(questionSearch.toLowerCase()) ||
                          (q.identifier && q.identifier.toLowerCase().includes(questionSearch.toLowerCase()))
                        : true
                    )
                    .map((q) => (
                      <Paper
                        key={q.id}
                        variant="outlined"
                        sx={{
                          p: 2.5,
                          borderRadius: 2,
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          justifyContent: 'space-between',
                          alignItems: { xs: 'flex-start', sm: 'center' },
                          gap: 2,
                          '&:hover': {
                            borderColor: PALETTE_COLORS.primary,
                          },
                        }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                            <Chip
                              label={q.identifier ? `Questão ${q.identifier}` : `#${q.id}`}
                              size="small"
                              color="primary"
                              sx={{ fontWeight: 'bold' }}
                            />
                            {q.createdByUser && (
                              <Chip
                                size="small"
                                icon={<PersonOutlineIcon fontSize="small" />}
                                label={`Adicionado por ${q.createdByUser.name}`}
                                component={Link}
                                to={`/perfil/${q.createdByUser.id}`}
                                clickable
                                sx={{
                                  backgroundColor: isDark ? 'rgba(90, 166, 226, 0.12)' : 'rgba(90, 166, 226, 0.15)',
                                  color: PALETTE_COLORS.secondary,
                                  fontWeight: 600,
                                  border: '1px solid',
                                  borderColor: isDark ? 'rgba(90, 166, 226, 0.3)' : 'rgba(90, 166, 226, 0.4)',
                                  '&:hover': {
                                    backgroundColor: isDark ? 'rgba(90, 166, 226, 0.25)' : 'rgba(90, 166, 226, 0.3)',
                                    textDecoration: 'none',
                                  },
                                }}
                              />
                            )}
                            {q.areaName && <Chip label={q.areaName} size="small" variant="outlined" />}
                            {q.originName && <Chip label={q.originName} size="small" variant="outlined" />}
                            {q.subjectName && <Chip label={q.subjectName} size="small" variant="outlined" />}
                            <Chip label={String(q.year)} size="small" variant="outlined" />
                          </Stack>

                          <Typography
                            variant="body1"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              mt: 1,
                              fontWeight: 500,
                            }}
                          >
                            {stripRichTextMarkup(q.enunciado)}
                          </Typography>

                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            {q.alternatives?.length || 0} alternativas cadastradas
                          </Typography>
                        </Box>

                        <Stack direction="row" spacing={1} sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}>
                          <Tooltip title="Visualizar questão">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/questoes/${q.id}`, { state: { from: '/perfil', fromTitle: 'Voltar para o Perfil' } })}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Editar questão e alternativas">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => setSelectedQuestionForEdit(q)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Excluir questão">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                handleDeleteItem(
                                  'Excluir Questão',
                                  `Tem certeza que deseja excluir a questão #${q.id}? Esta ação não pode ser desfeita.`,
                                  async () => {
                                    await deleteQuestion(q.id);
                                    loadMyQuestions();
                                  }
                                )
                              }
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Paper>
                    ))}
                </Stack>
              )}
            </Paper>
          )}

          {/* ABA 2: MINHAS PROVAS */}
          {activeNavTab === 'minhas_provas' && (
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    Minhas Provas & Simulados
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total de provas criadas: {myTests.length}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenCreateTestWizard(true)}
                  sx={{ fontWeight: 700, backgroundColor: PALETTE_COLORS.primary, color: '#1a1e24' }}
                >
                  Nova Prova
                </Button>
              </Box>

              <TextField
                placeholder="Buscar em minhas provas..."
                size="small"
                fullWidth
                value={testSearch}
                onChange={(e) => setTestSearch(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{ mb: 3 }}
              />

              {loadingTests ? (
                <ListItemsSkeleton count={4} />
              ) : myTests.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    Você ainda não cadastrou nenhuma prova.
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenCreateTestWizard(true)}
                  >
                    Cadastrar Primeira Prova
                  </Button>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {myTests
                    .filter((t) =>
                      testSearch
                        ? t.name.toLowerCase().includes(testSearch.toLowerCase()) ||
                          String(t.year).includes(testSearch)
                        : true
                    )
                    .map((t) => (
                      <Paper
                        key={t.id}
                        variant="outlined"
                        sx={{
                          p: 2.5,
                          borderRadius: 2,
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          justifyContent: 'space-between',
                          alignItems: { xs: 'flex-start', sm: 'center' },
                          gap: 2,
                          '&:hover': {
                            borderColor: PALETTE_COLORS.primary,
                          },
                        }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="h6" fontWeight="bold">
                            {t.name} ({t.year})
                          </Typography>

                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                            {t.createdByUser && (
                              <Chip
                                size="small"
                                icon={<PersonOutlineIcon fontSize="small" />}
                                label={`Criado por ${t.createdByUser.name}`}
                                component={Link}
                                to={`/perfil/${t.createdByUser.id}`}
                                clickable
                                sx={{
                                  backgroundColor: isDark ? 'rgba(90, 166, 226, 0.12)' : 'rgba(90, 166, 226, 0.15)',
                                  color: PALETTE_COLORS.secondary,
                                  fontWeight: 600,
                                  border: '1px solid',
                                  borderColor: isDark ? 'rgba(90, 166, 226, 0.3)' : 'rgba(90, 166, 226, 0.4)',
                                  '&:hover': {
                                    backgroundColor: isDark ? 'rgba(90, 166, 226, 0.25)' : 'rgba(90, 166, 226, 0.3)',
                                    textDecoration: 'none',
                                  },
                                }}
                              />
                            )}
                            {t.originName && <Chip label={`Banca: ${t.originName}`} size="small" variant="outlined" />}
                            {t.areaName && <Chip label={`Área: ${t.areaName}`} size="small" variant="outlined" />}
                            <Chip label={`Ano: ${t.year}`} size="small" variant="outlined" />
                          </Stack>

                          {(t as any).description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              {(t as any).description}
                            </Typography>
                          )}
                        </Box>

                        <Stack direction="row" spacing={1} sx={{ alignSelf: { xs: 'flex-end', sm: 'center' }, flexWrap: 'wrap' }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<ListAltIcon fontSize="small" />}
                            onClick={() => setSelectedTestForManager(t)}
                            sx={{ textTransform: 'none', fontWeight: 600 }}
                          >
                            Gerenciar Questões
                          </Button>

                          <Tooltip title="Acessar / Resolver Prova">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/provas/${t.id}`)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Editar informações da prova">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => setSelectedTestForEdit(t)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Excluir prova">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setDeletingTest(t);
                                setDeleteQuestionsAlso(false);
                              }}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Paper>
                    ))}
                </Stack>
              )}
            </Paper>
          )}

          {/* ABA 3: MINHAS PASTAS */}
          {activeNavTab === 'minhas_pastas' && (
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    Minhas Pastas Salvas
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Organize suas questões e provas favoritas em pastas personalizadas.
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenCreateFolderDialog(true)}
                  sx={{ fontWeight: 700, backgroundColor: PALETTE_COLORS.primary, color: '#1a1e24' }}
                >
                  Nova Pasta
                </Button>
              </Box>

              <Tabs
                value={folderTypeTab}
                onChange={(_, val) => setFolderTypeTab(val)}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                  mb: 3,
                  borderBottom: 1,
                  borderColor: 'divider',
                  '& .MuiTab-root': {
                    fontWeight: 700,
                    textTransform: 'none',
                    fontSize: { xs: '0.85rem', sm: '0.95rem' },
                    minWidth: 'auto',
                    px: { xs: 1.5, sm: 2 },
                  },
                }}
              >
                <Tab value="QUESTION" label="Pastas de Questões" icon={<QuizOutlinedIcon fontSize="small" />} iconPosition="start" />
                <Tab value="TEST" label="Pastas de Provas" icon={<MenuBookOutlinedIcon fontSize="small" />} iconPosition="start" />
                <Tab value="FLASHCARD" label="Decks de Flashcards" icon={<StyleOutlinedIcon fontSize="small" />} iconPosition="start" />
              </Tabs>

              {loadingFolders ? (
                <CardGridSkeleton count={3} columns={{ xs: 12, sm: 12, md: 6, xl: 4 }} cardHeight={180} />
              ) : myFolders.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    Nenhuma pasta encontrada nesta categoria.
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenCreateFolderDialog(true)}
                  >
                    Criar Pasta
                  </Button>
                </Box>
              ) : (
                <Grid container spacing={2.5}>
                  {myFolders.map((folder) => (
                    <Grid item xs={12} sm={12} md={6} xl={4} key={folder.id}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2.5,
                          borderRadius: 2.5,
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          borderTop: `4px solid ${folder.color || PALETTE_COLORS.primary}`,
                          '&:hover': {
                            boxShadow: 3,
                          },
                        }}
                      >
                        <Box>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Typography variant="h6" fontWeight="bold">
                              {folder.name}
                            </Typography>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <Tooltip title="Editar Pasta">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => {
                                    setEditingFolder(folder);
                                    setEditFolderModalOpen(true);
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Excluir Pasta">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() =>
                                    handleDeleteItem(
                                      'Excluir Pasta',
                                      `Tem certeza que deseja excluir a pasta "${folder.name}"? Os itens salvos nela não serão apagados do sistema.`,
                                      async () => {
                                        await deleteFolder(folder.id);
                                        loadMyFolders();
                                      }
                                    )
                                  }
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </Stack>

                          {folder.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              {folder.description}
                            </Typography>
                          )}
                        </Box>

                        <Box sx={{ mt: 2, pt: 1, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            {folder.folderType === 'QUESTION'
                              ? 'Questões'
                              : folder.folderType === 'TEST'
                              ? 'Provas'
                              : 'Flashcards'}
                            {folder.folderType === 'FLASHCARD' && folder.flashcardCount !== undefined
                              ? ` • ${folder.flashcardCount} cards`
                              : ''}
                          </Typography>
                          <Button
                            size="small"
                            onClick={() => navigate(`/pastas/${folder.id}`)}
                            sx={{ textTransform: 'none', fontWeight: 600 }}
                          >
                            {folder.folderType === 'FLASHCARD' ? 'Abrir Deck' : 'Abrir Pasta'}
                          </Button>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          )}

          {/* ABA: MEUS FLASHCARDS */}
          {activeNavTab === 'meus_flashcards' && (
            <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    Meus Flashcards & Decks
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Crie, organize e revise seus flashcards e baralhos para memorização ativa.
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setFolderTypeTab('FLASHCARD');
                      setOpenCreateFolderDialog(true);
                    }}
                    sx={{ fontWeight: 700, borderRadius: 2 }}
                  >
                    Novo Deck
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenCreateFlashcard(true)}
                    sx={{ fontWeight: 700, backgroundColor: PALETTE_COLORS.primary, color: '#1a1e24', borderRadius: 2 }}
                  >
                    Novo Flashcard
                  </Button>
                </Stack>
              </Box>

              <Tabs
                value={flashcardSubTab}
                onChange={(_, val) => setFlashcardSubTab(val)}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                  mb: 3,
                  borderBottom: 1,
                  borderColor: 'divider',
                  '& .MuiTab-root': {
                    fontWeight: 700,
                    textTransform: 'none',
                    fontSize: { xs: '0.85rem', sm: '0.95rem' },
                    minWidth: 'auto',
                    px: { xs: 1.5, sm: 2 },
                  },
                }}
              >
                <Tab
                  value="DECKS"
                  label={`Decks de Flashcards (${myFlashcardFolders.length})`}
                  icon={<FolderSpecialOutlinedIcon fontSize="small" />}
                  iconPosition="start"
                />
                <Tab
                  value="CARDS"
                  label={`Cards Individuais (${myFlashcards.length})`}
                  icon={<StyleOutlinedIcon fontSize="small" />}
                  iconPosition="start"
                />
                <Tab
                  value="SESSIONS"
                  label={`Histórico de Sessões (${flashcardSessions.length})`}
                  icon={<HistoryIcon fontSize="small" />}
                  iconPosition="start"
                />
              </Tabs>

              {flashcardSubTab !== 'SESSIONS' && (
                <TextField
                  placeholder={flashcardSubTab === 'DECKS' ? 'Buscar em meus decks...' : 'Buscar em meus flashcards...'}
                  size="small"
                  fullWidth
                  value={flashcardSearch}
                  onChange={(e) => setFlashcardSearch(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  sx={{ mb: 3 }}
                />
              )}

              {flashcardSubTab === 'DECKS' && (
                <>
                  {loadingFlashcardFolders ? (
                    <CardGridSkeleton count={3} columns={{ xs: 12, sm: 12, md: 6, xl: 4 }} cardHeight={200} />
                  ) : myFlashcardFolders.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <Typography color="text.secondary" sx={{ mb: 2 }}>
                        Você ainda não criou nenhum deck de flashcards.
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => {
                          setFolderTypeTab('FLASHCARD');
                          setOpenCreateFolderDialog(true);
                        }}
                      >
                        Criar Primeiro Deck
                      </Button>
                    </Box>
                  ) : (
                    <Grid container spacing={2.5}>
                      {myFlashcardFolders
                        .filter((f) =>
                          flashcardSearch
                            ? f.name.toLowerCase().includes(flashcardSearch.toLowerCase()) ||
                              (f.description && f.description.toLowerCase().includes(flashcardSearch.toLowerCase()))
                            : true
                        )
                        .map((folder) => (
                          <Grid item xs={12} sm={12} md={6} xl={4} key={folder.id}>
                            <Paper
                              variant="outlined"
                              sx={{
                                p: 2.5,
                                borderRadius: 2.5,
                                height: '100%',
                                minHeight: 220,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                borderTop: `4px solid ${folder.color || PALETTE_COLORS.primary}`,
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': {
                                  boxShadow: 4,
                                  borderColor: folder.color || PALETTE_COLORS.primary,
                                  transform: 'translateY(-2px)',
                                },
                              }}
                            >
                              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1, gap: 1 }}>
                                  <Typography variant="h6" fontWeight="bold" sx={{ wordBreak: 'break-word', lineHeight: 1.35, fontSize: '1.05rem', flex: 1 }}>
                                    {folder.name}
                                  </Typography>
                                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
                                    <Tooltip title="Editar Deck">
                                      <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={() => {
                                          setEditingFolder(folder);
                                          setEditFolderModalOpen(true);
                                        }}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Excluir Deck">
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() =>
                                          handleDeleteItem(
                                            'Excluir Deck',
                                            `Tem certeza que deseja excluir o deck "${folder.name}"? Os flashcards salvos não serão apagados do sistema.`,
                                            async () => {
                                              await deleteFolder(folder.id);
                                              loadMyFlashcardFolders();
                                            }
                                          )
                                        }
                                      >
                                        <DeleteOutlineIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </Stack>
                                </Stack>

                                {folder.description ? (
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, wordBreak: 'break-word', flex: 1 }}>
                                    {folder.description}
                                  </Typography>
                                ) : (
                                  <Box sx={{ flex: 1, mb: 1.5 }} />
                                )}

                                <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', gap: 0.8, mt: 'auto' }}>
                                  <Chip
                                    size="small"
                                    icon={<StyleOutlinedIcon />}
                                    label={`${folder.flashcardCount || 0} cards`}
                                    sx={{ fontWeight: 'bold' }}
                                  />
                                  <Chip
                                    size="small"
                                    icon={folder.isPublic ? <PublicIcon /> : <LockOutlinedIcon />}
                                    label={folder.isPublic ? 'Público' : 'Privado'}
                                    variant="outlined"
                                  />
                                </Stack>
                              </Box>

                              <Box sx={{ mt: 2, pt: 1.5, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1.5, justifyContent: 'space-between', alignItems: 'center' }}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() =>
                                    navigate(`/pastas/${folder.id}`, {
                                      state: { from: `/perfil/${userId}?tab=flashcards`, fromTitle: 'Voltar para Meus Flashcards' },
                                    })
                                  }
                                  sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, flex: 1 }}
                                >
                                  Ver Cards
                                </Button>
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<PlayArrowIcon />}
                                  onClick={() =>
                                    navigate(`/flashcards/estudo?folderId=${folder.id}`, {
                                      state: { from: `/perfil/${userId}?tab=flashcards`, fromTitle: 'Voltar para Meus Flashcards' },
                                    })
                                  }
                                  sx={{
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    borderRadius: 2,
                                    backgroundColor: PALETTE_COLORS.primary,
                                    color: '#1a1e24',
                                    flex: 1,
                                  }}
                                >
                                  Estudar
                                </Button>
                              </Box>
                            </Paper>
                          </Grid>
                        ))}
                    </Grid>
                  )}
                </>
              )}

              {flashcardSubTab === 'CARDS' && (
                <>
                  {loadingFlashcards ? (
                    <CardGridSkeleton count={4} columns={{ xs: 12, sm: 12, md: 6, xl: 4 }} cardHeight={220} />
                  ) : myFlashcards.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <Typography color="text.secondary" sx={{ mb: 2 }}>
                        Você ainda não criou nenhum flashcard individual.
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenCreateFlashcard(true)}
                      >
                        Cadastrar Primeiro Flashcard
                      </Button>
                    </Box>
                  ) : (
                    <Grid container spacing={2.5}>
                      {myFlashcards
                        .filter((card) =>
                          flashcardSearch
                            ? card.front.toLowerCase().includes(flashcardSearch.toLowerCase()) ||
                              card.back.toLowerCase().includes(flashcardSearch.toLowerCase()) ||
                              (card.areaName && card.areaName.toLowerCase().includes(flashcardSearch.toLowerCase())) ||
                              (card.subjectName && card.subjectName.toLowerCase().includes(flashcardSearch.toLowerCase()))
                            : true
                        )
                        .map((card) => {
                          const isFlipped = flippedProfileCards[card.id] || false;
                          return (
                            <Grid item xs={12} sm={12} md={6} xl={4} key={card.id}>
                              <Paper
                                variant="outlined"
                                sx={{
                                  p: 2.5,
                                  borderRadius: 2.5,
                                  height: '100%',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'space-between',
                                  position: 'relative',
                                  '&:hover': {
                                    borderColor: PALETTE_COLORS.primary,
                                  },
                                }}
                              >
                                <Box>
                                  {/* Header do Card */}
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1, mb: 1.5, width: '100%' }}>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, alignItems: 'center', flex: 1, minWidth: 0 }}>
                                      {card.areaName && (
                                        <Chip
                                          label={card.areaName}
                                          size="small"
                                          variant="outlined"
                                          sx={{
                                            fontSize: '0.72rem',
                                            maxWidth: '100%',
                                            '& .MuiChip-label': {
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              whiteSpace: 'nowrap',
                                            },
                                          }}
                                        />
                                      )}
                                      {card.subjectName && (
                                        <Chip
                                          label={card.subjectName}
                                          size="small"
                                          variant="outlined"
                                          sx={{
                                            fontSize: '0.72rem',
                                            maxWidth: '100%',
                                            '& .MuiChip-label': {
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              whiteSpace: 'nowrap',
                                            },
                                          }}
                                        />
                                      )}
                                    </Box>

                                    <Chip
                                      label={card.isPublic ? 'Público' : 'Privado'}
                                      size="small"
                                      icon={card.isPublic ? <PublicIcon /> : <LockOutlinedIcon />}
                                      sx={{ fontSize: '0.7rem', flexShrink: 0, ml: 'auto' }}
                                    />
                                  </Box>

                                  {/* Conteúdo Frente / Verso */}
                                  <Box
                                    onClick={() => handleToggleProfileCardFlip(card.id)}
                                    sx={{
                                      minHeight: 110,
                                      py: 1,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: PALETTE_COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5 }}>
                                      {isFlipped ? 'Resposta (Verso):' : 'Pergunta (Frente):'}
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontWeight: isFlipped ? 400 : 600,
                                        wordBreak: 'break-word',
                                        overflowWrap: 'break-word',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 4,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                      }}
                                    >
                                      {isFlipped ? card.back : card.front}
                                    </Typography>
                                  </Box>
                                </Box>

                                {/* Ações do Card */}
                                <Box sx={{ mt: 1.5, pt: 1, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Button
                                    size="small"
                                    startIcon={<FlipCameraAndroidIcon />}
                                    onClick={() => handleToggleProfileCardFlip(card.id)}
                                    sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 700 }}
                                  >
                                    {isFlipped ? 'Ver Pergunta' : 'Ver Resposta'}
                                  </Button>

                                  <Stack direction="row" spacing={0.5}>
                                    <Tooltip title="Salvar em um Deck">
                                      <IconButton
                                        size="small"
                                        onClick={() => {
                                          setSelectedFlashcardForFolder(card);
                                          setSaveFlashcardFolderModalOpen(true);
                                        }}
                                      >
                                        <BookmarkBorderIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Editar Flashcard">
                                      <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={() => setSelectedFlashcardForEdit(card)}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Excluir Flashcard">
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() =>
                                          handleDeleteItem(
                                            'Excluir Flashcard',
                                            'Tem certeza que deseja excluir este flashcard? Esta ação não pode ser desfeita.',
                                            async () => {
                                              await deleteFlashcard(card.id);
                                              loadMyFlashcards();
                                            }
                                          )
                                        }
                                      >
                                        <DeleteOutlineIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </Stack>
                                </Box>
                              </Paper>
                            </Grid>
                          );
                        })}
                    </Grid>
                  )}
                </>
              )}

              {flashcardSubTab === 'SESSIONS' && (
                <>
                  {loadingFlashcardSessions ? (
                    <ListItemsSkeleton count={4} />
                  ) : flashcardSessions.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <Typography color="text.secondary" sx={{ mb: 2 }}>
                        Você ainda não realizou nenhuma sessão de estudo com flashcards.
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<PlayArrowIcon />}
                        onClick={() => navigate('/flashcards')}
                        sx={{ fontWeight: 700, backgroundColor: PALETTE_COLORS.primary, color: '#1a1e24' }}
                      >
                        Começar a Praticar
                      </Button>
                    </Box>
                  ) : (
                    <Stack spacing={2}>
                      {flashcardSessions.map((session) => {
                        const total = session.totalCards || (session.correctCount + session.wrongCount + session.skippedCount);
                        const accuracy = session.accuracyPercentage != null
                          ? Math.round(session.accuracyPercentage)
                          : total > 0 ? Math.round((session.correctCount / total) * 100) : 0;
                        const durationStr = formatStudyDuration(session.timeSpentSeconds);
                        const dateFormatted = new Date(session.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        return (
                          <Paper
                            key={session.id}
                            variant="outlined"
                            sx={{
                              p: 2.5,
                              borderRadius: 2.5,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: 2,
                              transition: 'all 0.2s',
                              '&:hover': {
                                boxShadow: 2,
                                borderColor: PALETTE_COLORS.primary,
                              },
                            }}
                          >
                            <Box sx={{ minWidth: 200 }}>
                              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 0.5, gap: 0.5 }}>
                                {session.folderName ? (
                                  <Chip
                                    size="small"
                                    icon={<FolderSpecialOutlinedIcon fontSize="small" />}
                                    label={session.folderName}
                                    sx={{
                                      fontWeight: 700,
                                      backgroundColor: 'rgba(217, 183, 99, 0.15)',
                                      color: PALETTE_COLORS.primary,
                                    }}
                                  />
                                ) : (
                                  <Chip
                                    size="small"
                                    icon={<StyleOutlinedIcon fontSize="small" />}
                                    label="Cards Avulsos"
                                    variant="outlined"
                                    sx={{ fontWeight: 700 }}
                                  />
                                )}
                                {session.areaName && (
                                  <Chip
                                    size="small"
                                    label={`Área: ${session.areaName}`}
                                    variant="outlined"
                                    sx={{
                                      fontWeight: 600,
                                      borderColor: PALETTE_COLORS.primary,
                                      color: PALETTE_COLORS.primary,
                                    }}
                                  />
                                )}
                                {session.subjectName && (
                                  <Chip
                                    size="small"
                                    label={`Matéria: ${session.subjectName}`}
                                    variant="outlined"
                                    sx={{ fontWeight: 600 }}
                                  />
                                )}
                                <Typography variant="caption" color="text.secondary">
                                  {dateFormatted}
                                </Typography>
                              </Stack>
                              <Typography variant="body2" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.5 }}>
                                <AccessTimeIcon fontSize="small" sx={{ fontSize: 16 }} /> Duração: <strong>{durationStr}</strong>
                              </Typography>
                            </Box>

                            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                              <Chip
                                size="small"
                                label={`${session.totalCards} cards`}
                                sx={{ fontWeight: 600 }}
                              />
                              <Chip
                                size="small"
                                label={`${session.correctCount} acertos`}
                                sx={{
                                  fontWeight: 700,
                                  backgroundColor: 'rgba(75, 241, 81, 0.12)',
                                  color: PALETTE_COLORS.success,
                                }}
                              />
                              <Chip
                                size="small"
                                label={`${session.wrongCount} erros`}
                                sx={{
                                  fontWeight: 700,
                                  backgroundColor: 'rgba(250, 66, 75, 0.12)',
                                  color: PALETTE_COLORS.danger,
                                }}
                              />
                              <Chip
                                size="small"
                                label={`${accuracy}% acerto`}
                                sx={{
                                  fontWeight: 800,
                                  backgroundColor: accuracy >= 70 ? 'rgba(75, 241, 81, 0.15)' : 'rgba(217, 183, 99, 0.15)',
                                  color: accuracy >= 70 ? PALETTE_COLORS.success : PALETTE_COLORS.primary,
                                }}
                              />

                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<VisibilityIcon fontSize="small" />}
                                onClick={() => setSelectedSessionDetail(session)}
                                sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                              >
                                Detalhes
                              </Button>
                            </Stack>
                          </Paper>
                        );
                      })}
                    </Stack>
                  )}
                </>
              )}
            </Paper>
          )}

          {/* ABA 4: GERENCIAR BANCAS (ADMIN) */}
          {activeNavTab === 'admin_bancas' && isAdmin && (
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    Gerenciar Bancas Examinadoras
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total de bancas cadastradas: {allOrigins.length}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenCreateOrigin(true)}
                  sx={{ fontWeight: 700, backgroundColor: PALETTE_COLORS.primary, color: '#1a1e24' }}
                >
                  Nova Banca
                </Button>
              </Box>

              <TextField
                placeholder="Buscar banca..."
                size="small"
                fullWidth
                value={originSearch}
                onChange={(e) => setOriginSearch(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{ mb: 3 }}
              />

              {loadingOrigins ? (
                <ListItemsSkeleton count={4} />
              ) : (
                <Stack spacing={1.5}>
                  {allOrigins
                    .filter((o) =>
                      originSearch ? o.name.toLowerCase().includes(originSearch.toLowerCase()) : true
                    )
                    .map((origin) => (
                      <Paper
                        key={origin.id}
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 2,
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {origin.name}
                          </Typography>
                          {origin.description && (
                            <Typography variant="body2" color="text.secondary">
                              {origin.description}
                            </Typography>
                          )}
                        </Box>

                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Editar banca">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => setSelectedOriginForEdit(origin)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Excluir banca">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                handleDeleteItem(
                                  'Excluir Banca',
                                  `Tem certeza que deseja excluir a banca "${origin.name}"?`,
                                  async () => {
                                    await deleteOrigin(origin.id);
                                    loadAllOrigins();
                                  }
                                )
                              }
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Paper>
                    ))}
                </Stack>
              )}
            </Paper>
          )}

          {/* ABA 5: GERENCIAR ÁREAS (ADMIN) */}
          {activeNavTab === 'admin_areas' && isAdmin && (
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    Gerenciar Áreas do Conhecimento
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total de áreas cadastradas: {allAreas.length}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenCreateArea(true)}
                  sx={{ fontWeight: 700, backgroundColor: PALETTE_COLORS.primary, color: '#1a1e24' }}
                >
                  Nova Área
                </Button>
              </Box>

              <TextField
                placeholder="Buscar área..."
                size="small"
                fullWidth
                value={areaSearch}
                onChange={(e) => setAreaSearch(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{ mb: 3 }}
              />

              {loadingAreas ? (
                <ListItemsSkeleton count={4} />
              ) : (
                <Stack spacing={1.5}>
                  {allAreas
                    .filter((a) =>
                      areaSearch ? a.name.toLowerCase().includes(areaSearch.toLowerCase()) : true
                    )
                    .map((area) => (
                      <Paper
                        key={area.id}
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 2,
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {area.name}
                          </Typography>
                          {area.description && (
                            <Typography variant="body2" color="text.secondary">
                              {area.description}
                            </Typography>
                          )}
                        </Box>

                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Editar área">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => setSelectedAreaForEdit(area)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Excluir área">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                handleDeleteItem(
                                  'Excluir Área',
                                  `Tem certeza que deseja excluir a área "${area.name}"?`,
                                  async () => {
                                    await deleteArea(area.id);
                                    loadAllAreas();
                                  }
                                )
                              }
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Paper>
                    ))}
                </Stack>
              )}
            </Paper>
          )}

          {/* ABA 6: GERENCIAR MATÉRIAS (ADMIN) */}
          {activeNavTab === 'admin_materias' && isAdmin && (
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    Gerenciar Matérias
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total de matérias cadastradas: {allSubjects.length}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenCreateSubject(true)}
                  sx={{ fontWeight: 700, backgroundColor: PALETTE_COLORS.primary, color: '#1a1e24' }}
                >
                  Nova Matéria
                </Button>
              </Box>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                <TextField
                  placeholder="Buscar matéria..."
                  size="small"
                  fullWidth
                  value={subjectSearch}
                  onChange={(e) => setSubjectSearch(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />

                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Filtrar por Área</InputLabel>
                  <Select
                    value={subjectAreaFilter}
                    label="Filtrar por Área"
                    onChange={(e) => setSubjectAreaFilter(e.target.value as number | '')}
                  >
                    <MenuItem value="">
                      <em>Todas as Áreas</em>
                    </MenuItem>
                    {allAreas.map((a) => (
                      <MenuItem key={a.id} value={a.id}>
                        {a.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              {loadingSubjects ? (
                <ListItemsSkeleton count={4} />
              ) : (
                <Stack spacing={1.5}>
                  {allSubjects
                    .filter((s) => {
                      const matchSearch = subjectSearch
                        ? s.name.toLowerCase().includes(subjectSearch.toLowerCase())
                        : true;
                      const matchArea = subjectAreaFilter ? s.areaId === subjectAreaFilter : true;
                      return matchSearch && matchArea;
                    })
                    .map((subject) => (
                      <Paper
                        key={subject.id}
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 2,
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {subject.name}
                            </Typography>
                            {subject.areaName && (
                              <Chip label={subject.areaName} size="small" variant="outlined" />
                            )}
                          </Stack>
                          {subject.description && (
                            <Typography variant="body2" color="text.secondary">
                              {subject.description}
                            </Typography>
                          )}
                        </Box>

                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Editar matéria">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => setSelectedSubjectForEdit(subject)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Excluir matéria">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                handleDeleteItem(
                                  'Excluir Matéria',
                                  `Tem certeza que deseja excluir a matéria "${subject.name}"?`,
                                  async () => {
                                    await deleteSubject(subject.id);
                                    loadAllSubjects();
                                  }
                                )
                              }
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Paper>
                    ))}
                </Stack>
              )}
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* ========================================================= */}
      {/* SUBMODAIS DE CRIAÇÃO E EDIÇÃO */}
      {/* ========================================================= */}

      {/* Questões */}
      <CreateQuestionModal
        open={openCreateQuestion}
        onClose={() => setOpenCreateQuestion(false)}
        onCreated={() => {
          setOpenCreateQuestion(false);
          loadMyQuestions();
        }}
      />
      <EditQuestionModal
        open={Boolean(selectedQuestionForEdit)}
        question={selectedQuestionForEdit}
        onClose={() => setSelectedQuestionForEdit(null)}
        onUpdated={() => loadMyQuestions()}
      />

      {/* Provas */}
      <CreateTestWizardModal
        open={openCreateTestWizard}
        onClose={() => setOpenCreateTestWizard(false)}
        onCreated={() => {
          setOpenCreateTestWizard(false);
          loadMyTests();
        }}
      />
      <EditTestModal
        open={Boolean(selectedTestForEdit)}
        test={selectedTestForEdit}
        onClose={() => setSelectedTestForEdit(null)}
        onUpdated={() => loadMyTests()}
      />
      <TestQuestionsManagerModal
        open={Boolean(selectedTestForManager)}
        test={selectedTestForManager}
        onClose={() => setSelectedTestForManager(null)}
        onUpdated={() => loadMyTests()}
      />

      {/* Bancas (ADMIN) */}
      <CreateOriginModal
        open={openCreateOrigin}
        onClose={() => setOpenCreateOrigin(false)}
        onCreated={() => {
          setOpenCreateOrigin(false);
          loadAllOrigins();
        }}
      />
      <EditOriginModal
        open={Boolean(selectedOriginForEdit)}
        origin={selectedOriginForEdit}
        onClose={() => setSelectedOriginForEdit(null)}
        onUpdated={() => loadAllOrigins()}
      />

      {/* Áreas (ADMIN) */}
      <CreateAreaModal
        open={openCreateArea}
        onClose={() => setOpenCreateArea(false)}
        onCreated={() => {
          setOpenCreateArea(false);
          loadAllAreas();
        }}
      />
      <EditAreaModal
        open={Boolean(selectedAreaForEdit)}
        area={selectedAreaForEdit}
        onClose={() => setSelectedAreaForEdit(null)}
        onUpdated={() => loadAllAreas()}
      />

      {/* Matérias (ADMIN) */}
      <CreateSubjectModal
        open={openCreateSubject}
        onClose={() => setOpenCreateSubject(false)}
        onCreated={() => {
          setOpenCreateSubject(false);
          loadAllSubjects();
        }}
      />
      <EditSubjectModal
        open={Boolean(selectedSubjectForEdit)}
        subject={selectedSubjectForEdit}
        onClose={() => setSelectedSubjectForEdit(null)}
        onUpdated={() => loadAllSubjects()}
      />

      {/* Diálogo de Criação de Pasta */}
      <Dialog
        open={openCreateFolderDialog}
        onClose={() => setOpenCreateFolderDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Criar Nova Pasta ({folderTypeTab === 'QUESTION' ? 'Questões' : folderTypeTab === 'TEST' ? 'Provas' : 'Flashcards'})
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <TextField
              label="Nome da Pasta"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              fullWidth
              required
              size="small"
            />
            <TextField
              label="Descrição (Opcional)"
              value={newFolderDesc}
              onChange={(e) => setNewFolderDesc(e.target.value)}
              fullWidth
              multiline
              rows={2}
              size="small"
            />
            <FormControl size="small">
              <Typography variant="caption" sx={{ mb: 1, fontWeight: 'bold' }}>
                Cor da Pasta
              </Typography>
              <RadioGroup
                row
                value={newFolderColor}
                onChange={(e) => setNewFolderColor(e.target.value)}
              >
                {[
                  PALETTE_COLORS.primary,
                  PALETTE_COLORS.secondary,
                  PALETTE_COLORS.success,
                  PALETTE_COLORS.danger,
                  PALETTE_COLORS.warning,
                  '#b388ff',
                  '#ff80ab',
                ].map((color) => (
                  <FormControlLabel
                    key={color}
                    value={color}
                    control={
                      <Radio
                        size="small"
                        sx={{
                          color,
                          '&.Mui-checked': { color },
                        }}
                      />
                    }
                    label=""
                    sx={{ m: 0, mr: 1 }}
                  />
                ))}
              </RadioGroup>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={newFolderIsPublic}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFolderIsPublic(e.target.checked)}
                  color="success"
                />
              }
              label={
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {newFolderIsPublic ? 'Pasta Pública (visível na comunidade)' : 'Pasta Privada (apenas para você)'}
                </Typography>
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenCreateFolderDialog(false)} disabled={savingFolder}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateFolderSubmit}
            disabled={savingFolder || !newFolderName.trim()}
            sx={{ fontWeight: 700, backgroundColor: PALETTE_COLORS.primary }}
          >
            {savingFolder ? 'Criando...' : 'Criar Pasta'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Edição de Pasta */}
      <EditFolderModal
        open={editFolderModalOpen}
        folder={editingFolder}
        onClose={() => {
          setEditFolderModalOpen(false);
          setEditingFolder(null);
        }}
        onUpdated={() => {
          loadMyFolders();
          loadMyFlashcardFolders();
        }}
      />

      {/* Modais de Flashcard */}
      <CreateFlashcardModal
        open={openCreateFlashcard}
        onClose={() => setOpenCreateFlashcard(false)}
        onCreated={() => {
          setOpenCreateFlashcard(false);
          loadMyFlashcards();
          loadMyFlashcardFolders();
        }}
      />
      <EditFlashcardModal
        open={Boolean(selectedFlashcardForEdit)}
        flashcard={selectedFlashcardForEdit}
        onClose={() => setSelectedFlashcardForEdit(null)}
        onUpdated={() => {
          setSelectedFlashcardForEdit(null);
          loadMyFlashcards();
        }}
      />
      <SaveFlashcardToFolderModal
        open={saveFlashcardFolderModalOpen}
        flashcard={selectedFlashcardForFolder}
        onClose={() => {
          setSaveFlashcardFolderModalOpen(false);
          setSelectedFlashcardForFolder(null);
        }}
        onSavedStatusChange={() => {
          loadMyFlashcardFolders();
        }}
      />

      {/* Diálogo Específico de Confirmação de Exclusão de Prova */}
      <Dialog
        open={Boolean(deletingTest)}
        onClose={() => {
          if (!isDeletingTest) {
            setDeletingTest(null);
            setDeleteQuestionsAlso(false);
          }
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {isAdmin && deletingTest?.createdByUser?.id !== currentUser?.id
            ? 'Moderação: Excluir Prova Pública'
            : 'Excluir Prova'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {isAdmin && deletingTest?.createdByUser?.id !== currentUser?.id
              ? `Como Administrador, você está prestes a remover a prova pública "${deletingTest?.name}" criada por outro usuário. Deseja continuar?`
              : `Tem certeza que deseja excluir a prova "${deletingTest?.name}"?`}
          </DialogContentText>

          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: '1px solid',
              borderColor: deleteQuestionsAlso ? 'error.main' : 'divider',
              backgroundColor: deleteQuestionsAlso ? 'rgba(250, 66, 75, 0.08)' : 'action.hover',
              transition: 'all 0.2s ease',
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={deleteQuestionsAlso}
                  onChange={(e) => setDeleteQuestionsAlso(e.target.checked)}
                  color="error"
                  size="small"
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: deleteQuestionsAlso ? 'error.main' : 'text.primary' }}>
                    Também excluir todas as questões vinculadas
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.3, lineHeight: 1.3 }}>
                    {deleteQuestionsAlso
                      ? 'Atenção: Todas as questões desta prova serão excluídas permanentemente do sistema.'
                      : 'Se desmarcado, as questões serão mantidas no sistema como avulsas.'}
                  </Typography>
                </Box>
              }
              sx={{ alignItems: 'flex-start', m: 0, gap: 1 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setDeletingTest(null);
              setDeleteQuestionsAlso(false);
            }}
            disabled={isDeletingTest}
            sx={{ color: 'text.secondary' }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              if (!deletingTest) return;
              setIsDeletingTest(true);
              try {
                await deleteTest(deletingTest.id, deleteQuestionsAlso);
                setDeletingTest(null);
                setDeleteQuestionsAlso(false);
                loadMyTests();
              } catch (err: any) {
                console.error('Erro ao excluir prova:', err);
                setError(err.response?.data?.message || 'Erro ao excluir prova.');
              } finally {
                setIsDeletingTest(false);
              }
            }}
            disabled={isDeletingTest}
            sx={{ fontWeight: 700 }}
          >
            {isDeletingTest ? 'Excluindo...' : 'Excluir Prova'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo Genérico de Confirmação de Exclusão */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog((prev) => ({ ...prev, open: false }))}>
        <DialogTitle sx={{ fontWeight: 700 }}>{deleteDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{deleteDialog.message}</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialog((prev) => ({ ...prev, open: false }))} disabled={deleting}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDeleteAction}
            disabled={deleting}
          >
            {deleting ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Compartilhamento/Exportação de Simulado CSV */}
      {shareAttemptDetail && shareEvaluation && (
        <ShareResultsModal
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          testName={shareAttemptDetail.testName || shareEvaluation.name}
          testYear={shareAttemptDetail.testYear || shareEvaluation.year}
          scorePercentage={shareAttemptDetail.scorePercentage}
          correctAnswers={shareAttemptDetail.correctAnswers}
          totalQuestions={shareAttemptDetail.totalQuestions}
          timeSpentSeconds={shareAttemptDetail.timeSpentSeconds}
          questions={shareEvaluation.questions}
          detailedResults={shareAttemptDetail.detailedResults}
        />
      )}

      {/* Modal de Edição de Perfil */}
      {profile && (
        <EditProfileModal
          open={openEditProfileModal}
          onClose={() => setOpenEditProfileModal(false)}
          profile={profile}
          onSuccess={handleProfileUpdated}
        />
      )}

      {/* Dialog de Detalhes da Sessão de Flashcards */}
      <Dialog
        open={Boolean(selectedSessionDetail)}
        onClose={() => setSelectedSessionDetail(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Detalhes da Sessão de Estudo
        </DialogTitle>
        <DialogContent dividers>
          {selectedSessionDetail && (
            <Box>
              <Stack direction="row" spacing={3} sx={{ mb: 3 }} flexWrap="wrap" useFlexGap>
                <Box>
                  <Typography variant="caption" color="text.secondary">Origem:</Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {selectedSessionDetail.folderName || 'Cards Avulsos'}
                  </Typography>
                </Box>
                {selectedSessionDetail.areaName && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Área:</Typography>
                    <Typography variant="body1" fontWeight={700} sx={{ color: PALETTE_COLORS.primary }}>
                      {selectedSessionDetail.areaName}
                    </Typography>
                  </Box>
                )}
                {selectedSessionDetail.subjectName && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Matéria:</Typography>
                    <Typography variant="body1" fontWeight={700}>
                      {selectedSessionDetail.subjectName}
                    </Typography>
                  </Box>
                )}
                <Box>
                  <Typography variant="caption" color="text.secondary">Tempo Respondido:</Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {formatStudyDuration(selectedSessionDetail.timeSpentSeconds)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Acertos / Erros:</Typography>
                  <Typography variant="body1" fontWeight={700}>
                    <span style={{ color: PALETTE_COLORS.success }}>{selectedSessionDetail.correctCount} acertos</span>
                    {' • '}
                    <span style={{ color: PALETTE_COLORS.danger }}>{selectedSessionDetail.wrongCount} erros</span>
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Aproveitamento:</Typography>
                  <Typography variant="body1" fontWeight={700} sx={{ color: PALETTE_COLORS.primary }}>
                    {Math.round(selectedSessionDetail.accuracyPercentage || 0)}%
                  </Typography>
                </Box>
              </Stack>

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                Cards praticados ({selectedSessionDetail.items?.length || 0}):
              </Typography>
              <Stack spacing={1.5}>
                {selectedSessionDetail.items?.map((item, idx) => (
                  <Paper
                    key={item.id || idx}
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      borderLeft: `5px solid ${
                        item.status === 'CORRECT'
                          ? PALETTE_COLORS.success
                          : item.status === 'WRONG'
                          ? PALETTE_COLORS.danger
                          : 'gray'
                      }`,
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5, flexWrap: 'wrap', gap: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography variant="caption" fontWeight={700} color="text.secondary">
                          Carta #{idx + 1}
                        </Typography>
                        {item.areaName && (
                          <Chip size="small" variant="outlined" label={item.areaName} sx={{ height: 20, fontSize: '0.7rem', color: PALETTE_COLORS.primary, borderColor: PALETTE_COLORS.primary }} />
                        )}
                        {item.subjectName && (
                          <Chip size="small" variant="outlined" label={item.subjectName} sx={{ height: 20, fontSize: '0.7rem' }} />
                        )}
                      </Stack>
                      <Chip
                        size="small"
                        label={item.status === 'CORRECT' ? 'Acerto' : item.status === 'WRONG' ? 'Erro' : 'Pulado'}
                        sx={{
                          fontWeight: 700,
                          backgroundColor:
                            item.status === 'CORRECT'
                              ? 'rgba(75, 241, 81, 0.15)'
                              : item.status === 'WRONG'
                              ? 'rgba(250, 66, 75, 0.15)'
                              : 'rgba(0,0,0,0.08)',
                          color:
                            item.status === 'CORRECT'
                              ? PALETTE_COLORS.success
                              : item.status === 'WRONG'
                              ? PALETTE_COLORS.danger
                              : 'text.secondary',
                        }}
                      />
                    </Box>
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                      {item.flashcardFront || 'Flashcard'}
                    </Typography>
                    {item.flashcardBack && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        <strong>Resposta:</strong> {item.flashcardBack}
                      </Typography>
                    )}
                  </Paper>
                ))}
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSelectedSessionDetail(null)} sx={{ fontWeight: 700 }}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para Descartar Sessão Incompleta */}
      <Dialog
        open={Boolean(sessionToDiscard)}
        onClose={() => setSessionToDiscard(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Descartar Estudo Incompleto?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Deseja realmente excluir esta sessão de estudo em andamento? O progresso salvo dela será removido.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setSessionToDiscard(null)}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              if (sessionToDiscard) {
                try {
                  await deleteFlashcardSession(sessionToDiscard.id);
                  setFlashcardSessions((prev) => prev.filter((s) => s.id !== sessionToDiscard.id));
                } catch (err) {
                  console.error('Erro ao descartar sessão:', err);
                }
              }
              setSessionToDiscard(null);
            }}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
          >
            Descartar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

