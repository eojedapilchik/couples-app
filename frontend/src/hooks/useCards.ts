import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Card, CardCategory, PreferenceType, PartnerVotesResponse } from '../api/types';
import { cardsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, type CategoryDefinition } from '../config/categories';
import { getApiLocale } from '../config/locale';

interface UseCardsOptions {
  category?: CardCategory;
  tags?: string[];
  excludeTags?: string[];
  intensity?: string[];
  unvotedOnly?: boolean;
}

export function useCards(options: UseCardsOptions = {}) {
  const { category, tags, excludeTags, intensity, unvotedOnly = true } = options;
  const { user, partner } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Serialize arrays for stable dependency comparison
  const tagsKey = tags ? tags.join(',') : '';
  const excludeTagsKey = excludeTags ? excludeTags.join(',') : '';
  const intensityKey = intensity ? intensity.join(',') : '';

  // Track if we've already fetched to prevent double-fetching
  const fetchedRef = useRef<string | null>(null);

  const fetchCards = useCallback(async () => {
    if (!user) return;

    // Create a unique key for this fetch request
    const fetchKey = `${user.id}-${partner?.id}-${category}-${tagsKey}-${excludeTagsKey}-${intensityKey}-${unvotedOnly}`;

    // Skip if we already fetched with these exact parameters
    if (fetchedRef.current === fetchKey) return;
    fetchedRef.current = fetchKey;

    setIsLoading(true);
    setError(null);
    try {
      const response = await cardsApi.getCards({
        category,
        tags: tagsKey ? tagsKey.split(',') : undefined,
        exclude_tags: excludeTagsKey ? excludeTagsKey.split(',') : undefined,
        user_id: user.id,
        partner_id: partner?.id,
        unvoted_only: unvotedOnly,
        locale: getApiLocale(),
        limit: 200,
      });
      let enabledCards = response.cards.filter((card) => card.is_enabled);
      if (intensity && intensity.length > 0) {
        enabledCards = enabledCards.filter((card) => matchesIntensity(card, intensity));
      }
      setCards(enabledCards);
      setTotal(enabledCards.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar cartas');
      fetchedRef.current = null; // Allow retry on error
    } finally {
      setIsLoading(false);
    }
  }, [user, partner, category, tagsKey, excludeTagsKey, intensityKey, unvotedOnly]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const voteOnCard = async (cardId: number, preference: PreferenceType) => {
    if (!user) return;

    try {
      await cardsApi.voteOnCard(cardId, user.id, preference);
      // Update local state
      setCards((prev) =>
        prev.map((c) =>
          c.id === cardId ? { ...c, user_preference: preference } : c
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al votar');
      throw err;
    }
  };

  return {
    cards,
    total,
    isLoading,
    error,
    refetch: fetchCards,
    voteOnCard,
  };
}

export function useLikedByBoth() {
  const { user, partner } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLikedByBoth = async () => {
      if (!user || !partner) return;

      setIsLoading(true);
      setError(null);
      try {
        const data = await cardsApi.getLikedByBoth(user.id, partner.id);
        setCards(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar cartas');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLikedByBoth();
  }, [user, partner]);

  return { cards, isLoading, error };
}

export function usePartnerVotes() {
  const { user, partner } = useAuth();
  const [data, setData] = useState<PartnerVotesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPartnerVotes = useCallback(async () => {
    if (!user || !partner) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await cardsApi.getPartnerVotesGrouped(user.id, partner.id, getApiLocale());
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar votos');
    } finally {
      setIsLoading(false);
    }
  }, [user, partner]);

  useEffect(() => {
    fetchPartnerVotes();
  }, [fetchPartnerVotes]);

  return {
    like: data?.like ?? [],
    maybe: data?.maybe ?? [],
    dislike: data?.dislike ?? [],
    neutral: data?.neutral ?? [],
    totalMutual: data?.total_mutual ?? 0,
    isLoading,
    error,
    refetch: fetchPartnerVotes,
  };
}

// Helper to check if a card matches a category filter
function cardMatchesCategory(card: Card, category: CategoryDefinition): boolean {
  const cardTags = getCardTagSlugs(card);
  const intensity = getCardIntensity(card);
  const resolvedIntensity = intensity || (card.category === 'calientes' ? 'estandar' : null);

  if (category.filter.category && card.category !== category.filter.category) {
    return false;
  }

  // Check if card has any of the required tags
  const hasTags = category.filter.tags
    ? category.filter.tags.some(tag => cardTags.includes(tag))
    : true;

  // Check if card has any of the required intensity levels
  const hasIntensity = category.filter.intensity
    ? category.filter.intensity.includes(resolvedIntensity || '')
    : true;

  // Check if card has any excluded tags
  const hasExcluded = category.filter.exclude
    ? category.filter.exclude.some(tag => cardTags.includes(tag))
    : false;

  return hasTags && hasIntensity && !hasExcluded;
}

function matchesIntensity(card: Card, intensityFilters: string[]): boolean {
  const intensity = getCardIntensity(card);
  const resolvedIntensity = intensity || (card.category === 'calientes' ? 'estandar' : null);
  if (!resolvedIntensity) return false;
  return intensityFilters.includes(resolvedIntensity);
}

function getCardTagSlugs(card: Card): string[] {
  if (card.tags_list && card.tags_list.length > 0) {
    return card.tags_list.map(t => t.slug);
  }
  if (!card.tags) return [];
  try {
    const parsed = JSON.parse(card.tags);
    return parsed.tags || [];
  } catch {
    return [];
  }
}

function getCardIntensity(card: Card): string | null {
  if (card.tags_list && card.tags_list.length > 0) {
    const intensityTag = card.tags_list.find(t => t.tag_type === 'intensity');
    if (intensityTag) return intensityTag.slug;
  }
  if (!card.tags) return null;
  try {
    const parsed = JSON.parse(card.tags);
    return parsed.intensity || null;
  } catch {
    return null;
  }
}

export function useVotedCards() {
  const { user, partner } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVotedCards = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await cardsApi.getCards({
        user_id: user.id,
        partner_id: partner?.id,
        voted_only: true,
        locale: getApiLocale(),
        limit: 200,
      });
      const enabledCards = response.cards.filter((card) => card.is_enabled);
      setCards(enabledCards);
      setTotal(enabledCards.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar cartas');
    } finally {
      setIsLoading(false);
    }
  }, [user, partner]);

  useEffect(() => {
    fetchVotedCards();
  }, [fetchVotedCards]);

  const undoVote = useCallback(async (cardId: number) => {
    if (!user) return;
    try {
      await cardsApi.deleteVote(cardId, user.id);
      setCards((prev) => prev.filter((card) => card.id !== cardId));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al deshacer voto');
      throw err;
    }
  }, [user]);

  return {
    cards,
    total,
    isLoading,
    error,
    refetch: fetchVotedCards,
    undoVote,
  };
}

export function useCategoryCounts() {
  const { user, partner } = useAuth();
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllUnvoted = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await cardsApi.getCards({
        user_id: user.id,
        partner_id: partner?.id,
        unvoted_only: true,
        locale: getApiLocale(),
        limit: 500, // Get all unvoted cards
      });
      setAllCards(response.cards.filter((card) => card.is_enabled));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar cartas');
    } finally {
      setIsLoading(false);
    }
  }, [user, partner]);

  // Fetch all unvoted cards once
  useEffect(() => {
    fetchAllUnvoted();
  }, [fetchAllUnvoted]);

  // Calculate counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const category of CATEGORIES) {
      const matchingCards = allCards.filter(card => cardMatchesCategory(card, category));
      counts[category.id] = matchingCards.length;
    }

    return counts;
  }, [allCards]);

  // Filter categories that have cards
  const categoriesWithCards = useMemo(() => {
    return CATEGORIES.filter(cat => categoryCounts[cat.id] > 0);
  }, [categoryCounts]);

  return {
    counts: categoryCounts,
    categoriesWithCards,
    totalUnvoted: allCards.length,
    isLoading,
    error,
    refetch: fetchAllUnvoted,
  };
}
