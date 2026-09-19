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
import { FoldersView } from './components/FoldersView';
import { SaveToFolderModal } from './components/SaveToFolderModal';
import { Area, FilterState, Origin, Question, Test } from './types';
import { getAreas, getOrigins, getQuestions, getTests } from './services/api';
import { PALETTE_COLORS } from './theme/theme';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('questoes');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [origins, setOrigins] = useState<Origin[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal de salvar questão em pasta
  const [saveModalOpen, setSaveModalOpen] = useState<boolean>(false);
  const [selectedQuestionForSave, setSelectedQuestionForSave] = useState<Question | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: 'all',
    originId: '',
    areaId: '',
    year: '',
    testId: '',
  });

  // Carrega opções de filtros e questões iniciais do backend
  useEffect(() => {
    const fetchInitialData = async () => {
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
        console.error('Erro ao carregar dados do backend:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Recarrega questões da API quando filtros específicos de servidor mudam
  const handleFilterChange = async (newFilters: FilterState) => {
    setFilters(newFilters);

    const needsServerFetch =
      newFilters.originId !== filters.originId ||
      newFilters.areaId !== filters.areaId ||
      newFilters.testId !== filters.testId ||
      newFilters.year !== filters.year;

    if (needsServerFetch) {
      setIsLoading(true);
      try {
        const qList = await getQuestions({
          originId: newFilters.originId,
          areaId: newFilters.areaId,
          testId: newFilters.testId,
          year: newFilters.year,
        });
        setQuestions(qList);
      } catch (err) {
        console.error('Erro ao filtrar questões:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleOpenSaveModal = (question: Question) => {
    setSelectedQuestionForSave(question);
    setSaveModalOpen(true);
  };

  // Filtragem dinâmica no cliente (busca textual e categoria)
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (filters.type === 'tests' && !q.testId) {
        return false;
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesEnunciado = q.enunciado.toLowerCase().includes(searchLower);
        const matchesIdentifier = q.identifier.toLowerCase().includes(searchLower);
        const matchesOrigin = q.originName?.toLowerCase().includes(searchLower);
        const matchesArea = q.areaName?.toLowerCase().includes(searchLower);
        const matchesTest = q.testName?.toLowerCase().includes(searchLower);
        if (!matchesEnunciado && !matchesIdentifier && !matchesOrigin && !matchesArea && !matchesTest) {
          return false;
        }
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
      />

      {/* Main Content Area */}
      <Container maxWidth="lg" sx={{ py: 4, flexGrow: 1 }}>
        {activeTab === 'pastas' ? (
          /* Aba de Pastas e Cadernos Salvos */
          <FoldersView onOpenSaveModal={handleOpenSaveModal} />
        ) : (
          /* Aba de Questões / Provas / Bancas / Áreas */
          <>
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
                  {activeTab === 'questoes' && 'Banco de Questões'}
                  {activeTab === 'provas' && 'Provas & Vestibulares'}
                  {activeTab === 'bancas' && 'Bancas Examinadoras'}
                  {activeTab === 'areas' && 'Áreas do Conhecimento'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Questões reais integradas diretamente ao banco de dados com resolução interativa
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
                    onBookmarkClick={handleOpenSaveModal}
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
                    })
                  }
                  sx={{ borderColor: PALETTE_COLORS.primary, color: PALETTE_COLORS.primary }}
                >
                  Limpar Todos os Filtros
                </Button>
              </Paper>
            )}
          </>
        )}
      </Container>

      {/* Modal para salvar em pastas */}
      <SaveToFolderModal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        question={selectedQuestionForSave}
      />

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
