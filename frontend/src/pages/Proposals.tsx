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
  TextField,
  Divider,
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
  const [customMode, setCustomMode] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');

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

  const handleRespond = async (
    proposalId: number,
    response: ProposalStatus,
    creditCost?: number
  ) => {
    try {
      await respondToProposal(proposalId, response, creditCost);
      const msg =
        response === 'accepted'
          ? `Aceptado! Le costara ${creditCost} venus`
          : response === 'rejected'
          ? 'Rechazado'
          : 'Marcado para despues';
      setSnackbar({ open: true, message: msg });
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
      setSnackbar({ open: true, message: 'Confirmado! Venus otorgados' });
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
      setSnackbar({ open: true, message: 'Reto enviado!' });
      refetch();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Error al proponer',
      });
    }
  };

  const handleProposeCustom = async () => {
    if (!period || !partner) {
      setSnackbar({ open: true, message: 'No hay periodo activo o pareja' });
      return;
    }

    if (!customTitle.trim()) {
      setSnackbar({ open: true, message: 'Escribe un titulo para el reto' });
      return;
    }

    try {
      await createProposal({
        custom_title: customTitle.trim(),
        custom_description: customDescription.trim() || undefined,
        proposed_to_user_id: partner.id,
        period_id: period.id,
        week_index: period.current_week || 1,
      });
      setProposeDialog(false);
      setCustomMode(false);
      setCustomTitle('');
      setCustomDescription('');
      setSnackbar({ open: true, message: 'Reto personalizado enviado!' });
      refetch();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Error al proponer',
      });
    }
  };

  const closeDialog = () => {
    setProposeDialog(false);
    setCustomMode(false);
    setCustomTitle('');
    setCustomDescription('');
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
                  isRecipient={tab === 'received'}
                  onRespond={handleRespond}
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
          onClose={closeDialog}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>
            {customMode ? 'Crear Reto Personalizado' : 'Proponer un Reto'}
          </DialogTitle>
          <DialogContent>
            {!period && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                No hay periodo activo. Crea uno primero.
              </Alert>
            )}

            {customMode ? (
              // Custom reto form
              <Box sx={{ mt: 1 }}>
                <TextField
                  label="Titulo del reto"
                  fullWidth
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  sx={{ mb: 2 }}
                  placeholder="Ej: Masaje de 30 minutos"
                />
                <TextField
                  label="Descripcion (opcional)"
                  fullWidth
                  multiline
                  rows={3}
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Describe el reto con mas detalle..."
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                  Tu pareja decidira cuantos venus te costara (1-7)
                </Typography>
              </Box>
            ) : (
              // Card selection or custom option
              <>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => setCustomMode(true)}
                  sx={{ mb: 2, mt: 1 }}
                >
                  Crear reto personalizado
                </Button>

                <Divider sx={{ my: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    o elige de cartas favoritas
                  </Typography>
                </Divider>

                {cardsLoading ? (
                  <CircularProgress />
                ) : likedCards.length === 0 ? (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No hay cartas que les gusten a ambos.
                    <br />
                    Voten en las cartas primero!
                  </Typography>
                ) : (
                  <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {likedCards.map((card) => (
                      <ListItem key={card.id} disablePadding>
                        <ListItemButton
                          onClick={() => handleProposeCard(card)}
                          disabled={!period}
                        >
                          <ListItemText
                            primary={card.title}
                            secondary={`${card.category} | ${card.credit_value} venus sugeridos`}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                )}
              </>
            )}
          </DialogContent>
          <DialogActions>
            {customMode && (
              <Button onClick={() => setCustomMode(false)}>Volver</Button>
            )}
            <Button onClick={closeDialog}>Cancelar</Button>
            {customMode && (
              <Button
                variant="contained"
                onClick={handleProposeCustom}
                disabled={!period || !customTitle.trim()}
              >
                Enviar Reto
              </Button>
            )}
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
