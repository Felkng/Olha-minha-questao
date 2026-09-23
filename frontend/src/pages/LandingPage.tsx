import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Chip,
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import StyleOutlinedIcon from '@mui/icons-material/StyleOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import DrawOutlinedIcon from '@mui/icons-material/DrawOutlined';
import FolderSpecialOutlinedIcon from '@mui/icons-material/FolderSpecialOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import FlipCameraAndroidIcon from '@mui/icons-material/FlipCameraAndroid';
import { useNavigate } from 'react-router-dom';
import { getPlatformSummary } from '../services/api';
import { PlatformSummary } from '../types';
import { AnimatedCounter } from '../components/landing/AnimatedCounter';
import { PALETTE_COLORS } from '../theme/theme';
import { useAppTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { RegisterModal } from '../components/auth/RegisterModal';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';
  const { user } = useAuth();

  const [stats, setStats] = useState<PlatformSummary>({
    totalQuestions: 0,
    totalTests: 0,
    totalFlashcards: 0,
    activeUsersLast5Days: 0,
    totalAttempts: 0,
    totalOrigins: 0,
    totalAreas: 0,
  });
  const [openRegister, setOpenRegister] = useState<boolean>(false);
  const [interactiveFlipped, setInteractiveFlipped] = useState<boolean>(false);

  useEffect(() => {
    loadPlatformStats();
  }, []);

  const loadPlatformStats = async () => {
    try {
      const data = await getPlatformSummary();
      setStats(data);
    } catch (err) {
      console.warn('Erro ao carregar estatísticas da plataforma:', err);
    }
  };

  const features = [
    {
      icon: <StyleOutlinedIcon sx={{ fontSize: 36, color: '#b388ff' }} />,
      title: 'Flashcards & Decks de Memorização',
      description:
        'Crie cartões de pergunta e resposta, organize em pastas temáticas, estude com repetição ativa e acompanhe estatísticas de acertos e erros.',
    },
    {
      icon: <TimerOutlinedIcon sx={{ fontSize: 36, color: PALETTE_COLORS.primary }} />,
      title: 'Simulados Reais com Cronômetro',
      description:
        'Pratique com contagem regressiva personalizada ou tempo livre. O sistema salva seu progresso continuamente para você não perder nenhuma resposta.',
    },
    {
      icon: <DrawOutlinedIcon sx={{ fontSize: 36, color: PALETTE_COLORS.secondary }} />,
      title: 'Lousa de Raciocínio Interativa',
      description:
        'Desenhe diagramas, resolva contas, rascunhe fórmulas e salve anotações visuais vinculadas diretamente a cada questão específica.',
    },
    {
      icon: <LayersOutlinedIcon sx={{ fontSize: 36, color: PALETTE_COLORS.success }} />,
      title: 'Textos de Apoio com Marca-Texto',
      description:
        'Consulte textos motivadores e passagens longas em uma gaveta lateral rápida, com ferramentas para destacar e sublinhar trechos importantes.',
    },
    {
      icon: <FolderSpecialOutlinedIcon sx={{ fontSize: 36, color: PALETTE_COLORS.warning }} />,
      title: 'Organização em Pastas Personalizadas',
      description:
        'Crie pastas com cores exclusivas para separar questões favoritas, provas para refazer e decks de flashcards para revisão espaçada.',
    },
    {
      icon: <FileDownloadOutlinedIcon sx={{ fontSize: 36, color: PALETTE_COLORS.primary }} />,
      title: 'Compartilhamento & Exportação CSV',
      description:
        'Exporte tabelas completas de resultados das suas tentativas para analisar acertos, erros e alternativas marcadas no Excel ou Google Sheets.',
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 36, color: PALETTE_COLORS.secondary }} />,
      title: 'Métricas de Evolução & Histórico',
      description:
        'Acompanhe seu percentil, gráficos de desempenho por matéria e banca, frequência diária de estudos e revisão de gabarito detalhado.',
    },
  ];

  return (
    <Box sx={{ pb: 8 }}>
      {/* 1. HERO SECTION */}
      <Box
        sx={{
          py: { xs: 4, md: 7 },
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Badge de Destaque */}
        <Chip
          icon={<AutoAwesomeIcon sx={{ fontSize: '1rem !important', color: PALETTE_COLORS.primary }} />}
          label="Plataforma de Estudos, Simulados & Flashcards com Repetição Ativa"
          sx={{
            fontWeight: 700,
            mb: 3,
            px: 1.5,
            py: 0.5,
            backgroundColor: isDark ? 'rgba(217, 183, 99, 0.12)' : 'rgba(217, 183, 99, 0.16)',
            borderColor: PALETTE_COLORS.primary,
            border: '1px solid',
            color: isDark ? PALETTE_COLORS.primary : '#8c6e1e',
          }}
        />

        <Typography
          variant="h2"
          component="h1"
          sx={{
            fontWeight: 900,
            fontSize: { xs: '2.2rem', sm: '3.2rem', md: '3.8rem' },
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            mb: 2.5,
            maxWidth: 950,
            mx: 'auto',
          }}
        >
          Treine com foco, resolva provas reais e memorize com{' '}
          <Box component="span" sx={{ color: PALETTE_COLORS.primary }}>
            Flashcards
          </Box>
        </Typography>

        <Typography
          variant="h6"
          component="p"
          sx={{
            color: 'text.secondary',
            maxWidth: 820,
            mx: 'auto',
            mb: 4.5,
            fontWeight: 400,
            lineHeight: 1.6,
            fontSize: { xs: '1rem', md: '1.2rem' },
          }}
        >
          O <strong>Olha Minha Questão</strong> oferece um ambiente moderno e sem distrações para resolução de questões avulsas, simulados completos com cronômetro, <strong>flashcards interativos de repetição ativa</strong>, lousa digital e relatórios detalhados de desempenho.
        </Typography>

        {/* Action Buttons */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="center"
          alignItems="center"
          sx={{ mb: 6 }}
        >
          <Button
            variant="contained"
            size="large"
            startIcon={<QuizOutlinedIcon />}
            onClick={() => navigate('/questoes')}
            sx={{
              px: 3.5,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 800,
              borderRadius: 2.5,
              backgroundColor: PALETTE_COLORS.primary,
              color: '#1a1e24',
              '&:hover': {
                backgroundColor: '#c4a251',
              },
            }}
          >
            Explorar Questões
          </Button>

          <Button
            variant="contained"
            size="large"
            startIcon={<StyleOutlinedIcon />}
            onClick={() => navigate('/flashcards')}
            sx={{
              px: 3.5,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 800,
              borderRadius: 2.5,
              backgroundColor: '#b388ff',
              color: '#1a1e24',
              '&:hover': {
                backgroundColor: '#9d6efd',
              },
            }}
          >
            Praticar Flashcards
          </Button>

          <Button
            variant="outlined"
            size="large"
            startIcon={<MenuBookOutlinedIcon />}
            onClick={() => navigate('/provas')}
            sx={{
              px: 3.5,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 700,
              borderRadius: 2.5,
              borderColor: PALETTE_COLORS.primary,
              color: isDark ? '#ffffff' : PALETTE_COLORS.primary,
              '&:hover': {
                borderColor: PALETTE_COLORS.primary,
                backgroundColor: isDark ? 'rgba(217, 183, 99, 0.1)' : 'rgba(217, 183, 99, 0.08)',
              },
            }}
          >
            Provas & Simulados
          </Button>

          {!user && (
            <Button
              variant="text"
              size="large"
              onClick={() => setOpenRegister(true)}
              sx={{
                px: 2.5,
                py: 1.5,
                fontWeight: 700,
                color: 'text.secondary',
                '&:hover': { color: 'text.primary' },
              }}
            >
              Criar Conta Grátis
            </Button>
          )}
        </Stack>
      </Box>

      {/* 2. DYNAMIC ANIMATED COUNTERS SECTION (5 Cards) */}
      <Paper
        elevation={6}
        sx={{
          p: { xs: 3, md: 4.5 },
          borderRadius: 4,
          mb: 8,
          border: '1.5px solid',
          borderColor: isDark ? 'rgba(217, 183, 99, 0.3)' : 'rgba(217, 183, 99, 0.4)',
          background: isDark
            ? 'linear-gradient(135deg, rgba(26, 30, 36, 0.95) 0%, rgba(33, 38, 45, 0.95) 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, #fdfbf7 100%)',
          boxShadow: isDark
            ? '0 12px 32px rgba(0, 0, 0, 0.4)'
            : '0 12px 32px rgba(217, 183, 99, 0.12)',
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="overline" sx={{ color: PALETTE_COLORS.primary, fontWeight: 800, letterSpacing: 1.5 }}>
            DADOS EM TEMPO REAL DA PLATAFORMA
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Estatísticas da Comunidade de Estudantes
          </Typography>
        </Box>

        <Grid container spacing={2.5}>
          {/* Total de Questões */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Box
              sx={{
                textAlign: 'center',
                p: 2.5,
                borderRadius: 3,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                border: '1px solid',
                borderColor: 'divider',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  backgroundColor: 'rgba(217, 183, 99, 0.15)',
                  color: PALETTE_COLORS.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1.5,
                }}
              >
                <QuizOutlinedIcon fontSize="medium" />
              </Box>
              <AnimatedCounter
                value={stats.totalQuestions}
                typographyProps={{
                  variant: 'h4',
                  sx: { fontWeight: 900, color: PALETTE_COLORS.primary, lineHeight: 1.1 },
                }}
              />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 1, color: 'text.primary' }}>
                Questões
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Categorizadas por banca e área
              </Typography>
            </Box>
          </Grid>

          {/* Provas e Concursos */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Box
              sx={{
                textAlign: 'center',
                p: 2.5,
                borderRadius: 3,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                border: '1px solid',
                borderColor: 'divider',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  backgroundColor: 'rgba(90, 166, 226, 0.15)',
                  color: PALETTE_COLORS.secondary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1.5,
                }}
              >
                <MenuBookOutlinedIcon fontSize="medium" />
              </Box>
              <AnimatedCounter
                value={stats.totalTests}
                typographyProps={{
                  variant: 'h4',
                  sx: { fontWeight: 900, color: PALETTE_COLORS.secondary, lineHeight: 1.1 },
                }}
              />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 1, color: 'text.primary' }}>
                Provas & Simulados
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Exames prontos para realização
              </Typography>
            </Box>
          </Grid>

          {/* Flashcards Cadastrados (NOVO) */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Box
              sx={{
                textAlign: 'center',
                p: 2.5,
                borderRadius: 3,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                border: '1px solid',
                borderColor: 'divider',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  backgroundColor: 'rgba(179, 136, 255, 0.15)',
                  color: '#b388ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1.5,
                }}
              >
                <StyleOutlinedIcon fontSize="medium" />
              </Box>
              <AnimatedCounter
                value={stats.totalFlashcards ?? 0}
                typographyProps={{
                  variant: 'h4',
                  sx: { fontWeight: 900, color: '#b388ff', lineHeight: 1.1 },
                }}
              />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 1, color: 'text.primary' }}>
                Flashcards
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Cartões de memorização ativa
              </Typography>
            </Box>
          </Grid>

          {/* Usuários Ativos (Últimos 5 Dias) */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Box
              sx={{
                textAlign: 'center',
                p: 2.5,
                borderRadius: 3,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                border: '1px solid',
                borderColor: 'divider',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  backgroundColor: 'rgba(75, 241, 81, 0.15)',
                  color: PALETTE_COLORS.success,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1.5,
                }}
              >
                <PeopleAltOutlinedIcon fontSize="medium" />
              </Box>
              <AnimatedCounter
                value={stats.activeUsersLast5Days}
                typographyProps={{
                  variant: 'h4',
                  sx: { fontWeight: 900, color: PALETTE_COLORS.success, lineHeight: 1.1 },
                }}
              />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 1, color: 'text.primary' }}>
                Usuários Ativos
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Estudantes nos últimos 5 dias
              </Typography>
            </Box>
          </Grid>

          {/* Total de Resoluções / Tentativas */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Box
              sx={{
                textAlign: 'center',
                p: 2.5,
                borderRadius: 3,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                border: '1px solid',
                borderColor: 'divider',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  backgroundColor: 'rgba(243, 255, 61, 0.15)',
                  color: isDark ? PALETTE_COLORS.warning : '#a69200',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1.5,
                }}
              >
                <TrendingUpIcon fontSize="medium" />
              </Box>
              <AnimatedCounter
                value={stats.totalAttempts}
                typographyProps={{
                  variant: 'h4',
                  sx: {
                    fontWeight: 900,
                    color: isDark ? PALETTE_COLORS.warning : '#8a7700',
                    lineHeight: 1.1,
                  },
                }}
              />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 1, color: 'text.primary' }}>
                Resoluções
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Resoluções computadas
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* 3. NOVO: DEMONSTRAÇÃO INTERATIVA DE FLASHCARD */}
      <Paper
        elevation={3}
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 4,
          mb: 8,
          border: '1px solid',
          borderColor: isDark ? 'rgba(179, 136, 255, 0.25)' : 'rgba(179, 136, 255, 0.35)',
          background: isDark
            ? 'linear-gradient(135deg, rgba(30, 24, 44, 0.6) 0%, rgba(26, 30, 36, 0.95) 100%)'
            : 'linear-gradient(135deg, #faf7ff 0%, #ffffff 100%)',
        }}
      >
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Chip
              icon={<AutoAwesomeIcon sx={{ fontSize: '0.9rem !important', color: '#b388ff' }} />}
              label="Novidade na Plataforma"
              size="small"
              sx={{
                fontWeight: 800,
                mb: 2,
                backgroundColor: 'rgba(179, 136, 255, 0.15)',
                color: '#b388ff',
                borderColor: '#b388ff',
                border: '1px solid',
              }}
            />
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 2 }}>
              Memorização Rápida com Flashcards & Decks
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.7, mb: 3 }}>
              Combine a resolução de simulados com a técnica de <strong>repetição ativa</strong>. Crie flashcards avulsos ou organize decks temáticos para fixar artigos de lei, fórmulas matemáticas, vocabulário e regras gramaticais.
            </Typography>

            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={<StyleOutlinedIcon />}
                onClick={() => navigate('/flashcards')}
                sx={{
                  backgroundColor: '#b388ff',
                  color: '#1a1e24',
                  fontWeight: 800,
                  borderRadius: 2.5,
                  px: 3,
                  py: 1.2,
                  '&:hover': { backgroundColor: '#9d6efd' },
                }}
              >
                Acessar Flashcards
              </Button>
            </Stack>
          </Grid>

          {/* Interactive Card Flip Preview */}
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                perspective: '1000px',
                maxWidth: 440,
                mx: 'auto',
                cursor: 'pointer',
              }}
              onClick={() => setInteractiveFlipped(!interactiveFlipped)}
            >
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  minHeight: 220,
                  transformStyle: 'preserve-3d',
                  transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: interactiveFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {/* Frente */}
                <Paper
                  elevation={4}
                  sx={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backfaceVisibility: 'hidden',
                    borderRadius: 3.5,
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxSizing: 'border-box',
                    border: '2px solid',
                    borderColor: PALETTE_COLORS.primary,
                    backgroundColor: isDark ? '#1e242c' : '#ffffff',
                  }}
                >
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                      <Chip label="Direito Constitucional" size="small" sx={{ fontWeight: 700 }} />
                      <Chip label="FRENTE (PERGUNTA)" size="small" sx={{ fontWeight: 800, color: PALETTE_COLORS.primary }} />
                    </Stack>
                    <Typography variant="h6" sx={{ fontWeight: 700, mt: 1 }}>
                      Qual é o princípio fundamental que assegura a dignidade da pessoa humana?
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                    <FlipCameraAndroidIcon fontSize="small" />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      Clique para virar o cartão
                    </Typography>
                  </Box>
                </Paper>

                {/* Verso */}
                <Paper
                  elevation={4}
                  sx={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    borderRadius: 3.5,
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxSizing: 'border-box',
                    border: '2px solid',
                    borderColor: '#b388ff',
                    backgroundColor: isDark ? '#1c1926' : '#faf5ff',
                  }}
                >
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                      <Chip label="Art. 1º, III da CF/88" size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                      <Chip label="VERSO (RESPOSTA)" size="small" sx={{ fontWeight: 800, backgroundColor: '#b388ff', color: '#1a1e24' }} />
                    </Stack>
                    <Typography variant="body1" sx={{ fontWeight: 600, mt: 1, lineHeight: 1.6 }}>
                      Art. 1º, III — A dignidade da pessoa humana é um dos fundamentos da República Federativa do Brasil.
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                    <FlipCameraAndroidIcon fontSize="small" />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      Clique para voltar à pergunta
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* 4. SOBRE A PLATAFORMA */}
      <Box sx={{ mb: 8, textAlign: 'center' }}>
        <Typography variant="overline" sx={{ color: PALETTE_COLORS.primary, fontWeight: 800, letterSpacing: 1.5 }}>
          CONHEÇA O SISTEMA
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>
          Desenvolvido para quem busca alta performance
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary',
            maxWidth: 820,
            mx: 'auto',
            lineHeight: 1.8,
            fontSize: '1.05rem',
          }}
        >
          O <strong>Olha Minha Questão</strong> nasceu com a missão de eliminar atritos no processo de estudo.
          Em vez de plataformas lentas e poluídas por anúncios, oferecemos uma experiência ágil, com carregamento
          instantâneo, ferramentas de anotação na própria tela, simulados que refletem o ambiente real de prova e flashcards inteligentes.
        </Typography>
      </Box>

      {/* 5. VITRINE DE FUNCIONALIDADES (FEATURE GRID) */}
      <Box sx={{ mb: 8 }}>
        <Grid container spacing={3}>
          {features.map((feature, idx) => (
            <Grid item xs={12} sm={6} md={4} key={idx}>
              <Card
                elevation={3}
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  p: 1.5,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: PALETTE_COLORS.primary,
                    boxShadow: isDark
                      ? '0 8px 24px rgba(0, 0, 0, 0.4)'
                      : '0 8px 24px rgba(217, 183, 99, 0.15)',
                  },
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5, fontSize: '1.15rem' }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* 6. SEÇÃO DE COMO FUNCIONA (PASSO A PASSO) */}
      <Paper
        elevation={2}
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 3.5,
          mb: 8,
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.015)',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="overline" sx={{ color: PALETTE_COLORS.primary, fontWeight: 800, letterSpacing: 1.5, textAlign: 'center', display: 'block' }}>
          FLUXO SIMPLES E EFICIENTE
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, textAlign: 'center', mb: 5 }}>
          Como funciona sua rotina de estudos
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  backgroundColor: PALETTE_COLORS.primary,
                  color: '#1a1e24',
                  fontWeight: 900,
                  fontSize: '1.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                1
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                Filtre Questões, Provas ou Flashcards
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Navegue por bancas examinadoras, áreas temáticas, provas na íntegra ou pratique decks de flashcards focados.
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  backgroundColor: PALETTE_COLORS.primary,
                  color: '#1a1e24',
                  fontWeight: 900,
                  fontSize: '1.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                2
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                Resolva no Modo Foco
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Utilize o cronômetro, faça anotações na lousa digital, consulte textos de apoio e treine a repetição ativa com cards 3D.
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  backgroundColor: PALETTE_COLORS.primary,
                  color: '#1a1e24',
                  fontWeight: 900,
                  fontSize: '1.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                3
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                Analise & Exporte
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Veja seu gabarito comentado, acompanhe seu percentil global, revise acertos/erros de flashcards e baixe relatórios em CSV.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* 7. CTA FINAL BANNER */}
      <Paper
        elevation={6}
        sx={{
          p: { xs: 4, md: 6 },
          borderRadius: 4,
          textAlign: 'center',
          border: '1.5px solid',
          borderColor: PALETTE_COLORS.primary,
          background: isDark
            ? 'linear-gradient(135deg, rgba(217, 183, 99, 0.15) 0%, rgba(26, 30, 36, 0.98) 100%)'
            : 'linear-gradient(135deg, rgba(217, 183, 99, 0.2) 0%, #ffffff 100%)',
        }}
      >
        <Typography variant="h3" sx={{ fontWeight: 900, mb: 2, fontSize: { xs: '1.8rem', md: '2.5rem' } }}>
          Pronto para acelerar seus resultados?
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 620, mx: 'auto', mb: 4, fontSize: '1.1rem' }}>
          Comece agora mesmo a resolver questões, simulados e flashcards na plataforma. É gratuito, rápido e direto ao ponto.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/questoes')}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1.05rem',
              fontWeight: 800,
              borderRadius: 2.5,
              backgroundColor: PALETTE_COLORS.primary,
              color: '#1a1e24',
              '&:hover': {
                backgroundColor: '#c4a251',
              },
            }}
          >
            Começar a Praticar Agora
          </Button>
          <Button
            variant="contained"
            size="large"
            startIcon={<StyleOutlinedIcon />}
            onClick={() => navigate('/flashcards')}
            sx={{
              px: 3.5,
              py: 1.5,
              fontSize: '1.05rem',
              fontWeight: 800,
              borderRadius: 2.5,
              backgroundColor: '#b388ff',
              color: '#1a1e24',
              '&:hover': {
                backgroundColor: '#9d6efd',
              },
            }}
          >
            Treinar Flashcards
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/provas')}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1.05rem',
              fontWeight: 700,
              borderRadius: 2.5,
              borderColor: PALETTE_COLORS.primary,
              color: isDark ? '#ffffff' : PALETTE_COLORS.primary,
            }}
          >
            Ver Todas as Provas
          </Button>
        </Stack>
      </Paper>

      {/* Modal de Registro para Visitantes */}
      <RegisterModal
        open={openRegister}
        onClose={() => setOpenRegister(false)}
        onSwitchToLogin={() => setOpenRegister(false)}
      />
    </Box>
  );
};
