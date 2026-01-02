import { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
} from '@mui/material';
import {
  Check as AcceptIcon,
  Schedule as LaterIcon,
  Close as RejectIcon,
  Done as CompleteIcon,
  Verified as ConfirmIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import type { Proposal, ProposalStatus, ChallengeType, RewardType } from '../api/types';
import { getCategoryColor } from '../theme/theme';
import { STRINGS, CURRENCY_NAME } from '../config';

const challengeTypeLabels: Record<ChallengeType, { label: string; color: string }> = {
  simple: { label: 'Simple', color: '#4CAF50' },
  guided: { label: 'Guiado', color: '#9C27B0' },
  custom: { label: 'Personalizado', color: '#FF9800' },
};

const rewardTypeLabels: Record<RewardType, string> = {
  none: 'Ninguna',
  credits: CURRENCY_NAME,
  coupon: 'Cupon',
  choose_next: 'Elegir siguiente reto',
};

interface ProposalCardProps {
  proposal: Proposal;
  isRecipient: boolean;
  currentUserId?: number | null;
  onRespond?: (proposalId: number, response: ProposalStatus, creditCost?: number) => void;
  onMarkComplete?: () => void;
  onConfirmCompletion?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const statusLabels: Record<ProposalStatus, string> = {
  proposed: 'Propuesto',
  accepted: 'Aceptado',
  maybe_later: 'Quizas despues',
  rejected: 'Rechazado',
  completed_pending_confirmation: 'Pendiente confirmar',
  completed_confirmed: 'Completado',
  expired: 'Expirado',
};

const statusColors: Record<ProposalStatus, string> = {
  proposed: '#2196F3',
  accepted: '#4CAF50',
  maybe_later: '#FF9800',
  rejected: '#F44336',
  completed_pending_confirmation: '#9C27B0',
  completed_confirmed: '#4CAF50',
  expired: '#9E9E9E',
};

export default function ProposalCard({
  proposal,
  isRecipient,
  currentUserId,
  onRespond,
  onMarkComplete,
  onConfirmCompletion,
  onEdit,
  onDelete,
}: ProposalCardProps) {
  const [acceptDialog, setAcceptDialog] = useState(false);
  const [creditCost, setCreditCost] = useState(3);

  const resolvedIsRecipient = currentUserId != null
    ? proposal.proposed_to_user_id === currentUserId
    : isRecipient;
  const isProposer = currentUserId != null
    ? proposal.proposed_by_user_id === currentUserId
    : !resolvedIsRecipient;

  // Get display info from card or custom fields
  const displayTitle = proposal.display_title || proposal.custom_title || proposal.card?.title || 'Reto';
  const displayDescription = proposal.display_description || proposal.custom_description || proposal.card?.description;
  const isCustom = !proposal.card_id;

  const cardColors = proposal.card
    ? getCategoryColor(proposal.card.category)
    : { main: '#6B7280' }; // Gray for custom

  const canRespond = resolvedIsRecipient && proposal.status === 'proposed';
  const canMarkComplete = resolvedIsRecipient && proposal.status === 'accepted';
  const canConfirm = isProposer && proposal.status === 'completed_pending_confirmation';
  const canEdit = isProposer && !proposal.card_id && ['proposed', 'maybe_later'].includes(proposal.status);
  const canDelete = isProposer && ['proposed', 'maybe_later'].includes(proposal.status);

  const handleAccept = () => {
    setAcceptDialog(true);
  };

  const handleConfirmAccept = () => {
    if (onRespond) {
      onRespond(proposal.id, 'accepted', creditCost);
    }
    setAcceptDialog(false);
  };

  const handleReject = () => {
    if (onRespond) {
      onRespond(proposal.id, 'rejected');
    }
  };

  const handleMaybeLater = () => {
    if (onRespond) {
      onRespond(proposal.id, 'maybe_later');
    }
  };

  return (
    <>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          {/* Header: From/To + Status */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: cardColors.main,
                  fontSize: '0.875rem',
                }}
              >
                {isRecipient ? 'De' : 'A'}
              </Avatar>
              <Typography variant="body2" color="text.secondary">
                {resolvedIsRecipient
                  ? `De: ${proposal.proposed_by?.name || 'Pareja'}`
                  : `A: ${proposal.proposed_to?.name || 'Pareja'}`}
              </Typography>
            </Box>
            <Chip
              label={statusLabels[proposal.status]}
              size="small"
              sx={{
                bgcolor: statusColors[proposal.status],
                color: 'white',
                fontWeight: 600,
              }}
            />
          </Box>

          {/* Reto Content */}
          <Box
            sx={{
              bgcolor: cardColors.main,
              color: 'white',
              p: 2,
              borderRadius: 2,
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
              <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                {isCustom ? '#reto-personalizado' : `#${proposal.card?.category}`}
              </Typography>
              {proposal.challenge_type && proposal.challenge_type !== 'simple' && (
                <Chip
                  label={challengeTypeLabels[proposal.challenge_type].label}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.65rem',
                    bgcolor: challengeTypeLabels[proposal.challenge_type].color,
                    color: 'white',
                  }}
                />
              )}
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              {displayTitle}
            </Typography>
            {displayDescription && (
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {displayDescription}
              </Typography>
            )}

            {/* Guided/Custom: Why proposing */}
            {proposal.why_proposing && (
              <Typography variant="body2" sx={{ opacity: 0.85, mt: 1, fontStyle: 'italic' }}>
                Por que: {proposal.why_proposing}
              </Typography>
            )}

            {/* Guided: Boundary */}
            {proposal.challenge_type === 'guided' && proposal.boundary && (
              <Chip
                label={`Limite: ${proposal.boundary}`}
                size="small"
                sx={{
                  mt: 1,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'inherit',
                }}
              />
            )}

            {/* Custom: Location & Duration */}
            {proposal.challenge_type === 'custom' && (proposal.location || proposal.duration) && (
              <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {proposal.location && (
                  <Chip
                    label={`Lugar: ${proposal.location}`}
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'inherit' }}
                  />
                )}
                {proposal.duration && (
                  <Chip
                    label={`Duracion: ${proposal.duration}`}
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'inherit' }}
                  />
                )}
              </Box>
            )}

            {/* Custom: Boundaries */}
            {proposal.challenge_type === 'custom' && proposal.boundaries_json && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>Limites:</Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                  {JSON.parse(proposal.boundaries_json).map((b: string, i: number) => (
                    <Chip
                      key={i}
                      label={b}
                      size="small"
                      sx={{ fontSize: '0.65rem', height: 20, bgcolor: 'rgba(255,255,255,0.15)', color: 'inherit' }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Custom: Reward */}
            {proposal.challenge_type === 'custom' && proposal.reward_type && proposal.reward_type !== 'none' && (
              <Chip
                label={`Recompensa: ${rewardTypeLabels[proposal.reward_type] || proposal.reward_type}${
                  proposal.reward_details && proposal.reward_type === 'credits' ? ` (${proposal.reward_details})` :
                  proposal.reward_details && proposal.reward_type === 'coupon' ? ` - ${proposal.reward_details}` : ''
                }`}
                size="small"
                sx={{
                  mt: 1,
                  bgcolor: 'rgba(255,215,0,0.3)',
                  color: 'inherit',
                }}
              />
            )}

            {proposal.credit_cost && (
              <Chip
                label={STRINGS.currency.cost(proposal.credit_cost)}
                size="small"
                sx={{
                  mt: 1,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'inherit',
                }}
              />
            )}
          </Box>

          {/* Dates */}
          <Typography variant="caption" color="text.secondary">
            Propuesto: {new Date(proposal.created_at).toLocaleDateString('es')}
            {proposal.responded_at &&
              ` | Respondido: ${new Date(proposal.responded_at).toLocaleDateString('es')}`}
          </Typography>
        </CardContent>

        {/* Actions */}
        {(canRespond || canMarkComplete || canConfirm || canEdit || canDelete) && (
          <CardActions sx={{ px: 2, pb: 2 }}>
            {canRespond && onRespond && (
              <>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<AcceptIcon />}
                  onClick={handleAccept}
                >
                  Si
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  startIcon={<LaterIcon />}
                  onClick={handleMaybeLater}
                >
                  Despues
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<RejectIcon />}
                  onClick={handleReject}
                >
                  No
                </Button>
              </>
            )}
            {canMarkComplete && onMarkComplete && (
              <Button
                size="small"
                variant="contained"
                color="primary"
                startIcon={<CompleteIcon />}
                onClick={onMarkComplete}
              >
                Marcar completado
              </Button>
            )}
            {canConfirm && onConfirmCompletion && (
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<ConfirmIcon />}
                onClick={onConfirmCompletion}
              >
                Confirmar
              </Button>
            )}
            {canEdit && onEdit && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={onEdit}
              >
                Editar
              </Button>
            )}
            {canDelete && onDelete && (
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={onDelete}
              >
                Eliminar
              </Button>
            )}
          </CardActions>
        )}
      </Card>

      {/* Accept Dialog - Set Currency Cost */}
      <Dialog open={acceptDialog} onClose={() => setAcceptDialog(false)}>
        <DialogTitle>{STRINGS.currency.costQuestion}</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {STRINGS.currency.youDecideCost(proposal.proposed_by?.name || 'tu pareja')}
          </Typography>
          <Box sx={{ px: 2 }}>
            <Slider
              value={creditCost}
              onChange={(_, val) => setCreditCost(val as number)}
              min={1}
              max={7}
              step={1}
              marks={[
                { value: 1, label: '1' },
                { value: 2, label: '2' },
                { value: 3, label: '3' },
                { value: 4, label: '4' },
                { value: 5, label: '5' },
                { value: 6, label: '6' },
                { value: 7, label: '7' },
              ]}
              valueLabelDisplay="on"
            />
          </Box>
          <Typography variant="h4" textAlign="center" sx={{ mt: 2, fontWeight: 700 }}>
            {STRINGS.currency.cost(creditCost)}
          </Typography>
          <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
            {STRINGS.currency.onCompletionEarn}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAcceptDialog(false)}>Cancelar</Button>
          <Button variant="contained" color="success" onClick={handleConfirmAccept}>
            Aceptar Reto
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
