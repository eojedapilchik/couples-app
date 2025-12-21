import { Box, Typography, Card, CardContent, Chip, Button, Skeleton } from '@mui/material';
import {
  TrendingUp as CreditsIcon,
  Event as PeriodIcon,
  Inbox as ProposalsIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '../components/layout/MobileLayout';
import { useAuth } from '../context/AuthContext';
import { useCredits } from '../hooks/useCredits';
import { useActivePeriod } from '../hooks/usePeriods';
import { useProposals } from '../hooks/useProposals';

export default function Home() {
  const navigate = useNavigate();
  const { user, partner } = useAuth();
  const { balance, isLoading: creditsLoading } = useCredits();
  const { period, isLoading: periodLoading } = useActivePeriod();
  const { proposals, isLoading: proposalsLoading } = useProposals(true, 'proposed');

  const pendingCount = proposals.length;

  return (
    <MobileLayout title="Inicio">
      <Box sx={{ py: 2 }}>
        {/* Welcome */}
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Hola, {user?.name}!
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {partner ? `Jugando con ${partner.name}` : 'Esperando a tu pareja'}
        </Typography>

        {/* Stats Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
          {/* Credits */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CreditsIcon color="primary" />
                <Typography variant="subtitle2" color="text.secondary">
                  Creditos
                </Typography>
              </Box>
              {creditsLoading ? (
                <Skeleton width={60} height={40} />
              ) : (
                <Typography variant="h4" fontWeight={700}>
                  {balance}
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Pending Proposals */}
          <Card onClick={() => navigate('/proposals')} sx={{ cursor: 'pointer' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ProposalsIcon color="secondary" />
                <Typography variant="subtitle2" color="text.secondary">
                  Pendientes
                </Typography>
              </Box>
              {proposalsLoading ? (
                <Skeleton width={60} height={40} />
              ) : (
                <Typography variant="h4" fontWeight={700}>
                  {pendingCount}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Active Period */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <PeriodIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Periodo Activo
              </Typography>
            </Box>
            {periodLoading ? (
              <Skeleton height={60} />
            ) : period ? (
              <Box>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Chip label={period.period_type} size="small" />
                  <Chip
                    label={`Semana ${period.current_week} de ${period.total_weeks}`}
                    size="small"
                    color="primary"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {new Date(period.start_date).toLocaleDateString('es')} -{' '}
                  {new Date(period.end_date).toLocaleDateString('es')}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {period.cards_to_play_per_week} cartas por semana |{' '}
                  {period.weekly_base_credits} creditos semanales
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  No hay periodo activo
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => navigate('/period')}
                >
                  Crear Periodo
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Acciones rapidas
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/cards')}
          >
            Ver Cartas
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/proposals')}
          >
            Ver Retos
          </Button>
        </Box>
      </Box>
    </MobileLayout>
  );
}
