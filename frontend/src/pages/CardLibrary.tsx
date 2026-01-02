import { useState, useMemo } from 'react';
import {
  Box,
  CircularProgress,
  Alert,
  Snackbar,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
} from '@mui/material';
import {
  HowToVote as VoteIcon,
  People as PeopleIcon,
  ArrowBack as BackIcon,
  LibraryBooks as LibraryIcon,
} from '@mui/icons-material';
import MobileLayout from '../components/layout/MobileLayout';
import SwipeableCardStack from '../components/SwipeableCardStack';
import PartnerVotesView from '../components/PartnerVotesView';
import VotedCardsView from '../components/VotedCardsView';
import CategoryGrid, { type CategoryDefinition } from '../components/CategoryGrid';
import { useCards, useCategoryCounts } from '../hooks/useCards';
import { useProposals } from '../hooks/useProposals';
import { useActivePeriod } from '../hooks/usePeriods';
import { useAuth } from '../context/AuthContext';
import type { PreferenceType, Card } from '../api/types';
import { STRINGS } from '../config';
import { buildFilterParams } from '../config/categories';

export default function CardLibrary() {
  const [viewMode, setViewMode] = useState<'vote' | 'library' | 'partner'>('vote');
  const [selectedCategory, setSelectedCategory] = useState<CategoryDefinition | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });
  const [proposeDialog, setProposeDialog] = useState<{ open: boolean; card: Card | null }>({
    open: false,
    card: null,
  });

  const { partner } = useAuth();
  const { period } = useActivePeriod();
  const { createProposal } = useProposals();

  // Get category counts for filtering
  const {
    counts: categoryCounts,
    categoriesWithCards,
    isLoading: countsLoading,
    refetch: refetchCategoryCounts,
  } = useCategoryCounts();

  // Build filter params from selected category
  const filterParams = useMemo(() => {
    if (!selectedCategory) return { category: undefined, tags: undefined, excludeTags: undefined, intensity: undefined };
    return buildFilterParams(selectedCategory.filter);
  }, [selectedCategory]);

  // Fetch cards only when a category is selected
  const { cards, isLoading, error, voteOnCard } = useCards({
    category: filterParams.category,
    tags: filterParams.tags,
    excludeTags: filterParams.excludeTags,
    intensity: filterParams.intensity,
    unvotedOnly: true,
  });

  const handleVote = async (cardId: number, preference: PreferenceType) => {
    try {
      await voteOnCard(cardId, preference);
      const messages: Record<PreferenceType, string> = {
        like: 'Te gusta!',
        dislike: 'No te gusta',
        maybe: 'Quizas / Por ti',
        neutral: 'Sin votar',
      };
      setSnackbar({ open: true, message: messages[preference] });
    } catch {
      setSnackbar({ open: true, message: 'Error al votar' });
    }
  };

  const handleComplete = () => {
    setSnackbar({ open: true, message: 'Has votado todas las cartas de esta categoria!' });
    // Go back to category grid after completing
    setTimeout(() => {
      setSelectedCategory(null);
      refetchCategoryCounts();
    }, 1500);
  };

  const handleModeChange = (_: unknown, newMode: 'vote' | 'library' | 'partner' | null) => {
    if (newMode) {
      setViewMode(newMode);
      setSelectedCategory(null); // Reset selection when changing modes
    }
  };

  const handleSelectCategory = (category: CategoryDefinition) => {
    setSelectedCategory(category);
  };

  const handleBackToGrid = () => {
    setSelectedCategory(null);
  };

  const handleProposeReto = (card: Card) => {
    if (!period) {
      setSnackbar({ open: true, message: 'No hay periodo activo. Crea uno primero.' });
      return;
    }
    if (!partner) {
      setSnackbar({ open: true, message: 'No tienes pareja configurada.' });
      return;
    }
    setProposeDialog({ open: true, card });
  };

  const handleConfirmPropose = async () => {
    if (!proposeDialog.card || !period || !partner) return;

    try {
      await createProposal({
        card_id: proposeDialog.card.id,
        proposed_to_user_id: partner.id,
        period_id: period.id,
        week_index: period.current_week || 1,
      });
      setProposeDialog({ open: false, card: null });
      setSnackbar({ open: true, message: 'Reto enviado!' });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Error al proponer reto',
      });
    }
  };

  // Determine title based on state
  const getTitle = () => {
    if (viewMode === 'partner') return 'Votos Pareja';
    if (viewMode === 'library') return 'Mis Cartas';
    if (selectedCategory) return selectedCategory.label;
    return 'Cartas';
  };

  return (
    <MobileLayout title={getTitle()}>
      <Box sx={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
        {/* Header with back button when in voting mode */}
        {selectedCategory && viewMode === 'vote' && (
          <Box sx={{ display: 'flex', alignItems: 'center', px: 1, mb: 1 }}>
            <IconButton onClick={handleBackToGrid} size="small">
              <BackIcon />
            </IconButton>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              {cards.length} cartas sin votar
            </Typography>
          </Box>
        )}

        {/* Mode Toggle - only show when not in voting mode */}
        {!selectedCategory && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleModeChange}
              size="small"
            >
              <ToggleButton value="vote">
                <VoteIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
                Votar
              </ToggleButton>
              <ToggleButton value="library">
                <LibraryIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
                Mis Cartas
              </ToggleButton>
              <ToggleButton value="partner">
                <PeopleIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
                Pareja
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}

        {/* Category Grid - shown in vote mode without selection */}
        {viewMode === 'vote' && !selectedCategory && (
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            {countsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <CategoryGrid
                onSelectCategory={handleSelectCategory}
                categories={categoriesWithCards}
                unvotedCounts={categoryCounts}
              />
            )}
          </Box>
        )}

        {/* Library View - browse voted cards grouped by category */}
        {viewMode === 'library' && (
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            <VotedCardsView
              onProposeReto={handleProposeReto}
              onUndoVote={refetchCategoryCounts}
            />
          </Box>
        )}

        {/* Partner Votes View */}
        {viewMode === 'partner' && (
          <Box sx={{ flexGrow: 1, overflow: 'auto', px: 1 }}>
            <PartnerVotesView />
          </Box>
        )}

        {/* Loading - when category selected */}
        {viewMode === 'vote' && selectedCategory && isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4, flexGrow: 1 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error */}
        {viewMode === 'vote' && selectedCategory && error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Swipeable Card Stack - when category selected */}
        {viewMode === 'vote' && selectedCategory && !isLoading && !error && (
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <SwipeableCardStack
              key={selectedCategory.id}
              cards={cards}
              onVote={handleVote}
              onComplete={handleComplete}
              mode="vote"
              onProposeReto={handleProposeReto}
            />
          </Box>
        )}

        {/* Propose Reto Dialog */}
        <Dialog
          open={proposeDialog.open}
          onClose={() => setProposeDialog({ open: false, card: null })}
        >
          <DialogTitle>Proponer Reto</DialogTitle>
          <DialogContent>
            <Typography>
              Enviar "{proposeDialog.card?.title}" como reto a {partner?.name || 'tu pareja'}?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {STRINGS.currency.partnerWillDecide}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setProposeDialog({ open: false, card: null })}>
              Cancelar
            </Button>
            <Button variant="contained" onClick={handleConfirmPropose}>
              Enviar Reto
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={1500}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          message={snackbar.message}
        />
      </Box>
    </MobileLayout>
  );
}
