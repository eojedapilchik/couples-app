import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
} from '@mui/material';
import {
  Person as ProfileIcon,
  Lock as PasswordIcon,
  DeleteForever as ResetIcon,
} from '@mui/icons-material';
import MobileLayout from '../components/layout/MobileLayout';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../api/client';

export default function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.is_admin ?? false;

  const [resetDialog, setResetDialog] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetResult, setResetResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleReset = async () => {
    if (!user) return;
    setResetLoading(true);
    try {
      const result = await adminApi.resetAll(user.id);
      setResetResult({
        success: true,
        message: `${result.votes_deleted} votos y ${result.proposals_deleted} retos eliminados`,
      });
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      setResetResult({
        success: false,
        message: error instanceof Error ? error.message : 'Error al resetear',
      });
    }
    setResetLoading(false);
  };

  const closeResetDialog = () => {
    if (!resetLoading) {
      setResetDialog(false);
      setResetResult(null);
    }
  };

  return (
    <MobileLayout title="Ajustes">
      <Box sx={{ py: 2 }}>
        {/* Profile Section */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <ProfileIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Perfil
              </Typography>
            </Box>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              {user?.name}
            </Typography>
            <Button variant="outlined" disabled startIcon={<PasswordIcon />}>
              Cambiar PIN (proximamente)
            </Button>
          </CardContent>
        </Card>

        {/* Admin Section */}
        {isAdmin && (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ResetIcon color="error" />
                <Typography variant="h6" fontWeight={600} color="error">
                  Administrador
                </Typography>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Opciones de administrador para resetear datos del juego.
              </Typography>

              <Button
                variant="outlined"
                color="error"
                startIcon={<ResetIcon />}
                onClick={() => setResetDialog(true)}
              >
                Resetear Votos y Retos
              </Button>
            </CardContent>
          </Card>
        )}

        {/* App Info */}
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" align="center">
              Couple Cards v1.0
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Reset Confirmation Dialog */}
      <Dialog open={resetDialog} onClose={closeResetDialog}>
        <DialogTitle>Confirmar Reset</DialogTitle>
        <DialogContent>
          {resetResult ? (
            <Alert severity={resetResult.success ? 'success' : 'error'} sx={{ mt: 1 }}>
              {resetResult.message}
            </Alert>
          ) : (
            <Typography>
              Esto eliminara TODOS los votos de cartas y TODOS los retos. Esta accion no se puede deshacer.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          {!resetResult && (
            <>
              <Button onClick={closeResetDialog} disabled={resetLoading}>
                Cancelar
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleReset}
                disabled={resetLoading}
              >
                {resetLoading ? 'Reseteando...' : 'Si, Resetear Todo'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </MobileLayout>
  );
}
