import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Stack,
} from '@mui/material';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import { SearchBar } from './SearchBar';
import { QuestionCard } from './QuestionCard';
import { QuestionSkeleton } from './QuestionSkeleton';
import { Area, FilterState, Origin, Question, Test } from '../types';
import { getAreas, getOrigins, getQuestions, getTests } from '../services/api';
import { PALETTE_COLORS } from '../theme/theme';

interface QuestionsViewProps {
  onBookmarkClick?: (question: Question) => void;
  savedQuestionIds?: Set<number>;
}

export const QuestionsView: React.FC<QuestionsViewProps> = ({
  onBookmarkClick,
  savedQuestionIds = new Set(),
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [origins, setOrigins] = useState<Origin[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Parse filters from URL search params
  const filters: FilterState = useMemo(() => {
    return {
      search: searchParams.get('search') || '',
      type: (searchParams.get('type') as 'all' | 'questions' | 'tests') || 'all',
      originId: searchParams.get('originId') ? Number(searchParams.get('originId')) : '',
      areaId: searchParams.get('areaId') ? Number(searchParams.get('areaId')) : '',
      year: searchParams.get('year') ? Number(searchParams.get('year')) : '',
      testId: searchParams.get('testId') ? Number(searchParams.get('testId')) : '',
      difficulty: searchParams.get('difficulty') || '',
      sort: searchParams.get('sort') || 'recent',
    };
  }, [searchParams]);

  // Load origins, areas, tests once
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [oList, aList, tList] = await Promise.all([
          getOrigins(),
          getAreas(),
          getTests(),
        ]);
        setOrigins(oList);
        setAreas(aList);
        setTests(tList);
      } catch (err) {
        console.error('Erro ao carregar metadados:', err);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch questions whenever filters change
  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true);
      try {
        const qList = await getQuestions({
          originId: filters.originId,
          areaId: filters.areaId,
          testId: filters.testId,
          year: filters.year,
          difficulty: filters.difficulty,
          search: filters.search,
          sort: filters.sort,
        });
        setQuestions(qList);
      } catch (err) {
        console.error('Erro ao carregar questões:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [
    filters.originId,
    filters.areaId,
    filters.testId,
    filters.year,
    filters.difficulty,
    filters.search,
    filters.sort,
  ]);

  // Update URL search parameters when filters change
  const handleFilterChange = (newFilters: FilterState) => {
    const params: Record<string, string> = {};
    if (newFilters.search) params.search = newFilters.search;
    if (newFilters.type !== 'all') params.type = newFilters.type;
    if (newFilters.originId !== '') params.originId = String(newFilters.originId);
    if (newFilters.areaId !== '') params.areaId = String(newFilters.areaId);
    if (newFilters.year !== '') params.year = String(newFilters.year);
    if (newFilters.testId !== '') params.testId = String(newFilters.testId);
    if (newFilters.difficulty) params.difficulty = newFilters.difficulty;
    if (newFilters.sort && newFilters.sort !== 'recent') params.sort = newFilters.sort;

    setSearchParams(params, { replace: true });
  };

  // Client-side filtering if needed (e.g. type)
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (filters.type === 'tests' && !q.testId) {
        return false;
      }
      return true;
    });
  }, [questions, filters.type]);

  return (
    <Box>
      <SearchBar
        filters={filters}
        onFilterChange={handleFilterChange}
        origins={origins}
        areas={areas}
        tests={tests}
        totalResults={filteredQuestions.length}
      />

      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Banco de Questões
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Questões reais em ordem decrescente, com filtros sincronizados na URL e resolução interativa
          </Typography>
        </Box>
      </Box>

      {isLoading ? (
        <Stack spacing={0}>
          <QuestionSkeleton />
          <QuestionSkeleton />
          <QuestionSkeleton />
        </Stack>
      ) : filteredQuestions.length > 0 ? (
        <Stack spacing={0}>
          {filteredQuestions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              onBookmarkClick={onBookmarkClick}
              isSavedInAnyFolder={savedQuestionIds.has(q.id)}
            />
          ))}
        </Stack>
      ) : (
        <Paper
          elevation={4}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 3,
          }}
        >
          <SearchOffIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Nenhuma questão encontrada
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Tente ajustar ou limpar os filtros de busca para visualizar mais questões.
          </Typography>
          <Button
            variant="outlined"
            onClick={() =>
              handleFilterChange({
                search: '',
                type: 'all',
                originId: '',
                areaId: '',
                year: '',
                testId: '',
                difficulty: '',
                sort: 'recent',
              })
            }
            sx={{ borderColor: PALETTE_COLORS.primary, color: PALETTE_COLORS.primary }}
          >
            Limpar Todos os Filtros
          </Button>
        </Paper>
      )}
    </Box>
  );
};
