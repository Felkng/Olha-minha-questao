import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Stack,
  Pagination,
} from '@mui/material';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import AddIcon from '@mui/icons-material/Add';
import { SearchBar } from '../components/search/SearchBar';
import { QuestionCard } from '../components/questions/QuestionCard';
import { QuestionSkeleton } from '../components/questions/QuestionSkeleton';
import { CreateQuestionModal } from '../components/crud/CreateQuestionModal';
import { Area, FilterState, Origin, Question, Test } from '../types';
import { getAreas, getOrigins, getQuestions, getTests } from '../services/api';
import { PALETTE_COLORS } from '../theme/theme';

interface QuestionsPageProps {
  onBookmarkClick?: (question: Question) => void;
  savedQuestionIds?: Set<number>;
}

export const QuestionsPage: React.FC<QuestionsPageProps> = ({
  onBookmarkClick,
  savedQuestionIds = new Set(),
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [page, setPage] = useState<number>(1); // 1-indexed for MUI Pagination

  const [origins, setOrigins] = useState<Origin[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);

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

  const loadQuestionsData = async (currentPage: number) => {
    setIsLoading(true);
    try {
      const pageRes = await getQuestions({
        originId: filters.originId,
        areaId: filters.areaId,
        testId: filters.testId,
        year: filters.year,
        difficulty: filters.difficulty,
        search: filters.search,
        sort: filters.sort,
        page: currentPage - 1, // API is 0-indexed
        size: 5, // 5 questões por vez
      });
      setQuestions(pageRes.content);
      setTotalPages(pageRes.totalPages || 1);
      setTotalElements(pageRes.totalElements || 0);
    } catch (err) {
      console.error('Erro ao carregar questões:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch questions whenever filters or page changes
  useEffect(() => {
    let isCurrent = true;
    const fetchQuestions = async () => {
      setIsLoading(true);
      try {
        const pageRes = await getQuestions({
          originId: filters.originId,
          areaId: filters.areaId,
          testId: filters.testId,
          year: filters.year,
          difficulty: filters.difficulty,
          search: filters.search,
          sort: filters.sort,
          page: page - 1, // API is 0-indexed
          size: 5, // 5 questões por vez
        });
        if (isCurrent) {
          setQuestions(pageRes.content);
          setTotalPages(pageRes.totalPages || 1);
          setTotalElements(pageRes.totalElements || 0);
        }
      } catch (err) {
        if (isCurrent) {
          console.error('Erro ao carregar questões:', err);
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    };

    fetchQuestions();

    return () => {
      isCurrent = false;
    };
  }, [
    page,
    filters.originId,
    filters.areaId,
    filters.testId,
    filters.year,
    filters.difficulty,
    filters.search,
    filters.sort,
  ]);

  const handleFilterChange = (newFilters: FilterState) => {
    setPage(1); // Reset to page 1 on filter change
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

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Box sx={{ mb: 6 }}>
      <SearchBar
        filters={filters}
        onFilterChange={handleFilterChange}
        origins={origins}
        areas={areas}
        tests={tests}
        totalResults={totalElements}
      />

      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
            Banco de Questões
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Exibindo 5 questões por página (Total: {totalElements} questões).
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateModalOpen(true)}
          sx={{ fontWeight: 700, backgroundColor: PALETTE_COLORS.primary }}
        >
          Nova Questão
        </Button>
      </Box>

      {isLoading ? (
        <Stack spacing={0}>
          <QuestionSkeleton />
          <QuestionSkeleton />
          <QuestionSkeleton />
        </Stack>
      ) : questions.length > 0 ? (
        <Box>
          <Stack spacing={0}>
            {questions.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                onBookmarkClick={onBookmarkClick}
                isSavedInAnyFolder={savedQuestionIds.has(q.id)}
              />
            ))}
          </Stack>

          {/* Paginação de 5 em 5 */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              size="large"
              showFirstButton
              showLastButton
              sx={{
                '& .MuiPaginationItem-root': {
                  fontWeight: 700,
                },
              }}
            />
          </Box>
        </Box>
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

      <CreateQuestionModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={() => loadQuestionsData(page)}
      />
    </Box>
  );
};
