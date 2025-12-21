import { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import MobileLayout from '../components/layout/MobileLayout';
import SwipeableCardStack from '../components/SwipeableCardStack';
import { useCards } from '../hooks/useCards';
import type { CardCategory, PreferenceType } from '../api/types';

const categories: { value: CardCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'calientes', label: 'Calientes' },
  { value: 'romance', label: 'Romance' },
  { value: 'risas', label: 'Risas' },
  { value: 'otras', label: 'Otras' },
];

export default function CardLibrary() {
  const [category, setCategory] = useState<CardCategory | 'all'>('all');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  const { cards, isLoading, error, voteOnCard } = useCards(
    category === 'all' ? undefined : category
  );

  const handleVote = async (cardId: number, preference: PreferenceType) => {
    try {
      await voteOnCard(cardId, preference);
      setSnackbar({
        open: true,
        message: preference === 'like' ? 'Te gusta!' : 'No te gusta',
      });
    } catch {
      setSnackbar({ open: true, message: 'Error al votar' });
    }
  };

  const handleComplete = () => {
    setSnackbar({ open: true, message: 'Has visto todas las cartas!' });
  };

  const handleCategoryChange = (_: unknown, newValue: CardCategory | 'all') => {
    setCategory(newValue);
    // Don't call refetch() here - useEffect in useCards handles it automatically
  };

  return (
    <MobileLayout title="Cartas">
      <Box sx={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
        {/* Category Tabs */}
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

        {/* Loading */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4, flexGrow: 1 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Swipeable Card Stack */}
        {!isLoading && !error && (
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <SwipeableCardStack
              key={category}
              cards={cards}
              onVote={handleVote}
              onComplete={handleComplete}
            />
          </Box>
        )}

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
