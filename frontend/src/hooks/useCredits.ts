import { useState, useEffect, useCallback } from 'react';
import type { CreditLedgerEntry } from '../api/types';
import { creditsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function useCredits() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await creditsApi.getBalance(user.id);
      setBalance(data.balance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar creditos');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    isLoading,
    error,
    refetch: fetchBalance,
  };
}

export function useCreditLedger() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<CreditLedgerEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLedger = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await creditsApi.getLedger(user.id);
      setEntries(data.entries);
      setTotal(data.total);
      setCurrentBalance(data.current_balance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar historial');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  return {
    entries,
    total,
    currentBalance,
    isLoading,
    error,
    refetch: fetchLedger,
  };
}
