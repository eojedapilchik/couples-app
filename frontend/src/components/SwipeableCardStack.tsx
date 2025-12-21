import { useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Box, Typography, IconButton } from '@mui/material';
import {
  Favorite as LikeIcon,
  Close as DislikeIcon,
} from '@mui/icons-material';
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
  const [isAnimating, setIsAnimating] = useState(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const dislikeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const currentCard = cards[currentIndex];
  const nextCard = cards[currentIndex + 1];

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => {
      const next = prev + 1;
      if (next >= cards.length && onComplete) {
        setTimeout(onComplete, 100);
      }
      return next;
    });
    x.set(0);
    setIsAnimating(false);
  }, [cards.length, onComplete, x]);

  const handleVote = useCallback(async (preference: PreferenceType) => {
    if (!currentCard || isAnimating) return;

    setIsAnimating(true);

    try {
      await onVote(currentCard.id, preference);
    } catch (error) {
      console.error('Vote failed:', error);
    }

    goToNext();
  }, [currentCard, isAnimating, onVote, goToNext]);

  const handleDragEnd = useCallback((_: unknown, info: PanInfo) => {
    if (isAnimating) return;

    const swipeThreshold = 80;
    const velocityThreshold = 300;

    if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      handleVote('like');
    } else if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      handleVote('dislike');
    } else {
      // Spring back to center
      x.set(0);
    }
  }, [isAnimating, handleVote, x]);

  const handleButtonVote = (preference: PreferenceType) => {
    if (isAnimating) return;
    handleVote(preference);
  };

  if (!currentCard) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
          gap: 2,
        }}
      >
        <Typography variant="h5" color="text.secondary">
          No hay mas cartas
        </Typography>
        <Typography color="text.secondary">
          Has visto todas las cartas de esta categoria
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: '100%',
        pt: 1,
      }}
    >
      {/* Card Counter */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {currentIndex + 1} / {cards.length}
      </Typography>

      {/* Card Stack */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 340,
          height: 420,
        }}
      >
        {/* Next Card (background preview) */}
        {nextCard && (
          <Box
            sx={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              transform: 'scale(0.92) translateY(8px)',
              opacity: 0.4,
              pointerEvents: 'none',
            }}
          >
            <GameCard card={nextCard} size="large" />
          </Box>
        )}

        {/* Current Card (draggable) */}
        <motion.div
          key={currentCard.id}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            x,
            rotate,
            cursor: isAnimating ? 'default' : 'grab',
          }}
          drag={isAnimating ? false : 'x'}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.9}
          onDragEnd={handleDragEnd}
          whileDrag={{ cursor: 'grabbing', scale: 1.02 }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          {/* Like Indicator */}
          <motion.div
            style={{
              position: 'absolute',
              top: 30,
              left: 20,
              zIndex: 10,
              opacity: likeOpacity,
            }}
          >
            <Box
              sx={{
                bgcolor: 'success.main',
                color: 'white',
                px: 3,
                py: 1,
                borderRadius: 2,
                fontWeight: 'bold',
                fontSize: '1.3rem',
                border: '3px solid white',
                transform: 'rotate(-15deg)',
                boxShadow: 3,
              }}
            >
              LIKE
            </Box>
          </motion.div>

          {/* Dislike Indicator */}
          <motion.div
            style={{
              position: 'absolute',
              top: 30,
              right: 20,
              zIndex: 10,
              opacity: dislikeOpacity,
            }}
          >
            <Box
              sx={{
                bgcolor: 'error.main',
                color: 'white',
                px: 3,
                py: 1,
                borderRadius: 2,
                fontWeight: 'bold',
                fontSize: '1.3rem',
                border: '3px solid white',
                transform: 'rotate(15deg)',
                boxShadow: 3,
              }}
            >
              NOPE
            </Box>
          </motion.div>

          <GameCard card={currentCard} size="large" />
        </motion.div>
      </Box>

      {/* Action Buttons */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 5,
          mt: 2,
        }}
      >
        {/* Dislike Button */}
        <IconButton
          onClick={() => handleButtonVote('dislike')}
          disabled={isAnimating}
          sx={{
            width: 64,
            height: 64,
            bgcolor: 'white',
            border: '3px solid',
            borderColor: 'error.main',
            color: 'error.main',
            '&:hover': { bgcolor: 'error.main', color: 'white' },
            '&.Mui-disabled': { opacity: 0.5 },
            boxShadow: 2,
          }}
        >
          <DislikeIcon sx={{ fontSize: 32 }} />
        </IconButton>

        {/* Like Button */}
        <IconButton
          onClick={() => handleButtonVote('like')}
          disabled={isAnimating}
          sx={{
            width: 64,
            height: 64,
            bgcolor: 'white',
            border: '3px solid',
            borderColor: 'success.main',
            color: 'success.main',
            '&:hover': { bgcolor: 'success.main', color: 'white' },
            '&.Mui-disabled': { opacity: 0.5 },
            boxShadow: 2,
          }}
        >
          <LikeIcon sx={{ fontSize: 32 }} />
        </IconButton>
      </Box>

      {/* Swipe Hint */}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5 }}>
        Desliza o usa los botones
      </Typography>
    </Box>
  );
}
