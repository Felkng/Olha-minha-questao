import React, { useState } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Tooltip,
  Typography,
  Chip,
  Stack,
  SxProps,
  Theme,
} from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CloseIcon from '@mui/icons-material/Close';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { useAppTheme } from '../../theme/ThemeContext';
import { PALETTE_COLORS } from '../../theme/theme';

interface ZoomableImageProps {
  src: string;
  alt?: string;
  maxHeight?: number | string;
  maxWidth?: number | string;
  sx?: SxProps<Theme>;
}

export const ZoomableImage: React.FC<ZoomableImageProps> = ({
  src,
  alt = 'Imagem da questão',
  maxHeight = 520,
  maxWidth = '100%',
  sx,
}) => {
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  const resolvedUrl =
    src.startsWith('http') || src.startsWith('data:')
      ? src
      : `${window.location.origin}${src}`;

  const handleOpenModal = () => {
    setZoomLevel(1);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setZoomLevel(1);
    setIsFullScreen(false);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 4));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  const handleToggleDoubleClick = () => {
    setZoomLevel((prev) => (prev === 1 ? 1.75 : 1));
  };

  const handleToggleFullScreen = () => {
    setIsFullScreen((prev) => !prev);
  };

  return (
    <>
      {/* Thumbnail with interactive hover effects */}
      <Box
        onClick={handleOpenModal}
        sx={[
          {
            position: 'relative',
            display: 'inline-flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 2,
            overflow: 'hidden',
            cursor: 'pointer',
            border: '1.5px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
            backgroundColor: isDark ? '#1b2028' : '#f9fafb',
            p: 1.5,
            boxShadow: isDark ? '0 4px 14px rgba(0,0,0,0.5)' : '0 4px 14px rgba(0,0,0,0.06)',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              borderColor: PALETTE_COLORS.primary,
              boxShadow: isDark
                ? `0 6px 20px rgba(255, 230, 0, 0.15)`
                : `0 6px 20px rgba(0, 0, 0, 0.12)`,
              transform: 'translateY(-2px)',
              '& .zoom-overlay': {
                opacity: 1,
              },
              '& .zoom-img': {
                filter: isDark ? 'brightness(1.05)' : 'none',
              },
            },
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        <Box
          component="img"
          className="zoom-img"
          src={resolvedUrl}
          alt={alt}
          sx={{
            maxWidth,
            maxHeight,
            objectFit: 'contain',
            display: 'block',
            borderRadius: 1.5,
            transition: 'filter 0.2s ease',
          }}
        />

        {/* Hover overlay indicator */}
        <Box
          className="zoom-overlay"
          sx={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1.5,
            py: 0.6,
            borderRadius: 20,
            backgroundColor: 'rgba(26, 30, 36, 0.85)',
            backdropFilter: 'blur(6px)',
            color: '#ffffff',
            fontSize: '0.8rem',
            fontWeight: 600,
            opacity: 0.85,
            transition: 'all 0.2s ease',
            pointerEvents: 'none',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <ZoomInIcon sx={{ fontSize: '1.1rem', color: PALETTE_COLORS.primary }} />
          <span>Clique para ampliar</span>
        </Box>
      </Box>

      {/* Lightbox / Zoom Dialog */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth={isFullScreen ? false : 'lg'}
        fullWidth
        fullScreen={isFullScreen}
        PaperProps={{
          sx: {
            backgroundColor: isDark ? '#12161c' : '#ffffff',
            backgroundImage: 'none',
            borderRadius: isFullScreen ? 0 : 3,
            maxHeight: isFullScreen ? '100vh' : '92vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        }}
      >
        {/* Modal Toolbar */}
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 1.5,
            px: 2.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            backgroundColor: isDark ? '#181e26' : '#f4f6f8',
          }}
        >
          <Typography variant="subtitle1" noWrap sx={{ fontWeight: 700, flex: 1, pr: 2 }}>
            {alt}
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Diminuir Zoom (-25%)">
              <span>
                <IconButton
                  size="small"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 0.5}
                  sx={{ color: 'text.secondary' }}
                >
                  <ZoomOutIcon />
                </IconButton>
              </span>
            </Tooltip>

            <Chip
              label={`${Math.round(zoomLevel * 100)}%`}
              size="small"
              sx={{
                fontWeight: 700,
                minWidth: 58,
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              }}
            />

            <Tooltip title="Aumentar Zoom (+25%)">
              <span>
                <IconButton
                  size="small"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 4}
                  sx={{ color: 'text.secondary' }}
                >
                  <ZoomInIcon />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="Restaurar tamanho (100%)">
              <IconButton size="small" onClick={handleResetZoom} sx={{ color: 'text.secondary' }}>
                <RestartAltIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title={isFullScreen ? 'Sair da tela cheia' : 'Tela cheia'}>
              <IconButton
                size="small"
                onClick={handleToggleFullScreen}
                sx={{ color: 'text.secondary' }}
              >
                {isFullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Tooltip>

            <Tooltip title="Fechar (Esc)">
              <IconButton size="small" onClick={handleCloseModal} sx={{ color: 'text.secondary' }}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </DialogTitle>

        {/* Modal Image Viewport */}
        <DialogContent
          sx={{
            p: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'auto',
            backgroundColor: isDark ? '#0b0e12' : '#f0f2f5',
            minHeight: { xs: 350, md: 500 },
          }}
          onDoubleClick={handleToggleDoubleClick}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.15s cubic-bezier(0.2, 0, 0, 1)',
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center center',
            }}
          >
            <Box
              component="img"
              src={resolvedUrl}
              alt={alt}
              sx={{
                maxWidth: isFullScreen ? '95vw' : '85vw',
                maxHeight: isFullScreen ? '88vh' : '75vh',
                objectFit: 'contain',
                borderRadius: 2,
                boxShadow: isDark
                  ? '0 8px 32px rgba(0,0,0,0.8)'
                  : '0 8px 32px rgba(0,0,0,0.15)',
                backgroundColor: isDark ? '#1a1f26' : '#ffffff',
                p: 1.5,
                border: '1px solid',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                cursor: zoomLevel > 1 ? 'grab' : 'zoom-in',
                userSelect: 'none',
              }}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};
