import { useState, useEffect, useCallback } from 'react';
import type { Card, CardCategory, PreferenceType } from '../api/types';
import { cardsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function useCards(category?: CardCategory, unvotedOnly: boolean = true) {
  const { user, partner } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await cardsApi.getCards({
        category,
        user_id: user.id,
        partner_id: partner?.id,
        unvoted_only: unvotedOnly,
        limit: 200,
      });
      setCards(response.cards);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar cartas');
    } finally {
      setIsLoading(false);
    }
  }, [user, partner, category, unvotedOnly]);

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
