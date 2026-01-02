import { useState, useEffect, useCallback } from 'react';
import type { Proposal, ProposalStatus, ProposalCreate, ProposalUpdate } from '../api/types';
import { proposalsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function useProposals(asRecipient = true, status?: ProposalStatus) {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProposals = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await proposalsApi.getProposals({
        user_id: user.id,
        as_recipient: asRecipient,
        status,
      });
      setProposals(response.proposals);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar propuestas');
    } finally {
      setIsLoading(false);
    }
  }, [user, asRecipient, status]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const createProposal = async (proposal: ProposalCreate) => {
    if (!user) throw new Error('No user logged in');

    const newProposal = await proposalsApi.createProposal(proposal, user.id);
    setProposals((prev) => [newProposal, ...prev]);
    return newProposal;
  };

  const updateProposal = async (proposalId: number, proposal: ProposalUpdate) => {
    if (!user) throw new Error('No user logged in');

    const updated = await proposalsApi.updateProposal(proposalId, proposal, user.id);
    setProposals((prev) => prev.map((p) => (p.id === proposalId ? updated : p)));
    return updated;
  };

  const deleteProposal = async (proposalId: number) => {
    if (!user) throw new Error('No user logged in');

    await proposalsApi.deleteProposal(proposalId, user.id);
    setProposals((prev) => prev.filter((p) => p.id !== proposalId));
  };

  const respondToProposal = async (
    proposalId: number,
    response: ProposalStatus,
    creditCost?: number
  ) => {
    if (!user) throw new Error('No user logged in');

    const updated = await proposalsApi.respondToProposal(
      proposalId,
      user.id,
      response,
      creditCost
    );
    setProposals((prev) =>
      prev.map((p) => (p.id === proposalId ? updated : p))
    );
    return updated;
  };

  const markComplete = async (proposalId: number) => {
    if (!user) throw new Error('No user logged in');

    const updated = await proposalsApi.markComplete(proposalId, user.id);
    setProposals((prev) =>
      prev.map((p) => (p.id === proposalId ? updated : p))
    );
    return updated;
  };

  const confirmCompletion = async (proposalId: number) => {
    if (!user) throw new Error('No user logged in');

    const updated = await proposalsApi.confirmCompletion(proposalId, user.id);
    setProposals((prev) =>
      prev.map((p) => (p.id === proposalId ? updated : p))
    );
    return updated;
  };

  return {
    proposals,
    total,
    isLoading,
    error,
    refetch: fetchProposals,
    createProposal,
    updateProposal,
    deleteProposal,
    respondToProposal,
    markComplete,
    confirmCompletion,
  };
}
