import { useState, useEffect } from 'react';
import { tagsApi } from '../api/client';
import type { TagsGroupedResponse } from '../api/types';

export function useTags() {
  const [tagsGrouped, setTagsGrouped] = useState<TagsGroupedResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        setIsLoading(true);
        const data = await tagsApi.getTagsGrouped();
        setTagsGrouped(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading tags');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTags();
  }, []);

  return {
    categories: tagsGrouped?.categories ?? [],
    intensity: tagsGrouped?.intensity ?? [],
    subtags: tagsGrouped?.subtags ?? [],
    isLoading,
    error,
  };
}
