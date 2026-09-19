import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Tabs,
  Tab,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import FolderSpecialOutlinedIcon from '@mui/icons-material/FolderSpecialOutlined';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import { useNavigate } from 'react-router-dom';
import { Folder, FolderType } from '../types';
import {
  createFolder,
  deleteFolder,
  getFolders,
} from '../services/api';
import { PALETTE_COLORS } from '../theme/theme';

const COLOR_OPTIONS = [
  { hex: PALETTE_COLORS.primary, label: 'Ocre' },
  { hex: PALETTE_COLORS.secondary, label: 'Azul' },
  { hex: PALETTE_COLORS.success, label: 'Verde' },
  { hex: PALETTE_COLORS.danger, label: 'Vermelho' },
  { hex: PALETTE_COLORS.warning, label: 'Amarelo' },
  { hex: '#b388ff', label: 'Roxo' },
  { hex: '#ff80ab', label: 'Rosa' },
];

export const FoldersPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState<FolderType>('QUESTION');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal para criar nova pasta
  const [openCreateDialog, setOpenCreateDialog] = useState<boolean>(false);
  const [folderName, setFolderName] = useState<string>('');
  const [folderDesc, setFolderDesc] = useState<string>('');
  const [folderColor, setFolderColor] = useState<string>(PALETTE_COLORS.primary);
  const [folderType, setFolderType] = useState<FolderType>('QUESTION');
  const [saving, setSaving] = useState<boolean>(false);

  const loadFolders = async (type: FolderType) => {
    setLoading(true);
    try {
      const data = await getFolders(type);
      setFolders(data);
    } catch (err) {
      console.error('Erro ao carregar pastas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFolders(currentTab);
  }, [currentTab]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: FolderType) => {
    setCurrentTab(newValue);
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    setSaving(true);
    try {
      await createFolder({
        name: folderName.trim(),
        description: folderDesc.trim(),
        color: folderColor,
        folderType,
      });
      setFolderName('');
      setFolderDesc('');
      setOpenCreateDialog(false);
      loadFolders(currentTab);
    } catch (err) {
      console.error('Erro ao criar pasta:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFolder = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir esta pasta?')) {
      try {
        await deleteFolder(id);
        loadFolders(currentTab);
      } catch (err) {
        console.error('Erro ao excluir pasta:', err);
      }
    }
  };

  return (
    <Box sx={{ mb: 6 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Minhas Pastas & Cadernos de Estudo
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Organize suas questões e provas em pastas exclusivas e compartilháveis via URL pública.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setFolderType(currentTab);
            setOpenCreateDialog(true);
          }}
          sx={{ fontWeight: 700, backgroundColor: PALETTE_COLORS.primary }}
        >
          Nova Pasta
        </Button>
      </Box>

      {/* Tabs para separar Pastas de Questões e Pastas de Provas */}
      <Paper elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab
            icon={<QuizOutlinedIcon />}
            iconPosition="start"
            label="Pastas de Questões"
            value="QUESTION"
            sx={{ fontWeight: 700 }}
          />
          <Tab
            icon={<MenuBookOutlinedIcon />}
            iconPosition="start"
            label="Pastas de Provas"
            value="TEST"
            sx={{ fontWeight: 700 }}
          />
        </Tabs>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: PALETTE_COLORS.primary }} />
        </Box>
      ) : folders.length > 0 ? (
        <Grid container spacing={2.5}>
          {folders.map((folder) => (
            <Grid item xs={12} sm={6} md={4} key={folder.id}>
              <Paper
                elevation={4}
                onClick={() => navigate(`/pastas/${folder.id}`)}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  cursor: 'pointer',
                  position: 'relative',
                  borderLeft: `6px solid ${folder.color}`,
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FolderSpecialOutlinedIcon sx={{ color: folder.color, fontSize: 26 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                      {folder.name}
                    </Typography>
                  </Box>
                  <Tooltip title="Excluir pasta">
                    <IconButton
                      size="small"
                      onClick={(e) => handleDeleteFolder(e, folder.id)}
                      sx={{ color: 'text.secondary', '&:hover': { color: PALETTE_COLORS.danger } }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>

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
                  {folder.description || 'Sem descrição.'}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Chip
                    label={
                      folder.folderType === 'TEST'
                        ? `${folder.testCount ?? 0} provas`
                        : `${folder.questionCount ?? 0} questões`
                    }
                    size="small"
                    sx={{
                      backgroundColor: `${folder.color}20`,
                      color: folder.color,
                      fontWeight: 700,
                    }}
                  />
                  <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
                    Abrir pasta &rarr;
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper elevation={4} sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <FolderSpecialOutlinedIcon sx={{ fontSize: 52, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Nenhuma pasta de {currentTab === 'QUESTION' ? 'questões' : 'provas'} encontrada
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Crie pastas personalizadas para organizar suas {currentTab === 'QUESTION' ? 'questões' : 'provas'}.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => {
              setFolderType(currentTab);
              setOpenCreateDialog(true);
            }}
            sx={{ fontWeight: 700 }}
          >
            Criar Pasta
          </Button>
        </Paper>
      )}

      {/* Dialog para Criar Nova Pasta */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Criar Nova Pasta</DialogTitle>
        <DialogContent dividers>
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormLabel sx={{ fontWeight: 700, fontSize: '0.875rem' }}>TIPO DA PASTA:</FormLabel>
            <RadioGroup
              row
              value={folderType}
              onChange={(e) => setFolderType(e.target.value as FolderType)}
            >
              <FormControlLabel value="QUESTION" control={<Radio />} label="Guardar Questões" />
              <FormControlLabel value="TEST" control={<Radio />} label="Guardar Provas" />
            </RadioGroup>
          </FormControl>

          <TextField
            fullWidth
            label="Nome da Pasta (ex: Revisão Física)"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Descrição (opcional)"
            value={folderDesc}
            onChange={(e) => setFolderDesc(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 1 }}>
            COR PERSONALIZADA DA PASTA:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
            {COLOR_OPTIONS.map((c) => {
              const isSelected = folderColor === c.hex;
              return (
                <Chip
                  key={c.hex}
                  label={c.label}
                  onClick={() => setFolderColor(c.hex)}
                  sx={{
                    backgroundColor: c.hex,
                    color: '#1a1e24',
                    fontWeight: 700,
                    border: isSelected ? '2px solid #ffffff' : '1px solid rgba(0,0,0,0.1)',
                    boxShadow: isSelected ? `0 0 0 2px ${c.hex}` : 'none',
                  }}
                />
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenCreateDialog(false)} sx={{ color: 'text.secondary' }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateFolder}
            disabled={!folderName.trim() || saving}
            sx={{
              backgroundColor: folderColor,
              color: '#1a1e24',
              fontWeight: 700,
              '&:hover': { filter: 'brightness(0.9)' },
            }}
          >
            {saving ? 'Criar...' : 'Criar Pasta'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
