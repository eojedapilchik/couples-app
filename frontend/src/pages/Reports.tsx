import { Box, Typography, Card, CardContent, List, ListItem, ListItemText, Divider, Chip, CircularProgress } from '@mui/material';
import {
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
} from '@mui/icons-material';
import MobileLayout from '../components/layout/MobileLayout';
import { useCreditLedger } from '../hooks/useCredits';
import { useProposals } from '../hooks/useProposals';
import type { LedgerType } from '../api/types';

const ledgerTypeLabels: Record<LedgerType, string> = {
  weekly_base_grant: 'Creditos semanales',
  proposal_cost: 'Costo de propuesta',
  completion_reward: 'Recompensa por completar',
  admin_adjustment: 'Ajuste admin',
  initial_grant: 'Creditos iniciales',
};

export default function Reports() {
  const { entries, currentBalance, isLoading: ledgerLoading } = useCreditLedger();
  const { proposals: receivedProposals } = useProposals(true);
  const { proposals: sentProposals } = useProposals(false);

  // Stats
  const completedReceived = receivedProposals.filter(
    (p) => p.status === 'completed_confirmed'
  ).length;
  const completedSent = sentProposals.filter(
    (p) => p.status === 'completed_confirmed'
  ).length;

  return (
    <MobileLayout title="Estadisticas">
      <Box sx={{ py: 2 }}>
        {/* Balance Card */}
        <Card sx={{ mb: 3, bgcolor: 'primary.main', color: 'white' }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
              Balance Actual
            </Typography>
            <Typography variant="h3" fontWeight={700}>
              {currentBalance} cr
            </Typography>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Retos Completados
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {completedReceived}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                como receptor
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Retos Propuestos
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {sentProposals.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {completedSent} completados
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Ledger History */}
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Historial de Creditos
        </Typography>

        {ledgerLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Card>
            <List>
              {entries.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary="Sin transacciones"
                    secondary="Las transacciones apareceran aqui"
                  />
                </ListItem>
              ) : (
                entries.map((entry, index) => (
                  <Box key={entry.id}>
                    <ListItem>
                      <Box sx={{ mr: 2 }}>
                        {entry.amount > 0 ? (
                          <IncomeIcon color="success" />
                        ) : (
                          <ExpenseIcon color="error" />
                        )}
                      </Box>
                      <ListItemText
                        primary={ledgerTypeLabels[entry.type] || entry.type}
                        secondary={new Date(entry.created_at).toLocaleDateString('es', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      />
                      <Chip
                        label={`${entry.amount > 0 ? '+' : ''}${entry.amount}`}
                        size="small"
                        color={entry.amount > 0 ? 'success' : 'error'}
                        variant="outlined"
                      />
                    </ListItem>
                    {index < entries.length - 1 && <Divider />}
                  </Box>
                ))
              )}
            </List>
          </Card>
        )}
      </Box>
    </MobileLayout>
  );
}
