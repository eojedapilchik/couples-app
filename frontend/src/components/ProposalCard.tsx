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
} from '@mui/icons-material';
import type { Proposal, ProposalStatus } from '../api/types';
import { getCategoryColor } from '../theme/theme';

interface ProposalCardProps {
  proposal: Proposal;
  isRecipient: boolean;
  onRespond?: (proposalId: number, response: ProposalStatus, creditCost?: number) => void;
  onMarkComplete?: () => void;
  onConfirmCompletion?: () => void;
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
  onRespond,
  onMarkComplete,
  onConfirmCompletion,
}: ProposalCardProps) {
  const [acceptDialog, setAcceptDialog] = useState(false);
  const [creditCost, setCreditCost] = useState(3);

  const isProposer = !isRecipient;

  // Get display info from card or custom fields
  const displayTitle = proposal.display_title || proposal.custom_title || proposal.card?.title || 'Reto';
  const displayDescription = proposal.display_description || proposal.custom_description || proposal.card?.description;
  const isCustom = !proposal.card_id;

  const cardColors = proposal.card
    ? getCategoryColor(proposal.card.category)
    : { main: '#6B7280' }; // Gray for custom

  const canRespond = isRecipient && proposal.status === 'proposed';
  const canMarkComplete = isRecipient && proposal.status === 'accepted';
  const canConfirm = isProposer && proposal.status === 'completed_pending_confirmation';

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
                {isRecipient
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
            <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 0.5 }}>
              {isCustom ? '#reto-personalizado' : `#${proposal.card?.category}`}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              {displayTitle}
            </Typography>
            {displayDescription && (
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {displayDescription}
              </Typography>
            )}
            {proposal.credit_cost && (
              <Chip
                label={`${proposal.credit_cost} venus`}
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
        {(canRespond || canMarkComplete || canConfirm) && (
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
          </CardActions>
        )}
      </Card>

      {/* Accept Dialog - Set Venus Cost */}
      <Dialog open={acceptDialog} onClose={() => setAcceptDialog(false)}>
        <DialogTitle>Cuantos venus le costara?</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Tu decides cuantos venus le costara a {proposal.proposed_by?.name || 'tu pareja'} este reto.
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
            {creditCost} venus
          </Typography>
          <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
            Al completar, tu ganaras estos venus
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
