import { Box, Card, CardActionArea, Typography, Chip } from '@mui/material';
import { ChevronRight as ArrowIcon } from '@mui/icons-material';
import type { CategoryDefinition } from '../config/categories';

interface CategoryCardProps {
  category: CategoryDefinition;
  unvotedCount?: number;
  onClick: () => void;
}

function CategoryCard({ category, unvotedCount, onClick }: CategoryCardProps) {
  // Determine if we need light or dark overlays based on text color
  const isLightText = category.colors.text === '#F9FAFB' || category.colors.text === '#fff';
  const overlayColor = isLightText ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)';
  const subtleTextOpacity = isLightText ? 0.7 : 0.6;

  return (
    <Card
      sx={{
        borderRadius: 2.5,
        overflow: 'hidden',
        mb: 2,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
        },
      }}
    >
      <CardActionArea
        onClick={onClick}
        sx={{
          background: category.colors.bg,
          color: category.colors.text,
          p: 2.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          minHeight: 130,
        }}
      >
        {/* Header row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
          <Typography
            variant="overline"
            sx={{
              opacity: subtleTextOpacity,
              fontWeight: 600,
              letterSpacing: 1.5,
              fontSize: '0.65rem',
            }}
          >
            CARTAS
          </Typography>
          <Typography sx={{ fontSize: '2.2rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>
            {category.emoji}
          </Typography>
        </Box>

        {/* Title */}
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            mt: 0.5,
            mb: 1.5,
            letterSpacing: '0.02em',
          }}
        >
          {category.label}
        </Typography>

        {/* Bottom row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', mt: 'auto' }}>
          {unvotedCount !== undefined && unvotedCount > 0 ? (
            <Chip
              label={`${unvotedCount} sin votar`}
              size="small"
              sx={{
                bgcolor: overlayColor,
                color: 'inherit',
                fontWeight: 500,
                fontSize: '0.75rem',
              }}
            />
          ) : (
            <Chip
              label="Completado"
              size="small"
              sx={{
                bgcolor: overlayColor,
                color: 'inherit',
                fontWeight: 500,
                fontSize: '0.75rem',
              }}
            />
          )}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: overlayColor,
              borderRadius: 3,
              px: 1.5,
              py: 0.5,
            }}
          >
            <Typography variant="button" sx={{ fontWeight: 600, mr: 0.5, fontSize: '0.75rem' }}>
              VOTAR
            </Typography>
            <ArrowIcon sx={{ fontSize: '1rem' }} />
          </Box>
        </Box>
      </CardActionArea>
    </Card>
  );
}

interface CategoryGridProps {
  onSelectCategory: (category: CategoryDefinition) => void;
  categories: CategoryDefinition[];
  unvotedCounts?: Record<string, number>;
}

export default function CategoryGrid({ onSelectCategory, categories, unvotedCounts }: CategoryGridProps) {
  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);

  if (sortedCategories.length === 0) {
    return (
      <Box sx={{ px: 0.5, py: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Has votado todas las cartas disponibles!
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 0.5, py: 2 }}>
      <Typography
        variant="h6"
        sx={{
          mb: 3,
          fontWeight: 700,
          color: '#1F2937',
          letterSpacing: '-0.02em',
          px: 0.5,
        }}
      >
        Elige un tema para votar
      </Typography>

      {sortedCategories.map((cat) => (
        <CategoryCard
          key={cat.id}
          category={cat}
          unvotedCount={unvotedCounts?.[cat.id]}
          onClick={() => onSelectCategory(cat)}
        />
      ))}
    </Box>
  );
}

export type { CategoryDefinition };
