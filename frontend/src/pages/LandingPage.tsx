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
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import DrawOutlinedIcon from '@mui/icons-material/DrawOutlined';
import FolderSpecialOutlinedIcon from '@mui/icons-material/FolderSpecialOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
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
    activeUsersLast5Days: 0,
    totalAttempts: 0,
    totalOrigins: 0,
    totalAreas: 0,
  });
  const [openRegister, setOpenRegister] = useState<boolean>(false);

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
        'Crie pastas com cores exclusivas para separar questões favoritas, provas para refazer e pontos fracos para revisão espaçada.',
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
          label="Plataforma de Estudos & Simulados para Concursos e Vestibulares"
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
            maxWidth: 900,
            mx: 'auto',
          }}
        >
          Treine com foco, resolva provas reais e conquiste sua{' '}
          <Box component="span" sx={{ color: PALETTE_COLORS.primary }}>
            Aprovação
          </Box>
        </Typography>

        <Typography
          variant="h6"
          component="p"
          sx={{
            color: 'text.secondary',
            maxWidth: 780,
            mx: 'auto',
            mb: 4.5,
            fontWeight: 400,
            lineHeight: 1.6,
            fontSize: { xs: '1rem', md: '1.2rem' },
          }}
        >
          O <strong>Olha Minha Questão</strong> oferece um ambiente moderno e sem distrações para resolução de questões avulsas, realização de simulados completos com cronômetro, lousa de raciocínio interativa e relatórios detalhados de desempenho.
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
              px: 4,
              py: 1.6,
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
            Explorar Questões
          </Button>

          <Button
            variant="outlined"
            size="large"
            startIcon={<MenuBookOutlinedIcon />}
            onClick={() => navigate('/provas')}
            sx={{
              px: 4,
              py: 1.6,
              fontSize: '1.05rem',
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
            Ver Provas & Simulados
          </Button>

          {!user && (
            <Button
              variant="text"
              size="large"
              onClick={() => setOpenRegister(true)}
              sx={{
                px: 3,
                py: 1.6,
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

      {/* 2. DYNAMIC ANIMATED COUNTERS SECTION */}
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

        <Grid container spacing={3}>
          {/* Total de Questões */}
          <Grid item xs={12} sm={6} md={3}>
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
                  width: 48,
                  height: 48,
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
                  variant: 'h3',
                  sx: { fontWeight: 900, color: PALETTE_COLORS.primary, lineHeight: 1.1 },
                }}
              />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 1, color: 'text.primary' }}>
                Questões Cadastradas
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Categorizadas por banca, ano e área de conhecimento
              </Typography>
            </Box>
          </Grid>

          {/* Provas e Concursos */}
          <Grid item xs={12} sm={6} md={3}>
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
                  width: 48,
                  height: 48,
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
                  variant: 'h3',
                  sx: { fontWeight: 900, color: PALETTE_COLORS.secondary, lineHeight: 1.1 },
                }}
              />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 1, color: 'text.primary' }}>
                Provas & Simulados
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Exames completos extraídos e prontos para realização
              </Typography>
            </Box>
          </Grid>

          {/* Usuários Ativos (Últimos 5 Dias) */}
          <Grid item xs={12} sm={6} md={3}>
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
                  width: 48,
                  height: 48,
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
                  variant: 'h3',
                  sx: { fontWeight: 900, color: PALETTE_COLORS.success, lineHeight: 1.1 },
                }}
              />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 1, color: 'text.primary' }}>
                Usuários Ativos
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Estudantes que resolveram questões nos últimos 5 dias
              </Typography>
            </Box>
          </Grid>

          {/* Total de Resoluções / Tentativas */}
          <Grid item xs={12} sm={6} md={3}>
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
                  width: 48,
                  height: 48,
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
                  variant: 'h3',
                  sx: {
                    fontWeight: 900,
                    color: isDark ? PALETTE_COLORS.warning : '#8a7700',
                    lineHeight: 1.1,
                  },
                }}
              />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 1, color: 'text.primary' }}>
                Questões Respondidas
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Resoluções computadas com métricas de assertividade
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* 3. SOBRE A PLATAFORMA */}
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
          instantâneo, ferramentas de anotação na própria tela e simulados que refletem o ambiente real de prova.
        </Typography>
      </Box>

      {/* 4. VITRINE DE FUNCIONALIDADES (FEATURE GRID) */}
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

      {/* 5. SEÇÃO DE COMO FUNCIONA (PASSO A PASSO) */}
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
                Filtre ou Escolha a Prova
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Navegue por bancas examinadoras, anos e áreas temáticas ou abra uma prova de concurso na íntegra.
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
                Utilize o cronômetro, faça anotações na lousa digital e consulte textos de apoio com marcação inteligente.
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
                Veja seu gabarito comentado, acompanhe seu percentil global e baixe relatórios em CSV para controle total.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* 6. CTA FINAL BANNER */}
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
          Comece agora mesmo a resolver questões e simulados na plataforma. É gratuito, rápido e direto ao ponto.
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
