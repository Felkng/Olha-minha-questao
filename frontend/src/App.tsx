import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Stack,
} from '@mui/material';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import { Navbar } from './components/Navbar';
import { SearchBar } from './components/SearchBar';
import { QuestionCard } from './components/QuestionCard';
import { QuestionSkeleton } from './components/QuestionSkeleton';
import { PaletteShowcase } from './components/PaletteShowcase';
import { Area, FilterState, Origin, Question, Test } from './types';
import { getAreas, getOrigins, getQuestions, getTests } from './services/api';
import { PALETTE_COLORS } from './theme/theme';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('questoes');
  const [showSkeleton, setShowSkeleton] = useState<boolean>(false);
  const [paletteOpen, setPaletteOpen] = useState<boolean>(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [origins, setOrigins] = useState<Origin[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: 'all',
    originId: '',
    areaId: '',
    year: '',
    testId: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [qList, oList, aList, tList] = await Promise.all([
          getQuestions(),
          getOrigins(),
          getAreas(),
          getTests(),
        ]);
        setQuestions(qList);
        setOrigins(oList);
        setAreas(aList);
        setTests(tList);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtragem dinâmica
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Busca textual no enunciado ou identificador
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesEnunciado = q.enunciado.toLowerCase().includes(searchLower);
        const matchesIdentifier = q.identifier.toLowerCase().includes(searchLower);
        const matchesOrigin = q.originName?.toLowerCase().includes(searchLower);
        const matchesArea = q.areaName?.toLowerCase().includes(searchLower);
        if (!matchesEnunciado && !matchesIdentifier && !matchesOrigin && !matchesArea) {
          return false;
        }
      }

      // Filtro de Banca / Origem
      if (filters.originId !== '' && q.originId !== filters.originId) {
        return false;
      }

      // Filtro de Área
      if (filters.areaId !== '' && q.areaId !== filters.areaId) {
        return false;
      }

      // Filtro de Ano
      if (filters.year !== '' && q.year !== filters.year) {
        return false;
      }

      // Filtro de Prova
      if (filters.testId !== '' && q.testId !== filters.testId) {
        return false;
      }

      return true;
    });
  }, [questions, filters]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Horizontal Navbar at top */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        showSkeleton={showSkeleton}
        onToggleSkeleton={() => setShowSkeleton(!showSkeleton)}
        onOpenPalette={() => setPaletteOpen(true)}
      />

      {/* Main Content Area */}
      <Container maxWidth="lg" sx={{ py: 4, flexGrow: 1 }}>
        {/* Search & Multi-filter Bar */}
        <SearchBar
          filters={filters}
          onFilterChange={setFilters}
          origins={origins}
          areas={areas}
          tests={tests}
          totalResults={filteredQuestions.length}
        />

        {/* Section Title */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {activeTab === 'questoes' && 'Banco de Questões'}
              {activeTab === 'provas' && 'Provas & Vestibulares'}
              {activeTab === 'bancas' && 'Bancas Examinadoras'}
              {activeTab === 'areas' && 'Áreas do Conhecimento'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Explore questões com filtros detalhados e resolução interativa
            </Typography>
          </Box>
        </Box>

        {/* Question Cards or Loading Skeletons */}
        {isLoading || showSkeleton ? (
          <Stack spacing={0}>
            <QuestionSkeleton />
            <QuestionSkeleton />
            <QuestionSkeleton />
          </Stack>
        ) : filteredQuestions.length > 0 ? (
          <Stack spacing={0}>
            {filteredQuestions.map((q) => (
              <QuestionCard key={q.id} question={q} />
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
                setFilters({
                  search: '',
                  type: 'all',
                  originId: '',
                  areaId: '',
                  year: '',
                  testId: '',
                })
              }
              sx={{ borderColor: PALETTE_COLORS.primary, color: PALETTE_COLORS.primary }}
            >
              Limpar Todos os Filtros
            </Button>
          </Paper>
        )}
      </Container>

      {/* Palette Showcase Drawer */}
      <PaletteShowcase open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          borderTop: '1px solid',
          borderColor: 'divider',
          textAlign: 'center',
        }}
      >
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Olha Minha Questão &copy; {new Date().getFullYear()} — Plataforma de Estudo e Resolução de Questões
        </Typography>
      </Box>
    </Box>
  );
};
