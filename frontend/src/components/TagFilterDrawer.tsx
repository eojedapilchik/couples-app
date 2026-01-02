import { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  Chip,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import type { Tag } from '../api/types';
import { useTags } from '../hooks/useTags';

// Tag display config with colors
const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  basics: { bg: '#E3F2FD', color: '#1565C0' },
  sensual: { bg: '#FCE4EC', color: '#C2185B' },
  fantasy: { bg: '#F3E5F5', color: '#7B1FA2' },
  bdsm: { bg: '#212121', color: '#FFFFFF' },
  anal: { bg: '#FFEBEE', color: '#C62828' },
  toys: { bg: '#E8F5E9', color: '#2E7D32' },
  public: { bg: '#FFF3E0', color: '#E65100' },
  couple_dynamics: { bg: '#E1F5FE', color: '#0277BD' },
  group: { bg: '#EFEBE9', color: '#4E342E' },
  fetish: { bg: '#F5F5F5', color: '#424242' },
  // Intensity
  estandar: { bg: '#E8F5E9', color: '#388E3C' },
  picante: { bg: '#FFF8E1', color: '#F57C00' },
  muy_picante: { bg: '#FFEBEE', color: '#D32F2F' },
};

interface TagFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  selectedTags: string[];
  excludedTags: string[];
  onApply: (selected: string[], excluded: string[]) => void;
}

export default function TagFilterDrawer({
  open,
  onClose,
  selectedTags: initialSelected,
  excludedTags: initialExcluded,
  onApply,
}: TagFilterDrawerProps) {
  const { categories, intensity, isLoading, error } = useTags();
  const [selectedTags, setSelectedTags] = useState<string[]>(initialSelected);
  const [excludedTags, setExcludedTags] = useState<string[]>(initialExcluded);

  // Reset state when drawer opens
  useEffect(() => {
    if (open) {
      setSelectedTags(initialSelected);
      setExcludedTags(initialExcluded);
    }
  }, [open, initialSelected, initialExcluded]);

  const toggleTag = (slug: string, type: 'include' | 'exclude') => {
    if (type === 'include') {
      // If already selected, remove it
      if (selectedTags.includes(slug)) {
        setSelectedTags(selectedTags.filter(t => t !== slug));
      } else {
        // Add to selected, remove from excluded if present
        setSelectedTags([...selectedTags, slug]);
        setExcludedTags(excludedTags.filter(t => t !== slug));
      }
    } else {
      // Exclude logic
      if (excludedTags.includes(slug)) {
        setExcludedTags(excludedTags.filter(t => t !== slug));
      } else {
        // Add to excluded, remove from selected if present
        setExcludedTags([...excludedTags, slug]);
        setSelectedTags(selectedTags.filter(t => t !== slug));
      }
    }
  };

  const handleApply = () => {
    onApply(selectedTags, excludedTags);
    onClose();
  };

  const getTagStyle = (tag: Tag, isSelected: boolean, isExcluded: boolean) => {
    const colors = TAG_COLORS[tag.slug] || { bg: '#F5F5F5', color: '#424242' };

    if (isExcluded) {
      return {
        bgcolor: '#FFCDD2',
        color: '#B71C1C',
        border: '2px solid #B71C1C',
        textDecoration: 'line-through',
      };
    }
    if (isSelected) {
      return {
        bgcolor: colors.bg,
        color: colors.color,
        border: `2px solid ${colors.color}`,
        fontWeight: 600,
      };
    }
    return {
      bgcolor: 'transparent',
      color: '#757575',
      border: '1px solid #E0E0E0',
    };
  };

  const renderTagChip = (tag: Tag, type: 'include' | 'exclude' = 'include') => {
    const isSelected = selectedTags.includes(tag.slug);
    const isExcluded = excludedTags.includes(tag.slug);
    const style = getTagStyle(tag, isSelected, isExcluded);

    return (
      <Chip
        key={`${tag.slug}-${type}`}
        label={tag.name}
        onClick={() => toggleTag(tag.slug, type)}
        sx={{
          ...style,
          m: 0.5,
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            transform: 'scale(1.05)',
          },
        }}
      />
    );
  };

  // Categories that are typically excluded
  const sensitiveCategories = ['anal', 'group', 'fetish', 'public'];
  const mainCategories = categories.filter(c => !sensitiveCategories.includes(c.slug));
  const excludeCategories = categories.filter(c => sensitiveCategories.includes(c.slug));

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: '85vh',
        },
      }}
    >
      <Box sx={{ p: 2, pb: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Filtrar Cartas
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {!isLoading && !error && (
          <>
            {/* Include Section */}
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
              Incluir temas (toca para seleccionar)
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 2 }}>
              {mainCategories.map(tag => renderTagChip(tag, 'include'))}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Intensity Section */}
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
              Intensidad
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 2 }}>
              {intensity.map(tag => renderTagChip(tag, 'include'))}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Exclude Section */}
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
              Excluir temas (toca para evitar)
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 3 }}>
              {excludeCategories.map(tag => renderTagChip(tag, 'exclude'))}
            </Box>

            {/* Summary */}
            {(selectedTags.length > 0 || excludedTags.length > 0) && (
              <Box sx={{ mb: 2, p: 1.5, bgcolor: '#F5F5F5', borderRadius: 2 }}>
                {selectedTags.length > 0 && (
                  <Typography variant="body2" sx={{ color: 'success.main' }}>
                    Incluyendo: {selectedTags.join(', ')}
                  </Typography>
                )}
                {excludedTags.length > 0 && (
                  <Typography variant="body2" sx={{ color: 'error.main' }}>
                    Excluyendo: {excludedTags.join(', ')}
                  </Typography>
                )}
              </Box>
            )}

            {/* Apply Button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleApply}
              sx={{
                py: 1.5,
                borderRadius: 3,
                fontWeight: 600,
              }}
            >
              Ver Cartas
            </Button>
          </>
        )}
      </Box>
    </Drawer>
  );
}
