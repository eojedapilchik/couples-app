import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  Avatar,
} from '@mui/material';
import {
  Check as AcceptIcon,
  Schedule as LaterIcon,
  Close as RejectIcon,
  Done as CompleteIcon,
  Verified as ConfirmIcon,
} from '@mui/icons-material';
import type { Proposal, ProposalStatus } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { getCategoryColor } from '../theme/theme';

interface ProposalCardProps {
  proposal: Proposal;
  onRespond?: (response: ProposalStatus) => void;
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
  onRespond,
  onMarkComplete,
  onConfirmCompletion,
}: ProposalCardProps) {
  const { user } = useAuth();
  const isRecipient = user?.id === proposal.proposed_to_user_id;
  const isProposer = user?.id === proposal.proposed_by_user_id;

  const cardColors = proposal.card
    ? getCategoryColor(proposal.card.category)
    : { main: '#6B7280' };

  const canRespond = isRecipient && proposal.status === 'proposed';
  const canMarkComplete = isRecipient && proposal.status === 'accepted';
  const canConfirm = isProposer && proposal.status === 'completed_pending_confirmation';

  return (
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

        {/* Card Info */}
        {proposal.card && (
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
              #{proposal.card.category}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              {proposal.card.title}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {proposal.card.description}
            </Typography>
            <Chip
              label={`${proposal.card.credit_value} creditos`}
              size="small"
              sx={{
                mt: 1,
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'inherit',
              }}
            />
          </Box>
        )}

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
                onClick={() => onRespond('accepted')}
              >
                Si
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="warning"
                startIcon={<LaterIcon />}
                onClick={() => onRespond('maybe_later')}
              >
                Despues
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<RejectIcon />}
                onClick={() => onRespond('rejected')}
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
  );
}
