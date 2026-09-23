import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { CardGridSkeleton } from '../components/skeletons';
import AddIcon from '@mui/icons-material/Add';
import StyleOutlinedIcon from '@mui/icons-material/StyleOutlined';
import FolderSpecialOutlinedIcon from '@mui/icons-material/FolderSpecialOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FlipCameraAndroidIcon from '@mui/icons-material/FlipCameraAndroid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PublicIcon from '@mui/icons-material/Public';
import SearchIcon from '@mui/icons-material/Search';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';
import { Area, Flashcard, Folder, Subject } from '../types';
import {
  createFolder,
  deleteFlashcard,
  deleteFolder,
  getAreas,
  getFlashcards,
  getFolders,
  getSubjectsByArea,
  toggleFlashcardVisibility,
  toggleFolderVisibility,
} from '../services/api';
import { PALETTE_COLORS } from '../theme/theme';
import { useAppTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { CreateFlashcardModal } from '../components/crud/CreateFlashcardModal';
import { EditFlashcardModal } from '../components/crud/EditFlashcardModal';
import { EditFolderModal } from '../components/crud/EditFolderModal';
import { SaveFlashcardToFolderModal } from '../components/folders/SaveFlashcardToFolderModal';

const COLOR_OPTIONS = [
  { hex: PALETTE_COLORS.primary, label: 'Ocre' },
  { hex: PALETTE_COLORS.secondary, label: 'Azul' },
  { hex: PALETTE_COLORS.success, label: 'Verde' },
  { hex: PALETTE_COLORS.danger, label: 'Vermelho' },
  { hex: PALETTE_COLORS.warning, label: 'Amarelo' },
  { hex: '#b388ff', label: 'Roxo' },
  { hex: '#ff80ab', label: 'Rosa' },
];

export const FlashcardsPage: React.FC = () => {
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  // View mode: 'decks' (Pastas) or 'cards' (Cartas Avulsas)
  const [viewMode, setViewMode] = useState<'decks' | 'cards'>('decks');

  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for Cards
  const [search, setSearch] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState<number | ''>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | ''>('');
  const [selectedFolderId, setSelectedFolderId] = useState<number | ''>('');

  // Filter for Decks
  const [folderSearch, setFolderSearch] = useState('');

  // Modals
  const [createCardModalOpen, setCreateCardModalOpen] = useState(false);
  const [editCardModalOpen, setEditCardModalOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<Flashcard | null>(null);
  const [saveToFolderOpen, setSaveToFolderOpen] = useState(false);
  const [cardForFolder, setCardForFolder] = useState<Flashcard | null>(null);

  // Folder creation modal
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [folderDesc, setFolderDesc] = useState('');
  const [folderColor, setFolderColor] = useState(PALETTE_COLORS.primary);
  const [folderIsPublic, setFolderIsPublic] = useState(true);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [editFolderModalOpen, setEditFolderModalOpen] = useState(false);
  const [savingFolder, setSavingFolder] = useState(false);

  // Card Flip Previews state
  const [flippedCardIds, setFlippedCardIds] = useState<Set<number>>(new Set());

  const toggleCardFlip = (cardId: number) => {
    setFlippedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [fCards, fFolders, aList] = await Promise.all([
        getFlashcards({
          areaId: selectedAreaId,
          subjectId: selectedSubjectId,
          folderId: selectedFolderId,
          search: search.trim() || undefined,
          size: 100,
        }),
        getFolders('FLASHCARD'),
        getAreas(),
      ]);

      setFlashcards(fCards.content);
      setFolders(fFolders);
      setAreas(aList);
    } catch (err) {
      console.error('Erro ao carregar flashcards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedAreaId, selectedSubjectId, selectedFolderId, user?.id]);

  const handleAreaFilterChange = async (areaId: number | '') => {
    setSelectedAreaId(areaId);
    setSelectedSubjectId('');
    if (areaId) {
      try {
        const sList = await getSubjectsByArea(areaId);
        setSubjects(sList);
      } catch (err) {
        console.error('Erro ao carregar matérias:', err);
      }
    } else {
      setSubjects([]);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    setSavingFolder(true);
    try {
      await createFolder({
        name: folderName.trim(),
        description: folderDesc.trim() || undefined,
        color: folderColor,
        folderType: 'FLASHCARD',
        isPublic: folderIsPublic,
      });
      setFolderName('');
      setFolderDesc('');
      setCreateFolderOpen(false);
      loadData();
    } catch (err) {
      console.error('Erro ao criar pasta de flashcards:', err);
    } finally {
      setSavingFolder(false);
    }
  };

  const handleDeleteFolder = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir esta pasta de flashcards?')) {
      try {
        await deleteFolder(id);
        loadData();
      } catch (err) {
        console.error('Erro ao excluir pasta:', err);
      }
    }
  };

  const handleDeleteFlashcard = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este flashcard?')) {
      try {
        await deleteFlashcard(id);
        loadData();
      } catch (err) {
        console.error('Erro ao excluir flashcard:', err);
      }
    }
  };

  const handleToggleFlashcardVisibility = async (id: number) => {
    try {
      await toggleFlashcardVisibility(id);
      loadData();
    } catch (err) {
      console.error('Erro ao alternar visibilidade:', err);
    }
  };

  const handleToggleFolderVisibility = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await toggleFolderVisibility(id);
      loadData();
    } catch (err) {
      console.error('Erro ao alternar visibilidade da pasta:', err);
    }
  };

  const handleStartStudy = (fId?: number) => {
    let url = '/flashcards/estudo';
    const params = new URLSearchParams();
    if (fId) params.append('folderId', String(fId));
    if (selectedAreaId) params.append('areaId', String(selectedAreaId));
    if (selectedSubjectId) params.append('subjectId', String(selectedSubjectId));

    const qs = params.toString();
    if (qs) url += `?${qs}`;
    navigate(url);
  };

  const filteredFolders = folders.filter((f) => {
    if (!folderSearch.trim()) return true;
    const term = folderSearch.toLowerCase();
    return (
      f.name.toLowerCase().includes(term) ||
      (f.description && f.description.toLowerCase().includes(term))
    );
  });

  return (
    <Box sx={{ mb: 6 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Flashcards & Decks de Estudo
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Memorize e revise matérias rapidamente com cartões interativos de repetição ativa.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<FolderSpecialOutlinedIcon />}
            onClick={() => setCreateFolderOpen(true)}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            Novo Deck / Pasta
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateCardModalOpen(true)}
            sx={{ fontWeight: 700, borderRadius: 2, backgroundColor: PALETTE_COLORS.primary }}
          >
            Novo Flashcard
          </Button>
        </Stack>
      </Box>

      {/* Tabs de Navegação: Decks vs Flashcards Avulsos */}
      <Paper elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={viewMode}
          onChange={(_e, val) => setViewMode(val)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            '& .MuiTab-root': {
              fontWeight: 700,
              textTransform: 'none',
              fontSize: { xs: '0.85rem', sm: '0.95rem' },
            },
          }}
        >
          <Tab
            icon={<FolderSpecialOutlinedIcon />}
            iconPosition="start"
            label={`Decks / Pastas (${folders.length})`}
            value="decks"
            sx={{ fontWeight: 700, textTransform: 'none', fontSize: '0.95rem' }}
          />
          <Tab
            icon={<StyleOutlinedIcon />}
            iconPosition="start"
            label={`Flashcards Individuais (${flashcards.length})`}
            value="cards"
            sx={{ fontWeight: 700, textTransform: 'none', fontSize: '0.95rem' }}
          />
        </Tabs>
      </Paper>

      {/* ========================================================= */}
      {/* VISÃO 1: DECKS / PASTAS                                   */}
      {/* ========================================================= */}
      {viewMode === 'decks' && (
        <Box>
          {/* Busca de Decks */}
          <Paper elevation={2} sx={{ p: 2, borderRadius: 3, mb: 3 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar decks e pastas por nome ou descrição..."
              value={folderSearch}
              onChange={(e) => setFolderSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
              }}
            />
          </Paper>

          {loading ? (
            <CardGridSkeleton count={6} columns={{ xs: 12, sm: 6, md: 4 }} cardHeight={190} />
          ) : filteredFolders.length > 0 ? (
            <Grid container spacing={3}>
              {filteredFolders.map((folder) => {
                const isOwner = Boolean(user?.id && folder.createdByUser?.id === user.id);
                const canEdit = isOwner || (isAdmin && folder.isPublic !== false);
                const canDelete = isOwner || (isAdmin && folder.isPublic !== false);

                return (
                  <Grid item xs={12} sm={6} md={4} key={folder.id}>
                    <Paper
                      elevation={3}
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        borderLeft: `6px solid ${folder.color || PALETTE_COLORS.primary}`,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        height: '100%',
                        transition: 'all 0.2s ease',
                        '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
                      }}
                    >
                      <Box>
                        {/* Deck Header */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1, gap: 1 }}>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }} noWrap>
                              {folder.name}
                            </Typography>
                          </Box>

                          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
                            <Tooltip title={folder.isPublic ? 'Público' : 'Privado'}>
                              <IconButton
                                size="small"
                                onClick={(e) => isOwner && handleToggleFolderVisibility(e, folder.id)}
                                disabled={!isOwner}
                                sx={{ cursor: isOwner ? 'pointer' : 'default' }}
                              >
                                {folder.isPublic ? (
                                  <PublicIcon fontSize="small" sx={{ color: PALETTE_COLORS.success }} />
                                ) : (
                                  <LockOutlinedIcon fontSize="small" sx={{ color: PALETTE_COLORS.primary }} />
                                )}
                              </IconButton>
                            </Tooltip>

                            {canEdit && (
                              <Tooltip title="Editar deck">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingFolder(folder);
                                    setEditFolderModalOpen(true);
                                  }}
                                  sx={{ color: 'text.secondary', '&:hover': { color: PALETTE_COLORS.primary } }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}

                            {canDelete && (
                              <Tooltip title="Excluir pasta">
                                <IconButton
                                  size="small"
                                  onClick={(e) => handleDeleteFolder(e, folder.id)}
                                  sx={{ color: 'text.secondary', '&:hover': { color: PALETTE_COLORS.danger } }}
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </Box>

                        {/* Deck Description */}
                        {folder.description ? (
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'text.secondary',
                              mb: 2,
                              minHeight: 40,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {folder.description}
                          </Typography>
                        ) : (
                          <Box sx={{ minHeight: 40, mb: 2 }} />
                        )}
                      </Box>

                      {/* Deck Footer */}
                      <Box sx={{ pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                          <Chip
                            size="small"
                            label={`${folder.flashcardCount ?? 0} cards`}
                            sx={{
                              backgroundColor: `${folder.color || PALETTE_COLORS.primary}20`,
                              color: folder.color || PALETTE_COLORS.primary,
                              fontWeight: 800,
                            }}
                          />
                          {folder.createdByUser && (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              Por: {folder.createdByUser.name}
                            </Typography>
                          )}
                        </Stack>

                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            variant="outlined"
                            fullWidth
                            endIcon={<ArrowForwardIcon />}
                            onClick={() => navigate(`/pastas/${folder.id}`)}
                            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                          >
                            Ver Cartas
                          </Button>

                          <Button
                            size="small"
                            variant="contained"
                            fullWidth
                            startIcon={<PlayArrowIcon />}
                            onClick={() => handleStartStudy(folder.id)}
                            disabled={!folder.flashcardCount || folder.flashcardCount === 0}
                            sx={{
                              fontWeight: 700,
                              borderRadius: 2,
                              backgroundColor: folder.color || PALETTE_COLORS.primary,
                              color: '#1a1e24',
                              textTransform: 'none',
                            }}
                          >
                            Praticar
                          </Button>
                        </Stack>
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <Paper elevation={3} sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
              <FolderSpecialOutlinedIcon sx={{ fontSize: 52, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                Nenhum deck de flashcards encontrado
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 450, mx: 'auto' }}>
                Organize seus flashcards em decks temáticos para facilitar suas revisões e prática espaçada.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateFolderOpen(true)}
                sx={{ fontWeight: 700, backgroundColor: PALETTE_COLORS.primary }}
              >
                Criar Primeiro Deck
              </Button>
            </Paper>
          )}
        </Box>
      )}

      {/* ========================================================= */}
      {/* VISÃO 2: FLASHCARDS INDIVIDUAIS                           */}
      {/* ========================================================= */}
      {viewMode === 'cards' && (
        <Box>
          {/* Filters Bar */}
          <Paper elevation={3} sx={{ p: 2.5, borderRadius: 3, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <Box component="form" onSubmit={handleSearchSubmit}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Buscar flashcards por texto..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                    }}
                  />
                </Box>
              </Grid>

              <Grid item xs={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Área</InputLabel>
                  <Select
                    value={selectedAreaId}
                    label="Área"
                    onChange={(e) => handleAreaFilterChange(e.target.value as number | '')}
                  >
                    <MenuItem value="">Todas as Áreas</MenuItem>
                    {areas.map((a) => (
                      <MenuItem key={a.id} value={a.id}>
                        {a.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Matéria</InputLabel>
                  <Select
                    value={selectedSubjectId}
                    label="Matéria"
                    onChange={(e) => setSelectedSubjectId(e.target.value as number | '')}
                  >
                    <MenuItem value="">Todas as Matérias</MenuItem>
                    {subjects.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Pasta / Deck</InputLabel>
                  <Select
                    value={selectedFolderId}
                    label="Pasta / Deck"
                    onChange={(e) => setSelectedFolderId(e.target.value as number | '')}
                  >
                    <MenuItem value="">Todas as Pastas</MenuItem>
                    {folders.map((f) => (
                      <MenuItem key={f.id} value={f.id}>
                        {f.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6} md={2}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<PlayArrowIcon />}
                  onClick={() => handleStartStudy()}
                  disabled={flashcards.length === 0}
                  sx={{
                    fontWeight: 700,
                    borderRadius: 2,
                    backgroundColor: PALETTE_COLORS.success,
                    color: '#0f2910',
                  }}
                >
                  Praticar ({flashcards.length})
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Flashcards List */}
          {loading ? (
            <CardGridSkeleton count={6} columns={{ xs: 12, sm: 6, md: 4 }} cardHeight={220} />
          ) : flashcards.length > 0 ? (
            <Grid container spacing={2.5}>
              {flashcards.map((card) => {
                const isFlipped = flippedCardIds.has(card.id);
                const isOwner = user?.id && card.createdByUser?.id === user.id;
                const canEdit = isOwner || isAdmin;
                const canDelete = isOwner || (isAdmin && card.isPublic);

                return (
                  <Grid item xs={12} sm={6} md={4} key={card.id}>
                    <Paper
                      elevation={3}
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        border: '1px solid',
                        borderColor: isFlipped ? PALETTE_COLORS.primary : 'divider',
                        backgroundColor: isFlipped
                          ? isDark
                            ? 'rgba(217, 183, 99, 0.06)'
                            : 'rgba(217, 183, 99, 0.08)'
                          : 'background.paper',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Box>
                        {/* Card Top Metadata & Controls (com espaçamento limpo entre chips) */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2, gap: 1 }}>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, alignItems: 'center', flex: 1, minWidth: 0 }}>
                            {card.areaName && (
                              <Chip
                                size="small"
                                label={card.areaName}
                                sx={{
                                  fontWeight: 700,
                                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                                }}
                              />
                            )}
                            {card.subjectName && (
                              <Chip
                                size="small"
                                label={card.subjectName}
                                variant="outlined"
                                sx={{ fontWeight: 600 }}
                              />
                            )}
                            {card.folderName && (
                              <Chip
                                size="small"
                                icon={<FolderSpecialOutlinedIcon style={{ color: card.folderColor || PALETTE_COLORS.primary, fontSize: 16 }} />}
                                label={card.folderName}
                                variant="outlined"
                                sx={{
                                  fontWeight: 600,
                                  borderColor: card.folderColor || PALETTE_COLORS.primary,
                                }}
                              />
                            )}
                          </Box>

                          {/* Action Icons */}
                          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
                            {/* Salvar / Mover para Pasta */}
                            <Tooltip title={card.folderId ? `Salvo na pasta "${card.folderName}" (Clique para alterar)` : 'Salvar em Pasta / Deck'}>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setCardForFolder(card);
                                  setSaveToFolderOpen(true);
                                }}
                              >
                                {card.folderId ? (
                                  <BookmarkIcon fontSize="small" sx={{ color: card.folderColor || PALETTE_COLORS.primary }} />
                                ) : (
                                  <BookmarkBorderIcon fontSize="small" />
                                )}
                              </IconButton>
                            </Tooltip>

                            <Tooltip title={card.isPublic ? 'Público' : 'Privado'}>
                              <IconButton
                                size="small"
                                onClick={() => isOwner && handleToggleFlashcardVisibility(card.id)}
                                disabled={!isOwner}
                                sx={{ cursor: isOwner ? 'pointer' : 'default' }}
                              >
                                {card.isPublic ? (
                                  <PublicIcon fontSize="small" sx={{ color: PALETTE_COLORS.success }} />
                                ) : (
                                  <LockOutlinedIcon fontSize="small" sx={{ color: PALETTE_COLORS.primary }} />
                                )}
                              </IconButton>
                            </Tooltip>

                            {canEdit && (
                              <Tooltip title="Editar flashcard">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setCardToEdit(card);
                                    setEditCardModalOpen(true);
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}

                            {canDelete && (
                              <Tooltip title={isAdmin && !isOwner ? 'Excluir como Moderador Admin' : 'Excluir flashcard'}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteFlashcard(card.id)}
                                  sx={{ color: 'text.secondary', '&:hover': { color: PALETTE_COLORS.danger } }}
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </Box>

                        {/* Content Section (Front or Back) */}
                        <Box sx={{ my: 2 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 800,
                              color: isFlipped ? PALETTE_COLORS.primary : 'text.secondary',
                              display: 'block',
                              mb: 0.5,
                            }}
                          >
                            {isFlipped ? 'VERSO (RESPOSTA):' : 'FRENTE (PERGUNTA):'}
                          </Typography>

                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: isFlipped ? 500 : 700,
                              minHeight: 64,
                              lineHeight: 1.5,
                            }}
                          >
                            {isFlipped ? card.back : card.front}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Card Bottom Actions */}
                      <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Button
                          size="small"
                          startIcon={<FlipCameraAndroidIcon />}
                          onClick={() => toggleCardFlip(card.id)}
                          sx={{ fontWeight: 700, textTransform: 'none' }}
                        >
                          {isFlipped ? 'Ver Pergunta' : 'Revelar Resposta'}
                        </Button>

                        {card.createdByUser && (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Por: {card.createdByUser.name}
                          </Typography>
                        )}
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <Paper elevation={3} sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
              <StyleOutlinedIcon sx={{ fontSize: 52, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                Nenhum flashcard encontrado
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Crie novos flashcards para iniciar seu treinamento e memorização ativa.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateCardModalOpen(true)}
                sx={{ fontWeight: 700, backgroundColor: PALETTE_COLORS.primary }}
              >
                Criar Primeiro Flashcard
              </Button>
            </Paper>
          )}
        </Box>
      )}

      {/* ========================================================= */}
      {/* MODAIS                                                    */}
      {/* ========================================================= */}

      {/* Modal de Criação de Flashcard */}
      <CreateFlashcardModal
        open={createCardModalOpen}
        onClose={() => setCreateCardModalOpen(false)}
        onCreated={() => loadData()}
      />

      {/* Modal de Edição de Flashcard */}
      <EditFlashcardModal
        open={editCardModalOpen}
        flashcard={cardToEdit}
        onClose={() => {
          setEditCardModalOpen(false);
          setCardToEdit(null);
        }}
        onUpdated={() => loadData()}
      />

      {/* Modal de Criação de Nova Pasta / Deck */}
      <Dialog open={createFolderOpen} onClose={() => setCreateFolderOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Criar Novo Deck / Pasta de Flashcards</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Nome do Deck / Pasta"
            fullWidth
            size="small"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            sx={{ mb: 2 }}
            autoFocus
          />

          <TextField
            label="Descrição (Opcional)"
            fullWidth
            size="small"
            multiline
            rows={2}
            value={folderDesc}
            onChange={(e) => setFolderDesc(e.target.value)}
            sx={{ mb: 3 }}
          />

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Cor de Destaque
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
            {COLOR_OPTIONS.map((c) => (
              <Box
                key={c.hex}
                onClick={() => setFolderColor(c.hex)}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: c.hex,
                  cursor: 'pointer',
                  border: folderColor === c.hex ? '3px solid #fff' : '2px solid transparent',
                  boxShadow: folderColor === c.hex ? `0 0 0 2px ${c.hex}` : 'none',
                }}
              />
            ))}
          </Stack>

          {/* Privacy Switch */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1.5,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: folderIsPublic ? 'rgba(75, 241, 81, 0.05)' : 'rgba(217, 183, 99, 0.05)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {folderIsPublic ? (
                <PublicIcon sx={{ color: PALETTE_COLORS.success }} />
              ) : (
                <LockOutlinedIcon sx={{ color: PALETTE_COLORS.primary }} />
              )}
              <Box>
                <Typography variant="body2" fontWeight={700}>
                  {folderIsPublic ? 'Pasta Pública' : 'Pasta Privada'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {folderIsPublic
                    ? 'Visível para todos os estudantes da comunidade.'
                    : 'Visível apenas para você em sua conta.'}
                </Typography>
              </Box>
            </Box>
            <Button
              size="small"
              onClick={() => setFolderIsPublic(!folderIsPublic)}
              sx={{ fontWeight: 700 }}
            >
              {folderIsPublic ? 'Tornar Privada' : 'Tornar Pública'}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCreateFolderOpen(false)} sx={{ color: 'text.secondary' }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateFolder}
            disabled={!folderName.trim() || savingFolder}
            sx={{
              backgroundColor: folderColor,
              color: '#1a1e24',
              fontWeight: 700,
            }}
          >
            {savingFolder ? 'Criando...' : 'Criar Pasta'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Salvar Flashcard em Pasta / Deck */}
      <SaveFlashcardToFolderModal
        open={saveToFolderOpen}
        flashcard={cardForFolder}
        onClose={() => {
          setSaveToFolderOpen(false);
          setCardForFolder(null);
        }}
        onSavedStatusChange={loadData}
      />

      {/* Modal de Edição de Deck / Pasta */}
      <EditFolderModal
        open={editFolderModalOpen}
        folder={editingFolder}
        onClose={() => {
          setEditFolderModalOpen(false);
          setEditingFolder(null);
        }}
        onUpdated={() => loadData()}
      />
    </Box>
  );
};
