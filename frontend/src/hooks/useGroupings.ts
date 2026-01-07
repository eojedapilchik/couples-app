import { useEffect, useState } from 'react';
import { groupingsApi } from '../api/client';
import type { Grouping } from '../api/types';

export function useGroupings() {
  const [groupings, setGroupings] = useState<Grouping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroupings = async () => {
      try {
        setIsLoading(true);
        const data = await groupingsApi.getGroupings();
        setGroupings(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading groupings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupings();
  }, []);

  return { groupings, isLoading, error };
}
