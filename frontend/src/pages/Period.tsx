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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import MobileLayout from '../components/layout/MobileLayout';
import { usePeriods, useActivePeriod } from '../hooks/usePeriods';
import type { PeriodType, PeriodCreate } from '../api/types';

const periodTypeLabels: Record<PeriodType, string> = {
  week: '1 Semana',
  month: '1 Mes (4 semanas)',
  two_month: '2 Meses (8 semanas)',
};

export default function Period() {
  const { periods, isLoading, error, createPeriod, activatePeriod, completePeriod, refetch } =
    usePeriods();
  const { period: activePeriod, refetch: refetchActive } = useActivePeriod();
  const [createDialog, setCreateDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  // Form state
  const [formData, setFormData] = useState<PeriodCreate>({
    period_type: 'week',
    start_date: new Date().toISOString().split('T')[0],
    weekly_base_credits: 3,
    cards_to_play_per_week: 3,
  });

  const handleCreate = async () => {
    try {
      await createPeriod(formData);
      setCreateDialog(false);
      setSnackbar({ open: true, message: 'Periodo creado!' });
      refetch();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Error al crear',
      });
    }
  };

  const handleActivate = async (periodId: number) => {
    try {
      await activatePeriod(periodId);
      setSnackbar({ open: true, message: 'Periodo activado!' });
      refetch();
      refetchActive();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Error al activar',
      });
    }
  };

  const handleComplete = async (periodId: number) => {
    try {
      await completePeriod(periodId);
      setSnackbar({ open: true, message: 'Periodo completado!' });
      refetch();
      refetchActive();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Error al completar',
      });
    }
  };

  return (
    <MobileLayout title="Periodos">
      <Box sx={{ py: 2 }}>
        {/* Active Period Banner */}
        {activePeriod && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Periodo activo: {periodTypeLabels[activePeriod.period_type]} (Semana{' '}
            {activePeriod.current_week} de {activePeriod.total_weeks})
          </Alert>
        )}

        {/* Create Button */}
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialog(true)}
          sx={{ mb: 3 }}
          disabled={!!activePeriod}
        >
          Crear Nuevo Periodo
        </Button>

        {/* Loading */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Periods List */}
        {!isLoading && !error && (
          <Box>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Historial de Periodos
            </Typography>
            {periods.length === 0 ? (
              <Typography color="text.secondary">No hay periodos creados</Typography>
            ) : (
              periods.map((period) => (
                <Card key={period.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="h6">
                        {periodTypeLabels[period.period_type]}
                      </Typography>
                      <Chip
                        label={period.status}
                        size="small"
                        color={
                          period.status === 'active'
                            ? 'success'
                            : period.status === 'done'
                            ? 'default'
                            : 'warning'
                        }
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(period.start_date).toLocaleDateString('es')} -{' '}
                      {new Date(period.end_date).toLocaleDateString('es')}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {period.cards_to_play_per_week} cartas/semana |{' '}
                      {period.weekly_base_credits} creditos/semana
                    </Typography>

                    {/* Actions */}
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      {period.status === 'setup' && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleActivate(period.id)}
                        >
                          Activar
                        </Button>
                      )}
                      {period.status === 'active' && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleComplete(period.id)}
                        >
                          Finalizar
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))
            )}
          </Box>
        )}

        {/* Create Dialog */}
        <Dialog open={createDialog} onClose={() => setCreateDialog(false)} fullWidth>
          <DialogTitle>Crear Nuevo Periodo</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Periodo</InputLabel>
                <Select
                  value={formData.period_type}
                  label="Tipo de Periodo"
                  onChange={(e) =>
                    setFormData({ ...formData, period_type: e.target.value as PeriodType })
                  }
                >
                  <MenuItem value="week">1 Semana</MenuItem>
                  <MenuItem value="month">1 Mes (4 semanas)</MenuItem>
                  <MenuItem value="two_month">2 Meses (8 semanas)</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Fecha de Inicio"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />

              <TextField
                label="Creditos Semanales"
                type="number"
                value={formData.weekly_base_credits}
                onChange={(e) =>
                  setFormData({ ...formData, weekly_base_credits: parseInt(e.target.value) || 3 })
                }
                inputProps={{ min: 1, max: 10 }}
                fullWidth
              />

              <TextField
                label="Cartas por Semana"
                type="number"
                value={formData.cards_to_play_per_week}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cards_to_play_per_week: parseInt(e.target.value) || 3,
                  })
                }
                inputProps={{ min: 1, max: 10 }}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialog(false)}>Cancelar</Button>
            <Button variant="contained" onClick={handleCreate}>
              Crear
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          message={snackbar.message}
        />
      </Box>
    </MobileLayout>
  );
}
