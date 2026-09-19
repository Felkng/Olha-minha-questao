import { createTheme, PaletteMode, Theme } from '@mui/material';

// Paleta especificada pelo usuário (tons pasteurizados sem gradientes)
export const PALETTE_COLORS = {
  primary: '#d9b763',   // Ocre/dourado pasteurizado elegante
  secondary: '#5aa6e2', // Azul suave pasteurizado
  success: '#4bf151',   // Verde pasteurizado vibrante
  danger: '#fa424b',    // Vermelho coral pasteurizado
  warning: '#f3ff3d',   // Amarelo pasteurizado
};

export const createAppTheme = (mode: PaletteMode): Theme => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: PALETTE_COLORS.primary,
        contrastText: isDark ? '#121418' : '#2b2310',
      },
      secondary: {
        main: PALETTE_COLORS.secondary,
        contrastText: '#ffffff',
      },
      success: {
        main: PALETTE_COLORS.success,
        contrastText: '#0f2910',
      },
      error: {
        main: PALETTE_COLORS.danger,
        contrastText: '#ffffff',
      },
      warning: {
        main: PALETTE_COLORS.warning,
        contrastText: '#262900',
      },
      info: {
        main: PALETTE_COLORS.secondary,
        contrastText: '#ffffff',
      },
      background: {
        default: isDark ? '#121418' : '#f8fafc',
        paper: isDark ? '#1a1e26' : '#ffffff',
      },
      text: {
        primary: isDark ? '#f1f5f9' : '#1e293b',
        secondary: isDark ? '#94a3b8' : '#64748b',
      },
      divider: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    },
    typography: {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      h5: {
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h6: {
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      subtitle1: {
        fontWeight: 500,
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isDark ? '#121418' : '#f8fafc',
            transition: 'background-color 0.3s ease, color 0.3s ease',
          },
        },
      },
      MuiAppBar: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            // Barra horizontal sólida, sem gradiente
            backgroundColor: isDark ? '#161920' : '#ffffff',
            color: isDark ? '#f1f5f9' : '#1e293b',
            borderBottom: isDark
              ? '1px solid rgba(255, 255, 255, 0.08)'
              : '1px solid rgba(0, 0, 0, 0.08)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            // Sem gradientes, cores sólidas com profundidade limpa
            backgroundImage: 'none',
          },
          elevation4: {
            // Container de questões com elevação 4 personalizada
            borderRadius: 16,
            border: isDark
              ? '1px solid rgba(255, 255, 255, 0.08)'
              : '1px solid rgba(0, 0, 0, 0.07)',
            boxShadow: isDark
              ? '0 6px 24px -2px rgba(0, 0, 0, 0.5), 0 2px 8px -1px rgba(0, 0, 0, 0.3)'
              : '0 6px 24px -2px rgba(0, 0, 0, 0.06), 0 2px 8px -1px rgba(0, 0, 0, 0.04)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: '8px 18px',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
          containedPrimary: {
            color: '#1e1c14',
            backgroundColor: PALETTE_COLORS.primary,
            '&:hover': {
              backgroundColor: '#c4a350',
            },
          },
          containedSecondary: {
            backgroundColor: PALETTE_COLORS.secondary,
            '&:hover': {
              backgroundColor: '#4c92c9',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 600,
            fontSize: '0.775rem',
          },
        },
      },
      MuiSkeleton: {
        defaultProps: {
          animation: 'wave',
        },
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundColor: isDark
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.06)',
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            backgroundColor: isDark ? '#1a1e26' : '#ffffff',
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: PALETTE_COLORS.primary,
              borderWidth: 2,
            },
          },
        },
      },
    },
  });
};
