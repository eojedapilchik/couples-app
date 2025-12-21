import { useState, useRef } from 'react';
import { Box, Typography, Button } from '@mui/material';
import {
  Favorite as LikeIcon,
  Close as DislikeIcon,
} from '@mui/icons-material';
import { useSwipeable } from 'react-swipeable';
import type { Card, PreferenceType } from '../api/types';
import GameCard from './GameCard';

interface SwipeableCardStackProps {
  cards: Card[];
  onVote: (cardId: number, preference: PreferenceType) => Promise<void>;
  onComplete?: () => void;
}

export default function SwipeableCardStack({
  cards,
  onVote,
  onComplete,
}: SwipeableCardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [offset, setOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [exiting, setExiting] = useState(false);
  const busy = useRef(false);

  const currentCard = cards[currentIndex];
  const nextCard = cards[currentIndex + 1];

  const vote = (preference: PreferenceType) => {
    if (!currentCard || busy.current) return;
    busy.current = true;
    setExiting(true);

    const direction = preference === 'like' ? 1 : -1;
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

  const handlers = useSwipeable({
    onSwiping: (e) => {
      if (busy.current) return;
      setSwiping(true);
      setOffset(e.deltaX);
    },
    onSwipedLeft: () => {
      if (busy.current) return;
      if (Math.abs(offset) > 30) {
        vote('dislike');
      } else {
        setOffset(0);
        setSwiping(false);
      }
    },
    onSwipedRight: () => {
      if (busy.current) return;
      if (Math.abs(offset) > 30) {
        vote('like');
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', pt: 1 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {currentIndex + 1} / {cards.length}
      </Typography>

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
            transform: `translateX(${offset}px) rotate(${offset / 20}deg)`,
            opacity: Math.abs(offset) > 300 ? 0 : 1,
            transition: (swiping || exiting) ? 'none' : 'transform 0.15s ease-out, opacity 0.15s',
            touchAction: 'pan-y',
            userSelect: 'none',
            cursor: 'grab',
            '&:active': { cursor: 'grabbing' },
          }}
        >
          <GameCard card={currentCard} size="large" />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 4, mt: 2 }}>
        <Button
          variant="outlined"
          color="error"
          onClick={() => vote('dislike')}
          sx={{
            width: 72, height: 72, minWidth: 72, borderRadius: '50%',
            border: '3px solid', bgcolor: 'white', boxShadow: 2,
            touchAction: 'manipulation',
          }}
        >
          <DislikeIcon sx={{ fontSize: 36 }} />
        </Button>

        <Button
          variant="outlined"
          color="success"
          onClick={() => vote('like')}
          sx={{
            width: 72, height: 72, minWidth: 72, borderRadius: '50%',
            border: '3px solid', bgcolor: 'white', boxShadow: 2,
            touchAction: 'manipulation',
          }}
        >
          <LikeIcon sx={{ fontSize: 36 }} />
        </Button>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5 }}>
        Desliza o usa los botones
      </Typography>
    </Box>
  );
}
