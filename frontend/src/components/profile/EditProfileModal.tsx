import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  InputAdornment,
  Alert,
  Divider,
  FormControlLabel,
  Switch,
  CircularProgress,
  Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SaveIcon from '@mui/icons-material/Save';
import { updateUser } from '../../services/api';
import { UserProfile, UserSummary, UserUpdateRequest } from '../../types';
import { PALETTE_COLORS } from '../../theme/theme';

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSuccess: (updatedUser: UserSummary) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  open,
  onClose,
  profile,
  onSuccess,
}) => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  // Password fields
  const [changePassword, setChangePassword] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  // Password visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && profile) {
      setName(profile.name || '');
      setEmail(profile.email || '');
      setChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
    }
  }, [open, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError('O nome não pode ficar em branco.');
      return;
    }

    if (!trimmedEmail) {
      setError('O e-mail não pode ficar em branco.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Informe um endereço de e-mail válido.');
      return;
    }

    const dto: UserUpdateRequest = {
      name: trimmedName,
      email: trimmedEmail,
    };

    if (changePassword) {
      if (!currentPassword) {
        setError('Para alterar a senha, informe sua senha atual.');
        return;
      }

      if (!newPassword) {
        setError('Informe a nova senha desejada.');
        return;
      }

      if (newPassword.length < 6) {
        setError('A nova senha deve ter no mínimo 6 caracteres.');
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('A confirmação da nova senha não confere.');
        return;
      }

      dto.currentPassword = currentPassword;
      dto.newPassword = newPassword;
    }

    setSaving(true);
    try {
      const updated = await updateUser(profile.id, dto);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Não foi possível atualizar as informações do perfil.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={!saving ? onClose : undefined}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1,
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 1,
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Editar Perfil do Usuário
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Atualize seu nome, e-mail e credenciais de acesso
            </Typography>
          </Box>
          <IconButton onClick={onClose} disabled={saving} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={2.5}>
            {/* Nome Completo */}
            <TextField
              label="Nome Completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              required
              disabled={saving}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            {/* E-mail */}
            <TextField
              label="Endereço de E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              disabled={saving}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <Divider sx={{ my: 1 }} />

            {/* Toggle Alterar Senha */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle2" fontWeight="bold">
                  Alterar Senha de Acesso
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Habilite para definir uma nova senha para sua conta
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={changePassword}
                    onChange={(e) => setChangePassword(e.target.checked)}
                    disabled={saving}
                    color="primary"
                  />
                }
                label=""
                sx={{ m: 0 }}
              />
            </Box>

            {/* Campos de Senha */}
            {changePassword && (
              <Stack spacing={2} sx={{ pt: 1 }}>
                <TextField
                  label="Senha Atual"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  fullWidth
                  required
                  disabled={saving}
                  placeholder="Informe sua senha atual"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowCurrentPassword((prev) => !prev)}
                          edge="end"
                          size="small"
                        >
                          {showCurrentPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Nova Senha"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  fullWidth
                  required
                  disabled={saving}
                  helperText="Mínimo de 6 caracteres"
                  placeholder="Digite sua nova senha"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowNewPassword((prev) => !prev)}
                          edge="end"
                          size="small"
                        >
                          {showNewPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Confirmar Nova Senha"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  fullWidth
                  required
                  disabled={saving}
                  placeholder="Repita a nova senha"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          edge="end"
                          size="small"
                        >
                          {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Stack>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={onClose} disabled={saving} sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            sx={{
              fontWeight: 800,
              backgroundColor: PALETTE_COLORS.primary,
              color: '#1a1e24',
              px: 3,
              borderRadius: 2,
              '&:hover': {
                backgroundColor: '#c4a251',
              },
            }}
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
