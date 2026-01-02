import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card as MuiCard,
  CardContent,
  Switch,
  FormControlLabel,
  TextField,
  InputAdornment,
  Chip,
  Stack,
  Button,
  CircularProgress,
  Alert,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tabs,
  Tab,
  Fab,
  Slider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { cardsApi, tagsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Card, Tag, CardCreateAdmin } from '../api/types';

const ITEMS_PER_PAGE = 20;

// Intensity options
const INTENSITY_OPTIONS = [
  { value: 'standard', label: 'Estandar' },
  { value: 'spicy', label: 'Caliente' },
  { value: 'very_spicy', label: 'Muy Caliente' },
  { value: 'extreme', label: 'Extremo' },
];

// Helper to parse card tags JSON
function parseCardTags(tagsJson: string | null): { tags: string[]; intensity: string } {
  if (!tagsJson) return { tags: [], intensity: 'standard' };
  try {
    const parsed = JSON.parse(tagsJson);
    return {
      tags: parsed.tags || [],
      intensity: parsed.intensity || 'standard',
    };
  } catch {
    return { tags: [], intensity: 'standard' };
  }
}

export default function CardManager() {
  const { user } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDisabledOnly, setShowDisabledOnly] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editIntensity, setEditIntensity] = useState('standard');
  const [isSaving, setIsSaving] = useState(false);

  // Edit text state (with locale support)
  const [editTab, setEditTab] = useState(0); // 0 = tags, 1 = text
  const [editLocale, setEditLocale] = useState('es');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // Create card dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCard, setNewCard] = useState<Partial<CardCreateAdmin>>({
    title: '',
    description: '',
    title_es: '',
    description_es: '',
    tags: [],
    intensity: 'standard',
    category: 'calientes',
    spice_level: 1,
    difficulty_level: 1,
    credit_value: 3,
  });
  const [isCreating, setIsCreating] = useState(false);

  // Available tags from API
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);

  const fetchCards = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await cardsApi.getAllCardsForAdmin(user.id, {
        include_disabled: true,
        limit: 500, // Get all cards for filtering
        offset: 0,
      });
      setCards(response.cards);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar cartas');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  // Fetch available tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const grouped = await tagsApi.getTagsGrouped();
        // Combine categories and subtags (exclude intensity - we handle that separately)
        const allTags = [...grouped.categories, ...grouped.subtags];
        setAvailableTags(allTags);
      } catch (err) {
        console.error('Error fetching tags:', err);
      }
    };
    fetchTags();
  }, []);

  const handleToggle = async (cardId: number, enabled: boolean) => {
    if (!user) return;

    setTogglingIds((prev) => new Set(prev).add(cardId));
    try {
      await cardsApi.toggleCardEnabled(cardId, enabled, user.id);
      setCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, is_enabled: enabled } : c))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar carta');
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(cardId);
        return next;
      });
    }
  };

  const handleEnableAll = async () => {
    if (!user) return;

    const disabledIds = cards.filter((c) => !c.is_enabled).map((c) => c.id);
    if (disabledIds.length === 0) return;

    setIsLoading(true);
    try {
      await cardsApi.bulkToggleCards(disabledIds, true, user.id);
      setCards((prev) => prev.map((c) => ({ ...c, is_enabled: true })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al habilitar cartas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableAll = async () => {
    if (!user) return;

    const enabledIds = cards.filter((c) => c.is_enabled).map((c) => c.id);
    if (enabledIds.length === 0) return;

    setIsLoading(true);
    try {
      await cardsApi.bulkToggleCards(enabledIds, false, user.id);
      setCards((prev) => prev.map((c) => ({ ...c, is_enabled: false })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al deshabilitar cartas');
    } finally {
      setIsLoading(false);
    }
  };

  // Edit dialog handlers
  const handleOpenEdit = async (card: Card) => {
    const parsed = parseCardTags(card.tags);
    setEditingCard(card);
    setEditTags(parsed.tags);
    setEditIntensity(parsed.intensity);
    setEditTab(0);
    setEditLocale('es');
    setEditDialogOpen(true);

    // Load Spanish content immediately since Texto is the first tab
    if (user) {
      setIsLoadingContent(true);
      try {
        const content = await cardsApi.getCardContent(card.id, 'es', user.id);
        setEditTitle(content.title);
        setEditDescription(content.description);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar contenido');
        setEditTitle('');
        setEditDescription('');
      } finally {
        setIsLoadingContent(false);
      }
    }
  };

  const handleCloseEdit = () => {
    setEditDialogOpen(false);
    setEditingCard(null);
    setEditTags([]);
    setEditIntensity('standard');
    setEditTab(0);
    setEditTitle('');
    setEditDescription('');
  };

  const handleTagToggle = (tagSlug: string) => {
    setEditTags((prev) =>
      prev.includes(tagSlug)
        ? prev.filter((t) => t !== tagSlug)
        : [...prev, tagSlug]
    );
  };

  const handleSaveTags = async () => {
    if (!user || !editingCard) return;

    setIsSaving(true);
    try {
      const updatedCard = await cardsApi.updateCardTags(
        editingCard.id,
        editTags,
        editIntensity,
        user.id
      );
      // Update the card in local state with full response (includes tags_list)
      setCards((prev) =>
        prev.map((c) =>
          c.id === editingCard.id ? { ...c, ...updatedCard } : c
        )
      );
      handleCloseEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar tags');
    } finally {
      setIsSaving(false);
    }
  };

  // Load content for editing
  const handleLoadContent = async (locale: string) => {
    if (!user || !editingCard) return;

    setIsLoadingContent(true);
    try {
      const content = await cardsApi.getCardContent(editingCard.id, locale, user.id);
      setEditTitle(content.title);
      setEditDescription(content.description);
      setEditLocale(locale);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar contenido');
    } finally {
      setIsLoadingContent(false);
    }
  };

  // When tab changes to text tab (0), load content
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setEditTab(newValue);
    if (newValue === 0 && editingCard) {
      handleLoadContent(editLocale);
    }
  };

  // Save text content
  const handleSaveContent = async () => {
    if (!user || !editingCard) return;

    setIsSaving(true);
    try {
      await cardsApi.updateCardContent(
        editingCard.id,
        { title: editTitle, description: editDescription, locale: editLocale },
        user.id
      );
      // Update local card if editing Spanish (main display locale)
      if (editLocale === 'es') {
        setCards((prev) =>
          prev.map((c) =>
            c.id === editingCard.id
              ? { ...c, title: editTitle, description: editDescription }
              : c
          )
        );
      }
      handleCloseEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar contenido');
    } finally {
      setIsSaving(false);
    }
  };

  // Create card handlers
  const handleOpenCreate = () => {
    setNewCard({
      title: '',
      description: '',
      title_es: '',
      description_es: '',
      tags: [],
      intensity: 'standard',
      category: 'calientes',
      spice_level: 1,
      difficulty_level: 1,
      credit_value: 3,
    });
    setCreateDialogOpen(true);
  };

  const handleCloseCreate = () => {
    setCreateDialogOpen(false);
  };

  const handleNewCardTagToggle = (tagSlug: string) => {
    setNewCard((prev) => ({
      ...prev,
      tags: prev.tags?.includes(tagSlug)
        ? prev.tags.filter((t) => t !== tagSlug)
        : [...(prev.tags || []), tagSlug],
    }));
  };

  const handleCreateCard = async () => {
    if (!user) return;

    // Validation
    if (!newCard.title?.trim() || !newCard.description?.trim()) {
      setError('Titulo y descripcion son requeridos (en ingles)');
      return;
    }

    setIsCreating(true);
    try {
      const createdCard = await cardsApi.createCardAdmin(
        {
          title: newCard.title,
          description: newCard.description,
          title_es: newCard.title_es || null,
          description_es: newCard.description_es || null,
          tags: newCard.tags || [],
          intensity: newCard.intensity || 'standard',
          category: (newCard.category as 'calientes' | 'romance' | 'risas' | 'otras') || 'calientes',
          spice_level: newCard.spice_level || 1,
          difficulty_level: newCard.difficulty_level || 1,
          credit_value: newCard.credit_value || 3,
        },
        user.id
      );
      setCards((prev) => [createdCard, ...prev]);
      setTotal((prev) => prev + 1);
      handleCloseCreate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear carta');
    } finally {
      setIsCreating(false);
    }
  };

  // Filter cards based on search and disabled filter
  const filteredCards = cards.filter((card) => {
    const matchesSearch =
      searchTerm === '' ||
      card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDisabled = !showDisabledOnly || !card.is_enabled;

    return matchesSearch && matchesDisabled;
  });

  // Paginate
  const totalPages = Math.ceil(filteredCards.length / ITEMS_PER_PAGE);
  const paginatedCards = filteredCards.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const enabledCount = cards.filter((c) => c.is_enabled).length;
  const disabledCount = cards.filter((c) => !c.is_enabled).length;

  if (!user?.is_admin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Solo administradores pueden acceder a esta pagina</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
        Administrar Cartas
      </Typography>

      {/* Stats */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Chip
          label={`Total: ${total}`}
          color="default"
          variant="outlined"
        />
        <Chip
          label={`Habilitadas: ${enabledCount}`}
          color="success"
          variant="outlined"
        />
        <Chip
          label={`Deshabilitadas: ${disabledCount}`}
          color="error"
          variant="outlined"
        />
      </Stack>

      {/* Search and filters */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar cartas..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 1 }}
        />

        <Stack direction="row" spacing={2} alignItems="center">
          <FormControlLabel
            control={
              <Switch
                checked={showDisabledOnly}
                onChange={(e) => {
                  setShowDisabledOnly(e.target.checked);
                  setPage(1);
                }}
              />
            }
            label="Solo deshabilitadas"
          />

          <Button
            size="small"
            variant="outlined"
            color="success"
            onClick={handleEnableAll}
            disabled={isLoading || disabledCount === 0}
          >
            Habilitar todas
          </Button>

          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={handleDisableAll}
            disabled={isLoading || enabledCount === 0}
          >
            Deshabilitar todas
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Mostrando {paginatedCards.length} de {filteredCards.length} cartas
          </Typography>

          <Stack spacing={1}>
            {paginatedCards.map((card) => (
              <MuiCard
                key={card.id}
                sx={{
                  opacity: card.is_enabled ? 1 : 0.6,
                  borderLeft: card.is_enabled
                    ? '4px solid #4caf50'
                    : '4px solid #f44336',
                }}
              >
                <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        #{card.id} - {card.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          mt: 0.5,
                        }}
                      >
                        {card.description}
                      </Typography>
                      <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                        {card.tags_list?.slice(0, 3).map((tag) => (
                          <Chip
                            key={tag.id}
                            label={tag.name}
                            size="small"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        ))}
                      </Stack>
                    </Box>

                    <IconButton
                      size="small"
                      onClick={() => handleOpenEdit(card)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <Switch
                      checked={card.is_enabled}
                      onChange={(e) => handleToggle(card.id, e.target.checked)}
                      disabled={togglingIds.has(card.id)}
                      color="success"
                    />
                  </Box>
                </CardContent>
              </MuiCard>
            ))}
          </Stack>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* FAB to create new card */}
      <Fab
        color="primary"
        onClick={handleOpenCreate}
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
      >
        <AddIcon />
      </Fab>

      {/* Edit Card Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCloseEdit}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Editar Carta #{editingCard?.id}
        </DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            {editingCard?.title}
          </Typography>

          <Tabs value={editTab} onChange={handleTabChange} sx={{ mb: 2 }}>
            <Tab label="Texto" />
            <Tab label="Tags" />
          </Tabs>

          {editTab === 0 && (
            <>
              {/* Locale selector */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Idioma</InputLabel>
                <Select
                  value={editLocale}
                  label="Idioma"
                  onChange={(e) => handleLoadContent(e.target.value)}
                  disabled={isLoadingContent}
                >
                  <MenuItem value="es">Espanol</MenuItem>
                  <MenuItem value="en">English (base)</MenuItem>
                </Select>
              </FormControl>

              {isLoadingContent ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  <TextField
                    fullWidth
                    label="Titulo"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Descripcion"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    multiline
                    rows={4}
                  />
                </>
              )}
            </>
          )}

          {editTab === 1 && (
            <>
              {/* Intensity selector */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Intensidad</InputLabel>
                <Select
                  value={editIntensity}
                  label="Intensidad"
                  onChange={(e) => setEditIntensity(e.target.value)}
                >
                  {INTENSITY_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Tags selection */}
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Tags (click para agregar/quitar)
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {availableTags.map((tag) => (
                  <Chip
                    key={tag.id}
                    label={tag.name}
                    size="small"
                    color={editTags.includes(tag.slug) ? 'primary' : 'default'}
                    variant={editTags.includes(tag.slug) ? 'filled' : 'outlined'}
                    onClick={() => handleTagToggle(tag.slug)}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>

              {/* Current selection preview */}
              {editTags.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Seleccionados: {editTags.join(', ')}
                  </Typography>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            onClick={editTab === 0 ? handleSaveContent : handleSaveTags}
            variant="contained"
            disabled={isSaving || isLoadingContent}
          >
            {isSaving ? <CircularProgress size={20} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Card Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={handleCloseCreate}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Nueva Carta</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* English (base) */}
            <Typography variant="subtitle2">Ingles (base)</Typography>
            <TextField
              fullWidth
              label="Titulo (English)"
              value={newCard.title}
              onChange={(e) => setNewCard((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
            <TextField
              fullWidth
              label="Descripcion (English)"
              value={newCard.description}
              onChange={(e) => setNewCard((prev) => ({ ...prev, description: e.target.value }))}
              multiline
              rows={3}
              required
            />

            {/* Spanish */}
            <Typography variant="subtitle2" sx={{ mt: 2 }}>
              Espanol (traduccion)
            </Typography>
            <TextField
              fullWidth
              label="Titulo (Espanol)"
              value={newCard.title_es}
              onChange={(e) => setNewCard((prev) => ({ ...prev, title_es: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Descripcion (Espanol)"
              value={newCard.description_es}
              onChange={(e) => setNewCard((prev) => ({ ...prev, description_es: e.target.value }))}
              multiline
              rows={3}
            />

            {/* Intensity */}
            <FormControl fullWidth>
              <InputLabel>Intensidad</InputLabel>
              <Select
                value={newCard.intensity}
                label="Intensidad"
                onChange={(e) => setNewCard((prev) => ({ ...prev, intensity: e.target.value }))}
              >
                {INTENSITY_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Sliders */}
            <Box>
              <Typography gutterBottom>
                Nivel picante: {newCard.spice_level}
              </Typography>
              <Slider
                value={newCard.spice_level}
                onChange={(_, val) => setNewCard((prev) => ({ ...prev, spice_level: val as number }))}
                min={1}
                max={5}
                marks
                valueLabelDisplay="auto"
              />
            </Box>

            <Box>
              <Typography gutterBottom>
                Dificultad: {newCard.difficulty_level}
              </Typography>
              <Slider
                value={newCard.difficulty_level}
                onChange={(_, val) => setNewCard((prev) => ({ ...prev, difficulty_level: val as number }))}
                min={1}
                max={5}
                marks
                valueLabelDisplay="auto"
              />
            </Box>

            <Box>
              <Typography gutterBottom>
                Valor creditos: {newCard.credit_value}
              </Typography>
              <Slider
                value={newCard.credit_value}
                onChange={(_, val) => setNewCard((prev) => ({ ...prev, credit_value: val as number }))}
                min={1}
                max={10}
                marks
                valueLabelDisplay="auto"
              />
            </Box>

            {/* Tags */}
            <Typography variant="subtitle2">Tags</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {availableTags.map((tag) => (
                <Chip
                  key={tag.id}
                  label={tag.name}
                  size="small"
                  color={newCard.tags?.includes(tag.slug) ? 'primary' : 'default'}
                  variant={newCard.tags?.includes(tag.slug) ? 'filled' : 'outlined'}
                  onClick={() => handleNewCardTagToggle(tag.slug)}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreate} disabled={isCreating}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreateCard}
            variant="contained"
            disabled={isCreating}
          >
            {isCreating ? <CircularProgress size={20} /> : 'Crear Carta'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
