import { useState, useEffect, useCallback } from 'react';
import type { Period, PeriodCreate } from '../api/types';
import { periodsApi } from '../api/client';

export function usePeriods() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPeriods = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await periodsApi.getPeriods();
      setPeriods(response.periods);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar periodos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  const createPeriod = async (period: PeriodCreate) => {
    const newPeriod = await periodsApi.createPeriod(period);
    setPeriods((prev) => [newPeriod, ...prev]);
    return newPeriod;
  };

  const activatePeriod = async (periodId: number) => {
    const updated = await periodsApi.activatePeriod(periodId);
    setPeriods((prev) =>
      prev.map((p) => (p.id === periodId ? updated : p))
    );
    return updated;
  };

  const completePeriod = async (periodId: number) => {
    const updated = await periodsApi.completePeriod(periodId);
    setPeriods((prev) =>
      prev.map((p) => (p.id === periodId ? updated : p))
    );
    return updated;
  };

  return {
    periods,
    total,
    isLoading,
    error,
    refetch: fetchPeriods,
    createPeriod,
    activatePeriod,
    completePeriod,
  };
}

export function useActivePeriod() {
  const [period, setPeriod] = useState<Period | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivePeriod = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await periodsApi.getActivePeriod();
      setPeriod(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar periodo activo');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivePeriod();
  }, [fetchActivePeriod]);

  return {
    period,
    isLoading,
    error,
    refetch: fetchActivePeriod,
  };
}
