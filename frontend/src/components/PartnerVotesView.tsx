import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardActionArea,
  Collapse,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Favorite as LikeIcon,
  ThumbDown as DislikeIcon,
  HelpOutline as MaybeIcon,
} from '@mui/icons-material';
import type { Card as CardType, PreferenceType } from '../api/types';
import { usePartnerVotes } from '../hooks/useCards';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, type CategoryDefinition } from '../config/categories';

// Preference icons with refined colors
const preferenceIcons: Record<PreferenceType, { icon: React.ReactNode; color: string; bg: string }> = {
  like: { icon: <LikeIcon fontSize="small" />, color: '#16A34A', bg: '#DCFCE7' },
  maybe: { icon: <MaybeIcon fontSize="small" />, color: '#D97706', bg: '#FEF3C7' },
  dislike: { icon: <DislikeIcon fontSize="small" />, color: '#DC2626', bg: '#FEE2E2' },
  neutral: { icon: null, color: '#6B7280', bg: '#F3F4F6' },
};

// Helper to find which categories a card belongs to (based on groupings)
function getCardCategories(card: CardType): CategoryDefinition[] {
  if (!card.groupings_list || card.groupings_list.length === 0) {
    return [];
  }

  const categoryMap = new Map<string, CategoryDefinition>();
  for (const grouping of card.groupings_list) {
    const category = CATEGORIES.find(
      (candidate) => candidate.filter.groupingSlug === grouping.slug
    );
    if (category) {
      categoryMap.set(category.id, category);
    }
  }

  return Array.from(categoryMap.values());
}

// Group cards by category
function groupCardsByCategory(cards: CardType[]): Map<CategoryDefinition, CardType[]> {
  const groups = new Map<CategoryDefinition, CardType[]>();

  for (const card of cards) {
    const categories = getCardCategories(card);
    for (const category of categories) {
      const existing = groups.get(category) || [];
      existing.push(card);
      groups.set(category, existing);
    }
  }

  return groups;
}

// Category section component
interface CategorySectionProps {
  category: CategoryDefinition;
  cards: CardType[];
}

function CategorySection({ category, cards }: CategorySectionProps) {
  const [expanded, setExpanded] = useState(false);

  // Determine if we need light or dark overlays based on text color
  const isLightText = category.colors.text === '#F9FAFB' || category.colors.text === '#FFFFFF';

  // Count by preference
  const counts = useMemo(() => {
    const result = { like: 0, maybe: 0, dislike: 0, neutral: 0 };
    for (const card of cards) {
      const pref = card.partner_preference || 'neutral';
      result[pref]++;
    }
    return result;
  }, [cards]);

  return (
    <Card
      sx={{
        mb: 2,
        borderRadius: 2.5,
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        },
      }}
    >
      <CardActionArea
        onClick={() => setExpanded(!expanded)}
        sx={{
          background: category.colors.bg,
          color: category.colors.text,
          p: 2,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography sx={{ fontSize: '1.8rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>
              {category.emoji}
            </Typography>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: '0.02em' }}>
                {category.label}
              </Typography>
              <Typography variant="caption" sx={{ opacity: isLightText ? 0.7 : 0.6 }}>
                {cards.length} cartas
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            {/* Preference counts */}
            {counts.like > 0 && (
              <Chip
                icon={<LikeIcon sx={{ fontSize: 12, color: '#16A34A !important' }} />}
                label={counts.like}
                size="small"
                sx={{ bgcolor: '#DCFCE7', color: '#16A34A', height: 22, fontSize: '0.7rem' }}
              />
            )}
            {counts.maybe > 0 && (
              <Chip
                icon={<MaybeIcon sx={{ fontSize: 12, color: '#D97706 !important' }} />}
                label={counts.maybe}
                size="small"
                sx={{ bgcolor: '#FEF3C7', color: '#D97706', height: 22, fontSize: '0.7rem' }}
              />
            )}
            {counts.dislike > 0 && (
              <Chip
                icon={<DislikeIcon sx={{ fontSize: 12, color: '#DC2626 !important' }} />}
                label={counts.dislike}
                size="small"
                sx={{ bgcolor: '#FEE2E2', color: '#DC2626', height: 22, fontSize: '0.7rem' }}
              />
            )}
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </Box>
        </Box>
      </CardActionArea>

      <Collapse in={expanded}>
        <List dense disablePadding sx={{ bgcolor: '#FAFAFA' }}>
          {cards.map((card) => {
            const pref = card.partner_preference || 'neutral';
            const prefStyle = preferenceIcons[pref];
            const userPref = card.user_preference;
            const userPrefStyle = userPref ? preferenceIcons[userPref] : null;

            return (
              <ListItem
                key={card.id}
                sx={{
                  borderBottom: '1px solid',
                  borderColor: '#F0F0F0',
                  py: 1.5,
                  '&:last-child': { borderBottom: 'none' },
                }}
              >
                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      sx={{
                        pr: 1,
                        color: '#374151',
                        lineHeight: 1.5,
                        fontWeight: 400,
                      }}
                    >
                      {card.description}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', gap: 0.75, mt: 1, alignItems: 'center' }}>
                      {/* Partner preference */}
                      <Chip
                        icon={prefStyle.icon as React.ReactElement}
                        label="Pareja"
                        size="small"
                        sx={{
                          bgcolor: prefStyle.bg,
                          color: prefStyle.color,
                          height: 22,
                          fontSize: '0.7rem',
                          fontWeight: 500,
                          '& .MuiChip-icon': { color: prefStyle.color },
                        }}
                      />
                      {/* User preference if exists */}
                      {userPrefStyle && (
                        <Chip
                          icon={userPrefStyle.icon as React.ReactElement}
                          label="Tu"
                          size="small"
                          sx={{
                            bgcolor: userPrefStyle.bg,
                            color: userPrefStyle.color,
                            height: 22,
                            fontSize: '0.7rem',
                            fontWeight: 500,
                            '& .MuiChip-icon': { color: userPrefStyle.color },
                          }}
                        />
                      )}
                    </Box>
                  }
                />
              </ListItem>
            );
          })}
        </List>
      </Collapse>
    </Card>
  );
}

