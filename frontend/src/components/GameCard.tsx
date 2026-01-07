import { Box, Typography, Card as MuiCard, CardContent } from '@mui/material';
import {
  Whatshot as SpicyIcon,
  Favorite as RomanceIcon,
  SentimentVerySatisfied as FunIcon,
  Star as OtherIcon,
} from '@mui/icons-material';
import type { Card, CardCategory } from '../api/types';
import { getCategoryColor } from '../theme/theme';
import { CURRENCY_NAME_LOWER } from '../config';
import MarkdownText from './MarkdownText';

interface GameCardProps {
  card: Card;
  size?: 'small' | 'medium' | 'large';
}

const categoryIcons: Record<CardCategory, React.ReactNode> = {
  calientes: <SpicyIcon sx={{ fontSize: 28 }} />,
  romance: <RomanceIcon sx={{ fontSize: 28 }} />,
  risas: <FunIcon sx={{ fontSize: 28 }} />,
  otras: <OtherIcon sx={{ fontSize: 28 }} />,
};

const categoryLabels: Record<CardCategory, string> = {
  calientes: '#calientes',
  romance: '#romance',
  risas: '#risas',
  otras: '#otras',
};

export default function GameCard({
  card,
  size = 'medium',
}: GameCardProps) {
  const colors = getCategoryColor(card.category);

  // Adjust font size based on description length
  const descLength = card.description?.length || 0;
  const isLongText = descLength > 150;
  const isVeryLongText = descLength > 250;

  const sizeStyles = {
    small: {
      height: 280,
      titleSize: isLongText ? '1rem' : '1.15rem',
      descSize: isVeryLongText ? '0.75rem' : isLongText ? '0.8rem' : '0.85rem',
      padding: 2,
      tagSize: '0.7rem',
      creditSize: '1.1rem',
    },
    medium: {
      height: 360,
      titleSize: isLongText ? '1.2rem' : '1.4rem',
      descSize: isVeryLongText ? '0.8rem' : isLongText ? '0.85rem' : '0.95rem',
      padding: 2.5,
      tagSize: '0.75rem',
      creditSize: '1.25rem',
    },
    large: {
      height: 400,
      titleSize: isLongText ? '1.5rem' : '1.75rem',
      descSize: isVeryLongText ? '1rem' : isLongText ? '1.1rem' : '1.2rem',
      padding: 3,
      tagSize: '0.9rem',
      creditSize: '1.4rem',
    },
  };

  const styles = sizeStyles[size];

  return (
    <MuiCard
      sx={{
        bgcolor: colors.main,
        color: colors.contrastText,
        height: styles.height,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        borderRadius: 4,
        overflow: 'hidden',
        border: '4px solid white',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}
    >
      <CardContent
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          p: styles.padding,
          '&:last-child': { pb: styles.padding },
          overflow: 'hidden',
        }}
      >
        {/* Category Tag - Centered */}
        <Typography
          variant="overline"
          sx={{
            opacity: 0.85,
            letterSpacing: 1.5,
            fontSize: styles.tagSize,
            mb: 1,
            fontWeight: 500,
            flexShrink: 0,
            textAlign: 'center',
          }}
        >
          {categoryLabels[card.category]}
        </Typography>

        {/* Title */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            fontSize: styles.titleSize,
            lineHeight: 1.2,
            mb: 1.5,
            flexShrink: 0,
          }}
        >
          {card.title}
        </Typography>

        {/* Description - scrollable if needed */}
        <Box
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            mb: 1.5,
            // Hide scrollbar but keep functionality
            '&::-webkit-scrollbar': { width: 4 },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'rgba(255,255,255,0.3)',
              borderRadius: 2,
            },
          }}
        >
          <MarkdownText
            text={card.description}
            typographySx={{
              fontSize: styles.descSize,
              lineHeight: 1.5,
              opacity: 0.95,
            }}
          />
        </Box>

        {/* Bottom Row: Credits + Icon - Always visible */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
            pt: 1,
            borderTop: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          {/* Credit Value */}
          <Box
            sx={{
              bgcolor: 'rgba(255,255,255,0.25)',
              color: 'inherit',
              px: 2,
              py: 0.75,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
            }}
          >
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: styles.creditSize,
                lineHeight: 1,
              }}
            >
              {card.credit_value}
            </Typography>
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: '0.8rem',
                opacity: 0.9,
              }}
            >
              {CURRENCY_NAME_LOWER}
            </Typography>
          </Box>

          {/* Category Icon */}
          <Box sx={{ opacity: 0.7 }}>{categoryIcons[card.category]}</Box>
        </Box>
      </CardContent>
    </MuiCard>
  );
}
