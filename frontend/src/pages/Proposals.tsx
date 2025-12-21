import { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Snackbar,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import MobileLayout from '../components/layout/MobileLayout';
import ProposalCard from '../components/ProposalCard';
import { useProposals } from '../hooks/useProposals';
import { useLikedByBoth } from '../hooks/useCards';
import { useActivePeriod } from '../hooks/usePeriods';
import { useAuth } from '../context/AuthContext';
import type { ProposalStatus, Card } from '../api/types';

export default function Proposals() {
  const { partner } = useAuth();
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [proposeDialog, setProposeDialog] = useState(false);

  const {
    proposals,
    isLoading,
    error,
    respondToProposal,
    markComplete,
    confirmCompletion,
    createProposal,
    refetch,
  } = useProposals(tab === 'received');

  const { cards: likedCards, isLoading: cardsLoading } = useLikedByBoth();
  const { period } = useActivePeriod();

  const handleRespond = async (proposalId: number, response: ProposalStatus) => {
    try {
      await respondToProposal(proposalId, response);
      setSnackbar({ open: true, message: 'Respuesta enviada' });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Error',
      });
    }
  };

  const handleMarkComplete = async (proposalId: number) => {
    try {
      await markComplete(proposalId);
      setSnackbar({ open: true, message: 'Marcado como completado' });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Error',
      });
    }
  };

  const handleConfirm = async (proposalId: number) => {
    try {
      await confirmCompletion(proposalId);
      setSnackbar({ open: true, message: 'Confirmado! Creditos otorgados' });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Error',
      });
    }
  };

  const handleProposeCard = async (card: Card) => {
    if (!period || !partner) {
      setSnackbar({ open: true, message: 'No hay periodo activo o pareja' });
      return;
    }

    try {
      await createProposal({
        card_id: card.id,
        proposed_to_user_id: partner.id,
        period_id: period.id,
        week_index: period.current_week || 1,
      });
      setProposeDialog(false);
      setSnackbar({ open: true, message: 'Propuesta enviada!' });
      refetch();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Error al proponer',
      });
    }
  };

  return (
    <MobileLayout title="Retos">
      <Box sx={{ py: 2 }}>
        {/* Tabs */}
        <Tabs
          value={tab}
          onChange={(_, val) => setTab(val)}
          sx={{ mb: 3 }}
          centered
        >
          <Tab value="received" label="Recibidos" />
          <Tab value="sent" label="Enviados" />
        </Tabs>

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

        {/* Proposals List */}
        {!isLoading && !error && (
          <Box>
            {proposals.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                No hay {tab === 'received' ? 'retos recibidos' : 'retos enviados'}
              </Typography>
            ) : (
              proposals.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  onRespond={(resp) => handleRespond(proposal.id, resp)}
                  onMarkComplete={() => handleMarkComplete(proposal.id)}
                  onConfirmCompletion={() => handleConfirm(proposal.id)}
                />
              ))
            )}
          </Box>
        )}

        {/* FAB to Propose */}
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 90, right: 16 }}
          onClick={() => setProposeDialog(true)}
        >
          <AddIcon />
        </Fab>

        {/* Propose Dialog */}
        <Dialog
          open={proposeDialog}
          onClose={() => setProposeDialog(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Proponer un Reto</DialogTitle>
          <DialogContent>
            {!period && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                No hay periodo activo. Crea uno primero.
              </Alert>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Cartas que les gustan a ambos:
            </Typography>
            {cardsLoading ? (
              <CircularProgress />
            ) : likedCards.length === 0 ? (
              <Typography color="text.secondary">
                No hay cartas que les gusten a ambos. Voten en las cartas primero!
              </Typography>
            ) : (
              <List>
                {likedCards.map((card) => (
                  <ListItem key={card.id} disablePadding>
                    <ListItemButton
                      onClick={() => handleProposeCard(card)}
                      disabled={!period}
                    >
                      <ListItemText
                        primary={card.title}
                        secondary={`${card.category} | ${card.credit_value} creditos`}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setProposeDialog(false)}>Cancelar</Button>
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
