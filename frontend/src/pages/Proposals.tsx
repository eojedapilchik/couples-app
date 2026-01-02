import { useState, useMemo } from 'react';
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
  Divider,
  TextField,
  InputAdornment,
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import MobileLayout from '../components/layout/MobileLayout';
import ProposalCard from '../components/ProposalCard';
import ChallengeWizard from '../components/ChallengeWizard';
import { useProposals } from '../hooks/useProposals';
import { useLikedByBoth } from '../hooks/useCards';
import { useActivePeriod } from '../hooks/usePeriods';
import { useAuth } from '../context/AuthContext';
import type { ProposalStatus, Card, Proposal, ProposalCreate, ProposalUpdate } from '../api/types';
import { STRINGS } from '../config';

export default function Proposals() {
  const { partner, user } = useAuth();
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [proposeDialog, setProposeDialog] = useState(false);
  const [wizardMode, setWizardMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cardSearch, setCardSearch] = useState('');
  const [editDialog, setEditDialog] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deletingProposal, setDeletingProposal] = useState<Proposal | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const {
    proposals,
    isLoading,
    error,
    respondToProposal,
    markComplete,
    confirmCompletion,
    createProposal,
    updateProposal,
    deleteProposal,
    refetch,
  } = useProposals(tab === 'received');

  const { cards: likedCards, isLoading: cardsLoading } = useLikedByBoth();
  const { period } = useActivePeriod();

  // Filter cards by search query
  const filteredCards = useMemo(() => {
    if (!cardSearch.trim()) return likedCards;
    const query = cardSearch.toLowerCase().trim();
    return likedCards.filter(
      (card) =>
        card.title?.toLowerCase().includes(query) ||
        card.description?.toLowerCase().includes(query)
    );
  }, [likedCards, cardSearch]);

  const handleRespond = async (
    proposalId: number,
    response: ProposalStatus,
    creditCost?: number
  ) => {
    try {
      await respondToProposal(proposalId, response, creditCost);
      const msg =
        response === 'accepted'
          ? STRINGS.proposals.accepted(creditCost || 0)
          : response === 'rejected'
          ? STRINGS.proposals.rejected
          : STRINGS.proposals.markedForLater;
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
      setSnackbar({ open: true, message: STRINGS.proposals.confirmed });
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

  const handleWizardSubmit = async (data: Partial<ProposalCreate>) => {
    if (!period || !partner) {
      setSnackbar({ open: true, message: 'No hay periodo activo o pareja' });
      return;
    }

    setIsSubmitting(true);
    try {
      await createProposal({
        ...data,
        proposed_to_user_id: partner.id,
        period_id: period.id,
        week_index: period.current_week || 1,
      } as ProposalCreate);
      setProposeDialog(false);
      setWizardMode(false);
      const typeLabels = {
        simple: 'Reto simple enviado!',
        guided: 'Reto guiado enviado!',
        custom: 'Reto personalizado enviado!',
      };
      setSnackbar({ open: true, message: typeLabels[data.challenge_type || 'simple'] });
      refetch();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Error al proponer',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (proposal: Proposal) => {
    setEditingProposal(proposal);
    setEditDialog(true);
  };

  const handleEditSubmit = async (data: Partial<ProposalCreate>) => {
    if (!editingProposal) return;
    setIsEditing(true);
    try {
      await updateProposal(editingProposal.id, data as ProposalUpdate);
      setSnackbar({ open: true, message: 'Reto actualizado!' });
      setEditDialog(false);
      setEditingProposal(null);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Error al actualizar reto',
      });
    } finally {
      setIsEditing(false);
    }
  };

  const openDeleteDialog = (proposal: Proposal) => {
    setDeletingProposal(proposal);
    setDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProposal) return;
    try {
      await deleteProposal(deletingProposal.id);
      setSnackbar({ open: true, message: 'Reto eliminado' });
      setDeleteDialog(false);
      setDeletingProposal(null);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Error al eliminar reto',
      });
    }
  };

  const closeDialog = () => {
    setProposeDialog(false);
    setWizardMode(false);
    setCardSearch('');
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
                  currentUserId={user?.id}
                  onRespond={handleRespond}
                  onMarkComplete={() => handleMarkComplete(proposal.id)}
                  onConfirmCompletion={() => handleConfirm(proposal.id)}
                  onEdit={() => openEditDialog(proposal)}
                  onDelete={() => openDeleteDialog(proposal)}
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
            {wizardMode ? 'Crear Reto' : 'Proponer un Reto'}
          </DialogTitle>
          <DialogContent>
            {!period && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                No hay periodo activo. Crea uno primero.
              </Alert>
            )}

            {wizardMode ? (
              // Challenge wizard with all 3 types
              <ChallengeWizard
                onSubmit={handleWizardSubmit}
                onCancel={closeDialog}
                disabled={isSubmitting || !period}
              />
            ) : (
              // Card selection or custom option
              <>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => setWizardMode(true)}
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
                  <>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Buscar cartas..."
                      value={cardSearch}
                      onChange={(e) => setCardSearch(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ mb: 1 }}
                    />
                    <List sx={{ maxHeight: 250, overflow: 'auto' }}>
                      {filteredCards.length === 0 ? (
                        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                          No hay resultados para "{cardSearch}"
                        </Typography>
                      ) : (
                        filteredCards.map((card) => (
                          <ListItem key={card.id} disablePadding>
                            <ListItemButton
                              onClick={() => handleProposeCard(card)}
                              disabled={!period}
                            >
                              <ListItemText
                                primary={card.title}
                                secondary={STRINGS.cardLibrary.currencySuggested(card.category, card.credit_value)}
                              />
                            </ListItemButton>
                          </ListItem>
                        ))
                      )}
                    </List>
                  </>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog
          open={editDialog}
          onClose={() => {
            setEditDialog(false);
            setEditingProposal(null);
          }}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Editar Reto</DialogTitle>
          <DialogContent>
            {editingProposal && (
              <ChallengeWizard
                onSubmit={handleEditSubmit}
                onCancel={() => {
                  setEditDialog(false);
                  setEditingProposal(null);
                }}
                disabled={isEditing}
                initialData={editingProposal}
                mode="edit"
                allowTypeChange={false}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog
          open={deleteDialog}
          onClose={() => {
            setDeleteDialog(false);
            setDeletingProposal(null);
          }}
        >
          <DialogTitle>Eliminar reto?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              Esto eliminara el reto antes de que tu pareja lo acepte.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setDeleteDialog(false);
                setDeletingProposal(null);
              }}
            >
              Cancelar
            </Button>
            <Button color="error" variant="contained" onClick={handleDeleteConfirm}>
              Eliminar
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
