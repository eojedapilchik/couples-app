import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Card, PreferenceType, PartnerVotesResponse } from '../api/types';
import { cardsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, type CategoryDefinition } from '../config/categories';
import { getApiLocale } from '../config/locale';

interface UseCardsOptions {
  groupingSlug?: string;
  unvotedOnly?: boolean;
}

export function useCards(options: UseCardsOptions = {}) {
  const { groupingSlug, unvotedOnly = true } = options;
  const { user, partner } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track if we've already fetched to prevent double-fetching
  const fetchedRef = useRef<string | null>(null);

  const fetchCards = useCallback(async () => {
    if (!user) return;

    // Create a unique key for this fetch request
    const fetchKey = `${user.id}-${partner?.id}-${groupingSlug}-${unvotedOnly}`;

    // Skip if we already fetched with these exact parameters
    if (fetchedRef.current === fetchKey) return;
    fetchedRef.current = fetchKey;

    setIsLoading(true);
    setError(null);
    try {
      const response = await cardsApi.getCards({
        grouping_slug: groupingSlug,
        user_id: user.id,
        partner_id: partner?.id,
        unvoted_only: unvotedOnly,
        locale: getApiLocale(),
        limit: 200,
      });
      let enabledCards = response.cards.filter((card) => card.is_enabled);
      setCards(enabledCards);
      setTotal(enabledCards.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar cartas');
      fetchedRef.current = null; // Allow retry on error
    } finally {
      setIsLoading(false);
    }
  }, [user, partner, groupingSlug, unvotedOnly]);

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
  const groupingSlug = category.filter.groupingSlug;
  if (!groupingSlug) {
    return false;
  }

  return card.groupings_list?.some((grouping) => grouping.slug === groupingSlug) ?? false;
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
