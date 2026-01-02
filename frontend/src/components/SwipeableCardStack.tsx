import { useState, useRef } from 'react';
import { Box, Typography, Button, Chip, IconButton, Tooltip } from '@mui/material';
import {
  Favorite as LikeIcon,
  Close as DislikeIcon,
  VolunteerActivism as MaybeIcon,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  LocalFireDepartment as RetoIcon,
} from '@mui/icons-material';
import { useSwipeable } from 'react-swipeable';
import type { Card, PreferenceType } from '../api/types';
import GameCard from './GameCard';

interface SwipeableCardStackProps {
  cards: Card[];
  onVote: (cardId: number, preference: PreferenceType) => Promise<void>;
  onComplete?: () => void;
  mode?: 'vote' | 'browse';
  onProposeReto?: (card: Card) => void;
}

export default function SwipeableCardStack({
  cards,
  onVote,
  onComplete,
  mode = 'vote',
  onProposeReto,
}: SwipeableCardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [offset, setOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [exiting, setExiting] = useState(false);
  const busy = useRef(false);

  const currentCard = cards[currentIndex];
  const nextCard = cards[currentIndex + 1];

  const isVoteMode = mode === 'vote';
  const isBrowseMode = mode === 'browse';

  const vote = (preference: PreferenceType) => {
    if (!currentCard || busy.current || !isVoteMode) return;
    busy.current = true;
    setExiting(true);

    const direction = preference === 'like' ? 1 : preference === 'dislike' ? -1 : 0;
    setOffset(direction * 500);

    onVote(currentCard.id, preference).catch(console.error);

    setTimeout(() => {
      // Reset without transition by keeping exiting=true
      setOffset(0);
      setCurrentIndex((i) => {
        const next = i + 1;
        if (next >= cards.length && onComplete) onComplete();
        return next;
      });
      // Small delay before allowing transitions again
      requestAnimationFrame(() => {
        setExiting(false);
        setSwiping(false);
        busy.current = false;
      });
    }, 150);
  };

  const navigate = (direction: 'prev' | 'next') => {
    if (busy.current) return;
    if (direction === 'prev' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (direction === 'next' && currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const getPreferenceLabel = (pref: PreferenceType | null | undefined) => {
    if (!pref) return null;
    const labels: Record<PreferenceType, { label: string; color: 'success' | 'error' | 'warning' | 'default' }> = {
      like: { label: 'Me gusta', color: 'success' },
      dislike: { label: 'No me gusta', color: 'error' },
      maybe: { label: 'Quizas', color: 'warning' },
      neutral: { label: 'Sin votar', color: 'default' },
    };
    return labels[pref];
  };

  const handlers = useSwipeable({
    onSwiping: (e) => {
      if (busy.current) return;
      setSwiping(true);
      setOffset(e.deltaX);
    },
    onSwipedLeft: () => {
      if (busy.current) return;
      if (Math.abs(offset) > 30) {
        if (isVoteMode) {
          vote('dislike');
        } else {
          navigate('next');
          setOffset(0);
          setSwiping(false);
        }
      } else {
        setOffset(0);
        setSwiping(false);
      }
    },
    onSwipedRight: () => {
      if (busy.current) return;
      if (Math.abs(offset) > 30) {
        if (isVoteMode) {
          vote('like');
        } else {
          navigate('prev');
          setOffset(0);
          setSwiping(false);
        }
      } else {
        setOffset(0);
        setSwiping(false);
      }
    },
    onTouchEndOrOnMouseUp: () => {
      if (!busy.current && Math.abs(offset) <= 30) {
        setOffset(0);
        setSwiping(false);
      }
    },
    trackMouse: true,
    trackTouch: true,
    delta: 10,
    preventScrollOnSwipe: true,
  });

  if (!currentCard) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 2 }}>
        <Typography variant="h5" color="text.secondary">No hay mas cartas</Typography>
        <Typography color="text.secondary">Has visto todas las cartas de esta categoria</Typography>
      </Box>
    );
  }

  const userPref = getPreferenceLabel(currentCard.user_preference);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', pt: 1 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {currentIndex + 1} / {cards.length}
      </Typography>

      {/* Show user's vote in browse mode */}
      {isBrowseMode && userPref && (
        <Chip
          label={userPref.label}
          color={userPref.color}
          size="small"
          sx={{ mb: 1 }}
        />
      )}

      <Box sx={{ position: 'relative', width: '100%', maxWidth: 340, height: 400 }}>
        {nextCard && (
          <Box sx={{ position: 'absolute', width: '100%', height: '100%', transform: 'scale(0.92) translateY(8px)', opacity: 0.4, pointerEvents: 'none' }}>
            <GameCard card={nextCard} size="large" />
          </Box>
        )}

        <Box
          {...handlers}
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            transform: offset === 0 ? 'none' : `translateX(${offset}px) rotate(${offset / 20}deg)`,
            opacity: Math.abs(offset) > 300 ? 0 : 1,
            transition: (swiping || exiting) ? 'none' : 'transform 0.15s ease-out, opacity 0.15s',
            touchAction: 'pan-y',
            userSelect: 'none',
            cursor: 'grab',
            '&:active': { cursor: 'grabbing' },
            backfaceVisibility: 'hidden',
          }}
        >
          <GameCard card={currentCard} size="large" />
        </Box>
      </Box>

      {/* Vote buttons - only in vote mode */}
      {isVoteMode && (
        <Box sx={{ display: 'flex', gap: 2, mt: 2, alignItems: 'center' }}>
          <Button
            variant="outlined"
            color="error"
            onClick={() => vote('dislike')}
            sx={{
              width: 64, height: 64, minWidth: 64, borderRadius: '50%',
              border: '3px solid', bgcolor: 'white', boxShadow: 2,
              touchAction: 'manipulation',
            }}
          >
            <DislikeIcon sx={{ fontSize: 32 }} />
          </Button>

          <Button
            variant="outlined"
            color="warning"
            onClick={() => vote('maybe')}
            sx={{
              width: 56, height: 56, minWidth: 56, borderRadius: '50%',
              border: '3px solid', bgcolor: 'white', boxShadow: 2,
              touchAction: 'manipulation',
            }}
          >
            <MaybeIcon sx={{ fontSize: 28 }} />
          </Button>

          <Button
            variant="outlined"
            color="success"
            onClick={() => vote('like')}
            sx={{
              width: 64, height: 64, minWidth: 64, borderRadius: '50%',
              border: '3px solid', bgcolor: 'white', boxShadow: 2,
              touchAction: 'manipulation',
            }}
          >
            <LikeIcon sx={{ fontSize: 32 }} />
          </Button>
        </Box>
      )}

      {/* Navigation + Proponer Reto - only in browse mode */}
      {isBrowseMode && (
        <Box sx={{ display: 'flex', gap: 2, mt: 2, alignItems: 'center' }}>
          <IconButton
            onClick={() => navigate('prev')}
            disabled={currentIndex === 0}
            sx={{
              width: 48, height: 48,
              border: '2px solid',
              borderColor: 'divider',
              bgcolor: 'white',
            }}
          >
            <PrevIcon />
          </IconButton>

          {onProposeReto && (
            <Tooltip title="Proponer este reto a tu pareja" arrow>
              <IconButton
                onClick={() => onProposeReto(currentCard)}
                color="secondary"
                sx={{
                  width: 56, height: 56,
                  bgcolor: 'secondary.main',
                  color: 'white',
                  boxShadow: 2,
                  '&:hover': {
                    bgcolor: 'secondary.dark',
                  },
                }}
              >
                <RetoIcon sx={{ fontSize: 28 }} />
              </IconButton>
            </Tooltip>
          )}

          <IconButton
            onClick={() => navigate('next')}
            disabled={currentIndex >= cards.length - 1}
            sx={{
              width: 48, height: 48,
              border: '2px solid',
              borderColor: 'divider',
              bgcolor: 'white',
            }}
          >
            <NextIcon />
          </IconButton>
        </Box>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5 }}>
        {isVoteMode ? 'Desliza o usa los botones' : 'Desliza para navegar'}
      </Typography>
    </Box>
  );
}
