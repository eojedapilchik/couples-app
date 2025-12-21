import { Box, Typography, Card as MuiCard, CardContent } from '@mui/material';
import {
  Whatshot as SpicyIcon,
  Favorite as RomanceIcon,
  SentimentVerySatisfied as FunIcon,
  Star as OtherIcon,
} from '@mui/icons-material';
import type { Card, CardCategory } from '../api/types';
import { getCategoryColor } from '../theme/theme';

interface GameCardProps {
  card: Card;
  size?: 'small' | 'medium' | 'large';
}

const categoryIcons: Record<CardCategory, React.ReactNode> = {
  calientes: <SpicyIcon sx={{ fontSize: 32 }} />,
  romance: <RomanceIcon sx={{ fontSize: 32 }} />,
  risas: <FunIcon sx={{ fontSize: 32 }} />,
  otras: <OtherIcon sx={{ fontSize: 32 }} />,
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

  const sizeStyles = {
    small: { minHeight: 250, titleSize: '1.25rem', descSize: '0.95rem', padding: 3 },
    medium: { minHeight: 350, titleSize: '1.75rem', descSize: '1.1rem', padding: 4 },
    large: { minHeight: 420, titleSize: '2rem', descSize: '1.2rem', padding: 4 },
  };

  const styles = sizeStyles[size];

  return (
    <MuiCard
      sx={{
        bgcolor: colors.main,
        color: colors.contrastText,
        minHeight: styles.minHeight,
        height: '100%',
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
        }}
      >
        {/* Category Tag */}
        <Typography
          variant="overline"
          sx={{
            opacity: 0.85,
            letterSpacing: 2,
            fontSize: '0.85rem',
            mb: 3,
            fontWeight: 500,
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
            mb: 3,
          }}
        >
          {card.title}
        </Typography>

        {/* Description */}
        <Typography
          sx={{
            flexGrow: 1,
            fontSize: styles.descSize,
            lineHeight: 1.7,
            opacity: 0.95,
          }}
        >
          {card.description}
        </Typography>

        {/* Bottom Row: Credits + Icon */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            mt: 3,
          }}
        >
          {/* Credit Value - Bigger and more prominent */}
          <Box
            sx={{
              bgcolor: 'rgba(255,255,255,0.25)',
              color: 'inherit',
              px: 2.5,
              py: 1,
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '1.5rem',
                lineHeight: 1,
              }}
            >
              {card.credit_value}
            </Typography>
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: '0.9rem',
                opacity: 0.9,
              }}
            >
              créditos
            </Typography>
          </Box>

          {/* Category Icon */}
          <Box sx={{ opacity: 0.7 }}>{categoryIcons[card.category]}</Box>
        </Box>
      </CardContent>
    </MuiCard>
  );
}