export default function PartnerVotesView() {
  const { partner } = useAuth();
  const { like, maybe, dislike, neutral, totalMutual, isLoading, error } = usePartnerVotes();

  // Combine all cards
  const allCards = useMemo(() => {
    return [...like, ...maybe, ...dislike, ...neutral];
  }, [like, maybe, dislike, neutral]);

  // Group by category (using same categories as Votar tab)
  const cardsByCategory = useMemo(() => {
    return groupCardsByCategory(allCards);
  }, [allCards]);

  // Sort categories by order defined in CATEGORIES
  const sortedCategories = useMemo(() => {
    return Array.from(cardsByCategory.entries())
      .sort(([catA], [catB]) => catA.order - catB.order);
  }, [cardsByCategory]);

  // Overall summary counts - must be before conditional returns!
  const summary = useMemo(() => {
    return {
      like: like.length,
      maybe: maybe.length,
      dislike: dislike.length,
    };
  }, [like, maybe, dislike]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (totalMutual === 0) {
    return (
      <Alert severity="info">
        No hay cartas mutuas todavia. Ambos deben votar en las cartas primero.
      </Alert>
    );
  }

  return (
    <Box sx={{ py: 1 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, textAlign: 'center' }}>
        Votos de {partner?.name || 'Pareja'}
      </Typography>

      {/* Summary chips */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
        <Chip
          icon={<LikeIcon sx={{ fontSize: 16, color: '#16A34A !important' }} />}
          label={`${summary.like} Le gusta`}
          sx={{
            bgcolor: '#DCFCE7',
            color: '#16A34A',
            fontWeight: 600,
            fontSize: '0.8rem',
            py: 0.5,
          }}
        />
        <Chip
          icon={<MaybeIcon sx={{ fontSize: 16, color: '#D97706 !important' }} />}
          label={`${summary.maybe} Quizas`}
          sx={{
            bgcolor: '#FEF3C7',
            color: '#D97706',
            fontWeight: 600,
            fontSize: '0.8rem',
            py: 0.5,
          }}
        />
        <Chip
          icon={<DislikeIcon sx={{ fontSize: 16, color: '#DC2626 !important' }} />}
          label={`${summary.dislike} No`}
          sx={{
            bgcolor: '#FEE2E2',
            color: '#DC2626',
            fontWeight: 600,
            fontSize: '0.8rem',
            py: 0.5,
          }}
        />
      </Box>

      {sortedCategories.map(([category, cards]) => (
        <CategorySection
          key={category.id}
          category={category}
          cards={cards}
        />
      ))}
    </Box>
  );
}
