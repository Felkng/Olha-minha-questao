import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  Grid,
  Stack,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PublicIcon from '@mui/icons-material/Public';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useNavigate } from 'react-router-dom';
import { TestCard } from '../types';
import { getTestCards, deleteTest, toggleTestVisibility } from '../services/api';
import { PALETTE_COLORS } from '../theme/theme';
import { useAppTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { CreateTestWizardModal } from '../components/crud/CreateTestWizardModal';
import { EditTestModal } from '../components/crud/EditTestModal';
import { CardGridSkeleton } from '../components/skeletons';

export const TestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';
  const { user, isAdmin } = useAuth();

  const [tests, setTests] = useState<TestCard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<TestCard | null>(null);
  const [deletingTest, setDeletingTest] = useState<TestCard | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    setLoading(true);
    try {
      const data = await getTestCards();
      setTests(data);
    } catch (err) {
      console.error('Erro ao carregar provas:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
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

  if (loading) {
    return (
      <Box sx={{ mb: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
              Provas & Simulados
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Selecione uma prova para iniciar a avaliação com cronômetro personalizado e feedback de desempenho.
            </Typography>
          </Box>
        </Box>
        <CardGridSkeleton count={6} columns={{ xs: 12, sm: 12, md: 6 }} cardHeight={220} />
      </Box>
    );
  }

  const filteredTests = tests.filter((test) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchName = test.name.toLowerCase().includes(term);
    const matchOrigin = test.originName ? test.originName.toLowerCase().includes(term) : false;
    const matchArea = test.areaName ? test.areaName.toLowerCase().includes(term) : false;
    const matchYear = test.year ? String(test.year).includes(term) : false;
    return matchName || matchOrigin || matchArea || matchYear;
  });

  return (
    <Box sx={{ mb: 6 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
            Provas & Simulados
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Selecione uma prova para iniciar a avaliação com cronômetro personalizado e feedback de desempenho.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateModalOpen(true)}
          sx={{ fontWeight: 700, backgroundColor: PALETTE_COLORS.primary }}
        >
          Nova Prova
        </Button>
      </Box>

      {/* Barra de Pesquisa */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 2.5 },
          mb: 3.5,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', width: '100%' }}>
          <TextField
            fullWidth
            placeholder="Pesquisar prova por nome, banca, área ou ano..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: PALETTE_COLORS.primary, fontSize: '1.4rem' }} />
                </InputAdornment>
              ),
              endAdornment: searchTerm ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm('')} edge="end">
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
        </Box>
        {searchTerm && (
          <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              {filteredTests.length} {filteredTests.length === 1 ? 'prova encontrada' : 'provas encontradas'}
            </Typography>
            <Button
              size="small"
              onClick={() => setSearchTerm('')}
              sx={{ color: 'text.secondary', textTransform: 'none', fontWeight: 600 }}
            >
              Limpar busca
            </Button>
          </Box>
        )}
      </Paper>

      {tests.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Nenhuma prova encontrada cadastrada no sistema.
        </Alert>
      ) : filteredTests.length === 0 ? (
        <Alert
          severity="info"
          sx={{ borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => setSearchTerm('')}>
              Limpar busca
            </Button>
          }
        >
          Nenhuma prova encontrada para "{searchTerm}".
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredTests.map((test) => {
            const isOwner = Boolean(user?.id && test.createdByUser?.id && user.id === test.createdByUser.id);
            const isPublic = test.isPublic !== undefined ? test.isPublic : true;
            const canDelete = isOwner || (isAdmin && isPublic);

            return (
              <Grid item xs={12} md={6} key={test.id}>
                <Paper
                  elevation={4}
                  sx={{
                    p: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderRadius: 3,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: 6,
                    },
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5, gap: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                        {test.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {getDifficultyBadge(test.difficultyLevel)}
                        {isOwner && (
                          <Tooltip title="Editar prova">
                            <IconButton size="small" onClick={() => setEditingTest(test)}>
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canDelete && (
                          <Tooltip title={isAdmin && !isOwner ? "Moderar / Excluir prova pública (Admin)" : "Excluir prova"}>
                            <IconButton size="small" color="error" onClick={() => setDeletingTest(test)}>
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>

                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 0.8, mb: 2 }}>
                      <Chip
                        size="small"
                        label={`Ano ${test.year}`}
                        variant="outlined"
                        sx={{ borderColor: 'divider', color: 'text.secondary' }}
                      />
                      {test.originName && (
                        <Chip
                          size="small"
                          label={test.originName}
                          sx={{
                            backgroundColor: isDark ? 'rgba(90, 166, 226, 0.15)' : 'rgba(90, 166, 226, 0.12)',
                            color: PALETTE_COLORS.secondary,
                            fontWeight: 600,
                          }}
                        />
                      )}
                      {test.areaName && (
                        <Chip
                          size="small"
                          label={test.areaName}
                          variant="outlined"
                          sx={{ borderColor: PALETTE_COLORS.secondary, color: PALETTE_COLORS.secondary }}
                        />
                      )}
                      <Chip
                        size="small"
                        icon={<MenuBookIcon fontSize="small" />}
                        label={`${test.questionCount} questões`}
                        sx={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
                      />

                      <Tooltip title={isOwner ? "Clique para alternar visibilidade (Pública/Privada)" : (isPublic ? "Prova pública" : "Prova privada")}>
                        <Chip
                          size="small"
                          icon={isPublic ? <PublicIcon fontSize="inherit" /> : <LockOutlinedIcon fontSize="inherit" />}
                          label={isPublic ? 'Pública' : 'Privada'}
                          onClick={isOwner ? async () => {
                            try {
                              await toggleTestVisibility(test.id);
                              loadTests();
                            } catch (e) { console.error(e); }
                          } : undefined}
                          clickable={isOwner}
                          sx={{
                            backgroundColor: isPublic
                              ? (isDark ? 'rgba(75, 241, 81, 0.12)' : 'rgba(75, 241, 81, 0.15)')
                              : (isDark ? 'rgba(250, 66, 75, 0.12)' : 'rgba(250, 66, 75, 0.15)'),
                            color: isPublic ? PALETTE_COLORS.success : PALETTE_COLORS.danger,
                            border: '1px solid',
                            borderColor: isPublic ? PALETTE_COLORS.success : PALETTE_COLORS.danger,
                            fontWeight: 700,
                            cursor: isOwner ? 'pointer' : 'default',
                          }}
                        />
                      </Tooltip>
                    </Stack>

                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        mb: 2.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <TrendingUpIcon fontSize="small" sx={{ color: PALETTE_COLORS.primary }} />
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Média de Acertos:{' '}
                          <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            {test.averageScore > 0 ? `${test.averageScore.toFixed(1)}%` : '—'}
                          </Box>
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <CheckCircleOutlineIcon fontSize="small" sx={{ color: PALETTE_COLORS.secondary }} />
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Resoluções:{' '}
                          <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            {test.totalAttempts}
                          </Box>
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    startIcon={<PlayArrowIcon />}
                    onClick={() => navigate(`/provas/${test.id}`)}
                    sx={{ fontWeight: 700, py: 1.2, borderRadius: 2 }}
                  >
                    Iniciar Avaliação
                  </Button>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      <CreateTestWizardModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={() => loadTests()}
      />

      <EditTestModal
        open={Boolean(editingTest)}
        test={editingTest}
        onClose={() => setEditingTest(null)}
        onUpdated={() => {
          setEditingTest(null);
          loadTests();
        }}
      />

      <Dialog
        open={Boolean(deletingTest)}
        onClose={() => !isDeleting && setDeletingTest(null)}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {isAdmin && deletingTest?.createdByUser?.id !== user?.id
            ? 'Moderação: Excluir Prova Pública'
            : 'Excluir Prova'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {isAdmin && deletingTest?.createdByUser?.id !== user?.id
              ? `Como Administrador, você está prestes a remover a prova pública "${deletingTest?.name}" criada por outro usuário. Deseja continuar?`
              : `Tem certeza que deseja excluir a prova "${deletingTest?.name}"? Esta ação removerá a prova e suas vinculações.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeletingTest(null)}
            disabled={isDeleting}
            sx={{ color: 'text.secondary' }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              if (!deletingTest) return;
              setIsDeleting(true);
              try {
                await deleteTest(deletingTest.id);
                setDeletingTest(null);
                loadTests();
              } catch (err) {
                console.error('Erro ao excluir prova:', err);
              } finally {
                setIsDeleting(false);
              }
            }}
            disabled={isDeleting}
            sx={{ fontWeight: 700 }}
          >
            {isDeleting ? 'Excluindo...' : 'Excluir Prova'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
