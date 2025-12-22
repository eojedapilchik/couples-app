import { Chip } from '@mui/material';
import VenusIcon from './VenusIcon';
import { useCredits } from '../hooks/useCredits';

export default function CreditBadge() {
  const { balance, isLoading } = useCredits();

  return (
    <Chip
      icon={<VenusIcon sx={{ color: '#e91e63' }} />}
      label={isLoading ? '...' : `${balance} Venus`}
      color="primary"
      variant="outlined"
      size="small"
      sx={{ fontWeight: 700 }}
    />
  );
}
