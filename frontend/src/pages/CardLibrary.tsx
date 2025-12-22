import { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
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
} from '@mui/material';
import {
  HowToVote as VoteIcon,
  Visibility as BrowseIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import MobileLayout from '../components/layout/MobileLayout';
import SwipeableCardStack from '../components/SwipeableCardStack';
import PartnerVotesView from '../components/PartnerVotesView';
import { useCards } from '../hooks/useCards';
import { useProposals } from '../hooks/useProposals';
import { useActivePeriod } from '../hooks/usePeriods';
import { useAuth } from '../context/AuthContext';
import type { CardCategory, PreferenceType, Card } from '../api/types';
import { STRINGS } from '../config';

const categories: { value: CardCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'calientes', label: 'Calientes' },
  { value: 'romance', label: 'Romance' },
  { value: 'risas', label: 'Risas' },
  { value: 'otras', label: 'Otras' },
];

export default function CardLibrary() {
  const [category, setCategory] = useState<CardCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<'vote' | 'browse' | 'partner'>('vote');
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

  // In vote mode, only show unvoted cards; in browse mode, show all
  const { cards, isLoading, error, voteOnCard } = useCards(
    category === 'all' ? undefined : category,
    viewMode === 'vote' // unvotedOnly
  );

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
    setSnackbar({ open: true, message: 'Has visto todas las cartas!' });
  };

  const handleCategoryChange = (_: unknown, newValue: CardCategory | 'all') => {
    setCategory(newValue);
  };

  const handleModeChange = (_: unknown, newMode: 'vote' | 'browse' | 'partner' | null) => {
    if (newMode) {
      setViewMode(newMode);
    }
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

  return (
    <MobileLayout title="Cartas">
      <Box sx={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
        {/* Mode Toggle */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleModeChange}
            size="small"
          >
            <ToggleButton value="vote">
              <VoteIcon sx={{ mr: 0.5 }} />
              Votar
            </ToggleButton>
            <ToggleButton value="browse">
              <BrowseIcon sx={{ mr: 0.5 }} />
              Ver Todas
            </ToggleButton>
            <ToggleButton value="partner">
              <PeopleIcon sx={{ mr: 0.5 }} />
              Pareja
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Category Tabs - hidden in partner mode */}
        {viewMode !== 'partner' && (
          <Tabs
            value={category}
            onChange={handleCategoryChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 1, flexShrink: 0 }}
          >
            {categories.map((cat) => (
              <Tab key={cat.value} value={cat.value} label={cat.label} />
            ))}
          </Tabs>
        )}

        {/* Partner Votes View */}
        {viewMode === 'partner' && (
          <Box sx={{ flexGrow: 1, overflow: 'auto', px: 1 }}>
            <PartnerVotesView />
          </Box>
        )}

        {/* Loading - for vote/browse modes */}
        {viewMode !== 'partner' && isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4, flexGrow: 1 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error - for vote/browse modes */}
        {viewMode !== 'partner' && error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Swipeable Card Stack - for vote/browse modes */}
        {viewMode !== 'partner' && !isLoading && !error && (
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <SwipeableCardStack
              key={`${category}-${viewMode}`}
              cards={cards}
              onVote={handleVote}
              onComplete={handleComplete}
              mode={viewMode === 'vote' ? 'vote' : 'browse'}
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
