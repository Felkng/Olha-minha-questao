import React from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Paper,
  Button,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { Area, FilterState, Origin, Test } from '../../types';
import { PALETTE_COLORS } from '../../theme/theme';

interface SearchBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  origins: Origin[];
  areas: Area[];
  tests: Test[];
  totalResults: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  filters,
  onFilterChange,
  origins,
  areas,
  tests,
  totalResults,
}) => {
  const [searchTerm, setSearchTerm] = React.useState(filters.search);

  // Sync internal search term when external filters.search changes (e.g. Clear Filters)
  React.useEffect(() => {
    setSearchTerm(filters.search);
  }, [filters.search]);

  // Debounce search update to avoid firing requests on every keystroke
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        onFilterChange({ ...filters, search: searchTerm });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onFilterChange({ ...filters, search: searchTerm });
    }
  };

  const hasActiveFilters =
    filters.search !== '' ||
    filters.type !== 'all' ||
    filters.originId !== '' ||
    filters.areaId !== '' ||
    filters.year !== '' ||
    filters.testId !== '' ||
    Boolean(filters.difficulty);

  const handleClear = () => {
    setSearchTerm('');
    onFilterChange({
      search: '',
      type: 'all',
      originId: '',
      areaId: '',
      year: '',
      testId: '',
      difficulty: '',
      sort: 'recent',
    });
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 2.5 },
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        {/* Main Search Input */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Pesquise por enunciado, palavras-chave, número da questão ou disciplina..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: PALETTE_COLORS.primary }} />
                </InputAdornment>
              ),
              sx: { height: 48 },
            }}
          />
        </Box>

        {/* Filters Row */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(6, 1fr)',
            },
            gap: 1.5,
          }}
        >
          {/* Dificuldade */}
          <FormControl size="small" fullWidth>
            <InputLabel id="difficulty-select-label">Dificuldade</InputLabel>
            <Select
              labelId="difficulty-select-label"
              label="Dificuldade"
              value={filters.difficulty || ''}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  difficulty: e.target.value,
                })
              }
            >
              <MenuItem value="">Todas</MenuItem>
              <MenuItem value="FACIL">Fácil (≥ 80%)</MenuItem>
              <MenuItem value="MEDIA">Média (50% - 79%)</MenuItem>
              <MenuItem value="DIFICIL">Difícil (&lt; 50%)</MenuItem>
            </Select>
          </FormControl>

          {/* Tipo */}
          <FormControl size="small" fullWidth>
            <InputLabel id="type-select-label">Tipo</InputLabel>
            <Select
              labelId="type-select-label"
              label="Tipo"
              value={filters.type}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  type: e.target.value as 'all' | 'questions' | 'tests',
                })
              }
            >
              <MenuItem value="all">Todas as Categorias</MenuItem>
              <MenuItem value="questions">Apenas Questões</MenuItem>
              <MenuItem value="tests">Apenas Provas</MenuItem>
            </Select>
          </FormControl>

          {/* Banca / Origem */}
          <FormControl size="small" fullWidth>
            <InputLabel id="origin-select-label">Banca / Origem</InputLabel>
            <Select
              labelId="origin-select-label"
              label="Banca / Origem"
              value={filters.originId}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  originId: e.target.value as number | '',
                })
              }
            >
              <MenuItem value="">Todas as Bancas</MenuItem>
              {origins.map((orig) => (
                <MenuItem key={orig.id} value={orig.id}>
                  {orig.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Área do Conhecimento */}
          <FormControl size="small" fullWidth>
            <InputLabel id="area-select-label">Área</InputLabel>
            <Select
              labelId="area-select-label"
              label="Área"
              value={filters.areaId}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  areaId: e.target.value as number | '',
                })
              }
            >
              <MenuItem value="">Todas as Áreas</MenuItem>
              {areas.map((area) => (
                <MenuItem key={area.id} value={area.id}>
                  {area.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Ano */}
          <FormControl size="small" fullWidth>
            <InputLabel id="year-select-label">Ano</InputLabel>
            <Select
              labelId="year-select-label"
              label="Ano"
              value={filters.year}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  year: e.target.value as number | '',
                })
              }
            >
              <MenuItem value="">Todos os Anos</MenuItem>
              {[2024, 2023, 2022, 2021, 2020].map((yr) => (
                <MenuItem key={yr} value={yr}>
                  {yr}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Prova Específica */}
          <FormControl size="small" fullWidth>
            <InputLabel id="test-select-label">Prova</InputLabel>
            <Select
              labelId="test-select-label"
              label="Prova"
              value={filters.testId}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  testId: e.target.value as number | '',
                })
              }
            >
              <MenuItem value="">Todas as Provas</MenuItem>
              {tests.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Active Filter Chips & Results Count */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            mt: 2,
            pt: 1.5,
            borderTop: '1px solid',
            borderColor: 'divider',
            gap: 1,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mr: 1 }}>
              RESULTADOS: {totalResults}
            </Typography>

            {filters.search && (
              <Chip
                size="small"
                label={`Busca: "${filters.search}"`}
                onDelete={() => onFilterChange({ ...filters, search: '' })}
                sx={{ borderColor: PALETTE_COLORS.primary }}
                variant="outlined"
              />
            )}
            {filters.difficulty && (
              <Chip
                size="small"
                label={`Dificuldade: ${filters.difficulty === 'FACIL' ? 'Fácil' : filters.difficulty === 'MEDIA' ? 'Média' : 'Difícil'}`}
                onDelete={() => onFilterChange({ ...filters, difficulty: '' })}
                variant="outlined"
              />
            )}
            {filters.type !== 'all' && (
              <Chip
                size="small"
                label={`Tipo: ${filters.type === 'questions' ? 'Questões' : 'Provas'}`}
                onDelete={() => onFilterChange({ ...filters, type: 'all' })}
                variant="outlined"
              />
            )}
            {filters.originId !== '' && (
              <Chip
                size="small"
                label={`Banca: ${origins.find((o) => o.id === filters.originId)?.name || filters.originId}`}
                onDelete={() => onFilterChange({ ...filters, originId: '' })}
                variant="outlined"
              />
            )}
            {filters.areaId !== '' && (
              <Chip
                size="small"
                label={`Área: ${areas.find((a) => a.id === filters.areaId)?.name || filters.areaId}`}
                onDelete={() => onFilterChange({ ...filters, areaId: '' })}
                variant="outlined"
              />
            )}
            {filters.year !== '' && (
              <Chip
                size="small"
                label={`Ano: ${filters.year}`}
                onDelete={() => onFilterChange({ ...filters, year: '' })}
                variant="outlined"
              />
            )}
            {filters.testId !== '' && (
              <Chip
                size="small"
                label={`Prova: ${tests.find((t) => t.id === filters.testId)?.name || filters.testId}`}
                onDelete={() => onFilterChange({ ...filters, testId: '' })}
                variant="outlined"
              />
            )}
          </Stack>

          {hasActiveFilters && (
            <Button
              size="small"
              startIcon={<ClearIcon fontSize="small" />}
              onClick={handleClear}
              sx={{ color: 'text.secondary', fontSize: '0.8rem' }}
            >
              Limpar Filtros
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
};
